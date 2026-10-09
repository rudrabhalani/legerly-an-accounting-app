/**
 * Realistic Indian Accounting Seed & Demo Data
 * Tailored for small shopkeepers, traders, and retail businesses
 */

import { Business, Account, Party, Item, Transaction, Invoice, StockMovement } from '../types';

export const SEED_BUSINESS: Business = {
  id: 'biz-ledgerly-1',
  name: 'Shree Krishna Traders',
  ownerName: 'Ramesh Sharma',
  phone: '9876543210',
  currency: 'INR',
  gstEnabled: true,
  gstin: '24ABCDE1234F1Z5',
  address: 'Shop No. 12, APMC Market, Station Road, Ahmedabad, Gujarat',
  financialYearStart: '2026-04-01',
  language: 'en',
  pinCode: '1234',
  pinEnabled: false,
  isOnboarded: true,
};

export const SEED_ACCOUNTS: Account[] = [
  {
    id: 'acc-cash',
    type: 'CASH',
    nickname: 'Cash in Hand',
    openingBalance: 1850000, // ₹18,500.00
    currentBalance: 1850000,
    isDefault: true,
  },
  {
    id: 'acc-sbi',
    type: 'BANK',
    bankName: 'SBI',
    nickname: 'State Bank of India',
    accountNumberMasked: '•••• 4821',
    ifsc: 'SBIN0001234',
    openingBalance: 14280000, // ₹1,42,800.00
    currentBalance: 14280000,
    isDefault: false,
  },
  {
    id: 'acc-hdfc',
    type: 'BANK',
    bankName: 'HDFC',
    nickname: 'HDFC Business Current',
    accountNumberMasked: '•••• 9012',
    ifsc: 'HDFC0004567',
    openingBalance: 8520000, // ₹85,200.00
    currentBalance: 8520000,
    isDefault: false,
  },
  {
    id: 'acc-icici',
    type: 'BANK',
    bankName: 'ICICI',
    nickname: 'ICICI Savings A/c',
    accountNumberMasked: '•••• 3345',
    ifsc: 'ICIC0007890',
    openingBalance: 3500000, // ₹35,000.00
    currentBalance: 3500000,
    isDefault: false,
  },
];

export const SEED_PARTIES: Party[] = [
  {
    id: 'party-rajesh',
    name: 'Rajesh Kumar (Kirana)',
    phone: '9825123456',
    type: 'CUSTOMER',
    address: 'Near Old Bus Stand, Bapunagar',
    gstin: '',
    openingBalance: 1245000, // ₹12,450.00
    openingType: 'RECEIVABLE', // Customer owes us -> You'll get (Green)
    createdAt: '2026-09-15T09:00:00Z',
    updatedAt: '2026-09-15T09:00:00Z',
    isDeleted: false,
  },
  {
    id: 'party-priya',
    name: 'Priya Textiles & Wholesale',
    phone: '9898112233',
    type: 'SUPPLIER',
    address: 'Cloth Market, Ring Road, Surat',
    gstin: '24AABCP5678Q1Z2',
    openingBalance: 2800000, // ₹28,000.00
    openingType: 'PAYABLE', // We owe supplier -> You'll give (Red)
    createdAt: '2026-09-18T11:00:00Z',
    updatedAt: '2026-09-18T11:00:00Z',
    isDeleted: false,
  },
  {
    id: 'party-amit',
    name: 'Amit Supermarket',
    phone: '9712345678',
    type: 'CUSTOMER',
    address: 'Vastrapur Main Road',
    gstin: '24XYZAB1234K1Z9',
    openingBalance: 480000, // ₹4,800.00
    openingType: 'RECEIVABLE', // You'll get ₹4,800
    createdAt: '2026-09-20T14:30:00Z',
    updatedAt: '2026-09-20T14:30:00Z',
    isDeleted: false,
  },
  {
    id: 'party-mahavir',
    name: 'Mahavir Oil Mills',
    phone: '9824556677',
    type: 'SUPPLIER',
    address: 'GIDC Industrial Area',
    gstin: '24MOILM9876R1Z4',
    openingBalance: 1560000, // ₹15,600.00
    openingType: 'PAYABLE', // You'll give ₹15,600
    createdAt: '2026-09-22T10:00:00Z',
    updatedAt: '2026-09-22T10:00:00Z',
    isDeleted: false,
  },
  {
    id: 'party-sunita',
    name: 'Sunita Ben Dairy',
    phone: '9426001122',
    type: 'CUSTOMER',
    address: 'Navrangpura',
    openingBalance: 120000, // ₹1,200.00
    openingType: 'RECEIVABLE',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z',
    isDeleted: false,
  },
];

export const SEED_ITEMS: Item[] = [
  {
    id: 'item-basmati',
    name: 'Basmati Rice 10kg Premium',
    category: 'Grains & Pulses',
    unit: 'box',
    salePrice: 125000, // ₹1,250
    purchasePrice: 98000, // ₹980
    openingStock: 25,
    currentStock: 25,
    minStock: 5,
    taxPercent: 5,
    hsn: '1006',
    isDeleted: false,
  },
  {
    id: 'item-oil',
    name: 'Fortune Sunflower Oil 1L Pouch',
    category: 'Edible Oils',
    unit: 'packet',
    salePrice: 15500, // ₹155
    purchasePrice: 13500, // ₹135
    openingStock: 3, // LOW STOCK! (minStock = 10)
    currentStock: 3,
    minStock: 10,
    taxPercent: 5,
    hsn: '1512',
    isDeleted: false,
  },
  {
    id: 'item-tea',
    name: 'Tata Tea Premium 500g',
    category: 'Beverages',
    unit: 'packet',
    salePrice: 24000, // ₹240
    purchasePrice: 20500, // ₹205
    openingStock: 40,
    currentStock: 40,
    minStock: 8,
    taxPercent: 5,
    hsn: '0902',
    isDeleted: false,
  },
  {
    id: 'item-atta',
    name: 'Aashirvaad Shudh Chakki Atta 5kg',
    category: 'Flour & Atta',
    unit: 'packet',
    salePrice: 27500, // ₹275
    purchasePrice: 23500, // ₹235
    openingStock: 18,
    currentStock: 18,
    minStock: 6,
    taxPercent: 0,
    hsn: '1101',
    isDeleted: false,
  },
  {
    id: 'item-surf',
    name: 'Surf Excel Quick Wash 1kg',
    category: 'Cleaning',
    unit: 'packet',
    salePrice: 14500, // ₹145
    purchasePrice: 12200, // ₹122
    openingStock: 30,
    currentStock: 30,
    minStock: 5,
    taxPercent: 18,
    hsn: '3402',
    isDeleted: false,
  },
];

export const SEED_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'sm-init-1',
    itemId: 'item-basmati',
    qty: 25,
    direction: 'IN',
    refType: 'PURCHASE',
    refId: 'init',
    date: '2026-10-01',
    createdAt: '2026-10-01T09:00:00Z',
  },
  {
    id: 'sm-init-2',
    itemId: 'item-oil',
    qty: 3,
    direction: 'IN',
    refType: 'PURCHASE',
    refId: 'init',
    date: '2026-10-01',
    createdAt: '2026-10-01T09:00:00Z',
  },
  {
    id: 'sm-init-3',
    itemId: 'item-tea',
    qty: 40,
    direction: 'IN',
    refType: 'PURCHASE',
    refId: 'init',
    date: '2026-10-01',
    createdAt: '2026-10-01T09:00:00Z',
  },
  {
    id: 'sm-init-4',
    itemId: 'item-atta',
    qty: 18,
    direction: 'IN',
    refType: 'PURCHASE',
    refId: 'init',
    date: '2026-10-01',
    createdAt: '2026-10-01T09:00:00Z',
  },
  {
    id: 'sm-init-5',
    itemId: 'item-surf',
    qty: 30,
    direction: 'IN',
    refType: 'PURCHASE',
    refId: 'init',
    date: '2026-10-01',
    createdAt: '2026-10-01T09:00:00Z',
  },
];

export const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: 'txn-1',
    type: 'IN',
    amount: 1540000, // ₹15,400.00
    accountId: 'acc-sbi',
    partyId: 'party-rajesh',
    mode: 'UPI',
    category: 'Sales',
    date: '2026-10-09',
    time: '11:30',
    note: 'Festival bulk order grocery payment received via GPay',
    createdAt: '2026-10-09T11:30:00Z',
    updatedAt: '2026-10-09T11:30:00Z',
    isDeleted: false,
  },
  {
    id: 'txn-2',
    type: 'OUT',
    amount: 1200000, // ₹12,000.00
    accountId: 'acc-hdfc',
    partyId: 'party-priya',
    mode: 'NEFT_RTGS',
    category: 'Purchase',
    date: '2026-10-09',
    time: '14:15',
    note: 'Advance payment for new cloth delivery batch',
    createdAt: '2026-10-09T14:15:00Z',
    updatedAt: '2026-10-09T14:15:00Z',
    isDeleted: false,
  },
  {
    id: 'txn-3',
    type: 'IN',
    amount: 480000, // ₹4,800.00
    accountId: 'acc-cash',
    partyId: 'party-amit',
    mode: 'CASH',
    category: 'Payment Received',
    date: '2026-10-08',
    time: '17:45',
    note: 'Weekly clearance cash payment',
    createdAt: '2026-10-08T17:45:00Z',
    updatedAt: '2026-10-08T17:45:00Z',
    isDeleted: false,
  },
  {
    id: 'txn-4',
    type: 'OUT',
    amount: 250000, // ₹2,500.00
    accountId: 'acc-cash',
    mode: 'CASH',
    category: 'Electricity',
    date: '2026-10-08',
    time: '12:10',
    note: 'UGVCL shop electricity bill cash deposit',
    createdAt: '2026-10-08T12:10:00Z',
    updatedAt: '2026-10-08T12:10:00Z',
    isDeleted: false,
  },
  {
    id: 'txn-5',
    type: 'TRANSFER',
    amount: 1000000, // ₹10,000.00
    accountId: 'acc-sbi', // From SBI
    toAccountId: 'acc-cash', // To Cash in Hand
    mode: 'NEFT_RTGS',
    category: 'Cash Withdrawal',
    date: '2026-10-07',
    time: '10:30',
    note: 'ATM withdrawal for petty shop change',
    createdAt: '2026-10-07T10:30:00Z',
    updatedAt: '2026-10-07T10:30:00Z',
    isDeleted: false,
  },
  {
    id: 'txn-6',
    type: 'OUT',
    amount: 350000, // ₹3,500.00
    accountId: 'acc-cash',
    mode: 'CASH',
    category: 'Transport',
    date: '2026-10-06',
    time: '16:00',
    note: 'Tempo freight delivery charges for grain bags',
    createdAt: '2026-10-06T16:00:00Z',
    updatedAt: '2026-10-06T16:00:00Z',
    isDeleted: false,
  },
  {
    id: 'txn-7',
    type: 'IN',
    amount: 320000, // ₹3,200.00
    accountId: 'acc-sbi',
    partyId: 'party-sunita',
    mode: 'UPI',
    category: 'Sales',
    date: '2026-10-05',
    time: '18:20',
    note: 'Daily milk and ghee retail billing',
    createdAt: '2026-10-05T18:20:00Z',
    updatedAt: '2026-10-05T18:20:00Z',
    isDeleted: false,
  },
];

export const SEED_INVOICES: Invoice[] = [
  {
    id: 'inv-101',
    type: 'SALE',
    number: 'INV-2026-001',
    partyId: 'party-rajesh',
    partyName: 'Rajesh Kumar (Kirana)',
    date: '2026-10-09',
    dueDate: '2026-10-16',
    subtotal: 1250000, // ₹12,500
    discountTotal: 50000, // ₹500
    taxTotal: 60000, // ₹600
    roundOff: 0,
    total: 1260000, // ₹12,600
    paidAmount: 1260000,
    paymentMode: 'UPI',
    accountId: 'acc-sbi',
    status: 'PAID',
    notes: 'Thank you for your business!',
    terms: 'Goods once sold will not be taken back after 7 days.',
    lines: [
      {
        id: 'line-1',
        itemId: 'item-basmati',
        itemName: 'Basmati Rice 10kg Premium',
        unit: 'box',
        qty: 10,
        rate: 125000,
        discountPercent: 4,
        taxPercent: 5,
        amount: 1260000,
      },
    ],
    createdAt: '2026-10-09T10:00:00Z',
    updatedAt: '2026-10-09T10:00:00Z',
    isDeleted: false,
  },
];
