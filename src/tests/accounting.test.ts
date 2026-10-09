import { describe, it, expect } from 'vitest';
import {
  calculateAccountBalance,
  calculateTotalBalance,
  calculatePartyNetBalance,
  calculateReceivablesAndPayables,
  buildAccountLedger,
  buildPartyLedger,
  calculateCurrentStock,
  calculateTotalStockValue,
  calculateProfitAndLoss,
} from '../utils/accounting';
import { paiseToRupees, rupeesToPaise, formatINR, formatIndianNumber } from '../utils/formatters';
import { Account, Party, Transaction, Invoice, Item, StockMovement } from '../types';

describe('Formatters and Integer Paise Arithmetic', () => {
  it('converts between rupees and paise accurately', () => {
    expect(rupeesToPaise(125000)).toBe(12500000);
    expect(rupeesToPaise('49.99')).toBe(4999);
    expect(paiseToRupees(12500000)).toBe(125000);
    expect(paiseToRupees(4999)).toBe(49.99);
  });

  it('formats numbers using Indian Lakhs and Crores grouping', () => {
    expect(formatIndianNumber(125000)).toBe('1,25,000');
    expect(formatIndianNumber(10000000)).toBe('1,00,00,000');
    expect(formatIndianNumber(500)).toBe('500');
  });

  it('formats Indian Rupee currency strings with correct sign and prefix', () => {
    expect(formatINR(12500000)).toBe('₹1,25,000');
    expect(formatINR(12500000, { showSign: true, type: 'IN' })).toBe('+₹1,25,000');
    expect(formatINR(7500000, { showSign: true, type: 'OUT' })).toBe('−₹75,000');
    expect(formatINR(4950, { showPaisa: true })).toBe('₹49.50');
  });
});

describe('Account Balances and Transfers', () => {
  const cashAccount: Account = {
    id: 'cash-1',
    type: 'CASH',
    nickname: 'Cash in Hand',
    openingBalance: 1000000, // ₹10,000
    currentBalance: 1000000,
  };

  const sbiAccount: Account = {
    id: 'bank-sbi',
    type: 'BANK',
    bankName: 'SBI',
    nickname: 'SBI Current A/c',
    openingBalance: 5000000, // ₹50,000
    currentBalance: 5000000,
  };

  it('updates cash and bank balances on Money In and Money Out', () => {
    const txns: Transaction[] = [
      {
        id: 't1',
        type: 'IN',
        amount: 500000, // +₹5,000
        accountId: 'cash-1',
        mode: 'CASH',
        category: 'Sales',
        date: '2026-10-01',
        time: '10:00',
        createdAt: '2026-10-01T10:00:00Z',
        updatedAt: '2026-10-01T10:00:00Z',
        isDeleted: false,
      },
      {
        id: 't2',
        type: 'OUT',
        amount: 200000, // -₹2,000
        accountId: 'cash-1',
        mode: 'CASH',
        category: 'Tea & Snacks',
        date: '2026-10-01',
        time: '11:00',
        createdAt: '2026-10-01T11:00:00Z',
        updatedAt: '2026-10-01T11:00:00Z',
        isDeleted: false,
      },
    ];

    const cashBal = calculateAccountBalance(cashAccount, txns);
    // Opening 10,000 + 5,000 - 2,000 = 13,000 (1300000 paise)
    expect(cashBal).toBe(1300000);
  });

  it('handles account transfers neutrally without altering total net worth', () => {
    // Transfer ₹15,000 from SBI Bank to Cash in Hand
    const transferTxn: Transaction[] = [
      {
        id: 't-transfer',
        type: 'TRANSFER',
        amount: 1500000, // ₹15,000
        accountId: 'bank-sbi', // from
        toAccountId: 'cash-1', // to
        mode: 'NEFT_RTGS',
        category: 'Bank to Cash Withdrawal',
        date: '2026-10-02',
        time: '14:00',
        createdAt: '2026-10-02T14:00:00Z',
        updatedAt: '2026-10-02T14:00:00Z',
        isDeleted: false,
      },
    ];

    const cashBal = calculateAccountBalance(cashAccount, transferTxn);
    const sbiBal = calculateAccountBalance(sbiAccount, transferTxn);
    const totals = calculateTotalBalance([cashAccount, sbiAccount], transferTxn);

    // Cash: 10,000 + 15,000 = 25,000
    expect(cashBal).toBe(2500000);
    // SBI: 50,000 - 15,000 = 35,000
    expect(sbiBal).toBe(3500000);
    // Total combined balance remains constant at ₹60,000
    expect(totals.total).toBe(6000000);
  });

  it('strictly ignores soft-deleted transactions in balance computations', () => {
    const txns: Transaction[] = [
      {
        id: 't-deleted',
        type: 'IN',
        amount: 500000,
        accountId: 'cash-1',
        mode: 'CASH',
        category: 'Mistake',
        date: '2026-10-01',
        time: '10:00',
        createdAt: '2026-10-01T10:00:00Z',
        updatedAt: '2026-10-01T10:00:00Z',
        isDeleted: true, // Deleted
      },
    ];

    const cashBal = calculateAccountBalance(cashAccount, txns);
    expect(cashBal).toBe(cashAccount.openingBalance);
  });
});

describe('Party Ledger & Receivables / Payables', () => {
  const customer: Party = {
    id: 'cust-1',
    name: 'Rajesh Kumar',
    phone: '9876543210',
    type: 'CUSTOMER',
    openingBalance: 500000, // ₹5,000 opening receivable
    openingType: 'RECEIVABLE',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    isDeleted: false,
  };

  it('correctly increases customer receivable on Sale Invoice and reduces on Money In', () => {
    const invoices: Invoice[] = [
      {
        id: 'inv-1',
        type: 'SALE',
        number: 'INV-001',
        partyId: 'cust-1',
        partyName: 'Rajesh Kumar',
        date: '2026-10-02',
        dueDate: '2026-10-10',
        subtotal: 1000000,
        discountTotal: 0,
        taxTotal: 0,
        roundOff: 0,
        total: 1000000, // +₹10,000 sale
        paidAmount: 0,
        status: 'UNPAID',
        lines: [],
        createdAt: '2026-10-02T10:00:00Z',
        updatedAt: '2026-10-02T10:00:00Z',
        isDeleted: false,
      },
    ];

    const txns: Transaction[] = [
      {
        id: 't-pay',
        type: 'IN',
        amount: 700000, // Customer pays ₹7,000
        accountId: 'cash-1',
        partyId: 'cust-1',
        mode: 'UPI',
        category: 'Payment Received',
        date: '2026-10-03',
        time: '12:00',
        createdAt: '2026-10-03T12:00:00Z',
        updatedAt: '2026-10-03T12:00:00Z',
        isDeleted: false,
      },
    ];

    // Net balance = 5,000 opening + 10,000 sale - 7,000 payment = ₹8,000 (800000 paise)
    const net = calculatePartyNetBalance(customer, txns, invoices);
    expect(net).toBe(800000);

    const aging = calculateReceivablesAndPayables([customer], txns, invoices);
    expect(aging.toReceive).toBe(800000);
    expect(aging.toPay).toBe(0);
  });
});

describe('Stock Inventory & Low Stock Detection', () => {
  const item: Item = {
    id: 'item-rice',
    name: 'Basmati Rice 10kg',
    category: 'Grains',
    unit: 'box',
    salePrice: 120000, // ₹1,200
    purchasePrice: 95000, // ₹950
    openingStock: 20,
    currentStock: 20,
    minStock: 5,
    taxPercent: 5,
    isDeleted: false,
  };

  it('correctly tracks stock additions and subtractions', () => {
    const movements: StockMovement[] = [
      {
        id: 'sm-1',
        itemId: 'item-rice',
        qty: 16,
        direction: 'OUT', // Sale of 16 units
        refType: 'SALE',
        refId: 'inv-1',
        date: '2026-10-02',
        createdAt: '2026-10-02T10:00:00Z',
      },
    ];

    const currentStock = calculateCurrentStock(item, movements);
    expect(currentStock).toBe(4); // 20 - 16 = 4

    const valuation = calculateTotalStockValue([item], movements);
    // 4 units remaining <= minStock (5), so lowStock alert fires
    expect(valuation.lowStockItems.length).toBe(1);
    expect(valuation.lowStockItems[0].id).toBe('item-rice');
    expect(valuation.totalValue).toBe(4 * 95000); // ₹3,800
  });
});

describe('Profit & Loss Computations', () => {
  it('computes net profit excluding bank-to-cash transfers', () => {
    const txns: Transaction[] = [
      {
        id: 't-inc',
        type: 'IN',
        amount: 2500000, // ₹25,000 income
        accountId: 'cash-1',
        mode: 'CASH',
        category: 'Sales',
        date: '2026-10-01',
        time: '10:00',
        createdAt: '2026-10-01T10:00:00Z',
        updatedAt: '2026-10-01T10:00:00Z',
        isDeleted: false,
      },
      {
        id: 't-exp',
        type: 'OUT',
        amount: 800000, // ₹8,000 expense
        accountId: 'cash-1',
        mode: 'CASH',
        category: 'Rent',
        date: '2026-10-01',
        time: '11:00',
        createdAt: '2026-10-01T11:00:00Z',
        updatedAt: '2026-10-01T11:00:00Z',
        isDeleted: false,
      },
      {
        id: 't-trans',
        type: 'TRANSFER',
        amount: 5000000, // ₹50,000 transfer (MUST NOT appear in P&L)
        accountId: 'bank-sbi',
        toAccountId: 'cash-1',
        mode: 'NEFT_RTGS',
        category: 'Cash Withdrawal',
        date: '2026-10-01',
        time: '12:00',
        createdAt: '2026-10-01T12:00:00Z',
        updatedAt: '2026-10-01T12:00:00Z',
        isDeleted: false,
      },
    ];

    const pl = calculateProfitAndLoss(txns, []);
    expect(pl.totalRevenue).toBe(2500000);
    expect(pl.totalExpense).toBe(800000);
    expect(pl.netProfit).toBe(1700000); // ₹17,000
  });
});

describe('Bank Ledger & Search Capabilities', () => {
  it('fuzzy searches Indian banks like SBI returning State Bank of India', async () => {
    const { searchIndianBanks } = await import('../data/indianBanks');
    const results = searchIndianBanks('sbi');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('State Bank of India');

    const bobResults = searchIndianBanks('bob');
    expect(bobResults[0].name).toBe('Bank of Baroda');
  });

  it('feeds opening bank balance from onboarding into ledger as first entry', () => {
    const bankAccount: Account = {
      id: 'acc-sbi-1',
      type: 'BANK',
      bankName: 'State Bank of India',
      bankCode: 'SBI',
      nickname: 'SBI Business A/c',
      openingBalance: 7500000, // ₹75,000
      currentBalance: 7500000,
    };

    const ledger = buildAccountLedger(bankAccount, []);
    expect(ledger.length).toBe(1);
    expect(ledger[0].type).toBe('OPENING');
    expect(ledger[0].runningBalance).toBe(7500000);
    expect(ledger[0].credit).toBe(7500000);
  });
});

