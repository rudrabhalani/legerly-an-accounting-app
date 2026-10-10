import React, { useState, useMemo } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { BillWisePnlRow } from '../../types';
import {
  formatINR,
  formatDate,
  formatFullDate,
  getTodayDateString,
  paiseToRupees,
} from '../../utils/formatters';
import { generateBillWisePnlPdf } from '../../services/pdfService';
import * as XLSX from 'xlsx';
import {
  X,
  TrendingUp,
  Download,
  Share2,
  Filter,
  Search,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

export const BillWisePnlModal: React.FC = () => {
  const isOpen = useLedgerlyStore((state) => state.isBillWisePnlOpen);
  const closeBillWisePnl = useLedgerlyStore((state) => state.closeBillWisePnl);
  const invoices = useLedgerlyStore((state) => state.invoices);
  const items = useLedgerlyStore((state) => state.items);
  const parties = useLedgerlyStore((state) => state.parties);
  const business = useLedgerlyStore((state) => state.business);
  const openInvoiceScreen = useLedgerlyStore((state) => state.openInvoiceScreen);
  const openTransactionDetail = useLedgerlyStore((state) => state.openTransactionDetail);

  const [dateRangeFilter, setDateRangeFilter] = useState<'ALL' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [profitStatusFilter, setProfitStatusFilter] = useState<'ALL' | 'PROFIT_ONLY' | 'LOSS_ONLY'>('ALL');

  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  // Compute bill-wise P&L rows from real sale invoices
  const { rows, totalSale, totalCost, totalProfit, overallMargin } = useMemo(() => {
    const saleInvoices = invoices.filter((i) => !i.isDeleted && (i.type === 'SALE' || i.type === 'SALE_RETURN'));

    let runningSale = 0;
    let runningCost = 0;
    let runningProfit = 0;

    const computedRows: BillWisePnlRow[] = [];

    for (const inv of saleInvoices) {
      // 1. Date filter
      if (dateRangeFilter === 'THIS_MONTH') {
        const currentMonth = new Date().toISOString().substring(0, 7);
        if (!inv.date.startsWith(currentMonth)) continue;
      } else if (dateRangeFilter === 'CUSTOM') {
        if (startDate && inv.date < startDate) continue;
        if (endDate && inv.date > endDate) continue;
      }

      // 2. Customer filter
      if (customerFilter.trim()) {
        const q = customerFilter.toLowerCase().trim();
        if (!inv.partyName.toLowerCase().includes(q)) continue;
      }

      // Compute cost amount from invoice line items
      let invoiceCost = 0;
      for (const line of inv.lines) {
        const matchedItem = itemMap.get(line.itemId);
        // Cost is purchase price from item master if available, otherwise 75% standard baseline
        const unitCost = matchedItem?.purchasePrice || Math.round(line.rate * 0.75);
        invoiceCost += Math.round(unitCost * line.qty);
      }

      const saleAmt = inv.type === 'SALE_RETURN' ? -inv.total : inv.total;
      const costAmt = inv.type === 'SALE_RETURN' ? -invoiceCost : invoiceCost;
      const profit = saleAmt - costAmt;
      const margin = saleAmt !== 0 ? (profit / Math.abs(saleAmt)) * 100 : 0;

      // 3. Profit/Loss filter
      if (profitStatusFilter === 'PROFIT_ONLY' && profit <= 0) continue;
      if (profitStatusFilter === 'LOSS_ONLY' && profit >= 0) continue;

      runningSale += saleAmt;
      runningCost += costAmt;
      runningProfit += profit;

      computedRows.push({
        invoiceId: inv.id,
        billNumber: inv.number,
        date: inv.date,
        customerName: inv.partyName,
        customerId: inv.partyId,
        saleAmount: saleAmt,
        costAmount: costAmt,
        profitAmount: profit,
        marginPercent: margin,
        status: inv.status,
      });
    }

    // Sort by date descending
    computedRows.sort((a, b) => b.date.localeCompare(a.date));

    const avgMargin = runningSale !== 0 ? (runningProfit / Math.abs(runningSale)) * 100 : 0;

    return {
      rows: computedRows,
      totalSale: runningSale,
      totalCost: runningCost,
      totalProfit: runningProfit,
      overallMargin: avgMargin,
    };
  }, [invoices, itemMap, dateRangeFilter, startDate, endDate, customerFilter, profitStatusFilter]);

  if (!isOpen) return null;

  const handleExportPdf = () => {
    const doc = generateBillWisePnlPdf(rows, business, dateRangeFilter === 'ALL' ? 'All Time' : `${startDate} to ${endDate}`);
    doc.save(`BillWise_PnL_${Date.now()}.pdf`);
  };

  const handleExportCsv = () => {
    const data = rows.map((r) => ({
      'Bill No': r.billNumber,
      Date: r.date,
      Customer: r.customerName,
      'Sale Amount (Rs)': (r.saleAmount / 100).toFixed(2),
      'Cost Amount (Rs)': (r.costAmount / 100).toFixed(2),
      'Gross Profit (Rs)': (r.profitAmount / 100).toFixed(2),
      'Margin %': `${r.marginPercent.toFixed(1)}%`,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bill Wise PnL');
    XLSX.writeFile(wb, `BillWise_PnL_${Date.now()}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[94vh] overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">Bill-Wise Profit & Loss</h2>
              <p className="text-xs text-slate-500">Invoice Profitability & Margin Analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-xs"
              title="Download Excel / CSV"
            >
              <FileSpreadsheet size={14} className="text-emerald-700" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-xs"
              title="Download PDF"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
            <button
              type="button"
              onClick={closeBillWisePnl}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['ALL', 'THIS_MONTH', 'CUSTOM'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDateRangeFilter(mode)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    dateRangeFilter === mode ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode === 'ALL' ? 'All Time' : mode === 'THIS_MONTH' ? 'This Month' : 'Custom'}
                </button>
              ))}
            </div>

            {dateRangeFilter === 'CUSTOM' && (
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-slate-300 text-xs"
                />
                <span>-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-slate-300 text-xs"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Customer search */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                placeholder="Filter customer..."
                className="pl-8 pr-3 py-1 rounded-xl border border-slate-300 text-xs w-36 sm:w-44 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Profit only / Loss only toggle */}
            <select
              value={profitStatusFilter}
              onChange={(e) => setProfitStatusFilter(e.target.value as any)}
              className="px-2.5 py-1 rounded-xl border border-slate-300 bg-slate-50 font-bold text-xs"
            >
              <option value="ALL">All Bills</option>
              <option value="PROFIT_ONLY">Profit Only (+)</option>
              <option value="LOSS_ONLY">Loss Only (-)</option>
            </select>
          </div>
        </div>

        {/* Summary Totals Bar */}
        <div className="p-3 sm:p-4 bg-slate-50/70 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Sales</span>
            <span className="text-sm sm:text-base font-bold text-slate-900">{formatINR(totalSale)}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Cost of Goods</span>
            <span className="text-sm sm:text-base font-bold text-slate-600">{formatINR(totalCost)}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-600 uppercase block">Total Gross Profit</span>
            <span className={`text-sm sm:text-base font-bold ${totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatINR(totalProfit)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-blue-200">
            <span className="text-[10px] font-bold text-blue-600 uppercase block">Average Margin %</span>
            <span className="text-sm sm:text-base font-bold text-blue-600">
              {overallMargin.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Table List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {rows.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <TrendingUp size={36} className="mx-auto mb-2 opacity-40 text-slate-500" />
              <p className="font-bold text-slate-600 text-sm">No bills matching the selected filter</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="hidden sm:grid grid-cols-12 text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                <span className="col-span-2">Bill No & Date</span>
                <span className="col-span-3">Customer</span>
                <span className="col-span-2 text-right">Sale Amount</span>
                <span className="col-span-2 text-right">Cost</span>
                <span className="col-span-2 text-right">Gross Profit</span>
                <span className="col-span-1 text-center">Margin</span>
              </div>

              {rows.map((row) => (
                <div
                  key={row.invoiceId}
                  onClick={() => openTransactionDetail(undefined, row.invoiceId)}
                  className="p-3 sm:px-3 sm:py-2.5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-400 transition-all cursor-pointer flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center gap-1 sm:gap-0"
                >
                  <div className="col-span-2">
                    <span className="font-bold text-xs text-slate-900 block">#{row.billNumber}</span>
                    <span className="text-[10px] text-slate-500">{row.date}</span>
                  </div>

                  <div className="col-span-3 min-w-0">
                    <span className="font-bold text-xs text-slate-800 truncate block">{row.customerName}</span>
                  </div>

                  <div className="col-span-2 sm:text-right font-bold text-xs text-slate-900 tabular-nums">
                    {formatINR(row.saleAmount)}
                  </div>

                  <div className="col-span-2 sm:text-right text-xs text-slate-500 tabular-nums">
                    {formatINR(row.costAmount)}
                  </div>

                  <div className={`col-span-2 sm:text-right font-bold text-xs tabular-nums ${row.profitAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {row.profitAmount >= 0 ? `+${formatINR(row.profitAmount)}` : formatINR(row.profitAmount)}
                  </div>

                  <div className="col-span-1 sm:text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${row.marginPercent >= 15 ? 'bg-emerald-100 text-emerald-800' : row.marginPercent >= 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                      {row.marginPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Bills Displayed: <strong>{rows.length}</strong></span>
          <button
            type="button"
            onClick={closeBillWisePnl}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
