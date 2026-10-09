import React, { useState, useMemo } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { formatINR, formatFullDate, getTodayDateString } from '../../utils/formatters';
import {
  Clock,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CalendarDays,
  FileText,
  CreditCard,
  Building2,
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-react';

export type TimeFilterPeriod =
  | 'TODAY'
  | 'LAST_DAY'
  | 'LAST_WEEK'
  | 'LAST_MONTH'
  | 'LAST_YEAR'
  | 'CUSTOM';

export const PeriodCashflowModal: React.FC = () => {
  const isOpen = useLedgerlyStore((state) => state.isPeriodCashflowOpen);
  const onClose = useLedgerlyStore((state) => state.closePeriodCashflow);
  const transactions = useLedgerlyStore((state) => state.transactions);
  const invoices = useLedgerlyStore((state) => state.invoices);
  const accounts = useLedgerlyStore((state) => state.accounts);
  const parties = useLedgerlyStore((state) => state.parties);

  const [period, setPeriod] = useState<TimeFilterPeriod>('TODAY');
  const [customDate, setCustomDate] = useState<string>(getTodayDateString());

  // Date boundaries for calculations
  const { startDate, endDate, periodLabel } = useMemo(() => {
    const today = new Date();
    const todayStr = getTodayDateString();

    const formatDateOnly = (d: Date) => d.toISOString().split('T')[0];

    switch (period) {
      case 'TODAY':
        return {
          startDate: todayStr,
          endDate: todayStr,
          periodLabel: `Today (${formatFullDate(todayStr)})`,
        };

      case 'LAST_DAY': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = formatDateOnly(yesterday);
        return {
          startDate: yStr,
          endDate: yStr,
          periodLabel: `Last Day / Yesterday (${formatFullDate(yStr)})`,
        };
      }

      case 'LAST_WEEK': {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const wStr = formatDateOnly(weekAgo);
        return {
          startDate: wStr,
          endDate: todayStr,
          periodLabel: `Last Week (Last 7 Days)`,
        };
      }

      case 'LAST_MONTH': {
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);
        const mStr = formatDateOnly(monthAgo);
        return {
          startDate: mStr,
          endDate: todayStr,
          periodLabel: `Last Month (Last 30 Days)`,
        };
      }

      case 'LAST_YEAR': {
        const yearAgo = new Date(today);
        yearAgo.setDate(yearAgo.getDate() - 365);
        const yStr = formatDateOnly(yearAgo);
        return {
          startDate: yStr,
          endDate: todayStr,
          periodLabel: `Last Year (Last 365 Days)`,
        };
      }

      case 'CUSTOM':
      default:
        return {
          startDate: customDate,
          endDate: customDate,
          periodLabel: `Date: ${formatFullDate(customDate)}`,
        };
    }
  }, [period, customDate]);

  // Aggregate Debit & Credit amounts in selected period
  const {
    creditTotal,
    debitTotal,
    netBalance,
    creditCount,
    debitCount,
    periodEntries,
  } = useMemo(() => {
    let creditSum = 0;
    let debitSum = 0;
    let cCount = 0;
    let dCount = 0;

    interface EntryItem {
      id: string;
      date: string;
      time?: string;
      title: string;
      detail: string;
      type: 'CREDIT' | 'DEBIT';
      amount: number;
      mode?: string;
    }

    const entries: EntryItem[] = [];

    // Filter transactions
    const activeTxns = transactions.filter(
      (t) => !t.isDeleted && t.date >= startDate && t.date <= endDate
    );

    for (const t of activeTxns) {
      const party = parties.find((p) => p.id === t.partyId);
      const acc = accounts.find((a) => a.id === t.accountId);
      const accName = acc?.nickname || acc?.bankName || 'Cash';
      const detailParts: string[] = [];
      if (party) detailParts.push(party.name);
      if (t.note) detailParts.push(t.note);
      if (accName) detailParts.push(accName);

      if (t.type === 'IN') {
        creditSum += t.amount;
        cCount += 1;
        entries.push({
          id: t.id,
          date: t.date,
          time: t.time,
          title: t.category || 'Money In',
          detail: detailParts.join(' • '),
          type: 'CREDIT',
          amount: t.amount,
          mode: t.mode,
        });
      } else if (t.type === 'OUT') {
        debitSum += t.amount;
        dCount += 1;
        entries.push({
          id: t.id,
          date: t.date,
          time: t.time,
          title: t.category || 'Money Out',
          detail: detailParts.join(' • '),
          type: 'DEBIT',
          amount: t.amount,
          mode: t.mode,
        });
      }
    }

    // Filter Invoices (where not already settled by transaction)
    const activeInvs = invoices.filter(
      (inv) => !inv.isDeleted && inv.date >= startDate && inv.date <= endDate
    );

    for (const inv of activeInvs) {
      const party = parties.find((p) => p.id === inv.partyId);
      const itemDesc = inv.lines.map((l) => `${l.itemName} (${l.qty} ${l.unit})`).join(', ');
      const extraDesc = inv.extraCharges ? `Extra/Transport: ₹${(inv.extraCharges / 100).toFixed(0)}` : '';
      const notesDesc = inv.notes ? `Note: ${inv.notes}` : '';
      const fullDetail = [party?.name, itemDesc, extraDesc, notesDesc].filter(Boolean).join(' • ');

      if (inv.type === 'SALE') {
        // Sales are Credit inflow
        creditSum += inv.total;
        cCount += 1;
        entries.push({
          id: inv.id,
          date: inv.date,
          title: `Sale Invoice #${inv.number}`,
          detail: fullDetail,
          type: 'CREDIT',
          amount: inv.total,
          mode: inv.paymentType,
        });
      } else if (inv.type === 'PURCHASE') {
        // Purchases are Debit outflow
        debitSum += inv.total;
        dCount += 1;
        entries.push({
          id: inv.id,
          date: inv.date,
          title: `Purchase Bill #${inv.number}`,
          detail: fullDetail,
          type: 'DEBIT',
          amount: inv.total,
          mode: inv.paymentType,
        });
      }
    }

    // Sort entries newest first
    entries.sort((a, b) => {
      const cmp = b.date.localeCompare(a.date);
      if (cmp !== 0) return cmp;
      return (b.time || '').localeCompare(a.time || '');
    });

    return {
      creditTotal: creditSum,
      debitTotal: debitSum,
      netBalance: creditSum - debitSum,
      creditCount: cCount,
      debitCount: dCount,
      periodEntries: entries,
    };
  }, [transactions, invoices, parties, accounts, startDate, endDate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-floating border border-border flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-surface-subtle/60 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <Clock size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-primary">
                Debit & Credit Summary
              </h2>
              <p className="text-xs text-slate-secondary">
                Track Money In (Credit) & Money Out (Debit) across timeframes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200/60 text-slate-secondary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* TIMEFRAME SELECTOR CHIPS */}
        <div className="p-4 border-b border-border bg-white space-y-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {(
              [
                { id: 'TODAY', label: 'Today' },
                { id: 'LAST_DAY', label: 'Last Day (Yesterday)' },
                { id: 'LAST_WEEK', label: 'Last Week' },
                { id: 'LAST_MONTH', label: 'Last Month' },
                { id: 'LAST_YEAR', label: 'Last Year' },
                { id: 'CUSTOM', label: 'Date-wise' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                  period === p.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-surface-subtle text-slate-secondary hover:text-slate-primary hover:bg-slate-200/60 border border-border'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* DATE-WISE PICKER (shown when CUSTOM selected) */}
          {period === 'CUSTOM' && (
            <div className="flex items-center gap-2 pt-1 animate-in fade-in">
              <Calendar size={16} className="text-primary flex-shrink-0" />
              <label className="text-xs font-semibold text-slate-primary">Select Date:</label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-bold text-slate-primary focus:outline-none focus:border-primary shadow-xs"
              />
            </div>
          )}

          <div className="text-[11px] font-semibold text-slate-secondary flex items-center gap-1">
            <CalendarDays size={13} className="text-primary" />
            <span>Showing records for: <strong className="text-slate-primary">{periodLabel}</strong></span>
          </div>
        </div>

        {/* BODY: DEBIT & CREDIT TOTAL CARDS */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* 2 Big Cards: Credit & Debit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* CREDIT (Money In) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <ArrowDownLeft size={18} strokeWidth={2.5} />
                  </div>
                  <span className="text-xs font-extrabold uppercase tracking-wide">
                    Total Credit (Money In)
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-white/80 px-2 py-0.5 rounded-full border border-emerald-200">
                  {creditCount} {creditCount === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              <div className="pt-2">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tabular-nums">
                  {formatINR(creditTotal)}
                </div>
                <p className="text-[11px] text-emerald-800/80 mt-0.5">
                  Inflow, sales, customer receipts & income
                </p>
              </div>
            </div>

            {/* DEBIT (Money Out) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100/60 border border-rose-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-800">
                  <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <ArrowUpRight size={18} strokeWidth={2.5} />
                  </div>
                  <span className="text-xs font-extrabold uppercase tracking-wide">
                    Total Debit (Money Out)
                  </span>
                </div>
                <span className="text-[11px] font-bold text-rose-700 bg-white/80 px-2 py-0.5 rounded-full border border-rose-200">
                  {debitCount} {debitCount === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              <div className="pt-2">
                <div className="text-2xl sm:text-3xl font-extrabold text-rose-700 tabular-nums">
                  {formatINR(debitTotal)}
                </div>
                <p className="text-[11px] text-rose-800/80 mt-0.5">
                  Outflow, purchases, supplier payments & expenses
                </p>
              </div>
            </div>
          </div>

          {/* NET CASHFLOW SUMMARY BAR */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              netBalance >= 0
                ? 'bg-emerald-500/10 border-emerald-300 text-emerald-900'
                : 'bg-rose-500/10 border-rose-300 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {netBalance >= 0 ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <TrendingUp size={18} />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                  <TrendingDown size={18} />
                </div>
              )}
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wide block">
                  Net Cash Flow ({periodLabel})
                </span>
                <span className="text-[11px] opacity-80 block">
                  {netBalance >= 0 ? 'Net Surplus (Credit > Debit)' : 'Net Deficit (Debit > Credit)'}
                </span>
              </div>
            </div>

            <span className="text-xl font-extrabold tabular-nums">
              {netBalance >= 0 ? `+${formatINR(netBalance)}` : `−${formatINR(Math.abs(netBalance))}`}
            </span>
          </div>

          {/* DETAILED TRANSACTION BREAKDOWN FOR PERIOD */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-primary uppercase tracking-wide flex items-center gap-1.5">
                <Layers size={14} className="text-primary" />
                Entries in this period ({periodEntries.length})
              </h3>
            </div>

            {periodEntries.length === 0 ? (
              <div className="p-8 rounded-2xl bg-surface-subtle/50 border border-dashed border-border text-center space-y-1">
                <p className="text-xs font-semibold text-slate-secondary">
                  No Debit or Credit transactions recorded for this timeframe.
                </p>
                <span className="text-[11px] text-slate-muted">
                  Use the quick buttons on the home screen to record Money In or Money Out.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {periodEntries.map((e) => (
                  <div
                    key={e.id}
                    className="p-3 bg-white rounded-2xl border border-border shadow-xs flex items-center justify-between hover:bg-surface-subtle/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0 ${
                          e.type === 'CREDIT' ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      >
                        {e.type === 'CREDIT' ? (
                          <ArrowDownLeft size={15} strokeWidth={2.5} />
                        ) : (
                          <ArrowUpRight size={15} strokeWidth={2.5} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-primary block truncate">
                          {e.title}
                        </span>
                        {e.detail && (
                          <span className="text-[11px] text-slate-secondary block truncate mt-0.5">
                            {e.detail}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-muted block mt-0.5">
                          {e.date} {e.time ? `• ${e.time}` : ''} {e.mode ? `• ${e.mode}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0">
                      <span
                        className={`text-xs font-extrabold tabular-nums ${
                          e.type === 'CREDIT' ? 'text-moneyIn' : 'text-moneyOut'
                        }`}
                      >
                        {e.type === 'CREDIT' ? `+${formatINR(e.amount)}` : `−${formatINR(e.amount)}`}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-muted mt-0.5">
                        {e.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-3 border-t border-border bg-surface-subtle/40 flex justify-end rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-hover active:scale-95 transition-all shadow-xs"
          >
            Close Summary
          </button>
        </div>
      </div>
    </div>
  );
};
