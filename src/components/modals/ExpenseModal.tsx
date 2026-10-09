import React, { useState } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { PaymentMode } from '../../types';
import { rupeesToPaise, getTodayDateString, formatINR } from '../../utils/formatters';
import { X, Check, PieChart, Building2, Wallet } from 'lucide-react';

const POPULAR_EXPENSE_CATEGORIES = [
  'Rent',
  'Salary',
  'Electricity',
  'Transport / Fuel',
  'Tea & Refreshments',
  'Office Supplies',
  'Repairs & Maintenance',
  'Marketing & Ads',
  'Taxes & Govt Fees',
  'Internet & Phone',
  'Other Expense',
];

export const ExpenseModal: React.FC = () => {
  const isExpenseModalOpen = useLedgerlyStore((state) => state.isExpenseModalOpen);
  const closeExpenseModal = useLedgerlyStore((state) => state.closeExpenseModal);
  const accounts = useLedgerlyStore((state) => state.accounts);
  const addExpense = useLedgerlyStore((state) => state.addExpense);
  const canEditDelete = useLedgerlyStore((state) => state.canCurrentUserEditDelete());

  const [category, setCategory] = useState(POPULAR_EXPENSE_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [accountType, setAccountType] = useState<'CASH' | 'BANK'>('CASH');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [mode, setMode] = useState<PaymentMode>('CASH');
  const [date, setDate] = useState(getTodayDateString());
  const [note, setNote] = useState('');

  if (!isExpenseModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditDelete) {
      alert('Viewers cannot record expenses.');
      return;
    }

    const amtPaise = rupeesToPaise(parseFloat(amountStr) || 0);
    if (amtPaise <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    const finalCategory = category === 'Other Expense' && customCategory.trim() ? customCategory.trim() : category;

    let accId = selectedAccountId;
    if (!accId) {
      const acc = accounts.find((a) => a.type === accountType);
      accId = acc?.id || accounts[0]?.id || '';
    }

    addExpense({
      category: finalCategory,
      amountPaise: amtPaise,
      accountId: accId,
      mode: accountType === 'CASH' ? 'CASH' : mode,
      date,
      note: note.trim() || undefined,
    });

    closeExpenseModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-floating border border-border animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center">
              <PieChart size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-primary">Record Business Expense</h3>
              <p className="text-xs text-slate-secondary">Posts debit entry to Cash or Bank ledger</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeExpenseModal}
            className="w-8 h-8 rounded-full hover:bg-surface-subtle text-slate-secondary flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Amount (Big touch target) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-primary">Expense Amount (₹) *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-secondary">
                ₹
              </span>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                autoFocus
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full h-12 pl-8 pr-4 rounded-xl border border-border bg-white text-xl font-bold text-slate-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Category Chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-primary">Expense Category *</label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-surface-subtle/50 rounded-2xl border border-border">
              {POPULAR_EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${
                    category === cat
                      ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                      : 'bg-white text-slate-secondary border-border hover:border-slate-muted'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {category === 'Other Expense' && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-border bg-white text-xs mt-1"
                placeholder="Specify custom category name"
              />
            )}
          </div>

          {/* Paid From (Cash or Bank) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-primary">Paid From</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAccountType('CASH');
                  const cashAcc = accounts.find((a) => a.type === 'CASH');
                  if (cashAcc) setSelectedAccountId(cashAcc.id);
                  setMode('CASH');
                }}
                className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  accountType === 'CASH'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                    : 'bg-white text-slate-secondary border-border'
                }`}
              >
                <Wallet size={16} />
                <span>Cash in Hand</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAccountType('BANK');
                  const bankAcc = accounts.find((a) => a.type === 'BANK');
                  if (bankAcc) setSelectedAccountId(bankAcc.id);
                  setMode('UPI');
                }}
                className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  accountType === 'BANK'
                    ? 'bg-indigo-50 text-indigo-800 border-indigo-300 shadow-xs'
                    : 'bg-white text-slate-secondary border-border'
                }`}
              >
                <Building2 size={16} />
                <span>Bank Account</span>
              </button>
            </div>

            {accountType === 'BANK' && (
              <div className="space-y-2 pt-1">
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-white text-xs font-semibold"
                >
                  {accounts
                    .filter((a) => a.type === 'BANK')
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.bankName || a.nickname} ({a.accountNumberMasked || 'Primary'})
                      </option>
                    ))}
                </select>

                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {(['UPI', 'NEFT_RTGS', 'IMPS', 'CHEQUE'] as PaymentMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                        mode === m
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-white text-slate-secondary border-border'
                      }`}
                    >
                      {m.replace('_', '/')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-primary">Expense Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-white text-xs font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-primary">Notes / Bill No.</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-white text-xs"
                placeholder="Optional details"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <Check size={18} />
              <span>Save Business Expense</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
