import React, { useState } from 'react';
import { useLedgerlyStore } from '../store/useLedgerlyStore';
import { getTranslation } from '../i18n/translations';
import {
  calculateTotalBalance,
  calculateReceivablesAndPayables,
  calculateTotalStockValue,
  calculateProfitAndLoss,
} from '../utils/accounting';
import { formatINR, formatDate, formatTime } from '../utils/formatters';
import { AmountDisplay } from '../components/common/AmountDisplay';
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
  TrendingUp,
  History,
  Receipt,
  ShoppingCart,
  CreditCard,
  PieChart,
  RotateCcw,
  Scale,
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
  const openInvoiceScreen = useLedgerlyStore((state) => state.openInvoiceScreen);
  const openPaymentIn = useLedgerlyStore((state) => state.openPaymentIn);
  const openPaymentOut = useLedgerlyStore((state) => state.openPaymentOut);
  const openExpenseModal = useLedgerlyStore((state) => state.openExpenseModal);
  const openMoneyIn = useLedgerlyStore((state) => state.openMoneyIn);
  const openAccountLedger = useLedgerlyStore((state) => state.openAccountLedger);
  const openPartyLedger = useLedgerlyStore((state) => state.openPartyLedger);
  const openReconcileModal = useLedgerlyStore((state) => state.openReconcileModal);
  const setActiveTab = useLedgerlyStore((state) => state.setActiveTab);
  const deleteTransaction = useLedgerlyStore((state) => state.deleteTransaction);

  const t = getTranslation(language);

  // Expanded Bank List Toggle
  const [isBankListExpanded, setIsBankListExpanded] = useState(false);

  // Computations
  const { total, cashTotal, bankTotal, accountBalances } = calculateTotalBalance(accounts, transactions);
  const { toReceive, toPay } = calculateReceivablesAndPayables(parties, transactions, invoices);
  const { lowStockItems } = calculateTotalStockValue(items, stockMovements);

  // Active period filter for Money In vs Out
  const activeTxns = transactions.filter((txn) => !txn.isDeleted);
  const pnl = calculateProfitAndLoss(activeTxns, invoices);

  // Recent 10 transactions
  const recentTransactions = [...activeTxns]
    .sort((a, b) => {
      const cmp = b.date.localeCompare(a.date);
      if (cmp !== 0) return cmp;
      return (b.time || '').localeCompare(a.time || '');
    })
    .slice(0, 10);

  const partyMap = new Map(parties.map((p) => [p.id, p]));
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  return (
    <div className="space-y-4 pb-28 pt-2">
      {/* 1. LOW STOCK ALERT STRIP (Amber Banner) */}
      {lowStockItems.length > 0 && (
        <div
          onClick={() => setActiveTab('stock')}
          className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 flex items-center justify-between cursor-pointer hover:bg-amber-100/60 transition-all shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={16} />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-900 block leading-tight">
                {lowStockItems.length} {t.itemsBelowMin}
              </span>
              <span className="text-[11px] text-amber-700">
                {lowStockItems.map((i) => i.name).slice(0, 2).join(', ')}
                {lowStockItems.length > 2 ? ` +${lowStockItems.length - 2} more` : ''}
              </span>
            </div>
          </div>
          <ArrowRight size={16} className="text-amber-800 flex-shrink-0" />
        </div>
      )}

      {/* 2. TOP THREE BALANCE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Balance Card (Hero card with Indigo accent) */}
        <div className="p-4 rounded-card bg-gradient-to-br from-primary to-primary-hover text-white shadow-elevated">
          <div className="flex items-center justify-between opacity-90 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.totalBalance}</span>
            <Wallet size={18} />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums mt-1">
            {formatINR(total)}
          </div>
          <span className="text-[11px] opacity-80 mt-1 block">Cash + all Bank accounts</span>
        </div>

        {/* Cash in Hand Card */}
        <div
          onClick={() => {
            const cash = accounts.find((a) => a.type === 'CASH');
            if (cash) openAccountLedger(cash.id);
          }}
          className="p-4 rounded-card bg-white border border-border shadow-card hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-secondary mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.cashInHand}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-moneyIn flex items-center justify-center group-hover:scale-105 transition-transform">
              <Coins size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-primary tabular-nums mt-1">
            {formatINR(cashTotal)}
          </div>
          <span className="text-[11px] text-slate-secondary mt-1 block">Physical shop cash</span>
        </div>

        {/* Bank Balance Card (With Expandable Bank list) */}
        <div className="p-4 rounded-card bg-white border border-border shadow-card transition-all">
          <div
            onClick={() => setIsBankListExpanded(!isBankListExpanded)}
            className="flex items-center justify-between cursor-pointer text-slate-secondary"
          >
            <span className="text-xs font-semibold uppercase tracking-wider">{t.bankBalance}</span>
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-primary flex items-center justify-center">
                <Building2 size={16} />
              </div>
              {isBankListExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          <div
            onClick={() => setIsBankListExpanded(!isBankListExpanded)}
            className="text-xl sm:text-2xl font-extrabold text-slate-primary tabular-nums mt-1 cursor-pointer"
          >
            {formatINR(bankTotal)}
          </div>
          <span className="text-[11px] text-slate-secondary mt-1 block">
            {accounts.filter((a) => a.type === 'BANK').length} accounts linked
          </span>

          {/* Expanded List of Bank Accounts */}
          {isBankListExpanded && (
            <div className="mt-3 pt-3 border-t border-border space-y-2 animate-in fade-in duration-150">
              {accounts
                .filter((a) => a.type === 'BANK')
                .map((b) => (
                  <div
                    key={b.id}
                    onClick={() => openAccountLedger(b.id)}
                    className="flex items-center justify-between py-1 px-2 rounded-xl hover:bg-surface-subtle cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-primary-light text-primary font-bold text-[10px] flex items-center justify-center">
                        {(b.bankName || 'BNK').substring(0, 3)}
                      </span>
                      <span className="font-semibold text-slate-primary">{b.nickname}</span>
                    </div>
                    <span className="font-bold tabular-nums text-slate-primary">
                      {formatINR(accountBalances[b.id] ?? b.openingBalance)}
                    </span>
                  </div>
                ))}

              <button
                type="button"
                onClick={() => openReconcileModal()}
                className="w-full mt-1 py-1.5 rounded-lg bg-surface-subtle hover:bg-slate-200/50 text-[11px] font-bold text-primary flex items-center justify-center gap-1"
              >
                <Scale size={12} /> Reconcile Passbook
              </button>
            </div>
          )}
        </div>
      </div>

      {/* VYAPAR-STYLE TWO LARGE DASHBOARD BUTTON MODULES: MONEY IN & MONEY OUT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* MONEY IN */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-elevated space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                <ArrowDownLeft size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wide">MONEY IN</h3>
                <span className="text-[11px] text-emerald-100">Income, Sales & Collections</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => openInvoiceScreen('SALE')}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 flex flex-col items-center text-center transition-all shadow-xs"
            >
              <Receipt size={16} className="mb-1" />
              <span className="text-[11px] font-bold">+ Add Sale</span>
            </button>

            <button
              type="button"
              onClick={() => openPaymentIn()}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 flex flex-col items-center text-center transition-all shadow-xs"
            >
              <CreditCard size={16} className="mb-1" />
              <span className="text-[11px] font-bold">+ Payment In</span>
            </button>

            <button
              type="button"
              onClick={() => openInvoiceScreen('SALE_RETURN')}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 flex flex-col items-center text-center transition-all shadow-xs"
            >
              <RotateCcw size={16} className="mb-1" />
              <span className="text-[11px] font-bold">Sale Return</span>
            </button>
          </div>
        </div>

        {/* MONEY OUT */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-elevated space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                <ArrowUpRight size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wide">MONEY OUT</h3>
                <span className="text-[11px] text-rose-100">Purchases, Payouts & Expenses</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 pt-1">
            <button
              type="button"
              onClick={() => openInvoiceScreen('PURCHASE')}
              className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 flex flex-col items-center text-center transition-all shadow-xs"
            >
              <ShoppingCart size={15} className="mb-1" />
              <span className="text-[10px] font-bold">Purchase</span>
            </button>

            <button
              type="button"
              onClick={() => openPaymentOut()}
              className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 flex flex-col items-center text-center transition-all shadow-xs"
            >
              <CreditCard size={15} className="mb-1" />
              <span className="text-[10px] font-bold">Payment</span>
            </button>

            <button
              type="button"
              onClick={() => openExpenseModal()}
              className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 flex flex-col items-center text-center transition-all shadow-xs"
            >
              <PieChart size={15} className="mb-1" />
              <span className="text-[10px] font-bold">Expense</span>
            </button>

            <button
              type="button"
              onClick={() => openInvoiceScreen('PURCHASE_RETURN')}
              className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 flex flex-col items-center text-center transition-all shadow-xs"
            >
              <RotateCcw size={15} className="mb-1" />
              <span className="text-[10px] font-bold">Return</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. MONEY IN VS MONEY OUT PERIOD SUMMARY WITH PROGRESS BAR */}
      <div className="p-4 rounded-card bg-white border border-border shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-slate-primary">Cash Flow Summary ({period})</h3>
          </div>
          <span className="text-xs font-semibold text-slate-secondary">
            Net: <span className={pnl.netProfit >= 0 ? 'text-moneyIn' : 'text-moneyOut'}>{formatINR(pnl.netProfit)}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center gap-1.5 text-moneyIn mb-1">
              <ArrowDownLeft size={16} strokeWidth={2.5} />
              <span className="text-xs font-bold uppercase">{t.receiveMoney}</span>
            </div>
            <div className="text-lg font-extrabold text-moneyIn tabular-nums">
              {formatINR(pnl.totalRevenue, { showSign: true, type: 'IN' })}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100">
            <div className="flex items-center gap-1.5 text-moneyOut mb-1">
              <ArrowUpRight size={16} strokeWidth={2.5} />
              <span className="text-xs font-bold uppercase">{t.payMoney}</span>
            </div>
            <div className="text-lg font-extrabold text-moneyOut tabular-nums">
              {formatINR(pnl.totalExpense, { showSign: true, type: 'OUT' })}
            </div>
          </div>
        </div>

        {/* Visual Ratio Bar Chart */}
        {pnl.totalRevenue + pnl.totalExpense > 0 && (
          <div className="w-full h-2.5 rounded-full bg-surface-subtle overflow-hidden flex">
            <div
              className="bg-moneyIn h-full transition-all duration-300"
              style={{
                width: `${Math.round((pnl.totalRevenue / (pnl.totalRevenue + pnl.totalExpense)) * 100)}%`,
              }}
            />
            <div
              className="bg-moneyOut h-full transition-all duration-300"
              style={{
                width: `${Math.round((pnl.totalExpense / (pnl.totalRevenue + pnl.totalExpense)) * 100)}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* 4. TO RECEIVE & TO PAY CARDS */}
      <div className="grid grid-cols-2 gap-3">
        {/* To Receive (Customers owe you) */}
        <div
          onClick={() => setActiveTab('parties')}
          className="p-4 rounded-card bg-white border border-border shadow-card hover:border-emerald-200 cursor-pointer transition-all"
        >
          <span className="text-xs font-semibold text-slate-secondary uppercase block mb-1">
            {t.toReceive}
          </span>
          <div className="text-lg sm:text-xl font-extrabold text-moneyIn tabular-nums">
            {formatINR(toReceive)}
          </div>
          <span className="text-[11px] text-slate-secondary mt-1 block">Customers owe you</span>
        </div>

        {/* To Pay (You owe suppliers) */}
        <div
          onClick={() => setActiveTab('parties')}
          className="p-4 rounded-card bg-white border border-border shadow-card hover:border-rose-200 cursor-pointer transition-all"
        >
          <span className="text-xs font-semibold text-slate-secondary uppercase block mb-1">
            {t.toPay}
          </span>
          <div className="text-lg sm:text-xl font-extrabold text-moneyOut tabular-nums">
            {formatINR(toPay)}
          </div>
          <span className="text-[11px] text-slate-secondary mt-1 block">You owe suppliers</span>
        </div>
      </div>

      {/* 5. RECENT TRANSACTIONS (LAST 10) */}
      <div className="p-4 rounded-card bg-white border border-border shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-slate-primary">{t.recentTransactions}</h3>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className="text-xs font-bold text-primary hover:text-primary-hover"
          >
            {t.seeAll}
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <EmptyState
            icon={History}
            title={t.noTransactionsYet}
            description="Record your cash or bank payments easily."
            actionLabel={t.moneyIn}
            actionVariant="moneyIn"
            onAction={() => openMoneyIn()}
          />
        ) : (
          <div className="divide-y divide-border">
            {recentTransactions.map((txn) => {
              const party = txn.partyId ? partyMap.get(txn.partyId) : undefined;
              const account = accountMap.get(txn.accountId);

              return (
                <div
                  key={txn.id}
                  className="py-3 flex items-center justify-between group hover:bg-surface-subtle/50 px-1 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        txn.type === 'IN'
                          ? 'bg-moneyIn-tint text-moneyIn'
                          : txn.type === 'OUT'
                          ? 'bg-moneyOut-tint text-moneyOut'
                          : 'bg-primary-light text-primary'
                      }`}
                    >
                      {txn.type === 'IN' ? (
                        <ArrowDownLeft size={20} strokeWidth={2.5} />
                      ) : txn.type === 'OUT' ? (
                        <ArrowUpRight size={20} strokeWidth={2.5} />
                      ) : (
                        <Coins size={18} />
                      )}
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-primary leading-tight">
                        {party?.name || txn.category}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-secondary mt-0.5">
                        <span>{formatDate(txn.date)}</span>
                        <span>•</span>
                        <span>{txn.mode}</span>
                        {account && <span>({account.nickname})</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <AmountDisplay
                      amount={txn.amount}
                      type={txn.type === 'IN' ? 'IN' : txn.type === 'OUT' ? 'OUT' : 'NEUTRAL'}
                      showSign
                      size="md"
                    />
                    <span className="text-[10px] text-slate-secondary mt-0.5">
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
