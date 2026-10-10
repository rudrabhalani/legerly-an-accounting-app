import React from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import {
  X,
  Building2,
  FileText,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  Receipt,
  Scale,
  Percent,
  Clock,
  CreditCard,
  Printer,
  Database,
  BookOpen,
  DollarSign,
  Share2,
  ChevronRight,
  ShieldCheck,
  PhoneCall,
} from 'lucide-react';

interface VyaparDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VyaparDrawer: React.FC<VyaparDrawerProps> = ({ isOpen, onClose }) => {
  const business = useLedgerlyStore((state) => state.business);
  const activeFY = useLedgerlyStore((state) => state.activeFinancialYear);
  const setActiveTab = useLedgerlyStore((state) => state.setActiveTab);
  const openInvoiceScreen = useLedgerlyStore((state) => state.openInvoiceScreen);
  const openPaymentIn = useLedgerlyStore((state) => state.openPaymentIn);
  const openPaymentOut = useLedgerlyStore((state) => state.openPaymentOut);
  const openExpenseModal = useLedgerlyStore((state) => state.openExpenseModal);
  const openDayBook = useLedgerlyStore((state) => state.openDayBook);
  const openBalanceSheet = useLedgerlyStore((state) => state.openBalanceSheet);
  const openBillWisePnl = useLedgerlyStore((state) => state.openBillWisePnl);
  const openGstrReportModal = useLedgerlyStore((state) => state.openGstrReportModal);
  const openAgeingReportModal = useLedgerlyStore((state) => state.openAgeingReportModal);
  const openCashFlowModal = useLedgerlyStore((state) => state.openCashFlowModal);
  const openChequesModal = useLedgerlyStore((state) => state.openChequesModal);
  const openLoanAccountsModal = useLedgerlyStore((state) => state.openLoanAccountsModal);
  const openPrintSettings = useLedgerlyStore((state) => state.openPrintSettings);
  const openBackupModal = useLedgerlyStore((state) => state.openBackupModal);
  const openSettings = useLedgerlyStore((state) => state.openSettings);
  const openFinancialYearModal = useLedgerlyStore((state) => state.openFinancialYearModal);

  if (!isOpen) return null;

  const navigateTo = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-72 sm:w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto animate-in slide-in-from-left duration-200">
        {/* Header Profile Card (Vyapar Style) */}
        <div className="bg-gradient-to-r from-[#ED1A3B] to-[#C21833] text-white p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white text-[#ED1A3B] font-extrabold text-xl flex items-center justify-center shadow-md">
                {(business.name || 'S').substring(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-base leading-tight truncate">
                  {business.name || 'Shree Sweet'}
                </h3>
                <span className="text-[11px] text-white/90 block mt-0.5 truncate">
                  {business.phone ? `+91 ${business.phone}` : 'GST Billing & Khata'}
                </span>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold tracking-wide">
                  FY {activeFY}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10"
            >
              <X size={20} />
            </button>
          </div>

          {business.gstin && (
            <div className="mt-3 pt-2 border-t border-white/20 text-[11px] text-white/90">
              GSTIN: <span className="font-mono font-bold">{business.gstin}</span>
            </div>
          )}
        </div>

        {/* Drawer Menu Sections */}
        <div className="flex-1 py-2 divide-y divide-gray-100 text-xs">
          {/* Section 1: Core Navigation */}
          <div className="py-2">
            <div className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Quick Nav
            </div>
            <button
              onClick={() => navigateTo(() => setActiveTab('home'))}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50 active:bg-red-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <FileText size={16} className="text-[#ED1A3B]" />
                <span>Dashboard & Home</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => navigateTo(() => setActiveTab('parties'))}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50 active:bg-red-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <Users size={16} className="text-purple-600" />
                <span>Parties / Khata Ledger</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => navigateTo(() => setActiveTab('stock'))}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50 active:bg-red-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <Package size={16} className="text-amber-600" />
                <span>Items & Stock Inventory</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => navigateTo(() => setActiveTab('bankLedger'))}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50 active:bg-red-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <Building2 size={16} className="text-blue-600" />
                <span>Cash & Bank Ledgers</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
          </div>

          {/* Section 2: Sales & Income */}
          <div className="py-2">
            <div className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Sales & Invoicing
            </div>
            <button
              onClick={() => navigateTo(() => openInvoiceScreen('SALE'))}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <Receipt size={16} className="text-emerald-600" />
                <span>+ Create Sale Invoice</span>
              </div>
              <span className="text-[10px] font-bold text-white bg-emerald-600 px-1.5 py-0.5 rounded">NEW</span>
            </button>
            <button
              onClick={() => navigateTo(() => openPaymentIn())}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <DollarSign size={16} className="text-emerald-600" />
                <span>+ Payment In (Receive)</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => navigateTo(() => openInvoiceScreen('QUOTATION'))}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <FileText size={16} className="text-indigo-600" />
                <span>Estimate / Quotation</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => navigateTo(() => openInvoiceScreen('SALE_ORDER'))}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <FileText size={16} className="text-blue-600" />
                <span>Sale Order</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => navigateTo(() => openInvoiceScreen('DELIVERY_CHALLAN'))}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <FileText size={16} className="text-teal-600" />
                <span>Delivery Challan</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => navigateTo(() => openInvoiceScreen('SALE_RETURN'))}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <FileText size={16} className="text-amber-600" />
                <span>Sale Return (Credit Note)</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
          </div>

          {/* Section 3: Purchases & Expenses */}
          <div className="py-2">
            <div className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Purchases & Outflow
            </div>
            <button
              onClick={() => navigateTo(() => openInvoiceScreen('PURCHASE'))}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <ShoppingCart size={16} className="text-rose-600" />
                <span>+ Purchase Bill</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => navigateTo(() => openPaymentOut())}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <DollarSign size={16} className="text-rose-600" />
                <span>+ Payment Out (Pay)</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => navigateTo(() => openExpenseModal())}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <CreditCard size={16} className="text-rose-600" />
                <span>+ Business Expense</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => navigateTo(() => openInvoiceScreen('PURCHASE_ORDER'))}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <ShoppingCart size={16} className="text-orange-600" />
                <span>Purchase Order (PO)</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
          </div>

          {/* Section 4: GST & Accounting Reports */}
          <div className="py-2">
            <div className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              GST & Business Reports
            </div>
            <button
              onClick={() => navigateTo(openGstrReportModal)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <Percent size={16} className="text-teal-600" />
                <span>GSTR-1 & GSTR-3B Returns</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => navigateTo(openDayBook)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <BookOpen size={16} className="text-blue-600" />
                <span>Daily Day Book</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => navigateTo(openBalanceSheet)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <Scale size={16} className="text-indigo-600" />
                <span>Balance Sheet</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => navigateTo(openBillWisePnl)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <TrendingUp size={16} className="text-emerald-600" />
                <span>Bill-wise Profit & Loss</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => navigateTo(openAgeingReportModal)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <Clock size={16} className="text-amber-600" />
                <span>Party Ageing (Reminders)</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => navigateTo(openCashFlowModal)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <TrendingUp size={16} className="text-teal-600" />
                <span>Cash Flow Statement</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => navigateTo(openChequesModal)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <CreditCard size={16} className="text-cyan-600" />
                <span>Cheque Register</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => navigateTo(openLoanAccountsModal)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <Building2 size={16} className="text-orange-600" />
                <span>Loan & EMI Accounts</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
          </div>

          {/* Section 5: Utilities & Settings */}
          <div className="py-2">
            <div className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Settings & Tools
            </div>
            <button
              onClick={() => navigateTo(openPrintSettings)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <Printer size={16} className="text-gray-600" />
                <span>Print & Invoice Settings</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => navigateTo(openBackupModal)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <Database size={16} className="text-gray-600" />
                <span>Backup & Restore (Offline)</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => navigateTo(openFinancialYearModal)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <ShieldCheck size={16} className="text-gray-600" />
                <span>Financial Year Rollover</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => navigateTo(openSettings)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-gray-700 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 font-semibold">
                <Building2 size={16} className="text-gray-600" />
                <span>Business Profile Settings</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 text-center text-[11px] text-gray-500">
          <span className="font-bold text-gray-700">Vyapar Pro Edition</span> • 100% Offline & GST Ready
        </div>
      </div>
    </div>
  );
};
