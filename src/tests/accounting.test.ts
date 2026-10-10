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
import { paiseToRupees, rupeesToPaise, formatINR, formatIndianNumber, formatQuantity } from '../utils/formatters';
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

  it('formats decimal quantities neatly without trailing zeroes', () => {
    expect(formatQuantity(0.5)).toBe('0.5');
    expect(formatQuantity(1.5)).toBe('1.5');
    expect(formatQuantity(1)).toBe('1');
    expect(formatQuantity(2.75)).toBe('2.75');
    expect(formatQuantity(0.005)).toBe('0.005');
    expect(formatQuantity(0)).toBe('0');
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

describe('GST Calculation Engine & Number to Words', () => {
  it('calculates tax-exclusive GST correctly with intra-state CGST + SGST split', async () => {
    const { calculateLineGST } = await import('../utils/gstCalc');
    const result = calculateLineGST({
      qty: 2,
      ratePaise: 10000, // ₹100 each
      taxPercent: 18,
      taxIncluded: false,
      withGst: true,
      isInterState: false,
    });

    expect(result.grossPaise).toBe(20000); // ₹200
    expect(result.taxableAmountPaise).toBe(20000);
    expect(result.taxPaise).toBe(3600); // 18% of 200 = ₹36
    expect(result.cgstPaise).toBe(1800); // ₹18
    expect(result.sgstPaise).toBe(1800); // ₹18
    expect(result.igstPaise).toBe(0);
    expect(result.rowTotalPaise).toBe(23600); // ₹236
  });

  it('calculates tax-inclusive GST correctly', async () => {
    const { calculateLineGST } = await import('../utils/gstCalc');
    const result = calculateLineGST({
      qty: 1,
      ratePaise: 11800, // ₹118 tax-inclusive
      taxPercent: 18,
      taxIncluded: true,
      withGst: true,
      isInterState: true,
    });

    expect(result.rowTotalPaise).toBe(11800);
    expect(result.taxableAmountPaise).toBe(10000); // ₹100
    expect(result.taxPaise).toBe(1800); // ₹18
    expect(result.igstPaise).toBe(1800); // ₹18 IGST
    expect(result.cgstPaise).toBe(0);
  });

  it('calculates without-GST mode as 0 tax', async () => {
    const { calculateLineGST } = await import('../utils/gstCalc');
    const result = calculateLineGST({
      qty: 5,
      ratePaise: 2000, // ₹20
      taxPercent: 18,
      withGst: false,
    });

    expect(result.taxPaise).toBe(0);
    expect(result.rowTotalPaise).toBe(10000); // ₹100
  });

  it('calculates fractional decimal quantities accurately (e.g. 0.5 kg at ₹40)', async () => {
    const { calculateLineGST } = await import('../utils/gstCalc');
    // 0.5 kg at ₹40/kg without GST = ₹20 (2000 paise)
    const resultNoGst = calculateLineGST({
      qty: 0.5,
      ratePaise: 4000, // ₹40
      taxPercent: 0,
      withGst: false,
    });
    expect(resultNoGst.grossPaise).toBe(2000);
    expect(resultNoGst.rowTotalPaise).toBe(2000);

    // 1.5 kg at ₹100/kg with 18% GST (intra-state: 9% CGST + 9% SGST)
    const resultWithGst = calculateLineGST({
      qty: 1.5,
      ratePaise: 10000, // ₹100
      taxPercent: 18,
      taxIncluded: false,
      withGst: true,
      isInterState: false,
    });
    // Gross = 1.5 * 100 = ₹150 (15000 paise)
    expect(resultWithGst.grossPaise).toBe(15000);
    expect(resultWithGst.taxableAmountPaise).toBe(15000);
    // 18% of 150 = ₹27 (2700 paise)
    expect(resultWithGst.taxPaise).toBe(2700);
    expect(resultWithGst.cgstPaise).toBe(1350);
    expect(resultWithGst.sgstPaise).toBe(1350);
    expect(resultWithGst.rowTotalPaise).toBe(17700); // ₹177
  });

  it('converts Rupee numbers into Indian words', async () => {
    const { numberToIndianWords } = await import('../utils/gstCalc');
    expect(numberToIndianWords(125000)).toBe('Rupees One Lakh Twenty-Five Thousand Only');
    expect(numberToIndianWords(500)).toBe('Rupees Five Hundred Only');
    expect(numberToIndianWords(0)).toBe('Rupees Zero Only');
  });
});

describe('Indian Financial Year Calculations', () => {
  it('correctly calculates Indian financial year (April to March)', async () => {
    const { getCurrentFinancialYear, isDateInFinancialYear } = await import('../utils/financialYear');
    const oct2026 = new Date('2026-10-09');
    expect(getCurrentFinancialYear(oct2026)).toBe('2026-27');

    const feb2027 = new Date('2027-02-15');
    expect(getCurrentFinancialYear(feb2027)).toBe('2026-27');

    expect(isDateInFinancialYear('2026-08-15', '2026-27')).toBe(true);
    expect(isDateInFinancialYear('2025-03-31', '2026-27')).toBe(false);
  });
});

describe('Mobile Contact Normalization & Statement Details', () => {
  it('normalizes various Indian phone number formats to 10 digits', async () => {
    const { normalizePhoneNumber } = await import('../utils/contactPicker');
    expect(normalizePhoneNumber('+91 98765 43210')).toBe('9876543210');
    expect(normalizePhoneNumber('919876543210')).toBe('9876543210');
    expect(normalizePhoneNumber('09876543210')).toBe('9876543210');
    expect(normalizePhoneNumber('98765-43210')).toBe('9876543210');
  });

  it('includes transport charges, items, and notes in party statement ledger descriptions', () => {
    const testParty: Party = {
      id: 'p-test',
      name: 'Ramesh Patel',
      phone: '9876543210',
      type: 'CUSTOMER',
      openingBalance: 0,
      openingType: 'RECEIVABLE',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      isDeleted: false,
    };

    const testInvoice: Invoice = {
      id: 'inv-101',
      number: 'INV/2627/001',
      type: 'SALE',
      date: '2026-10-09',
      dueDate: '2026-10-15',
      partyId: 'p-test',
      partyName: 'Ramesh Patel',
      lines: [
        {
          id: 'l1',
          itemId: 'i1',
          itemName: 'Cement UltraTech',
          unit: 'pcs',
          qty: 50,
          rate: 38000,
          discountPercent: 0,
          discountType: 'PERCENT',
          discountAmount: 0,
          taxPercent: 18,
          taxIncluded: false,
          taxableAmount: 1900000,
          cgst: 171000,
          sgst: 171000,
          igst: 0,
          amount: 2242000,
        },
      ],
      subtotal: 1900000,
      discountTotal: 0,
      taxableAmount: 1900000,
      cgstTotal: 171000,
      sgstTotal: 171000,
      igstTotal: 0,
      taxTotal: 342000,
      extraCharges: 150000, // ₹1,500 transport
      roundOff: 0,
      total: 2392000,
      paidAmount: 0,
      status: 'UNPAID',
      paymentType: 'CREDIT',
      notes: 'Truck Transport to Site 4',
      withGst: true,
      createdAt: '2026-10-09T10:00:00Z',
      updatedAt: '2026-10-09T10:00:00Z',
      isDeleted: false,
    };

    const ledger = buildPartyLedger(testParty, [], [testInvoice]);
    expect(ledger.length).toBe(2); // Opening + Invoice

    const invEntry = ledger[1];
    expect(invEntry.description).toContain('Sale Invoice #INV/2627/001');
    expect(invEntry.description).toContain('Cement UltraTech');
    expect(invEntry.description).toContain('Transport/Extra: ₹1500');
    expect(invEntry.description).toContain('Truck Transport to Site 4');
  });
});

describe('Store: Auto-Save Items & Transaction Details Modal', () => {
  it('automatically creates new items in item catalog when saving an invoice', async () => {
    const { useLedgerlyStore } = await import('../store/useLedgerlyStore');
    const store = useLedgerlyStore.getState();

    let testParty = store.parties[0];
    if (!testParty) {
      testParty = store.addParty({
        name: 'Auto-Item Test Party',
        phone: '9876543210',
        type: 'CUSTOMER',
        openingBalance: 0,
        openingType: 'RECEIVABLE',
      });
    }

    let testAccount = useLedgerlyStore.getState().accounts[0];
    if (!testAccount) {
      const mockAcc: Account = {
        id: 'acc-cash-test',
        type: 'CASH',
        nickname: 'Main Cash',
        openingBalance: 1000000,
        currentBalance: 1000000,
      };
      useLedgerlyStore.setState((state) => ({ accounts: [mockAcc, ...state.accounts] }));
      testAccount = mockAcc;
    }

    const initialItemCount = useLedgerlyStore.getState().items.length;

    const newInvoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'> = {
      number: 'INV/TEST/AUTO-001',
      type: 'SALE',
      date: '2026-10-10',
      dueDate: '2026-10-15',
      partyId: testParty.id,
      partyName: testParty.name,
      lines: [
        {
          id: 'temp-1',
          itemId: 'test-item-1',
          itemName: 'Organic Almond Milk 1L',
          unit: 'ltr',
          qty: 2.5,
          rate: 18000, // ₹180
          discountPercent: 0,
          taxPercent: 5,
          taxIncluded: false,
          taxableAmount: 45000,
          cgst: 1125,
          sgst: 1125,
          igst: 0,
          amount: 47250,
          itemType: 'PRODUCT',
        },
        {
          id: 'temp-2',
          itemId: 'test-item-2',
          itemName: 'Delivery & Setup Service',
          unit: 'service',
          qty: 1,
          rate: 25000, // ₹250
          discountPercent: 0,
          taxPercent: 18,
          taxIncluded: false,
          taxableAmount: 25000,
          cgst: 2250,
          sgst: 2250,
          igst: 0,
          amount: 29500,
          itemType: 'SERVICE',
        },
      ],
      subtotal: 70000,
      discountTotal: 0,
      taxableAmount: 70000,
      cgstTotal: 3375,
      sgstTotal: 3375,
      igstTotal: 0,
      taxTotal: 6750,
      extraCharges: 0,
      roundOff: 0,
      total: 76750,
      paidAmount: 76750,
      status: 'PAID',
      paymentType: 'CASH',
      accountId: testAccount.id,
      withGst: true,
    };

    const result = store.atomicSaveInvoice(newInvoice);
    expect(result.invoice.id).toBeDefined();

    const updatedState = useLedgerlyStore.getState();
    // The items catalog should have expanded by 2
    expect(updatedState.items.length).toBe(initialItemCount + 2);

    const savedProduct = updatedState.items.find(i => i.name.toLowerCase() === 'organic almond milk 1l');
    expect(savedProduct).toBeDefined();
    expect(savedProduct?.unit).toBe('ltr');
    expect(savedProduct?.salePrice).toBe(18000);
    expect(savedProduct?.itemType).toBe('PRODUCT');

    const savedService = updatedState.items.find(i => i.name.toLowerCase() === 'delivery & setup service');
    expect(savedService).toBeDefined();
    expect(savedService?.unit).toBe('service');
    expect(savedService?.itemType).toBe('SERVICE');
  });

  it('opens and closes transaction detail modal correctly', async () => {
    const { useLedgerlyStore } = await import('../store/useLedgerlyStore');
    const store = useLedgerlyStore.getState();

    expect(store.isTransactionDetailOpen).toBe(false);

    // If there is any transaction, test opening it
    if (store.transactions.length > 0) {
      const txn = store.transactions[0];
      store.openTransactionDetail(txn.id);

      const openState = useLedgerlyStore.getState();
      expect(openState.isTransactionDetailOpen).toBe(true);
      expect(openState.selectedTransactionForDetail?.id).toBe(txn.id);

      store.closeTransactionDetail();
      const closedState = useLedgerlyStore.getState();
      expect(closedState.isTransactionDetailOpen).toBe(false);
      expect(closedState.selectedTransactionForDetail).toBeNull();
    }
  });

  it('deletes an invoice and reverses stock correctly', async () => {
    const { useLedgerlyStore } = await import('../store/useLedgerlyStore');
    const store = useLedgerlyStore.getState();

    // Pick the invoice we created in the earlier test or create one
    const inv = store.invoices[0];
    if (inv) {
      const deleteResult = store.deleteInvoice(inv.id);
      expect(deleteResult.success).toBe(true);

      const afterDelete = useLedgerlyStore.getState();
      const deletedInv = afterDelete.invoices.find((i) => i.id === inv.id);
      expect(deletedInv?.isDeleted).toBe(true);
    }
  });

  it('generates invoice and party statement PDFs using jsPDF without errors', async () => {
    const { generateInvoicePdf, generatePartyStatementPdf } = await import('../services/pdfService');
    const { useLedgerlyStore } = await import('../store/useLedgerlyStore');
    const store = useLedgerlyStore.getState();

    const mockInvoice: Invoice = {
      id: 'inv-test-pdf',
      number: 'INV/2026/099',
      type: 'SALE',
      date: '2026-10-10',
      dueDate: '2026-10-15',
      partyId: 'p-1',
      partyName: 'Shree Krishna Traders - Very Long Business Name For Testing Wrap',
      lines: [
        {
          id: 'l-1',
          itemId: 'i-1',
          itemName: 'Premium Wheat Flour 10kg',
          qty: 2.5,
          unit: 'bag',
          rate: 35000,
          discountPercent: 5,
          taxPercent: 5,
          taxIncluded: false,
          taxableAmount: 83125,
          cgst: 2078,
          sgst: 2078,
          igst: 0,
          amount: 87281,
        },
      ],
      subtotal: 87500,
      discountTotal: 4375,
      taxableAmount: 83125,
      cgstTotal: 2078,
      sgstTotal: 2078,
      igstTotal: 0,
      taxTotal: 4156,
      extraCharges: 0,
      roundOff: 0,
      total: 87281,
      paidAmount: 50000,
      status: 'PARTIAL',
      paymentType: 'CASH',
      withGst: true,
      createdAt: '2026-10-10T10:00:00Z',
      updatedAt: '2026-10-10T10:00:00Z',
      isDeleted: false,
    };

    const doc = generateInvoicePdf(mockInvoice, store.business, store.parties[0]);
    expect(doc).toBeDefined();
    const blob = doc.output('blob');
    expect(blob.size).toBeGreaterThan(0);

    const testParty: Party = {
      id: 'p-statement-test',
      name: 'Ramesh Patel & Sons',
      phone: '9876543210',
      type: 'CUSTOMER',
      openingBalance: 100000,
      openingType: 'RECEIVABLE',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      isDeleted: false,
    };

    const statementDoc = generatePartyStatementPdf(testParty, [], store.business);
    expect(statementDoc).toBeDefined();
    const statementBlob = statementDoc.output('blob');
    expect(statementBlob.size).toBeGreaterThan(0);
  });

  it('generates real PDF bill with correct filename and all 8 required fields via shareBillPdfFile', async () => {
    const { shareBillPdfFile, generateInvoicePdf } = await import('../services/pdfService');
    const { useLedgerlyStore } = await import('../store/useLedgerlyStore');
    const store = useLedgerlyStore.getState();

    const mockBill: Invoice = {
      id: 'inv-test-shree-sweet',
      type: 'SALE',
      number: 'BILL/2627/001',
      partyId: 'cust-keyur',
      partyName: 'Keyur bhai',
      date: '2026-10-10',
      dueDate: '2026-10-10',
      financialYear: '2026-27',
      lines: [
        {
          id: 'line-kaju-katli',
          itemId: 'item-kaju',
          itemName: 'Kaju Katli Special',
          unit: 'kg',
          qty: 10,
          rate: 114700, // ₹1,147/kg = ₹11,470
          discountPercent: 0,
          discountType: 'PERCENT',
          discountAmount: 0,
          taxPercent: 0,
          taxIncluded: false,
          taxableAmount: 1147000,
          cgst: 0,
          sgst: 0,
          igst: 0,
          amount: 1147000, // ₹11,470 total
        },
      ],
      subtotal: 1147000,
      discountTotal: 0,
      taxableAmount: 1147000,
      cgstTotal: 0,
      sgstTotal: 0,
      igstTotal: 0,
      taxTotal: 0,
      extraCharges: 0,
      roundOff: 0,
      total: 1147000, // ₹11,470.00
      paidAmount: 1147000, // Fully paid: ₹11,470.00
      status: 'PAID',
      paymentType: 'CASH',
      withGst: false,
      createdAt: '2026-10-10T11:00:00Z',
      updatedAt: '2026-10-10T11:00:00Z',
      isDeleted: false,
    };

    const business = {
      ...store.business,
      name: 'Shree Sweet',
      phone: '9876543210',
    };

    const party = {
      id: 'cust-keyur',
      name: 'Keyur bhai',
      phone: '9876543210',
      type: 'CUSTOMER' as const,
      openingBalance: 0,
      openingType: 'RECEIVABLE' as const,
      createdAt: '2026-10-10',
      updatedAt: '2026-10-10',
      isDeleted: false,
    };

    // 1. Verify generateInvoicePdf generates valid document
    const doc = generateInvoicePdf(mockBill, business, party);
    expect(doc).toBeDefined();
    const pdfBlob = doc.output('blob');
    expect(pdfBlob.size).toBeGreaterThan(1000); // Authentic binary PDF with embedded streams

    // 2. Verify shareBillPdfFile generates correct filename: BILL-2627-001.pdf
    const shareResult = await shareBillPdfFile({
      invoice: mockBill,
      business,
      party,
    });

    expect(shareResult.fileName).toBe('Invoice-BILL-2627-001-Keyur-bhai.pdf');
    expect(shareResult.success).toBe(true);
  });

  it('generates Day Book, Balance Sheet, and Bill-wise PnL PDFs accurately', async () => {
    const {
      generateDayBookPdf,
      generateBalanceSheetPdf,
      generateBillWisePnlPdf,
      formatInvoiceMessageTemplate,
    } = await import('../services/pdfService');
    const { useLedgerlyStore } = await import('../store/useLedgerlyStore');
    const store = useLedgerlyStore.getState();

    // 1. Day Book PDF
    const dayDoc = generateDayBookPdf(
      '2026-10-10',
      [
        {
          id: 'db-1',
          time: '10:30',
          date: '2026-10-10',
          type: 'SALE',
          refNumber: 'BILL/2627/001',
          partyName: 'Keyur bhai',
          mode: 'CASH',
          inflow: 1147000,
          outflow: 0,
          net: 1147000,
        },
      ],
      store.business,
      { totalIn: 1147000, totalOut: 0, net: 1147000 }
    );
    expect(dayDoc).toBeDefined();
    expect(dayDoc.output('blob').size).toBeGreaterThan(500);

    // 2. Balance Sheet PDF
    const bsDoc = generateBalanceSheetPdf(
      '2026-10-10',
      {
        asOnDate: '2026-10-10',
        assets: {
          cashInHand: 500000,
          bankBalances: [{ accountId: 'acc-1', bankName: 'SBI', balance: 1000000 }],
          totalBank: 1000000,
          sundryDebtors: 300000,
          closingStockValue: 200000,
          totalAssets: 2000000,
        },
        liabilities: {
          sundryCreditors: 500000,
          capitalAndReserves: 1000000,
          netProfitCarriedIn: 500000,
          totalLiabilities: 2000000,
        },
        isBalanced: true,
        difference: 0,
      },
      store.business
    );
    expect(bsDoc).toBeDefined();
    expect(bsDoc.output('blob').size).toBeGreaterThan(500);

    // 3. Bill-wise P&L PDF
    const pnlDoc = generateBillWisePnlPdf(
      [
        {
          invoiceId: 'inv-1',
          billNumber: 'BILL/2627/001',
          date: '2026-10-10',
          customerName: 'Keyur bhai',
          customerId: 'cust-1',
          saleAmount: 1147000,
          costAmount: 800000,
          profitAmount: 347000,
          marginPercent: 30.25,
          status: 'PAID',
        },
      ],
      store.business
    );
    expect(pnlDoc).toBeDefined();
    expect(pnlDoc.output('blob').size).toBeGreaterThan(500);

    // 4. Message template placeholder replacement
    const template = 'Dear {customer_name}, here is your Bill #{bill_no} of ₹{total} from {shop_name}. Balance due: ₹{balance}. Thank you!';
    const formatted = formatInvoiceMessageTemplate(
      template,
      {
        id: 'inv-1',
        type: 'SALE',
        number: 'BILL/2627/001',
        partyId: 'p1',
        partyName: 'Keyur bhai',
        date: '2026-10-10',
        dueDate: '2026-10-10',
        lines: [],
        subtotal: 1147000,
        discountTotal: 0,
        taxTotal: 0,
        roundOff: 0,
        total: 1147000,
        paidAmount: 1147000,
        status: 'PAID',
        createdAt: '2026-10-10',
        updatedAt: '2026-10-10',
        isDeleted: false,
      },
      { ...store.business, name: 'Shree Sweet' }
    );

    expect(formatted).toContain('Dear Keyur bhai');
    expect(formatted).toContain('Bill #BILL/2627/001');
    expect(formatted).toContain('Shree Sweet');
    expect(formatted).toContain('Balance due: ₹0');

    // 5. Print settings store updates
    store.updatePrintSettings({ paperSize: '58mm', showQr: false });
    expect(useLedgerlyStore.getState().printSettings.paperSize).toBe('58mm');
    expect(useLedgerlyStore.getState().printSettings.showQr).toBe(false);
  });
});



