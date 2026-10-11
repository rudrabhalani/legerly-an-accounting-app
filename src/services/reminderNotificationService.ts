/**
 * Ledgerly Reminder & Local Notification Service
 * Reliable background reminders, payment follow-ups, and scheduled alerts for Android APK & Web.
 * 
 * - Handles Android 13+ POST_NOTIFICATIONS runtime permissions.
 * - Configures dedicated notification channels (Business Reminders).
 * - Schedules local device notifications that survive app backgrounding.
 * - Supports instant test notifications to verify device permissions.
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications, PermissionStatus } from '@capacitor/local-notifications';
import { Reminder } from '../types';

export type AppNotificationPermission = 'granted' | 'denied' | 'prompt';

/**
 * Generate a consistent positive 32-bit integer ID for LocalNotifications from string ID
 */
export function stringToNumericNotificationId(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash % 2147483647) || 1;
}

/**
 * Check current notification permission status
 */
export async function checkNotificationPermission(): Promise<AppNotificationPermission> {
  if (Capacitor.isNativePlatform()) {
    try {
      const status: PermissionStatus = await LocalNotifications.checkPermissions();
      if (status.display === 'granted') return 'granted';
      if (status.display === 'denied') return 'denied';
      return 'prompt';
    } catch (err) {
      console.warn('Error checking native notification permission:', err);
      return 'prompt';
    }
  }

  // Web Browser fallback
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return 'prompt';
  }

  return 'denied';
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<AppNotificationPermission> {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await LocalNotifications.requestPermissions();
      if (res.display === 'granted') return 'granted';
      if (res.display === 'denied') return 'denied';
      return 'prompt';
    } catch (err) {
      console.warn('Error requesting native notification permission:', err);
      return 'denied';
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const res = await Notification.requestPermission();
      if (res === 'granted') return 'granted';
      if (res === 'denied') return 'denied';
      return 'prompt';
    } catch (err) {
      console.warn('Error requesting web notification permission:', err);
      return 'denied';
    }
  }

  return 'denied';
}

/**
 * Ensure notification channel exists on Android 8+
 */
export async function ensureNotificationChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.createChannel({
      id: 'business_reminders',
      name: 'Business Reminders',
      description: 'Alerts for customer payment follow-ups, invoices, and cheque clearing',
      importance: 4, // High importance (sound + heads-up banner)
      visibility: 1, // Public on lockscreen
      vibration: true,
      lights: true,
      lightColor: '#4F46E5',
    });
  } catch (err) {
    console.warn('Could not register Android notification channel:', err);
  }
}

/**
 * Schedule a local notification for a reminder
 */
export async function scheduleReminderNotification(reminder: Reminder): Promise<boolean> {
  if (reminder.completed) {
    await cancelReminderNotification(reminder.id);
    return false;
  }

  const perm = await checkNotificationPermission();
  if (perm !== 'granted') {
    console.warn('Cannot schedule reminder notification: permission not granted');
    return false;
  }

  await ensureNotificationChannel();

  const numericId = stringToNumericNotificationId(reminder.id);
  const targetDate = new Date(reminder.dateTime);
  const now = new Date();

  // If time is in the past, schedule for 5 seconds from now as a catch-up alert
  const scheduleTime = targetDate.getTime() > now.getTime() ? targetDate : new Date(now.getTime() + 5000);

  const amountText = reminder.amount ? ` • ₹${(reminder.amount / 100).toLocaleString('en-IN')}` : '';
  const bodyText = (reminder.description || `Follow-up needed for ${reminder.linkedName || 'business'}`) + amountText;

  if (Capacitor.isNativePlatform()) {
    try {
      // First cancel any existing schedule with same ID to avoid duplicates
      await LocalNotifications.cancel({ notifications: [{ id: numericId }] }).catch(() => {});

      await LocalNotifications.schedule({
        notifications: [
          {
            id: numericId,
            title: reminder.title,
            body: bodyText,
            schedule: { at: scheduleTime },
            channelId: 'business_reminders',
            extra: {
              reminderId: reminder.id,
              type: reminder.type,
              linkedId: reminder.linkedId,
            },
            smallIcon: 'ic_launcher_round',
            iconColor: '#4F46E5',
          },
        ],
      });
      return true;
    } catch (err) {
      console.warn('Native notification scheduling failed:', err);
      return false;
    }
  }

  // Web Browser fallback scheduling via setTimeout if active session
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    const delay = Math.max(1000, scheduleTime.getTime() - Date.now());
    if (delay < 86400000) { // Schedule if within 24 hours
      setTimeout(() => {
        try {
          new Notification(reminder.title, {
            body: bodyText,
            icon: '/favicon.svg',
            tag: reminder.id,
          });
        } catch {
          // Ignore background notification restrictions
        }
      }, delay);
      return true;
    }
  }

  return false;
}

/**
 * Cancel a scheduled reminder notification
 */
export async function cancelReminderNotification(reminderId: string): Promise<boolean> {
  const numericId = stringToNumericNotificationId(reminderId);

  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: numericId }] });
      return true;
    } catch (err) {
      console.warn('Error cancelling local notification:', err);
      return false;
    }
  }

  return true;
}

/**
 * Trigger an immediate test notification to verify device permissions and delivery
 */
export async function sendTestNotification(): Promise<boolean> {
  const perm = await requestNotificationPermission();
  if (perm !== 'granted') {
    alert('Please enable notification permissions in your system settings to receive reminders.');
    return false;
  }

  await ensureNotificationChannel();

  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 999999,
            title: '🔔 Ledgerly Notifications Active',
            body: 'Your device is configured to receive payment follow-ups and business alerts.',
            schedule: { at: new Date(Date.now() + 1500) },
            channelId: 'business_reminders',
            smallIcon: 'ic_launcher_round',
            iconColor: '#4F46E5',
          },
        ],
      });
      return true;
    } catch (err) {
      console.warn('Test notification failed:', err);
      return false;
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('🔔 Ledgerly Notifications Active', {
        body: 'Your browser is configured to receive payment follow-ups and business alerts.',
        icon: '/favicon.svg',
      });
      return true;
    } catch (err) {
      console.warn('Web test notification error:', err);
      return false;
    }
  }

  return false;
}

/**
 * Open system app settings on Android if permission was denied
 */
export async function openSystemAppSettings(): Promise<void> {
  if (typeof window !== 'undefined') {
    alert(
      'To enable notifications on your Android device:\n\n' +
      '1. Open device Settings\n' +
      '2. Tap "Apps" → "Ledgerly"\n' +
      '3. Tap "Notifications" and switch the toggle to ON.'
    );
  }
}
