import React, { useState, useMemo } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { DayBookEntry } from '../../types';
import {
  formatINR,
  formatFullDate,
  getTodayDateString,
  paiseToRupees,
} from '../../utils/formatters';
import { generateDayBookPdf } from '../../services/pdfService';
import {
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  ShoppingCart,
  Coins,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react';

export const DayBookModal: React.FC = () => {
  const isOpen = useLedgerlyStore((state) => state.isDayBookOpen);
  const closeDayBook = useLedgerlyStore((state) => state.closeDayBook);
  const transactions = useLedgerlyStore((state) => state.transactions);
  const invoices = useLedgerlyStore((state) => state.invoices);
  const parties = useLedgerlyStore((state) => state.parties);
  const business = useLedgerlyStore((state) => state.business);
  const openTransactionDetail = useLedgerlyStore((state) => state.openTransactionDetail);

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [isRangeMode, setIsRangeMode] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>(getTodayDateString());
  const [endDate, setEndDate] = useState<string>(getTodayDateString());

  const partyMap = useMemo(() => new Map(parties.map((p) => [p.id, p])), [parties]);
  const invoiceMap = useMemo(() => new Map(invoices.map((i) => [i.id, i])), [invoices]);

  // Navigate date
  const changeDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Compile day entries from active transactions and standalone invoices
  const { entries, totalIn, totalOut, net } = useMemo(() => {
    const filteredTxns = transactions.filter((t) => {
      if (t.isDeleted) return false;
      if (isRangeMode) {
        return t.date >= startDate && t.date <= endDate;
      }
      return t.date === selectedDate;
    });

    let dayIn = 0;
    let dayOut = 0;

    const dayEntries: DayBookEntry[] = filteredTxns.map((t) => {
      const inv = t.invoiceId ? invoiceMap.get(t.invoiceId) : undefined;
      const party = t.partyId ? partyMap.get(t.partyId) : undefined;
      const partyName = party?.name || inv?.partyName || (t.type === 'OUT' && !t.partyId ? t.category || 'Expense' : 'Cash Counter');

      let entryType: DayBookEntry['type'] = 'EXPENSE';
      let inflow = 0;
      let outflow = 0;

      if (inv) {
        if (inv.type === 'SALE') {
          entryType = 'SALE';
          inflow = t.amount;
        } else if (inv.type === 'PURCHASE') {
          entryType = 'PURCHASE';
          outflow = t.amount;
        } else {
          entryType = t.type === 'IN' ? 'PAYMENT_IN' : 'PAYMENT_OUT';
          if (t.type === 'IN') inflow = t.amount;
          else outflow = t.amount;
        }
      } else if (t.type === 'IN') {
        entryType = 'PAYMENT_IN';
        inflow = t.amount;
      } else if (t.type === 'OUT') {
        entryType = t.partyId ? 'PAYMENT_OUT' : 'EXPENSE';
        outflow = t.amount;
      } else if (t.type === 'TRANSFER') {
        entryType = 'TRANSFER';
      }

      dayIn += inflow;
      dayOut += outflow;

      return {
        id: t.id,
        time: t.time || '12:00',
        date: t.date,
        type: entryType,
        refNumber: inv?.number || t.id.substring(0, 8),
        partyName,
        partyId: t.partyId,
        mode: t.mode,
        inflow,
        outflow,
        net: inflow - outflow,
        originalTransactionId: t.id,
        originalInvoiceId: t.invoiceId,
      };
    });

    // Sort chronologically
    dayEntries.sort((a, b) => (b.time || '').localeCompare(a.time || ''));

    return {
      entries: dayEntries,
      totalIn: dayIn,
      totalOut: dayOut,
      net: dayIn - dayOut,
    };
  }, [transactions, invoices, partyMap, invoiceMap, selectedDate, isRangeMode, startDate, endDate]);

  if (!isOpen) return null;

  const handleExportPdf = () => {
    const doc = generateDayBookPdf(
      isRangeMode ? `${startDate} to ${endDate}` : selectedDate,
      entries,
      business,
      { totalIn, totalOut, net }
    );
    doc.save(`DayBook_${isRangeMode ? `${startDate}_${endDate}` : selectedDate}.pdf`);
  };

  const handleSharePdf = async () => {
    const doc = generateDayBookPdf(
      isRangeMode ? `${startDate} to ${endDate}` : selectedDate,
      entries,
      business,
      { totalIn, totalOut, net }
    );
    const fileName = `DayBook_${isRangeMode ? `${startDate}_${endDate}` : selectedDate}.pdf`;
    const blob = doc.output('blob');
    const file = new File([blob], fileName, { type: 'application/pdf', lastModified: Date.now() });

    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: fileName,
          text: `Day Book Summary for ${business.name}: In: ${formatINR(totalIn)} | Out: ${formatINR(totalOut)} | Net: ${formatINR(net)}`,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    doc.save(fileName);
    alert('Day Book PDF saved to your device.');
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[94vh] overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">Day Book (Rojmel)</h2>
              <p className="text-xs text-slate-500">Daily Inflow, Outflow & Cash Book Register</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
              onClick={handleSharePdf}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              title="Share PDF"
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              type="button"
              onClick={closeDayBook}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Date Controls & Range Selector */}
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRangeMode(false)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                !isRangeMode
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Single Day
            </button>
            <button
              type="button"
              onClick={() => setIsRangeMode(true)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                isRangeMode
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Date Range
            </button>
          </div>

          {!isRangeMode ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => changeDate(-1)}
                className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700"
                title="Previous Day"
              >
                <ChevronLeft size={16} />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => changeDate(1)}
                className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700"
                title="Next Day"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(getTodayDateString())}
                className="ml-1 px-2.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold text-[11px] text-blue-600"
              >
                Today
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-slate-50"
              />
              <span>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-slate-50"
              />
            </div>
          )}
        </div>

        {/* Daily Summary Cards */}
        <div className="p-3 sm:p-4 bg-slate-50/70 grid grid-cols-3 gap-2 sm:gap-3 border-b border-slate-100 text-xs">
          <div className="p-3 rounded-2xl bg-white border border-emerald-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-emerald-600 block">Total Money In</span>
            <span className="text-base sm:text-lg font-bold text-emerald-600 tabular-nums">+{formatINR(totalIn)}</span>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-rose-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-rose-600 block">Total Money Out</span>
            <span className="text-base sm:text-lg font-bold text-rose-600 tabular-nums">−{formatINR(totalOut)}</span>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-blue-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-blue-600 block">Net Position</span>
            <span className={`text-base sm:text-lg font-bold tabular-nums ${net >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
              {formatINR(net)}
            </span>
          </div>
        </div>

        {/* Transaction Table / List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {entries.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Calendar size={36} className="mx-auto mb-2 opacity-40 text-slate-500" />
              <p className="font-bold text-slate-600 text-sm">No transactions recorded for this date</p>
              <p className="text-xs text-slate-400 mt-1">Record sales, purchases or payments using the + Add button.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="hidden sm:grid grid-cols-12 text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                <span className="col-span-2">Time / Mode</span>
                <span className="col-span-4">Party & Particulars</span>
                <span className="col-span-2">Ref #</span>
                <span className="col-span-2 text-right">Money In (₹)</span>
                <span className="col-span-2 text-right">Money Out (₹)</span>
              </div>

              {entries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => openTransactionDetail(entry.originalTransactionId, entry.originalInvoiceId)}
                  className="p-3 sm:px-3 sm:py-2.5 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center gap-1 sm:gap-0"
                >
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">{entry.time}</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                      {entry.mode}
                    </span>
                  </div>

                  <div className="col-span-4 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900 truncate">{entry.partyName}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        entry.type === 'SALE' ? 'bg-emerald-100 text-emerald-800' :
                        entry.type === 'PURCHASE' ? 'bg-rose-100 text-rose-800' :
                        entry.type === 'PAYMENT_IN' ? 'bg-emerald-50 text-emerald-700' :
                        entry.type === 'PAYMENT_OUT' ? 'bg-rose-50 text-rose-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {entry.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2 text-xs text-slate-500 font-mono">
                    #{entry.refNumber}
                  </div>

                  <div className="col-span-2 sm:text-right font-bold text-xs text-emerald-600 tabular-nums">
                    {entry.inflow > 0 ? `+${formatINR(entry.inflow)}` : '—'}
                  </div>

                  <div className="col-span-2 sm:text-right font-bold text-xs text-rose-600 tabular-nums">
                    {entry.outflow > 0 ? `−${formatINR(entry.outflow)}` : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Total Entries: <strong>{entries.length}</strong></span>
          <button
            type="button"
            onClick={closeDayBook}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
