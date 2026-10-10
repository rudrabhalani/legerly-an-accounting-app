import React, { useState } from 'react';
import { useLedgerlyStore } from '../store/useLedgerlyStore';
import { getTranslation } from '../i18n/translations';
import {
  calculateTotalBalance,
  calculateProfitAndLoss,
  calculateReceivablesAndPayables,
  calculateTotalStockValue,
} from '../utils/accounting';
import { formatINR, paiseToRupees, formatDate, formatFullDate } from '../utils/formatters';
import {
  exportTransactionsToExcel,
  exportSaleRegisterToExcel,
  exportPurchaseRegisterToExcel,
  exportGstSummaryToExcel,
  exportStockToExcel,
} from '../services/excelService';
import { generateRegisterPdf } from '../services/pdfService';
import {
  BarChart3,
  TrendingUp,
  Receipt,
  ShoppingCart,
  Percent,
  Boxes,
  Calendar,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Clock,
  BookOpen,
  Scale,
} from 'lucide-react';

export const ReportsScreen: React.FC = () => {
  const transactions = useLedgerlyStore((state) => state.transactions);
  const accounts = useLedgerlyStore((state) => state.accounts);
  const parties = useLedgerlyStore((state) => state.parties);
  const items = useLedgerlyStore((state) => state.items);
  const stockMovements = useLedgerlyStore((state) => state.stockMovements);
  const invoices = useLedgerlyStore((state) => state.invoices);
  const expenses = useLedgerlyStore((state) => state.expenses);
  const business = useLedgerlyStore((state) => state.business);
  const activeFY = useLedgerlyStore((state) => state.activeFinancialYear);
  const financialYears = useLedgerlyStore((state) => state.financialYears);
  const setActiveFinancialYear = useLedgerlyStore((state) => state.setActiveFinancialYear);
  const openBalanceSheet = useLedgerlyStore((state) => state.openBalanceSheet);
  const openBillWisePnl = useLedgerlyStore((state) => state.openBillWisePnl);
  const openDayBook = useLedgerlyStore((state) => state.openDayBook);
  const language = useLedgerlyStore((state) => state.business.language);
  const t = getTranslation(language);

  const [activeReport, setActiveReport] = useState<
    'SALE_REG' | 'PURCHASE_REG' | 'GST_SUMMARY' | 'STOCK_SUM' | 'PNL' | 'DAY_BOOK'
  >('SALE_REG');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter invoices by FY and Date
  const activeInvoices = invoices.filter((i) => {
    if (i.isDeleted) return false;
    if (i.financialYear && i.financialYear !== activeFY) return false;
    if (startDate && i.date < startDate) return false;
    if (endDate && i.date > endDate) return false;
    return true;
  });

  const saleInvoices = activeInvoices.filter((i) => i.type === 'SALE' || i.type === 'SALE_RETURN');
  const purchaseInvoices = activeInvoices.filter((i) => i.type === 'PURCHASE' || i.type === 'PURCHASE_RETURN');

  const activeTxns = transactions.filter((t) => {
    if (t.isDeleted) return false;
    if (startDate && t.date < startDate) return false;
    if (endDate && t.date > endDate) return false;
    return true;
  });

  const pnl = calculateProfitAndLoss(activeTxns, activeInvoices);
  const { totalValue, lowStockItems } = calculateTotalStockValue(items, stockMovements);
  const { toReceive, toPay } = calculateReceivablesAndPayables(parties, transactions, invoices);

  // GST Calculation Totals
  const gstOutwardTaxable = saleInvoices.reduce((acc, i) => acc + (i.taxableAmount || (i.subtotal - i.discountTotal)), 0);
  const gstOutwardTax = saleInvoices.reduce((acc, i) => acc + i.taxTotal, 0);
  const gstOutwardCgst = saleInvoices.reduce((acc, i) => acc + (i.cgstTotal || 0), 0);
  const gstOutwardSgst = saleInvoices.reduce((acc, i) => acc + (i.sgstTotal || 0), 0);
  const gstOutwardIgst = saleInvoices.reduce((acc, i) => acc + (i.igstTotal || 0), 0);

  const gstInwardTaxable = purchaseInvoices.reduce((acc, i) => acc + (i.taxableAmount || (i.subtotal - i.discountTotal)), 0);
  const gstInwardTax = purchaseInvoices.reduce((acc, i) => acc + i.taxTotal, 0);

  const netGstPayable = gstOutwardTax - gstInwardTax;

  // Day Book grouping
  const dayBookMap = new Map<string, typeof activeTxns>();
  for (const txn of activeTxns) {
    const list = dayBookMap.get(txn.date) || [];
    list.push(txn);
    dayBookMap.set(txn.date, list);
  }
  const dayBookDates = Array.from(dayBookMap.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-4 pb-28 pt-2">
      {/* Top Controls: FY Selector & Date Filter */}
      <div className="p-3 bg-white rounded-2xl border border-border shadow-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            <span className="text-xs font-bold text-slate-primary">Financial Year:</span>
            <select
              value={activeFY}
              onChange={(e) => setActiveFinancialYear(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-border bg-surface-subtle text-xs font-bold text-slate-primary"
            >
              {financialYears.map((fy) => (
                <option key={fy} value={fy}>
                  FY {fy}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 px-2 rounded-lg border border-border text-[11px] font-semibold text-slate-secondary"
              placeholder="From"
            />
            <span className="text-slate-muted">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 px-2 rounded-lg border border-border text-[11px] font-semibold text-slate-secondary"
              placeholder="To"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-[11px] text-rose-600 font-bold hover:underline ml-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { key: 'SALE_REG' as const, label: 'Sale Register', icon: Receipt },
          { key: 'PURCHASE_REG' as const, label: 'Purchase Register', icon: ShoppingCart },
          { key: 'GST_SUMMARY' as const, label: 'GST Summary', icon: Percent },
          { key: 'STOCK_SUM' as const, label: 'Stock Summary', icon: Boxes },
          { key: 'PNL' as const, label: 'Profit & Loss', icon: TrendingUp },
          { key: 'DAY_BOOK' as const, label: 'Daily Day Book', icon: BookOpen },
        ].map((rep) => {
          const Icon = rep.icon;
          return (
            <button
              key={rep.key}
              type="button"
              onClick={() => setActiveReport(rep.key)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all border ${
                activeReport === rep.key
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-white text-slate-primary border-border hover:border-slate-muted'
              }`}
            >
              <Icon size={14} />
              <span>{rep.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={openBalanceSheet}
          className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all border bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
        >
          <Scale size={14} />
          <span>Balance Sheet ↗</span>
        </button>
        <button
          type="button"
          onClick={openBillWisePnl}
          className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all border bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
        >
          <TrendingUp size={14} />
          <span>Bill-wise P&L ↗</span>
        </button>
      </div>

      {/* 1. SALE REGISTER */}
      {activeReport === 'SALE_REG' && (
        <div className="p-4 rounded-card bg-white border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-slate-primary">Sale Register</h3>
              <span className="text-xs text-slate-secondary">
                {saleInvoices.length} invoices in FY {activeFY}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportSaleRegisterToExcel(saleInvoices)}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1"
              >
                <FileSpreadsheet size={14} />
                <span>Excel</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const doc = generateRegisterPdf('Sale Register', saleInvoices, business);
                  doc.save(`Sale_Register_${activeFY}.pdf`);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-primary border border-indigo-200 text-xs font-bold flex items-center gap-1"
              >
                <Download size={14} />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {saleInvoices.length === 0 ? (
            <p className="text-xs text-slate-secondary py-6 text-center">No sales recorded for this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-slate-secondary font-bold">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Invoice #</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2 text-right">Tax (₹)</th>
                    <th className="pb-2 text-right">Total (₹)</th>
                    <th className="pb-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {saleInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-surface-subtle">
                      <td className="py-2.5 font-medium text-slate-secondary">{formatDate(inv.date)}</td>
                      <td className="py-2.5 font-bold text-primary">{inv.number}</td>
                      <td className="py-2.5 font-bold text-slate-primary">{inv.partyName}</td>
                      <td className="py-2.5 text-right font-medium">{formatINR(inv.taxTotal)}</td>
                      <td className="py-2.5 text-right font-extrabold text-slate-primary">{formatINR(inv.total)}</td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.paidAmount >= inv.total
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.paidAmount > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.paidAmount >= inv.total ? 'Paid' : inv.paidAmount > 0 ? 'Partial' : 'Unpaid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. PURCHASE REGISTER */}
      {activeReport === 'PURCHASE_REG' && (
        <div className="p-4 rounded-card bg-white border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-slate-primary">Purchase Register</h3>
              <span className="text-xs text-slate-secondary">
                {purchaseInvoices.length} bills in FY {activeFY}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportPurchaseRegisterToExcel(purchaseInvoices)}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1"
              >
                <FileSpreadsheet size={14} />
                <span>Excel</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const doc = generateRegisterPdf('Purchase Register', purchaseInvoices, business);
                  doc.save(`Purchase_Register_${activeFY}.pdf`);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-primary border border-indigo-200 text-xs font-bold flex items-center gap-1"
              >
                <Download size={14} />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {purchaseInvoices.length === 0 ? (
            <p className="text-xs text-slate-secondary py-6 text-center">No purchases recorded for this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-slate-secondary font-bold">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Bill #</th>
                    <th className="pb-2">Supplier</th>
                    <th className="pb-2 text-right">Tax (₹)</th>
                    <th className="pb-2 text-right">Total (₹)</th>
                    <th className="pb-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {purchaseInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-surface-subtle">
                      <td className="py-2.5 font-medium text-slate-secondary">{formatDate(inv.date)}</td>
                      <td className="py-2.5 font-bold text-slate-primary">{inv.number}</td>
                      <td className="py-2.5 font-bold text-slate-primary">{inv.partyName}</td>
                      <td className="py-2.5 text-right font-medium">{formatINR(inv.taxTotal)}</td>
                      <td className="py-2.5 text-right font-extrabold text-slate-primary">{formatINR(inv.total)}</td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.paidAmount >= inv.total
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.paidAmount > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.paidAmount >= inv.total ? 'Paid' : inv.paidAmount > 0 ? 'Partial' : 'Unpaid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. GST SUMMARY (GSTR-1 & GSTR-3B) */}
      {activeReport === 'GST_SUMMARY' && (
        <div className="p-4 rounded-card bg-white border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-slate-primary">GST Tax Summary</h3>
              <span className="text-xs text-slate-secondary">GSTR-1 Sales & GSTR-3B ITC Comparison</span>
            </div>
            <button
              type="button"
              onClick={() => exportGstSummaryToExcel(saleInvoices, purchaseInvoices)}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1"
            >
              <FileSpreadsheet size={14} />
              <span>Export GST Excel</span>
            </button>
          </div>

          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200">
              <span className="text-[11px] font-bold text-indigo-900 uppercase">Output Tax (Sales)</span>
              <span className="text-xl font-extrabold text-primary block mt-1">{formatINR(gstOutwardTax)}</span>
              <span className="text-[10px] text-indigo-700">Taxable: {formatINR(gstOutwardTaxable)}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-900 uppercase">Input Tax Credit (Purchases)</span>
              <span className="text-xl font-extrabold text-emerald-700 block mt-1">{formatINR(gstInwardTax)}</span>
              <span className="text-[10px] text-emerald-700">Taxable: {formatINR(gstInwardTaxable)}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border">
              <span className="text-[11px] font-bold text-slate-primary uppercase">Net GST Payable / (Credit)</span>
              <span
                className={`text-xl font-extrabold block mt-1 ${
                  netGstPayable >= 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {netGstPayable >= 0 ? formatINR(netGstPayable) : `Credit ${formatINR(Math.abs(netGstPayable))}`}
              </span>
              <span className="text-[10px] text-slate-secondary">Output Tax − Input Credit</span>
            </div>
          </div>

          {/* Tax Breakdown Table */}
          <div className="p-3 bg-surface-subtle/50 rounded-2xl border border-border space-y-2 text-xs">
            <h4 className="font-bold text-slate-primary">Outward Tax Breakup (GSTR-1)</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-white rounded-xl border border-border">
                <span className="text-[10px] text-slate-secondary block">CGST</span>
                <span className="font-extrabold text-slate-primary">{formatINR(gstOutwardCgst)}</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-border">
                <span className="text-[10px] text-slate-secondary block">SGST</span>
                <span className="font-extrabold text-slate-primary">{formatINR(gstOutwardSgst)}</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-border">
                <span className="text-[10px] text-slate-secondary block">IGST</span>
                <span className="font-extrabold text-slate-primary">{formatINR(gstOutwardIgst)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. STOCK SUMMARY */}
      {activeReport === 'STOCK_SUM' && (
        <div className="p-4 rounded-card bg-white border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-slate-primary">Stock & Inventory Valuation</h3>
              <span className="text-xs text-slate-secondary">
                Total Stock Value: {formatINR(totalValue)} • {items.length} items
              </span>
            </div>
            <button
              type="button"
              onClick={() => exportStockToExcel(items)}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1"
            >
              <FileSpreadsheet size={14} />
              <span>Export Inventory</span>
            </button>
          </div>

          {lowStockItems.length > 0 && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
              <span>
                {lowStockItems.length} items are currently at or below minimum alert stock level!
              </span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-slate-secondary font-bold">
                  <th className="pb-2">Item Name</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2 text-right">Current Stock</th>
                  <th className="pb-2 text-right">Sale Price (₹)</th>
                  <th className="pb-2 text-right">Stock Value (₹)</th>
                  <th className="pb-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items
                  .filter((i) => !i.isDeleted)
                  .map((it) => {
                    const isLow = it.currentStock <= (it.minStock || 0);
                    return (
                      <tr key={it.id} className="hover:bg-surface-subtle">
                        <td className="py-2.5 font-bold text-slate-primary">{it.name}</td>
                        <td className="py-2.5 text-slate-secondary">{it.category}</td>
                        <td className="py-2.5 text-right font-extrabold text-slate-primary">
                          {it.currentStock} {it.unit}
                        </td>
                        <td className="py-2.5 text-right font-medium">{formatINR(it.salePrice)}</td>
                        <td className="py-2.5 text-right font-extrabold text-primary">
                          {formatINR(it.currentStock * it.purchasePrice)}
                        </td>
                        <td className="py-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isLow ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isLow ? 'LOW STOCK' : 'IN STOCK'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. PROFIT & LOSS */}
      {activeReport === 'PNL' && (
        <div className="p-4 rounded-card bg-white border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-slate-primary">Profit & Loss Statement</h3>
              <span className="text-xs text-slate-secondary">FY {activeFY} Overview</span>
            </div>
            <button
              type="button"
              onClick={() => exportTransactionsToExcel(transactions, accounts, parties)}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1"
            >
              <FileSpreadsheet size={14} />
              <span>Export P&L</span>
            </button>
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              pnl.netProfit >= 0
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/70 border-rose-200 text-rose-900'
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider block opacity-80">
              {pnl.netProfit >= 0 ? 'Net Operating Profit' : 'Net Operating Loss'}
            </span>
            <span className="text-3xl font-extrabold tabular-nums block mt-1">
              {formatINR(pnl.netProfit)}
            </span>
          </div>

          <div className="divide-y divide-border text-xs space-y-2">
            <div className="flex justify-between py-2">
              <span className="font-semibold text-slate-secondary">Total Inflow / Revenue</span>
              <span className="font-bold text-emerald-600">+{formatINR(pnl.totalRevenue)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-semibold text-slate-secondary">Total Outflow / Direct Expenses</span>
              <span className="font-bold text-rose-600">−{formatINR(pnl.totalExpense)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-semibold text-slate-secondary">Net Profit / Loss</span>
              <span className={`font-bold ${pnl.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatINR(pnl.netProfit)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 6. DAILY DAY BOOK */}
      {activeReport === 'DAY_BOOK' && (
        <div className="p-4 rounded-card bg-white border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-slate-primary">Daily Day Book</h3>
              <span className="text-xs text-slate-secondary">Chronological cash & bank inflow/outflow</span>
            </div>
            <button
              type="button"
              onClick={() => exportTransactionsToExcel(transactions, accounts, parties)}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1"
            >
              <FileSpreadsheet size={14} />
              <span>Export Day Book</span>
            </button>
          </div>

          {dayBookDates.length === 0 ? (
            <p className="text-xs text-slate-secondary py-6 text-center">No transactions recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {dayBookDates.map((dStr) => {
                const txns = dayBookMap.get(dStr) || [];
                const inTotal = txns.filter((t) => t.type === 'IN').reduce((acc, t) => acc + t.amount, 0);
                const outTotal = txns.filter((t) => t.type === 'OUT').reduce((acc, t) => acc + t.amount, 0);

                return (
                  <div key={dStr} className="p-3 bg-surface-subtle/50 rounded-2xl border border-border space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-primary border-b border-border/60 pb-1.5">
                      <span>{formatFullDate(dStr)}</span>
                      <div className="flex gap-3 text-[11px]">
                        <span className="text-moneyIn font-extrabold">In: +{formatINR(inTotal)}</span>
                        <span className="text-moneyOut font-extrabold">Out: −{formatINR(outTotal)}</span>
                      </div>
                    </div>

                    <div className="divide-y divide-border/40">
                      {txns.map((t) => (
                        <div key={t.id} className="py-2 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-primary block">{t.category}</span>
                            <span className="text-[10px] text-slate-secondary">
                              {t.mode} {t.note ? `• ${t.note}` : ''}
                            </span>
                          </div>
                          <span
                            className={`font-extrabold ${
                              t.type === 'IN' ? 'text-moneyIn' : 'text-moneyOut'
                            }`}
                          >
                            {t.type === 'IN' ? '+' : '−'}
                            {formatINR(t.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
