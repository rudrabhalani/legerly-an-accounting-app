/**
 * Ledgerly Centralized Document Sharing & Export Service
 * Provides production-grade document sharing, saving, and downloading across Android APK & Web.
 * 
 * - Native Android: Bridges directly to Android FileProvider via AndroidPdfSharer and Capacitor Filesystem + Share.
 * - WhatsApp Direct: Directly attaches PDF file to WhatsApp chat of customer with caption.
 * - Web / PWA: Uses Web Share API when files are supported; cleanly falls back to direct browser download.
 * - Spreadsheet Security: Prevents formula injection (=, +, -, @) on all exports.
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export type ShareMethod = 'NATIVE_SHARE_SHEET' | 'WEB_SHARE_API' | 'DOWNLOAD' | 'WHATSAPP_DIRECT';

export interface DocumentShareResult {
  success: boolean;
  method: ShareMethod;
  fileName: string;
  message: string;
  error?: string;
}

export interface ShareDocumentOptions {
  blob: Blob;
  fileName: string;
  mimeType: string;
  title: string;
  text?: string;
  dialogTitle?: string;
}

/**
 * Sanitize text to prevent formula injection in CSV / XLSX files
 */
export function sanitizeSpreadsheetValue(val: any): any {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('=') || trimmed.startsWith('+') || trimmed.startsWith('-') || trimmed.startsWith('@')) {
      return `'${val}`;
    }
  }
  return val;
}

/**
 * Sanitize an entire array of row objects for XLSX / CSV export
 */
export function sanitizeSpreadsheetRows<T extends Record<string, any>>(rows: T[]): T[] {
  return rows.map((row) => {
    const cleanRow: any = {};
    for (const key of Object.keys(row)) {
      cleanRow[key] = sanitizeSpreadsheetValue(row[key]);
    }
    return cleanRow;
  });
}

/**
 * Convert a Blob to Base64 data string (excluding the data URI header for Capacitor Filesystem)
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read document blob as base64'));
    reader.onload = () => {
      const res = reader.result as string;
      const base64Index = res.indexOf(';base64,');
      if (base64Index !== -1) {
        resolve(res.substring(base64Index + 8));
      } else {
        resolve(res);
      }
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Trigger clean browser download for a Blob
 */
export function downloadBlobInBrowser(blob: Blob, fileName: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return true;
  } catch (err) {
    console.error('Failed to trigger browser download:', err);
    return false;
  }
}

/**
 * Centralized share document function
 * Handles Android native chooser sheet and Web Share API with safe fallback.
 */
export async function shareDocument({
  blob,
  fileName,
  mimeType,
  title,
  text = '',
  dialogTitle = 'Share Document',
}: ShareDocumentOptions): Promise<DocumentShareResult> {
  // Validate input
  if (!blob || blob.size === 0) {
    return {
      success: false,
      method: 'DOWNLOAD',
      fileName,
      message: 'Cannot share an empty document.',
      error: 'Empty document blob',
    };
  }

  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

  // 1. Check Native Android Bridge (AndroidPdfSharer)
  if (typeof window !== 'undefined' && (window as any).AndroidPdfSharer?.sharePdfGeneric && mimeType === 'application/pdf') {
    try {
      const base64 = await blobToBase64(blob);
      const shared = (window as any).AndroidPdfSharer.sharePdfGeneric(base64, safeFileName, text);
      if (shared) {
        return {
          success: true,
          method: 'NATIVE_SHARE_SHEET',
          fileName: safeFileName,
          message: `Shared "${safeFileName}" via Android system share sheet.`,
        };
      }
    } catch (err: any) {
      console.warn('AndroidPdfSharer.sharePdfGeneric failed, falling back:', err);
    }
  }

  // 2. Android Native Execution (Capacitor Filesystem + Share with files: [uri])
  if (Capacitor.isNativePlatform()) {
    try {
      const base64 = await blobToBase64(blob);

      // Write file to Cache directory (exposed securely via FileProvider)
      const saved = await Filesystem.writeFile({
        path: safeFileName,
        data: base64,
        directory: Directory.Cache,
      });

      // Pass native file URI in files array so Capacitor adds Intent.EXTRA_STREAM with FileProvider
      await Share.share({
        title,
        text,
        files: [saved.uri],
        dialogTitle: dialogTitle || title,
      });

      return {
        success: true,
        method: 'NATIVE_SHARE_SHEET',
        fileName: safeFileName,
        message: `Shared "${safeFileName}" via Android system sheet.`,
      };
    } catch (err: any) {
      // User dismissed share dialog
      if (err?.message?.includes('canceled') || err?.message?.includes('dismissed') || err?.name === 'AbortError') {
        return {
          success: true,
          method: 'NATIVE_SHARE_SHEET',
          fileName: safeFileName,
          message: 'Share sheet dismissed.',
        };
      }
      console.warn('Capacitor native share sheet failed, attempting browser fallback:', err);
    }
  }

  // 3. Web Share API (Desktop/Mobile Browsers with file support)
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const fileObj = new File([blob], safeFileName, { type: mimeType, lastModified: Date.now() });
      const canShare = typeof navigator.canShare === 'function' && navigator.canShare({ files: [fileObj] });

      if (canShare) {
        await navigator.share({
          files: [fileObj],
          title,
          text,
        });
        return {
          success: true,
          method: 'WEB_SHARE_API',
          fileName: safeFileName,
          message: `Shared "${safeFileName}" via system share sheet.`,
        };
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return {
          success: true,
          method: 'WEB_SHARE_API',
          fileName: safeFileName,
          message: 'Share dialog closed.',
        };
      }
      console.warn('Web Share API error, falling back to download:', err);
    }
  }

  // 4. Fallback: Direct Download
  const downloaded = downloadBlobInBrowser(blob, safeFileName);
  if (downloaded) {
    return {
      success: true,
      method: 'DOWNLOAD',
      fileName: safeFileName,
      message: `Downloaded "${safeFileName}" to your device.`,
    };
  }

  return {
    success: false,
    method: 'DOWNLOAD',
    fileName: safeFileName,
    message: `Failed to download or share "${safeFileName}".`,
    error: 'All sharing methods failed',
  };
}

/**
 * Direct WhatsApp sharing with the real PDF file attached.
 * Uses Android native intent with package "com.whatsapp", JID extra, and FileProvider URI.
 */
export async function sharePdfToWhatsAppDirect(
  docOrBlob: jsPDF | Blob,
  fileName: string,
  rawPhoneNumber: string = '',
  captionText: string = ''
): Promise<DocumentShareResult> {
  const blob = docOrBlob instanceof Blob ? docOrBlob : docOrBlob.output('blob');
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const cleanPhone = (rawPhoneNumber || '').replace(/[^0-9]/g, '');

  // 1. Try Native Android Bridge (Direct Intent with com.whatsapp and jid extra)
  if (typeof window !== 'undefined' && (window as any).AndroidPdfSharer?.sharePdfToWhatsApp) {
    try {
      const base64 = await blobToBase64(blob);
      const success = (window as any).AndroidPdfSharer.sharePdfToWhatsApp(
        base64,
        safeFileName,
        cleanPhone,
        captionText
      );
      if (success) {
        return {
          success: true,
          method: 'WHATSAPP_DIRECT',
          fileName: safeFileName,
          message: `Sent "${safeFileName}" directly to WhatsApp.`,
        };
      }
    } catch (err: any) {
      console.warn('AndroidPdfSharer.sharePdfToWhatsApp failed, falling back:', err);
    }
  }

  // 2. Try Capacitor Native Share Sheet (with files: [saved.uri])
  if (Capacitor.isNativePlatform()) {
    try {
      const base64 = await blobToBase64(blob);
      const saved = await Filesystem.writeFile({
        path: safeFileName,
        data: base64,
        directory: Directory.Cache,
      });

      await Share.share({
        title: safeFileName,
        text: captionText,
        files: [saved.uri],
        dialogTitle: 'Share Invoice PDF on WhatsApp',
      });

      return {
        success: true,
        method: 'WHATSAPP_DIRECT',
        fileName: safeFileName,
        message: `Opened share sheet for "${safeFileName}".`,
      };
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.message?.includes('canceled')) {
        return {
          success: true,
          method: 'WHATSAPP_DIRECT',
          fileName: safeFileName,
          message: 'Share dismissed.',
        };
      }
      console.warn('Capacitor share failed in WhatsApp direct, trying web fallback:', err);
    }
  }

  // 3. Web Share API with files
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const fileObj = new File([blob], safeFileName, { type: 'application/pdf', lastModified: Date.now() });
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [fileObj] })) {
        await navigator.share({
          files: [fileObj],
          title: safeFileName,
          text: captionText,
        });
        return {
          success: true,
          method: 'WEB_SHARE_API',
          fileName: safeFileName,
          message: `Shared "${safeFileName}" via system share.`,
        };
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return {
          success: true,
          method: 'WEB_SHARE_API',
          fileName: safeFileName,
          message: 'Share dialog closed.',
        };
      }
    }
  }

  // 4. Web Browser Fallback: Download file and open WhatsApp chat
  downloadBlobInBrowser(blob, safeFileName);
  const waUrl = cleanPhone
    ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(captionText)}`
    : `https://wa.me/?text=${encodeURIComponent(captionText)}`;
  if (typeof window !== 'undefined') {
    window.open(waUrl, '_blank');
  }

  return {
    success: true,
    method: 'DOWNLOAD',
    fileName: safeFileName,
    message: `Downloaded "${safeFileName}" and opened WhatsApp.`,
  };
}

/**
 * Share a generated jsPDF document via system chooser
 */
export async function sharePdfDocument(
  doc: jsPDF,
  fileName: string,
  title: string,
  captionText: string = ''
): Promise<DocumentShareResult> {
  const blob = doc.output('blob');
  return shareDocument({
    blob,
    fileName,
    mimeType: 'application/pdf',
    title,
    text: captionText,
    dialogTitle: title,
  });
}

/**
 * Download a generated jsPDF document
 */
export function downloadPdfDocument(doc: jsPDF, fileName: string): boolean {
  try {
    doc.save(fileName);
    return true;
  } catch (err) {
    const blob = doc.output('blob');
    return downloadBlobInBrowser(blob, fileName);
  }
}

/**
 * Share an XLSX Workbook
 */
export async function shareWorkbook(
  workbook: XLSX.WorkBook,
  fileName: string,
  title: string,
  captionText: string = ''
): Promise<DocumentShareResult> {
  const wbOut = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbOut], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  return shareDocument({
    blob,
    fileName,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    title,
    text: captionText,
    dialogTitle: title,
  });
}

/**
 * Download an XLSX Workbook
 */
export function downloadWorkbook(workbook: XLSX.WorkBook, fileName: string): boolean {
  try {
    XLSX.writeFile(workbook, fileName);
    return true;
  } catch (err) {
    const wbOut = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbOut], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    return downloadBlobInBrowser(blob, fileName);
  }
}
