/**
 * Ledgerly Domain Models & Type Definitions
 * All monetary amounts are strictly stored as integers in PAISE (1 Rupee = 100 paise)
 * to eliminate all floating-point rounding errors.
 */

export type AccountType = 'CASH' | 'BANK';

export type TransactionType = 'IN' | 'OUT' | 'TRANSFER';

export type PaymentMode = 'CASH' | 'UPI' | 'NEFT_RTGS' | 'IMPS' | 'CHEQUE' | 'CARD';

export type PartyType = 'CUSTOMER' | 'SUPPLIER' | 'BOTH';

export type OpeningBalanceType = 'RECEIVABLE' | 'PAYABLE'; // RECEIVABLE: they owe us (You'll get); PAYABLE: we owe them (You'll give)

export type InvoiceType = 
  | 'SALE' 
  | 'PURCHASE' 
  | 'SALE_RETURN' 
  | 'PURCHASE_RETURN' 
  | 'QUOTATION' 
  | 'DELIVERY_CHALLAN';

export type InvoiceStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

export type UnitType = 'pcs' | 'kg' | 'litre' | 'box' | 'meter' | 'packet' | 'dozen';

export type StockDirection = 'IN' | 'OUT';

export type StockRefType = 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'SALE_RETURN' | 'PURCHASE_RETURN';

export type LanguageCode = 'en' | 'hi' | 'gu';

export interface Business {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  logo?: string;
  currency: 'INR';
  gstEnabled: boolean;
  gstin?: string;
  address?: string;
  financialYearStart: string; // e.g. "2026-04-01"
  language: LanguageCode;
  pinCode?: string;
  pinEnabled: boolean;
  isOnboarded: boolean;
}

export interface Account {
  id: string;
  type: AccountType;
  bankName?: string; // SBI, HDFC, ICICI, etc.
  nickname: string;
  accountNumberMasked?: string; // e.g. "•••• 4821"
  ifsc?: string;
  openingBalance: number; // in paise
  currentBalance: number; // in paise (calculated)
  isDefault?: boolean;
}

export interface Party {
  id: string;
  name: string;
  phone: string;
  type: PartyType;
  address?: string;
  gstin?: string;
  openingBalance: number; // in paise
  openingType: OpeningBalanceType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // in paise, always positive
  accountId: string; // From account or primary account
  toAccountId?: string; // For TRANSFER (e.g. Bank to Cash, Bank to Bank)
  partyId?: string; // Associated party
  mode: PaymentMode;
  category: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  note?: string;
  attachmentUrl?: string;
  invoiceId?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface Item {
  id: string;
  name: string;
  category: string;
  unit: UnitType;
  salePrice: number; // in paise
  purchasePrice: number; // in paise
  openingStock: number;
  currentStock: number;
  minStock: number; // minimum stock alert threshold
  taxPercent: number; // e.g. 0, 5, 12, 18, 28
  hsn?: string;
  barcode?: string;
  isDeleted: boolean;
}

export interface InvoiceLine {
  id: string;
  itemId: string;
  itemName: string;
  unit: UnitType;
  qty: number;
  rate: number; // in paise
  discountPercent: number;
  taxPercent: number;
  amount: number; // in paise
}

export interface Invoice {
  id: string;
  type: InvoiceType;
  number: string;
  partyId: string;
  partyName: string;
  date: string;
  dueDate: string;
  subtotal: number; // in paise
  discountTotal: number; // in paise
  taxTotal: number; // in paise
  roundOff: number; // in paise (+ or -)
  total: number; // in paise
  paidAmount: number; // in paise
  paymentMode?: PaymentMode;
  accountId?: string;
  status: InvoiceStatus;
  notes?: string;
  terms?: string;
  lines: InvoiceLine[];
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface StockMovement {
  id: string;
  itemId: string;
  qty: number;
  direction: StockDirection;
  refType: StockRefType;
  refId: string;
  reason?: string;
  date: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entity: 'TRANSACTION' | 'PARTY' | 'ACCOUNT' | 'INVOICE' | 'ITEM';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
  before?: any;
  after?: any;
  at: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  time: string;
  type: 'IN' | 'OUT' | 'INVOICE' | 'TRANSFER' | 'OPENING';
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  refId: string;
  paymentMode?: string;
  accountName?: string;
}

export type DateFilterPeriod = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_YEAR' | 'ALL' | 'CUSTOM';
