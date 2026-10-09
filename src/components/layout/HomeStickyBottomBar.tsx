import React from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { getTranslation } from '../../i18n/translations';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export const HomeStickyBottomBar: React.FC = () => {
  const openMoneyIn = useLedgerlyStore((state) => state.openMoneyIn);
  const openMoneyOut = useLedgerlyStore((state) => state.openMoneyOut);
  const language = useLedgerlyStore((state) => state.business.language);
  const t = getTranslation(language);

  return (
    <div className="fixed bottom-16 left-0 right-0 z-30 px-4 py-2 pointer-events-none">
      <div className="max-w-md mx-auto flex items-center gap-3 pointer-events-auto">
        {/* + Money In (Solid Emerald Green) */}
        <button
          type="button"
          onClick={() => openMoneyIn()}
          className="flex-1 h-12 rounded-button bg-moneyIn hover:bg-moneyIn-hover text-white font-bold text-sm shadow-floating flex items-center justify-center gap-2 active:scale-98 transition-all duration-150"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <ArrowDownLeft size={16} strokeWidth={2.5} />
          </div>
          <span>{t.moneyIn}</span>
        </button>

        {/* − Money Out (Solid Coral Red) */}
        <button
          type="button"
          onClick={() => openMoneyOut()}
          className="flex-1 h-12 rounded-button bg-moneyOut hover:bg-moneyOut-hover text-white font-bold text-sm shadow-floating flex items-center justify-center gap-2 active:scale-98 transition-all duration-150"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <ArrowUpRight size={16} strokeWidth={2.5} />
          </div>
          <span>{t.moneyOut}</span>
        </button>
      </div>
    </div>
  );
};
