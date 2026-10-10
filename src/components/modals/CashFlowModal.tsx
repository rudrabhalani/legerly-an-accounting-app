import React, { useState, useMemo } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { calculateTotalBalance } from '../../utils/accounting';
import { formatINR, paiseToRupees } from '../../utils/formatters';
import { generateRegisterPdf } from '../../services/pdfService';
import {
  X,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Calendar,
  Wallet,
} from 'lucide-react';

export const CashFlowModal: React.FC = () => {
  const isCashFlowModalOpen = useLedgerlyStore((state) => state.isCashFlowModalOpen);
  const closeCashFlowModal = useLedgerlyStore((state) => state.closeCashFlowModal);
  const transactions = useLedgerlyStore((state) => state.transactions);
  const accounts = useLedgerlyStore((state) => state.accounts);
  const expenses = useLedgerlyStore((state) => state.expenses);
  const invoices = useLedgerlyStore((state) => state.invoices);
  const business = useLedgerlyStore((state) => state.business);

  const [period, setPeriod] = useState<'THIS_MONTH' | 'THIS_FY' | 'ALL'>('THIS_MONTH');

  const filteredTxns = useMemo(() => {
    return transactions.filter((t) => !t.isDeleted);
  }, [transactions]);

  // Compute Inflow categories
  const salesCashIn = useMemo(() => {
    return filteredTxns
      .filter((t) => t.type === 'IN' && (t.category === 'Sale' || t.category === 'SALE'))
      .reduce((s, t) => s + t.amount, 0);
  }, [filteredTxns]);

  const customerReceipts = useMemo(() => {
    return filteredTxns
      .filter((t) => t.type === 'IN' && t.category !== 'Sale' && t.category !== 'SALE')
      .reduce((s, t) => s + t.amount, 0);
  }, [filteredTxns]);

  const totalInflow = salesCashIn + customerReceipts;

  // Compute Outflow categories
  const purchasesCashOut = useMemo(() => {
    return filteredTxns
      .filter((t) => t.type === 'OUT' && (t.category === 'Purchase' || t.category === 'PURCHASE'))
      .reduce((s, t) => s + t.amount, 0);
  }, [filteredTxns]);

  const supplierPayments = useMemo(() => {
    return filteredTxns
      .filter((t) => t.type === 'OUT' && t.category !== 'Purchase' && t.category !== 'PURCHASE' && t.category !== 'Expense' && t.category !== 'EXPENSE')
      .reduce((s, t) => s + t.amount, 0);
  }, [filteredTxns]);

  const totalExpensesOut = useMemo(() => {
    return expenses.filter((e) => !e.isDeleted).reduce((s, e) => s + e.amount, 0);
  }, [expenses]);

  const totalOutflow = purchasesCashOut + supplierPayments + totalExpensesOut;
  const netCashFlow = totalInflow - totalOutflow;

  const { total: currentCashBank } = useMemo(
    () => calculateTotalBalance(accounts, transactions),
    [accounts, transactions]
  );

  if (!isCashFlowModalOpen) return null;

  const handleExportPdf = () => {
    const doc = generateRegisterPdf('Cash Flow Register', invoices, business);
    doc.save('Cash-Flow-Register.pdf');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Cash Flow Statement
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-700 font-semibold">
                  Cash & Bank Flow
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Operating cash movements, total collections, and disbursements
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4 text-teal-600" />
              PDF Export
            </button>
            <button
              onClick={closeCashFlowModal}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Net Cash Flow Banner */}
          <div
            className={`p-5 rounded-2xl border flex items-center justify-between ${
              netCashFlow >= 0
                ? 'bg-emerald-50/70 border-emerald-200'
                : 'bg-rose-50/70 border-rose-200'
            }`}
          >
            <div>
              <div
                className={`text-xs font-bold uppercase tracking-wider ${
                  netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                Net Cash Flow (Inflows − Outflows)
              </div>
              <div
                className={`text-2xl font-bold mt-1 ${
                  netCashFlow >= 0 ? 'text-emerald-950' : 'text-rose-950'
                }`}
              >
                {netCashFlow >= 0 ? `+${formatINR(netCashFlow)}` : formatINR(netCashFlow)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">Current Cash & Bank Balance</div>
              <div className="text-lg font-bold text-slate-800 mt-1">
                {formatINR(currentCashBank)}
              </div>
            </div>
          </div>

          {/* Inflows Section */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                Cash Inflows (Money In)
              </h3>
              <span className="text-sm font-bold text-emerald-600">{formatINR(totalInflow)}</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 px-3 rounded-lg bg-slate-50">
                <span className="text-slate-600 font-medium">Direct Sales Cash Inflow</span>
                <span className="font-bold text-slate-900">{formatINR(salesCashIn)}</span>
              </div>
              <div className="flex justify-between py-1.5 px-3 rounded-lg bg-slate-50">
                <span className="text-slate-600 font-medium">Customer Debt Collections (Payment In)</span>
                <span className="font-bold text-slate-900">{formatINR(customerReceipts)}</span>
              </div>
            </div>
          </div>

          {/* Outflows Section */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                Cash Outflows (Money Out)
              </h3>
              <span className="text-sm font-bold text-rose-600">{formatINR(totalOutflow)}</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 px-3 rounded-lg bg-slate-50">
                <span className="text-slate-600 font-medium">Direct Purchases Cash Outflow</span>
                <span className="font-bold text-slate-900">{formatINR(purchasesCashOut)}</span>
              </div>
              <div className="flex justify-between py-1.5 px-3 rounded-lg bg-slate-50">
                <span className="text-slate-600 font-medium">Supplier Payments (Payment Out)</span>
                <span className="font-bold text-slate-900">{formatINR(supplierPayments)}</span>
              </div>
              <div className="flex justify-between py-1.5 px-3 rounded-lg bg-slate-50">
                <span className="text-slate-600 font-medium">Operating Expenses</span>
                <span className="font-bold text-slate-900">{formatINR(totalExpensesOut)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
