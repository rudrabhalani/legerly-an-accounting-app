import React, { useState } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { getFinancialYearLabel, getAvailableFinancialYears } from '../../utils/financialYear';
import { X, Calendar, ArrowRight, Trash2, Download, AlertTriangle, Check, Shield } from 'lucide-react';

export const FinancialYearModal: React.FC = () => {
  const isFinancialYearModalOpen = useLedgerlyStore((state) => state.isFinancialYearModalOpen);
  const closeFinancialYearModal = useLedgerlyStore((state) => state.closeFinancialYearModal);
  const activeFY = useLedgerlyStore((state) => state.activeFinancialYear);
  const financialYears = useLedgerlyStore((state) => state.financialYears);
  const setActiveFinancialYear = useLedgerlyStore((state) => state.setActiveFinancialYear);
  const startNewFinancialYear = useLedgerlyStore((state) => state.startNewFinancialYear);
  const deleteFinancialYear = useLedgerlyStore((state) => state.deleteFinancialYear);
  const business = useLedgerlyStore((state) => state.business);
  const exportBackupJson = useLedgerlyStore((state) => state.exportBackupJson);
  const currentUser = useLedgerlyStore((state) => state.getCurrentUser());

  const isOwner = currentUser?.role === 'OWNER';

  // State for starting a new year
  const [selectedNewFY, setSelectedNewFY] = useState('');
  const [rolloverMessage, setRolloverMessage] = useState<string | null>(null);

  // State for deleting a year
  const [isDeleting, setIsDeleting] = useState(false);
  const [fyToDelete, setFyToDelete] = useState('');
  const [confirmNameInput, setConfirmNameInput] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [downloadedBackup, setDownloadedBackup] = useState(false);

  if (!isFinancialYearModalOpen) return null;

  const availableYears = getAvailableFinancialYears();
  const nextYears = availableYears.filter((y) => !financialYears.includes(y));

  const handleStartNewYear = () => {
    if (!selectedNewFY) {
      alert('Please select a financial year to start.');
      return;
    }

    const res = startNewFinancialYear(selectedNewFY);
    if (res.success) {
      setRolloverMessage(res.message);
      setTimeout(() => {
        setRolloverMessage(null);
        closeFinancialYearModal();
      }, 2500);
    } else {
      alert(res.message);
    }
  };

  const handleDownloadBackup = () => {
    const json = exportBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledgerly-backup-before-deleting-${fyToDelete}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadedBackup(true);
  };

  const handleConfirmDelete = () => {
    setDeleteError(null);
    if (!fyToDelete) return;

    const res = deleteFinancialYear(fyToDelete, confirmNameInput);
    if (res.success) {
      alert(`Financial year ${fyToDelete} deleted.`);
      setIsDeleting(false);
      setFyToDelete('');
      setConfirmNameInput('');
      closeFinancialYearModal();
    } else {
      setDeleteError(res.error || 'Failed to delete financial year.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-floating border border-border animate-in fade-in zoom-in-95 duration-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center">
              <Calendar size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-primary">Financial Year Management</h3>
              <p className="text-xs text-slate-secondary">Indian Financial Year (April 1 to March 31)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeFinancialYearModal}
            className="w-8 h-8 rounded-full hover:bg-surface-subtle text-slate-secondary flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {rolloverMessage && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <Check size={16} className="text-emerald-600 flex-shrink-0" />
            <span>{rolloverMessage}</span>
          </div>
        )}

        {/* 1. SWITCH CURRENT FINANCIAL YEAR */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-secondary">
            Active Financial Year
          </label>
          <div className="space-y-1.5">
            {financialYears.map((fy) => (
              <div
                key={fy}
                onClick={() => setActiveFinancialYear(fy)}
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  activeFY === fy
                    ? 'bg-primary-light border-primary/40 shadow-xs'
                    : 'bg-white border-border hover:bg-surface-subtle'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      activeFY === fy ? 'bg-primary ring-4 ring-primary/20' : 'bg-slate-300'
                    }`}
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-primary block">
                      {getFinancialYearLabel(fy)}
                    </span>
                    <span className="text-[11px] text-slate-secondary">
                      {activeFY === fy ? 'Currently Active' : 'Click to Switch'}
                    </span>
                  </div>
                </div>

                {isOwner && financialYears.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFyToDelete(fy);
                      setIsDeleting(true);
                      setConfirmNameInput('');
                      setDownloadedBackup(false);
                      setDeleteError(null);
                    }}
                    className="p-1.5 rounded-lg text-slate-muted hover:text-rose-600 hover:bg-rose-50"
                    title="Delete this year"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 2. START NEW YEAR (APRIL TO MARCH) */}
        {!isDeleting && (
          <div className="pt-3 border-t border-border space-y-3">
            <div>
              <h4 className="text-sm font-bold text-slate-primary">Start New Year (April to March)</h4>
              <p className="text-xs text-slate-secondary">
                Carries forward all cash, bank, stock, and party closing balances as new opening balances.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedNewFY}
                onChange={(e) => setSelectedNewFY(e.target.value)}
                className="flex-1 h-11 px-3 rounded-xl border border-border bg-white text-xs font-semibold text-slate-primary"
              >
                <option value="">Select Next Financial Year</option>
                {nextYears.map((ny) => (
                  <option key={ny} value={ny}>
                    {getFinancialYearLabel(ny)}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleStartNewYear}
                disabled={!selectedNewFY}
                className="h-11 px-4 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
              >
                <span>Rollover</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* 3. OWNER YEAR DELETION SECTION */}
        {isDeleting && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="text-rose-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-xs font-bold text-rose-900">
                  Delete Financial Year: {fyToDelete}?
                </h4>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  This will permanently delete all invoices, bills, and transactions recorded under FY{' '}
                  {fyToDelete}. This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Offer backup export first */}
            <div className="p-3 bg-white rounded-xl border border-rose-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-primary block">
                  Export Backup Before Deleting
                </span>
                <span className="text-[10px] text-slate-secondary">
                  Recommended: Save full backup to avoid data loss
                </span>
              </div>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all ${
                  downloadedBackup
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-indigo-50 text-primary border-indigo-200'
                }`}
              >
                {downloadedBackup ? <Check size={14} /> : <Download size={14} />}
                <span>{downloadedBackup ? 'Backup Saved' : 'Download Backup'}</span>
              </button>
            </div>

            {/* Confirm by typing business name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-rose-900">
                To confirm, type your business name: <span className="font-extrabold select-all">"{business.name}"</span>
              </label>
              <input
                type="text"
                value={confirmNameInput}
                onChange={(e) => setConfirmNameInput(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-rose-300 bg-white text-xs font-bold text-slate-primary"
                placeholder={business.name}
              />
            </div>

            {deleteError && (
              <span className="text-xs text-rose-600 font-bold block">{deleteError}</span>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsDeleting(false);
                  setFyToDelete('');
                }}
                className="px-3 py-2 rounded-xl border border-border bg-white text-xs font-bold text-slate-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={confirmNameInput.trim().toLowerCase() !== business.name.trim().toLowerCase()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <Trash2 size={14} />
                <span>Permanently Delete Year</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
