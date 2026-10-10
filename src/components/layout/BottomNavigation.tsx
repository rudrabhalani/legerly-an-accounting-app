import React from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { Home, BarChart2, Package, Menu, Monitor } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const activeTab = useLedgerlyStore((state) => state.activeTab);
  const setActiveTab = useLedgerlyStore((state) => state.setActiveTab);

  const tabs = [
    { id: 'home' as const, label: 'HOME', icon: Home },
    { id: 'dashboard' as const, label: 'DASHBOARD', icon: BarChart2 },
    { id: 'items' as const, label: 'ITEMS', icon: Package },
    { id: 'menu' as const, label: 'MENU', icon: Menu },
    { id: 'getDesktop' as const, label: 'GET DESKTOP', isWindows: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-md pb-safe">
      <div className="max-w-xl lg:max-w-4xl mx-auto flex items-center justify-around h-[58px] px-1">
        {/* Tab 1: HOME */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 transition-all ${
            activeTab === 'home' ? 'text-[#1A73E8]' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Home size={22} strokeWidth={activeTab === 'home' ? 2.4 : 1.8} />
          <span className={`text-[10px] tracking-wider ${activeTab === 'home' ? 'font-black text-[#1A73E8]' : 'font-semibold'}`}>
            HOME
          </span>
        </button>

        {/* Tab 2: DASHBOARD */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 transition-all ${
            activeTab === 'dashboard' ? 'text-[#1A73E8]' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <BarChart2 size={22} strokeWidth={activeTab === 'dashboard' ? 2.4 : 1.8} />
          <span className={`text-[10px] tracking-wider ${activeTab === 'dashboard' ? 'font-black text-[#1A73E8]' : 'font-semibold'}`}>
            DASHBOARD
          </span>
        </button>

        {/* Tab 3: ITEMS */}
        <button
          type="button"
          onClick={() => setActiveTab('items')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 transition-all ${
            activeTab === 'items' || activeTab === 'stock' ? 'text-[#1A73E8]' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Package size={22} strokeWidth={activeTab === 'items' || activeTab === 'stock' ? 2.4 : 1.8} />
          <span className={`text-[10px] tracking-wider ${activeTab === 'items' || activeTab === 'stock' ? 'font-black text-[#1A73E8]' : 'font-semibold'}`}>
            ITEMS
          </span>
        </button>

        {/* Tab 4: MENU */}
        <button
          type="button"
          onClick={() => setActiveTab('menu')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 transition-all ${
            activeTab === 'menu' ? 'text-[#1A73E8]' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Menu size={22} strokeWidth={activeTab === 'menu' ? 2.4 : 1.8} />
          <span className={`text-[10px] tracking-wider ${activeTab === 'menu' ? 'font-black text-[#1A73E8]' : 'font-semibold'}`}>
            MENU
          </span>
        </button>

        {/* Tab 5: GET DESKTOP (Windows 4-Color Logo) */}
        <button
          type="button"
          onClick={() => setActiveTab('getDesktop')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 transition-all ${
            activeTab === 'getDesktop' ? 'text-[#1A73E8]' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {/* Windows 4-Color Tile Logo Icon */}
          <div className="w-[20px] h-[20px] grid grid-cols-2 gap-[2px] items-center justify-center">
            <div className="w-[9px] h-[9px] bg-[#F25022] rounded-[1px]"></div>
            <div className="w-[9px] h-[9px] bg-[#7FBA00] rounded-[1px]"></div>
            <div className="w-[9px] h-[9px] bg-[#00A4EF] rounded-[1px]"></div>
            <div className="w-[9px] h-[9px] bg-[#FFB900] rounded-[1px]"></div>
          </div>
          <span className={`text-[9px] sm:text-[10px] tracking-wider whitespace-nowrap ${activeTab === 'getDesktop' ? 'font-black text-[#1A73E8]' : 'font-semibold'}`}>
            GET DESKTOP
          </span>
        </button>
      </div>
    </nav>
  );
};
