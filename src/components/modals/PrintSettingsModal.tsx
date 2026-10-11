import React, { useState, useMemo } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { PrintSettings, PaperSize, PageOrientation, PrinterType, LanguageCode, InvoiceTheme } from '../../types';
import {
  THEME_LIST,
  renderInvoiceThemeHtml,
  SAMPLE_INVOICE_DATA,
} from '../../services/invoiceThemes';
import {
  X,
  Printer,
  Check,
  Eye,
  Sliders,
  FileText,
  Building,
  SlidersHorizontal,
  QrCode,
  Languages,
  CheckCircle2,
  Palette,
  Sparkles,
  User,
} from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Indigo', hex: '#4F46E5' },
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Crimson Red', hex: '#DC2626' },
  { name: 'Amber Orange', hex: '#D97706' },
  { name: 'Purple', hex: '#7C3AED' },
  { name: 'Slate Black', hex: '#0F172A' },
];

export const PrintSettingsModal: React.FC = () => {
  const isOpen = useLedgerlyStore((state) => state.isPrintSettingsOpen);
  const closePrintSettings = useLedgerlyStore((state) => state.closePrintSettings);
  const printSettings = useLedgerlyStore((state) => state.printSettings);
  const updatePrintSettings = useLedgerlyStore((state) => state.updatePrintSettings);
  const business = useLedgerlyStore((state) => state.business);

  const [activeTab, setActiveTab] = useState<'THEMES' | 'LAYOUT' | 'CONTENT' | 'BRANDING' | 'PRINTER' | 'PREVIEW'>('THEMES');

  const [formData, setFormData] = useState<PrintSettings>({
    ...printSettings,
    shopName: printSettings.shopName || business.name || 'Shree Sweet',
    phone: printSettings.phone || business.phone || '',
    address: printSettings.address || business.address || '',
    gstin: printSettings.gstin || business.gstin || '',
    invoiceTheme: printSettings.invoiceTheme || 'MODERN',
    accentColor: printSettings.accentColor || '#4F46E5',
    showCustomerName: printSettings.showCustomerName !== false,
    showCustomerPhone: printSettings.showCustomerPhone !== false,
    showCustomerAddress: printSettings.showCustomerAddress !== false,
    showBankDetails: printSettings.showBankDetails !== false,
    showTerms: printSettings.showTerms !== false,
  });

  const [savedToast, setSavedToast] = useState(false);

  // Live preview HTML calculated purely using the theme dispatcher
  const previewHtml = useMemo(() => {
    return renderInvoiceThemeHtml({
      invoice: SAMPLE_INVOICE_DATA.invoice,
      settings: formData,
      business: {
        ...SAMPLE_INVOICE_DATA.business,
        name: formData.shopName || SAMPLE_INVOICE_DATA.business.name,
        phone: formData.phone || SAMPLE_INVOICE_DATA.business.phone,
        address: formData.address || SAMPLE_INVOICE_DATA.business.address,
        gstin: formData.gstin || SAMPLE_INVOICE_DATA.business.gstin,
      },
      party: SAMPLE_INVOICE_DATA.party,
      account: SAMPLE_INVOICE_DATA.account,
    });
  }, [formData]);

  if (!isOpen) return null;

  const handleChange = (key: keyof PrintSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updatePrintSettings(formData);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      closePrintSettings();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[94vh] overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Printer size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Invoice Themes & Print Settings
              </h2>
              <p className="text-xs text-slate-500">
                8 Ready-made templates, live preview, color picker, and customer name switch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closePrintSettings}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto text-xs">
          {[
            { id: 'THEMES', label: 'Invoice Themes', icon: Palette },
            { id: 'CONTENT', label: 'Toggles & Customer', icon: SlidersHorizontal },
            { id: 'LAYOUT', label: 'Paper & Layout', icon: FileText },
            { id: 'BRANDING', label: 'Shop Details', icon: Building },
            { id: 'PRINTER', label: 'Printer Hardware', icon: Printer },
            { id: 'PREVIEW', label: 'Full Preview', icon: Eye },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 border-b-2 font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs">
          {/* TAB 1: THEMES GALLERY & LIVE PREVIEW */}
          {activeTab === 'THEMES' && (
            <div className="space-y-6">
              {/* Horizontal Scrollable Gallery of Ready-made Theme Cards */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-800 block text-xs">
                    Ready-made Ready-to-Print Themes (Tap to Select):
                  </label>
                  <span className="text-[11px] text-blue-600 font-bold">
                    Active: {THEME_LIST.find((t) => t.id === formData.invoiceTheme)?.name || 'Modern'}
                  </span>
                </div>

                <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {THEME_LIST.map((th) => {
                    const isSelected = (formData.invoiceTheme || 'MODERN') === th.id;
                    return (
                      <div
                        key={th.id}
                        onClick={() => handleChange('invoiceTheme', th.id as InvoiceTheme)}
                        className={`min-w-[210px] sm:min-w-[240px] max-w-[240px] p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full inline-block border border-black/10"
                              style={{ backgroundColor: th.defaultColor }}
                            />
                            <div className="flex items-center gap-1">
                              {th.badge && (
                                <span className="px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-800 font-bold text-[9px]">
                                  {th.badge}
                                </span>
                              )}
                              {isSelected && (
                                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                  ✓
                                </span>
                              )}
                            </div>
                          </div>

                          <h4 className="font-bold text-xs text-slate-900 leading-tight">
                            {th.name}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1 leading-snug line-clamp-2">
                            {th.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">{th.category}</span>
                          <span
                            className={`font-bold ${
                              isSelected ? 'text-blue-700' : 'text-slate-600'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Use Theme'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Theme Customization Controls */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <span className="font-bold text-slate-800 block text-xs">
                  Theme Customization Options:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Accent Color Picker */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Accent Color:</label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {PRESET_COLORS.map((col) => (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() => handleChange('accentColor', col.hex)}
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${
                            formData.accentColor === col.hex ? 'scale-125 border-slate-900' : 'border-white'
                          }`}
                          style={{ backgroundColor: col.hex }}
                          title={col.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Font Size */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Typography / Font Size:</label>
                    <select
                      value={formData.fontSize || 'medium'}
                      onChange={(e) => handleChange('fontSize', e.target.value as any)}
                      className="w-full p-2 rounded-xl border border-slate-300 bg-white font-medium"
                    >
                      <option value="small">Compact (Small)</option>
                      <option value="medium">Standard (Medium)</option>
                      <option value="large">Spacious (Large)</option>
                    </select>
                  </div>

                  {/* Paper Size */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Paper Format:</label>
                    <select
                      value={formData.paperSize || 'A4'}
                      onChange={(e) => handleChange('paperSize', e.target.value as any)}
                      className="w-full p-2 rounded-xl border border-slate-300 bg-white font-medium"
                    >
                      <option value="A4">A4 Full Page</option>
                      <option value="A5">A5 Half Sheet</option>
                      <option value="58mm">58mm Thermal Receipt (2-inch)</option>
                      <option value="80mm">80mm Thermal Receipt (3-inch)</option>
                    </select>
                  </div>
                </div>

                {/* Customer Name Switcher (PART 3) */}
                <div className="pt-2 border-t border-slate-200/80">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <User size={16} />
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-slate-900 block">
                          Show Customer Name on Invoice
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          When OFF, customer name is completely removed without gaps or "undefined"
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.showCustomerName !== false}
                      onChange={(e) => handleChange('showCustomerName', e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>

              {/* Live Interactive Preview Container */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 block text-xs">
                    Live Interactive Preview (Sample Invoice Data):
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Renders 1:1 identical to print and PDF share
                  </span>
                </div>

                <div className="w-full bg-slate-100 rounded-2xl p-2 sm:p-4 border border-slate-300 overflow-hidden shadow-inner">
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-3xl mx-auto border border-slate-200">
                    <iframe
                      title="Invoice Live Preview"
                      srcDoc={previewHtml}
                      className="w-full h-[480px] border-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TOGGLES & CONTENT (Including Customer Name) */}
          {activeTab === 'CONTENT' && (
            <div className="space-y-4 max-w-xl">
              <span className="font-bold text-slate-800 block">Show or Hide Invoice Elements:</span>

              <div className="space-y-2">
                {/* 1. Customer Name Toggle (Primary Highlight) */}
                <label className="flex items-start gap-3 p-3.5 rounded-2xl border-2 border-blue-500/30 bg-blue-50/30 hover:bg-blue-50/50 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={formData.showCustomerName !== false}
                    onChange={(e) => handleChange('showCustomerName', e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold text-xs text-blue-900 block">
                      Show Customer Name (Billed To)
                    </span>
                    <span className="text-[11px] text-blue-700/80">
                      Toggle ON/OFF. When disabled, customer name is cleanly removed across all 8 themes without empty whitespace or "undefined" text.
                    </span>
                  </div>
                </label>

                {[
                  { key: 'showCustomerPhone', label: 'Customer Phone Number', desc: 'Display customer mobile number under party details' },
                  { key: 'showCustomerAddress', label: 'Customer Billing Address', desc: 'Display full customer address on the bill' },
                  { key: 'showQr', label: 'UPI Payment QR Code', desc: 'Allows customer to scan and pay directly via GPay, PhonePe, Paytm' },
                  { key: 'showTax', label: 'Tax / GST Breakdown', desc: 'Shows CGST, SGST, IGST columns and totals summary' },
                  { key: 'showDiscount', label: 'Discount Column & Total', desc: 'Displays line-level discount percentage and total saved' },
                  { key: 'showHsn', label: 'HSN / SAC Code Column', desc: 'Displays product classification code for GST compliance' },
                  { key: 'showSignature', label: 'Authorized Signatory Line', desc: 'Shows business signature box at the bottom right' },
                  { key: 'showBalanceDue', label: 'Balance Due / Outstanding Row', desc: 'Displays unpaid amount and customer balance clearly' },
                  { key: 'showBankDetails', label: 'Bank Account & IFSC Box', desc: 'Prints bank name, account number, IFSC, and UPI ID' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={(formData as any)[item.key] !== false}
                      onChange={(e) => handleChange(item.key as any, e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">{item.label}</span>
                      <span className="text-[11px] text-slate-500">{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PAPER & LAYOUT */}
          {activeTab === 'LAYOUT' && (
            <div className="space-y-5 max-w-xl">
              <div>
                <label className="font-bold text-slate-800 block mb-2">Paper Format / Size:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'A4', title: 'A4 Standard', desc: 'Full page (210mm)' },
                    { id: 'A5', title: 'A5 Half Page', desc: 'Half sheet (148mm)' },
                    { id: '58mm', title: '58mm Thermal', desc: '2-inch POS Roll' },
                    { id: '80mm', title: '80mm Thermal', desc: '3-inch POS Roll' },
                  ].map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => handleChange('paperSize', size.id as PaperSize)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all ${
                        formData.paperSize === size.id
                          ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="block text-xs font-bold leading-tight">{size.title}</span>
                      <span className="block text-[10px] text-slate-500 font-normal mt-0.5">{size.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {formData.paperSize !== '58mm' && formData.paperSize !== '80mm' && (
                <div>
                  <label className="font-bold text-slate-800 block mb-2">Orientation:</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 'portrait', title: 'Portrait (Standard)' },
                      { id: 'landscape', title: 'Landscape (Wide)' },
                    ].map((ori) => (
                      <button
                        key={ori.id}
                        type="button"
                        onClick={() => handleChange('orientation', ori.id as PageOrientation)}
                        className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                          formData.orientation === ori.id
                            ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        {ori.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1.5">Page Margins (mm):</label>
                  <select
                    value={formData.margins}
                    onChange={(e) => handleChange('margins', parseInt(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value={5}>Compact (5 mm)</option>
                    <option value={10}>Standard (10 mm)</option>
                    <option value={15}>Wide (15 mm)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1.5">Default Copies:</label>
                  <select
                    value={formData.copies}
                    onChange={(e) => handleChange('copies', parseInt(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value={1}>1 Copy (Original)</option>
                    <option value={2}>2 Copies (Buyer + Seller)</option>
                    <option value={3}>3 Copies (Buyer + Transporter + Seller)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SHOP BRANDING */}
          {activeTab === 'BRANDING' && (
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Shop / Business Name:</label>
                <input
                  type="text"
                  value={formData.shopName}
                  onChange={(e) => handleChange('shopName', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  placeholder="e.g. Shree Sweet"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Phone / Mobile:</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                    placeholder="e.g. 9876543210"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">GSTIN (Optional):</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => handleChange('gstin', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium uppercase"
                    placeholder="e.g. 24ABCDE1234F1Z5"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Shop Address:</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  placeholder="Shop address shown on the bill"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Bill Header Title:</label>
                <input
                  type="text"
                  value={formData.headerText}
                  onChange={(e) => handleChange('headerText', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium uppercase"
                  placeholder="e.g. TAX INVOICE"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Footer / Terms & Conditions:</label>
                <textarea
                  rows={2}
                  value={formData.footerText}
                  onChange={(e) => handleChange('footerText', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  placeholder="e.g. Thank you for your business! Goods once sold will not be taken back."
                />
              </div>
            </div>
          )}

          {/* TAB 5: PRINTER HARDWARE */}
          {activeTab === 'PRINTER' && (
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="font-bold text-slate-800 block mb-2">Select Printer Connection:</label>
                <div className="space-y-2">
                  {[
                    { id: 'BROWSER', title: 'System Default Printer / Browser Print', desc: 'Standard print dialog (AirPrint, Windows Print, Cloud Print)' },
                    { id: 'BLUETOOTH', title: 'Bluetooth Thermal POS Printer', desc: 'Direct wireless printing to 58mm/80mm Bluetooth receipt printers' },
                    { id: 'USB', title: 'USB POS Receipt Printer', desc: 'Direct wired connection via WebUSB or OTG cable' },
                  ].map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        formData.printerType === p.id
                          ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="printerType"
                        checked={formData.printerType === p.id}
                        onChange={() => handleChange('printerType', p.id as PrinterType)}
                        className="mt-0.5 text-blue-600"
                      />
                      <div>
                        <span className="font-bold text-xs block">{p.title}</span>
                        <span className="text-[11px] text-slate-500">{p.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: FULL SCREEN PREVIEW */}
          {activeTab === 'PREVIEW' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 text-xs">
                  Full Template Preview for Theme: <strong className="text-blue-600">{formData.invoiceTheme}</strong>
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-2xl p-4 border border-slate-300 overflow-hidden">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-4xl mx-auto border border-slate-200">
                  <iframe
                    title="Invoice Preview Full"
                    srcDoc={previewHtml}
                    className="w-full h-[600px] border-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          {savedToast ? (
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs animate-in fade-in">
              <CheckCircle2 size={16} />
              <span>Theme & Settings Saved Successfully!</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">Settings apply to print preview, downloads, and WhatsApp shares.</span>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closePrintSettings}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 font-bold text-xs text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Check size={16} />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
