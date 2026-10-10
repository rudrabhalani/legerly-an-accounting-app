/**
 * Default Initial Clean State — Vyapar-grade seed data
 * Includes default tax rates, units, item categories, expense categories,
 * and party groups preloaded on every fresh installation.
 */

import {
  Business,
  Account,
  Party,
  Item,
  Transaction,
  Invoice,
  StockMovement,
  AppUser,
  Expense,
  TaxRate,
  Unit,
  ItemCategory,
  ExpenseCategory,
  OtherIncomeCategory,
  PartyGroup,
  FirmSettings,
} from '../types';

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
  isOnboarded: false,
};

export const INITIAL_ACCOUNTS: Account[] = [];
export const INITIAL_PARTIES: Party[] = [];
export const INITIAL_ITEMS: Item[] = [];
export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_INVOICES: Invoice[] = [];
export const INITIAL_EXPENSES: Expense[] = [];
export const INITIAL_USERS: AppUser[] = [];

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT TAX RATES (Indian GST slabs — 0%, 5%, 12%, 18%, 28%)
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_TAX_RATES: TaxRate[] = [
  {
    id: 'tax-gst-0',
    name: 'GST 0%',
    rate: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    isDefault: false,
    isDeleted: false,
  },
  {
    id: 'tax-gst-3',
    name: 'GST 3%',
    rate: 3,
    cgst: 1.5,
    sgst: 1.5,
    igst: 3,
    isDefault: false,
    isDeleted: false,
  },
  {
    id: 'tax-gst-5',
    name: 'GST 5%',
    rate: 5,
    cgst: 2.5,
    sgst: 2.5,
    igst: 5,
    isDefault: false,
    isDeleted: false,
  },
  {
    id: 'tax-gst-12',
    name: 'GST 12%',
    rate: 12,
    cgst: 6,
    sgst: 6,
    igst: 12,
    isDefault: false,
    isDeleted: false,
  },
  {
    id: 'tax-gst-18',
    name: 'GST 18%',
    rate: 18,
    cgst: 9,
    sgst: 9,
    igst: 18,
    isDefault: true,
    isDeleted: false,
  },
  {
    id: 'tax-gst-28',
    name: 'GST 28%',
    rate: 28,
    cgst: 14,
    sgst: 14,
    igst: 28,
    isDefault: false,
    isDeleted: false,
  },
  {
    id: 'tax-exempt',
    name: 'Exempt',
    rate: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    isDefault: false,
    isDeleted: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT UNITS
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_UNITS: Unit[] = [
  { id: 'unit-pcs',    name: 'Pieces',      abbreviation: 'Pcs',   isBaseUnit: true,  isDeleted: false },
  { id: 'unit-nos',    name: 'Numbers',     abbreviation: 'Nos',   isBaseUnit: true,  isDeleted: false },
  { id: 'unit-kg',     name: 'Kilograms',   abbreviation: 'Kg',    isBaseUnit: true,  isDeleted: false },
  { id: 'unit-g',      name: 'Grams',       abbreviation: 'g',     isBaseUnit: false, isDeleted: false },
  { id: 'unit-ltr',    name: 'Litres',      abbreviation: 'L',     isBaseUnit: true,  isDeleted: false },
  { id: 'unit-ml',     name: 'Millilitres', abbreviation: 'mL',    isBaseUnit: false, isDeleted: false },
  { id: 'unit-mtr',    name: 'Metres',      abbreviation: 'm',     isBaseUnit: true,  isDeleted: false },
  { id: 'unit-cm',     name: 'Centimetres', abbreviation: 'cm',    isBaseUnit: false, isDeleted: false },
  { id: 'unit-doz',    name: 'Dozens',      abbreviation: 'Doz',   isBaseUnit: true,  isDeleted: false },
  { id: 'unit-box',    name: 'Boxes',       abbreviation: 'Box',   isBaseUnit: true,  isDeleted: false },
  { id: 'unit-bag',    name: 'Bags',        abbreviation: 'Bag',   isBaseUnit: true,  isDeleted: false },
  { id: 'unit-pkt',    name: 'Packets',     abbreviation: 'Pkt',   isBaseUnit: true,  isDeleted: false },
  { id: 'unit-pair',   name: 'Pairs',       abbreviation: 'Pair',  isBaseUnit: true,  isDeleted: false },
  { id: 'unit-set',    name: 'Sets',        abbreviation: 'Set',   isBaseUnit: true,  isDeleted: false },
  { id: 'unit-sqft',   name: 'Sq. Feet',    abbreviation: 'Sq.Ft', isBaseUnit: true,  isDeleted: false },
  { id: 'unit-hour',   name: 'Hours',       abbreviation: 'Hr',    isBaseUnit: true,  isDeleted: false },
  { id: 'unit-day',    name: 'Days',        abbreviation: 'Day',   isBaseUnit: true,  isDeleted: false },
  { id: 'unit-month',  name: 'Months',      abbreviation: 'Mon',   isBaseUnit: false, isDeleted: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT ITEM CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_ITEM_CATEGORIES: ItemCategory[] = [
  { id: 'cat-electronics',   name: 'Electronics',        isDeleted: false },
  { id: 'cat-clothing',      name: 'Clothing & Apparel', isDeleted: false },
  { id: 'cat-food',          name: 'Food & Beverages',   isDeleted: false },
  { id: 'cat-stationery',    name: 'Stationery',         isDeleted: false },
  { id: 'cat-medical',       name: 'Medical & Pharma',   isDeleted: false },
  { id: 'cat-furniture',     name: 'Furniture',          isDeleted: false },
  { id: 'cat-hardware',      name: 'Hardware & Tools',   isDeleted: false },
  { id: 'cat-services',      name: 'Services',           isDeleted: false },
  { id: 'cat-raw-materials', name: 'Raw Materials',      isDeleted: false },
  { id: 'cat-general',       name: 'General',            isDeleted: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT EXPENSE CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'exp-rent',       name: 'Rent',                    isDeleted: false },
  { id: 'exp-electricity',name: 'Electricity & Utilities', isDeleted: false },
  { id: 'exp-salaries',   name: 'Salaries & Wages',        isDeleted: false },
  { id: 'exp-transport',  name: 'Transport & Delivery',    isDeleted: false },
  { id: 'exp-packaging',  name: 'Packaging',               isDeleted: false },
  { id: 'exp-marketing',  name: 'Marketing & Advertising', isDeleted: false },
  { id: 'exp-maintenance',name: 'Maintenance & Repairs',   isDeleted: false },
  { id: 'exp-telecom',    name: 'Telephone & Internet',    isDeleted: false },
  { id: 'exp-bank',       name: 'Bank Charges',            isDeleted: false },
  { id: 'exp-misc',       name: 'Miscellaneous',           isDeleted: false },
  { id: 'exp-purchase',   name: 'Purchase / Procurement',  isDeleted: false },
  { id: 'exp-tax',        name: 'Taxes & Duties',          isDeleted: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT OTHER INCOME CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_OTHER_INCOME_CATEGORIES: OtherIncomeCategory[] = [
  { id: 'inc-interest',   name: 'Interest Received',  isDeleted: false },
  { id: 'inc-commission', name: 'Commission Received', isDeleted: false },
  { id: 'inc-discount',   name: 'Discount Received',   isDeleted: false },
  { id: 'inc-rental',     name: 'Rental Income',       isDeleted: false },
  { id: 'inc-misc',       name: 'Miscellaneous Income',isDeleted: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT PARTY GROUPS
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_PARTY_GROUPS: PartyGroup[] = [
  { id: 'grp-retail',     name: 'Retail',     description: 'Retail customers', isDeleted: false },
  { id: 'grp-wholesale',  name: 'Wholesale',  description: 'Wholesale buyers',  isDeleted: false },
  { id: 'grp-vip',        name: 'VIP',        description: 'Premium customers', isDeleted: false },
  { id: 'grp-supplier',   name: 'Supplier',   description: 'Suppliers & vendors', isDeleted: false },
  { id: 'grp-distributor',name: 'Distributor',description: 'Distributors',     isDeleted: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT FIRM SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_FIRM_SETTINGS: FirmSettings = {
  // Invoice numbering — separate prefix per type
  salePrefix: 'INV',
  saleCurrentNumber: 1,
  purchasePrefix: 'PUR',
  purchaseCurrentNumber: 1,
  estimatePrefix: 'EST',
  estimateCurrentNumber: 1,
  saleOrderPrefix: 'SO',
  saleOrderCurrentNumber: 1,
  deliveryChallanPrefix: 'DC',
  deliveryChallanCurrentNumber: 1,
  purchaseOrderPrefix: 'PO',
  purchaseOrderCurrentNumber: 1,
  saleReturnPrefix: 'CR',
  saleReturnCurrentNumber: 1,
  purchaseReturnPrefix: 'DR',
  purchaseReturnCurrentNumber: 1,

  // Tax
  taxInclusive: false,
  defaultTaxRateId: 'tax-gst-18',

  // Invoice appearance & behaviour
  defaultInvoiceTheme: 'CLASSIC',
  defaultPaymentTerms: 'IMMEDIATE',
  showProfit: false,
  enableFreeQty: false,
  enableAdditionalCharges: true,
  enableTransactionDiscount: true,
  enableEwayBill: false,
  enableReverseCharge: false,

  // Sharing
  autoShareWhatsApp: false,
  shareFormat: 'PDF',

  // Reminders
  enablePaymentReminders: true,
  reminderDaysAfterDue: 1,
  reminderMessageTemplate:
    'Dear {party_name}, your payment of ₹{amount} for Bill #{bill_no} from {firm_name} is due on {due_date}. Please pay at your earliest convenience. Thank you!',
};
