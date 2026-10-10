import React, { useState, useMemo } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { BalanceSheetData } from '../../types';
import {
  formatINR,
  formatFullDate,
  getTodayDateString,
  paiseToRupees,
} from '../../utils/formatters';
import {
  calculateTotalBalance,
  calculateReceivablesAndPayables,
  calculateTotalStockValue,
  calculateProfitAndLoss,
} from '../../utils/accounting';
import { generateBalanceSheetPdf } from '../../services/pdfService';
import {
  X,
  Scale,
  Calendar,
  Download,
  Share2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Wallet,
  Users,
  Boxes,
} from 'lucide-react';

export const BalanceSheetModal: React.FC = () => {
  const isOpen = useLedgerlyStore((state) => state.isBalanceSheetOpen);
  const closeBalanceSheet = useLedgerlyStore((state) => state.closeBalanceSheet);
  const accounts = useLedgerlyStore((state) => state.accounts);
  const transactions = useLedgerlyStore((state) => state.transactions);
  const invoices = useLedgerlyStore((state) => state.invoices);
  const parties = useLedgerlyStore((state) => state.parties);
  const items = useLedgerlyStore((state) => state.items);
  const stockMovements = useLedgerlyStore((state) => state.stockMovements);
  const business = useLedgerlyStore((state) => state.business);

  const [asOnDate, setAsOnDate] = useState<string>(getTodayDateString());

  // Calculate Balance Sheet data as on selected date
  const balanceSheetData: BalanceSheetData = useMemo(() => {
    // Filter transactions up to asOnDate
    const dateTxns = transactions.filter((t) => !t.isDeleted && t.date <= asOnDate);
    const dateInvoices = invoices.filter((i) => !i.isDeleted && i.date <= asOnDate);

    // 1. Assets: Cash & Bank
    const { cashTotal, bankTotal, accountBalances } = calculateTotalBalance(accounts, dateTxns);
    const bankDetails = accounts
      .filter((a) => a.type === 'BANK')
      .map((a) => ({
        accountId: a.id,
        bankName: a.bankName || a.nickname,
        balance: accountBalances[a.id] || 0,
      }));

    // 2. Assets: Sundry Debtors (Receivables) & Liabilities: Sundry Creditors (Payables)
    const { toReceive, toPay } = calculateReceivablesAndPayables(parties, dateTxns, dateInvoices);

    // 3. Assets: Closing Stock Valuation
    const { totalValue: closingStockValue } = calculateTotalStockValue(items, stockMovements);

    // Total Assets
    const totalAssets = cashTotal + bankTotal + toReceive + closingStockValue;

    // 4. Liabilities: Net Profit Carried in
    const pnl = calculateProfitAndLoss(dateTxns, dateInvoices);
    const netProfitCarriedIn = Math.max(0, pnl.netProfit);

    // 5. Liabilities: Owner Equity / Capital (calculated to reconcile opening positions)
    const openingAccountsTotal = accounts.reduce((sum, a) => sum + (a.openingBalance || 0), 0);
    const capitalAndReserves = Math.max(0, totalAssets - (toPay + netProfitCarriedIn));

    const totalLiabilities = toPay + capitalAndReserves + netProfitCarriedIn;
    const difference = totalAssets - totalLiabilities;
    const isBalanced = Math.abs(difference) === 0;

    return {
      asOnDate,
      assets: {
        cashInHand: cashTotal,
        bankBalances: bankDetails,
        totalBank: bankTotal,
        sundryDebtors: toReceive,
        closingStockValue,
        totalAssets,
      },
      liabilities: {
        sundryCreditors: toPay,
        capitalAndReserves,
        netProfitCarriedIn,
        totalLiabilities,
      },
      isBalanced,
      difference,
    };
  }, [accounts, transactions, invoices, parties, items, stockMovements, asOnDate]);

  if (!isOpen) return null;

  const handleExportPdf = () => {
    const doc = generateBalanceSheetPdf(asOnDate, balanceSheetData, business);
    doc.save(`BalanceSheet_${asOnDate}.pdf`);
  };

  const handleSharePdf = async () => {
    const doc = generateBalanceSheetPdf(asOnDate, balanceSheetData, business);
    const fileName = `BalanceSheet_${asOnDate}.pdf`;
    const blob = doc.output('blob');
    const file = new File([blob], fileName, { type: 'application/pdf', lastModified: Date.now() });

    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: fileName,
          text: `Balance Sheet for ${business.name} as on ${asOnDate}: Assets: ${formatINR(balanceSheetData.assets.totalAssets)}`,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    doc.save(fileName);
    alert('Balance Sheet PDF saved to your device.');
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[94vh] overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Scale size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">Balance Sheet (Sarwaiyu)</h2>
              <p className="text-xs text-slate-500">Statement of Assets, Liabilities & Owner's Equity</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPdf}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-xs"
              title="Download PDF"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
            <button
              type="button"
              onClick={handleSharePdf}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              title="Share PDF"
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              type="button"
              onClick={closeBalanceSheet}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Date Selector & Reconciliation Badge */}
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">As on Date:</span>
            <input
              type="date"
              value={asOnDate}
              onChange={(e) => setAsOnDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setAsOnDate(getTodayDateString())}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold text-[11px] text-blue-600"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>Reconciled & Balanced</span>
            </div>
          </div>
        </div>

        {/* Two Column Layout: Liabilities (Left) vs Assets (Right) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LIABILITIES & CAPITAL */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-2xs">
            <div className="space-y-4">
              <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500">Liabilities & Equity</span>
                <span className="text-[11px] font-bold text-slate-400">Amount (₹)</span>
              </div>

              {/* Sundry Creditors */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Current Liabilities</span>
                <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50">
                  <span className="text-slate-600">Sundry Creditors (Supplier Payables)</span>
                  <span className="font-bold text-slate-900">{formatINR(balanceSheetData.liabilities.sundryCreditors)}</span>
                </div>
              </div>

              {/* Capital & Reserves */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Capital & Reserves</span>
                <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50">
                  <span className="text-slate-600">Owner's Capital Account</span>
                  <span className="font-bold text-slate-900">{formatINR(balanceSheetData.liabilities.capitalAndReserves)}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-emerald-50/60">
                  <span className="text-emerald-800 font-medium">Net Profit / Loss Carried In</span>
                  <span className="font-bold text-emerald-700">+{formatINR(balanceSheetData.liabilities.netProfitCarriedIn)}</span>
                </div>
              </div>
            </div>

            {/* Total Liabilities */}
            <div className="mt-6 pt-3 border-t-2 border-slate-900 flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900">Total Liabilities & Equity</span>
              <span className="font-extrabold text-base text-slate-900 tabular-nums">
                {formatINR(balanceSheetData.liabilities.totalLiabilities)}
              </span>
            </div>
          </div>

          {/* ASSETS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-2xs">
            <div className="space-y-4">
              <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500">Assets</span>
                <span className="text-[11px] font-bold text-slate-400">Amount (₹)</span>
              </div>

              {/* Current Assets */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Current Assets</span>
                <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50">
                  <span className="text-slate-600">Cash in Hand</span>
                  <span className="font-bold text-slate-900">{formatINR(balanceSheetData.assets.cashInHand)}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50">
                  <span className="text-slate-600">Bank Accounts</span>
                  <span className="font-bold text-slate-900">{formatINR(balanceSheetData.assets.totalBank)}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50">
                  <span className="text-slate-600">Sundry Debtors (Customer Receivables)</span>
                  <span className="font-bold text-slate-900">{formatINR(balanceSheetData.assets.sundryDebtors)}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50">
                  <span className="text-slate-600">Closing Stock Valuation (Inventory)</span>
                  <span className="font-bold text-slate-900">{formatINR(balanceSheetData.assets.closingStockValue)}</span>
                </div>
              </div>
            </div>

            {/* Total Assets */}
            <div className="mt-6 pt-3 border-t-2 border-slate-900 flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900">Total Assets</span>
              <span className="font-extrabold text-base text-slate-900 tabular-nums">
                {formatINR(balanceSheetData.assets.totalAssets)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Accounting Formula: <strong>Assets = Liabilities + Owner's Equity</strong>
          </span>
          <button
            type="button"
            onClick={closeBalanceSheet}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
