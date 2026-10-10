import React, { useState } from 'react';
import { useLedgerlyStore } from '../store/useLedgerlyStore';
import { calculateAccountBalance, buildAccountLedger } from '../utils/accounting';
import { formatINR, formatFullDate } from '../utils/formatters';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Scale, ArrowLeftRight } from 'lucide-react';

export const AccountLedgerScreen: React.FC = () => {
  const selectedAccountId = useLedgerlyStore((state) => state.selectedAccountIdForLedger);
  const closeAccountLedger = useLedgerlyStore((state) => state.closeAccountLedger);
  const accounts = useLedgerlyStore((state) => state.accounts);
  const transactions = useLedgerlyStore((state) => state.transactions);
  const openMoneyIn = useLedgerlyStore((state) => state.openMoneyIn);
  const openMoneyOut = useLedgerlyStore((state) => state.openMoneyOut);
  const openTransferModal = useLedgerlyStore((state) => state.openTransferModal);
  const openReconcileModal = useLedgerlyStore((state) => state.openReconcileModal);
  const openTransactionDetail = useLedgerlyStore((state) => state.openTransactionDetail);

  const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT' | 'TRANSFER'>('ALL');

  if (!selectedAccountId) return null;

  const account = accounts.find((a) => a.id === selectedAccountId);
  if (!account) return null;

  const currentBalance = calculateAccountBalance(account, transactions);
  const allLedger = buildAccountLedger(account, transactions);

  const ledger = allLedger.filter((e) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'IN') return e.type === 'IN';
    if (filterType === 'OUT') return e.type === 'OUT';
    if (filterType === 'TRANSFER') return e.type === 'TRANSFER';
    return true;
  });

  return (
    <div className="fixed inset-0 z-40 bg-surface-muted flex flex-col max-w-2xl mx-auto shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Top Header */}
      <div className="bg-white border-b border-border px-4 py-3 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={closeAccountLedger}
              className="p-1.5 rounded-full hover:bg-surface-subtle text-slate-primary"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-base font-bold text-slate-primary leading-tight">
                {account.nickname}
              </h2>
              <span className="text-xs text-slate-secondary">
                {account.type === 'CASH' ? 'Cash Book' : `${account.bankName || 'Bank'} Passbook`}
                {account.accountNumberMasked ? ` • ${account.accountNumberMasked}` : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openReconcileModal(account.id)}
              className="px-2.5 py-1.5 rounded-xl bg-surface-subtle hover:bg-slate-200/60 text-primary border border-border text-xs font-bold flex items-center gap-1"
            >
              <Scale size={14} /> Reconcile
            </button>
          </div>
        </div>

        {/* Large Balance Card (White background with thin blue border) */}
        <div className="mt-3 p-4 rounded-2xl bg-white border-2 border-blue-500 text-slate-900 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block">
            Current Passbook Balance
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold tabular-nums block mt-1 text-slate-900">
            {formatINR(currentBalance)}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Opening Balance: {formatINR(account.openingBalance)}
          </span>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
          {(['ALL', 'IN', 'OUT', 'TRANSFER'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilterType(mode)}
              className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                filterType === mode
                  ? 'bg-white text-blue-700 border-2 border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400'
              }`}
            >
              {mode === 'ALL' ? 'All Passbook Entries' : mode === 'IN' ? 'Money In' : mode === 'OUT' ? 'Money Out' : 'Transfers'}
            </button>
          ))}
        </div>
      </div>

      {/* Passbook Transactions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24">
        {ledger.map((entry) => (
          <div
            key={entry.id}
            onClick={() => openTransactionDetail(entry.refId, entry.refId)}
            className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 shadow-xs flex items-center justify-between cursor-pointer group transition-all"
            title="Click to view complete transaction details"
          >
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">
                {entry.description}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                {entry.date} {entry.time ? `• ${entry.time}` : ''} {entry.paymentMode ? `(${entry.paymentMode})` : ''}
              </span>
            </div>

            <div className="flex flex-col items-end">
              {entry.credit > 0 ? (
                <span className="text-sm font-bold text-emerald-700 tabular-nums">
                  +{formatINR(entry.credit)}
                </span>
              ) : entry.debit > 0 ? (
                <span className="text-sm font-bold text-rose-600 tabular-nums">
                  −{formatINR(entry.debit)}
                </span>
              ) : null}

              <span className="text-[11px] font-semibold text-slate-400 tabular-nums mt-0.5">
                Bal: {formatINR(entry.runningBalance)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Bottom Actions (White backgrounds with colored borders only) */}
      <div className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-white border-t border-slate-200 p-3 flex gap-2 z-30">
        <button
          type="button"
          onClick={() => openMoneyIn()}
          className="flex-1 h-12 rounded-button bg-white hover:bg-emerald-50/50 text-emerald-700 border-2 border-emerald-500 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-98"
        >
          <ArrowDownLeft size={16} strokeWidth={2.5} />
          <span>+ Money In</span>
        </button>
        <button
          type="button"
          onClick={() => openMoneyOut()}
          className="flex-1 h-12 rounded-button bg-white hover:bg-rose-50/50 text-rose-600 border-2 border-rose-500 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-98"
        >
          <ArrowUpRight size={16} strokeWidth={2.5} />
          <span>− Money Out</span>
        </button>
        <button
          type="button"
          onClick={openTransferModal}
          className="h-12 px-3.5 rounded-button bg-white border-2 border-blue-500 hover:bg-blue-50/50 text-blue-700 font-bold text-xs flex items-center justify-center gap-1"
          title="Transfer Between Accounts"
        >
          <ArrowLeftRight size={16} />
        </button>
      </div>
    </div>
  );
};
