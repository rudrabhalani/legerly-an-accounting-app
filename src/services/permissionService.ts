/**
 * Ledgerly Centralized Permission Service
 * Unified inspection and request handling for Android runtime permissions & Web APIs.
 */

import { Capacitor } from '@capacitor/core';
import {
  checkNotificationPermission,
  requestNotificationPermission,
  openSystemAppSettings,
  AppNotificationPermission,
} from './reminderNotificationService';

export interface PermissionStatusSummary {
  notifications: AppNotificationPermission;
  documentsAndStorage: 'granted' | 'not_applicable';
  camera: 'granted' | 'prompt' | 'denied';
  platform: 'android' | 'web';
}

/**
 * Get comprehensive permission status across the application
 */
export async function getAppPermissionSummary(): Promise<PermissionStatusSummary> {
  const notifications = await checkNotificationPermission();
  const isAndroid = Capacitor.isNativePlatform();

  return {
    notifications,
    documentsAndStorage: 'granted', // App-private sandbox with FileProvider requires 0 runtime permissions
    camera: 'prompt',
    platform: isAndroid ? 'android' : 'web',
  };
}

/**
 * Request notification permission with context explanation
 */
export async function requestAppNotifications(): Promise<AppNotificationPermission> {
  return requestNotificationPermission();
}

/**
 * Open device system settings
 */
export { openSystemAppSettings };
