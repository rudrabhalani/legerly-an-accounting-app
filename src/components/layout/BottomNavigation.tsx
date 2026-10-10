import React from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { getTranslation } from '../../i18n/translations';
import { Home, Users, Plus, Package, BarChart3, Building2 } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const activeTab = useLedgerlyStore((state) => state.activeTab);
  const setActiveTab = useLedgerlyStore((state) => state.setActiveTab);
  const openAddSheet = useLedgerlyStore((state) => state.openAddSheet);
  const language = useLedgerlyStore((state) => state.business.language);
  const t = getTranslation(language);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white shadow-nav pb-safe border-t border-gray-200">
      <div className="max-w-xl lg:max-w-2xl mx-auto flex items-center justify-around h-[56px] px-1">
        {/* Tab 1: Home */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-0.5 transition-all ${
            activeTab === 'home' ? 'text-[#ED1A3B]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Home
            size={22}
            strokeWidth={activeTab === 'home' ? 2.5 : 1.8}
            fill={activeTab === 'home' ? '#ED1A3B' : 'none'}
          />
          <span className={`text-[10px] font-bold ${activeTab === 'home' ? 'text-[#ED1A3B]' : 'text-gray-500'}`}>
            Home
          </span>
        </button>

        {/* Tab 2: Parties */}
        <button
          type="button"
          onClick={() => setActiveTab('parties')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-0.5 transition-all ${
            activeTab === 'parties' ? 'text-[#ED1A3B]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Users
            size={22}
            strokeWidth={activeTab === 'parties' ? 2.5 : 1.8}
          />
          <span className={`text-[10px] font-bold ${activeTab === 'parties' ? 'text-[#ED1A3B]' : 'text-gray-500'}`}>
            Parties
          </span>
        </button>

        {/* Center: Vyapar Signature Red FAB (+) Button */}
        <div className="flex-1 flex justify-center items-center">
          <button
            type="button"
            onClick={openAddSheet}
            className="w-[52px] h-[52px] rounded-full bg-[#ED1A3B] hover:bg-[#D32F2F] shadow-lg flex items-center justify-center -translate-y-3 active:scale-95 transition-all"
            aria-label="Add new transaction"
            style={{ boxShadow: '0 4px 14px rgba(237,26,59,0.45)' }}
          >
            <Plus size={28} strokeWidth={2.8} className="text-white" />
          </button>
        </div>

        {/* Tab 4: Items (Stock) */}
        <button
          type="button"
          onClick={() => setActiveTab('stock')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-0.5 transition-all ${
            activeTab === 'stock' ? 'text-[#ED1A3B]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Package
            size={22}
            strokeWidth={activeTab === 'stock' ? 2.5 : 1.8}
          />
          <span className={`text-[10px] font-bold ${activeTab === 'stock' ? 'text-[#ED1A3B]' : 'text-gray-500'}`}>
            Items
          </span>
        </button>

        {/* Tab 5: Reports */}
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-0.5 transition-all ${
            activeTab === 'reports' ? 'text-[#ED1A3B]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <BarChart3
            size={22}
            strokeWidth={activeTab === 'reports' ? 2.5 : 1.8}
          />
          <span className={`text-[10px] font-bold ${activeTab === 'reports' ? 'text-[#ED1A3B]' : 'text-gray-500'}`}>
            Reports
          </span>
        </button>
      </div>
    </nav>
  );
};
