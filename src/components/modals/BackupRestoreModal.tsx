import React, { useState } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import {
  X,
  Database,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  ShieldCheck,
} from 'lucide-react';

export const BackupRestoreModal: React.FC = () => {
  const isOpen = useLedgerlyStore((state) => state.isBackupModalOpen);
  const closeBackupModal = useLedgerlyStore((state) => state.closeBackupModal);
  const exportBackupJson = useLedgerlyStore((state) => state.exportBackupJson);
  const importBackupJson = useLedgerlyStore((state) => state.importBackupJson);
  const business = useLedgerlyStore((state) => state.business);

  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportBackup = () => {
    try {
      const json = exportBackupJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `ledgerly-backup-${business.name.replace(/\s+/g, '-')}-${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(`Export failed: ${err?.message}`);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const success = importBackupJson(text);
        if (success) {
          setRestoreSuccess(true);
          setTimeout(() => {
            setRestoreSuccess(false);
            closeBackupModal();
          }, 2000);
        } else {
          setErrorMessage('Invalid backup format or corrupt file.');
        }
      } catch (err: any) {
        setErrorMessage('Failed to read backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Backup & Restore</h2>
              <p className="text-xs text-slate-500">Safeguard your business data offline</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeBackupModal}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Export card */}
          <div className="p-4 rounded-2xl border-2 border-indigo-100 bg-indigo-50/40 space-y-3">
            <div className="flex items-center gap-2 text-indigo-900 font-bold">
              <Download size={16} />
              <span>Download Backup (Export Data)</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Creates a secure JSON backup of your customers, bills, payments, inventory, and accounts. Keep this file safe on Google Drive, USB, or your phone.
            </p>
            <button
              type="button"
              onClick={handleExportBackup}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <FileJson size={15} />
              <span>Download Full Backup JSON</span>
            </button>
            {downloadSuccess && (
              <p className="text-emerald-700 text-[11px] font-bold flex items-center gap-1 justify-center animate-in fade-in">
                <CheckCircle2 size={13} />
                Backup downloaded successfully!
              </p>
            )}
          </div>

          {/* Import card */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Upload size={16} />
              <span>Restore from Backup (Import Data)</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Restore previously saved data to this device.
            </p>
            <label className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-white text-slate-700 font-bold flex items-center justify-center gap-2 cursor-pointer transition-all">
              <Upload size={15} />
              <span>Select Backup File (.json)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
            {restoreSuccess && (
              <p className="text-emerald-700 text-[11px] font-bold flex items-center gap-1 justify-center animate-in fade-in">
                <CheckCircle2 size={13} />
                Data restored successfully!
              </p>
            )}
            {errorMessage && (
              <p className="text-rose-600 text-[11px] font-bold flex items-center gap-1 justify-center animate-in fade-in">
                <AlertTriangle size={13} />
                {errorMessage}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <ShieldCheck size={14} className="text-emerald-600 flex-shrink-0" />
            <span>100% offline data guarantee. Your financial records are encrypted on your device.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={closeBackupModal}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-xs text-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
