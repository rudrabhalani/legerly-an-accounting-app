import React, { useState } from 'react';
import { useLedgerlyStore } from '../store/useLedgerlyStore';
import { getTranslation } from '../i18n/translations';
import {
  calculateTotalBalance,
  calculateReceivablesAndPayables,
  calculateTotalStockValue,
} from '../utils/accounting';
import { formatINR, formatDate, formatTime } from '../utils/formatters';
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
  Receipt,
  ShoppingCart,
  CreditCard,
  PieChart,
  Scale,
  Search,
  CheckCircle2,
  Clock3,
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const accounts = useLedgerlyStore((state) => state.accounts);
  const transactions = useLedgerlyStore((state) => state.transactions);
  const parties = useLedgerlyStore((state) => state.parties);
  const items = useLedgerlyStore((state) => state.items);
  const stockMovements = useLedgerlyStore((state) => state.stockMovements);
  const invoices = useLedgerlyStore((state) => state.invoices);
  const period = useLedgerlyStore((state) => state.period);
  const language = useLedgerlyStore((state) => state.business.language);
  const openMoneyIn = useLedgerlyStore((state) => state.openMoneyIn);
  const openAccountLedger = useLedgerlyStore((state) => state.openAccountLedger);
  const openPartyLedger = useLedgerlyStore((state) => state.openPartyLedger);
  const openReconcileModal = useLedgerlyStore((state) => state.openReconcileModal);
  const openTransactionDetail = useLedgerlyStore((state) => state.openTransactionDetail);
  const setActiveTab = useLedgerlyStore((state) => state.setActiveTab);

  const t = getTranslation(language);

  // Expanded Bank List Toggle
  const [isBankListExpanded, setIsBankListExpanded] = useState(false);

  // Search & Filter state for homepage transaction list
  const [searchQuery, setSearchQuery] = useState('');
  const [txnFilter, setTxnFilter] = useState<'ALL' | 'SALE' | 'PURCHASE' | 'IN' | 'OUT' | 'EXPENSE'>('ALL');

  // Computations
  const { total, cashTotal, bankTotal, accountBalances } = calculateTotalBalance(accounts, transactions);
  const { toReceive, toPay } = calculateReceivablesAndPayables(parties, transactions, invoices);
  const { lowStockItems } = calculateTotalStockValue(items, stockMovements);

  // Active non-deleted transactions
  const activeTxns = transactions.filter((txn) => !txn.isDeleted);

  const partyMap = new Map(parties.map((p) => [p.id, p]));
  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const invoiceMap = new Map(invoices.map((i) => [i.id, i]));

  // Sorted all transactions (newest first)
  const sortedTransactions = [...activeTxns].sort((a, b) => {
    const cmp = b.date.localeCompare(a.date);
    if (cmp !== 0) return cmp;
    return (b.time || '').localeCompare(a.time || '');
  });

  // Filtered transactions based on search and type pill
  const filteredTransactions = sortedTransactions.filter((txn) => {
    const inv = txn.invoiceId ? invoiceMap.get(txn.invoiceId) : undefined;
    const party = txn.partyId ? partyMap.get(txn.partyId) : undefined;
    const partyName = party?.name || inv?.partyName || '';

    // Type filter
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

    // Search query filter
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
    <div className="space-y-4 pb-28 pt-2">
      {/* 1. LOW STOCK ALERT STRIP (Amber Banner) */}
      {lowStockItems.length > 0 && (
        <div
          onClick={() => setActiveTab('stock')}
          className="bg-white border-2 border-amber-500 rounded-2xl p-3 flex items-center justify-between cursor-pointer hover:bg-amber-50/50 transition-all shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white border border-amber-400 text-amber-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block leading-tight">
                {lowStockItems.length} {t.itemsBelowMin}
              </span>
              <span className="text-xs text-amber-800">
                {lowStockItems.map((i) => i.name).slice(0, 2).join(', ')}
                {lowStockItems.length > 2 ? ` +${lowStockItems.length - 2} more` : ''}
              </span>
            </div>
          </div>
          <ArrowRight size={16} className="text-amber-800 flex-shrink-0" />
        </div>
      )}

      {/* 2. REORGANIZED COMPACT SUMMARY ROW (Clean White Cards with Colored Borders Only) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {/* Total Balance Card (Blue border) */}
        <div className="p-3.5 rounded-2xl bg-white border-2 border-blue-500 text-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-600 mb-0.5">
            <span className="text-xs font-bold uppercase tracking-wider">{t.totalBalance}</span>
            <Wallet size={16} />
          </div>
          <div className="text-lg sm:text-xl font-bold tracking-tight tabular-nums text-slate-900">
            {formatINR(total)}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block truncate">Cash + Bank accounts</span>
        </div>

        {/* Cash in Hand Card (Neutral/Blue border) */}
        <div
          onClick={() => {
            const cash = accounts.find((a) => a.type === 'CASH');
            if (cash) openAccountLedger(cash.id);
          }}
          className="p-3.5 rounded-2xl bg-white border border-slate-300 hover:border-blue-400 shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-600 mb-0.5">
            <span className="text-xs font-bold uppercase tracking-wider">{t.cashInHand}</span>
            <Coins size={16} className="text-emerald-600" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
            {formatINR(cashTotal)}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block truncate">Physical shop cash</span>
        </div>

        {/* Bank Balance Card (Neutral/Blue border with Expandable List) */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-300 hover:border-blue-400 shadow-xs transition-all flex flex-col justify-between">
          <div
            onClick={() => setIsBankListExpanded(!isBankListExpanded)}
            className="flex items-center justify-between cursor-pointer text-slate-600 mb-0.5"
          >
            <span className="text-xs font-bold uppercase tracking-wider">{t.bankBalance}</span>
            <div className="flex items-center gap-1">
              <Building2 size={16} className="text-blue-600" />
              {isBankListExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </div>

          <div
            onClick={() => setIsBankListExpanded(!isBankListExpanded)}
            className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums cursor-pointer"
          >
            {formatINR(bankTotal)}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
            {accounts.filter((a) => a.type === 'BANK').length} bank accounts
          </span>

          {/* Expandable Bank list */}
          {isBankListExpanded && (
            <div className="mt-2 pt-2 border-t border-slate-200 space-y-1.5 animate-in fade-in duration-150">
              {accounts
                .filter((a) => a.type === 'BANK')
                .map((b) => (
                  <div
                    key={b.id}
                    onClick={() => openAccountLedger(b.id)}
                    className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                  >
                    <span className="font-semibold text-slate-800 truncate">{b.nickname}</span>
                    <span className="font-bold tabular-nums text-slate-900">
                      {formatINR(accountBalances[b.id] ?? b.openingBalance)}
                    </span>
                  </div>
                ))}

              <button
                type="button"
                onClick={() => openReconcileModal()}
                className="w-full mt-1 py-1 rounded-lg bg-white border border-blue-200 hover:bg-blue-50/50 text-[11px] font-bold text-blue-700 flex items-center justify-center gap-1"
              >
                <Scale size={12} /> Reconcile Passbook
              </button>
            </div>
          )}
        </div>

        {/* To Receive Card (Green border only, white background) */}
        <div
          onClick={() => setActiveTab('parties')}
          className="p-3.5 rounded-2xl bg-white border-2 border-emerald-500 shadow-xs hover:border-emerald-600 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-emerald-600 mb-0.5">
            <span className="text-xs font-bold uppercase tracking-wider">{t.toReceive}</span>
            <ArrowDownLeft size={16} strokeWidth={2.5} />
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
            {formatINR(toReceive)}
          </div>
          <span className="text-[11px] text-emerald-700 mt-0.5 block truncate">Customers owe you</span>
        </div>

        {/* To Pay Card (Red border only, white background) */}
        <div
          onClick={() => setActiveTab('parties')}
          className="p-3.5 rounded-2xl bg-white border-2 border-rose-500 shadow-xs hover:border-rose-600 cursor-pointer transition-all flex flex-col justify-between col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between text-rose-600 mb-0.5">
            <span className="text-xs font-bold uppercase tracking-wider">{t.toPay}</span>
            <ArrowUpRight size={16} strokeWidth={2.5} />
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
            {formatINR(toPay)}
          </div>
          <span className="text-[11px] text-rose-700 mt-0.5 block truncate">You owe suppliers</span>
        </div>
      </div>

      {/* 3. MAIN FOCUS: HOMEPAGE TRANSACTION LIST (Full Width & Spacious) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        {/* Top Header with Title, Search, and Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white border border-blue-400 text-blue-600 flex items-center justify-center font-bold">
              <History size={16} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {t.recentTransactions}
              </h2>
              <p className="text-xs text-slate-500">
                Showing {filteredTransactions.length} of {activeTxns.length} transactions ({period})
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by party, invoice, amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
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
                  ? 'bg-white border-2 border-blue-600 text-blue-700 shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
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
            title={searchQuery ? 'No matching transactions' : t.noTransactionsYet}
            description={searchQuery ? 'Try clearing your search query or filter.' : 'Record your cash or bank payments easily.'}
            actionLabel={t.moneyIn}
            actionVariant="moneyIn"
            onAction={() => openMoneyIn()}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((txn) => {
              const inv = txn.invoiceId ? invoiceMap.get(txn.invoiceId) : undefined;
              const party = txn.partyId ? partyMap.get(txn.partyId) : undefined;
              const account = accountMap.get(txn.accountId);

              // Derive readable party name
              const partyDisplayName = party?.name || inv?.partyName || txn.category || 'Direct Entry';

              // Derive transaction type label & styling (White background with thin colored borders)
              let typeLabel = txn.category;
              let isPositive = txn.type === 'IN';
              let badgeBorderClass = 'border-slate-300 text-slate-700';

              if (inv) {
                if (inv.type === 'SALE') {
                  typeLabel = `Sale #${inv.number}`;
                  isPositive = true;
                  badgeBorderClass = 'border-emerald-500 text-emerald-700';
                } else if (inv.type === 'PURCHASE') {
                  typeLabel = `Purchase #${inv.number}`;
                  isPositive = false;
                  badgeBorderClass = 'border-rose-500 text-rose-700';
                } else if (inv.type === 'SALE_RETURN') {
                  typeLabel = `Sale Return #${inv.number}`;
                  isPositive = false;
                  badgeBorderClass = 'border-amber-500 text-amber-700';
                } else if (inv.type === 'PURCHASE_RETURN') {
                  typeLabel = `Purchase Return #${inv.number}`;
                  isPositive = true;
                  badgeBorderClass = 'border-emerald-500 text-emerald-700';
                }
              } else if (txn.type === 'IN') {
                typeLabel = 'Payment In';
                badgeBorderClass = 'border-emerald-500 text-emerald-700';
              } else if (txn.type === 'OUT') {
                typeLabel = txn.partyId ? 'Payment Out' : 'Business Expense';
                badgeBorderClass = 'border-rose-500 text-rose-700';
              } else {
                typeLabel = 'Transfer';
                badgeBorderClass = 'border-blue-500 text-blue-700';
              }

              // Status label if applicable
              const statusLabel = inv?.status || 'COMPLETED';

              return (
                <div
                  key={txn.id}
                  onClick={() => openTransactionDetail(txn.id, txn.invoiceId)}
                  className="py-3 px-2 sm:px-3 flex items-center justify-between group hover:bg-slate-50/80 rounded-xl transition-all cursor-pointer"
                  title="Tap to open complete details immediately"
                >
                  {/* Left: Icon & Descriptive Info (Labels larger than amount) */}
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white border ${
                        isPositive
                          ? 'border-emerald-400 text-emerald-600'
                          : txn.type === 'OUT'
                          ? 'border-rose-400 text-rose-600'
                          : 'border-blue-400 text-blue-600'
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
                      <span className="text-base sm:text-lg font-bold text-slate-900 leading-snug truncate group-hover:text-blue-600 transition-colors">
                        {partyDisplayName}
                      </span>

                      {/* Metadata Row: Date, Type Badge (Border only), Account */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <span className="font-medium text-slate-600">{formatDate(txn.date)}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.2 rounded-md bg-white border font-bold text-[11px] ${badgeBorderClass}`}>
                          {typeLabel}
                        </span>
                        {inv && (
                          <span
                            className={`px-1.5 py-0.2 rounded-md bg-white border text-[10px] font-bold ${
                              inv.status === 'PAID'
                                ? 'border-emerald-400 text-emerald-700'
                                : inv.status === 'PARTIAL'
                                ? 'border-amber-400 text-amber-700'
                                : 'border-rose-400 text-rose-700'
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
                        isPositive ? 'text-emerald-700' : 'text-rose-600'
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
