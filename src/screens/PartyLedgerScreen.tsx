import React, { useState } from 'react';
import { useLedgerlyStore } from '../store/useLedgerlyStore';
import { calculatePartyNetBalance, buildPartyLedger } from '../utils/accounting';
import { formatINR, formatFullDate, paiseToRupees } from '../utils/formatters';
import { generatePartyStatementPdf } from '../services/pdfService';
import { exportPartyLedgerToExcel } from '../services/excelService';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Download,
  Share2,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
} from 'lucide-react';

export const PartyLedgerScreen: React.FC = () => {
  const selectedPartyId = useLedgerlyStore((state) => state.selectedPartyIdForLedger);
  const closePartyLedger = useLedgerlyStore((state) => state.closePartyLedger);
  const parties = useLedgerlyStore((state) => state.parties);
  const transactions = useLedgerlyStore((state) => state.transactions);
  const invoices = useLedgerlyStore((state) => state.invoices);
  const business = useLedgerlyStore((state) => state.business);
  const openMoneyIn = useLedgerlyStore((state) => state.openMoneyIn);
  const openMoneyOut = useLedgerlyStore((state) => state.openMoneyOut);

  const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT' | 'INVOICES'>('ALL');

  if (!selectedPartyId) return null;

  const party = parties.find((p) => p.id === selectedPartyId);
  if (!party) return null;

  const netBalance = calculatePartyNetBalance(party, transactions, invoices);
  const allLedgerEntries = buildPartyLedger(party, transactions, invoices);

  const ledgerEntries = allLedgerEntries.filter((e) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'IN') return e.type === 'IN';
    if (filterType === 'OUT') return e.type === 'OUT';
    if (filterType === 'INVOICES') return e.type === 'INVOICE';
    return true;
  });

  const handleDownloadPdf = () => {
    const doc = generatePartyStatementPdf(party, allLedgerEntries, business);
    doc.save(`${party.name.replace(/\s+/g, '_')}_statement.pdf`);
  };

  const handleExportExcel = () => {
    exportPartyLedgerToExcel(party, allLedgerEntries);
  };

  const handleSendReminder = () => {
    const text = `Dear ${party.name}, your outstanding balance with ${business.name} is ${formatINR(Math.abs(netBalance))}. Kindly clear at your earliest convenience. Thank you!`;
    const phone = party.phone ? `91${party.phone}` : '';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-40 bg-surface-muted flex flex-col max-w-2xl mx-auto shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Top Header */}
      <div className="bg-white border-b border-border px-4 py-3 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={closePartyLedger}
              className="p-1.5 rounded-full hover:bg-surface-subtle text-slate-primary"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-base font-bold text-slate-primary leading-tight">{party.name}</h2>
              <span className="text-xs text-slate-secondary">
                {party.phone ? `+91 ${party.phone}` : 'No phone'} • {party.type}
              </span>
            </div>
          </div>

          {/* Quick Call / WhatsApp Contact Buttons */}
          <div className="flex items-center gap-1.5">
            {party.phone && (
              <>
                <a
                  href={`tel:${party.phone}`}
                  className="p-2 rounded-xl bg-surface-subtle hover:bg-slate-200/60 text-primary border border-border"
                  title="Call Party"
                >
                  <Phone size={16} />
                </a>
                <button
                  type="button"
                  onClick={handleSendReminder}
                  className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                  title="WhatsApp Reminder"
                >
                  <MessageCircle size={16} />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="p-2 rounded-xl bg-primary-light hover:bg-indigo-100 text-primary border border-primary/20"
              title="Download PDF Statement"
            >
              <Download size={16} />
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
              title="Export Excel"
            >
              <FileSpreadsheet size={16} />
            </button>
          </div>
        </div>

        {/* Net Balance Highlight Card */}
        <div
          className={`mt-3 p-3.5 rounded-2xl border flex items-center justify-between ${
            netBalance >= 0
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/70 border-rose-200 text-rose-900'
          }`}
        >
          <div>
            <span className="text-xs font-semibold block uppercase opacity-80">
              {netBalance >= 0 ? "You'll Get (Receivable)" : "You'll Give (Payable)"}
            </span>
            <span className="text-2xl font-extrabold tabular-nums block mt-0.5">
              {formatINR(Math.abs(netBalance))}
            </span>
          </div>

          {netBalance > 0 && (
            <button
              type="button"
              onClick={handleSendReminder}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
            >
              <Bell size={13} />
              <span>Send Reminder</span>
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
          {(['ALL', 'IN', 'OUT', 'INVOICES'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilterType(mode)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                filterType === mode
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-surface-subtle text-slate-primary border-border hover:border-slate-muted'
              }`}
            >
              {mode === 'ALL' ? 'All Entries' : mode === 'IN' ? 'Money In' : mode === 'OUT' ? 'Money Out' : 'Invoices'}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table / List Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24">
        {ledgerEntries.map((entry) => (
          <div
            key={entry.id}
            className="p-3 bg-white rounded-2xl border border-border shadow-card flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-primary">{entry.description}</span>
              <span className="text-[11px] text-slate-secondary mt-0.5">
                {entry.date} {entry.paymentMode ? `• ${entry.paymentMode}` : ''}
              </span>
            </div>

            <div className="flex flex-col items-end">
              {/* Debit / Credit Amount */}
              {entry.debit > 0 ? (
                <span className="text-xs font-bold text-moneyOut tabular-nums">
                  −{formatINR(entry.debit)}
                </span>
              ) : entry.credit > 0 ? (
                <span className="text-xs font-bold text-moneyIn tabular-nums">
                  +{formatINR(entry.credit)}
                </span>
              ) : null}

              {/* Running Balance */}
              <span className="text-[11px] font-semibold text-slate-secondary tabular-nums mt-0.5">
                Bal: {formatINR(Math.abs(entry.runningBalance))} {entry.runningBalance >= 0 ? '(Dr)' : '(Cr)'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Bottom Actions Prefilled with this Party */}
      <div className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-white border-t border-border p-3 flex gap-3 z-30">
        <button
          type="button"
          onClick={() => openMoneyIn(party.id)}
          className="flex-1 h-12 rounded-button bg-moneyIn hover:bg-moneyIn-hover text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
        >
          <ArrowDownLeft size={16} strokeWidth={2.5} />
          <span>+ Money In (from {party.name.split(' ')[0]})</span>
        </button>
        <button
          type="button"
          onClick={() => openMoneyOut(party.id)}
          className="flex-1 h-12 rounded-button bg-moneyOut hover:bg-moneyOut-hover text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
        >
          <ArrowUpRight size={16} strokeWidth={2.5} />
          <span>− Money Out (to {party.name.split(' ')[0]})</span>
        </button>
      </div>
    </div>
  );
};
