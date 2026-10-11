import { Capacitor } from '@capacitor/core';
import { Contacts } from '@capacitor-community/contacts';
import { normalizePhoneNumber, isContactPickerSupported, pickMobileContacts } from '../utils/contactPicker';

export interface MobileContact {
  id: string;
  name: string;
  phone: string;
  displayPhone: string;
}

// In-memory cache for fast search while typing in billing screen
let cachedContacts: MobileContact[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

/**
 * Checks whether contacts access is supported on this platform/browser
 */
export function isContactsAccessSupported(): boolean {
  if (typeof window !== 'undefined' && (window as any).AndroidNativeBridge) {
    return true;
  }
  if (Capacitor.isNativePlatform()) {
    return true;
  }
  return isContactPickerSupported();
}

/**
 * Checks the current permission state for contacts
 */
export async function checkContactsPermission(): Promise<'granted' | 'prompt' | 'denied'> {
  // 1. Android Native Bridge
  if (typeof window !== 'undefined' && (window as any).AndroidNativeBridge?.hasContactsPermission) {
    try {
      const hasPerm = (window as any).AndroidNativeBridge.hasContactsPermission();
      return hasPerm ? 'granted' : 'prompt';
    } catch (e) {
      console.warn('[Contacts] Error checking native bridge permission:', e);
    }
  }

  // 2. Capacitor Community Contacts
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await Contacts.checkPermissions();
      if (status.contacts === 'granted') return 'granted';
      if (status.contacts === 'denied') return 'denied';
      return 'prompt';
    } catch (err) {
      console.warn('[Contacts] Error checking contacts permission via plugin:', err);
      return 'prompt';
    }
  }

  // 3. Web platform
  return isContactPickerSupported() ? 'prompt' : 'denied';
}

/**
 * Requests runtime contacts permission on Android/iOS
 */
export async function requestContactsPermission(): Promise<boolean> {
  // 1. Android Native Bridge
  if (typeof window !== 'undefined' && (window as any).AndroidNativeBridge?.requestContactsPermission) {
    try {
      (window as any).AndroidNativeBridge.requestContactsPermission();
      // Wait briefly for permission prompt
      await new Promise((r) => setTimeout(r, 600));
      return (window as any).AndroidNativeBridge.hasContactsPermission();
    } catch (e) {
      console.warn('[Contacts] Error requesting native bridge permission:', e);
    }
  }

  // 2. Capacitor Community Contacts
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await Contacts.requestPermissions();
      return res.contacts === 'granted' || res.contacts === 'limited';
    } catch (err) {
      console.warn('[Contacts] Error requesting contacts permission via plugin:', err);
      return false;
    }
  }

  return isContactPickerSupported();
}

/**
 * Opens app settings on device if permission was denied with "don't ask again"
 */
export function openDeviceAppSettings(): void {
  if (typeof window !== 'undefined' && (window as any).AndroidNativeBridge?.openAppSettings) {
    (window as any).AndroidNativeBridge.openAppSettings();
  }
}

/**
 * Loads all device contacts into an optimized searchable list.
 * Caches results in memory for instantaneous search response while typing.
 */
export async function loadDeviceContacts(forceRefresh = false): Promise<MobileContact[]> {
  const now = Date.now();
  if (!forceRefresh && cachedContacts && cachedContacts.length > 0 && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedContacts;
  }

  // 1. High-Performance Direct Android Native Bridge
  if (typeof window !== 'undefined' && (window as any).AndroidNativeBridge?.getDeviceContacts) {
    try {
      const hasPerm = (window as any).AndroidNativeBridge.hasContactsPermission?.();
      if (!hasPerm) {
        (window as any).AndroidNativeBridge.requestContactsPermission?.();
      }

      const jsonStr = (window as any).AndroidNativeBridge.getDeviceContacts();
      if (jsonStr && jsonStr !== '[]') {
        const rawList = JSON.parse(jsonStr) as Array<{ id: string; name: string; phone: string; displayPhone: string }>;
        const list: MobileContact[] = rawList.map((item) => ({
          id: item.id || `c-${item.phone}`,
          name: item.name || `Contact ${item.phone}`,
          phone: item.phone,
          displayPhone: item.displayPhone || (item.phone ? `+91 ${item.phone}` : ''),
        }));

        console.log(`[ContactsPicker] Loaded ${list.length} contacts from Android native bridge`);
        cachedContacts = list;
        lastFetchTime = now;
        return list;
      }
    } catch (err) {
      console.warn('[ContactsPicker] Native bridge read failed, attempting plugin fallback:', err);
    }
  }

  // 2. Capacitor Community Contacts Plugin
  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await checkContactsPermission();
      if (perm !== 'granted') {
        const granted = await requestContactsPermission();
        if (!granted) {
          console.warn('[ContactsPicker] Contacts permission not granted by user');
          return cachedContacts || [];
        }
      }

      const result = await Contacts.getContacts({
        projection: {
          name: true,
          phones: true,
        },
      });

      const list: MobileContact[] = [];
      const seen = new Set<string>();

      for (const c of result.contacts || []) {
        let rawName = '';
        if (c.name?.display && c.name.display.trim()) {
          rawName = c.name.display.trim();
        } else if (c.name?.given) {
          rawName = [c.name.given, c.name.family].filter(Boolean).join(' ').trim();
        }

        const phoneEntry = c.phones && c.phones.length > 0 ? c.phones[0].number : '';
        const cleanPhone = normalizePhoneNumber(phoneEntry || '');

        if (!rawName && !cleanPhone) continue;

        const finalName = rawName || `Contact ${cleanPhone}`;
        const dedupKey = `${finalName.toLowerCase()}|${cleanPhone}`;
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);

        list.push({
          id: c.contactId || `dev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: finalName,
          phone: cleanPhone,
          displayPhone: cleanPhone ? `+91 ${cleanPhone}` : (phoneEntry || ''),
        });
      }

      list.sort((a, b) => a.name.localeCompare(b.name));
      console.log(`[ContactsPicker] Loaded ${list.length} contacts from Capacitor plugin`);
      cachedContacts = list;
      lastFetchTime = now;
      return list;
    } catch (err) {
      console.error('[ContactsPicker] Failed to load native device contacts:', err);
      return cachedContacts || [];
    }
  }

  // 3. Web platform fallback
  return cachedContacts || [];
}

/**
 * Launches the native / web interactive contact picker to select a single contact
 */
export async function pickSingleDeviceContact(): Promise<MobileContact | null> {
  // Web Contact Picker
  if (isContactPickerSupported()) {
    try {
      const picked = await pickMobileContacts(false);
      if (picked.length > 0) {
        const item = picked[0];
        const contact: MobileContact = {
          id: `web-pick-${Date.now()}`,
          name: item.name,
          phone: item.phone,
          displayPhone: item.phone ? `+91 ${item.phone}` : '',
        };
        if (cachedContacts) {
          cachedContacts.unshift(contact);
        }
        return contact;
      }
    } catch (err) {
      console.warn('Web contact picker error:', err);
    }
  }

  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await checkContactsPermission();
      if (perm !== 'granted') {
        const granted = await requestContactsPermission();
        if (!granted) return null;
      }

      const res = await Contacts.pickContact({
        projection: {
          name: true,
          phones: true,
        },
      });

      if (!res?.contact) return null;

      const c = res.contact;
      let rawName = '';
      if (c.name?.display && c.name.display.trim()) {
        rawName = c.name.display.trim();
      } else if (c.name?.given) {
        rawName = [c.name.given, c.name.family].filter(Boolean).join(' ').trim();
      }

      const phoneEntry = c.phones && c.phones.length > 0 ? c.phones[0].number : '';
      const cleanPhone = normalizePhoneNumber(phoneEntry || '');

      const contact: MobileContact = {
        id: c.contactId || `dev-pick-${Date.now()}`,
        name: rawName || `Contact ${cleanPhone}`,
        phone: cleanPhone,
        displayPhone: cleanPhone ? `+91 ${cleanPhone}` : (phoneEntry || ''),
      };

      if (cachedContacts) {
        if (!cachedContacts.some((x) => x.name.toLowerCase() === contact.name.toLowerCase())) {
          cachedContacts.unshift(contact);
        }
      }

      return contact;
    } catch (err: any) {
      if (err?.message?.includes('cancel') || err?.name === 'AbortError') {
        return null;
      }
      console.warn('Native pick contact error:', err);
      return null;
    }
  }

  return null;
}
