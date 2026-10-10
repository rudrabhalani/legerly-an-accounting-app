import React, { useState, useMemo } from 'react';
import { useLedgerlyStore } from '../store/useLedgerlyStore';
import { getTranslation } from '../i18n/translations';
import {
  calculateTotalBalance,
  calculateReceivablesAndPayables,
  calculateTotalStockValue,
} from '../utils/accounting';
import {
  formatINR,
  formatDate,
  formatTime,
  formatFullDate,
  getTodayDateString,
} from '../utils/formatters';
import { EmptyState } from '../components/common/EmptyState';
import {
  Wallet,
  Building2,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ArrowRight,
  History,
  Scale,
  Search,
  Calendar,
  Plus,
  CreditCard,
} from 'lucide-react';

export type HomeTimePeriod =
  | 'TODAY'
  | 'YESTERDAY'
  | 'THIS_WEEK'
  | 'THIS_MONTH'
  | 'CUSTOM';

export const HomeScreen: React.FC = () => {
  const accounts = useLedgerlyStore((state) => state.accounts);
  const transactions = useLedgerlyStore((state) => state.transactions);
  const parties = useLedgerlyStore((state) => state.parties);
  const items = useLedgerlyStore((state) => state.items);
  const stockMovements = useLedgerlyStore((state) => state.stockMovements);
  const invoices = useLedgerlyStore((state) => state.invoices);
  const business = useLedgerlyStore((state) => state.business);
  const openInvoiceScreen = useLedgerlyStore((state) => state.openInvoiceScreen);
  const openPaymentIn = useLedgerlyStore((state) => state.openPaymentIn);
  const openPaymentOut = useLedgerlyStore((state) => state.openPaymentOut);
  const openExpenseModal = useLedgerlyStore((state) => state.openExpenseModal);
  const openAccountLedger = useLedgerlyStore((state) => state.openAccountLedger);
  const openReconcileModal = useLedgerlyStore((state) => state.openReconcileModal);
  const openTransactionDetail = useLedgerlyStore((state) => state.openTransactionDetail);
  const setActiveTab = useLedgerlyStore((state) => state.setActiveTab);

  const t = getTranslation(business.language);

  // Date Filter State (default to Today)
  const [selectedPeriod, setSelectedPeriod] = useState<HomeTimePeriod>('TODAY');
  const [customStartDate, setCustomStartDate] = useState<string>(getTodayDateString());
  const [customEndDate, setCustomEndDate] = useState<string>(getTodayDateString());

  // Quick "+ Add" dropdown toggle
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Collapsible Bank & Cash details toggle
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [isBankListExpanded, setIsBankListExpanded] = useState(false);

  // Search & Filter state for transactions list
  const [searchQuery, setSearchQuery] = useState('');
  const [txnFilter, setTxnFilter] = useState<'ALL' | 'SALE' | 'PURCHASE' | 'IN' | 'OUT' | 'EXPENSE'>('ALL');

  // Overall account balances
  const { total, cashTotal, bankTotal, accountBalances } = calculateTotalBalance(accounts, transactions);
  const { toReceive, toPay } = calculateReceivablesAndPayables(parties, transactions, invoices);
  const { lowStockItems } = calculateTotalStockValue(items, stockMovements);

  // Active non-deleted transactions
  const activeTxns = transactions.filter((txn) => !txn.isDeleted);

  const partyMap = new Map(parties.map((p) => [p.id, p]));
  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const invoiceMap = new Map(invoices.map((i) => [i.id, i]));

  // Date boundaries for selected timeframe
  const { startDate, endDate, periodLabel, fullDisplayDate } = useMemo(() => {
    const today = new Date();
    const todayStr = getTodayDateString();
    const formatDateOnly = (d: Date) => d.toISOString().split('T')[0];

    switch (selectedPeriod) {
      case 'TODAY':
        return {
          startDate: todayStr,
          endDate: todayStr,
          periodLabel: 'Today',
          fullDisplayDate: formatFullDate(todayStr),
        };

      case 'YESTERDAY': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = formatDateOnly(yesterday);
        return {
          startDate: yStr,
          endDate: yStr,
          periodLabel: 'Yesterday',
          fullDisplayDate: formatFullDate(yStr),
        };
      }

      case 'THIS_WEEK': {
        const d = new Date(today);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
        const monday = new Date(d.setDate(diff));
        const mondayStr = formatDateOnly(monday);
        return {
          startDate: mondayStr,
          endDate: todayStr,
          periodLabel: 'This Week',
          fullDisplayDate: `${formatFullDate(mondayStr)} – ${formatFullDate(todayStr)}`,
        };
      }

      case 'THIS_MONTH': {
        const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstOfMonthStr = formatDateOnly(firstOfMonth);
        return {
          startDate: firstOfMonthStr,
          endDate: todayStr,
          periodLabel: 'This Month',
          fullDisplayDate: `${formatFullDate(firstOfMonthStr)} – ${formatFullDate(todayStr)}`,
        };
      }

      case 'CUSTOM':
      default: {
        const s = customStartDate || todayStr;
        const e = customEndDate || s;
        const start = s <= e ? s : e;
        const end = s <= e ? e : s;
        return {
          startDate: start,
          endDate: end,
          periodLabel: start === end ? 'Custom Date' : 'Custom Range',
          fullDisplayDate: start === end ? formatFullDate(start) : `${formatFullDate(start)} – ${formatFullDate(end)}`,
        };
      }
    }
  }, [selectedPeriod, customStartDate, customEndDate]);

  // Daily / Period Account Totals: Money In, Money Out, Net Balance
  const { periodCredit, periodDebit, periodNet, countInflow, countOutflow } = useMemo(() => {
    let credit = 0;
    let debit = 0;
    let inCount = 0;
    let outCount = 0;

    for (const t of activeTxns) {
      if (t.date < startDate || t.date > endDate) {
        continue;
      }
      if (t.type === 'IN') {
        credit += t.amount;
        inCount++;
      } else if (t.type === 'OUT') {
        debit += t.amount;
        outCount++;
      }
    }

    return {
      periodCredit: credit,
      periodDebit: debit,
      periodNet: credit - debit,
      countInflow: inCount,
      countOutflow: outCount,
    };
  }, [activeTxns, startDate, endDate]);

  // Sorted all transactions (newest first)
  const sortedTransactions = [...activeTxns].sort((a, b) => {
    const cmp = b.date.localeCompare(a.date);
    if (cmp !== 0) return cmp;
    return (b.time || '').localeCompare(a.time || '');
  });

  // Filtered transactions for the selected date & search
  const filteredTransactions = sortedTransactions.filter((txn) => {
    // 1. Date filter (strictly match selected date / date range)
    if (txn.date < startDate || txn.date > endDate) {
      return false;
    }

    const inv = txn.invoiceId ? invoiceMap.get(txn.invoiceId) : undefined;
    const party = txn.partyId ? partyMap.get(txn.partyId) : undefined;
    const partyName = party?.name || inv?.partyName || '';

    // 2. Type filter
    if (txnFilter === 'SALE') {
      if (inv?.type !== 'SALE') return false;
    } else if (txnFilter === 'PURCHASE') {
      if (inv?.type !== 'PURCHASE') return false;
    } else if (txnFilter === 'IN') {
      if (txn.type !== 'IN') return false;
    } else if (txnFilter === 'OUT') {
      if (txn.type !== 'OUT') return false;
    } else if (txnFilter === 'EXPENSE') {
      if (!(txn.type === 'OUT' && !txn.partyId)) return false;
    }

    // 3. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchParty = partyName.toLowerCase().includes(q);
      const matchCategory = txn.category.toLowerCase().includes(q);
      const matchNote = (txn.note || '').toLowerCase().includes(q);
      const matchInvNo = (inv?.number || '').toLowerCase().includes(q);
      const amountRupees = (txn.amount / 100).toString();
      const matchAmount = amountRupees.includes(q);
      if (!matchParty && !matchCategory && !matchNote && !matchInvNo && !matchAmount) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-3.5 pb-28 pt-2">
      {/* LOW STOCK ALERT (Amber Banner if any items below min) */}
      {lowStockItems.length > 0 && (
        <div
          onClick={() => setActiveTab('stock')}
          className="bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-2xl p-3 flex items-center justify-between cursor-pointer hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-all shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-amber-400 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block leading-tight">
                {lowStockItems.length} {t.itemsBelowMin}
              </span>
              <span className="text-xs text-amber-800 dark:text-amber-300">
                {lowStockItems.map((i) => i.name).slice(0, 2).join(', ')}
                {lowStockItems.length > 2 ? ` +${lowStockItems.length - 2} more` : ''}
              </span>
            </div>
          </div>
          <ArrowRight size={16} className="text-amber-800 dark:text-amber-300 flex-shrink-0" />
        </div>
      )}

      {/* 1. TOP HEADER: DATE FILTER & SMALL "+ ADD" BUTTON */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Date Filter Pills */}
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 bg-white dark:bg-slate-800">
              <Calendar size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                {fullDisplayDate}
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                Day Account for: <strong className="text-blue-600 dark:text-blue-400">{periodLabel}</strong>
              </span>
            </div>
          </div>

          {/* Timeframe Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { id: 'TODAY', label: 'Today' },
              { id: 'YESTERDAY', label: 'Yesterday' },
              { id: 'THIS_WEEK', label: 'This Week' },
              { id: 'THIS_MONTH', label: 'This Month' },
              { id: 'CUSTOM', label: 'Custom Date / Range 📅' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedPeriod(tab.id as HomeTimePeriod)}
                className={`px-3 py-1.5 rounded-xl transition-all active:scale-95 ${
                  selectedPeriod === tab.id
                    ? 'bg-white dark:bg-slate-800 border-2 border-blue-600 dark:border-blue-400 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 font-medium'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {selectedPeriod === 'CUSTOM' && (
            <div className="flex flex-wrap items-center gap-2 pt-1 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Small Simple "+ Add" Button with Quick Dropdown */}
        <div className="relative self-start sm:self-center flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            title="Record Money In / Out or Add Bill"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>+ Add</span>
            <ChevronDown size={14} />
          </button>

          {showAddMenu && (
            <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-slate-800 rounded-2xl shadow-elevated border border-slate-200 dark:border-slate-700 py-1.5 z-40 animate-in fade-in zoom-in-95">
              <button
                type="button"
                onClick={() => {
                  setShowAddMenu(false);
                  openInvoiceScreen('SALE');
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2"
              >
                <ArrowDownLeft size={14} strokeWidth={2.5} />
                <span>+ Add Sale (Bill)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddMenu(false);
                  openPaymentIn();
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2"
              >
                <Coins size={14} />
                <span>+ Payment In (Receive)</span>
              </button>
              <div className="my-1 border-t border-slate-100 dark:border-slate-700"></div>
              <button
                type="button"
                onClick={() => {
                  setShowAddMenu(false);
                  openInvoiceScreen('PURCHASE');
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
              >
                <ArrowUpRight size={14} strokeWidth={2.5} />
                <span>+ Add Purchase (Bill)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddMenu(false);
                  openPaymentOut();
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
              >
                <Coins size={14} />
                <span>+ Payment Out (Pay)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddMenu(false);
                  openExpenseModal();
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
              >
                <CreditCard size={14} />
                <span>+ Business Expense</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. SUMMARY BOXES: RED, BLUE, GREEN 2PX OUTLINE ONLY (NO COLORED FILL) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* GREEN OUTLINE: Money In */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-600 dark:border-emerald-500 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Money In</span>
            <div className="w-7 h-7 rounded-lg border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft size={16} strokeWidth={2.5} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
            +{formatINR(periodCredit)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block truncate">
            Sales & Collections ({countInflow} entries)
          </span>
        </div>

        {/* RED OUTLINE: Money Out */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-rose-600 dark:border-rose-500 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Money Out</span>
            <div className="w-7 h-7 rounded-lg border border-rose-300 dark:border-rose-700 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ArrowUpRight size={16} strokeWidth={2.5} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums text-rose-600 dark:text-rose-400">
            −{formatINR(periodDebit)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block truncate">
            Purchases & Expenses ({countOutflow} entries)
          </span>
        </div>

        {/* BLUE OUTLINE: Balance */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-500 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Net Balance</span>
            <div className="w-7 h-7 rounded-lg border border-blue-300 dark:border-blue-700 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Wallet size={16} />
            </div>
          </div>
          <div className={`text-xl sm:text-2xl font-bold tracking-tight tabular-nums ${
            periodNet >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatINR(periodNet)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block truncate">
            {periodLabel} Account (Money In − Out)
          </span>
        </div>
      </div>

      {/* COLLAPSIBLE PHYSICAL CASH & BANK ACCOUNTS STRIP */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 shadow-xs">
        <button
          type="button"
          onClick={() => setShowAccountDetails(!showAccountDetails)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 px-1 py-0.5"
        >
          <div className="flex items-center gap-2">
            <Building2 size={15} className="text-blue-600 dark:text-blue-400" />
            <span>Bank & Cash Ledgers (Total Balance: {formatINR(total)})</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span>{showAccountDetails ? 'Hide' : 'Show Accounts'}</span>
            {showAccountDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </button>

        {showAccountDetails && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs animate-in fade-in duration-150">
            {/* Cash in Hand */}
            <div
              onClick={() => {
                const cash = accounts.find((a) => a.type === 'CASH');
                if (cash) openAccountLedger(cash.id);
              }}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 cursor-pointer bg-slate-50/50 dark:bg-slate-800/50"
            >
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">Cash in Hand</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">{formatINR(cashTotal)}</span>
            </div>

            {/* Bank Total */}
            <div
              onClick={() => setIsBankListExpanded(!isBankListExpanded)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 cursor-pointer bg-slate-50/50 dark:bg-slate-800/50"
            >
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">Bank Balance</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">{formatINR(bankTotal)}</span>
            </div>

            {/* To Receive */}
            <div
              onClick={() => setActiveTab('parties')}
              className="p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 cursor-pointer bg-slate-50/50 dark:bg-slate-800/50"
            >
              <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">To Receive</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">{formatINR(toReceive)}</span>
            </div>

            {/* To Pay */}
            <div
              onClick={() => setActiveTab('parties')}
              className="p-2.5 rounded-xl border border-rose-300 dark:border-rose-700 hover:border-rose-500 cursor-pointer bg-slate-50/50 dark:bg-slate-800/50"
            >
              <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400 block">To Pay</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">{formatINR(toPay)}</span>
            </div>

            {/* Expandable Bank list */}
            {isBankListExpanded && (
              <div className="col-span-2 sm:col-span-4 mt-1.5 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                {accounts.filter((a) => a.type === 'BANK').map((b) => (
                  <div
                    key={b.id}
                    onClick={() => openAccountLedger(b.id)}
                    className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-xs"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{b.nickname}</span>
                    <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">
                      {formatINR(accountBalances[b.id] ?? b.openingBalance)}
                    </span>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => openReconcileModal()}
                  className="w-full mt-1 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center justify-center gap-1"
                >
                  <Scale size={12} /> Reconcile Passbook
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. LIST OF TRANSACTIONS FOR SELECTED DATE (Main Focus) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Header with Title & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <History size={16} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Transactions ({periodLabel})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing {filteredTransactions.length} of {activeTxns.length} entries for {fullDisplayDate}
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by party, bill, amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Filter Pills (All, Sales, Purchases, Payment In, Payment Out, Expenses) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'ALL', label: 'All Transactions' },
            { id: 'SALE', label: 'Sales' },
            { id: 'PURCHASE', label: 'Purchases' },
            { id: 'IN', label: 'Payments In' },
            { id: 'OUT', label: 'Payments Out' },
            { id: 'EXPENSE', label: 'Expenses' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setTxnFilter(pill.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all active:scale-95 ${
                txnFilter === pill.id
                  ? 'bg-white dark:bg-slate-800 border-2 border-blue-600 dark:border-blue-400 text-blue-700 dark:text-blue-300 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <EmptyState
            icon={History}
            title={searchQuery ? 'No matching transactions' : `No transactions for ${periodLabel}`}
            description={
              searchQuery
                ? 'Try clearing your search query or filter.'
                : `No cash or bank entries found for ${fullDisplayDate}. Use the "+ Add" button above to record an entry.`
            }
            actionLabel="+ Add Entry"
            actionVariant="moneyIn"
            onAction={() => setShowAddMenu(true)}
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTransactions.map((txn) => {
              const inv = txn.invoiceId ? invoiceMap.get(txn.invoiceId) : undefined;
              const party = txn.partyId ? partyMap.get(txn.partyId) : undefined;
              const account = accountMap.get(txn.accountId);

              // Derive readable party name
              const partyDisplayName = party?.name || inv?.partyName || txn.category || 'Direct Entry';

              // Derive transaction type label & styling (White background with thin colored borders)
              let typeLabel = txn.category;
              let isPositive = txn.type === 'IN';
              let badgeBorderClass = 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300';

              if (inv) {
                if (inv.type === 'SALE') {
                  typeLabel = `Sale #${inv.number}`;
                  isPositive = true;
                  badgeBorderClass = 'border-emerald-500 text-emerald-700 dark:text-emerald-400';
                } else if (inv.type === 'PURCHASE') {
                  typeLabel = `Purchase #${inv.number}`;
                  isPositive = false;
                  badgeBorderClass = 'border-rose-500 text-rose-700 dark:text-rose-400';
                } else if (inv.type === 'SALE_RETURN') {
                  typeLabel = `Sale Return #${inv.number}`;
                  isPositive = false;
                  badgeBorderClass = 'border-amber-500 text-amber-700 dark:text-amber-400';
                } else if (inv.type === 'PURCHASE_RETURN') {
                  typeLabel = `Purchase Return #${inv.number}`;
                  isPositive = true;
                  badgeBorderClass = 'border-emerald-500 text-emerald-700 dark:text-emerald-400';
                }
              } else if (txn.type === 'IN') {
                typeLabel = 'Payment In';
                badgeBorderClass = 'border-emerald-500 text-emerald-700 dark:text-emerald-400';
              } else if (txn.type === 'OUT') {
                typeLabel = txn.partyId ? 'Payment Out' : 'Business Expense';
                badgeBorderClass = 'border-rose-500 text-rose-700 dark:text-rose-400';
              } else {
                typeLabel = 'Transfer';
                badgeBorderClass = 'border-blue-500 text-blue-700 dark:text-blue-400';
              }

              // Status label if applicable
              const statusLabel = inv?.status || 'COMPLETED';

              return (
                <div
                  key={txn.id}
                  onClick={() => openTransactionDetail(txn.id, txn.invoiceId)}
                  className="py-3 px-2 sm:px-3 flex items-center justify-between group hover:bg-slate-50/80 dark:hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer"
                  title="Tap to open complete bill details & share PDF"
                >
                  {/* Left: Icon & Descriptive Info (Labels larger than amount) */}
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white dark:bg-slate-800 border ${
                        isPositive
                          ? 'border-emerald-400 text-emerald-600 dark:text-emerald-400'
                          : txn.type === 'OUT'
                          ? 'border-rose-400 text-rose-600 dark:text-rose-400'
                          : 'border-blue-400 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowDownLeft size={20} strokeWidth={2.5} />
                      ) : txn.type === 'OUT' ? (
                        <ArrowUpRight size={20} strokeWidth={2.5} />
                      ) : (
                        <Coins size={18} />
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      {/* Party Name / Description: Slightly larger than amount */}
                      <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {partyDisplayName}
                      </span>

                      {/* Metadata Row: Date, Type Badge (Border only), Account */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-medium text-slate-600 dark:text-slate-300">{formatDate(txn.date)}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.2 rounded-md bg-white dark:bg-slate-800 border font-bold text-[11px] ${badgeBorderClass}`}>
                          {typeLabel}
                        </span>
                        {inv && (
                          <span
                            className={`px-1.5 py-0.2 rounded-md bg-white dark:bg-slate-800 border text-[10px] font-bold ${
                              inv.status === 'PAID'
                                ? 'border-emerald-400 text-emerald-700 dark:text-emerald-400'
                                : inv.status === 'PARTIAL'
                                ? 'border-amber-400 text-amber-700 dark:text-amber-400'
                                : 'border-rose-400 text-rose-700 dark:text-rose-400'
                            }`}
                          >
                            {statusLabel}
                          </span>
                        )}
                        {account && (
                          <span className="hidden sm:inline text-slate-400">
                            via {account.nickname}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Time */}
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span
                      className={`text-sm sm:text-base font-bold tabular-nums tracking-tight ${
                        isPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isPositive ? '+' : '−'}
                      {formatINR(txn.amount)}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      {formatTime(txn.time)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
