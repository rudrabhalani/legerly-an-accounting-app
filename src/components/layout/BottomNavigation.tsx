import React from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { getTranslation } from '../../i18n/translations';
import { Home, Building2, Plus, Users, BarChart3 } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const activeTab = useLedgerlyStore((state) => state.activeTab);
  const setActiveTab = useLedgerlyStore((state) => state.setActiveTab);
  const openAddSheet = useLedgerlyStore((state) => state.openAddSheet);
  const language = useLedgerlyStore((state) => state.business.language);
  const t = getTranslation(language);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border pb-safe">
      <div className="max-w-xl lg:max-w-2xl mx-auto flex items-center justify-around h-16 px-4">
        {/* Tab 1: Home */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
            activeTab === 'home' ? 'text-primary font-bold' : 'text-slate-secondary hover:text-slate-primary'
          }`}
        >
          <Home size={20} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          <span className="text-[11px] mt-1">{t.home}</span>
        </button>

        {/* Tab 2: Bank Ledger */}
        <button
          type="button"
          onClick={() => setActiveTab('bankLedger')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
            activeTab === 'bankLedger' ? 'text-primary font-bold' : 'text-slate-secondary hover:text-slate-primary'
          }`}
        >
          <Building2 size={20} strokeWidth={activeTab === 'bankLedger' ? 2.5 : 2} />
          <span className="text-[11px] mt-1">Bank Ledger</span>
        </button>

        {/* Center: Quick Action Button [+] */}
        <div className="flex-1 flex justify-center items-center">
          <button
            type="button"
            onClick={openAddSheet}
            className="w-12 h-12 rounded-full bg-primary text-white shadow-elevated flex items-center justify-center -translate-y-3 hover:bg-primary-hover active:scale-95 transition-all"
            aria-label="Add new record"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>
        </div>

        {/* Tab 4: Parties */}
        <button
          type="button"
          onClick={() => setActiveTab('parties')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
            activeTab === 'parties' ? 'text-primary font-bold' : 'text-slate-secondary hover:text-slate-primary'
          }`}
        >
          <Users size={20} strokeWidth={activeTab === 'parties' ? 2.5 : 2} />
          <span className="text-[11px] mt-1">{t.parties}</span>
        </button>

        {/* Tab 5: Reports */}
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
            activeTab === 'reports' ? 'text-primary font-bold' : 'text-slate-secondary hover:text-slate-primary'
          }`}
        >
          <BarChart3 size={20} strokeWidth={activeTab === 'reports' ? 2.5 : 2} />
          <span className="text-[11px] mt-1">{t.reports}</span>
        </button>
      </div>
    </nav>
  );
};
