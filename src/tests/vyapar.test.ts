import { describe, it, expect } from 'vitest';
import {
  isValidGSTIN,
  isValidPAN,
  isValidIndianPhone,
  getStateFromGSTIN,
  extractPanFromGSTIN,
  isValidIFSC,
} from '../utils/validators';
import { calculateGstr1, calculateGstr3b } from '../utils/gstCalc';
import { calculateDetailedAgeingReport } from '../utils/accounting';
import { useLedgerlyStore } from '../store/useLedgerlyStore';
import { Party, Invoice, Transaction } from '../types';

describe('Vyapar-Clone Validation Suite', () => {
  it('validates Indian GSTIN correctly', () => {
    // Valid Gujarat GSTIN
    expect(isValidGSTIN('24ABCDE1234F1Z5')).toBe(true);
    // Invalid length
    expect(isValidGSTIN('24ABCDE1234F1Z')).toBe(false);
    // Invalid characters
    expect(isValidGSTIN('XXABCDE1234F1Z5')).toBe(false);
    // Empty
    expect(isValidGSTIN('')).toBe(false);
  });

  it('extracts state and PAN from GSTIN', () => {
    const gstin = '24ABCDE1234F1Z5';
    const state = getStateFromGSTIN(gstin);
    expect(state).not.toBeNull();
    expect(state?.code).toBe('24');
    expect(state?.name).toBe('Gujarat');

    const pan = extractPanFromGSTIN(gstin);
    expect(pan).toBe('ABCDE1234F');
  });

  it('validates Indian PAN correctly', () => {
    expect(isValidPAN('ABCDE1234F')).toBe(true);
    expect(isValidPAN('ABCD12345F')).toBe(false);
    expect(isValidPAN('abcde1234f')).toBe(true);
  });

  it('validates Indian mobile phones correctly', () => {
    expect(isValidIndianPhone('9876543210')).toBe(true);
    expect(isValidIndianPhone('+919876543210')).toBe(true);
    expect(isValidIndianPhone('5876543210')).toBe(false); // Does not start with 6-9
    expect(isValidIndianPhone('12345')).toBe(false);
  });

  it('validates IFSC codes correctly', () => {
    expect(isValidIFSC('SBIN0001234')).toBe(true);
    expect(isValidIFSC('HDFC0000123')).toBe(true);
    expect(isValidIFSC('INVALID')).toBe(false);
  });
});

describe('GSTR-1 & GSTR-3B Calculation Engine', () => {
  const dummyPartyB2B: Party = {
    id: 'p-b2b',
    name: 'Ahmedabad Retailer',
    phone: '9898000000',
    type: 'CUSTOMER',
    gstin: '24ABCDE1234F1Z5',
    state: '24 - Gujarat',
    openingBalance: 0,
    openingType: 'RECEIVABLE',
    createdAt: '2026-04-01',
    updatedAt: '2026-04-01',
    isDeleted: false,
  };

  const dummyPartyB2C: Party = {
    id: 'p-b2c',
    name: 'Walk-in Customer',
    phone: '9898000001',
    type: 'CUSTOMER',
    state: '24 - Gujarat',
    openingBalance: 0,
    openingType: 'RECEIVABLE',
    createdAt: '2026-04-01',
    updatedAt: '2026-04-01',
    isDeleted: false,
  };

  const dummySaleInvB2B: Invoice = {
    id: 'inv-1',
    type: 'SALE',
    number: 'INV/2627/001',
    partyId: 'p-b2b',
    partyName: 'Ahmedabad Retailer',
    date: '2026-04-10',
    dueDate: '2026-04-10',
    withGst: true,
    stateOfSupply: '24 - Gujarat',
    subtotal: 100000, // ₹1,000.00
    discountTotal: 0,
    taxableAmount: 100000,
    taxTotal: 18000, // ₹180.00
    cgstTotal: 9000,
    sgstTotal: 9000,
    igstTotal: 0,
    roundOff: 0,
    total: 118000,
    paidAmount: 118000,
    paymentType: 'CASH',
    paymentMode: 'CASH',
    status: 'PAID',
    lines: [
      {
        id: 'l-1',
        itemId: 'item-1',
        itemName: 'Kaju Katli 1Kg',
        itemType: 'PRODUCT',
        qty: 1,
        unit: 'box',
        rate: 100000,
        taxPercent: 18,
        taxIncluded: false,
        taxableAmount: 100000,
        cgst: 9000,
        sgst: 9000,
        igst: 0,
        amount: 118000,
        hsn: '2106',
      },
    ],
    createdAt: '2026-04-10',
    updatedAt: '2026-04-10',
    isDeleted: false,
  };

  it('classifies B2B and HSN rows in GSTR-1 accurately', () => {
    const summary = calculateGstr1([dummySaleInvB2B], [dummyPartyB2B, dummyPartyB2C]);
    expect(summary.b2bRows.length).toBe(1);
    expect(summary.b2bRows[0].gstin).toBe('24ABCDE1234F1Z5');
    expect(summary.b2bRows[0].taxableValuePaise).toBe(100000);
    expect(summary.b2bRows[0].cgstPaise).toBe(9000);
    expect(summary.b2bRows[0].sgstPaise).toBe(9000);

    expect(summary.hsnRows.length).toBe(1);
    expect(summary.hsnRows[0].hsn).toBe('2106');
    expect(summary.hsnRows[0].totalQty).toBe(1);
  });

  it('computes GSTR-3B net tax liability accurately', () => {
    const gstr3b = calculateGstr3b([dummySaleInvB2B]);
    expect(gstr3b.outwardTaxableSupplies.taxableValuePaise).toBe(100000);
    expect(gstr3b.outwardTaxableSupplies.cgstPaise).toBe(9000);
    expect(gstr3b.outwardTaxableSupplies.sgstPaise).toBe(9000);
    expect(gstr3b.netTaxPayable.cgstPaise).toBe(9000);
    expect(gstr3b.netTaxPayable.sgstPaise).toBe(9000);
    expect(gstr3b.netTaxPayable.totalPaise).toBe(18000);
  });
});

describe('Store: Vyapar Master Data & Cheque Tracker', () => {
  it('manages cheques with status lifecycle (Open, Deposited, Bounced)', () => {
    const store = useLedgerlyStore.getState();

    const cheque = store.addCheque({
      type: 'RECEIVED',
      partyId: 'p-1',
      partyName: 'Keyur bhai',
      chequeNumber: '000456',
      bankName: 'HDFC Bank',
      chequeDate: '2026-04-15',
      amount: 500000,
      status: 'OPEN',
    });

    expect(cheque.id).toBeDefined();
    expect(cheque.status).toBe('OPEN');

    // Update status to DEPOSITED
    store.updateChequeStatus(cheque.id, 'DEPOSITED');
    const updated = useLedgerlyStore.getState().cheques.find((c) => c.id === cheque.id);
    expect(updated?.status).toBe('DEPOSITED');

    // Delete cheque
    store.deleteCheque(cheque.id);
    const deleted = useLedgerlyStore.getState().cheques.find((c) => c.id === cheque.id);
    expect(deleted?.isDeleted).toBe(true);
  });

  it('manages loan accounts and records EMI payments', () => {
    const store = useLedgerlyStore.getState();

    const loan = store.addLoanAccount({
      lenderName: 'Bank of Baroda Business Loan',
      loanAmount: 10000000, // ₹1,00,000.00
      outstandingAmount: 10000000,
      interestRate: 11.5,
      emiAmount: 1000000, // ₹10,000.00
      startDate: '2026-04-01',
    });

    expect(loan.id).toBeDefined();
    expect(loan.outstandingAmount).toBe(10000000);

    // Record EMI
    store.recordLoanEmi(loan.id, 1000000, 'acc-cash', '2026-05-01');
    const afterEmi = useLedgerlyStore.getState().loanAccounts.find((l) => l.id === loan.id);
    expect(afterEmi?.outstandingAmount).toBe(9000000);
  });
});
