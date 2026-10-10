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
  | 'QUOTATION'        // Estimate / Quotation
  | 'SALE_ORDER'       // Sale Order (converts to invoice or challan)
  | 'PURCHASE_ORDER'   // Purchase Order (converts to purchase bill)
  | 'DELIVERY_CHALLAN'; // Delivery Challan (no tax, converts to invoice)

export type InvoiceStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

export type UnitType = 'pcs' | 'kg' | 'g' | 'litre' | 'ml' | 'box' | 'meter' | 'packet' | 'dozen' | 'hour' | 'day' | string;

export type StockDirection = 'IN' | 'OUT';

export type StockRefType = 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'SALE_RETURN' | 'PURCHASE_RETURN' | 'PURCHASE_ORDER' | 'SALE_ORDER';


export type LanguageCode = 'en' | 'hi' | 'gu';

export type UserRole = 'OWNER' | 'MANAGER' | 'STAFF' | 'VIEWER';

export interface AppUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  isVerified: boolean;
  addedAt: string;
  isDeviceOwner?: boolean;
}

export interface Business {
  id: string;
  name: string;
  ownerName: string;
  ownerPhone: string;
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
  bankName?: string; // State Bank of India (SBI), HDFC Bank, etc.
  bankCode?: string; // SBI, HDFC, ICICI, etc.
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
  email?: string;
  type: PartyType;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPincode?: string;
  gstin?: string;
  pan?: string;
  openingBalance: number; // in paise
  openingType: OpeningBalanceType;
  creditLimit?: number; // in paise — 0 means unlimited
  creditDays?: number;  // e.g. 30 = Net-30 terms
  groupId?: string;     // reference to PartyGroup.id
  loyaltyPoints?: number;
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
  description?: string;
  category: string;          // free-form label or ItemCategory name
  categoryId?: string;       // reference to ItemCategory.id
  itemType?: 'PRODUCT' | 'SERVICE';
  unit: UnitType;
  unitId?: string;           // reference to Unit.id
  secondaryUnit?: UnitType;
  conversionFactor?: number; // e.g. 1 Dozen = 12 Pcs
  salePrice: number; // in paise
  purchasePrice: number; // in paise
  mrp?: number; // in paise — Maximum Retail Price
  openingStock: number;
  currentStock: number;
  minStock: number; // minimum stock alert threshold
  taxPercent: number; // e.g. 0, 5, 12, 18, 28
  taxRateId?: string; // reference to TaxRate.id
  hsn?: string;      // HSN/SAC code
  barcode?: string;
  batchEnabled?: boolean;
  serialEnabled?: boolean;
  trackInventory?: boolean;
  imageUrl?: string;
  isDeleted: boolean;
}


export type DiscountType = 'PERCENT' | 'FLAT';
export type InvoicePaymentType = 'CASH' | 'BANK' | 'UPI' | 'CHEQUE' | 'CREDIT';

export interface InvoiceLine {
  id: string;
  itemId: string;
  itemName: string;
  itemType?: 'PRODUCT' | 'SERVICE';
  unit: UnitType;
  qty: number;
  freeQty?: number;         // free quantity (doesn't affect amount)
  rate: number; // in paise
  mrp?: number; // in paise — MRP per unit (for display)
  discountPercent: number;
  discountType?: DiscountType;
  discountAmount?: number; // in paise
  taxPercent: number; // e.g. 0, 0.25, 3, 5, 12, 18, 28
  taxIncluded?: boolean; // Rate includes GST vs Rate excludes GST
  taxableAmount?: number; // in paise
  cgst?: number; // in paise
  sgst?: number; // in paise
  igst?: number; // in paise
  cess?: number; // in paise (additional cess)
  cessRate?: number;
  amount: number; // in paise
  hsn?: string;
  batchId?: string;         // for batch-enabled items
  serialNumbers?: string[]; // for serial-enabled items
}

export interface Invoice {
  id: string;
  type: InvoiceType;
  number: string;
  partyId: string;
  partyName: string;
  date: string;
  dueDate: string;
  paymentTerms?: PaymentTerms;   // e.g. NET_30
  financialYear?: string; // e.g. "2026-27"
  withGst?: boolean;
  stateOfSupply?: string; // e.g. "24 - Gujarat"
  placeOfSupply?: string; // same or different from stateOfSupply
  subtotal: number; // in paise
  discountTotal: number; // in paise
  transactionDiscount?: number;  // flat discount on the entire transaction (paise)
  transactionDiscountPercent?: number;
  taxableAmount?: number; // in paise
  taxTotal: number; // in paise
  cgstTotal?: number; // in paise
  sgstTotal?: number; // in paise
  igstTotal?: number; // in paise
  cessTotal?: number; // in paise
  extraCharges?: number; // in paise — additional charges (shipping, packaging)
  additionalChargesData?: AdditionalCharge[]; // detailed additional charges rows
  roundOff: number; // in paise (+ or -)
  total: number; // in paise
  paidAmount: number; // in paise
  paymentType?: InvoicePaymentType;
  paymentMode?: PaymentMode;
  accountId?: string;
  chequeNumber?: string;
  chequeDate?: string;
  paymentReference?: string; // UTR, UPI ref, etc.
  status: InvoiceStatus;
  notes?: string;
  terms?: string;
  lines: InvoiceLine[];
  theme?: InvoiceTheme;          // invoice display theme
  ewayBillNumber?: string;
  vehicleNumber?: string;
  transporterName?: string;
  sourceInvoiceId?: string;      // for returns — link to original invoice
  salespersonId?: string;        // for multi-user tracking
  estimateStatus?: EstimateStatus;
  saleOrderStatus?: SaleOrderStatus;
  isReverseCharge?: boolean;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}


export interface Expense {
  id: string;
  category: string;
  amount: number; // in paise
  mode: PaymentMode;
  accountId: string;
  date: string;
  note?: string;
  financialYear?: string;
  createdAt: string;
  updatedAt?: string;
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
  entity: 'TRANSACTION' | 'PARTY' | 'ACCOUNT' | 'INVOICE' | 'ITEM' | 'USER' | 'EXPENSE' | 'FINANCIAL_YEAR';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
  userId?: string;
  userRole?: UserRole;
  userName?: string;
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

export interface BankStatementRow {
  date: string;
  description: string;
  debit: number; // paise
  credit: number; // paise
}

export type DateFilterPeriod = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_YEAR' | 'ALL' | 'CUSTOM';

export type PaperSize = 'A4' | 'A5' | '58mm' | '80mm';
export type PageOrientation = 'portrait' | 'landscape';
export type PrinterType = 'BROWSER' | 'BLUETOOTH' | 'USB';
export type ShareFormat = 'PDF' | 'IMAGE' | 'LINK';

export interface PrintSettings {
  paperSize: PaperSize;
  orientation: PageOrientation;
  margins: number; // in mm (e.g. 5, 10, 15)
  shopLogo?: string;
  shopName: string;
  address: string;
  phone: string;
  gstin?: string;
  headerText: string;
  footerText: string;
  showTax: boolean;
  showDiscount: boolean;
  showHsn: boolean;
  showQr: boolean;
  showSignature: boolean;
  showBalanceDue: boolean;
  fontSize: 'small' | 'medium' | 'large';
  copies: number;
  language: LanguageCode;
  printerType: PrinterType;
  selectedPrinterName?: string;
  messageTemplate: string;
}

export interface DayBookEntry {
  id: string;
  time: string;
  date: string;
  type: 'SALE' | 'PURCHASE' | 'PAYMENT_IN' | 'PAYMENT_OUT' | 'EXPENSE' | 'TRANSFER';
  refNumber: string;
  partyName: string;
  partyId?: string;
  mode: string;
  inflow: number; // in paise
  outflow: number; // in paise
  net: number; // in paise
  originalTransactionId?: string;
  originalInvoiceId?: string;
}

export interface BalanceSheetData {
  asOnDate: string;
  assets: {
    cashInHand: number;
    bankBalances: { accountId: string; bankName: string; balance: number }[];
    totalBank: number;
    sundryDebtors: number; // Customer receivables
    closingStockValue: number;
    totalAssets: number;
  };
  liabilities: {
    sundryCreditors: number; // Supplier payables
    capitalAndReserves: number;
    netProfitCarriedIn: number;
    totalLiabilities: number;
  };
  isBalanced: boolean;
  difference: number;
}

export interface BillWisePnlRow {
  invoiceId: string;
  billNumber: string;
  date: string;
  customerName: string;
  customerId: string;
  saleAmount: number; // paise
  costAmount: number; // paise
  profitAmount: number; // paise (sale - cost)
  marginPercent: number; // percentage
  status: InvoiceStatus;
}

// ─────────────────────────────────────────────────────────────
// VYAPAR-GRADE ADDITIONS
// ─────────────────────────────────────────────────────────────

export type InvoiceTheme = 'CLASSIC' | 'MODERN' | 'MINIMAL' | 'THERMAL' | 'PROFESSIONAL';

export type EstimateStatus = 'OPEN' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
export type SaleOrderStatus = 'OPEN' | 'PROCESSING' | 'DISPATCHED' | 'CLOSED';
export type DeliveryChallanStatus = 'OPEN' | 'CONVERTED' | 'CANCELLED';
export type PurchaseOrderStatus = 'OPEN' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED';
export type ChequeType = 'RECEIVED' | 'ISSUED';
export type ChequeStatus = 'OPEN' | 'DEPOSITED' | 'BOUNCED' | 'CANCELLED';

/** Pre-defined payment terms for due date auto-calculation */
export type PaymentTerms = 
  | 'IMMEDIATE'     // Due on bill date
  | 'NET_15'        // 15 days
  | 'NET_30'        // 30 days
  | 'NET_45'        // 45 days
  | 'NET_60'        // 60 days
  | 'NET_90'        // 90 days
  | 'CUSTOM';       // user picks date manually

export interface TaxRate {
  id: string;
  name: string; // e.g. "GST 18%"
  rate: number; // Total rate e.g. 18
  cgst: number; // e.g. 9
  sgst: number; // e.g. 9
  igst: number; // e.g. 18
  cess?: number; // Additional cess %
  isDefault?: boolean;
  isDeleted: boolean;
}

export interface ItemCategory {
  id: string;
  name: string;
  parentId?: string; // For sub-categories
  isDeleted: boolean;
}

export interface Unit {
  id: string;
  name: string;
  abbreviation: string; // e.g. "Pcs", "Kg"
  isBaseUnit: boolean;
  isDeleted: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  isDeleted: boolean;
}

export interface OtherIncomeCategory {
  id: string;
  name: string;
  description?: string;
  isDeleted: boolean;
}

export interface PartyGroup {
  id: string;
  name: string;         // e.g. "VIP", "Wholesale", "Retail"
  description?: string;
  isDeleted: boolean;
}

/** Additional charges row on an invoice (shipping, packaging, etc.) */
export interface AdditionalCharge {
  id: string;
  name: string;      // e.g. "Shipping", "Packing"
  amount: number;    // in paise
  taxRate?: number;  // optional tax on this charge
  isTaxable?: boolean;
}

/** 
 * Cheque management — received from customer or issued to supplier 
 */
export interface Cheque {
  id: string;
  type: ChequeType;
  partyId: string;
  partyName: string;
  chequeNumber: string;
  bankName: string;
  chequeDate: string;  // YYYY-MM-DD (date on cheque)
  amount: number;      // in paise
  status: ChequeStatus;
  transactionId?: string; // linked payment transaction
  notes?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

/** Loan accounts tracking */
export interface LoanAccount {
  id: string;
  lenderName: string;
  loanAmount: number;     // in paise
  outstandingAmount: number; // in paise (current balance)
  interestRate: number;   // % per annum
  emiAmount?: number;     // in paise
  startDate: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
  isDeleted: boolean;
}

/** Ageing report row */
export interface AgeingRow {
  partyId: string;
  partyName: string;
  phone: string;
  type: 'RECEIVABLE' | 'PAYABLE';
  current: number;        // 0-30 days (paise)
  days31to60: number;     // 31-60 days (paise)
  days61to90: number;     // 61-90 days (paise)
  days91plus: number;     // 91+ days (paise)
  total: number;          // total outstanding (paise)
}

/** Item batch for perishable / pharmaceutical inventory */
export interface ItemBatch {
  id: string;
  itemId: string;
  batchNumber: string;
  manufacturingDate?: string;
  expiryDate?: string;
  mrp?: number;           // in paise
  openingQty: number;
  currentQty: number;
  createdAt: string;
  isDeleted: boolean;
}

/** Settings for auto-numbering per invoice type */
export interface InvoiceNumberSettings {
  prefix: string;         // e.g. "INV", "PUR", "EST"
  currentNumber: number;  // e.g. 1001
  padding: number;        // e.g. 4 → "0001"
}

export interface FirmSettings {
  // Invoice numbering per type
  salePrefix: string;
  saleCurrentNumber: number;
  purchasePrefix: string;
  purchaseCurrentNumber: number;
  estimatePrefix: string;
  estimateCurrentNumber: number;
  saleOrderPrefix: string;
  saleOrderCurrentNumber: number;
  deliveryChallanPrefix: string;
  deliveryChallanCurrentNumber: number;
  purchaseOrderPrefix: string;
  purchaseOrderCurrentNumber: number;
  saleReturnPrefix: string;
  saleReturnCurrentNumber: number;
  purchaseReturnPrefix: string;
  purchaseReturnCurrentNumber: number;

  // Tax settings
  taxInclusive: boolean;
  defaultTaxRateId?: string;

  // Invoice
  defaultInvoiceTheme: InvoiceTheme;
  defaultPaymentTerms: PaymentTerms;
  showProfit: boolean; // show profit while making sale invoice
  enableFreeQty: boolean;
  enableAdditionalCharges: boolean;
  enableTransactionDiscount: boolean;
  enableEwayBill: boolean;
  enableReverseCharge: boolean;

  // Sharing
  autoShareWhatsApp: boolean;
  shareFormat: ShareFormat;

  // Reminders
  enablePaymentReminders: boolean;
  reminderDaysAfterDue: number;
  reminderMessageTemplate: string;
}
