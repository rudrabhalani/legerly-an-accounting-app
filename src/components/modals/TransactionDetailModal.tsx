import React, { useState } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import {
  formatINR,
  formatFullDate,
  formatTime,
  formatQuantity,
  paiseToRupees,
} from '../../utils/formatters';
import { calculatePartyNetBalance } from '../../utils/accounting';
import { generateInvoicePdf, generatePartyStatementPdf, shareBillPdfFile } from '../../services/pdfService';
import {
  X,
  Printer,
  Download,
  Share2,
  Edit,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  Building2,
  Layers,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';

export const TransactionDetailModal: React.FC = () => {
  const isTransactionDetailOpen = useLedgerlyStore((state) => state.isTransactionDetailOpen);
  const selectedTransaction = useLedgerlyStore((state) => state.selectedTransactionForDetail);
  const selectedInvoice = useLedgerlyStore((state) => state.selectedInvoiceForDetail);
  const closeTransactionDetail = useLedgerlyStore((state) => state.closeTransactionDetail);
  const parties = useLedgerlyStore((state) => state.parties);
  const accounts = useLedgerlyStore((state) => state.accounts);
  const transactions = useLedgerlyStore((state) => state.transactions);
  const invoices = useLedgerlyStore((state) => state.invoices);
  const business = useLedgerlyStore((state) => state.business);
  const openInvoiceScreen = useLedgerlyStore((state) => state.openInvoiceScreen);
  const openPaymentIn = useLedgerlyStore((state) => state.openPaymentIn);
  const openPaymentOut = useLedgerlyStore((state) => state.openPaymentOut);
  const deleteInvoice = useLedgerlyStore((state) => state.deleteInvoice);
  const deleteTransaction = useLedgerlyStore((state) => state.deleteTransaction);

  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isTransactionDetailOpen) return null;

  const inv = selectedInvoice;
  const txn = selectedTransaction;

  // Determine primary party
  const partyId = inv?.partyId || txn?.partyId;
  const party = partyId ? parties.find((p) => p.id === partyId) : undefined;

  // Determine account
  const accountId = inv?.accountId || txn?.accountId;
  const account = accountId ? accounts.find((a) => a.id === accountId) : undefined;

  // Calculate party net balance
  const partyNetBalance = party ? calculatePartyNetBalance(party, transactions, invoices) : null;

  // Transaction classification
  const isSale = inv?.type === 'SALE' || (!inv && txn?.type === 'IN');
  const isPurchase = inv?.type === 'PURCHASE' || (!inv && txn?.type === 'OUT');
  const isExpense = !inv && txn?.type === 'OUT' && !txn?.partyId;

  // Colored border theme: Green for positive / received, Red for paid / expense, Blue for transfer / general
  const themeBorderClass = isSale
    ? 'border-2 border-emerald-500'
    : isPurchase || isExpense
    ? 'border-2 border-rose-500'
    : 'border-2 border-blue-500';

  const themeIconClass = isSale
    ? 'border border-emerald-400 bg-white text-emerald-600'
    : isPurchase || isExpense
    ? 'border border-rose-400 bg-white text-rose-600'
    : 'border border-blue-400 bg-white text-blue-600';

  // Format type title
  const getDisplayTitle = () => {
    if (inv) {
      switch (inv.type) {
        case 'SALE':
          return 'Sale Invoice';
        case 'PURCHASE':
          return 'Purchase Bill';
        case 'SALE_RETURN':
          return 'Sale Return (Credit Note)';
        case 'PURCHASE_RETURN':
          return 'Purchase Return (Debit Note)';
        default:
          return 'Tax Invoice';
      }
    }
    if (txn) {
      if (txn.type === 'IN') return 'Payment In';
      if (txn.type === 'OUT') return txn.partyId ? 'Payment Out' : 'Business Expense';
      return 'Account Transfer';
    }
    return 'Transaction Details';
  };

  // Actions: PDF View/Print
  const handlePrintOrViewPdf = () => {
    try {
      if (inv) {
        const doc = generateInvoicePdf(inv, business, party, account);
        const blobUrl = doc.output('bloburl');
        window.open(blobUrl, '_blank');
      } else if (party) {
        const doc = generatePartyStatementPdf(party, [], business);
        const blobUrl = doc.output('bloburl');
        window.open(blobUrl, '_blank');
      } else {
        window.print();
      }
    } catch (err) {
      alert('Could not preview PDF. Please use Download PDF instead.');
    }
  };

  // Actions: Download PDF
  const handleDownloadPdf = () => {
    try {
      if (inv) {
        const doc = generateInvoicePdf(inv, business, party, account);
        const fileName = `${inv.number.replace(/[\/\\]/g, '_')}.pdf`;
        doc.save(fileName);
        setShareSuccess(`Downloaded ${fileName}`);
        setTimeout(() => setShareSuccess(null), 3000);
      } else if (party) {
        const doc = generatePartyStatementPdf(party, [], business);
        const fileName = `${party.name.replace(/\s+/g, '_')}_statement.pdf`;
        doc.save(fileName);
        setShareSuccess(`Downloaded ${fileName}`);
        setTimeout(() => setShareSuccess(null), 3000);
      } else {
        alert('PDF download is available for tax invoices and party statements.');
      }
    } catch (err) {
      alert('Error generating PDF download.');
    }
  };

  // Actions: Direct WhatsApp Sharing (actual generated PDF file attached)
  const handleShareOnWhatsApp = async () => {
    try {
      if (inv) {
        const res = await shareBillPdfFile({
          invoice: inv,
          business,
          party,
          account,
        });
        setShareSuccess(res.message);
        setTimeout(() => setShareSuccess(null), 3500);
      } else if (txn) {
        const doc = party ? generatePartyStatementPdf(party, [], business) : null;
        const fileName = `RECEIPT-${txn.id.substring(4, 12)}.pdf`;
        if (doc) {
          doc.save(fileName);
          const pdfBlob = doc.output('blob');
          const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf', lastModified: Date.now() });
          const text = `Payment receipt from ${business.name}: ₹${paiseToRupees(txn.amount).toFixed(2)} on ${txn.date} via ${txn.mode}`;
          if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
            try {
              await navigator.share({
                files: [pdfFile],
                title: fileName,
                text,
              });
              setShareSuccess('Receipt PDF shared!');
              setTimeout(() => setShareSuccess(null), 3000);
              return;
            } catch (err: any) {
              if (err?.name === 'AbortError') return;
            }
          }
        }
        alert('File saved, please attach it in WhatsApp');
      }
    } catch (err) {
      alert('Error preparing WhatsApp document share. Please try downloading the PDF directly.');
    }
  };

  // Actions: Edit Transaction
  const handleEdit = () => {
    closeTransactionDetail();
    if (inv) {
      const mode = (['SALE', 'PURCHASE', 'SALE_RETURN', 'PURCHASE_RETURN'] as const).find(
        (m) => m === inv.type
      ) || 'SALE';
      openInvoiceScreen(mode, inv);
    } else if (txn) {
      if (txn.type === 'IN') {
        openPaymentIn(txn.partyId);
      } else if (txn.type === 'OUT') {
        openPaymentOut(txn.partyId);
      }
    }
  };

  // Actions: Delete Transaction with Confirmation
  const handleDelete = () => {
    if (inv) {
      const res = deleteInvoice(inv.id);
      if (res.success) {
        setShowDeleteConfirm(false);
        closeTransactionDetail();
      } else {
        alert(res.error || 'Failed to delete invoice');
      }
    } else if (txn) {
      deleteTransaction(txn.id);
      setShowDeleteConfirm(false);
      closeTransactionDetail();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={closeTransactionDetail}
    >
      <div
        className={`w-full max-w-2xl bg-white rounded-3xl shadow-floating ${themeBorderClass} flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-200 overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${themeIconClass}`}>
              {isSale ? (
                <ArrowDownLeft size={22} strokeWidth={2.5} />
              ) : (
                <ArrowUpRight size={22} strokeWidth={2.5} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {getDisplayTitle()}
                </h2>
                {inv && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border ${
                      inv.status === 'PAID'
                        ? 'border-emerald-500 text-emerald-700'
                        : inv.status === 'PARTIAL'
                        ? 'border-amber-500 text-amber-700'
                        : 'border-rose-500 text-rose-700'
                    }`}
                  >
                    {inv.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {inv ? `Invoice No: ${inv.number}` : txn?.category || 'Recorded Entry'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeTransactionDetail}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* NOTIFICATION FEEDBACK */}
        {shareSuccess && (
          <div className="bg-white border-b border-emerald-400 px-4 py-2 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{shareSuccess}</span>
          </div>
        )}

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white">
          {/* PARTY & BASIC METADATA CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Party Card */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1.5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {isSale ? 'Customer / Billed To' : 'Supplier / Vendor'}
              </span>
              <div className="flex items-center gap-2">
                <User size={16} className="text-blue-600 flex-shrink-0" />
                <span className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  {party?.name || inv?.partyName || 'Cash Customer / Direct'}
                </span>
              </div>
              {party?.phone && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Phone size={13} className="text-slate-400" />
                  <span>+91 {party.phone}</span>
                </div>
              )}
              {party?.address && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <MapPin size={13} className="text-slate-400" />
                  <span className="truncate">{party.address}</span>
                </div>
              )}
              {party?.gstin && (
                <div className="text-xs text-slate-500">
                  <span>GSTIN: </span>
                  <span className="font-mono font-semibold text-slate-800">{party.gstin}</span>
                </div>
              )}
              {partyNetBalance !== null && (
                <div className="pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">Current Party Balance: </span>
                  <span
                    className={`font-bold ${
                      partyNetBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {partyNetBalance >= 0 ? "You'll get " : "You'll give "}
                    {formatINR(Math.abs(partyNetBalance))}
                  </span>
                </div>
              )}
            </div>

            {/* Date & Account Metadata Card */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Transaction Details
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Date</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    <Calendar size={13} className="text-blue-600" />
                    {formatFullDate(inv?.date || txn?.date || '')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Time</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    <Clock size={13} className="text-blue-600" />
                    {formatTime(txn?.time || '12:00')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Payment Mode</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    <CreditCard size={13} className="text-blue-600" />
                    {inv?.paymentType || txn?.mode || 'CASH'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Account</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    <Building2 size={13} className="text-blue-600" />
                    {account ? account.nickname : 'Cash in Hand'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ITEMIZED ROWS (IF INVOICE) */}
          {inv && inv.lines && inv.lines.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers size={16} className="text-blue-600" />
                  <span>Items & Services ({inv.lines.length})</span>
                </h3>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white shadow-xs">
                {inv.lines.map((line, idx) => (
                  <div
                    key={line.id || idx}
                    className="p-3 flex items-start justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg font-bold text-slate-900">
                          {line.itemName}
                        </span>
                        {line.itemType && (
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                            {line.itemType}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                        <span>
                          Qty: <strong className="text-slate-900">{formatQuantity(line.qty)}</strong> {line.unit}
                        </span>
                        <span>•</span>
                        <span>
                          Rate: <strong className="text-slate-900">₹{paiseToRupees(line.rate).toFixed(2)}</strong>
                        </span>
                        {line.discountPercent > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-rose-600 font-semibold">
                              Disc: {line.discountPercent}%
                            </span>
                          </>
                        )}
                        {inv.withGst && line.taxPercent > 0 && (
                          <>
                            <span>•</span>
                            <span>GST: {line.taxPercent}%</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-sm sm:text-base font-bold text-slate-900 tabular-nums block">
                        {formatINR(line.amount)}
                      </span>
                      {inv.withGst && line.taxableAmount && (
                        <span className="text-[11px] text-slate-400">
                          Taxable: {formatINR(line.taxableAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FINANCIAL SUMMARY TOTALS */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Financial Breakdown
            </span>

            {inv ? (
              <>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatINR(inv.subtotal)}</span>
                </div>

                {inv.discountTotal > 0 && (
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Discount</span>
                    <span className="font-semibold text-rose-600">−{formatINR(inv.discountTotal)}</span>
                  </div>
                )}

                {inv.withGst && (
                  <>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Taxable Amount</span>
                      <span className="font-semibold text-slate-900">{formatINR(inv.taxableAmount || 0)}</span>
                    </div>
                    {inv.igstTotal && inv.igstTotal > 0 ? (
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>IGST</span>
                        <span className="font-semibold text-slate-900">+{formatINR(inv.igstTotal)}</span>
                      </div>
                    ) : (
                      <>
                        {inv.cgstTotal && inv.cgstTotal > 0 && (
                          <div className="flex justify-between text-xs text-slate-600">
                            <span>CGST</span>
                            <span className="font-semibold text-slate-900">+{formatINR(inv.cgstTotal)}</span>
                          </div>
                        )}
                        {inv.sgstTotal && inv.sgstTotal > 0 && (
                          <div className="flex justify-between text-xs text-slate-600">
                            <span>SGST</span>
                            <span className="font-semibold text-slate-900">+{formatINR(inv.sgstTotal)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {inv.extraCharges && inv.extraCharges > 0 && (
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Additional Charges</span>
                    <span className="font-semibold text-slate-900">+{formatINR(inv.extraCharges)}</span>
                  </div>
                )}

                {inv.roundOff !== 0 && (
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Round Off</span>
                    <span className="font-semibold text-slate-900">
                      {inv.roundOff > 0 ? '+' : '−'}
                      {formatINR(Math.abs(inv.roundOff))}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Grand Total</span>
                  <span className="text-xl font-bold text-slate-900 tabular-nums">{formatINR(inv.total)}</span>
                </div>

                <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-600">Amount Settled</span>
                  <span className="font-bold text-emerald-700">{formatINR(inv.paidAmount)}</span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-bold">Remaining Balance Due</span>
                  <span
                    className={`font-bold ${
                      inv.total - inv.paidAmount > 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {formatINR(Math.max(0, inv.total - inv.paidAmount))}
                  </span>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Recorded Amount</span>
                  <span
                    className={`text-xl font-bold tabular-nums ${
                      isSale ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {formatINR(txn?.amount || 0)}
                  </span>
                </div>
                {txn?.note && (
                  <div className="text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span>Note: {txn.note}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2">
          {/* Left: View, Download, WhatsApp */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrintOrViewPdf}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
              title="Print or view formatted PDF"
            >
              <Printer size={15} />
              <span>Print / View</span>
            </button>

            {inv && (
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                title="Download PDF directly to device"
              >
                <Download size={15} />
                <span>Download PDF</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleShareOnWhatsApp}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-900 bg-white border-2 border-emerald-500 hover:bg-emerald-50/50 flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
              title="Share PDF bill directly via WhatsApp"
            >
              <MessageCircle size={15} className="text-emerald-600" />
              <span>Share on WhatsApp</span>
            </button>
          </div>

          {/* Right: Edit, Delete, Close */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEdit}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 bg-white border-2 border-blue-500 hover:bg-blue-50/50 flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
            >
              <Edit size={14} className="text-blue-600" />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-white border-2 border-rose-500 hover:bg-rose-50/50 flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
              title="Delete this transaction"
            >
              <Trash2 size={14} className="text-rose-600" />
              <span>Delete</span>
            </button>

            <button
              type="button"
              onClick={closeTransactionDetail}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
            >
              Close
            </button>
          </div>
        </div>

        {/* DELETE CONFIRMATION MODAL */}
        {showDeleteConfirm && (
          <div
            className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div
              className="w-full max-w-sm bg-white rounded-2xl border-2 border-rose-500 p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2.5 text-rose-600">
                <AlertCircle size={22} />
                <h3 className="text-base font-bold text-slate-900">Delete Transaction?</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to delete this {inv ? inv.type.toLowerCase() : 'transaction'}?
                This action will update your database, reverse account balances, and restore physical stock.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-1.5 rounded-xl bg-white border-2 border-rose-600 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all active:scale-95"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
