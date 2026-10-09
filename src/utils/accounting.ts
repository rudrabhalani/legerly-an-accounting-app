/**
 * Core Accounting Engine & Double-entry Rules
 * Pure mathematical functions for balance calculations, running ledgers,
 * stock adjustments, P&L, balance sheets, and aging analysis.
 */

import { Account, Party, Transaction, Invoice, Item, StockMovement } from '../types';

/**
 * Calculates current balance for a specific account (Cash or Bank) in paise
 */
export function calculateAccountBalance(
  account: Account,
  transactions: Transaction[]
): number {
  let balance = account.openingBalance;

  // Only consider non-deleted transactions
  const activeTxns = transactions.filter((t) => !t.isDeleted);

  for (const t of activeTxns) {
    if (t.type === 'IN' && t.accountId === account.id) {
      balance += t.amount;
    } else if (t.type === 'OUT' && t.accountId === account.id) {
      balance -= t.amount;
    } else if (t.type === 'TRANSFER') {
      // Outflow from source account
      if (t.accountId === account.id) {
        balance -= t.amount;
      }
      // Inflow into destination account
      if (t.toAccountId === account.id) {
        balance += t.amount;
      }
    }
  }

  return balance;
}

/**
 * Returns Total Balance (Cash in hand + all Banks)
 */
export function calculateTotalBalance(
  accounts: Account[],
  transactions: Transaction[]
): {
  total: number;
  cashTotal: number;
  bankTotal: number;
  accountBalances: Record<string, number>;
} {
  let cashTotal = 0;
  let bankTotal = 0;
  const accountBalances: Record<string, number> = {};

  for (const acc of accounts) {
    const bal = calculateAccountBalance(acc, transactions);
    accountBalances[acc.id] = bal;
    if (acc.type === 'CASH') {
      cashTotal += bal;
    } else {
      bankTotal += bal;
    }
  }

  return {
    total: cashTotal + bankTotal,
    cashTotal,
    bankTotal,
    accountBalances,
  };
}

/**
 * Party Balance Calculation:
 * A positive net balance means "You'll get ₹X" (Receivable from customer)
 * A negative net balance means "You'll give ₹X" (Payable to supplier)
 */
export function calculatePartyNetBalance(
  party: Party,
  transactions: Transaction[],
  invoices: Invoice[]
): number {
  // Opening balance in paise:
  // If RECEIVABLE (Customer owes you): +opening
  // If PAYABLE (You owe supplier): -opening
  let net = party.openingType === 'RECEIVABLE' ? party.openingBalance : -party.openingBalance;

  const activeTxns = transactions.filter((t) => !t.isDeleted && t.partyId === party.id);
  const activeInvoices = invoices.filter((inv) => !inv.isDeleted && inv.partyId === party.id);

  // Invoices:
  // SALE invoice increases what the customer owes us (+net)
  // PURCHASE bill increases what we owe the supplier (-net)
  // SALE_RETURN decreases what customer owes (-net)
  // PURCHASE_RETURN decreases what we owe (+net)
  for (const inv of activeInvoices) {
    if (inv.type === 'SALE') {
      net += inv.total;
    } else if (inv.type === 'PURCHASE') {
      net -= inv.total;
    } else if (inv.type === 'SALE_RETURN') {
      net -= inv.total;
    } else if (inv.type === 'PURCHASE_RETURN') {
      net += inv.total;
    }
  }

  // Payments / Transactions:
  // Money IN received from party reduces their debt to us (-net)
  // Money OUT paid to party reduces our debt to them (+net)
  for (const t of activeTxns) {
    if (t.type === 'IN') {
      net -= t.amount;
    } else if (t.type === 'OUT') {
      net += t.amount;
    }
  }

  return net;
}

/**
 * Calculates aggregate "To Receive" (total customer receivables) and "To Pay" (total supplier payables)
 */
export function calculateReceivablesAndPayables(
  parties: Party[],
  transactions: Transaction[],
  invoices: Invoice[]
): { toReceive: number; toPay: number } {
  let toReceive = 0;
  let toPay = 0;

  for (const party of parties.filter((p) => !p.isDeleted)) {
    const net = calculatePartyNetBalance(party, transactions, invoices);
    if (net > 0) {
      toReceive += net;
    } else if (net < 0) {
      toPay += Math.abs(net);
    }
  }

  return { toReceive, toPay };
}

export interface LedgerEntry {
  id: string;
  date: string;
  time: string;
  type: 'IN' | 'OUT' | 'INVOICE' | 'TRANSFER' | 'OPENING';
  description: string;
  debit: number;    // Money going out or purchase bill (in paise)
  credit: number;   // Money coming in or sale invoice (in paise)
  runningBalance: number; // in paise
  refId: string;
  paymentMode?: string;
  accountName?: string;
}

/**
 * Builds chronological passbook ledger for an Account (Cash or Bank)
 */
export function buildAccountLedger(
  account: Account,
  transactions: Transaction[]
): LedgerEntry[] {
  const activeTxns = transactions
    .filter(
      (t) =>
        !t.isDeleted &&
        (t.accountId === account.id || (t.type === 'TRANSFER' && t.toAccountId === account.id))
    )
    .sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return (a.time || '').localeCompare(b.time || '');
    });

  let running = account.openingBalance;
  const entries: LedgerEntry[] = [];

  // Opening entry
  entries.push({
    id: `opening-${account.id}`,
    date: 'Opening',
    time: '',
    type: 'OPENING',
    description: 'Opening Balance',
    debit: 0,
    credit: account.openingBalance,
    runningBalance: running,
    refId: account.id,
  });

  for (const t of activeTxns) {
    let debit = 0;
    let credit = 0;
    let desc = t.category || 'Transaction';

    if (t.type === 'IN') {
      credit = t.amount;
      running += t.amount;
      desc = `Money In - ${t.category}`;
    } else if (t.type === 'OUT') {
      debit = t.amount;
      running -= t.amount;
      desc = `Money Out - ${t.category}`;
    } else if (t.type === 'TRANSFER') {
      if (t.accountId === account.id) {
        debit = t.amount;
        running -= t.amount;
        desc = `Transfer Sent`;
      } else if (t.toAccountId === account.id) {
        credit = t.amount;
        running += t.amount;
        desc = `Transfer Received`;
      }
    }

    entries.push({
      id: t.id,
      date: t.date,
      time: t.time,
      type: t.type,
      description: desc,
      debit,
      credit,
      runningBalance: running,
      refId: t.id,
      paymentMode: t.mode,
    });
  }

  return entries;
}

/**
 * Builds chronological Statement / Ledger for a specific Party
 */
export function buildPartyLedger(
  party: Party,
  transactions: Transaction[],
  invoices: Invoice[]
): LedgerEntry[] {
  type CombinedItem = 
    | { kind: 'TXN'; date: string; time: string; data: Transaction }
    | { kind: 'INV'; date: string; time: string; data: Invoice };

  const partyTxns = transactions.filter((t) => !t.isDeleted && t.partyId === party.id);
  const partyInvs = invoices.filter((i) => !i.isDeleted && i.partyId === party.id);

  const combined: CombinedItem[] = [
    ...partyTxns.map((t) => ({ kind: 'TXN' as const, date: t.date, time: t.time || '12:00', data: t })),
    ...partyInvs.map((i) => ({ kind: 'INV' as const, date: i.date, time: '12:00', data: i })),
  ];

  combined.sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    if (cmp !== 0) return cmp;
    return a.time.localeCompare(b.time);
  });

  let running = party.openingType === 'RECEIVABLE' ? party.openingBalance : -party.openingBalance;
  const entries: LedgerEntry[] = [];

  // Opening balance row
  entries.push({
    id: `opening-${party.id}`,
    date: 'Opening',
    time: '',
    type: 'OPENING',
    description: `Opening Balance (${party.openingType === 'RECEIVABLE' ? "You'll get" : "You'll give"})`,
    debit: party.openingType === 'PAYABLE' ? party.openingBalance : 0,
    credit: party.openingType === 'RECEIVABLE' ? party.openingBalance : 0,
    runningBalance: running,
    refId: party.id,
  });

  for (const item of combined) {
    if (item.kind === 'TXN') {
      const t = item.data;
      if (t.type === 'IN') {
        // Customer paid us -> Credit party / Decreases receivable
        running -= t.amount;
        entries.push({
          id: t.id,
          date: t.date,
          time: t.time,
          type: 'IN',
          description: `Payment Received (${t.mode})`,
          debit: 0,
          credit: t.amount,
          runningBalance: running,
          refId: t.id,
          paymentMode: t.mode,
        });
      } else if (t.type === 'OUT') {
        // We paid supplier -> Debit party / Decreases payable (increases net)
        running += t.amount;
        entries.push({
          id: t.id,
          date: t.date,
          time: t.time,
          type: 'OUT',
          description: `Payment Given (${t.mode})`,
          debit: t.amount,
          credit: 0,
          runningBalance: running,
          refId: t.id,
          paymentMode: t.mode,
        });
      }
    } else {
      const inv = item.data;
      if (inv.type === 'SALE') {
        // Sale invoice -> increases receivable
        running += inv.total;
        entries.push({
          id: inv.id,
          date: inv.date,
          time: '',
          type: 'INVOICE',
          description: `Sale Invoice #${inv.number}`,
          debit: 0,
          credit: inv.total,
          runningBalance: running,
          refId: inv.id,
        });
      } else if (inv.type === 'PURCHASE') {
        // Purchase bill -> increases payable
        running -= inv.total;
        entries.push({
          id: inv.id,
          date: inv.date,
          time: '',
          type: 'INVOICE',
          description: `Purchase Bill #${inv.number}`,
          debit: inv.total,
          credit: 0,
          runningBalance: running,
          refId: inv.id,
        });
      }
    }
  }

  return entries;
}

/**
 * Calculates current stock quantity for an Item based on movements
 */
export function calculateCurrentStock(
  item: Item,
  movements: StockMovement[]
): number {
  let stock = item.openingStock;
  const itemMovements = movements.filter((m) => m.itemId === item.id);

  for (const m of itemMovements) {
    if (m.direction === 'IN') {
      stock += m.qty;
    } else {
      stock -= m.qty;
    }
  }

  return stock;
}

/**
 * Computes Total Inventory Valuation (Paise) using purchase price
 */
export function calculateTotalStockValue(
  items: Item[],
  movements: StockMovement[]
): { totalValue: number; lowStockItems: Item[] } {
  let totalValue = 0;
  const lowStockItems: Item[] = [];

  for (const item of items.filter((i) => !i.isDeleted)) {
    const qty = calculateCurrentStock(item, movements);
    totalValue += qty * item.purchasePrice;
    if (qty <= item.minStock) {
      lowStockItems.push({ ...item, currentStock: qty });
    }
  }

  return { totalValue, lowStockItems };
}

/**
 * Profit and Loss Calculation for a given date range
 * Transfers are strictly excluded!
 */
export function calculateProfitAndLoss(
  transactions: Transaction[],
  invoices: Invoice[],
  startDate?: string,
  endDate?: string
): {
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  incomeCategories: Record<string, number>;
  expenseCategories: Record<string, number>;
} {
  const activeTxns = transactions.filter((t) => {
    if (t.isDeleted || t.type === 'TRANSFER') return false;
    if (startDate && t.date < startDate) return false;
    if (endDate && t.date > endDate) return false;
    return true;
  });

  let totalRevenue = 0;
  let totalExpense = 0;
  const incomeCategories: Record<string, number> = {};
  const expenseCategories: Record<string, number> = {};

  for (const t of activeTxns) {
    if (t.type === 'IN') {
      totalRevenue += t.amount;
      incomeCategories[t.category] = (incomeCategories[t.category] || 0) + t.amount;
    } else if (t.type === 'OUT') {
      totalExpense += t.amount;
      expenseCategories[t.category] = (expenseCategories[t.category] || 0) + t.amount;
    }
  }

  return {
    totalRevenue,
    totalExpense,
    netProfit: totalRevenue - totalExpense,
    incomeCategories,
    expenseCategories,
  };
}

/**
 * Aging analysis for Receivables and Payables (0-30 days, 31-60 days, 60+ days)
 */
export function calculateAgingBuckets(
  parties: Party[],
  transactions: Transaction[],
  invoices: Invoice[]
): {
  receivables: { current: number; bucket30: number; bucket60: number; bucket90Plus: number; total: number };
  payables: { current: number; bucket30: number; bucket60: number; bucket90Plus: number; total: number };
} {
  const today = new Date();
  
  let recCurrent = 0, rec30 = 0, rec60 = 0, rec90 = 0, recTotal = 0;
  let payCurrent = 0, pay30 = 0, pay60 = 0, pay90 = 0, payTotal = 0;

  for (const party of parties.filter((p) => !p.isDeleted)) {
    const net = calculatePartyNetBalance(party, transactions, invoices);
    if (net === 0) continue;

    // Estimate age based on last transaction or party creation date
    const partyTxns = transactions.filter((t) => !t.isDeleted && t.partyId === party.id);
    const lastDateStr = partyTxns.length > 0 ? partyTxns[partyTxns.length - 1].date : party.createdAt;
    const lastDate = new Date(lastDateStr);
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (net > 0) {
      recTotal += net;
      if (diffDays <= 30) recCurrent += net;
      else if (diffDays <= 60) rec30 += net;
      else if (diffDays <= 90) rec60 += net;
      else rec90 += net;
    } else {
      const absNet = Math.abs(net);
      payTotal += absNet;
      if (diffDays <= 30) payCurrent += absNet;
      else if (diffDays <= 60) pay30 += absNet;
      else if (diffDays <= 90) pay60 += absNet;
      else pay90 += absNet;
    }
  }

  return {
    receivables: { current: recCurrent, bucket30: rec30, bucket60: rec60, bucket90Plus: rec90, total: recTotal },
    payables: { current: payCurrent, bucket30: pay30, bucket60: pay60, bucket90Plus: pay90, total: payTotal },
  };
}
