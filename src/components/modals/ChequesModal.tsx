import React, { useState, useMemo } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { Cheque, ChequeType, ChequeStatus } from '../../types';
import { formatINR, paiseToRupees, rupeesToPaise, getTodayDateString } from '../../utils/formatters';
import {
  X,
  CreditCard,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Search,
  Filter,
} from 'lucide-react';

export const ChequesModal: React.FC = () => {
  const isChequesModalOpen = useLedgerlyStore((state) => state.isChequesModalOpen);
  const closeChequesModal = useLedgerlyStore((state) => state.closeChequesModal);
  const cheques = useLedgerlyStore((state) => state.cheques);
  const parties = useLedgerlyStore((state) => state.parties);
  const addCheque = useLedgerlyStore((state) => state.addCheque);
  const updateChequeStatus = useLedgerlyStore((state) => state.updateChequeStatus);
  const deleteCheque = useLedgerlyStore((state) => state.deleteCheque);

  const [activeTab, setActiveTab] = useState<ChequeType>('RECEIVED');
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [partyId, setPartyId] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [chequeDate, setChequeDate] = useState(getTodayDateString());
  const [amountRupees, setAmountRupees] = useState('');
  const [notes, setNotes] = useState('');

  const filteredCheques = useMemo(() => {
    return cheques
      .filter((c) => !c.isDeleted && c.type === activeTab)
      .filter((c) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
          c.chequeNumber.toLowerCase().includes(term) ||
          c.partyName.toLowerCase().includes(term) ||
          c.bankName.toLowerCase().includes(term)
        );
      });
  }, [cheques, activeTab, searchTerm]);

  const openChequesTotal = useMemo(() => {
    return cheques
      .filter((c) => !c.isDeleted && c.type === activeTab && c.status === 'OPEN')
      .reduce((sum, c) => sum + c.amount, 0);
  }, [cheques, activeTab]);

  if (!isChequesModalOpen) return null;

  const handleCreateCheque = (e: React.FormEvent) => {
    e.preventDefault();
    const party = parties.find((p) => p.id === partyId);
    if (!party && !partyId) {
      alert('Please select or specify a party.');
      return;
    }
    const amtPaise = rupeesToPaise(amountRupees);
    if (amtPaise <= 0) {
      alert('Please enter a valid cheque amount.');
      return;
    }
    if (!chequeNumber.trim()) {
      alert('Please enter the cheque number.');
      return;
    }

    addCheque({
      type: activeTab,
      partyId: party?.id || 'cash-party',
      partyName: party?.name || 'Cash Customer',
      chequeNumber: chequeNumber.trim(),
      bankName: bankName.trim() || 'Bank',
      chequeDate,
      amount: amtPaise,
      status: 'OPEN',
      notes,
    });

    // Reset Form
    setPartyId('');
    setChequeNumber('');
    setBankName('');
    setAmountRupees('');
    setNotes('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Cheque Register
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-700 font-semibold">
                  Management
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Track status of received and issued banking cheques (Open, Deposited, Bounced)
              </p>
            </div>
          </div>

          <button
            onClick={closeChequesModal}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Type Tabs */}
        <div className="flex border-b border-slate-100 bg-white px-6 justify-between items-center">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('RECEIVED')}
              className={`py-3.5 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'RECEIVED'
                  ? 'border-cyan-600 text-cyan-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Received Cheques (from Customers)
            </button>
            <button
              onClick={() => setActiveTab('ISSUED')}
              className={`py-3.5 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'ISSUED'
                  ? 'border-cyan-600 text-cyan-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Issued Cheques (to Suppliers)
            </button>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {showAddForm ? 'Cancel' : 'Add Cheque'}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Strip */}
          <div className="p-4 rounded-2xl bg-cyan-50/50 border border-cyan-200 flex items-center justify-between">
            <div className="text-xs text-cyan-800 font-medium">
              Pending / Open Cheques Total:
            </div>
            <div className="text-lg font-bold text-cyan-950">
              {formatINR(openChequesTotal)}
            </div>
          </div>

          {/* Add Form Dropdown */}
          {showAddForm && (
            <form onSubmit={handleCreateCheque} className="p-5 rounded-2xl border border-cyan-200 bg-cyan-50/30 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">
                Record New {activeTab === 'RECEIVED' ? 'Received' : 'Issued'} Cheque
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Party / Payee</label>
                  <select
                    value={partyId}
                    onChange={(e) => setPartyId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    required
                  >
                    <option value="">Select party...</option>
                    {parties
                      .filter((p) => !p.isDeleted)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.phone})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Cheque Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 000123"
                    value={chequeNumber}
                    onChange={(e) => setChequeNumber(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. State Bank of India"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Cheque Date</label>
                  <input
                    type="date"
                    value={chequeDate}
                    onChange={(e) => setChequeDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Amount (₹)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={amountRupees}
                    onChange={(e) => setAmountRupees(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="Optional details"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
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
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 shadow-sm"
                >
                  Save Cheque
                </button>
              </div>
            </form>
          )}

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search cheque #, party, or bank..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
            />
          </div>

          {/* Cheques List Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Cheque Number</th>
                  <th className="py-3 px-4">Party</th>
                  <th className="py-3 px-4">Bank</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCheques.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No {activeTab.toLowerCase()} cheques recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredCheques.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {c.chequeNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{c.partyName}</td>
                      <td className="py-3 px-4 text-slate-600">{c.bankName}</td>
                      <td className="py-3 px-4 text-slate-500">{c.chequeDate}</td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-slate-900 text-sm">
                        {formatINR(c.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'DEPOSITED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : c.status === 'BOUNCED'
                              ? 'bg-rose-100 text-rose-700'
                              : c.status === 'CANCELLED'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {c.status === 'OPEN' && (
                            <>
                              <button
                                onClick={() => updateChequeStatus(c.id, 'DEPOSITED')}
                                className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                              >
                                Cleared
                              </button>
                              <button
                                onClick={() => updateChequeStatus(c.id, 'BOUNCED')}
                                className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                              >
                                Bounced
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => deleteCheque(c.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete cheque"
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
