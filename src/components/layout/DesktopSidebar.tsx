import React, { useState } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import {
  Home,
  Users,
  Package,
  ShoppingBag,
  ShoppingCart,
  Receipt,
  Building2,
  BarChart2,
  Settings,
  ChevronDown,
  ChevronRight,
  Plus,
  Store,
  DollarSign,
  FileCheck,
  CreditCard,
  CloudCheck,
  Shield,
  Lock,
} from 'lucide-react';

export const DesktopSidebar: React.FC = () => {
  const activeTab = useLedgerlyStore((state) => state.activeTab);
  const setActiveTab = useLedgerlyStore((state) => state.setActiveTab);
  const business = useLedgerlyStore((state) => state.business);
  const openInvoiceScreen = useLedgerlyStore((state) => state.openInvoiceScreen);
  const openPaymentIn = useLedgerlyStore((state) => state.openPaymentIn);
  const openPaymentOut = useLedgerlyStore((state) => state.openPaymentOut);
  const openExpenseModal = useLedgerlyStore((state) => state.openExpenseModal);
  const openSettings = useLedgerlyStore((state) => state.openSettings);
  const openProfileModal = useLedgerlyStore((state) => state.openProfileModal);
  const openMultiUserModal = useLedgerlyStore((state) => state.openMultiUserModal);
  const openAuthModal = useLedgerlyStore((state) => state.openAuthModal);
  const users = useLedgerlyStore((state) => state.users);
  const currentUserId = useLedgerlyStore((state) => state.currentUserId);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  const [isSaleOpen, setIsSaleOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isCashBankOpen, setIsCashBankOpen] = useState(false);

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#161F30] text-gray-300 h-screen sticky top-0 flex-shrink-0 border-r border-[#222E44] select-none z-30">
      {/* 1. TOP BRAND & COMPANY SWITCHER (Exact Vyapar Desktop Sidebar) */}
      <div
        onClick={openProfileModal}
        className="p-4 border-b border-[#222E44] hover:bg-[#1E293B] cursor-pointer transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#E31E38] text-white flex items-center justify-center font-black text-lg shadow-sm flex-shrink-0">
            {business.name ? business.name[0].toUpperCase() : 'V'}
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-white truncate leading-tight">
              {business.name || 'My Company'}
            </h1>
            <span className="text-[11px] text-gray-400 block truncate">
              {business.gstin ? `GST: ${business.gstin}` : 'Switch Company'}
            </span>
          </div>
        </div>
        <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
      </div>

      {/* 2. NAVIGATION LINKS */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-700">
        {/* Home */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'home'
              ? 'bg-[#1A73E8] text-white shadow-xs'
              : 'text-gray-300 hover:bg-[#1E293B] hover:text-white'
          }`}
        >
          <Home size={18} />
          <span>Home</span>
        </button>

        {/* Dashboard */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-[#1A73E8] text-white shadow-xs'
              : 'text-gray-300 hover:bg-[#1E293B] hover:text-white'
          }`}
        >
          <BarChart2 size={18} />
          <span>Dashboard</span>
        </button>

        {/* Parties */}
        <button
          type="button"
          onClick={() => setActiveTab('parties')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'parties'
              ? 'bg-[#1A73E8] text-white shadow-xs'
              : 'text-gray-300 hover:bg-[#1E293B] hover:text-white'
          }`}
        >
          <Users size={18} />
          <span>Parties</span>
        </button>

        {/* Items */}
        <button
          type="button"
          onClick={() => setActiveTab('items')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'items' || activeTab === 'stock'
              ? 'bg-[#1A73E8] text-white shadow-xs'
              : 'text-gray-300 hover:bg-[#1E293B] hover:text-white'
          }`}
        >
          <Package size={18} />
          <span>Items</span>
        </button>

        {/* SALE DROPDOWN */}
        <div>
          <button
            type="button"
            onClick={() => setIsSaleOpen(!isSaleOpen)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:bg-[#1E293B] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag size={18} className="text-[#E31E38]" />
              <span>Sale</span>
            </div>
            {isSaleOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {isSaleOpen && (
            <div className="pl-9 pr-2 py-1 space-y-1">
              <button
                type="button"
                onClick={() => openInvoiceScreen('SALE')}
                className="w-full text-left py-1.5 px-2 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#1E293B] flex items-center justify-between"
              >
                <span>Sale Invoices</span>
                <span className="text-[10px] text-gray-400">Alt+S</span>
              </button>
              <button
                type="button"
                onClick={() => openInvoiceScreen('QUOTATION')}
                className="w-full text-left py-1.5 px-2 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#1E293B]"
              >
                Estimate / Quotation
              </button>
              <button
                type="button"
                onClick={() => openPaymentIn()}
                className="w-full text-left py-1.5 px-2 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#1E293B]"
              >
                Payment In
              </button>
              <button
                type="button"
                onClick={() => openInvoiceScreen('SALE_ORDER')}
                className="w-full text-left py-1.5 px-2 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#1E293B]"
              >
                Sale Order
              </button>
              <button
                type="button"
                onClick={() => openInvoiceScreen('DELIVERY_CHALLAN')}
                className="w-full text-left py-1.5 px-2 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#1E293B]"
              >
                Delivery Challan
              </button>
              <button
                type="button"
                onClick={() => openInvoiceScreen('SALE_RETURN')}
                className="w-full text-left py-1.5 px-2 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#1E293B]"
              >
                Sale Return
              </button>
            </div>
          )}
        </div>

        {/* PURCHASE DROPDOWN */}
        <div>
          <button
            type="button"
            onClick={() => setIsPurchaseOpen(!isPurchaseOpen)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:bg-[#1E293B] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart size={18} className="text-[#1A73E8]" />
              <span>Purchase</span>
            </div>
            {isPurchaseOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {isPurchaseOpen && (
            <div className="pl-9 pr-2 py-1 space-y-1">
              <button
                type="button"
                onClick={() => openInvoiceScreen('PURCHASE')}
                className="w-full text-left py-1.5 px-2 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#1E293B] flex items-center justify-between"
              >
                <span>Purchase Bills</span>
                <span className="text-[10px] text-gray-400">Alt+P</span>
              </button>
              <button
                type="button"
                onClick={() => openPaymentOut()}
                className="w-full text-left py-1.5 px-2 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#1E293B]"
              >
                Payment Out
              </button>
              <button
                type="button"
                onClick={() => openInvoiceScreen('PURCHASE_ORDER')}
                className="w-full text-left py-1.5 px-2 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#1E293B]"
              >
                Purchase Order
              </button>
              <button
                type="button"
                onClick={() => openInvoiceScreen('PURCHASE_RETURN')}
                className="w-full text-left py-1.5 px-2 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#1E293B]"
              >
                Purchase Return
              </button>
            </div>
          )}
        </div>

        {/* Expenses */}
        <button
          type="button"
          onClick={openExpenseModal}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:bg-[#1E293B] hover:text-white transition-colors"
        >
          <Receipt size={18} className="text-amber-500" />
          <span>Expenses</span>
        </button>

        {/* CASH & BANK DROPDOWN */}
        <div>
          <button
            type="button"
            onClick={() => setIsCashBankOpen(!isCashBankOpen)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:bg-[#1E293B] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-3">
              <Building2 size={18} className="text-sky-400" />
              <span>Cash & Bank</span>
            </div>
            {isCashBankOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {isCashBankOpen && (
            <div className="pl-9 pr-2 py-1 space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab('bankLedger')}
                className="w-full text-left py-1.5 px-2 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#1E293B]"
              >
                Bank Accounts
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bankLedger')}
                className="w-full text-left py-1.5 px-2 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#1E293B]"
              >
                Cash In-Hand
              </button>
            </div>
          )}
        </div>

        {/* Reports */}
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'reports'
              ? 'bg-[#1A73E8] text-white shadow-xs'
              : 'text-gray-300 hover:bg-[#1E293B] hover:text-white'
          }`}
        >
          <BarChart2 size={18} className="text-purple-400" />
          <span>Reports</span>
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={openSettings}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:bg-[#1E293B] hover:text-white transition-colors"
        >
          <Settings size={18} className="text-gray-400" />
          <span>Settings</span>
        </button>
      </nav>

      {/* 3. BOTTOM USER STATUS & CLOUD SYNC BADGE */}
      <div className="p-3 border-t border-[#222E44] space-y-2">
        <div
          onClick={openMultiUserModal}
          className="flex items-center justify-between p-2 rounded-xl bg-[#1E293B]/60 hover:bg-[#1E293B] cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-blue-500/20 text-[#1A73E8] flex items-center justify-center font-bold text-xs flex-shrink-0">
              {currentUser.name[0]}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-gray-400 block truncate">
                {currentUser.role}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openAuthModal();
            }}
            className="p-1 rounded text-gray-400 hover:text-white"
            title="Lock App"
          >
            <Lock size={14} />
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-400 px-1 font-medium">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Cloud Synced</span>
          </span>
          <span className="text-gray-500">v2.4 Pro</span>
        </div>
      </div>
    </aside>
  );
};
