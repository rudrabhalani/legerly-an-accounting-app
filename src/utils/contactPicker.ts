/**
 * Mobile Web Contact Picker Helper
 * Uses the Web Contacts Manager API ('contacts' in navigator) to access
 * phone contacts on supported mobile devices (Chrome on Android / PWA).
 */

export interface PickedContact {
  name: string;
  phone: string;
}

/**
 * Checks whether the Contact Picker API is supported in the current browser/device.
 */
export function isContactPickerSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'contacts' in navigator &&
    'ContactsManager' in window
  );
}

/**
 * Normalizes Indian phone numbers to clean 10-digit format
 */
export function normalizePhoneNumber(raw: string): string {
  if (!raw) return '';
  // Strip non-numeric characters
  const digits = raw.replace(/\D/g, '');
  // If starts with 91 and has 12 digits, strip country code
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  // If starts with 0 and has 11 digits, strip leading zero
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  // Return last 10 digits if longer, or as-is
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Launches the native mobile contacts picker dialog
 */
export async function pickMobileContacts(multiple: boolean = true): Promise<PickedContact[]> {
  if (!isContactPickerSupported()) {
    return [];
  }

  try {
    const props = ['name', 'tel'];
    const opts = { multiple };
    const contacts = await (navigator as any).contacts.select(props, opts);

    if (!contacts || !Array.isArray(contacts)) {
      return [];
    }

    const results: PickedContact[] = [];

    for (const item of contacts) {
      let name = '';
      if (Array.isArray(item.name) && item.name.length > 0) {
        name = item.name[0];
      } else if (typeof item.name === 'string') {
        name = item.name;
      }

      let phone = '';
      if (Array.isArray(item.tel) && item.tel.length > 0) {
        phone = normalizePhoneNumber(item.tel[0]);
      } else if (typeof item.tel === 'string') {
        phone = normalizePhoneNumber(item.tel);
      }

      if (name.trim() || phone.trim()) {
        results.push({
          name: name.trim() || `Contact ${phone}`,
          phone: phone.trim(),
        });
      }
    }

    return results;
  } catch (err: any) {
    // User cancelled or browser rejected
    if (err?.name !== 'AbortError') {
      console.warn('Contact picker interaction cancelled or unsupported:', err);
    }
    return [];
  }
}
