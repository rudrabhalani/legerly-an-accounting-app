/**
 * Default Initial Clean State
 * Demo data has been removed so first-time users complete real onboarding.
 */

import { Business, Account, Party, Item, Transaction, Invoice, StockMovement, AppUser } from '../types';

export const INITIAL_BUSINESS: Business = {
  id: 'biz-default',
  name: '',
  ownerName: '',
  ownerPhone: '',
  phone: '',
  currency: 'INR',
  gstEnabled: false,
  financialYearStart: '2026-04-01',
  language: 'en',
  pinEnabled: false,
  isOnboarded: false, // Must be false for first-time onboarding!
};

export const INITIAL_ACCOUNTS: Account[] = [];

export const INITIAL_PARTIES: Party[] = [];

export const INITIAL_ITEMS: Item[] = [];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_INVOICES: Invoice[] = [];

export const INITIAL_USERS: AppUser[] = [];
