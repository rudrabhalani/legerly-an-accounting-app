import React, { useState, useEffect } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { getTranslation } from '../../i18n/translations';
import { LanguageCode, FirmSettings, PrintSettings, InvoiceTheme, PaymentTerms } from '../../types';
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
  Users,
  Printer,
  Receipt,
  Percent,
  Bell,
  Package,
  DollarSign,
  ChevronRight,
  ArrowLeft,
  Smartphone,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { exportTransactionsToExcel, shareTransactionsExcel } from '../../services/excelService';
import {
  checkNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  openSystemAppSettings,
  AppNotificationPermission,
} from '../../services/reminderNotificationService';

type SettingsTab =
  | 'GENERAL'
  | 'TRANSACTION'
  | 'INVOICE_PRINT'
  | 'TAXES_GST'
  | 'USER_MANAGEMENT'
  | 'TRANSACTION_SMS'
  | 'REMINDERS'
  | 'PARTY'
  | 'ITEM'
  | 'MULTI_CURRENCY'
  | 'PERMISSIONS';

export const SettingsModal: React.FC = () => {
  const isSettingsOpen = useLedgerlyStore((state) => state.isSettingsOpen);
  const closeSettings = useLedgerlyStore((state) => state.closeSettings);
  const business = useLedgerlyStore((state) => state.business);
  const updateBusiness = useLedgerlyStore((state) => state.updateBusiness);
  const setLanguage = useLedgerlyStore((state) => state.setLanguage);
  const exportBackupJson = useLedgerlyStore((state) => state.exportBackupJson);
  const importBackupJson = useLedgerlyStore((state) => state.importBackupJson);
  const firmSettings = useLedgerlyStore((state) => state.firmSettings);
  const updateFirmSettings = useLedgerlyStore((state) => state.updateFirmSettings);
  const printSettings = useLedgerlyStore((state) => state.printSettings);
  const updatePrintSettings = useLedgerlyStore((state) => state.updatePrintSettings);
  const openRemindersModal = useLedgerlyStore((state) => state.openRemindersModal);
  const openMultiUserModal = useLedgerlyStore((state) => state.openMultiUserModal);
  const openAuthModal = useLedgerlyStore((state) => state.openAuthModal);
  const users = useLedgerlyStore((state) => state.users);
  const transactions = useLedgerlyStore((state) => state.transactions);
  const accounts = useLedgerlyStore((state) => state.accounts);
  const parties = useLedgerlyStore((state) => state.parties);

  const [activeTab, setActiveTab] = useState<SettingsTab>('GENERAL');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // General Form
  const [bizName, setBizName] = useState(business.name || '');
  const [owner, setOwner] = useState(business.ownerName || '');
  const [phone, setPhone] = useState(business.phone || '');
  const [address, setAddress] = useState(business.address || '');

  // Transaction Defaults Form
  const [salePrefix, setSalePrefix] = useState(firmSettings.salePrefix || 'INV');
  const [purchasePrefix, setPurchasePrefix] = useState(firmSettings.purchasePrefix || 'PUR');
  const [enableAdditionalCharges, setEnableAdditionalCharges] = useState(firmSettings.enableAdditionalCharges);
  const [enableTransactionDiscount, setEnableTransactionDiscount] = useState(firmSettings.enableTransactionDiscount);
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState<PaymentTerms>(firmSettings.defaultPaymentTerms || 'IMMEDIATE');

  // Print Form
  const [paperSize, setPaperSize] = useState(printSettings.paperSize || 'A4');
  const [headerText, setHeaderText] = useState(printSettings.headerText || 'TAX INVOICE');
  const [footerText, setFooterText] = useState(printSettings.footerText || '');
  const [showQr, setShowQr] = useState(printSettings.showQr);
  const [showSignature, setShowSignature] = useState(printSettings.showSignature);

  // GST & Tax Form
  const [gstin, setGstin] = useState(business.gstin || '');
  const [taxInclusive, setTaxInclusive] = useState(firmSettings.taxInclusive);

  // SMS / WhatsApp Form
  const [messageTemplate, setMessageTemplate] = useState(
    printSettings.messageTemplate ||
      'Dear {customer_name}, here is your Bill #{bill_no} of ₹{total} from {shop_name}. Balance due: ₹{balance}. Thank you!'
  );
  const [autoShareWhatsApp, setAutoShareWhatsApp] = useState(firmSettings.autoShareWhatsApp);

  // Item Form
  const [enableFreeQty, setEnableFreeQty] = useState(firmSettings.enableFreeQty);

  // Currency
  const [currencySymbol, setCurrencySymbol] = useState('₹');

  // Permission status
  const [permStatus, setPermStatus] = useState<AppNotificationPermission>('prompt');

  useEffect(() => {
    if (isSettingsOpen) {
      checkNotificationPermission().then(setPermStatus);
      setBizName(business.name || '');
      setOwner(business.ownerName || '');
      setPhone(business.phone || '');
      setAddress(business.address || '');
      setGstin(business.gstin || '');
      setSalePrefix(firmSettings.salePrefix || 'INV');
      setPurchasePrefix(firmSettings.purchasePrefix || 'PUR');
      setEnableAdditionalCharges(firmSettings.enableAdditionalCharges);
      setEnableTransactionDiscount(firmSettings.enableTransactionDiscount);
      setDefaultPaymentTerms(firmSettings.defaultPaymentTerms || 'IMMEDIATE');
      setPaperSize(printSettings.paperSize || 'A4');
      setHeaderText(printSettings.headerText || 'TAX INVOICE');
      setFooterText(printSettings.footerText || '');
      setShowQr(printSettings.showQr);
      setShowSignature(printSettings.showSignature);
      setTaxInclusive(firmSettings.taxInclusive);
      setMessageTemplate(printSettings.messageTemplate || '');
      setAutoShareWhatsApp(firmSettings.autoShareWhatsApp);
      setEnableFreeQty(firmSettings.enableFreeQty);
    }
  }, [isSettingsOpen, business, firmSettings, printSettings]);

  if (!isSettingsOpen) return null;

  const triggerSaveNotification = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2500);
  };

  const handleSaveGeneral = () => {
    updateBusiness({
      name: bizName.trim(),
      ownerName: owner.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
    });
    triggerSaveNotification('Business Profile & General Settings saved.');
  };

  const handleSaveTransaction = () => {
    updateFirmSettings({
      salePrefix: salePrefix.trim().toUpperCase() || 'INV',
      purchasePrefix: purchasePrefix.trim().toUpperCase() || 'PUR',
      enableAdditionalCharges,
      enableTransactionDiscount,
      defaultPaymentTerms,
    });
    triggerSaveNotification('Transaction defaults saved.');
  };

  const handleSavePrint = () => {
    updatePrintSettings({
      paperSize,
      headerText: headerText.trim(),
      footerText: footerText.trim(),
      showQr,
      showSignature,
    });
    triggerSaveNotification('Print & Layout settings saved.');
  };

  const handleSaveTaxes = () => {
    updateBusiness({
      gstin: gstin.trim().toUpperCase() || undefined,
    });
    updateFirmSettings({
      taxInclusive,
    });
    triggerSaveNotification('GST & Tax configuration saved.');
  };

  const handleSaveMessaging = () => {
    updatePrintSettings({
      messageTemplate: messageTemplate.trim(),
    });
    updateFirmSettings({
      autoShareWhatsApp,
      reminderMessageTemplate: messageTemplate.trim(),
    });
    triggerSaveNotification('WhatsApp & SMS message templates saved.');
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
    triggerSaveNotification('Offline backup downloaded.');
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

  const navItems = [
    { id: 'GENERAL', label: 'General', icon: Building, desc: 'Shop details, language & backup' },
    { id: 'TRANSACTION', label: 'Transaction', icon: Receipt, desc: 'Prefixes, payment terms & discounts' },
    { id: 'INVOICE_PRINT', label: 'Invoice Print', icon: Printer, desc: 'Paper size, thermal & header text' },
    { id: 'TAXES_GST', label: 'Taxes & GST', icon: Percent, desc: 'GSTIN & tax calculation mode' },
    { id: 'USER_MANAGEMENT', label: 'User Management', icon: Users, desc: 'Roles, PIN lock & permissions' },
    { id: 'TRANSACTION_SMS', label: 'Transaction SMS & WA', icon: MessageCircle, desc: 'Message template & WhatsApp' },
    { id: 'REMINDERS', label: 'Reminders', icon: Bell, desc: 'Follow-ups, due dates & alerts' },
    { id: 'PARTY', label: 'Party', icon: Building, desc: 'Credit limit & balance alerts' },
    { id: 'ITEM', label: 'Item', icon: Package, desc: 'Free quantity & stock thresholds' },
    { id: 'MULTI_CURRENCY', label: 'Multi-Currency', icon: DollarSign, desc: 'Currency symbol & precision' },
    { id: 'PERMISSIONS', label: 'Permissions & System', icon: Shield, desc: 'Notification & storage status' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full h-full sm:h-auto sm:max-h-[90dvh] sm:max-w-4xl bg-white sm:rounded-3xl flex flex-col shadow-2xl border border-border overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-[#161F30] text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
              <SettingsIcon size={18} />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight leading-tight">Settings</h2>
              <p className="text-[11px] text-slate-300 font-medium">
                Configure your business billing, print, and preferences
              </p>
            </div>
          </div>
          <button
            onClick={closeSettings}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Save Toast Banner */}
        {saveToast && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center gap-2 justify-center animate-in fade-in duration-200">
            <CheckCircle2 size={16} />
            <span>{saveToast}</span>
          </div>
        )}

        {/* Master-Detail Split Pane */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Navigation Sidebar (Always visible on desktop, tabbed on mobile) */}
          <div className="w-full md:w-64 border-r border-border bg-slate-50 flex-shrink-0 overflow-y-auto max-h-48 md:max-h-full">
            <div className="p-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id as SettingsTab)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-red-600 text-white font-bold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-200/70 font-semibold text-xs'
                    }`}
                  >
                    <Icon size={16} className={isSelected ? 'text-white' : 'text-slate-500'} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs truncate">{item.label}</div>
                      <div className={`text-[10px] truncate ${isSelected ? 'text-red-100' : 'text-slate-400'}`}>
                        {item.desc}
                      </div>
                    </div>
                    <ChevronRight size={14} className={isSelected ? 'text-white' : 'text-slate-400'} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings Detail Pane */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* 1. GENERAL SETTINGS */}
            {activeTab === 'GENERAL' && (
              <div className="space-y-5">
                <div className="border-b border-border pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">General Settings</h3>
                    <p className="text-xs text-slate-500">Shop name, owner details, language, and backups</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveGeneral}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    <Save size={14} />
                    <span>Save</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Business / Shop Name
                    </label>
                    <input
                      type="text"
                      value={bizName}
                      onChange={(e) => setBizName(e.target.value)}
                      placeholder="e.g. Mahavir Super Store"
                      className="w-full px-3 py-2 rounded-xl border border-border text-xs font-semibold focus:border-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      placeholder="e.g. Ramesh Sharma"
                      className="w-full px-3 py-2 rounded-xl border border-border text-xs font-semibold focus:border-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 rounded-xl border border-border text-xs font-semibold focus:border-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Language
                    </label>
                    <select
                      value={business.language}
                      onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                      className="w-full px-3 py-2 rounded-xl border border-border text-xs font-semibold focus:outline-none"
                    >
                      <option value="en">English (Default)</option>
                      <option value="hi">हिंदी (Hindi)</option>
                      <option value="gu">ગુજરાતી (Gujarati)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Shop Address
                    </label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, City, State, Pincode"
                      className="w-full px-3 py-2 rounded-xl border border-border text-xs font-medium focus:outline-none"
                    />
                  </div>
                </div>

                {/* Backup & Export Section */}
                <div className="pt-4 border-t border-border space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Offline Data Backup & Restore
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                    >
                      <Download size={14} />
                      <span>Download JSON Backup</span>
                    </button>
                    <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer">
                      <Upload size={14} />
                      <span>Restore from JSON</span>
                      <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={() => exportTransactionsToExcel(transactions, accounts, parties)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold"
                    >
                      <FileSpreadsheet size={14} />
                      <span>Export All to Excel</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. TRANSACTION SETTINGS */}
            {activeTab === 'TRANSACTION' && (
              <div className="space-y-5">
                <div className="border-b border-border pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Transaction Defaults</h3>
                    <p className="text-xs text-slate-500">Invoice numbering, discounts, and terms</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveTransaction}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    <Save size={14} />
                    <span>Save</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Sale Invoice Prefix
                    </label>
                    <input
                      type="text"
                      value={salePrefix}
                      onChange={(e) => setSalePrefix(e.target.value)}
                      placeholder="INV"
                      className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Next bill will be: {salePrefix}-1</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Purchase Bill Prefix
                    </label>
                    <input
                      type="text"
                      value={purchasePrefix}
                      onChange={(e) => setPurchasePrefix(e.target.value)}
                      placeholder="PUR"
                      className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Default Payment Terms
                    </label>
                    <select
                      value={defaultPaymentTerms}
                      onChange={(e) => setDefaultPaymentTerms(e.target.value as PaymentTerms)}
                      className="w-full px-3 py-2 rounded-xl border border-border text-xs font-semibold focus:outline-none"
                    >
                      <option value="IMMEDIATE">Immediate (Due on Bill Date)</option>
                      <option value="NET_15">Net 15 Days</option>
                      <option value="NET_30">Net 30 Days</option>
                      <option value="NET_45">Net 45 Days</option>
                      <option value="NET_60">Net 60 Days</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-border">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-border cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Enable Additional Charges</span>
                      <span className="text-[11px] text-slate-500 block">Allow adding shipping, packaging, or delivery fees</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableAdditionalCharges}
                      onChange={(e) => setEnableAdditionalCharges(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-border cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Enable Flat Transaction Discount</span>
                      <span className="text-[11px] text-slate-500 block">Apply bill-level discounts on top of line discounts</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableTransactionDiscount}
                      onChange={(e) => setEnableTransactionDiscount(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 3. INVOICE PRINT SETTINGS */}
            {activeTab === 'INVOICE_PRINT' && (
              <div className="space-y-5">
                <div className="border-b border-border pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Invoice Print & PDF Layout</h3>
                    <p className="text-xs text-slate-500">Page size, thermal printing, and complete box totals</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSavePrint}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    <Save size={14} />
                    <span>Save</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Paper Size / Printer Type
                    </label>
                    <select
                      value={paperSize}
                      onChange={(e) => setPaperSize(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-border text-xs font-semibold focus:outline-none"
                    >
                      <option value="A4">A4 Full Page (Standard)</option>
                      <option value="A5">A5 Half Page</option>
                      <option value="3INCH">3-Inch Thermal Receipt (80mm)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Invoice Heading
                    </label>
                    <input
                      type="text"
                      value={headerText}
                      onChange={(e) => setHeaderText(e.target.value)}
                      placeholder="TAX INVOICE"
                      className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Footer Note / Terms
                    </label>
                    <input
                      type="text"
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      placeholder="Thank you for your business! Goods once sold will not be returned."
                      className="w-full px-3 py-2 rounded-xl border border-border text-xs font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-border">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-border cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">UPI QR Code on Bill</span>
                      <span className="text-[11px] text-slate-500 block">Print dynamic payment QR on bottom of bill for quick UPI scanning</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showQr}
                      onChange={(e) => setShowQr(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-border cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Authorized Signatory Box</span>
                      <span className="text-[11px] text-slate-500 block">Print signature line for owner/manager</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showSignature}
                      onChange={(e) => setShowSignature(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 4. TAXES & GST */}
            {activeTab === 'TAXES_GST' && (
              <div className="space-y-5">
                <div className="border-b border-border pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Taxes & GST Configuration</h3>
                    <p className="text-xs text-slate-500">GSTIN, tax inclusive rates, and compliant reports</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveTaxes}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    <Save size={14} />
                    <span>Save</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Business GSTIN (15 Digits)
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      placeholder="e.g. 24ABCDE1234F1Z5"
                      className="w-full px-3 py-2 rounded-xl border border-border text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-border cursor-pointer w-full">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Rates are Tax Inclusive</span>
                        <span className="text-[10px] text-slate-500 block">Item rates already include GST</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={taxInclusive}
                        onChange={(e) => setTaxInclusive(e.target.checked)}
                        className="w-4 h-4 text-red-600 rounded"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 5. USER MANAGEMENT */}
            {activeTab === 'USER_MANAGEMENT' && (
              <div className="space-y-5">
                <div className="border-b border-border pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">User Management & Security</h3>
                    <p className="text-xs text-slate-500">Staff roles, operator PIN, and access permissions</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      closeSettings();
                      openMultiUserModal();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    <Users size={14} />
                    <span>Manage Staff ({users.length})</span>
                  </button>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">App 4-Digit Security PIN</h4>
                      <p className="text-[11px] text-slate-500">Require PIN to open app or perform deletions</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        closeSettings();
                        openAuthModal();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold"
                    >
                      Configure PIN
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 6. TRANSACTION SMS & WHATSAPP */}
            {activeTab === 'TRANSACTION_SMS' && (
              <div className="space-y-5">
                <div className="border-b border-border pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">WhatsApp & SMS Message Templates</h3>
                    <p className="text-xs text-slate-500">Custom message sent to customer on billing</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveMessaging}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    <Save size={14} />
                    <span>Save</span>
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Invoice Message Template
                    </label>
                    <textarea
                      rows={4}
                      value={messageTemplate}
                      onChange={(e) => setMessageTemplate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border text-xs font-medium focus:outline-none"
                    />
                    <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap gap-2">
                      <span>Available placeholders:</span>
                      <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{'{customer_name}'}</code>
                      <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{'{bill_no}'}</code>
                      <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{'{total}'}</code>
                      <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{'{balance}'}</code>
                      <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{'{shop_name}'}</code>
                    </div>
                  </div>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-border cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Auto-Open WhatsApp on Save</span>
                      <span className="text-[11px] text-slate-500 block">Directly open customer WhatsApp chat when clicking Save & Share</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoShareWhatsApp}
                      onChange={(e) => setAutoShareWhatsApp(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 7. REMINDERS */}
            {activeTab === 'REMINDERS' && (
              <div className="space-y-5">
                <div className="border-b border-border pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Task & Due Reminders</h3>
                    <p className="text-xs text-slate-500">Automated follow-ups for customer balances and cheques</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      closeSettings();
                      openRemindersModal();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    <Bell size={14} />
                    <span>Open Reminders</span>
                  </button>
                </div>

                <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-200 space-y-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        permStatus === 'granted' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <span className="font-bold text-slate-800">
                      System Notifications: {permStatus === 'granted' ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs">
                    Receive timely alerts on your Android device when customer invoices are due or cheques need clearance.
                  </p>
                  <div className="flex gap-2 pt-1">
                    {permStatus !== 'granted' ? (
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await requestNotificationPermission();
                          setPermStatus(res);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                      >
                        Enable Notifications
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          await sendTestNotification();
                          triggerSaveNotification('Test notification triggered!');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs"
                      >
                        Send Test Alert
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 8. PARTY SETTINGS */}
            {activeTab === 'PARTY' && (
              <div className="space-y-5">
                <div className="border-b border-border pb-2">
                  <h3 className="text-sm font-extrabold text-slate-900">Party & Customer Settings</h3>
                  <p className="text-xs text-slate-500">Credit limits, balance alerts, and ledger options</p>
                </div>
                <div className="space-y-3 text-xs">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-border cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Balance Due Warning</span>
                      <span className="text-[11px] text-slate-500 block">Show highlight when a customer has pending unpaid bills</span>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-red-600 rounded" />
                  </label>
                </div>
              </div>
            )}

            {/* 9. ITEM SETTINGS */}
            {activeTab === 'ITEM' && (
              <div className="space-y-5">
                <div className="border-b border-border pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Item & Inventory Settings</h3>
                    <p className="text-xs text-slate-500">Stock tracking, free quantity, and low-stock alerts</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateFirmSettings({ enableFreeQty });
                      triggerSaveNotification('Item settings saved.');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    <Save size={14} />
                    <span>Save</span>
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-border cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Enable Free Quantity Column</span>
                      <span className="text-[11px] text-slate-500 block">E.g. Buy 10 Get 1 Free offers without altering line rate</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableFreeQty}
                      onChange={(e) => setEnableFreeQty(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 10. MULTI-CURRENCY */}
            {activeTab === 'MULTI_CURRENCY' && (
              <div className="space-y-5">
                <div className="border-b border-border pb-2">
                  <h3 className="text-sm font-extrabold text-slate-900">Currency & Formatting</h3>
                  <p className="text-xs text-slate-500">Currency symbol and decimal places</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Currency Symbol
                    </label>
                    <select
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold focus:outline-none"
                    >
                      <option value="₹">₹ (INR - Indian Rupee)</option>
                      <option value="$">$ (USD - US Dollar)</option>
                      <option value="€">€ (EUR - Euro)</option>
                      <option value="£">£ (GBP - British Pound)</option>
                      <option value="AED">AED (UAE Dirham)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Decimal Precision
                    </label>
                    <input
                      type="text"
                      disabled
                      value="2 Decimals (Standard paise precision)"
                      className="w-full px-3 py-2 rounded-xl border border-border text-xs font-semibold bg-slate-100 text-slate-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 11. PERMISSIONS & SYSTEM */}
            {activeTab === 'PERMISSIONS' && (
              <div className="space-y-5">
                <div className="border-b border-border pb-2">
                  <h3 className="text-sm font-extrabold text-slate-900">App Permissions & Hardware Bridges</h3>
                  <p className="text-xs text-slate-500">Android runtime permissions status</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <Bell size={18} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">Notifications (Android 13+)</span>
                        <span className="text-[11px] text-slate-500 block">
                          Status:{' '}
                          <strong className={permStatus === 'granted' ? 'text-emerald-700' : 'text-amber-700'}>
                            {permStatus.toUpperCase()}
                          </strong>
                        </span>
                      </div>
                    </div>
                    {permStatus !== 'granted' ? (
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await requestNotificationPermission();
                          setPermStatus(res);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                      >
                        Grant
                      </button>
                    ) : (
                      <span className="text-emerald-600 font-extrabold text-xs">✓ Active</span>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <FileSpreadsheet size={18} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">Document Sharing & Cache</span>
                        <span className="text-[11px] text-slate-500 block">
                          Uses secure Android FileProvider sandbox (0 broad storage permissions needed)
                        </span>
                      </div>
                    </div>
                    <span className="text-emerald-600 font-extrabold text-xs">✓ Configured</span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={openSystemAppSettings}
                      className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs"
                    >
                      Open Android System App Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
