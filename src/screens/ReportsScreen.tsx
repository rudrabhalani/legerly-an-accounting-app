import React, { useState } from 'react';
import { useLedgerlyStore } from '../store/useLedgerlyStore';
import { getTranslation } from '../i18n/translations';
import {
  calculateTotalBalance,
  calculateProfitAndLoss,
  calculateReceivablesAndPayables,
  calculateAgingBuckets,
  calculateTotalStockValue,
} from '../utils/accounting';
import { formatINR, paiseToRupees } from '../utils/formatters';
import { exportTransactionsToExcel, exportStockToExcel } from '../services/excelService';
import {
  BarChart3,
  BookOpen,
  PieChart,
  Calendar,
  FileSpreadsheet,
  Download,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Landmark,
  ShieldAlert,
} from 'lucide-react';

export const ReportsScreen: React.FC = () => {
  const transactions = useLedgerlyStore((state) => state.transactions);
  const accounts = useLedgerlyStore((state) => state.accounts);
  const parties = useLedgerlyStore((state) => state.parties);
  const items = useLedgerlyStore((state) => state.items);
  const stockMovements = useLedgerlyStore((state) => state.stockMovements);
  const invoices = useLedgerlyStore((state) => state.invoices);
  const business = useLedgerlyStore((state) => state.business);
  const language = useLedgerlyStore((state) => state.business.language);
  const t = getTranslation(language);

  const [activeReport, setActiveReport] = useState<
    'PNL' | 'DAY_BOOK' | 'AGING' | 'BALANCE_SHEET' | 'EXPENSES'
  >('PNL');

  const activeTxns = transactions.filter((t) => !t.isDeleted);
  const pnl = calculateProfitAndLoss(activeTxns, invoices);
  const { total, cashTotal, bankTotal } = calculateTotalBalance(accounts, transactions);
  const { toReceive, toPay } = calculateReceivablesAndPayables(parties, transactions, invoices);
  const { totalValue } = calculateTotalStockValue(items, stockMovements);
  const aging = calculateAgingBuckets(parties, transactions, invoices);

  // Group transactions by date for Day Book
  const dayBookMap = new Map<string, typeof activeTxns>();
  for (const txn of activeTxns) {
    const list = dayBookMap.get(txn.date) || [];
    list.push(txn);
    dayBookMap.set(txn.date, list);
  }
  const dayBookDates = Array.from(dayBookMap.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-4 pb-24 pt-2">
      {/* Top Navigation Tabs for Reports */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { key: 'PNL' as const, label: 'Profit & Loss', icon: TrendingUp },
          { key: 'DAY_BOOK' as const, label: 'Day Book', icon: BookOpen },
          { key: 'AGING' as const, label: 'Aging (Receivables)', icon: Clock },
          { key: 'BALANCE_SHEET' as const, label: 'Balance Sheet', icon: Landmark },
          { key: 'EXPENSES' as const, label: 'Expense Categories', icon: PieChart },
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
      </div>

      {/* REPORT 1: PROFIT & LOSS */}
      {activeReport === 'PNL' && (
        <div className="space-y-3">
          <div className="p-4 rounded-card bg-white border border-border shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-slate-primary">Profit & Loss Statement</h3>
                <span className="text-xs text-slate-secondary">Financial Year 2026-2027</span>
              </div>
              <button
                type="button"
                onClick={() => exportTransactionsToExcel(transactions, accounts, parties)}
                className="p-2 rounded-xl bg-surface-subtle hover:bg-slate-200/60 text-emerald-800 border border-border"
                title="Export Excel"
              >
                <FileSpreadsheet size={16} />
              </button>
            </div>

            {/* Net Profit Banner */}
            <div
              className={`p-4 rounded-2xl border ${
                pnl.netProfit >= 0
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50/70 border-rose-200 text-rose-900'
              }`}
            >
              <span className="text-xs font-semibold uppercase tracking-wider block opacity-80">
                {pnl.netProfit >= 0 ? 'Net Operating Profit' : 'Net Operating Loss'}
              </span>
              <span className="text-3xl font-extrabold tabular-nums block mt-1">
                {formatINR(pnl.netProfit)}
              </span>
              <span className="text-[11px] opacity-80 mt-1 block">
                Total Income: {formatINR(pnl.totalRevenue)} • Total Expenses: {formatINR(pnl.totalExpense)}
              </span>
            </div>

            {/* Breakdown Lists */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Income */}
              <div className="p-3 rounded-2xl bg-surface-subtle border border-border space-y-2">
                <span className="text-xs font-bold text-moneyIn-dark uppercase block">
                  Income Breakdown
                </span>
                <div className="space-y-1.5 text-xs">
                  {Object.entries(pnl.incomeCategories).map(([cat, val]) => (
                    <div key={cat} className="flex justify-between items-center py-1 border-b border-border/50">
                      <span className="text-slate-primary font-medium">{cat}</span>
                      <span className="font-bold text-moneyIn tabular-nums">+{formatINR(val)}</span>
                    </div>
                  ))}
                  {Object.keys(pnl.incomeCategories).length === 0 && (
                    <span className="text-xs text-slate-muted">No income recorded</span>
                  )}
                </div>
              </div>

              {/* Expenses */}
              <div className="p-3 rounded-2xl bg-surface-subtle border border-border space-y-2">
                <span className="text-xs font-bold text-moneyOut-dark uppercase block">
                  Expense Breakdown
                </span>
                <div className="space-y-1.5 text-xs">
                  {Object.entries(pnl.expenseCategories).map(([cat, val]) => (
                    <div key={cat} className="flex justify-between items-center py-1 border-b border-border/50">
                      <span className="text-slate-primary font-medium">{cat}</span>
                      <span className="font-bold text-moneyOut tabular-nums">−{formatINR(val)}</span>
                    </div>
                  ))}
                  {Object.keys(pnl.expenseCategories).length === 0 && (
                    <span className="text-xs text-slate-muted">No expenses recorded</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: DAY BOOK */}
      {activeReport === 'DAY_BOOK' && (
        <div className="space-y-3">
          <div className="p-4 rounded-card bg-white border border-border shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-primary">Day Book (Daily Ledger)</h3>
                <span className="text-xs text-slate-secondary">Chronological daily receipts & payments</span>
              </div>
              <button
                type="button"
                onClick={() => exportTransactionsToExcel(transactions, accounts, parties)}
                className="p-2 rounded-xl bg-surface-subtle text-emerald-800 border border-border"
              >
                <FileSpreadsheet size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {dayBookDates.map((dateStr) => {
                const dayTxns = dayBookMap.get(dateStr) || [];
                let dayIn = 0;
                let dayOut = 0;
                for (const t of dayTxns) {
                  if (t.type === 'IN') dayIn += t.amount;
                  if (t.type === 'OUT') dayOut += t.amount;
                }

                return (
                  <div key={dateStr} className="rounded-2xl border border-border overflow-hidden">
                    <div className="bg-surface-subtle px-3 py-2 border-b border-border flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-primary">{dateStr}</span>
                      <div className="flex items-center gap-2 font-bold tabular-nums">
                        <span className="text-moneyIn">+{formatINR(dayIn)}</span>
                        <span>•</span>
                        <span className="text-moneyOut">−{formatINR(dayOut)}</span>
                      </div>
                    </div>

                    <div className="divide-y divide-border/60 bg-white p-2">
                      {dayTxns.map((t) => (
                        <div key={t.id} className="py-2 px-1 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-primary">{t.category}</span>
                            <span className="text-[11px] text-slate-secondary block">
                              {t.time} • {t.mode} {t.note ? `• ${t.note}` : ''}
                            </span>
                          </div>
                          <span
                            className={`font-bold tabular-nums ${
                              t.type === 'IN'
                                ? 'text-moneyIn'
                                : t.type === 'OUT'
                                ? 'text-moneyOut'
                                : 'text-primary'
                            }`}
                          >
                            {t.type === 'IN' ? '+' : t.type === 'OUT' ? '−' : ''}
                            {formatINR(t.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: AGING (RECEIVABLES & PAYABLES) */}
      {activeReport === 'AGING' && (
        <div className="p-4 rounded-card bg-white border border-border shadow-card space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-primary">Receivables & Payables Aging</h3>
            <span className="text-xs text-slate-secondary">Credit tenure tracking (0-30, 31-60, 60+ days)</span>
          </div>

          <div className="space-y-3">
            {/* Customer Receivables Aging */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
              <span className="text-xs font-bold text-emerald-900 uppercase block">
                Customer Receivables ({formatINR(aging.receivables.total)})
              </span>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-xl bg-white border border-emerald-200">
                  <span className="text-[10px] text-slate-secondary block">0-30 Days</span>
                  <span className="text-xs font-bold text-slate-primary tabular-nums mt-0.5 block">
                    {formatINR(aging.receivables.current)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-emerald-200">
                  <span className="text-[10px] text-slate-secondary block">31-60 Days</span>
                  <span className="text-xs font-bold text-slate-primary tabular-nums mt-0.5 block">
                    {formatINR(aging.receivables.bucket30)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-emerald-200">
                  <span className="text-[10px] text-slate-secondary block">61-90 Days</span>
                  <span className="text-xs font-bold text-slate-primary tabular-nums mt-0.5 block">
                    {formatINR(aging.receivables.bucket60)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-rose-200">
                  <span className="text-[10px] text-rose-600 font-bold block">90+ Days</span>
                  <span className="text-xs font-bold text-rose-600 tabular-nums mt-0.5 block">
                    {formatINR(aging.receivables.bucket90Plus)}
                  </span>
                </div>
              </div>
            </div>

            {/* Supplier Payables Aging */}
            <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-2">
              <span className="text-xs font-bold text-rose-900 uppercase block">
                Supplier Payables ({formatINR(aging.payables.total)})
              </span>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-xl bg-white border border-rose-200">
                  <span className="text-[10px] text-slate-secondary block">0-30 Days</span>
                  <span className="text-xs font-bold text-slate-primary tabular-nums mt-0.5 block">
                    {formatINR(aging.payables.current)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-rose-200">
                  <span className="text-[10px] text-slate-secondary block">31-60 Days</span>
                  <span className="text-xs font-bold text-slate-primary tabular-nums mt-0.5 block">
                    {formatINR(aging.payables.bucket30)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-rose-200">
                  <span className="text-[10px] text-slate-secondary block">61-90 Days</span>
                  <span className="text-xs font-bold text-slate-primary tabular-nums mt-0.5 block">
                    {formatINR(aging.payables.bucket60)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-rose-200">
                  <span className="text-[10px] text-rose-600 font-bold block">90+ Days</span>
                  <span className="text-xs font-bold text-rose-600 tabular-nums mt-0.5 block">
                    {formatINR(aging.payables.bucket90Plus)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 4: SIMPLE BALANCE SHEET */}
      {activeReport === 'BALANCE_SHEET' && (
        <div className="p-4 rounded-card bg-white border border-border shadow-card space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-primary">Balance Sheet (Simplified)</h3>
            <span className="text-xs text-slate-secondary">Assets vs Liabilities overview</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Assets */}
            <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border space-y-2">
              <span className="text-xs font-bold text-slate-primary uppercase block">
                Total Assets ({formatINR(total + toReceive + totalValue)})
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-slate-secondary">Cash in Hand:</span>
                  <span className="font-bold tabular-nums">{formatINR(cashTotal)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-slate-secondary">Bank Accounts:</span>
                  <span className="font-bold tabular-nums">{formatINR(bankTotal)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-slate-secondary">Sundry Debtors (Receivables):</span>
                  <span className="font-bold tabular-nums">{formatINR(toReceive)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-slate-secondary">Closing Stock Valuation:</span>
                  <span className="font-bold tabular-nums">{formatINR(totalValue)}</span>
                </div>
              </div>
            </div>

            {/* Liabilities */}
            <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border space-y-2">
              <span className="text-xs font-bold text-slate-primary uppercase block">
                Total Liabilities ({formatINR(toPay)})
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-slate-secondary">Sundry Creditors (Payables):</span>
                  <span className="font-bold tabular-nums">{formatINR(toPay)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-slate-secondary">Owner's Net Worth / Equity:</span>
                  <span className="font-bold tabular-nums text-primary">
                    {formatINR(total + toReceive + totalValue - toPay)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 5: EXPENSES BY CATEGORY */}
      {activeReport === 'EXPENSES' && (
        <div className="p-4 rounded-card bg-white border border-border shadow-card space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-primary">Expense Analysis by Category</h3>
            <span className="text-xs text-slate-secondary">Track where your shop money goes</span>
          </div>

          <div className="space-y-2">
            {(Object.entries(pnl.expenseCategories) as [string, number][]).map(([cat, amount]) => {
              const pct = pnl.totalExpense > 0 ? Math.round((amount / pnl.totalExpense) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-primary">{cat}</span>
                    <span className="tabular-nums text-slate-secondary">
                      {formatINR(amount)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-subtle overflow-hidden">
                    <div
                      className="h-full bg-moneyOut rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
