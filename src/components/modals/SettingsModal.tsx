import React, { useState } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { getTranslation } from '../../i18n/translations';
import { LanguageCode } from '../../types';
import {
  Settings as SettingsIcon,
  X,
  Globe,
  Lock,
  Download,
  Upload,
  RotateCcw,
  MessageCircle,
  Building,
  Check,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';
import { exportTransactionsToExcel } from '../../services/excelService';

export const SettingsModal: React.FC = () => {
  const isSettingsOpen = useLedgerlyStore((state) => state.isSettingsOpen);
  const closeSettings = useLedgerlyStore((state) => state.closeSettings);
  const business = useLedgerlyStore((state) => state.business);
  const updateBusiness = useLedgerlyStore((state) => state.updateBusiness);
  const setLanguage = useLedgerlyStore((state) => state.setLanguage);
  const resetToDemoData = useLedgerlyStore((state) => state.resetToDemoData);
  const exportBackupJson = useLedgerlyStore((state) => state.exportBackupJson);
  const importBackupJson = useLedgerlyStore((state) => state.importBackupJson);
  const transactions = useLedgerlyStore((state) => state.transactions);
  const accounts = useLedgerlyStore((state) => state.accounts);
  const parties = useLedgerlyStore((state) => state.parties);

  const t = getTranslation(business.language);

  // Profile form state
  const [bizName, setBizName] = useState(business.name);
  const [owner, setOwner] = useState(business.ownerName);
  const [phone, setPhone] = useState(business.phone);
  const [gstin, setGstin] = useState(business.gstin || '');
  const [address, setAddress] = useState(business.address || '');
  const [pinCode, setPinCode] = useState(business.pinCode || '1234');
  const [pinEnabled, setPinEnabled] = useState(business.pinEnabled);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isSettingsOpen) return null;

  const handleSaveProfile = () => {
    updateBusiness({
      name: bizName.trim(),
      ownerName: owner.trim(),
      phone: phone.trim(),
      gstin: gstin.trim().toUpperCase() || undefined,
      address: address.trim() || undefined,
      pinCode: pinCode.trim(),
      pinEnabled,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExportBackup = () => {
    const jsonStr = exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledgerly_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importBackupJson(content);
        if (ok) {
          alert('Backup restored successfully!');
        } else {
          alert('Invalid backup file.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-floating border border-border animate-in slide-in-from-bottom-5 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-subtle rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-700 text-white flex items-center justify-center">
              <SettingsIcon size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-primary">Settings & Preferences</h3>
              <p className="text-xs text-slate-secondary">Business profile, backup, security & language</p>
            </div>
          </div>
          <button type="button" onClick={closeSettings} className="p-1.5 rounded-full hover:bg-slate-200/50 text-slate-secondary">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-6 flex-1">
          {/* 1. Language Selection */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-secondary flex items-center gap-1.5">
              <Globe size={14} className="text-primary" /> App Language
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'en' as LanguageCode, label: 'English' },
                { code: 'hi' as LanguageCode, label: 'हिन्दी (Hindi)' },
                { code: 'gu' as LanguageCode, label: 'ગુજરાતી (Gujarati)' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                    business.language === lang.code
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface-subtle text-slate-primary border-border hover:border-slate-muted'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Business Profile Form */}
          <div className="space-y-3 p-4 rounded-2xl bg-surface-subtle border border-border">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-primary flex items-center gap-1.5">
              <Building size={14} className="text-primary" /> Business Details
            </span>

            <div>
              <label className="block text-[11px] font-semibold text-slate-secondary mb-1">Business Name</label>
              <input
                type="text"
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-border text-xs font-bold text-slate-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-secondary mb-1">Owner Name</label>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-border text-xs text-slate-primary focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-secondary mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-border text-xs text-slate-primary focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-secondary mb-1">GSTIN</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-border text-xs text-slate-primary focus:outline-none focus:border-primary uppercase"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-secondary mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-border text-xs text-slate-primary focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveProfile}
              className="w-full h-10 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all mt-2"
            >
              <Check size={14} />
              <span>{savedSuccess ? 'Saved Successfully!' : 'Save Business Details'}</span>
            </button>
          </div>

          {/* 3. PIN Lock & Security */}
          <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-primary" />
                <div>
                  <span className="text-xs font-bold text-slate-primary block">App PIN Lock</span>
                  <span className="text-[11px] text-slate-secondary">Require PIN when opening app</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={pinEnabled}
                onChange={(e) => setPinEnabled(e.target.checked)}
                className="w-5 h-5 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
              />
            </div>

            {pinEnabled && (
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-xs text-slate-secondary">4-Digit Security PIN:</span>
                <input
                  type="password"
                  maxLength={4}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-24 px-3 py-1.5 rounded-lg bg-white border border-border text-center font-mono font-bold tracking-widest text-sm"
                />
              </div>
            )}
          </div>

          {/* 4. Data Export & Backup */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-secondary block">
              Data Backup & Excel Export
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="p-3 rounded-2xl bg-surface-subtle hover:bg-slate-200/60 border border-border flex flex-col items-center justify-center text-center gap-1 text-xs font-bold text-slate-primary transition-all active:scale-95"
              >
                <Download size={18} className="text-primary" />
                <span>Export JSON Backup</span>
              </button>

              <label className="p-3 rounded-2xl bg-surface-subtle hover:bg-slate-200/60 border border-border flex flex-col items-center justify-center text-center gap-1 text-xs font-bold text-slate-primary transition-all active:scale-95 cursor-pointer">
                <Upload size={18} className="text-primary" />
                <span>Restore JSON Backup</span>
                <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
              </label>
            </div>

            <button
              type="button"
              onClick={() => exportTransactionsToExcel(transactions, accounts, parties)}
              className="w-full p-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center gap-2 text-xs font-bold text-emerald-800 transition-all active:scale-98"
            >
              <FileSpreadsheet size={16} />
              <span>Export Full Transactions to Excel (.xlsx)</span>
            </button>
          </div>

          {/* 5. Support & Reset */}
          <div className="pt-2 border-t border-border space-y-2">
            <button
              type="button"
              onClick={() => window.open('https://wa.me/919876543210?text=Hi%20Ledgerly%20Support', '_blank')}
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <MessageCircle size={16} />
              <span>Contact Support on WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('Reset all demo data back to default sample store?')) {
                  resetToDemoData();
                  alert('Reset completed.');
                }
              }}
              className="w-full h-10 rounded-xl bg-surface-subtle hover:bg-rose-50 border border-border hover:border-rose-200 text-rose-600 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <RotateCcw size={14} />
              <span>Reset to Sample Demo Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
