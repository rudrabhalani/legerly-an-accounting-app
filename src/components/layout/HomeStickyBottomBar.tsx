import React, { useState } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  CreditCard,
  RotateCcw,
  ShoppingCart,
  PieChart,
  X,
} from 'lucide-react';

export const HomeStickyBottomBar: React.FC = () => {
  const openInvoiceScreen = useLedgerlyStore((state) => state.openInvoiceScreen);
  const openPaymentIn = useLedgerlyStore((state) => state.openPaymentIn);
  const openPaymentOut = useLedgerlyStore((state) => state.openPaymentOut);
  const openExpenseModal = useLedgerlyStore((state) => state.openExpenseModal);

  const [activeMenu, setActiveMenu] = useState<'NONE' | 'IN' | 'OUT'>('NONE');

  return (
    <>
      {/* Quick Action Sheet for Money In */}
      {activeMenu === 'IN' && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center p-3 animate-in fade-in"
          onClick={() => setActiveMenu('NONE')}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-5 shadow-floating border border-border space-y-3 animate-in slide-in-from-bottom-5 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-moneyIn-tint text-moneyIn flex items-center justify-center font-bold">
                  <ArrowDownLeft size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-primary">Money In (Income / Inflow)</h4>
                  <p className="text-[11px] text-slate-secondary">Select an action to record</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveMenu('NONE')}
                className="p-1 rounded-full text-slate-muted hover:text-slate-primary"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setActiveMenu('NONE');
                  openInvoiceScreen('SALE');
                }}
                className="p-3 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 flex items-center gap-3 transition-all active:scale-98 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-moneyIn text-white flex items-center justify-center shadow-xs">
                  <Receipt size={20} />
                </div>
                <div>
                  <span className="text-sm font-bold text-emerald-950 block">Add Sale (Tax Invoice)</span>
                  <span className="text-[11px] text-emerald-700">Sell goods/services, update stock & party due</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveMenu('NONE');
                  openPaymentIn();
                }}
                className="p-3 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 flex items-center gap-3 transition-all active:scale-98 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                  <CreditCard size={20} />
                </div>
                <div>
                  <span className="text-sm font-bold text-emerald-950 block">Payment In (Receive Money)</span>
                  <span className="text-[11px] text-emerald-700">Receive settlement from customer into Cash/Bank</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveMenu('NONE');
                  openInvoiceScreen('SALE_RETURN');
                }}
                className="p-3 rounded-2xl bg-surface-subtle hover:bg-slate-200/50 border border-border flex items-center gap-3 transition-all active:scale-98 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <RotateCcw size={18} />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-primary block">Sale Return (Credit Note)</span>
                  <span className="text-[11px] text-slate-secondary">Customer returned goods, inward stock</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Sheet for Money Out */}
      {activeMenu === 'OUT' && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center p-3 animate-in fade-in"
          onClick={() => setActiveMenu('NONE')}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-5 shadow-floating border border-border space-y-3 animate-in slide-in-from-bottom-5 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-moneyOut-tint text-moneyOut flex items-center justify-center font-bold">
                  <ArrowUpRight size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-primary">Money Out (Expense / Outflow)</h4>
                  <p className="text-[11px] text-slate-secondary">Select an action to record</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveMenu('NONE')}
                className="p-1 rounded-full text-slate-muted hover:text-slate-primary"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setActiveMenu('NONE');
                  openInvoiceScreen('PURCHASE');
                }}
                className="p-3 rounded-2xl bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200 flex items-center gap-3 transition-all active:scale-98 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-moneyOut text-white flex items-center justify-center shadow-xs">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <span className="text-sm font-bold text-rose-950 block">Add Purchase (Supplier Bill)</span>
                  <span className="text-[11px] text-rose-700">Buy inventory, inward stock & record payable</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveMenu('NONE');
                  openPaymentOut();
                }}
                className="p-3 rounded-2xl bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200 flex items-center gap-3 transition-all active:scale-98 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-700 text-white flex items-center justify-center shadow-xs">
                  <CreditCard size={20} />
                </div>
                <div>
                  <span className="text-sm font-bold text-rose-950 block">Payment Out (Pay Supplier)</span>
                  <span className="text-[11px] text-rose-700">Pay supplier balance from Cash or Bank ledger</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveMenu('NONE');
                  openExpenseModal();
                }}
                className="p-3 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 flex items-center gap-3 transition-all active:scale-98 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <PieChart size={20} />
                </div>
                <div>
                  <span className="text-sm font-bold text-amber-950 block">Business Expense</span>
                  <span className="text-[11px] text-amber-700">Quick entry: Rent, Salary, Tea, Fuel, Electricity</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveMenu('NONE');
                  openInvoiceScreen('PURCHASE_RETURN');
                }}
                className="p-3 rounded-2xl bg-surface-subtle hover:bg-slate-200/50 border border-border flex items-center gap-3 transition-all active:scale-98 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <RotateCcw size={18} />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-primary block">Purchase Return (Debit Note)</span>
                  <span className="text-[11px] text-slate-secondary">Return damaged stock to supplier</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Bar with 2 Big Buttons */}
      <div className="fixed bottom-16 left-0 right-0 z-30 px-4 py-2 pointer-events-none">
        <div className="max-w-md mx-auto flex items-center gap-3 pointer-events-auto">
          {/* + MONEY IN (White background with thin blue border) */}
          <button
            type="button"
            onClick={() => setActiveMenu(activeMenu === 'IN' ? 'NONE' : 'IN')}
            className="flex-1 h-12 rounded-button bg-white hover:bg-blue-50/80 text-blue-700 border-2 border-blue-600 font-bold text-sm shadow-card flex items-center justify-center gap-2 active:scale-98 transition-all duration-150"
          >
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
              <ArrowDownLeft size={16} strokeWidth={2.5} />
            </div>
            <span>+ MONEY IN</span>
          </button>

          {/* − MONEY OUT (White background with thin red border) */}
          <button
            type="button"
            onClick={() => setActiveMenu(activeMenu === 'OUT' ? 'NONE' : 'OUT')}
            className="flex-1 h-12 rounded-button bg-white hover:bg-rose-50/80 text-rose-600 border-2 border-rose-500 font-bold text-sm shadow-card flex items-center justify-center gap-2 active:scale-98 transition-all duration-150"
          >
            <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <ArrowUpRight size={16} strokeWidth={2.5} />
            </div>
            <span>− MONEY OUT</span>
          </button>

        </div>
      </div>
    </>
  );
};
