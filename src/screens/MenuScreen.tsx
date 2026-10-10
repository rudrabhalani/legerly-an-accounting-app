import React, { useState } from 'react';
import { useLedgerlyStore } from '../store/useLedgerlyStore';
import {
  ShoppingBag,
  ShoppingCart,
  Receipt,
  Globe,
  BarChart2,
  Building2,
  DollarSign,
  FileCheck,
  CreditCard,
  RefreshCw,
  FolderPlus,
  Users,
  Settings,
  ChevronRight,
  ChevronDown,
  Store,
  Phone,
  Edit2,
  Printer,
  ShieldCheck,
  FileText,
  Share2,
  ExternalLink,
  Lock,
} from 'lucide-react';

export const MenuScreen: React.FC = () => {
  const business = useLedgerlyStore((state) => state.business);
  const openInvoiceScreen = useLedgerlyStore((state) => state.openInvoiceScreen);
  const openPaymentIn = useLedgerlyStore((state) => state.openPaymentIn);
  const openPaymentOut = useLedgerlyStore((state) => state.openPaymentOut);
  const openExpenseModal = useLedgerlyStore((state) => state.openExpenseModal);
  const openDayBook = useLedgerlyStore((state) => state.openDayBook);
  const openBalanceSheet = useLedgerlyStore((state) => state.openBalanceSheet);
  const openBillWisePnl = useLedgerlyStore((state) => state.openBillWisePnl);
  const openChequesModal = useLedgerlyStore((state) => state.openChequesModal);
  const openLoanAccountsModal = useLedgerlyStore((state) => state.openLoanAccountsModal);
  const openBackupModal = useLedgerlyStore((state) => state.openBackupModal);
  const openSettings = useLedgerlyStore((state) => state.openSettings);
  const openPrintSettings = useLedgerlyStore((state) => state.openPrintSettings);
  const openMultiUserModal = useLedgerlyStore((state) => state.openMultiUserModal);
  const openProfileModal = useLedgerlyStore((state) => state.openProfileModal);
  const openAuthModal = useLedgerlyStore((state) => state.openAuthModal);
  const setActiveTab = useLedgerlyStore((state) => state.setActiveTab);

  // Accordion collapsed state
  const [expandedSection, setExpandedSection] = useState<{ [key: string]: boolean }>({
    business: true,
    cashBank: true,
    utilities: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSection((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4 pb-28 pt-2 max-w-xl lg:max-w-4xl mx-auto">
      {/* 1. TOP BUSINESS CARD: Shop Avatar, Name, Phone & Edit Profile (Exact Vyapar Menu) */}
      <div
        onClick={openProfileModal}
        className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-300 transition-all active:scale-[0.99]"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-[#E31E38] shadow-xs">
            <Store size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-black text-gray-900 leading-tight">
                {business.name || 'My Business'}
              </h2>
              <Edit2 size={13} className="text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-1">
              <Phone size={11} className="text-gray-400" />
              <span>{business.phone || '+91 98765 43210'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-bold text-[#1A73E8]">
          <span>Profile</span>
          <ChevronRight size={16} />
        </div>
      </div>

      {/* 2. SECTION 1: MY BUSINESS (Exact Screenshot 5) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('business')}
          className="w-full px-4 py-3 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between text-left"
        >
          <span className="text-xs font-black uppercase tracking-wider text-gray-500">
            My Business
          </span>
          {expandedSection.business ? (
            <ChevronDown size={16} className="text-gray-400" />
          ) : (
            <ChevronRight size={16} className="text-gray-400" />
          )}
        </button>

        {expandedSection.business && (
          <div className="divide-y divide-gray-100">
            {/* Sale */}
            <div
              onClick={() => openInvoiceScreen('SALE')}
              className="p-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-[#E31E38] flex items-center justify-center">
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Sale</h4>
                  <p className="text-[11px] text-gray-500">
                    Sale Invoice, Estimate, Payment In, Order, Challan, Return
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>

            {/* Purchase */}
            <div
              onClick={() => openInvoiceScreen('PURCHASE')}
              className="p-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1A73E8] flex items-center justify-center">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Purchase</h4>
                  <p className="text-[11px] text-gray-500">
                    Purchase Bills, Payment Out, Purchase Order, Return
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>

            {/* Expenses */}
            <div
              onClick={openExpenseModal}
              className="p-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Receipt size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Expenses</h4>
                  <p className="text-[11px] text-gray-500">
                    Rent, Electricity, Tea/Snacks, Wages, Petty Cash
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>

            {/* My Online Store */}
            <div
              onClick={() => {
                alert(`🌐 Your Online Store link:\nhttps://ledgerly.in/store/${business.gstin || 'shop'}\n\nCustomers can place orders & pay via UPI instantly!`);
              }}
              className="p-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Globe size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-gray-900">My Online Store</h4>
                    <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black">
                      NEW
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Share catalog link with customers & take orders online
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>

            {/* Reports */}
            <div
              onClick={() => setActiveTab('reports')}
              className="p-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <BarChart2 size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Reports</h4>
                  <p className="text-[11px] text-gray-500">
                    Day Book, GSTR-1, Balance Sheet, P&L, Cash Flow, Bill Profit
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
          </div>
        )}
      </div>

      {/* 3. SECTION 2: CASH & BANK (Exact Screenshot 5) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('cashBank')}
          className="w-full px-4 py-3 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between text-left"
        >
          <span className="text-xs font-black uppercase tracking-wider text-gray-500">
            Cash & Bank
          </span>
          {expandedSection.cashBank ? (
            <ChevronDown size={16} className="text-gray-400" />
          ) : (
            <ChevronRight size={16} className="text-gray-400" />
          )}
        </button>

        {expandedSection.cashBank && (
          <div className="divide-y divide-gray-100">
            {/* Bank Accounts */}
            <div
              onClick={() => setActiveTab('bankLedger')}
              className="p-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Building2 size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Bank Accounts</h4>
                  <p className="text-[11px] text-gray-500">
                    Current, Savings, UPI, Overdraft & bank ledgers
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>

            {/* Cash In-Hand */}
            <div
              onClick={() => setActiveTab('bankLedger')}
              className="p-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                  <DollarSign size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Cash In-Hand</h4>
                  <p className="text-[11px] text-gray-500">
                    Physical cash in shop cash drawer / cash box
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>

            {/* Cheques */}
            <div
              onClick={openChequesModal}
              className="p-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <FileCheck size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Cheques</h4>
                  <p className="text-[11px] text-gray-500">
                    Received, Deposited, Uncleared & Bounced cheques
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>

            {/* Loan Accounts */}
            <div
              onClick={openLoanAccountsModal}
              className="p-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Loan Accounts</h4>
                  <p className="text-[11px] text-gray-500">
                    Bank loans, Personal borrowings, EMIs & Interest
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
          </div>
        )}
      </div>

      {/* 4. SECTION 3: IMPORTANT UTILITIES (Exact Screenshot 5) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('utilities')}
          className="w-full px-4 py-3 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between text-left"
        >
          <span className="text-xs font-black uppercase tracking-wider text-gray-500">
            Important Utilities
          </span>
          {expandedSection.utilities ? (
            <ChevronDown size={16} className="text-gray-400" />
          ) : (
            <ChevronRight size={16} className="text-gray-400" />
          )}
        </button>

        {expandedSection.utilities && (
          <div className="divide-y divide-gray-100">
            {/* Sync & Share */}
            <div
              onClick={openBackupModal}
              className="p-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <RefreshCw size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Sync & Share</h4>
                  <p className="text-[11px] text-gray-500">
                    Auto backup to Google Drive, Export data, Restore
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>

            {/* Manage Companies */}
            <div
              onClick={openProfileModal}
              className="p-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <FolderPlus size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Manage Companies</h4>
                  <p className="text-[11px] text-gray-500">
                    Switch business firms, create multi-firm branches
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>

            {/* User Management & Security */}
            <div
              onClick={openMultiUserModal}
              className="p-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Users size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-gray-900">User Management</h4>
                    <span className="px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-700 text-[9px] font-black">
                      4-DIGIT PIN
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Add Salesman, Accountant, Admin & Staff permissions
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>

            {/* PIN Security Switcher */}
            <div
              onClick={openAuthModal}
              className="p-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#E31E38] flex items-center justify-center">
                  <Lock size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Security & App Lock</h4>
                  <p className="text-[11px] text-gray-500">
                    Enable 4-digit PIN lock to prevent unauthorized access
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>

            {/* Settings */}
            <div
              onClick={openSettings}
              className="p-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center">
                  <Settings size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Settings</h4>
                  <p className="text-[11px] text-gray-500">
                    Invoice themes, Thermal/A4 print, Tax rates & GST
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
