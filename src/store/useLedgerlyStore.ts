/**
 * Ledgerly Zustand Store
 * Production accounting store with offline persistence, Bank Ledger,
 * Multi-user access control with Owner OTP verification, and first-time onboarding.
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
} from '../types';
import {
  INITIAL_BUSINESS,
  INITIAL_ACCOUNTS,
  INITIAL_PARTIES,
  INITIAL_ITEMS,
  INITIAL_TRANSACTIONS,
  INITIAL_INVOICES,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_USERS,
} from '../data/seedData';

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
  stockMovements: StockMovement[];
  auditLogs: AuditLog[];
  users: AppUser[];
  currentUserId: string | null;
  pendingInvite: PendingUserInvite | null;

  // Navigation & UI State
  period: DateFilterPeriod;
  customDateRange: { start: string; end: string };
  lastDeletedTransaction: Transaction | null;
  activeTab: 'home' | 'bankLedger' | 'parties' | 'stock' | 'reports';
  
  // Modals
  isMoneyInOpen: boolean;
  isMoneyOutOpen: boolean;
  isAddSheetOpen: boolean;
  isInvoiceModalOpen: boolean;
  isPartyModalOpen: boolean;
  isItemModalOpen: boolean;
  isTransferModalOpen: boolean;
  isReconcileModalOpen: boolean;
  isSettingsOpen: boolean;
  isMultiUserModalOpen: boolean;
  isBankPickerModalOpen: boolean;
  selectedPartyIdForLedger: string | null;
  selectedAccountIdForLedger: string | null;
  prefilledPartyIdForTxn: string | null;
  
  // Security
  isLocked: boolean;

  // Base Actions
  setPeriod: (period: DateFilterPeriod) => void;
  setCustomDateRange: (range: { start: string; end: string }) => void;
  setActiveTab: (tab: 'home' | 'bankLedger' | 'parties' | 'stock' | 'reports') => void;
  setLanguage: (lang: LanguageCode) => void;
  updateBusiness: (updates: Partial<Business>) => void;
  unlockApp: () => void;
  lockApp: () => void;

  // Modal Actions
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

  // Multi-User Actions (Shared Account with Owner OTP Verification)
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

  addParty: (party: Omit<Party, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => Party;
  updateParty: (id: string, updates: Partial<Party>) => void;
  deleteParty: (id: string) => void;

  updateAccount: (id: string, updates: Partial<Account>) => void;

  addItem: (item: Omit<Item, 'id' | 'currentStock' | 'isDeleted'>) => Item;
  updateItem: (id: string, updates: Partial<Item>) => void;
  adjustStock: (itemId: string, qty: number, direction: 'IN' | 'OUT', reason: string) => void;

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
      stockMovements: INITIAL_STOCK_MOVEMENTS,
      auditLogs: [],
      users: INITIAL_USERS,
      currentUserId: null,
      pendingInvite: null,

      period: 'THIS_MONTH',
      customDateRange: { start: '', end: '' },
      lastDeletedTransaction: null,
      activeTab: 'home',

      isMoneyInOpen: false,
      isMoneyOutOpen: false,
      isAddSheetOpen: false,
      isInvoiceModalOpen: false,
      isPartyModalOpen: false,
      isItemModalOpen: false,
      isTransferModalOpen: false,
      isReconcileModalOpen: false,
      isSettingsOpen: false,
      isMultiUserModalOpen: false,
      isBankPickerModalOpen: false,
      selectedPartyIdForLedger: null,
      selectedAccountIdForLedger: null,
      prefilledPartyIdForTxn: null,
      isLocked: false,

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

      // 1. First-Time Onboarding Implementation
      completeOnboarding: ({
        businessName,
        ownerName,
        ownerPhone,
        cashBalancePaise,
        bankBalancePaise,
        bankName,
        bankCode,
        bankNickname,
        last4,
      }) => {
        const now = new Date().toISOString();
        const todayDate = now.split('T')[0];

        // Owner User
        const ownerUser: AppUser = {
          id: 'user-owner',
          name: ownerName.trim() || 'Owner',
          phone: ownerPhone.trim() || '9876543210',
          role: 'OWNER',
          isVerified: true,
          addedAt: now,
          isDeviceOwner: true,
        };

        // Cash Account
        const cashAccount: Account = {
          id: 'acc-cash',
          type: 'CASH',
          nickname: 'Cash in Hand',
          openingBalance: cashBalancePaise,
          currentBalance: cashBalancePaise,
          isDefault: true,
        };

        // Primary Bank Account
        const bankAccount: Account = {
          id: `acc-bank-${Date.now()}`,
          type: 'BANK',
          bankName: bankName || 'State Bank of India',
          bankCode: bankCode || 'SBI',
          nickname: bankNickname || `${bankCode || 'SBI'} Primary Account`,
          accountNumberMasked: last4 ? `•••• ${last4}` : '•••• 1234',
          openingBalance: bankBalancePaise,
          currentBalance: bankBalancePaise,
          isDefault: false,
        };

        // Update Business info & set onboarded
        const updatedBusiness: Business = {
          id: `biz-${Date.now()}`,
          name: businessName.trim() || 'My Business',
          ownerName: ownerName.trim() || 'Owner',
          ownerPhone: ownerPhone.trim() || '9876543210',
          phone: ownerPhone.trim() || '9876543210',
          currency: 'INR',
          gstEnabled: false,
          financialYearStart: '2026-04-01',
          language: get().business.language || 'en',
          pinEnabled: false,
          isOnboarded: true,
        };

        set({
          business: updatedBusiness,
          accounts: [cashAccount, bankAccount],
          users: [ownerUser],
          currentUserId: 'user-owner',
          parties: [],
          transactions: [],
          invoices: [],
          stockMovements: [],
          auditLogs: [
            {
              id: `audit-${Date.now()}`,
              entity: 'ACCOUNT',
              entityId: 'acc-cash',
              action: 'CREATE',
              at: now,
            },
          ],
        });
      },

      resetToFirstTimeSetup: () => {
        set({
          business: INITIAL_BUSINESS,
          accounts: INITIAL_ACCOUNTS,
          parties: INITIAL_PARTIES,
          items: INITIAL_ITEMS,
          transactions: INITIAL_TRANSACTIONS,
          invoices: INITIAL_INVOICES,
          stockMovements: INITIAL_STOCK_MOVEMENTS,
          auditLogs: [],
          users: INITIAL_USERS,
          currentUserId: null,
          pendingInvite: null,
          activeTab: 'home',
        });
      },

      // 2. Bank Ledger Functions
      addBankAccount: ({
        bankName,
        bankCode,
        nickname,
        last4,
        ifsc,
        openingBalancePaise,
      }) => {
        const id = `acc-bank-${Date.now()}`;
        const newAcc: Account = {
          id,
          type: 'BANK',
          bankName,
          bankCode,
          nickname: nickname.trim() || `${bankCode} Account`,
          accountNumberMasked: last4 ? `•••• ${last4}` : undefined,
          ifsc: ifsc?.trim().toUpperCase(),
          openingBalance: openingBalancePaise || 0,
          currentBalance: openingBalancePaise || 0,
        };

        set((state) => ({
          accounts: [...state.accounts, newAcc],
        }));

        return newAcc;
      },

      importBankStatement: (accountId, rows) => {
        const now = new Date().toISOString();
        const targetAcc = get().accounts.find((a) => a.id === accountId);
        if (!targetAcc) return;

        const newTransactions: Transaction[] = rows.map((r, idx) => {
          const isDeposit = (r.credit || 0) > 0;
          const amount = isDeposit ? r.credit : r.debit;
          return {
            id: `txn-import-${Date.now()}-${idx}`,
            type: isDeposit ? 'IN' : 'OUT',
            amount,
            accountId,
            mode: 'NEFT_RTGS',
            category: isDeposit ? 'Bank Statement Credit' : 'Bank Statement Debit',
            date: r.date,
            time: '12:00',
            note: r.description,
            createdAt: now,
            updatedAt: now,
            isDeleted: false,
          };
        });

        set((state) => ({
          transactions: [...newTransactions, ...state.transactions],
          auditLogs: [
            {
              id: `audit-${Date.now()}`,
              entity: 'ACCOUNT',
              entityId: accountId,
              action: 'UPDATE',
              after: { importedCount: rows.length },
              at: now,
            },
            ...state.auditLogs,
          ],
        }));
      },

      // 3. Multi-User Access (Shared Account with Owner OTP Verification)
      requestAddUser: (name, phone, role) => {
        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const now = new Date().toISOString();
        const pending: PendingUserInvite = {
          name: name.trim(),
          phone: phone.trim(),
          role,
          otp,
          createdAt: now,
        };

        set({ pendingInvite: pending });

        const ownerPhone = get().business.ownerPhone || get().business.phone || '9876543210';
        return { otp, ownerPhone };
      },

      verifyAddUserOtp: (enteredOtp) => {
        const pending = get().pendingInvite;
        if (!pending) return false;

        if (pending.otp === enteredOtp.trim()) {
          const newUser: AppUser = {
            id: `user-${Date.now()}`,
            name: pending.name,
            phone: pending.phone,
            role: pending.role,
            isVerified: true,
            addedAt: new Date().toISOString(),
          };

          set((state) => ({
            users: [...state.users, newUser],
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
              ...state.auditLogs,
            ],
          }));
          return true;
        }

        return false;
      },

      cancelPendingInvite: () => set({ pendingInvite: null }),

      switchActiveUser: (userId) => set({ currentUserId: userId }),

      removeUser: (userId) => {
        set((state) => ({
          users: state.users.filter((u) => u.id !== userId),
          currentUserId: state.currentUserId === userId ? (state.users[0]?.id || null) : state.currentUserId,
        }));
      },

      // Transaction operations
      addTransaction: (txnData) => {
        const id = `txn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const now = new Date().toISOString();
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

      addParty: (partyData) => {
        const id = `party-${Date.now()}`;
        const now = new Date().toISOString();
        const newParty: Party = {
          ...partyData,
          id,
          createdAt: now,
          updatedAt: now,
          isDeleted: false,
        };

        set((state) => ({
          parties: [...state.parties, newParty],
        }));

        return newParty;
      },

      updateParty: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          parties: state.parties.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: now } : p
          ),
        }));
      },

      deleteParty: (id) => {
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
        }));

        return newItem;
      },

      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        }));
      },

      adjustStock: (itemId, qty, direction, reason) => {
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
          stockMovements: [...state.stockMovements, movement],
        }));
      },

      addInvoice: (invData) => {
        const id = `inv-${Date.now()}`;
        const now = new Date().toISOString();
        const newInvoice: Invoice = {
          ...invData,
          id,
          createdAt: now,
          updatedAt: now,
          isDeleted: false,
        };

        const newMovements: StockMovement[] = invData.lines.map((line) => ({
          id: `sm-${Date.now()}-${line.itemId}`,
          itemId: line.itemId,
          qty: line.qty,
          direction: invData.type === 'SALE' ? 'OUT' : 'IN',
          refType: invData.type === 'SALE' ? 'SALE' : 'PURCHASE',
          refId: id,
          date: invData.date,
          createdAt: now,
        }));

        const newTransactions: Transaction[] = [];
        if (invData.paidAmount > 0 && invData.accountId) {
          newTransactions.push({
            id: `txn-${Date.now()}-inv`,
            type: invData.type === 'SALE' ? 'IN' : 'OUT',
            amount: invData.paidAmount,
            accountId: invData.accountId,
            partyId: invData.partyId,
            mode: invData.paymentMode || 'CASH',
            category: invData.type === 'SALE' ? 'Sales' : 'Purchase',
            date: invData.date,
            time: '12:00',
            note: `Payment for Invoice #${invData.number}`,
            invoiceId: id,
            createdAt: now,
            updatedAt: now,
            isDeleted: false,
          });
        }

        set((state) => ({
          invoices: [newInvoice, ...state.invoices],
          stockMovements: [...newMovements, ...state.stockMovements],
          transactions: [...newTransactions, ...state.transactions],
        }));

        return newInvoice;
      },

      exportBackupJson: () => {
        const state = get();
        const backup = {
          version: '2.0.0',
          exportedAt: new Date().toISOString(),
          business: state.business,
          accounts: state.accounts,
          parties: state.parties,
          items: state.items,
          transactions: state.transactions,
          invoices: state.invoices,
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
        stockMovements: state.stockMovements,
        users: state.users,
        currentUserId: state.currentUserId,
        auditLogs: state.auditLogs,
      }),
    }
  )
);
