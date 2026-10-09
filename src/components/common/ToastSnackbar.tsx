import React, { useEffect } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { RotateCcw, X } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

export const ToastSnackbar: React.FC = () => {
  const lastDeletedTransaction = useLedgerlyStore((state) => state.lastDeletedTransaction);
  const undoDeleteTransaction = useLedgerlyStore((state) => state.undoDeleteTransaction);
  const clearLastDeletedTransaction = useLedgerlyStore((state) => state.clearLastDeletedTransaction);

  useEffect(() => {
    if (!lastDeletedTransaction) return;
    const timer = setTimeout(() => {
      clearLastDeletedTransaction();
    }, 6000); // 6 seconds undo window
    return () => clearTimeout(timer);
  }, [lastDeletedTransaction, clearLastDeletedTransaction]);

  if (!lastDeletedTransaction) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto z-50 animate-bounce">
      <div className="bg-slate-primary text-white px-4 py-3 rounded-2xl shadow-floating flex items-center justify-between border border-slate-700">
        <div className="flex items-center gap-2.5 truncate">
          <span className="text-sm font-medium truncate">
            Deleted {lastDeletedTransaction.category} ({formatINR(lastDeletedTransaction.amount)})
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={undoDeleteTransaction}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary rounded-xl text-xs font-bold hover:bg-primary-hover active:scale-95 transition-all text-white"
          >
            <RotateCcw size={14} />
            Undo
          </button>
          <button
            type="button"
            onClick={clearLastDeletedTransaction}
            className="p-1 text-slate-muted hover:text-white"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
