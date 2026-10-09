/**
 * Ledgerly Excel Export Service
 * Exports professional Indian accounting statements, registers, and tax summaries to .xlsx
 */

import * as XLSX from 'xlsx';
import { Transaction, Account, Party, Item, LedgerEntry, Invoice } from '../types';
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

export function exportSaleRegisterToExcel(
  invoices: Invoice[],
  filename: string = 'ledgerly-sale-register.xlsx'
) {
  const data = invoices
    .filter((i) => i.type === 'SALE' || i.type === 'SALE_RETURN')
    .map((inv, idx) => ({
      'Sr No': idx + 1,
      'Date': inv.date,
      'Type': inv.type === 'SALE' ? 'Sale Invoice' : 'Sale Return',
      'Invoice No': inv.number,
      'Customer': inv.partyName,
      'State of Supply': inv.stateOfSupply || '—',
      'GST Mode': inv.withGst ? 'With GST' : 'Without GST',
      'Subtotal (₹)': paiseToRupees(inv.subtotal),
      'Discount (₹)': paiseToRupees(inv.discountTotal),
      'Taxable Value (₹)': paiseToRupees(inv.taxableAmount || inv.subtotal - inv.discountTotal),
      'CGST (₹)': paiseToRupees(inv.cgstTotal || 0),
      'SGST (₹)': paiseToRupees(inv.sgstTotal || 0),
      'IGST (₹)': paiseToRupees(inv.igstTotal || 0),
      'Total Tax (₹)': paiseToRupees(inv.taxTotal),
      'Round Off (₹)': paiseToRupees(inv.roundOff),
      'Grand Total (₹)': paiseToRupees(inv.total),
      'Paid Amount (₹)': paiseToRupees(inv.paidAmount),
      'Balance Due (₹)': paiseToRupees(Math.max(0, inv.total - inv.paidAmount)),
      'Status': inv.paidAmount >= inv.total ? 'Paid' : inv.paidAmount > 0 ? 'Partial' : 'Unpaid',
    }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sale Register');
  XLSX.writeFile(workbook, filename);
}

export function exportPurchaseRegisterToExcel(
  invoices: Invoice[],
  filename: string = 'ledgerly-purchase-register.xlsx'
) {
  const data = invoices
    .filter((i) => i.type === 'PURCHASE' || i.type === 'PURCHASE_RETURN')
    .map((inv, idx) => ({
      'Sr No': idx + 1,
      'Date': inv.date,
      'Type': inv.type === 'PURCHASE' ? 'Purchase Bill' : 'Purchase Return',
      'Bill No': inv.number,
      'Supplier': inv.partyName,
      'Subtotal (₹)': paiseToRupees(inv.subtotal),
      'Taxable (₹)': paiseToRupees(inv.taxableAmount || inv.subtotal - inv.discountTotal),
      'Total Tax (₹)': paiseToRupees(inv.taxTotal),
      'Grand Total (₹)': paiseToRupees(inv.total),
      'Paid (₹)': paiseToRupees(inv.paidAmount),
      'Balance Due (₹)': paiseToRupees(Math.max(0, inv.total - inv.paidAmount)),
      'Status': inv.paidAmount >= inv.total ? 'Paid' : inv.paidAmount > 0 ? 'Partial' : 'Unpaid',
    }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Register');
  XLSX.writeFile(workbook, filename);
}

export function exportGstSummaryToExcel(
  salesInvoices: Invoice[],
  purchaseInvoices: Invoice[],
  filename: string = 'ledgerly-gst-summary.xlsx'
) {
  // GSTR-1 Sales Summary
  const salesData = salesInvoices.map((inv, idx) => ({
    'Sr No': idx + 1,
    'Date': inv.date,
    'Invoice No': inv.number,
    'Party': inv.partyName,
    'Supply State': inv.stateOfSupply || '—',
    'Taxable (₹)': paiseToRupees(inv.taxableAmount || 0),
    'CGST (₹)': paiseToRupees(inv.cgstTotal || 0),
    'SGST (₹)': paiseToRupees(inv.sgstTotal || 0),
    'IGST (₹)': paiseToRupees(inv.igstTotal || 0),
    'Total Tax (₹)': paiseToRupees(inv.taxTotal),
    'Invoice Value (₹)': paiseToRupees(inv.total),
  }));

  // GSTR-3B Input Tax Credit
  const purchaseData = purchaseInvoices.map((inv, idx) => ({
    'Sr No': idx + 1,
    'Date': inv.date,
    'Bill No': inv.number,
    'Supplier': inv.partyName,
    'Taxable (₹)': paiseToRupees(inv.taxableAmount || 0),
    'CGST (ITC) (₹)': paiseToRupees(inv.cgstTotal || 0),
    'SGST (ITC) (₹)': paiseToRupees(inv.sgstTotal || 0),
    'IGST (ITC) (₹)': paiseToRupees(inv.igstTotal || 0),
    'Total ITC (₹)': paiseToRupees(inv.taxTotal),
    'Bill Value (₹)': paiseToRupees(inv.total),
  }));

  const workbook = XLSX.utils.book_new();
  const wsSales = XLSX.utils.json_to_sheet(salesData);
  const wsPurchase = XLSX.utils.json_to_sheet(purchaseData);

  XLSX.utils.book_append_sheet(workbook, wsSales, 'GSTR-1 (Outward)');
  XLSX.utils.book_append_sheet(workbook, wsPurchase, 'GSTR-3B (ITC)');
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
