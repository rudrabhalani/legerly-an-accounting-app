import React, { useState, useEffect } from 'react';
import { useLedgerlyStore } from './store/useLedgerlyStore';
import { TopAppBar } from './components/layout/TopAppBar';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { DesktopSidebar } from './components/layout/DesktopSidebar';
import { QuickAddSheet } from './components/layout/QuickAddSheet';
import { SplashScreen } from './components/brand/SplashScreen';
import { PinLockScreen } from './components/modals/PinLockScreen';

// Screens
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { StockScreen } from './screens/StockScreen';
import { MenuScreen } from './screens/MenuScreen';
import { GetDesktopScreen } from './screens/GetDesktopScreen';
import { BankLedgerScreen } from './screens/BankLedgerScreen';
import { PartiesScreen } from './screens/PartiesScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { PartyLedgerScreen } from './screens/PartyLedgerScreen';
import { AccountLedgerScreen } from './screens/AccountLedgerScreen';

// Modals
import { MoneyInModal } from './components/modals/MoneyInModal';
import { MoneyOutModal } from './components/modals/MoneyOutModal';
import { TransferModal } from './components/modals/TransferModal';
import { PartyModal } from './components/modals/PartyModal';
import { ItemModal } from './components/modals/ItemModal';
import { InvoiceModal } from './components/modals/InvoiceModal';
import { InvoiceScreen } from './components/modals/InvoiceScreen';
import { PaymentInOutModal } from './components/modals/PaymentInOutModal';
import { ExpenseModal } from './components/modals/ExpenseModal';
import { FinancialYearModal } from './components/modals/FinancialYearModal';
import { ReconcileModal } from './components/modals/ReconcileModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { MultiUserModal } from './components/modals/MultiUserModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { AuthModal } from './components/modals/AuthModal';
import { TransactionDetailModal } from './components/modals/TransactionDetailModal';
import { DayBookModal } from './components/modals/DayBookModal';
import { BalanceSheetModal } from './components/modals/BalanceSheetModal';
import { BillWisePnlModal } from './components/modals/BillWisePnlModal';
import { PrintSettingsModal } from './components/modals/PrintSettingsModal';
import { BackupRestoreModal } from './components/modals/BackupRestoreModal';
import { ShareInvoiceModal } from './components/modals/ShareInvoiceModal';
import { PeriodCashflowModal } from './components/modals/PeriodCashflowModal';
import { GstrReportModal } from './components/modals/GstrReportModal';
import { AgeingReportModal } from './components/modals/AgeingReportModal';
import { CashFlowModal } from './components/modals/CashFlowModal';
import { ChequesModal } from './components/modals/ChequesModal';
import { LoanAccountsModal } from './components/modals/LoanAccountsModal';
import { ToastSnackbar } from './components/common/ToastSnackbar';

export function App() {
  const [showSplash, setShowSplash] = useState(true);
  const business = useLedgerlyStore((state) => state.business);
  const activeTab = useLedgerlyStore((state) => state.activeTab);
  const setActiveTab = useLedgerlyStore((state) => state.setActiveTab);
  const openInvoiceScreen = useLedgerlyStore((state) => state.openInvoiceScreen);
  const openExpenseModal = useLedgerlyStore((state) => state.openExpenseModal);

  // Global Desktop Keyboard Shortcuts (Alt+S = Sale, Alt+P = Purchase, Alt+E = Expense)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        openInvoiceScreen('SALE');
      } else if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        openInvoiceScreen('PURCHASE');
      } else if (e.altKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        openExpenseModal();
      } else if (e.altKey && e.key === '1') {
        e.preventDefault();
        setActiveTab('home');
      } else if (e.altKey && e.key === '2') {
        e.preventDefault();
        setActiveTab('dashboard');
      } else if (e.altKey && e.key === '3') {
        e.preventDefault();
        setActiveTab('items');
      } else if (e.altKey && e.key === '4') {
        e.preventDefault();
        setActiveTab('menu');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openInvoiceScreen, openExpenseModal, setActiveTab]);

  // 1. Startup Splash Screen (<1.5s)
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // 2. First-Time Setup Screen (Blocks main dashboard until onboarding is complete)
  if (!business.isOnboarded) {
    return <OnboardingScreen />;
  }

  // 3. Main Dashboard for Returning / Onboarded Users
  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex font-sans selection:bg-red-100 selection:text-[#E31E38]">
      {/* Security PIN Lock (if enabled) */}
      <PinLockScreen />

      {/* Desktop Left Sidebar (Exact Vyapar Desktop #161F30 Navy) */}
      <DesktopSidebar />

      {/* Right / Main Pane */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top App Bar with Business Name & Settings */}
        <TopAppBar />

        {/* Main Content View based on activeTab */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-2">
          {activeTab === 'home' && <HomeScreen />}
          {activeTab === 'dashboard' && <DashboardScreen />}
          {(activeTab === 'items' || activeTab === 'stock') && <StockScreen />}
          {activeTab === 'menu' && <MenuScreen />}
          {activeTab === 'getDesktop' && <GetDesktopScreen />}
          {activeTab === 'parties' && <PartiesScreen />}
          {activeTab === 'bankLedger' && <BankLedgerScreen />}
          {activeTab === 'reports' && <ReportsScreen />}
        </main>

        {/* Bottom Navigation on Mobile (Hidden on Desktop lg:hidden) */}
        <div className="lg:hidden">
          <BottomNavigation />
        </div>
      </div>

      {/* Global Modals & Overlays */}
      <PeriodCashflowModal />
      <QuickAddSheet />
      <InvoiceScreen />
      <PaymentInOutModal />
      <ExpenseModal />
      <FinancialYearModal />
      <MoneyInModal />
      <MoneyOutModal />
      <TransferModal />
      <PartyModal />
      <ItemModal />
      <InvoiceModal />
      <ReconcileModal />
      <SettingsModal />
      <MultiUserModal />
      <ProfileModal />
      <AuthModal />
      <TransactionDetailModal />
      <DayBookModal />
      <BalanceSheetModal />
      <BillWisePnlModal />
      <PrintSettingsModal />
      <BackupRestoreModal />
      <ShareInvoiceModal />
      <GstrReportModal />
      <AgeingReportModal />
      <CashFlowModal />
      <ChequesModal />
      <LoanAccountsModal />
      <PartyLedgerScreen />
      <AccountLedgerScreen />

      {/* Undo Toast Snackbar */}
      <ToastSnackbar />
    </div>
  );
}

export default App;
