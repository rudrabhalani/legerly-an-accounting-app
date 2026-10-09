import React, { useState } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { calculateAccountBalance } from '../../utils/accounting';
import { formatINR, paiseToRupees, rupeesToPaise } from '../../utils/formatters';
import { Scale, X, CheckCircle2, AlertCircle } from 'lucide-react';

export const ReconcileModal: React.FC = () => {
  const isReconcileModalOpen = useLedgerlyStore((state) => state.isReconcileModalOpen);
  const closeReconcileModal = useLedgerlyStore((state) => state.closeReconcileModal);
  const selectedAccountId = useLedgerlyStore((state) => state.selectedAccountIdForLedger);
  const accounts = useLedgerlyStore((state) => state.accounts);
  const transactions = useLedgerlyStore((state) => state.transactions);

  const [accountId, setAccountId] = useState(selectedAccountId || accounts[0]?.id || '');
  const [statementBalanceStr, setStatementBalanceStr] = useState('');

  if (!isReconcileModalOpen) return null;

  const currentAcc = accounts.find((a) => a.id === accountId) || accounts[0];
  const bookBalancePaise = currentAcc ? calculateAccountBalance(currentAcc, transactions) : 0;
  const statementPaise = statementBalanceStr ? rupeesToPaise(parseFloat(statementBalanceStr) || 0) : null;
  const differencePaise = statementPaise !== null ? statementPaise - bookBalancePaise : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-floating border border-border animate-in slide-in-from-bottom-5 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center">
              <Scale size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-primary">Account Reconciliation</h3>
              <p className="text-xs text-slate-secondary">Compare Ledgerly book balance with passbook</p>
            </div>
          </div>
          <button type="button" onClick={closeReconcileModal} className="p-1.5 rounded-full hover:bg-surface-subtle text-slate-secondary">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 py-4">
          <div>
            <label className="block text-xs font-semibold text-slate-secondary mb-1">Select Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-input bg-surface border border-border text-sm font-semibold text-slate-primary focus:outline-none focus:border-primary"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nickname} {a.accountNumberMasked ? `(${a.accountNumberMasked})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Book Balance Card */}
          <div className="p-4 rounded-2xl bg-surface-subtle border border-border">
            <span className="text-xs font-semibold text-slate-secondary block">Ledgerly Book Balance</span>
            <span className="text-2xl font-extrabold text-slate-primary tabular-nums mt-0.5 block">
              {formatINR(bookBalancePaise)}
            </span>
            <span className="text-[11px] text-slate-secondary">
              Includes all active recorded transactions, money in/out & transfers
            </span>
          </div>

          {/* Statement Balance Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-secondary mb-1">
              Bank / Physical Statement Balance (₹)
            </label>
            <input
              type="number"
              placeholder="Enter balance from your bank app/passbook"
              value={statementBalanceStr}
              onChange={(e) => setStatementBalanceStr(e.target.value)}
              className="w-full px-3 py-2.5 rounded-input bg-surface border border-border text-sm font-bold text-primary focus:outline-none focus:border-primary tabular-nums"
            />
          </div>

          {/* Reconciliation Difference Badge */}
          {differencePaise !== null && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                differencePaise === 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {differencePaise === 0 ? (
                <CheckCircle2 size={22} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={22} className="text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold text-sm block">
                  {differencePaise === 0
                    ? 'Perfect Match! Books are 100% reconciled.'
                    : `Difference: ${formatINR(Math.abs(differencePaise))}`}
                </span>
                <span className="text-xs opacity-90 block mt-0.5">
                  {differencePaise === 0
                    ? 'Your recorded ledger matches your bank statement exactly.'
                    : differencePaise > 0
                    ? 'Statement has more money. You might have missed recording a Money In transaction.'
                    : 'Statement has less money. You might have missed recording a Money Out transaction.'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={closeReconcileModal}
            className="w-full h-12 rounded-button bg-primary hover:bg-primary-hover text-white font-bold text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
