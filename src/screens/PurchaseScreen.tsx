import React, { useState } from 'react';
import { useLedgerlyStore } from '../store/useLedgerlyStore';
import { PurchaseEntry, PurchaseEntryType } from '../types';
import { formatINR } from '../utils/formatters';
import { sharePurchaseVoucher } from '../services/purchaseVoucherService';
import {
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Plus,
  Search,
  Filter,
  Share2,
  Printer,
  Trash2,
  Edit2,
  Settings,
  X,
  Check,
  Calendar,
  Building,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

export const PurchaseScreen: React.FC = () => {
  const purchases = useLedgerlyStore((state) => state.purchases);
  const openPurchaseModal = useLedgerlyStore((state) => state.openPurchaseModal);
  const deletePurchaseEntry = useLedgerlyStore((state) => state.deletePurchaseEntry);
  const purchaseSettings = useLedgerlyStore((state) => state.purchaseSettings);
  const updatePurchaseSettings = useLedgerlyStore((state) => state.updatePurchaseSettings);
  const business = useLedgerlyStore((state) => state.business);
  const parties = useLedgerlyStore((state) => state.parties);

  const [dateFilter, setDateFilter] = useState<'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL'>('THIS_MONTH');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | PurchaseEntryType>('ALL');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Settings form state
  const [defaultPaymentMode, setDefaultPaymentMode] = useState(purchaseSettings.defaultPaymentMode || 'CASH');
  const [enableItemDetailsByDefault, setEnableItemDetailsByDefault] = useState(purchaseSettings.enableItemDetailsByDefault || false);
  const [autoRoundOff, setAutoRoundOff] = useState(purchaseSettings.autoRoundOff !== false);

  // Date Filtering Helper
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const filteredPurchases = purchases.filter((p) => {
    // 1. Type Filter
    if (typeFilter !== 'ALL' && p.type !== typeFilter) return false;

    // 2. Date Filter
    if (dateFilter === 'TODAY') {
      if (p.date !== todayStr) return false;
    } else if (dateFilter === 'THIS_WEEK') {
      const pDate = new Date(p.date);
      const diffDays = (now.getTime() - pDate.getTime()) / (1000 * 3600 * 24);
      if (diffDays > 7 || diffDays < -1) return false;
    } else if (dateFilter === 'THIS_MONTH') {
      const pMonth = p.date.slice(0, 7);
      const currMonth = todayStr.slice(0, 7);
      if (pMonth !== currMonth) return false;
    }

    // 3. Search Term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const sName = (p.supplierName || p.partyName || '').toLowerCase();
      const matchName = sName.includes(q);
      const matchVoucher = p.voucherNumber.toLowerCase().includes(q);
      const matchAmount = (p.amount / 100).toString().includes(q);
      return matchName || matchVoucher || matchAmount;
    }

    return true;
  });

  // Calculate Totals
  const totalPurchaseIn = filteredPurchases
    .filter((p) => p.type === 'PURCHASE_IN')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPurchaseOut = filteredPurchases
    .filter((p) => p.type === 'PURCHASE_OUT')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalDebitNotes = filteredPurchases
    .filter((p) => p.type === 'DEBIT_NOTE')
    .reduce((sum, p) => sum + p.amount, 0);

  const netPurchases = totalPurchaseIn - totalPurchaseOut - totalDebitNotes;

  const handleSaveSettings = () => {
    updatePurchaseSettings({
      defaultPaymentMode,
      enableItemDetailsByDefault,
      autoRoundOff,
    });
    setIsSettingsOpen(false);
  };

  const handleDelete = (id: string, voucherNo: string) => {
    if (confirm(`Are you sure you want to delete purchase voucher #${voucherNo}?`)) {
      deletePurchaseEntry(id);
    }
  };

  const handleShare = async (p: PurchaseEntry) => {
    const partyObj = parties.find((party) => party.id === p.supplierId);
    await sharePurchaseVoucher(p, business, partyObj, true);
  };

  const handlePrint = (p: PurchaseEntry) => {
    const partyObj = parties.find((party) => party.id === p.supplierId);
    sharePurchaseVoucher(p, business, partyObj, false);
  };

  return (
    <div className="space-y-4 pb-28 pt-2 max-w-7xl mx-auto">
      {/* 1. TOP HEADER & SETTINGS BUTTON */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Purchase Management
          </h1>
          <p className="text-xs text-slate-500">
            Record supplier purchases, returns, and debit notes with auto balance tracking
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
          title="Purchase Settings"
        >
          <Settings size={16} />
          <span className="hidden sm:inline">Purchase Settings</span>
        </button>
      </div>

      {/* 2. TOP TOTALS SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Purchase In */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Purchase In</span>
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowDownLeft size={14} />
            </div>
          </div>
          <div className="text-base sm:text-xl font-black text-blue-700">
            {formatINR(totalPurchaseIn)}
          </div>
          <span className="text-[10px] text-slate-400">Total goods bought</span>
        </div>

        {/* Total Purchase Out (Return) */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Purchase Return</span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ArrowUpRight size={14} />
            </div>
          </div>
          <div className="text-base sm:text-xl font-black text-amber-600">
            {formatINR(totalPurchaseOut)}
          </div>
          <span className="text-[10px] text-slate-400">Returned to supplier</span>
        </div>

        {/* Total Debit Notes */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Debit Notes</span>
            <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText size={14} />
            </div>
          </div>
          <div className="text-base sm:text-xl font-black text-purple-700">
            {formatINR(totalDebitNotes)}
          </div>
          <span className="text-[10px] text-slate-400">Supplier balance rebates</span>
        </div>

        {/* Net Purchases */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Net Purchases</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={14} />
            </div>
          </div>
          <div className="text-base sm:text-xl font-black text-slate-900">
            {formatINR(Math.max(0, netPurchases))}
          </div>
          <span className="text-[10px] text-slate-400">In - Out - Debit Notes</span>
        </div>
      </div>

      {/* 3. THREE BIG FRIENDLY ACTION BUTTONS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => openPurchaseModal('PURCHASE_IN')}
          className="p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition-all"
        >
          <ArrowDownLeft size={18} />
          <span>+ Purchase In</span>
        </button>

        <button
          type="button"
          onClick={() => openPurchaseModal('PURCHASE_OUT')}
          className="p-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition-all"
        >
          <ArrowUpRight size={18} />
          <span>+ Purchase Out (Return)</span>
        </button>

        <button
          type="button"
          onClick={() => openPurchaseModal('DEBIT_NOTE')}
          className="p-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition-all"
        >
          <FileText size={18} />
          <span>+ Debit Note</span>
        </button>
      </div>

      {/* 4. FILTER PILLS & SEARCH BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Date Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs font-bold">
            {[
              { id: 'TODAY', label: 'Today' },
              { id: 'THIS_WEEK', label: 'This Week' },
              { id: 'THIS_MONTH', label: 'This Month' },
              { id: 'ALL', label: 'All Time' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setDateFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  dateFilter === f.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs font-bold">
            {[
              { id: 'ALL', label: 'All Types' },
              { id: 'PURCHASE_IN', label: 'In' },
              { id: 'PURCHASE_OUT', label: 'Out / Return' },
              { id: 'DEBIT_NOTE', label: 'Debit Notes' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeFilter(t.id as any)}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  typeFilter === t.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Field */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by supplier name, voucher #, or amount..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* 5. VOUCHERS LIST */}
      <div className="space-y-2.5">
        {filteredPurchases.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">No Purchase Entries Found</h3>
              <p className="text-xs text-slate-400 mt-1">
                Tap "+ Purchase In" above to record your first supplier bill.
              </p>
            </div>
          </div>
        ) : (
          filteredPurchases.map((p) => {
            const isReturn = p.type === 'PURCHASE_OUT';
            const isDebitNote = p.type === 'DEBIT_NOTE';

            return (
              <div
                key={p.id}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left: Voucher details */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white ${
                      isDebitNote
                        ? 'bg-purple-600'
                        : isReturn
                        ? 'bg-amber-600'
                        : 'bg-blue-600'
                    }`}
                  >
                    {isDebitNote ? (
                      <FileText size={18} />
                    ) : isReturn ? (
                      <ArrowUpRight size={18} />
                    ) : (
                      <ArrowDownLeft size={18} />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm sm:text-base text-slate-900">
                        {p.supplierName || p.partyName || 'Supplier'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          isDebitNote
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : isReturn
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {isDebitNote ? 'DEBIT NOTE' : isReturn ? 'RETURN' : 'PURCHASE IN'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                      <span>#{p.voucherNumber}</span>
                      <span>•</span>
                      <span>{p.date}</span>
                      <span>•</span>
                      <span className="font-bold text-slate-700">{p.paymentMode}</span>
                      {p.items && p.items.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600">{p.items.length} items</span>
                        </>
                      )}
                    </div>

                    {p.note && (
                      <p className="text-[11px] text-slate-400 italic mt-1 line-clamp-1">
                        Note: {p.note}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Amount & Action buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="sm:text-right">
                    <div
                      className={`text-base sm:text-lg font-black ${
                        isDebitNote
                          ? 'text-purple-700'
                          : isReturn
                          ? 'text-amber-600'
                          : 'text-blue-700'
                      }`}
                    >
                      {formatINR(p.amount)}
                    </div>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {p.paymentMode === 'CREDIT' ? 'On Credit (Udhar)' : 'Paid'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleShare(p)}
                      className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all"
                      title="Share PDF via WhatsApp"
                    >
                      <Share2 size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePrint(p)}
                      className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                      title="Download / Print PDF"
                    >
                      <Printer size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => openPurchaseModal(p.type, p)}
                      className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all"
                      title="Edit Voucher"
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(p.id, p.voucherNumber)}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all"
                      title="Delete Voucher"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 6. SIMPLE 3-FIELD SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">Purchase Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Field 1: Default Payment Mode */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  1. Default Payment Mode for Purchases:
                </label>
                <select
                  value={defaultPaymentMode}
                  onChange={(e) => setDefaultPaymentMode(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                >
                  <option value="CASH">Cash</option>
                  <option value="CREDIT">Credit (Unpaid)</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK">Bank Transfer</option>
                </select>
              </div>

              {/* Field 2: Enable Item Details by Default */}
              <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-900 block">2. Show Item Details by Default</span>
                  <span className="text-[11px] text-slate-500">Automatically expand item rows on new entry</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableItemDetailsByDefault}
                  onChange={(e) => setEnableItemDetailsByDefault(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              {/* Field 3: Auto-Round Off */}
              <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-900 block">3. Auto-Round Off Amounts</span>
                  <span className="text-[11px] text-slate-500">Round fractional paise to nearest rupee</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoRoundOff}
                  onChange={(e) => setAutoRoundOff(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
              >
                <Check size={14} />
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
