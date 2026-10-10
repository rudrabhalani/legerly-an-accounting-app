import React, { useState, useMemo } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { calculateDetailedAgeingReport } from '../../utils/accounting';
import { formatINR } from '../../utils/formatters';
import {
  X,
  Search,
  MessageCircle,
  AlertTriangle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

export const AgeingReportModal: React.FC = () => {
  const isAgeingReportModalOpen = useLedgerlyStore((state) => state.isAgeingReportModalOpen);
  const closeAgeingReportModal = useLedgerlyStore((state) => state.closeAgeingReportModal);
  const parties = useLedgerlyStore((state) => state.parties);
  const transactions = useLedgerlyStore((state) => state.transactions);
  const invoices = useLedgerlyStore((state) => state.invoices);
  const business = useLedgerlyStore((state) => state.business);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'RECEIVABLE' | 'PAYABLE'>('ALL');

  const allRows = useMemo(
    () => calculateDetailedAgeingReport(parties, transactions, invoices),
    [parties, transactions, invoices]
  );

  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      if (filterType !== 'ALL' && row.type !== filterType) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          row.partyName.toLowerCase().includes(term) ||
          row.phone.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [allRows, filterType, searchTerm]);

  // Aggregates
  const totalReceivables = useMemo(
    () => allRows.filter((r) => r.type === 'RECEIVABLE').reduce((sum, r) => sum + r.total, 0),
    [allRows]
  );
  const totalPayables = useMemo(
    () => allRows.filter((r) => r.type === 'PAYABLE').reduce((sum, r) => sum + r.total, 0),
    [allRows]
  );
  const totalOverdue90 = useMemo(
    () => allRows.reduce((sum, r) => sum + r.days91plus, 0),
    [allRows]
  );

  if (!isAgeingReportModalOpen) return null;

  const handleSendWhatsAppReminder = (row: typeof allRows[0]) => {
    const cleanPhone = row.phone.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `Dear ${row.partyName}, this is a gentle reminder that an outstanding balance of ${formatINR(row.total)} with ${business.name || 'our shop'} is pending payment. Kindly settle your account at your earliest convenience. Thank you!`;
    const waUrl = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Party Ageing Analysis
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                  Receivables & Payables
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Track overdue debts classified into 0-30, 31-60, 61-90, and 90+ days aging buckets
              </p>
            </div>
          </div>

          <button
            onClick={closeAgeingReportModal}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-6 pb-2">
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700">Total Receivables (Customers Owe)</span>
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-emerald-950 mt-1">
              {formatINR(totalReceivables)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700">Total Payables (You Owe Suppliers)</span>
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl font-bold text-rose-950 mt-1">
              {formatINR(totalPayables)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700">Critical Overdue (&gt; 90 Days)</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-bold text-amber-950 mt-1">
              {formatINR(totalOverdue90)}
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="px-6 py-3 flex flex-col md:flex-row gap-3 items-center justify-between border-b border-slate-100">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by party name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                filterType === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Parties ({allRows.length})
            </button>
            <button
              onClick={() => setFilterType('RECEIVABLE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                filterType === 'RECEIVABLE'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Customers Owe
            </button>
            <button
              onClick={() => setFilterType('PAYABLE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                filterType === 'PAYABLE'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              You Owe
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Party Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">0 - 30 Days</th>
                  <th className="py-3 px-4 text-right">31 - 60 Days</th>
                  <th className="py-3 px-4 text-right">61 - 90 Days</th>
                  <th className="py-3 px-4 text-right">91+ Days</th>
                  <th className="py-3 px-4 text-right">Total Outstanding</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No parties found matching the filter.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{r.partyName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{r.phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.type === 'RECEIVABLE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {r.type === 'RECEIVABLE' ? 'Receivable' : 'Payable'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600 font-mono">
                        {r.current > 0 ? formatINR(r.current) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600 font-mono">
                        {r.days31to60 > 0 ? formatINR(r.days31to60) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-amber-600 font-mono font-semibold">
                        {r.days61to90 > 0 ? formatINR(r.days61to90) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-600 font-mono font-bold">
                        {r.days91plus > 0 ? formatINR(r.days91plus) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-slate-900 text-sm">
                        {formatINR(r.total)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {r.phone && r.type === 'RECEIVABLE' ? (
                          <button
                            onClick={() => handleSendWhatsAppReminder(r)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 inline-flex items-center gap-1 transition-colors"
                            title="Send WhatsApp payment reminder"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            Remind
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
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
