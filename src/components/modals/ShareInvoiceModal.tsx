import React, { useState } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { ShareFormat } from '../../types';
import { formatINR, paiseToRupees } from '../../utils/formatters';
import {
  shareBillPdfFile,
  generateInvoiceImageFile,
  generateInvoicePdf,
  formatInvoiceMessageTemplate,
} from '../../services/pdfService';
import {
  X,
  FileText,
  Image as ImageIcon,
  Link2,
  MessageCircle,
  Share2,
  Download,
  Loader2,
  CheckCircle2,
  Copy,
} from 'lucide-react';

export const ShareInvoiceModal: React.FC = () => {
  const isOpen = useLedgerlyStore((state) => state.isShareInvoiceModalOpen);
  const invoice = useLedgerlyStore((state) => state.selectedInvoiceForShare);
  const closeShareModal = useLedgerlyStore((state) => state.closeShareInvoiceModal);
  const business = useLedgerlyStore((state) => state.business);
  const parties = useLedgerlyStore((state) => state.parties);
  const accounts = useLedgerlyStore((state) => state.accounts);
  const printSettings = useLedgerlyStore((state) => state.printSettings);

  const [format, setFormat] = useState<ShareFormat>('PDF');
  const [customMessage, setCustomMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !invoice) return null;

  const party = parties.find((p) => p.id === invoice.partyId);
  const defaultBankAcc = accounts.find((a) => a.id === invoice.accountId && a.type === 'BANK') || accounts.find((a) => a.type === 'BANK');

  const defaultTemplate = printSettings?.messageTemplate ||
    'Dear {customer_name}, here is your Bill #{bill_no} of ₹{total} from {shop_name}. Balance due: ₹{balance}. Thank you!';

  const resolvedViewLink = typeof window !== 'undefined'
    ? `${window.location.origin}/?view_invoice=${invoice.id}`
    : `https://legerly-an-accounting-app.vercel.app/?view_invoice=${invoice.id}`;

  const currentPreviewMessage = formatInvoiceMessageTemplate(
    customMessage || defaultTemplate,
    invoice,
    business,
    party,
    format === 'LINK' ? resolvedViewLink : undefined
  );

  const handleShare = async (forceNativeSheet: boolean = false) => {
    setIsProcessing(true);
    setStatusFeedback(null);
    try {
      const res = await shareBillPdfFile({
        invoice,
        business,
        party,
        account: defaultBankAcc,
        format,
        messageTemplate: customMessage || defaultTemplate,
        printSettings,
        viewLink: resolvedViewLink,
      });

      setStatusFeedback(res.message);
      setTimeout(() => {
        setStatusFeedback(null);
        if (res.sharedViaNativeSheet) {
          closeShareModal();
        }
      }, 3500);
    } catch (err: any) {
      alert(`Sharing failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadDirect = async () => {
    setIsProcessing(true);
    try {
      const cleanInvNo = (invoice.number || 'BILL').replace(/[^a-zA-Z0-9.-]/g, '-');
      const cleanCustomer = (party?.name || invoice.partyName || 'Customer').trim().replace(/[^a-zA-Z0-9.-]/g, '-');

      if (format === 'IMAGE') {
        const imgFile = await generateInvoiceImageFile(invoice, business, party, printSettings);
        const url = URL.createObjectURL(imgFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = imgFile.name;
        a.click();
        URL.revokeObjectURL(url);
        setStatusFeedback(`Downloaded ${imgFile.name}`);
      } else {
        const doc = generateInvoicePdf(invoice, business, party, defaultBankAcc, printSettings);
        const fileName = `Invoice-${cleanInvNo}-${cleanCustomer}.pdf`;
        doc.save(fileName);
        setStatusFeedback(`Downloaded ${fileName}`);
      }
      setTimeout(() => setStatusFeedback(null), 3000);
    } catch (err: any) {
      alert(`Download failed: ${err?.message || 'Error generating file'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(resolvedViewLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block">Share Invoice</span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Bill #{invoice.number} &bull; {formatINR(invoice.total)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer: <strong className="text-slate-800">{party?.name || invoice.partyName}</strong>
              {party?.phone ? ` (${party.phone})` : ' (No phone)'}
            </p>
          </div>
          <button
            type="button"
            onClick={closeShareModal}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Format Selector */}
          <div>
            <label className="font-bold text-slate-700 block mb-2">1. Choose Share Format:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormat('PDF')}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 text-center transition-all ${
                  format === 'PDF'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-700 font-bold shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                <FileText size={20} className={format === 'PDF' ? 'text-blue-600' : 'text-slate-400'} />
                <span className="text-xs">PDF File</span>
                <span className="text-[10px] text-slate-500 font-normal">A4 / Thermal</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('IMAGE')}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 text-center transition-all ${
                  format === 'IMAGE'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-700 font-bold shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                <ImageIcon size={20} className={format === 'IMAGE' ? 'text-blue-600' : 'text-slate-400'} />
                <span className="text-xs">Image (JPG)</span>
                <span className="text-[10px] text-slate-500 font-normal">Direct Photo</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('LINK')}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 text-center transition-all ${
                  format === 'LINK'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-700 font-bold shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                <Link2 size={20} className={format === 'LINK' ? 'text-blue-600' : 'text-slate-400'} />
                <span className="text-xs">Public Link</span>
                <span className="text-[10px] text-slate-500 font-normal">View-Only URL</span>
              </button>
            </div>
          </div>

          {/* Link specifics */}
          {format === 'LINK' && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-600 truncate font-mono">{resolvedViewLink}</span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-[11px] font-bold text-slate-700 flex items-center gap-1 hover:bg-slate-50"
              >
                {copiedLink ? <CheckCircle2 size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}

          {/* Message Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700">2. Message Caption / Text:</label>
              <button
                type="button"
                onClick={() => setCustomMessage('')}
                className="text-[11px] text-blue-600 hover:underline font-semibold"
              >
                Reset to Default
              </button>
            </div>
            <textarea
              rows={3}
              value={customMessage || defaultTemplate}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Type your WhatsApp greeting message..."
            />
            <div className="mt-1.5 p-2 rounded-xl bg-emerald-50/60 border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
              <strong className="block text-[10px] uppercase tracking-wider text-emerald-700 mb-0.5">Live Message Preview:</strong>
              {currentPreviewMessage}
            </div>
          </div>

          {/* Feedback banner */}
          {statusFeedback && (
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} className="text-blue-600 flex-shrink-0" />
              <span>{statusFeedback}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2">
          {format !== 'LINK' && (
            <button
              type="button"
              onClick={handleDownloadDirect}
              disabled={isProcessing}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-60"
            >
              <Download size={14} />
              <span>Download {format}</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {format !== 'LINK' && (
              <button
                type="button"
                onClick={() => handleShare(true)}
                disabled={isProcessing}
                className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-60 shadow-xs"
                title="Open native device share sheet"
              >
                <Share2 size={14} />
                <span>Share Sheet</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleShare(false)}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <MessageCircle size={14} />
              )}
              <span>{isProcessing ? 'Generating...' : 'Share on WhatsApp'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
