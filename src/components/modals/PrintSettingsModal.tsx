import React, { useState } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { PrintSettings, PaperSize, PageOrientation, PrinterType, LanguageCode } from '../../types';
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
} from 'lucide-react';

export const PrintSettingsModal: React.FC = () => {
  const isOpen = useLedgerlyStore((state) => state.isPrintSettingsOpen);
  const closePrintSettings = useLedgerlyStore((state) => state.closePrintSettings);
  const printSettings = useLedgerlyStore((state) => state.printSettings);
  const updatePrintSettings = useLedgerlyStore((state) => state.updatePrintSettings);
  const business = useLedgerlyStore((state) => state.business);

  const [activeTab, setActiveTab] = useState<'LAYOUT' | 'CONTENT' | 'BRANDING' | 'PRINTER' | 'PREVIEW'>('LAYOUT');

  const [formData, setFormData] = useState<PrintSettings>({
    ...printSettings,
    shopName: printSettings.shopName || business.name || 'Shree Sweet',
    phone: printSettings.phone || business.phone || '',
    address: printSettings.address || business.address || '',
    gstin: printSettings.gstin || business.gstin || '',
  });

  const [savedToast, setSavedToast] = useState(false);

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
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[94vh] overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Printer size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">Print & PDF Settings</h2>
              <p className="text-xs text-slate-500">Configure Paper Size, Thermal Receipts, Toggles & Live Preview</p>
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
            { id: 'LAYOUT', label: 'Paper & Layout', icon: FileText },
            { id: 'CONTENT', label: 'Toggles & Columns', icon: SlidersHorizontal },
            { id: 'BRANDING', label: 'Shop & Header/Footer', icon: Building },
            { id: 'PRINTER', label: 'Printer Hardware', icon: Printer },
            { id: 'PREVIEW', label: 'Live Preview', icon: Eye },
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
          {/* TAB 1: Paper & Layout */}
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
                  <label className="font-bold text-slate-800 block mb-1.5">Default Number of Copies:</label>
                  <select
                    value={formData.copies}
                    onChange={(e) => handleChange('copies', parseInt(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value={1}>1 Copy (Original for Buyer)</option>
                    <option value={2}>2 Copies (Original + Duplicate)</option>
                    <option value={3}>3 Copies (Buyer + Transporter + Seller)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Default Language:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'en', label: 'English' },
                    { id: 'hi', label: 'Hindi (हिंदी)' },
                    { id: 'gu', label: 'Gujarati (ગુજરાતી)' },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => handleChange('language', lang.id as LanguageCode)}
                      className={`p-2 rounded-xl border-2 text-center transition-all ${
                        formData.language === lang.id
                          ? 'border-blue-600 bg-blue-50 font-bold text-blue-900'
                          : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Toggles & Columns */}
          {activeTab === 'CONTENT' && (
            <div className="space-y-4 max-w-xl">
              <span className="font-bold text-slate-800 block">Show or Hide Invoice Elements:</span>

              <div className="space-y-2">
                {[
                  { key: 'showQr', label: 'UPI Payment QR Code', desc: 'Allows customer to scan and pay directly via GPay, PhonePe, Paytm' },
                  { key: 'showTax', label: 'Tax / GST Breakdown', desc: 'Shows CGST, SGST, IGST columns and totals summary' },
                  { key: 'showDiscount', label: 'Discount Column & Total', desc: 'Displays line-level discount percentage and total saved' },
                  { key: 'showHsn', label: 'HSN / SAC Code Column', desc: 'Displays product classification code for GST compliance' },
                  { key: 'showSignature', label: 'Authorized Signatory Line', desc: 'Shows business signature box at the bottom right' },
                  { key: 'showBalanceDue', label: 'Balance Due / Outstanding Row', desc: 'Displays unpaid amount and customer balance clearly' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={(formData as any)[item.key]}
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

          {/* TAB 3: Branding & Headers/Footers */}
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
                  placeholder="e.g. TAX INVOICE / CASH MEMO"
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

              <div>
                <label className="font-bold text-slate-800 block mb-1">WhatsApp Share Message Template:</label>
                <textarea
                  rows={2}
                  value={formData.messageTemplate}
                  onChange={(e) => handleChange('messageTemplate', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono text-[11px]"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Placeholders: {'{customer_name}, {bill_no}, {total}, {shop_name}, {balance}, {link}'}
                </span>
              </div>
            </div>
          )}

          {/* TAB 4: Printer Hardware */}
          {activeTab === 'PRINTER' && (
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="font-bold text-slate-800 block mb-2">Select Printer Connection:</label>
                <div className="space-y-2">
                  {[
                    { id: 'BROWSER', title: 'System Default Printer / Browser Print', desc: 'Uses standard print dialog (AirPrint, Windows Print, Cloud Print)' },
                    { id: 'BLUETOOTH', title: 'Bluetooth Thermal POS Printer', desc: 'Direct wireless printing to 58mm/80mm Bluetooth ESC/POS receipt printers' },
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

              {formData.printerType !== 'BROWSER' && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-xs text-slate-800 block">Printer Device Status:</span>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 text-[11px]">Selected: {formData.selectedPrinterName || 'Not Paired'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        handleChange('selectedPrinterName', 'BT-POS-58 (Paired)');
                        alert('Bluetooth printer paired successfully.');
                      }}
                      className="px-3 py-1 rounded-xl bg-blue-600 text-white font-bold text-xs"
                    >
                      Scan & Connect
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Live Preview */}
          {activeTab === 'PREVIEW' && (
            <div className="space-y-4">
              <span className="font-bold text-slate-700 block">
                Interactive Preview for format: <strong className="text-blue-600">{formData.paperSize}</strong>
              </span>

              <div className="max-w-md mx-auto p-5 rounded-2xl bg-white border border-slate-300 shadow-md space-y-3 font-sans">
                {/* Header */}
                <div className="text-center pb-2 border-b border-slate-200">
                  <h3 className="font-extrabold text-base text-slate-900">{formData.shopName}</h3>
                  {formData.address && <p className="text-[10px] text-slate-500">{formData.address}</p>}
                  <p className="text-[10px] text-slate-500">Tel: +91 {formData.phone || '9876543210'}</p>
                  {formData.gstin && <p className="text-[10px] font-bold text-blue-700">GSTIN: {formData.gstin}</p>}
                </div>

                <div className="flex justify-between text-[11px] text-slate-700 font-semibold">
                  <span>{formData.headerText || 'TAX INVOICE'}</span>
                  <span>#BILL/2627/001</span>
                </div>

                {/* Sample items table */}
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 font-bold text-slate-600">
                      <th className="text-left py-1">Item</th>
                      <th className="text-center py-1">Qty</th>
                      <th className="text-right py-1">Rate</th>
                      <th className="text-right py-1">Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-1">Kaju Katli Special</td>
                      <td className="text-center py-1">10 kg</td>
                      <td className="text-right py-1">₹1,147</td>
                      <td className="text-right py-1 font-bold">₹11,470</td>
                    </tr>
                  </tbody>
                </table>

                {/* Totals */}
                <div className="pt-2 border-t border-slate-200 space-y-1 text-right text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal:</span>
                    <span className="font-semibold">₹11,470.00</span>
                  </div>
                  {formData.showTax && (
                    <div className="flex justify-between text-blue-600">
                      <span>GST (5%):</span>
                      <span>₹573.50</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span>₹11,470.00</span>
                  </div>
                  {formData.showBalanceDue && (
                    <div className="flex justify-between font-bold text-emerald-600">
                      <span>Balance Due:</span>
                      <span>₹0.00</span>
                    </div>
                  )}
                </div>

                {/* QR Code */}
                {formData.showQr && (
                  <div className="text-center pt-2 border-t border-slate-100">
                    <div className="w-20 h-20 mx-auto bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-center">
                      <QrCode size={38} className="text-slate-700" />
                    </div>
                    <span className="text-[9px] text-slate-400 block mt-1">Scan to Pay via UPI</span>
                  </div>
                )}

                {/* Footer text */}
                <p className="text-[10px] text-center text-slate-400 italic pt-1">
                  {formData.footerText}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          {savedToast ? (
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs animate-in fade-in">
              <CheckCircle2 size={16} />
              <span>Settings Saved Successfully!</span>
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
