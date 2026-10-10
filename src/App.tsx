import React, { useState } from 'react';
import { useLedgerlyStore } from './store/useLedgerlyStore';
import { TopAppBar } from './components/layout/TopAppBar';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { HomeStickyBottomBar } from './components/layout/HomeStickyBottomBar';
import { QuickAddSheet } from './components/layout/QuickAddSheet';
import { SplashScreen } from './components/brand/SplashScreen';
import { PinLockScreen } from './components/modals/PinLockScreen';

// Screens
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { BankLedgerScreen } from './screens/BankLedgerScreen';
import { PartiesScreen } from './screens/PartiesScreen';
import { StockScreen } from './screens/StockScreen';
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
import { TransactionDetailModal } from './components/modals/TransactionDetailModal';
import { DayBookModal } from './components/modals/DayBookModal';
import { BalanceSheetModal } from './components/modals/BalanceSheetModal';
import { BillWisePnlModal } from './components/modals/BillWisePnlModal';
import { PrintSettingsModal } from './components/modals/PrintSettingsModal';
import { BackupRestoreModal } from './components/modals/BackupRestoreModal';
import { ShareInvoiceModal } from './components/modals/ShareInvoiceModal';
import { PeriodCashflowModal } from './components/modals/PeriodCashflowModal';
import { ToastSnackbar } from './components/common/ToastSnackbar';

export function App() {
  const [showSplash, setShowSplash] = useState(true);
  const business = useLedgerlyStore((state) => state.business);
  const activeTab = useLedgerlyStore((state) => state.activeTab);

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
    <div className="min-h-screen bg-surface-muted text-slate-primary flex flex-col font-sans selection:bg-primary-light selection:text-primary">
      {/* Security PIN Lock (if enabled) */}
      <PinLockScreen />

      {/* Top App Bar with Business Name & Team Access */}
      <TopAppBar />

      {/* Main Content View based on activeTab */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'bankLedger' && <BankLedgerScreen />}
        {activeTab === 'parties' && <PartiesScreen />}
        {activeTab === 'stock' && <StockScreen />}
        {activeTab === 'reports' && <ReportsScreen />}
      </main>

      {/* Home Screen Sticky Quick Action Buttons */}
      {activeTab === 'home' && <HomeStickyBottomBar />}

      {/* Bottom Navigation with 5 Tabs (Home, Bank Ledger, [+], Parties, Reports) */}
      <BottomNavigation />

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
      <TransactionDetailModal />
      <DayBookModal />
      <BalanceSheetModal />
      <BillWisePnlModal />
      <PrintSettingsModal />
      <BackupRestoreModal />
      <ShareInvoiceModal />
      <PartyLedgerScreen />
      <AccountLedgerScreen />

      {/* Undo Toast Snackbar */}
      <ToastSnackbar />
    </div>
  );
}

export default App;
