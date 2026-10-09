/**
 * Ledgerly Zustand Store
 * Production accounting store with offline persistence, Bank Ledger,
 * Multi-user access control with Owner OTP verification, first-time onboarding,
 * Vyapar-style Money In / Money Out module, paise-accurate atomic invoices,
 * party ledgers, expenses, and Indian Financial Year management.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Business,
  Account,
  Party,
  Item,
  Transaction,
  Invoice,
  StockMovement,
  AuditLog,
  DateFilterPeriod,
  LanguageCode,
  AppUser,
  UserRole,
  BankStatementRow,
  Expense,
  PaymentMode,
  InvoiceType,
} from '../types';
import {
  INITIAL_BUSINESS,
  INITIAL_ACCOUNTS,
  INITIAL_PARTIES,
  INITIAL_ITEMS,
  INITIAL_TRANSACTIONS,
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_USERS,
} from '../data/seedData';
import { getCurrentFinancialYear } from '../utils/financialYear';
import { calculateAccountBalance, calculatePartyNetBalance } from '../utils/accounting';

interface PendingUserInvite {
  name: string;
  phone: string;
  role: UserRole;
  otp: string;
  createdAt: string;
}

interface LedgerlyState {
  business: Business;
  accounts: Account[];
  parties: Party[];
  items: Item[];
  transactions: Transaction[];
  invoices: Invoice[];
  expenses: Expense[];
  stockMovements: StockMovement[];
  auditLogs: AuditLog[];
  users: AppUser[];
  currentUserId: string | null;
  pendingInvite: PendingUserInvite | null;

  // Financial Year
  financialYears: string[];
  activeFinancialYear: string;

  // Navigation & UI State
  period: DateFilterPeriod;
  customDateRange: { start: string; end: string };
  lastDeletedTransaction: Transaction | null;
  activeTab: 'home' | 'bankLedger' | 'parties' | 'stock' | 'reports';

  // Modals & Screens
  isMoneyInOpen: boolean;
  isMoneyOutOpen: boolean;
  isAddSheetOpen: boolean;
  isInvoiceModalOpen: boolean; // Legacy/Quick trigger
  isInvoiceScreenOpen: boolean; // Full Vyapar-style Sale/Purchase screen
  invoiceScreenMode: 'SALE' | 'PURCHASE' | 'SALE_RETURN' | 'PURCHASE_RETURN';
  activeInvoiceToEdit: Invoice | null;
  isPaymentInOpen: boolean;
  isPaymentOutOpen: boolean;
  isExpenseModalOpen: boolean;
  isPartyModalOpen: boolean;
  isItemModalOpen: boolean;
  isTransferModalOpen: boolean;
  isReconcileModalOpen: boolean;
  isSettingsOpen: boolean;
  isMultiUserModalOpen: boolean;
  isBankPickerModalOpen: boolean;
  isFinancialYearModalOpen: boolean;
  isDeleteYearModalOpen: boolean;
  isPeriodCashflowOpen: boolean;
  selectedPartyIdForLedger: string | null;
  selectedAccountIdForLedger: string | null;
  prefilledPartyIdForTxn: string | null;

  // Security
  isLocked: boolean;

  // Permissions helper
  canCurrentUserEditDelete: () => boolean;
  getCurrentUser: () => AppUser | undefined;

  // Base Actions
  setPeriod: (period: DateFilterPeriod) => void;
  setCustomDateRange: (range: { start: string; end: string }) => void;
  setActiveTab: (tab: 'home' | 'bankLedger' | 'parties' | 'stock' | 'reports') => void;
  setLanguage: (lang: LanguageCode) => void;
  updateBusiness: (updates: Partial<Business>) => void;
  unlockApp: () => void;
  lockApp: () => void;

  // Financial Year Actions
  setActiveFinancialYear: (fy: string) => void;
  startNewFinancialYear: (newFY: string) => { success: boolean; message: string };
  deleteFinancialYear: (fy: string, confirmBizName: string) => { success: boolean; error?: string };

  // Screen & Modal Actions
  openInvoiceScreen: (mode?: 'SALE' | 'PURCHASE' | 'SALE_RETURN' | 'PURCHASE_RETURN', invoiceToEdit?: Invoice) => void;
  closeInvoiceScreen: () => void;
  openPaymentIn: (partyId?: string) => void;
  closePaymentIn: () => void;
  openPaymentOut: (partyId?: string) => void;
  closePaymentOut: () => void;
  openExpenseModal: () => void;
  closeExpenseModal: () => void;
  openFinancialYearModal: () => void;
  closeFinancialYearModal: () => void;
  openDeleteYearModal: () => void;
  closeDeleteYearModal: () => void;
  openMoneyIn: (prefillPartyId?: string) => void;
  closeMoneyIn: () => void;
  openMoneyOut: (prefillPartyId?: string) => void;
  closeMoneyOut: () => void;
  openAddSheet: () => void;
  closeAddSheet: () => void;
  openPartyLedger: (partyId: string) => void;
  closePartyLedger: () => void;
  openAccountLedger: (accountId: string) => void;
  closeAccountLedger: () => void;
  openInvoiceModal: () => void;
  closeInvoiceModal: () => void;
  openPartyModal: () => void;
  closePartyModal: () => void;
  openItemModal: () => void;
  closeItemModal: () => void;
  openTransferModal: () => void;
  closeTransferModal: () => void;
  openReconcileModal: (accountId?: string) => void;
  closeReconcileModal: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openMultiUserModal: () => void;
  closeMultiUserModal: () => void;
  openBankPickerModal: () => void;
  closeBankPickerModal: () => void;
  openPeriodCashflow: () => void;
  closePeriodCashflow: () => void;

  // Onboarding
  completeOnboarding: (data: {
    businessName: string;
    ownerName: string;
    ownerPhone: string;
    cashBalancePaise: number;
    bankBalancePaise: number;
    bankName: string;
    bankCode: string;
    bankNickname?: string;
    last4?: string;
  }) => void;
  resetToFirstTimeSetup: () => void;

  // Bank Ledger Actions
  addBankAccount: (data: {
    bankName: string;
    bankCode: string;
    nickname: string;
    last4?: string;
    ifsc?: string;
    openingBalancePaise: number;
  }) => Account;
  importBankStatement: (accountId: string, rows: BankStatementRow[]) => void;

  // Multi-User Actions
  requestAddUser: (name: string, phone: string, role: UserRole) => { otp: string; ownerPhone: string };
  verifyAddUserOtp: (otp: string) => boolean;
  cancelPendingInvite: () => void;
  switchActiveUser: (userId: string) => void;
  removeUser: (userId: string) => void;

  // Core Transactions & Accounting
  addTransaction: (txn: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  undoDeleteTransaction: () => void;
  clearLastDeletedTransaction: () => void;

  // Payments & Expenses
  addPayment: (data: {
    direction: 'IN' | 'OUT';
    partyId: string;
    amountPaise: number;
    mode: PaymentMode;
    accountId: string;
    date: string;
    note?: string;
    invoiceId?: string;
  }) => Transaction;
  addExpense: (data: {
    category: string;
    amountPaise: number;
    accountId: string;
    mode: PaymentMode;
    date: string;
    note?: string;
  }) => Expense;
  deleteExpense: (id: string) => { success: boolean; error?: string };

  addParty: (party: Omit<Party, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => Party;
  addPartiesBatch: (parties: Omit<Party, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>[]) => Party[];
  updateParty: (id: string, updates: Partial<Party>) => void;
  deleteParty: (id: string) => void;

  updateAccount: (id: string, updates: Partial<Account>) => void;

  addItem: (item: Omit<Item, 'id' | 'currentStock' | 'isDeleted'>) => Item;
  updateItem: (id: string, updates: Partial<Item>) => void;
  adjustStock: (itemId: string, qty: number, direction: 'IN' | 'OUT', reason: string) => void;

  // Atomic Vyapar Invoice Save
  atomicSaveInvoice: (invData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => {
    invoice: Invoice;
    stockWarnings: string[];
  };
  deleteInvoice: (id: string) => { success: boolean; error?: string };
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => Invoice;

  // Backup & Restore
  exportBackupJson: () => string;
  importBackupJson: (jsonData: string) => boolean;
}

export const useLedgerlyStore = create<LedgerlyState>()(
  persist(
    (set, get) => ({
      business: INITIAL_BUSINESS,
      accounts: INITIAL_ACCOUNTS,
      parties: INITIAL_PARTIES,
      items: INITIAL_ITEMS,
      transactions: INITIAL_TRANSACTIONS,
      invoices: INITIAL_INVOICES,
      expenses: INITIAL_EXPENSES,
      stockMovements: INITIAL_STOCK_MOVEMENTS,
      auditLogs: [],
      users: INITIAL_USERS,
      currentUserId: null,
      pendingInvite: null,

      financialYears: [getCurrentFinancialYear()],
      activeFinancialYear: getCurrentFinancialYear(),

      period: 'THIS_MONTH',
      customDateRange: { start: '', end: '' },
      lastDeletedTransaction: null,
      activeTab: 'home',

      isMoneyInOpen: false,
      isMoneyOutOpen: false,
      isAddSheetOpen: false,
      isInvoiceModalOpen: false,
      isInvoiceScreenOpen: false,
      invoiceScreenMode: 'SALE',
      activeInvoiceToEdit: null,
      isPaymentInOpen: false,
      isPaymentOutOpen: false,
      isExpenseModalOpen: false,
      isPartyModalOpen: false,
      isItemModalOpen: false,
      isTransferModalOpen: false,
      isReconcileModalOpen: false,
      isSettingsOpen: false,
      isMultiUserModalOpen: false,
      isBankPickerModalOpen: false,
      isFinancialYearModalOpen: false,
      isDeleteYearModalOpen: false,
      isPeriodCashflowOpen: false,
      selectedPartyIdForLedger: null,
      selectedAccountIdForLedger: null,
      prefilledPartyIdForTxn: null,
      isLocked: false,

      getCurrentUser: () => {
        const { users, currentUserId } = get();
        if (!currentUserId) return users[0];
        return users.find((u) => u.id === currentUserId) || users[0];
      },

      canCurrentUserEditDelete: () => {
        const user = get().getCurrentUser();
        if (!user) return true; // Default fallback to allow action if no user system active
        return user.role !== 'VIEWER';
      },

      setPeriod: (period) => set({ period }),
      setCustomDateRange: (customDateRange) => set({ customDateRange }),
      setActiveTab: (activeTab) => set({ activeTab }),

      setLanguage: (lang) =>
        set((state) => ({
          business: { ...state.business, language: lang },
        })),

      updateBusiness: (updates) =>
        set((state) => ({
          business: { ...state.business, ...updates },
        })),

      unlockApp: () => set({ isLocked: false }),
      lockApp: () => set({ isLocked: true }),

      setActiveFinancialYear: (fy) => set({ activeFinancialYear: fy }),

      startNewFinancialYear: (newFY) => {
        const state = get();
        const user = state.getCurrentUser();
        if (user && user.role === 'VIEWER') {
          return { success: false, message: 'Viewers cannot start a new financial year' };
        }

        // Calculate carry-forward balances
        const updatedAccounts = state.accounts.map((acc) => {
          const currentBal = calculateAccountBalance(acc, state.transactions);
          return {
            ...acc,
            openingBalance: currentBal,
            currentBalance: currentBal,
          };
        });

        // Carry forward items stock
        const updatedItems = state.items.map((item) => ({
          ...item,
          openingStock: item.currentStock,
        }));

        // Carry forward party balances
        const updatedParties = state.parties.map((p) => {
          const net = calculatePartyNetBalance(p, state.transactions, state.invoices);
          return {
            ...p,
            openingBalance: Math.abs(net),
            openingType: (net >= 0 ? 'RECEIVABLE' : 'PAYABLE') as 'RECEIVABLE' | 'PAYABLE',
          };
        });

        const years = Array.from(new Set([...state.financialYears, newFY]));
        const now = new Date().toISOString();

        const audit: AuditLog = {
          id: `audit-${Date.now()}`,
          entity: 'FINANCIAL_YEAR',
          entityId: newFY,
          action: 'CREATE',
          userId: user?.id,
          userRole: user?.role,
          userName: user?.name,
          after: { newFY, carriedAccounts: updatedAccounts.length, carriedItems: updatedItems.length },
          at: now,
        };

        set({
          accounts: updatedAccounts,
          items: updatedItems,
          parties: updatedParties,
          financialYears: years,
          activeFinancialYear: newFY,
          auditLogs: [audit, ...state.auditLogs],
        });

        return {
          success: true,
          message: `Successfully rolled over to FY ${newFY}. Closing balances carried forward as new opening balances.`,
        };
      },

      deleteFinancialYear: (fy, confirmBizName) => {
        const state = get();
        const user = state.getCurrentUser();
        if (user && user.role !== 'OWNER') {
          return { success: false, error: 'Only the Owner can delete a financial year.' };
        }

        if (confirmBizName.trim().toLowerCase() !== state.business.name.trim().toLowerCase()) {
          return { success: false, error: 'Business name did not match. Deletion cancelled.' };
        }

        if (state.financialYears.length <= 1) {
          return { success: false, error: 'Cannot delete the only existing financial year.' };
        }

        const remainingYears = state.financialYears.filter((y) => y !== fy);
        const newActive = state.activeFinancialYear === fy ? remainingYears[0] : state.activeFinancialYear;

        // Remove invoices and transactions tied to this FY
        const remainingInvoices = state.invoices.filter((inv) => inv.financialYear !== fy);
        const remainingTransactions = state.transactions.filter((t) => {
          if (!t.invoiceId) return true;
          const inv = state.invoices.find((i) => i.id === t.invoiceId);
          return inv?.financialYear !== fy;
        });
        const remainingExpenses = state.expenses.filter((e) => e.financialYear !== fy);

        const now = new Date().toISOString();
        const audit: AuditLog = {
          id: `audit-${Date.now()}`,
          entity: 'FINANCIAL_YEAR',
          entityId: fy,
          action: 'DELETE',
          userId: user?.id,
          userRole: user?.role,
          userName: user?.name,
          at: now,
        };

        set({
          financialYears: remainingYears,
          activeFinancialYear: newActive,
          invoices: remainingInvoices,
          transactions: remainingTransactions,
          expenses: remainingExpenses,
          auditLogs: [audit, ...state.auditLogs],
          isDeleteYearModalOpen: false,
        });

        return { success: true };
      },

      openInvoiceScreen: (mode = 'SALE', invoiceToEdit) =>
        set({
          isInvoiceScreenOpen: true,
          invoiceScreenMode: mode,
          activeInvoiceToEdit: invoiceToEdit || null,
          isAddSheetOpen: false,
        }),
      closeInvoiceScreen: () =>
        set({
          isInvoiceScreenOpen: false,
          activeInvoiceToEdit: null,
        }),

      openPaymentIn: (partyId) =>
        set({
          isPaymentInOpen: true,
          prefilledPartyIdForTxn: partyId || null,
          isAddSheetOpen: false,
        }),
      closePaymentIn: () =>
        set({
          isPaymentInOpen: false,
          prefilledPartyIdForTxn: null,
        }),

      openPaymentOut: (partyId) =>
        set({
          isPaymentOutOpen: true,
          prefilledPartyIdForTxn: partyId || null,
          isAddSheetOpen: false,
        }),
      closePaymentOut: () =>
        set({
          isPaymentOutOpen: false,
          prefilledPartyIdForTxn: null,
        }),

      openExpenseModal: () => set({ isExpenseModalOpen: true, isAddSheetOpen: false }),
      closeExpenseModal: () => set({ isExpenseModalOpen: false }),

      openFinancialYearModal: () => set({ isFinancialYearModalOpen: true }),
      closeFinancialYearModal: () => set({ isFinancialYearModalOpen: false }),

      openDeleteYearModal: () => set({ isDeleteYearModalOpen: true }),
      closeDeleteYearModal: () => set({ isDeleteYearModalOpen: false }),

      openMoneyIn: (prefillPartyId) =>
        set({
          isMoneyInOpen: true,
          prefilledPartyIdForTxn: prefillPartyId || null,
          isAddSheetOpen: false,
        }),
      closeMoneyIn: () => set({ isMoneyInOpen: false, prefilledPartyIdForTxn: null }),

      openMoneyOut: (prefillPartyId) =>
        set({
          isMoneyOutOpen: true,
          prefilledPartyIdForTxn: prefillPartyId || null,
          isAddSheetOpen: false,
        }),
      closeMoneyOut: () => set({ isMoneyOutOpen: false, prefilledPartyIdForTxn: null }),

      openAddSheet: () => set({ isAddSheetOpen: true }),
      closeAddSheet: () => set({ isAddSheetOpen: false }),

      openPartyLedger: (partyId) => set({ selectedPartyIdForLedger: partyId }),
      closePartyLedger: () => set({ selectedPartyIdForLedger: null }),

      openAccountLedger: (accountId) => set({ selectedAccountIdForLedger: accountId }),
      closeAccountLedger: () => set({ selectedAccountIdForLedger: null }),

      openInvoiceModal: () => set({ isInvoiceModalOpen: true, isAddSheetOpen: false }),
      closeInvoiceModal: () => set({ isInvoiceModalOpen: false }),

      openPartyModal: () => set({ isPartyModalOpen: true }),
      closePartyModal: () => set({ isPartyModalOpen: false }),

      openItemModal: () => set({ isItemModalOpen: true }),
      closeItemModal: () => set({ isItemModalOpen: false }),

      openTransferModal: () => set({ isTransferModalOpen: true, isAddSheetOpen: false }),
      closeTransferModal: () => set({ isTransferModalOpen: false }),

      openReconcileModal: (accountId) =>
        set({
          isReconcileModalOpen: true,
          selectedAccountIdForLedger: accountId || null,
        }),
      closeReconcileModal: () => set({ isReconcileModalOpen: false }),

      openSettings: () => set({ isSettingsOpen: true }),
      closeSettings: () => set({ isSettingsOpen: false }),

      openMultiUserModal: () => set({ isMultiUserModalOpen: true }),
      closeMultiUserModal: () => set({ isMultiUserModalOpen: false }),

      openBankPickerModal: () => set({ isBankPickerModalOpen: true }),
      closeBankPickerModal: () => set({ isBankPickerModalOpen: false }),

      openPeriodCashflow: () => set({ isPeriodCashflowOpen: true }),
      closePeriodCashflow: () => set({ isPeriodCashflowOpen: false }),

      // Complete Onboarding
      completeOnboarding: (data) => {
        const ownerId = `user-owner-${Date.now()}`;
        const ownerUser: AppUser = {
          id: ownerId,
          name: data.ownerName.trim() || 'Owner',
          phone: data.ownerPhone.trim(),
          role: 'OWNER',
          isVerified: true,
          addedAt: new Date().toISOString(),
          isDeviceOwner: true,
        };

        const cashAcc: Account = {
          id: 'acc-cash',
          type: 'CASH',
          nickname: 'Cash in Hand',
          openingBalance: data.cashBalancePaise,
          currentBalance: data.cashBalancePaise,
          isDefault: true,
        };

        const bankAcc: Account = {
          id: `acc-bank-${Date.now()}`,
          type: 'BANK',
          bankName: data.bankName,
          bankCode: data.bankCode,
          nickname: data.bankNickname || `${data.bankCode} Primary`,
          accountNumberMasked: data.last4 ? `•••• ${data.last4}` : undefined,
          openingBalance: data.bankBalancePaise,
          currentBalance: data.bankBalancePaise,
          isDefault: false,
        };

        const initialTxns: Transaction[] = [];
        const now = new Date().toISOString();
        const today = now.split('T')[0];

        if (data.cashBalancePaise > 0) {
          initialTxns.push({
            id: `txn-open-cash-${Date.now()}`,
            type: 'IN',
            amount: data.cashBalancePaise,
            accountId: cashAcc.id,
            mode: 'CASH',
            category: 'Capital / Opening Balance',
            date: today,
            time: '09:00',
            note: 'Cash in hand opening balance',
            createdAt: now,
            updatedAt: now,
            isDeleted: false,
          });
        }

        if (data.bankBalancePaise > 0) {
          initialTxns.push({
            id: `txn-open-bank-${Date.now()}`,
            type: 'IN',
            amount: data.bankBalancePaise,
            accountId: bankAcc.id,
            mode: 'NEFT_RTGS',
            category: 'Capital / Opening Balance',
            date: today,
            time: '09:00',
            note: `${data.bankName} opening balance`,
            createdAt: now,
            updatedAt: now,
            isDeleted: false,
          });
        }

        set((state) => ({
          business: {
            ...state.business,
            name: data.businessName.trim() || 'My Business',
            ownerName: data.ownerName.trim() || 'Owner',
            ownerPhone: data.ownerPhone.trim(),
            phone: data.ownerPhone.trim(),
            isOnboarded: true,
          },
          users: [ownerUser],
          currentUserId: ownerId,
          accounts: [cashAcc, bankAcc],
          transactions: initialTxns,
        }));
      },

      resetToFirstTimeSetup: () => {
        set({
          business: { ...INITIAL_BUSINESS, isOnboarded: false },
          accounts: INITIAL_ACCOUNTS,
          parties: INITIAL_PARTIES,
          items: INITIAL_ITEMS,
          transactions: INITIAL_TRANSACTIONS,
          invoices: INITIAL_INVOICES,
          expenses: INITIAL_EXPENSES,
          stockMovements: INITIAL_STOCK_MOVEMENTS,
          users: INITIAL_USERS,
          currentUserId: null,
          pendingInvite: null,
          auditLogs: [],
        });
      },

      addBankAccount: (data) => {
        const id = `acc-bank-${Date.now()}`;
        const newAccount: Account = {
          id,
          type: 'BANK',
          bankName: data.bankName,
          bankCode: data.bankCode,
          nickname: data.nickname,
          accountNumberMasked: data.last4 ? `•••• ${data.last4}` : undefined,
          ifsc: data.ifsc?.trim().toUpperCase(),
          openingBalance: data.openingBalancePaise,
          currentBalance: data.openingBalancePaise,
        };

        const now = new Date().toISOString();
        const today = now.split('T')[0];
        const newTxns: Transaction[] = [];

        if (data.openingBalancePaise > 0) {
          newTxns.push({
            id: `txn-open-${id}`,
            type: 'IN',
            amount: data.openingBalancePaise,
            accountId: id,
            mode: 'NEFT_RTGS',
            category: 'Capital / Opening Balance',
            date: today,
            time: '09:00',
            note: `${data.bankName} opening balance`,
            createdAt: now,
            updatedAt: now,
            isDeleted: false,
          });
        }

        set((state) => ({
          accounts: [...state.accounts, newAccount],
          transactions: [...newTxns, ...state.transactions],
        }));

        return newAccount;
      },

      importBankStatement: (accountId, rows) => {
        const now = new Date().toISOString();
        const account = get().accounts.find((a) => a.id === accountId);
        const importedTxns: Transaction[] = [];

        for (const row of rows) {
          if (row.credit > 0) {
            importedTxns.push({
              id: `txn-import-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              type: 'IN',
              amount: row.credit,
              accountId,
              mode: 'NEFT_RTGS',
              category: 'Bank Statement Credit',
              date: row.date,
              time: '12:00',
              note: row.description,
              createdAt: now,
              updatedAt: now,
              isDeleted: false,
            });
          }
          if (row.debit > 0) {
            importedTxns.push({
              id: `txn-import-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              type: 'OUT',
              amount: row.debit,
              accountId,
              mode: 'NEFT_RTGS',
              category: 'Bank Statement Debit',
              date: row.date,
              time: '12:00',
              note: row.description,
              createdAt: now,
              updatedAt: now,
              isDeleted: false,
            });
          }
        }

        const audit: AuditLog = {
          id: `audit-${Date.now()}`,
          entity: 'ACCOUNT',
          entityId: accountId,
          action: 'UPDATE',
          after: { importedCount: importedTxns.length, bank: account?.nickname },
          at: now,
        };

        set((state) => ({
          transactions: [...importedTxns, ...state.transactions],
          auditLogs: [audit, ...state.auditLogs],
        }));
      },

      requestAddUser: (name, phone, role) => {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const ownerPhone = get().business.ownerPhone || 'Owner Device';

        set({
          pendingInvite: {
            name: name.trim(),
            phone: phone.trim(),
            role,
            otp,
            createdAt: new Date().toISOString(),
          },
        });

        return { otp, ownerPhone };
      },

      verifyAddUserOtp: (otp) => {
        const state = get();
        if (!state.pendingInvite) return false;

        if (state.pendingInvite.otp === otp.trim()) {
          const newUser: AppUser = {
            id: `user-${Date.now()}`,
            name: state.pendingInvite.name,
            phone: state.pendingInvite.phone,
            role: state.pendingInvite.role,
            isVerified: true,
            addedAt: new Date().toISOString(),
          };

          set((s) => ({
            users: [...s.users, newUser],
            pendingInvite: null,
            auditLogs: [
              {
                id: `audit-${Date.now()}`,
                entity: 'USER',
                entityId: newUser.id,
                action: 'CREATE',
                after: newUser,
                at: new Date().toISOString(),
              },
              ...s.auditLogs,
            ],
          }));

          return true;
        }

        return false;
      },

      cancelPendingInvite: () => set({ pendingInvite: null }),
      switchActiveUser: (userId) => set({ currentUserId: userId }),
      removeUser: (userId) => {
        const user = get().getCurrentUser();
        if (user && user.role !== 'OWNER') return;
        set((state) => ({
          users: state.users.filter((u) => u.id !== userId),
          currentUserId: state.currentUserId === userId ? (state.users[0]?.id || null) : state.currentUserId,
        }));
      },

      // Core Transaction operations
      addTransaction: (txnData) => {
        const id = `txn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const now = new Date().toISOString();
        const user = get().getCurrentUser();

        const newTxn: Transaction = {
          ...txnData,
          id,
          createdAt: now,
          updatedAt: now,
          isDeleted: false,
        };

        const audit: AuditLog = {
          id: `audit-${Date.now()}`,
          entity: 'TRANSACTION',
          entityId: id,
          action: 'CREATE',
          userId: user?.id,
          userRole: user?.role,
          userName: user?.name,
          after: newTxn,
          at: now,
        };

        set((state) => ({
          transactions: [newTxn, ...state.transactions],
          auditLogs: [audit, ...state.auditLogs],
        }));

        return newTxn;
      },

      updateTransaction: (id, updates) => {
        const user = get().getCurrentUser();
        if (user && user.role === 'VIEWER') return;

        const now = new Date().toISOString();
        set((state) => {
          const oldTxn = state.transactions.find((t) => t.id === id);
          if (!oldTxn) return state;

          const updatedTxn: Transaction = {
            ...oldTxn,
            ...updates,
            updatedAt: now,
          };

          return {
            transactions: state.transactions.map((t) => (t.id === id ? updatedTxn : t)),
            auditLogs: [
              {
                id: `audit-${Date.now()}`,
                entity: 'TRANSACTION',
                entityId: id,
                action: 'UPDATE',
                userId: user?.id,
                userRole: user?.role,
                userName: user?.name,
                before: oldTxn,
                after: updatedTxn,
                at: now,
              },
              ...state.auditLogs,
            ],
          };
        });
      },

      deleteTransaction: (id) => {
        const user = get().getCurrentUser();
        if (user && user.role === 'VIEWER') return;

        const now = new Date().toISOString();
        const txn = get().transactions.find((t) => t.id === id);
        if (!txn) return;

        set((state) => ({
          lastDeletedTransaction: txn,
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, isDeleted: true, updatedAt: now } : t
          ),
          auditLogs: [
            {
              id: `audit-${Date.now()}`,
              entity: 'TRANSACTION',
              entityId: id,
              action: 'DELETE',
              userId: user?.id,
              userRole: user?.role,
              userName: user?.name,
              before: txn,
              at: now,
            },
            ...state.auditLogs,
          ],
        }));
      },

      undoDeleteTransaction: () => {
        const last = get().lastDeletedTransaction;
        if (!last) return;

        const now = new Date().toISOString();
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === last.id ? { ...t, isDeleted: false, updatedAt: now } : t
          ),
          lastDeletedTransaction: null,
        }));
      },

      clearLastDeletedTransaction: () => set({ lastDeletedTransaction: null }),

      // Payment In & Out
      addPayment: (data) => {
        const user = get().getCurrentUser();
        const id = `txn-${Date.now()}-pay`;
        const now = new Date().toISOString();

        const party = get().parties.find((p) => p.id === data.partyId);
        const partyName = party?.name || 'Party';

        const newTxn: Transaction = {
          id,
          type: data.direction,
          amount: data.amountPaise,
          accountId: data.accountId,
          partyId: data.partyId,
          mode: data.mode,
          category: data.direction === 'IN' ? 'Payment Received' : 'Payment Given',
          date: data.date,
          time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          note: data.note || (data.direction === 'IN' ? `Payment from ${partyName}` : `Payment to ${partyName}`),
          invoiceId: data.invoiceId,
          createdAt: now,
          updatedAt: now,
          isDeleted: false,
        };

        const audit: AuditLog = {
          id: `audit-${Date.now()}`,
          entity: 'TRANSACTION',
          entityId: id,
          action: 'CREATE',
          userId: user?.id,
          userRole: user?.role,
          userName: user?.name,
          after: newTxn,
          at: now,
        };

        set((state) => ({
          transactions: [newTxn, ...state.transactions],
          auditLogs: [audit, ...state.auditLogs],
        }));

        return newTxn;
      },

      // Expense
      addExpense: (data) => {
        const user = get().getCurrentUser();
        const id = `exp-${Date.now()}`;
        const txnId = `txn-exp-${Date.now()}`;
        const now = new Date().toISOString();
        const activeFY = get().activeFinancialYear;

        const newExpense: Expense = {
          id,
          category: data.category,
          amount: data.amountPaise,
          accountId: data.accountId,
          mode: data.mode,
          date: data.date,
          note: data.note,
          financialYear: activeFY,
          createdAt: now,
          isDeleted: false,
        };

        const matchingTxn: Transaction = {
          id: txnId,
          type: 'OUT',
          amount: data.amountPaise,
          accountId: data.accountId,
          mode: data.mode,
          category: `Expense - ${data.category}`,
          date: data.date,
          time: '12:00',
          note: data.note || data.category,
          createdAt: now,
          updatedAt: now,
          isDeleted: false,
        };

        const audit: AuditLog = {
          id: `audit-${Date.now()}`,
          entity: 'EXPENSE',
          entityId: id,
          action: 'CREATE',
          userId: user?.id,
          userRole: user?.role,
          userName: user?.name,
          after: newExpense,
          at: now,
        };

        set((state) => ({
          expenses: [newExpense, ...state.expenses],
          transactions: [matchingTxn, ...state.transactions],
          auditLogs: [audit, ...state.auditLogs],
        }));

        return newExpense;
      },

      deleteExpense: (id) => {
        const user = get().getCurrentUser();
        if (user && user.role === 'VIEWER') {
          return { success: false, error: 'Viewers cannot delete expenses' };
        }

        const now = new Date().toISOString();
        const expense = get().expenses.find((e) => e.id === id);
        if (!expense) return { success: false, error: 'Expense not found' };

        set((state) => ({
          expenses: state.expenses.map((e) => (e.id === id ? { ...e, isDeleted: true } : e)),
          auditLogs: [
            {
              id: `audit-${Date.now()}`,
              entity: 'EXPENSE',
              entityId: id,
              action: 'DELETE',
              userId: user?.id,
              userRole: user?.role,
              userName: user?.name,
              before: expense,
              at: now,
            },
            ...state.auditLogs,
          ],
        }));

        return { success: true };
      },

      addParty: (partyData) => {
        const id = `party-${Date.now()}`;
        const now = new Date().toISOString();
        const user = get().getCurrentUser();

        const newParty: Party = {
          ...partyData,
          id,
          createdAt: now,
          updatedAt: now,
          isDeleted: false,
        };

        set((state) => ({
          parties: [...state.parties, newParty],
          auditLogs: [
            {
              id: `audit-${Date.now()}`,
              entity: 'PARTY',
              entityId: id,
              action: 'CREATE',
              userId: user?.id,
              userRole: user?.role,
              userName: user?.name,
              after: newParty,
              at: now,
            },
            ...state.auditLogs,
          ],
        }));

        return newParty;
      },

      addPartiesBatch: (batch) => {
        const now = new Date().toISOString();
        const user = get().getCurrentUser();
        const existingPhones = new Set(
          get().parties.filter((p) => !p.isDeleted && p.phone).map((p) => p.phone)
        );
        const existingNames = new Set(
          get().parties.filter((p) => !p.isDeleted).map((p) => p.name.trim().toLowerCase())
        );

        const created: Party[] = [];
        for (const data of batch) {
          if (!data.name || !data.name.trim()) continue;
          if (data.phone && existingPhones.has(data.phone.trim())) continue;
          if (!data.phone && existingNames.has(data.name.trim().toLowerCase())) continue;

          const p: Party = {
            ...data,
            id: `party-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            createdAt: now,
            updatedAt: now,
            isDeleted: false,
          };
          created.push(p);
          if (p.phone) existingPhones.add(p.phone);
          existingNames.add(p.name.trim().toLowerCase());
        }

        if (created.length > 0) {
          set((state) => ({
            parties: [...state.parties, ...created],
            auditLogs: [
              {
                id: `audit-${Date.now()}`,
                entity: 'PARTY',
                entityId: 'batch',
                action: 'CREATE',
                userId: user?.id,
                userRole: user?.role,
                userName: user?.name,
                after: { count: created.length },
                at: now,
              },
              ...state.auditLogs,
            ],
          }));
        }

        return created;
      },

      updateParty: (id, updates) => {
        const user = get().getCurrentUser();
        if (user && user.role === 'VIEWER') return;

        const now = new Date().toISOString();
        set((state) => ({
          parties: state.parties.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: now } : p
          ),
        }));
      },

      deleteParty: (id) => {
        const user = get().getCurrentUser();
        if (user && user.role === 'VIEWER') return;

        const now = new Date().toISOString();
        set((state) => ({
          parties: state.parties.map((p) =>
            p.id === id ? { ...p, isDeleted: true, updatedAt: now } : p
          ),
        }));
      },

      updateAccount: (id, updates) => {
        set((state) => ({
          accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        }));
      },

      addItem: (itemData) => {
        const id = `item-${Date.now()}`;
        const user = get().getCurrentUser();
        const newItem: Item = {
          ...itemData,
          id,
          currentStock: itemData.openingStock,
          isDeleted: false,
        };

        const movement: StockMovement = {
          id: `sm-${Date.now()}`,
          itemId: id,
          qty: itemData.openingStock,
          direction: 'IN',
          refType: 'PURCHASE',
          refId: 'opening',
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          items: [...state.items, newItem],
          stockMovements: [...state.stockMovements, movement],
          auditLogs: [
            {
              id: `audit-${Date.now()}`,
              entity: 'ITEM',
              entityId: id,
              action: 'CREATE',
              userId: user?.id,
              userRole: user?.role,
              userName: user?.name,
              after: newItem,
              at: new Date().toISOString(),
            },
            ...state.auditLogs,
          ],
        }));

        return newItem;
      },

      updateItem: (id, updates) => {
        const user = get().getCurrentUser();
        if (user && user.role === 'VIEWER') return;
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        }));
      },

      adjustStock: (itemId, qty, direction, reason) => {
        const user = get().getCurrentUser();
        if (user && user.role === 'VIEWER') return;

        const movement: StockMovement = {
          id: `sm-${Date.now()}`,
          itemId,
          qty,
          direction,
          refType: 'ADJUSTMENT',
          refId: 'manual',
          reason,
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          items: state.items.map((i) => {
            if (i.id !== itemId) return i;
            const updatedStock = direction === 'IN' ? i.currentStock + qty : i.currentStock - qty;
            return { ...i, currentStock: updatedStock };
          }),
          stockMovements: [...state.stockMovements, movement],
        }));
      },

      // Atomic Batched Save for Vyapar Invoice
      atomicSaveInvoice: (invData) => {
        const user = get().getCurrentUser();
        const id = `inv-${Date.now()}`;
        const now = new Date().toISOString();
        const activeFY = get().activeFinancialYear;

        const newInvoice: Invoice = {
          ...invData,
          id,
          financialYear: invData.financialYear || activeFY,
          createdAt: now,
          updatedAt: now,
          isDeleted: false,
        };

        // Determine stock movement direction
        // SALE: OUT
        // PURCHASE: IN
        // SALE_RETURN: IN
        // PURCHASE_RETURN: OUT
        const stockDirection =
          invData.type === 'SALE' || invData.type === 'PURCHASE_RETURN' ? 'OUT' : 'IN';
        const refType = invData.type as 'SALE' | 'PURCHASE' | 'SALE_RETURN' | 'PURCHASE_RETURN';

        const newMovements: StockMovement[] = invData.lines.map((line) => ({
          id: `sm-${Date.now()}-${line.itemId}`,
          itemId: line.itemId,
          qty: line.qty,
          direction: stockDirection,
          refType,
          refId: id,
          date: invData.date,
          createdAt: now,
        }));

        // Adjust item current stocks and check for negative stock warnings
        const stockWarnings: string[] = [];
        const itemStockDelta = new Map<string, number>();

        for (const line of invData.lines) {
          const currentDelta = itemStockDelta.get(line.itemId) || 0;
          const delta = stockDirection === 'IN' ? line.qty : -line.qty;
          itemStockDelta.set(line.itemId, currentDelta + delta);
        }

        const updatedItems = get().items.map((item) => {
          const delta = itemStockDelta.get(item.id);
          if (delta === undefined) return item;

          const nextStock = item.currentStock + delta;
          if (nextStock < 0) {
            stockWarnings.push(
              `Stock for "${item.name}" dropped below zero (${nextStock} ${item.unit}).`
            );
          } else if (item.minStock && nextStock <= item.minStock) {
            stockWarnings.push(
              `"${item.name}" is now at or below minimum alert stock (${nextStock} ${item.unit}).`
            );
          }
          return { ...item, currentStock: nextStock };
        });

        // Create transaction in Cash Book or Bank Ledger if paid amount > 0
        const newTransactions: Transaction[] = [];
        if (invData.paidAmount > 0 && invData.accountId) {
          const txnType =
            invData.type === 'SALE' || invData.type === 'PURCHASE_RETURN' ? 'IN' : 'OUT';
          const defaultCat =
            invData.type === 'SALE'
              ? 'Sales'
              : invData.type === 'PURCHASE'
              ? 'Purchase'
              : 'Return';

          newTransactions.push({
            id: `txn-${Date.now()}-inv`,
            type: txnType,
            amount: invData.paidAmount,
            accountId: invData.accountId,
            partyId: invData.partyId,
            mode: invData.paymentMode || 'CASH',
            category: defaultCat,
            date: invData.date,
            time: '12:00',
            note: `Payment for ${invData.type} #${invData.number}`,
            invoiceId: id,
            createdAt: now,
            updatedAt: now,
            isDeleted: false,
          });
        }

        const audit: AuditLog = {
          id: `audit-${Date.now()}`,
          entity: 'INVOICE',
          entityId: id,
          action: 'CREATE',
          userId: user?.id,
          userRole: user?.role,
          userName: user?.name,
          after: newInvoice,
          at: now,
        };

        set((state) => ({
          invoices: [newInvoice, ...state.invoices],
          items: updatedItems,
          stockMovements: [...newMovements, ...state.stockMovements],
          transactions: [...newTransactions, ...state.transactions],
          auditLogs: [audit, ...state.auditLogs],
        }));

        return { invoice: newInvoice, stockWarnings };
      },

      deleteInvoice: (id) => {
        const user = get().getCurrentUser();
        if (user && user.role === 'VIEWER') {
          return { success: false, error: 'Viewers cannot delete invoices' };
        }

        const now = new Date().toISOString();
        const invoice = get().invoices.find((i) => i.id === id);
        if (!invoice) return { success: false, error: 'Invoice not found' };

        // Reverse stock movements
        const reverseDelta = new Map<string, number>();
        const origDirection =
          invoice.type === 'SALE' || invoice.type === 'PURCHASE_RETURN' ? 'OUT' : 'IN';

        for (const line of invoice.lines) {
          const currentDelta = reverseDelta.get(line.itemId) || 0;
          // Reverse: if original was OUT, now IN (+), if original was IN, now OUT (-)
          const delta = origDirection === 'OUT' ? line.qty : -line.qty;
          reverseDelta.set(line.itemId, currentDelta + delta);
        }

        const updatedItems = get().items.map((item) => {
          const delta = reverseDelta.get(item.id);
          if (delta === undefined) return item;
          return { ...item, currentStock: item.currentStock + delta };
        });

        // Reverse/mark deleted any linked transactions
        const updatedTransactions = get().transactions.map((t) =>
          t.invoiceId === id ? { ...t, isDeleted: true, updatedAt: now } : t
        );

        const audit: AuditLog = {
          id: `audit-${Date.now()}`,
          entity: 'INVOICE',
          entityId: id,
          action: 'DELETE',
          userId: user?.id,
          userRole: user?.role,
          userName: user?.name,
          before: invoice,
          at: now,
        };

        set((state) => ({
          invoices: state.invoices.map((i) => (i.id === id ? { ...i, isDeleted: true, updatedAt: now } : i)),
          items: updatedItems,
          transactions: updatedTransactions,
          auditLogs: [audit, ...state.auditLogs],
        }));

        return { success: true };
      },

      addInvoice: (invData) => {
        const res = get().atomicSaveInvoice(invData);
        return res.invoice;
      },

      exportBackupJson: () => {
        const state = get();
        const backup = {
          version: '2.5.0',
          exportedAt: new Date().toISOString(),
          business: state.business,
          accounts: state.accounts,
          parties: state.parties,
          items: state.items,
          transactions: state.transactions,
          invoices: state.invoices,
          expenses: state.expenses,
          financialYears: state.financialYears,
          activeFinancialYear: state.activeFinancialYear,
          stockMovements: state.stockMovements,
          users: state.users,
          auditLogs: state.auditLogs,
        };
        return JSON.stringify(backup, null, 2);
      },

      importBackupJson: (jsonData: string) => {
        try {
          const parsed = JSON.parse(jsonData);
          if (!parsed.business || !Array.isArray(parsed.accounts)) {
            return false;
          }
          set({
            business: parsed.business,
            accounts: parsed.accounts || [],
            parties: parsed.parties || [],
            items: parsed.items || [],
            transactions: parsed.transactions || [],
            invoices: parsed.invoices || [],
            expenses: parsed.expenses || [],
            financialYears: parsed.financialYears || [getCurrentFinancialYear()],
            activeFinancialYear: parsed.activeFinancialYear || getCurrentFinancialYear(),
            stockMovements: parsed.stockMovements || [],
            users: parsed.users || [],
            auditLogs: parsed.auditLogs || [],
          });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'ledgerly-storage-v2',
      partialize: (state) => ({
        business: state.business,
        accounts: state.accounts,
        parties: state.parties,
        items: state.items,
        transactions: state.transactions,
        invoices: state.invoices,
        expenses: state.expenses,
        financialYears: state.financialYears,
        activeFinancialYear: state.activeFinancialYear,
        stockMovements: state.stockMovements,
        users: state.users,
        currentUserId: state.currentUserId,
        auditLogs: state.auditLogs,
      }),
    }
  )
);
