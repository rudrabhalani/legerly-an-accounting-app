/**
 * Ledgerly Zustand Store
 * Offline-first state management with persistent storage, full audit trail,
 * and undo capabilities.
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
} from '../types';
import {
  SEED_BUSINESS,
  SEED_ACCOUNTS,
  SEED_PARTIES,
  SEED_ITEMS,
  SEED_TRANSACTIONS,
  SEED_INVOICES,
  SEED_STOCK_MOVEMENTS,
} from '../data/seedData';

interface LedgerlyState {
  business: Business;
  accounts: Account[];
  parties: Party[];
  items: Item[];
  transactions: Transaction[];
  invoices: Invoice[];
  stockMovements: StockMovement[];
  auditLogs: AuditLog[];

  // App UI State
  period: DateFilterPeriod;
  customDateRange: { start: string; end: string };
  lastDeletedTransaction: Transaction | null;
  activeTab: 'home' | 'parties' | 'stock' | 'reports';
  
  // Modals & Sheets
  isMoneyInOpen: boolean;
  isMoneyOutOpen: boolean;
  isAddSheetOpen: boolean;
  isInvoiceModalOpen: boolean;
  isPartyModalOpen: boolean;
  isItemModalOpen: boolean;
  isTransferModalOpen: boolean;
  isReconcileModalOpen: boolean;
  isOnboardingOpen: boolean;
  isSettingsOpen: boolean;
  selectedPartyIdForLedger: string | null;
  selectedAccountIdForLedger: string | null;
  prefilledPartyIdForTxn: string | null;
  
  // PIN Security
  isLocked: boolean;

  // Actions
  setPeriod: (period: DateFilterPeriod) => void;
  setCustomDateRange: (range: { start: string; end: string }) => void;
  setActiveTab: (tab: 'home' | 'parties' | 'stock' | 'reports') => void;
  setLanguage: (lang: LanguageCode) => void;
  updateBusiness: (updates: Partial<Business>) => void;
  unlockApp: () => void;
  lockApp: () => void;

  // Modal controls
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

  // Domain Actions
  addTransaction: (txn: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  undoDeleteTransaction: () => void;
  clearLastDeletedTransaction: () => void;

  addParty: (party: Omit<Party, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => Party;
  updateParty: (id: string, updates: Partial<Party>) => void;
  deleteParty: (id: string) => void;

  addAccount: (account: Omit<Account, 'id' | 'currentBalance'>) => Account;
  updateAccount: (id: string, updates: Partial<Account>) => void;

  addItem: (item: Omit<Item, 'id' | 'currentStock' | 'isDeleted'>) => Item;
  updateItem: (id: string, updates: Partial<Item>) => void;
  adjustStock: (itemId: string, qty: number, direction: 'IN' | 'OUT', reason: string) => void;

  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => Invoice;

  // Backup & Reset
  resetToDemoData: () => void;
  exportBackupJson: () => string;
  importBackupJson: (jsonData: string) => boolean;
}

export const useLedgerlyStore = create<LedgerlyState>()(
  persist(
    (set, get) => ({
      business: SEED_BUSINESS,
      accounts: SEED_ACCOUNTS,
      parties: SEED_PARTIES,
      items: SEED_ITEMS,
      transactions: SEED_TRANSACTIONS,
      invoices: SEED_INVOICES,
      stockMovements: SEED_STOCK_MOVEMENTS,
      auditLogs: [],

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
      isOnboardingOpen: false,
      isSettingsOpen: false,
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

          const audit: AuditLog = {
            id: `audit-${Date.now()}`,
            entity: 'TRANSACTION',
            entityId: id,
            action: 'UPDATE',
            before: oldTxn,
            after: updatedTxn,
            at: now,
          };

          return {
            transactions: state.transactions.map((t) => (t.id === id ? updatedTxn : t)),
            auditLogs: [audit, ...state.auditLogs],
          };
        });
      },

      deleteTransaction: (id) => {
        const now = new Date().toISOString();
        const txn = get().transactions.find((t) => t.id === id);
        if (!txn) return;

        const audit: AuditLog = {
          id: `audit-${Date.now()}`,
          entity: 'TRANSACTION',
          entityId: id,
          action: 'DELETE',
          before: txn,
          at: now,
        };

        set((state) => ({
          lastDeletedTransaction: txn,
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, isDeleted: true, updatedAt: now } : t
          ),
          auditLogs: [audit, ...state.auditLogs],
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
          auditLogs: [
            {
              id: `audit-${Date.now()}`,
              entity: 'TRANSACTION',
              entityId: last.id,
              action: 'RESTORE',
              after: last,
              at: now,
            },
            ...state.auditLogs,
          ],
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
          auditLogs: [
            {
              id: `audit-${Date.now()}`,
              entity: 'PARTY',
              entityId: id,
              action: 'CREATE',
              after: newParty,
              at: now,
            },
            ...state.auditLogs,
          ],
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

      addAccount: (accountData) => {
        const id = `acc-${Date.now()}`;
        const newAcc: Account = {
          ...accountData,
          id,
          currentBalance: accountData.openingBalance,
        };

        set((state) => ({
          accounts: [...state.accounts, newAcc],
        }));

        return newAcc;
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

        // If invoice is a sale or purchase, automatically create stock movements for line items
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

        // If paidAmount > 0 and accountId is selected, record payment transaction
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

      resetToDemoData: () => {
        set({
          business: SEED_BUSINESS,
          accounts: SEED_ACCOUNTS,
          parties: SEED_PARTIES,
          items: SEED_ITEMS,
          transactions: SEED_TRANSACTIONS,
          invoices: SEED_INVOICES,
          stockMovements: SEED_STOCK_MOVEMENTS,
          auditLogs: [],
          lastDeletedTransaction: null,
        });
      },

      exportBackupJson: () => {
        const state = get();
        const backup = {
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          business: state.business,
          accounts: state.accounts,
          parties: state.parties,
          items: state.items,
          transactions: state.transactions,
          invoices: state.invoices,
          stockMovements: state.stockMovements,
          auditLogs: state.auditLogs,
        };
        return JSON.stringify(backup, null, 2);
      },

      importBackupJson: (jsonData: string) => {
        try {
          const parsed = JSON.parse(jsonData);
          if (!parsed.business || !Array.isArray(parsed.transactions)) {
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
            auditLogs: parsed.auditLogs || [],
          });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'ledgerly-storage-v1',
      partialize: (state) => ({
        business: state.business,
        accounts: state.accounts,
        parties: state.parties,
        items: state.items,
        transactions: state.transactions,
        invoices: state.invoices,
        stockMovements: state.stockMovements,
        auditLogs: state.auditLogs,
      }),
    }
  )
);
