import React from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { getTranslation } from '../../i18n/translations';
import { ArrowDownLeft, ArrowUpRight, FileText, ArrowLeftRight, X } from 'lucide-react';

export const QuickAddSheet: React.FC = () => {
  const isAddSheetOpen = useLedgerlyStore((state) => state.isAddSheetOpen);
  const closeAddSheet = useLedgerlyStore((state) => state.closeAddSheet);
  const openMoneyIn = useLedgerlyStore((state) => state.openMoneyIn);
  const openMoneyOut = useLedgerlyStore((state) => state.openMoneyOut);
  const openInvoiceModal = useLedgerlyStore((state) => state.openInvoiceModal);
  const openTransferModal = useLedgerlyStore((state) => state.openTransferModal);
  const language = useLedgerlyStore((state) => state.business.language);
  const t = getTranslation(language);

  if (!isAddSheetOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-6 shadow-floating border-t border-border animate-in slide-in-from-bottom-5 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h3 className="text-base font-bold text-slate-primary">Quick Actions</h3>
            <p className="text-xs text-slate-secondary">Record a new transaction or document</p>
          </div>
          <button
            type="button"
            onClick={closeAddSheet}
            className="p-1.5 rounded-full hover:bg-surface-subtle text-slate-secondary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Options */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {/* Money In */}
          <button
            type="button"
            onClick={() => openMoneyIn()}
            className="flex flex-col items-center justify-center p-4 rounded-card bg-moneyIn-tint/60 border border-moneyIn/30 hover:bg-moneyIn-tint transition-all active:scale-95 text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-moneyIn text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
              <ArrowDownLeft size={24} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm text-moneyIn-dark">{t.moneyIn}</span>
            <span className="text-[11px] text-slate-secondary mt-0.5">Receive from customer</span>
          </button>

          {/* Money Out */}
          <button
            type="button"
            onClick={() => openMoneyOut()}
            className="flex flex-col items-center justify-center p-4 rounded-card bg-moneyOut-tint/60 border border-moneyOut/30 hover:bg-moneyOut-tint transition-all active:scale-95 text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-moneyOut text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
              <ArrowUpRight size={24} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm text-moneyOut-dark">{t.moneyOut}</span>
            <span className="text-[11px] text-slate-secondary mt-0.5">Pay to supplier/expense</span>
          </button>

          {/* New Invoice */}
          <button
            type="button"
            onClick={openInvoiceModal}
            className="flex flex-col items-center justify-center p-4 rounded-card bg-primary-light/60 border border-primary/20 hover:bg-primary-light transition-all active:scale-95 text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
              <FileText size={24} strokeWidth={2.2} />
            </div>
            <span className="font-bold text-sm text-primary-dark">{t.createInvoice}</span>
            <span className="text-[11px] text-slate-secondary mt-0.5">Sale or purchase bill</span>
          </button>

          {/* Transfer */}
          <button
            type="button"
            onClick={openTransferModal}
            className="flex flex-col items-center justify-center p-4 rounded-card bg-surface-subtle border border-border hover:bg-slate-200/50 transition-all active:scale-95 text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-700 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
              <ArrowLeftRight size={22} strokeWidth={2.2} />
            </div>
            <span className="font-bold text-sm text-slate-primary">{t.transferMoney}</span>
            <span className="text-[11px] text-slate-secondary mt-0.5">Cash ↔ Bank / Inter-bank</span>
          </button>
        </div>
      </div>
    </div>
  );
};
