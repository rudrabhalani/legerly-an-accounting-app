import React from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  ShoppingCart,
  CreditCard,
  PieChart,
  RotateCcw,
  ArrowLeftRight,
  X,
} from 'lucide-react';

export const QuickAddSheet: React.FC = () => {
  const isAddSheetOpen = useLedgerlyStore((state) => state.isAddSheetOpen);
  const closeAddSheet = useLedgerlyStore((state) => state.closeAddSheet);
  const openInvoiceScreen = useLedgerlyStore((state) => state.openInvoiceScreen);
  const openPaymentIn = useLedgerlyStore((state) => state.openPaymentIn);
  const openPaymentOut = useLedgerlyStore((state) => state.openPaymentOut);
  const openExpenseModal = useLedgerlyStore((state) => state.openExpenseModal);
  const openTransferModal = useLedgerlyStore((state) => state.openTransferModal);

  if (!isAddSheetOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
      onClick={closeAddSheet}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl p-5 shadow-floating border-t border-border animate-in slide-in-from-bottom-5 duration-200 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="text-base font-bold text-slate-primary">Quick Accounting Actions</h3>
            <p className="text-xs text-slate-secondary">Vyapar-style Money In & Money Out modules</p>
          </div>
          <button
            type="button"
            onClick={closeAddSheet}
            className="p-1.5 rounded-full hover:bg-surface-subtle text-slate-secondary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Two Columns: Money In (Green) and Money Out (Red) */}
        <div className="grid grid-cols-2 gap-3">
          {/* MONEY IN COLUMN */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-1 text-moneyIn font-extrabold text-xs uppercase tracking-wide">
              <ArrowDownLeft size={16} strokeWidth={2.5} />
              <span>Money In</span>
            </div>

            <button
              type="button"
              onClick={() => {
                closeAddSheet();
                openInvoiceScreen('SALE');
              }}
              className="w-full p-2.5 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 flex items-center gap-2.5 text-left transition-all active:scale-95"
            >
              <div className="w-8 h-8 rounded-xl bg-moneyIn text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Receipt size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-950 block leading-tight">Add Sale</span>
                <span className="text-[10px] text-emerald-700">Tax Invoice</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                closeAddSheet();
                openPaymentIn();
              }}
              className="w-full p-2.5 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 flex items-center gap-2.5 text-left transition-all active:scale-95"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <CreditCard size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-950 block leading-tight">Payment In</span>
                <span className="text-[10px] text-emerald-700">Receive from customer</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                closeAddSheet();
                openInvoiceScreen('SALE_RETURN');
              }}
              className="w-full p-2.5 rounded-2xl bg-surface-subtle hover:bg-slate-200/50 border border-border flex items-center gap-2.5 text-left transition-all active:scale-95"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <RotateCcw size={15} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-primary block leading-tight">Sale Return</span>
                <span className="text-[10px] text-slate-secondary">Credit note</span>
              </div>
            </button>
          </div>

          {/* MONEY OUT COLUMN */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-1 text-moneyOut font-extrabold text-xs uppercase tracking-wide">
              <ArrowUpRight size={16} strokeWidth={2.5} />
              <span>Money Out</span>
            </div>

            <button
              type="button"
              onClick={() => {
                closeAddSheet();
                openInvoiceScreen('PURCHASE');
              }}
              className="w-full p-2.5 rounded-2xl bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200 flex items-center gap-2.5 text-left transition-all active:scale-95"
            >
              <div className="w-8 h-8 rounded-xl bg-moneyOut text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <ShoppingCart size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-950 block leading-tight">Add Purchase</span>
                <span className="text-[10px] text-rose-700">Supplier bill</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                closeAddSheet();
                openPaymentOut();
              }}
              className="w-full p-2.5 rounded-2xl bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200 flex items-center gap-2.5 text-left transition-all active:scale-95"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-700 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <CreditCard size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-950 block leading-tight">Payment Out</span>
                <span className="text-[10px] text-rose-700">Pay to supplier</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                closeAddSheet();
                openExpenseModal();
              }}
              className="w-full p-2.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 flex items-center gap-2.5 text-left transition-all active:scale-95"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <PieChart size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-950 block leading-tight">Expense</span>
                <span className="text-[10px] text-amber-700">Rent, salary, bills</span>
              </div>
            </button>
          </div>
        </div>

        {/* Transfer Button */}
        <div className="pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => {
              closeAddSheet();
              openTransferModal();
            }}
            className="w-full p-2.5 rounded-xl bg-surface-subtle hover:bg-slate-200/50 border border-border flex items-center justify-center gap-2 text-xs font-bold text-slate-primary"
          >
            <ArrowLeftRight size={15} />
            <span>Transfer Between Cash & Banks (Contra)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
