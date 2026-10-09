/**
 * Ledgerly Excel & CSV Export Service
 * Exports accounting statements, day books, and stock valuations to .xlsx
 */

import * as XLSX from 'xlsx';
import { Transaction, Account, Party, Item, LedgerEntry } from '../types';
import { paiseToRupees } from '../utils/formatters';

export function exportTransactionsToExcel(
  transactions: Transaction[],
  accounts: Account[],
  parties: Party[],
  filename: string = 'ledgerly-transactions.xlsx'
) {
  const accountMap = new Map(accounts.map((a) => [a.id, a.nickname]));
  const partyMap = new Map(parties.map((p) => [p.id, p.name]));

  const data = transactions.map((t, idx) => ({
    'Sr No': idx + 1,
    'Date': t.date,
    'Time': t.time,
    'Type': t.type === 'IN' ? 'Money In' : t.type === 'OUT' ? 'Money Out' : 'Transfer',
    'Category': t.category,
    'Party': t.partyId ? partyMap.get(t.partyId) || '—' : '—',
    'Account': accountMap.get(t.accountId) || 'Cash / Bank',
    'Mode': t.mode,
    'Amount (₹)': paiseToRupees(t.amount),
    'Notes': t.note || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
  XLSX.writeFile(workbook, filename);
}

export function exportPartyLedgerToExcel(
  party: Party,
  entries: LedgerEntry[],
  filename?: string
) {
  const data = entries.map((e, idx) => ({
    'Sr No': idx + 1,
    'Date': e.date,
    'Description': e.description,
    'Debit / Paid (₹)': e.debit > 0 ? paiseToRupees(e.debit) : '',
    'Credit / Received (₹)': e.credit > 0 ? paiseToRupees(e.credit) : '',
    'Running Balance (₹)': paiseToRupees(e.runningBalance),
    'Balance Status': e.runningBalance >= 0 ? "You'll get (Dr)" : "You'll give (Cr)",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Party Ledger');
  XLSX.writeFile(workbook, filename || `${party.name.replace(/\s+/g, '_')}_ledger.xlsx`);
}

export function exportStockToExcel(
  items: Item[],
  filename: string = 'ledgerly-inventory.xlsx'
) {
  const data = items.map((i, idx) => ({
    'Sr No': idx + 1,
    'Item Name': i.name,
    'Category': i.category,
    'Unit': i.unit,
    'Current Stock': i.currentStock,
    'Min Alert Stock': i.minStock,
    'Sale Price (₹)': paiseToRupees(i.salePrice),
    'Purchase Price (₹)': paiseToRupees(i.purchasePrice),
    'Total Stock Value (₹)': paiseToRupees(i.currentStock * i.purchasePrice),
    'Status': i.currentStock <= i.minStock ? 'LOW STOCK' : 'IN STOCK',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
  XLSX.writeFile(workbook, filename);
}
