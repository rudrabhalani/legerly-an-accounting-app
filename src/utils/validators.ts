/**
 * Indian Accounting & Tax Validators
 * Enforces GSTIN, PAN, Phone, and IFSC format standards as mandated by Indian business rules.
 */

import { INDIAN_STATES } from '../data/indianStates';

/**
 * GSTIN Format: 15 alphanumeric characters
 * Structure: 2 digits (state) + 5 letters (PAN) + 4 digits (PAN) + 1 letter (PAN) + 1 entity code + 1 'Z' + 1 checksum
 * Regex: ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$
 */
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function isValidGSTIN(gstin: string): boolean {
  if (!gstin) return false;
  const clean = gstin.trim().toUpperCase();
  if (clean.length !== 15) return false;
  return GSTIN_REGEX.test(clean);
}

/**
 * Extracts the 2-digit state code from GSTIN and returns the state object if found
 */
export function getStateFromGSTIN(gstin: string) {
  if (!gstin || gstin.trim().length < 2) return null;
  const stateCode = gstin.trim().substring(0, 2);
  const found = INDIAN_STATES.find((s) => s.code === stateCode);
  return found || null;
}

/**
 * PAN Format: 10 characters: 5 letters + 4 digits + 1 letter
 * Example: ABCDE1234F
 */
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export function isValidPAN(pan: string): boolean {
  if (!pan) return false;
  const clean = pan.trim().toUpperCase();
  return PAN_REGEX.test(clean);
}

/**
 * Auto-extract PAN from GSTIN (characters 3 to 12)
 */
export function extractPanFromGSTIN(gstin: string): string {
  if (!gstin || gstin.trim().length < 12) return '';
  const clean = gstin.trim().toUpperCase();
  const panPart = clean.substring(2, 12);
  return isValidPAN(panPart) ? panPart : '';
}

/**
 * Indian Mobile Phone: 10 digits starting with 6, 7, 8, or 9
 */
export const PHONE_REGEX = /^[6-9]\d{9}$/;

export function isValidIndianPhone(phone: string): boolean {
  if (!phone) return false;
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return PHONE_REGEX.test(clean);
  }
  // If formatted with +91 or 91
  if (clean.length === 12 && clean.startsWith('91')) {
    return PHONE_REGEX.test(clean.substring(2));
  }
  return false;
}

/**
 * IFSC Code Format: 4 letters (bank) + 0 + 6 alphanumeric (branch)
 * Example: SBIN0001234, HDFC0000123
 */
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export function isValidIFSC(ifsc: string): boolean {
  if (!ifsc) return false;
  const clean = ifsc.trim().toUpperCase();
  return IFSC_REGEX.test(clean);
}

/**
 * E-way Bill Number: 12-digit numeric identifier
 */
export function isValidEwayBill(ewayBill: string): boolean {
  if (!ewayBill) return false;
  const clean = ewayBill.trim();
  return /^\d{12}$/.test(clean);
}
