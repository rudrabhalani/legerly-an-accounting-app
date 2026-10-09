import React, { useState } from 'react';
import { useLedgerlyStore } from './store/useLedgerlyStore';
import { TopAppBar } from './components/layout/TopAppBar';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { HomeStickyBottomBar } from './components/layout/HomeStickyBottomBar';
import { QuickAddSheet } from './components/layout/QuickAddSheet';
import { SplashScreen } from './components/brand/SplashScreen';
import { PinLockScreen } from './components/modals/PinLockScreen';

// Screens
import { HomeScreen } from './screens/HomeScreen';
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
import { ReconcileModal } from './components/modals/ReconcileModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { OnboardingModal } from './components/modals/OnboardingModal';
import { ToastSnackbar } from './components/common/ToastSnackbar';

export function App() {
  const [showSplash, setShowSplash] = useState(true);
  const activeTab = useLedgerlyStore((state) => state.activeTab);

  return (
    <div className="min-h-screen bg-surface-muted text-slate-primary flex flex-col font-sans selection:bg-primary-light selection:text-primary">
      {/* 1. Startup Splash Screen (<1.5s) */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* 2. Security PIN Lock */}
      <PinLockScreen />

      {/* 3. Onboarding Setup Wizard (if first time) */}
      <OnboardingModal />

      {/* 4. Top App Bar */}
      <TopAppBar />

      {/* 5. Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4">
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'parties' && <PartiesScreen />}
        {activeTab === 'stock' && <StockScreen />}
        {activeTab === 'reports' && <ReportsScreen />}
      </main>

      {/* 6. Home Screen Sticky Quick Buttons (+ Money In / − Money Out) */}
      {activeTab === 'home' && <HomeStickyBottomBar />}

      {/* 7. Bottom Navigation (5 tabs) */}
      <BottomNavigation />

      {/* 8. Global Modals & Detail Overlays */}
      <QuickAddSheet />
      <MoneyInModal />
      <MoneyOutModal />
      <TransferModal />
      <PartyModal />
      <ItemModal />
      <InvoiceModal />
      <ReconcileModal />
      <SettingsModal />
      <PartyLedgerScreen />
      <AccountLedgerScreen />

      {/* 9. Undo Toast Snackbar */}
      <ToastSnackbar />
    </div>
  );
}

export default App;
