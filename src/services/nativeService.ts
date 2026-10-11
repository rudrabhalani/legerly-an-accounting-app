import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Network } from '@capacitor/network';
import { useLedgerlyStore } from '../store/useLedgerlyStore';

export const isNativeMobile = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Initializes native mobile listeners, status bar, and back button handling
 */
export function initializeNativeApp(): () => void {
  if (!Capacitor.isNativePlatform()) {
    return () => {};
  }

  // 1. Configure Android Status Bar
  try {
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#1E1B4B' }).catch(() => {});
  } catch (e) {
    console.warn('StatusBar initialization skipped:', e);
  }

  // 2. Hide Splash Screen smoothly once UI is mounted
  try {
    SplashScreen.hide().catch(() => {});
  } catch (e) {
    console.warn('SplashScreen hide skipped:', e);
  }

  // 3. Android Hardware Back Button Handling
  const backButtonSub = CapApp.addListener('backButton', ({ canGoBack }) => {
    const store = useLedgerlyStore.getState();

    // Priority 1: Check and close any active modal
    if (store.isInvoiceScreenOpen) {
      store.closeInvoiceScreen();
      return;
    }
    if (store.isInvoiceModalOpen) {
      store.closeInvoiceModal();
      return;
    }
    if (store.isPaymentInOpen) {
      store.closePaymentIn();
      return;
    }
    if (store.isPaymentOutOpen) {
      store.closePaymentOut();
      return;
    }
    if (store.isMoneyInOpen) {
      store.closeMoneyIn();
      return;
    }
    if (store.isMoneyOutOpen) {
      store.closeMoneyOut();
      return;
    }
    if (store.isExpenseModalOpen) {
      store.closeExpenseModal();
      return;
    }
    if (store.isPartyModalOpen) {
      store.closePartyModal();
      return;
    }
    if (store.isItemModalOpen) {
      store.closeItemModal();
      return;
    }
    if (store.isTransactionDetailOpen) {
      store.closeTransactionDetail();
      return;
    }
    if (store.isShareInvoiceModalOpen) {
      store.closeShareInvoiceModal();
      return;
    }
    if (store.isPrintSettingsOpen) {
      store.closePrintSettings();
      return;
    }
    if (store.isDayBookOpen) {
      store.closeDayBook();
      return;
    }
    if (store.isBalanceSheetOpen) {
      store.closeBalanceSheet();
      return;
    }
    if (store.isBillWisePnlOpen) {
      store.closeBillWisePnl();
      return;
    }
    if (store.isBackupModalOpen) {
      store.closeBackupModal();
      return;
    }
    if (store.isSettingsOpen) {
      store.closeSettings();
      return;
    }

    // Priority 2: If on a sub-screen, return to home
    if (store.activeTab !== 'home') {
      store.setActiveTab('home');
      return;
    }

    // Priority 3: On Home screen with no modals, exit app
    if (!canGoBack) {
      CapApp.exitApp();
    } else {
      window.history.back();
    }
  });

  // 4. Network Status Monitoring
  const networkSub = Network.addListener('networkStatusChange', (status) => {
    if (!status.connected) {
      console.warn('Network offline: operating in offline-first mode with IndexedDB/LocalStorage');
    }
  });

  return () => {
    backButtonSub.then((handle) => handle.remove()).catch(() => {});
    networkSub.then((handle) => handle.remove()).catch(() => {});
  };
}

/**
 * Native file sharing helper for Android
 */
export async function shareFileNative(
  fileName: string,
  base64Data: string,
  mimeType: string,
  title: string,
  text: string
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    const saved = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache,
    });

    await Share.share({
      title,
      text,
      url: saved.uri,
      dialogTitle: title,
    });

    return true;
  } catch (err) {
    console.warn('Native share failed, falling back:', err);
    return false;
  }
}
