import React, { useState, useMemo } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { LoanAccount } from '../../types';
import { formatINR, paiseToRupees, rupeesToPaise, getTodayDateString } from '../../utils/formatters';
import {
  X,
  Building,
  Plus,
  Coins,
  Trash2,
  Calendar,
  AlertCircle,
  CreditCard,
} from 'lucide-react';

export const LoanAccountsModal: React.FC = () => {
  const isLoanAccountsModalOpen = useLedgerlyStore((state) => state.isLoanAccountsModalOpen);
  const closeLoanAccountsModal = useLedgerlyStore((state) => state.closeLoanAccountsModal);
  const loanAccounts = useLedgerlyStore((state) => state.loanAccounts);
  const accounts = useLedgerlyStore((state) => state.accounts);
  const addLoanAccount = useLedgerlyStore((state) => state.addLoanAccount);
  const recordLoanEmi = useLedgerlyStore((state) => state.recordLoanEmi);
  const deleteLoanAccount = useLedgerlyStore((state) => state.deleteLoanAccount);

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedLoanForEmi, setSelectedLoanForEmi] = useState<LoanAccount | null>(null);

  // Add Loan Form
  const [lenderName, setLenderName] = useState('');
  const [loanAmountRupees, setLoanAmountRupees] = useState('');
  const [interestRate, setInterestRate] = useState('10.5');
  const [emiAmountRupees, setEmiAmountRupees] = useState('');
  const [startDate, setStartDate] = useState(getTodayDateString());

  // Pay EMI Form
  const [emiPayAmountRupees, setEmiPayAmountRupees] = useState('');
  const [emiAccountId, setEmiAccountId] = useState('');

  const activeLoans = useMemo(() => {
    return loanAccounts.filter((l) => !l.isDeleted);
  }, [loanAccounts]);

  const totalOutstandingLoan = useMemo(() => {
    return activeLoans.reduce((sum, l) => sum + l.outstandingAmount, 0);
  }, [activeLoans]);

  if (!isLoanAccountsModalOpen) return null;

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const loanPaise = rupeesToPaise(loanAmountRupees);
    if (loanPaise <= 0 || !lenderName.trim()) {
      alert('Please fill lender name and loan amount.');
      return;
    }
    const emiPaise = emiAmountRupees ? rupeesToPaise(emiAmountRupees) : 0;

    addLoanAccount({
      lenderName: lenderName.trim(),
      loanAmount: loanPaise,
      outstandingAmount: loanPaise,
      interestRate: parseFloat(interestRate) || 0,
      emiAmount: emiPaise,
      startDate,
    });

    setLenderName('');
    setLoanAmountRupees('');
    setEmiAmountRupees('');
    setShowAddForm(false);
  };

  const handlePayEmi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForEmi) return;
    const payPaise = rupeesToPaise(emiPayAmountRupees);
    if (payPaise <= 0) {
      alert('Enter a valid EMI payment amount.');
      return;
    }
    const acc = emiAccountId || accounts[0]?.id;
    if (!acc) {
      alert('Select an account to pay EMI from.');
      return;
    }

    recordLoanEmi(selectedLoanForEmi.id, payPaise, acc, getTodayDateString());
    setSelectedLoanForEmi(null);
    setEmiPayAmountRupees('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-sm">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Loan Accounts Tracker
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">
                  Liabilities
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Manage business loans, track EMI repayments, and outstanding balances
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-orange-600 text-white hover:bg-orange-700 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {showAddForm ? 'Cancel' : 'New Loan'}
            </button>
            <button
              onClick={closeLoanAccountsModal}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Outstanding Total Banner */}
          <div className="p-5 rounded-2xl bg-orange-50/60 border border-orange-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-orange-800 uppercase tracking-wider">
                Total Outstanding Loan Liability
              </div>
              <div className="text-2xl font-bold text-orange-950 mt-1">
                {formatINR(totalOutstandingLoan)}
              </div>
            </div>
            <div className="text-right text-xs text-orange-700 font-medium">
              {activeLoans.length} Active Loans
            </div>
          </div>

          {/* New Loan Form */}
          {showAddForm && (
            <form onSubmit={handleCreateLoan} className="p-5 rounded-2xl border border-orange-200 bg-orange-50/30 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Add Loan Account</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Lender / Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank Business Loan"
                    value={lenderName}
                    onChange={(e) => setLenderName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Loan Amount (₹)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={loanAmountRupees}
                    onChange={(e) => setLoanAmountRupees(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Interest Rate (% p.a.)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="10.5"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Monthly EMI (₹)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={emiAmountRupees}
                    onChange={(e) => setEmiAmountRupees(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-orange-600 text-white hover:bg-orange-700 shadow-sm"
                >
                  Save Loan
                </button>
              </div>
            </form>
          )}

          {/* Pay EMI Sub-Modal */}
          {selectedLoanForEmi && (
            <form onSubmit={handlePayEmi} className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">
                Record EMI Payment for {selectedLoanForEmi.lenderName}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Payment Amount (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={emiPayAmountRupees}
                    onChange={(e) => setEmiPayAmountRupees(e.target.value)}
                    placeholder="EMI amount"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Pay From Account</label>
                  <select
                    value={emiAccountId}
                    onChange={(e) => setEmiAccountId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.bankName || a.nickname} ({formatINR(a.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLoanForEmi(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                >
                  Confirm EMI Payment
                </button>
              </div>
            </form>
          )}

          {/* Loans List Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Lender</th>
                  <th className="py-3 px-4">Interest</th>
                  <th className="py-3 px-4 text-right">Loan Amount</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4 text-right">Monthly EMI</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeLoans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No loan accounts added yet.
                    </td>
                  </tr>
                ) : (
                  activeLoans.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-800">{l.lenderName}</td>
                      <td className="py-3 px-4 text-slate-600">{l.interestRate}% p.a.</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">
                        {formatINR(l.loanAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-orange-700 text-sm">
                        {formatINR(l.outstandingAmount)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {l.emiAmount ? formatINR(l.emiAmount) : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedLoanForEmi(l);
                              setEmiPayAmountRupees(l.emiAmount ? paiseToRupees(l.emiAmount).toString() : '');
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                          >
                            Pay EMI
                          </button>
                          <button
                            onClick={() => deleteLoanAccount(l.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
