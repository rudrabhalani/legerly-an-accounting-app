import React, { useState } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { getTranslation } from '../../i18n/translations';
import { rupeesToPaise, getTodayDateString, getCurrentTimeString } from '../../utils/formatters';
import { ArrowLeftRight, X, Check } from 'lucide-react';

export const TransferModal: React.FC = () => {
  const isTransferModalOpen = useLedgerlyStore((state) => state.isTransferModalOpen);
  const closeTransferModal = useLedgerlyStore((state) => state.closeTransferModal);
  const accounts = useLedgerlyStore((state) => state.accounts);
  const addTransaction = useLedgerlyStore((state) => state.addTransaction);
  const language = useLedgerlyStore((state) => state.business.language);
  const t = getTranslation(language);

  const [amountStr, setAmountStr] = useState('');
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '');
  const [note, setNote] = useState('Account balance transfer');

  if (!isTransferModalOpen) return null;

  const handleSave = () => {
    const raw = parseFloat(amountStr);
    if (isNaN(raw) || raw <= 0) {
      alert('Please enter a valid transfer amount');
      return;
    }
    if (fromAccountId === toAccountId) {
      alert('Source and destination accounts must be different');
      return;
    }

    const paise = rupeesToPaise(raw);
    addTransaction({
      type: 'TRANSFER',
      amount: paise,
      accountId: fromAccountId,
      toAccountId: toAccountId,
      mode: 'NEFT_RTGS',
      category: 'Transfer',
      date: getTodayDateString(),
      time: getCurrentTimeString(),
      note: note.trim() || 'Transfer between accounts',
    });

    closeTransferModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-floating border border-border animate-in slide-in-from-bottom-5 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center">
              <ArrowLeftRight size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-primary">{t.transferMoney}</h3>
              <p className="text-xs text-slate-secondary">Shift money between cash & bank</p>
            </div>
          </div>
          <button type="button" onClick={closeTransferModal} className="p-1.5 rounded-full hover:bg-surface-subtle text-slate-secondary">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 py-4">
          <div>
            <label className="block text-xs font-bold text-slate-secondary uppercase mb-1">Transfer Amount (₹)</label>
            <div className="relative flex items-center bg-surface-subtle border border-border focus-within:border-primary rounded-2xl px-4 py-2.5">
              <span className="text-2xl font-bold text-primary mr-2">₹</span>
              <input
                type="number"
                inputMode="decimal"
                autoFocus
                placeholder="0"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full bg-transparent text-2xl font-bold text-slate-primary focus:outline-none tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-secondary mb-1">Transfer From (Debited)</label>
            <select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-input bg-surface border border-border text-sm font-medium text-slate-primary focus:outline-none focus:border-primary"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nickname} {a.accountNumberMasked ? `(${a.accountNumberMasked})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-secondary mb-1">Transfer To (Credited)</label>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-input bg-surface border border-border text-sm font-medium text-slate-primary focus:outline-none focus:border-primary"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nickname} {a.accountNumberMasked ? `(${a.accountNumberMasked})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-secondary mb-1">Description / Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-input bg-surface border border-border text-xs text-slate-primary focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={closeTransferModal}
            className="flex-1 h-12 rounded-button bg-surface-subtle text-slate-primary font-bold text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 h-12 rounded-button bg-primary hover:bg-primary-hover text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Check size={16} /> Complete Transfer
          </button>
        </div>
      </div>
    </div>
  );
};
