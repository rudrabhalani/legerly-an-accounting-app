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
import { generateInvoicePdf, generatePartyStatementPdf } from '../../services/pdfService';
import {
  X,
  Printer,
  Download,
  Share2,
  Edit,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  Building2,
  Receipt,
  Layers,
  CheckCircle2,
  Clock3,
  AlertCircle,
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

  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

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
  const isReturn = inv?.type === 'SALE_RETURN' || inv?.type === 'PURCHASE_RETURN';
  const isExpense = !inv && txn?.type === 'OUT' && !txn?.partyId;

  // Border theme based on Money In (blue) vs Money Out (red)
  const themeBorderClass = isSale
    ? 'border-blue-500'
    : isPurchase || isExpense
    ? 'border-rose-500'
    : 'border-slate-300';

  const themeBadgeClass = isSale
    ? 'text-blue-700 bg-blue-50 border border-blue-200'
    : 'text-rose-700 bg-rose-50 border border-rose-200';

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
          return 'Invoice';
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
  };

  // Actions: Download PDF
  const handleDownloadPdf = () => {
    if (inv) {
      const doc = generateInvoicePdf(inv, business, party, account);
      const fileName = `${inv.number.replace(/[\/\\]/g, '_')}.pdf`;
      doc.save(fileName);
    } else {
      alert('PDF download is available for tax invoices and party statements.');
    }
  };

  // Actions: Direct Share PDF (no links sent!)
  const handleDirectShare = async () => {
    if (inv) {
      const doc = generateInvoicePdf(inv, business, party, account);
      const fileName = `${inv.number.replace(/[\/\\]/g, '_')}.pdf`;
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: `${inv.number}.pdf`,
          });
          setShareSuccess('PDF shared directly via your device!');
          setTimeout(() => setShareSuccess(null), 3000);
          return;
        } catch (err: any) {
          if (err?.name === 'AbortError') return;
        }
      }

      // Fallback: direct download file and open WhatsApp with clean message
      doc.save(fileName);
      const phoneNum = party?.phone ? party.phone.replace(/\D/g, '') : '';
      const text = encodeURIComponent(
        `Hello ${inv.partyName},\nHere are your bill details from ${business.name}:\n` +
          `Invoice: ${inv.number}\nDate: ${inv.date}\nTotal: ₹${paiseToRupees(inv.total).toFixed(2)}\n` +
          `Paid: ₹${paiseToRupees(inv.paidAmount).toFixed(2)}\nBalance Due: ₹${paiseToRupees(
            Math.max(0, inv.total - inv.paidAmount)
          ).toFixed(2)}\n\n(PDF file has been downloaded to attach directly).`
      );
      if (phoneNum) {
        window.open(`https://wa.me/91${phoneNum}?text=${text}`, '_blank');
      } else {
        window.open(`https://wa.me/?text=${text}`, '_blank');
      }
      setShareSuccess(`PDF downloaded directly (${fileName}).`);
      setTimeout(() => setShareSuccess(null), 4000);
    } else if (txn) {
      const phoneNum = party?.phone ? party.phone.replace(/\D/g, '') : '';
      const text = encodeURIComponent(
        `Payment receipt from ${business.name}:\n` +
          `Amount: ₹${paiseToRupees(txn.amount).toFixed(2)}\nDate: ${txn.date}\nMode: ${txn.mode}`
      );
      if (phoneNum) {
        window.open(`https://wa.me/91${phoneNum}?text=${text}`, '_blank');
      } else {
        window.open(`https://wa.me/?text=${text}`, '_blank');
      }
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={closeTransactionDetail}
    >
      <div
        className={`w-full max-w-2xl bg-white rounded-3xl shadow-floating border ${themeBorderClass} flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-200 overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP HEADER */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                isSale
                  ? 'border-blue-200 bg-blue-50 text-blue-600'
                  : 'border-rose-200 bg-rose-50 text-rose-600'
              }`}
            >
              {isSale ? (
                <ArrowDownLeft size={22} strokeWidth={2.5} />
              ) : (
                <ArrowUpRight size={22} strokeWidth={2.5} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-primary">
                  {getDisplayTitle()}
                </h2>
                {inv && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : inv.status === 'PARTIAL'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {inv.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-secondary">
                {inv ? `Invoice No: ${inv.number}` : txn?.category || 'Recorded Entry'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeTransactionDetail}
            className="p-2 rounded-xl text-slate-secondary hover:text-slate-primary hover:bg-surface-subtle transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* NOTIFICATION FEEDBACK */}
        {shareSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{shareSuccess}</span>
          </div>
        )}

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-white">
          {/* PARTY & BASIC METADATA CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Party Card */}
            <div className="p-3.5 rounded-2xl bg-white border border-border space-y-1.5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-secondary uppercase tracking-wider block">
                {isSale ? 'Customer / Billed To' : 'Supplier / Vendor'}
              </span>
              <div className="flex items-center gap-2">
                <User size={16} className="text-primary flex-shrink-0" />
                <span className="text-base font-bold text-slate-primary leading-tight">
                  {party?.name || inv?.partyName || 'Cash Customer / Direct'}
                </span>
              </div>
              {party?.phone && (
                <div className="flex items-center gap-2 text-xs text-slate-secondary">
                  <Phone size={13} />
                  <span>+91 {party.phone}</span>
                </div>
              )}
              {party?.address && (
                <div className="flex items-center gap-2 text-xs text-slate-secondary">
                  <MapPin size={13} />
                  <span className="truncate">{party.address}</span>
                </div>
              )}
              {partyNetBalance !== null && (
                <div className="pt-2 border-t border-border/60 text-xs">
                  <span className="text-slate-secondary">Current Party Balance: </span>
                  <span
                    className={`font-bold ${
                      partyNetBalance >= 0 ? 'text-blue-700' : 'text-rose-600'
                    }`}
                  >
                    {partyNetBalance >= 0 ? "You'll get " : "You'll give "}
                    {formatINR(Math.abs(partyNetBalance))}
                  </span>
                </div>
              )}
            </div>

            {/* Date & Account Metadata Card */}
            <div className="p-3.5 rounded-2xl bg-white border border-border space-y-2 shadow-xs">
              <span className="text-[11px] font-bold text-slate-secondary uppercase tracking-wider block">
                Transaction Details
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-secondary block">Date</span>
                  <span className="font-bold text-slate-primary flex items-center gap-1 mt-0.5">
                    <Calendar size={13} className="text-primary" />
                    {formatFullDate(inv?.date || txn?.date || '')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-secondary block">Time</span>
                  <span className="font-bold text-slate-primary flex items-center gap-1 mt-0.5">
                    <Clock size={13} className="text-primary" />
                    {formatTime(txn?.time || '12:00')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-secondary block">Payment Mode</span>
                  <span className="font-bold text-slate-primary flex items-center gap-1 mt-0.5">
                    <CreditCard size={13} className="text-primary" />
                    {inv?.paymentType || txn?.mode || 'CASH'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-secondary block">Account</span>
                  <span className="font-bold text-slate-primary flex items-center gap-1 mt-0.5">
                    <Building2 size={13} className="text-primary" />
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
                <h3 className="text-sm font-bold text-slate-primary flex items-center gap-1.5">
                  <Layers size={16} className="text-primary" />
                  <span>Items & Services ({inv.lines.length})</span>
                </h3>
              </div>

              <div className="border border-border rounded-2xl overflow-hidden divide-y divide-border bg-white shadow-xs">
                {inv.lines.map((line, idx) => (
                  <div
                    key={line.id || idx}
                    className="p-3 flex items-start justify-between gap-3 hover:bg-surface-subtle/30 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-bold text-slate-primary">
                          {line.itemName}
                        </span>
                        {line.itemType && (
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-surface-subtle text-slate-secondary">
                            {line.itemType}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-secondary flex items-center gap-2">
                        <span>
                          Qty: <strong className="text-slate-primary">{formatQuantity(line.qty)}</strong> {line.unit}
                        </span>
                        <span>•</span>
                        <span>
                          Rate: <strong className="text-slate-primary">₹{paiseToRupees(line.rate).toFixed(2)}</strong>
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
                      <span className="text-xs sm:text-sm font-bold text-slate-primary tabular-nums block">
                        {formatINR(line.amount)}
                      </span>
                      {inv.withGst && line.taxableAmount && (
                        <span className="text-[10px] text-slate-secondary">
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
          <div className="p-4 rounded-2xl bg-white border border-border space-y-2.5 shadow-xs">
            <span className="text-[11px] font-bold text-slate-secondary uppercase tracking-wider block">
              Financial Breakdown
            </span>

            {inv ? (
              <>
                <div className="flex justify-between text-xs text-slate-secondary">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-primary">{formatINR(inv.subtotal)}</span>
                </div>

                {inv.discountTotal > 0 && (
                  <div className="flex justify-between text-xs text-slate-secondary">
                    <span>Discount</span>
                    <span className="font-semibold text-rose-600">−{formatINR(inv.discountTotal)}</span>
                  </div>
                )}

                {inv.withGst && (
                  <>
                    <div className="flex justify-between text-xs text-slate-secondary">
                      <span>Taxable Amount</span>
                      <span className="font-semibold text-slate-primary">{formatINR(inv.taxableAmount || 0)}</span>
                    </div>
                    {inv.igstTotal && inv.igstTotal > 0 ? (
                      <div className="flex justify-between text-xs text-slate-secondary">
                        <span>IGST</span>
                        <span className="font-semibold text-slate-primary">+{formatINR(inv.igstTotal)}</span>
                      </div>
                    ) : (
                      <>
                        {inv.cgstTotal && inv.cgstTotal > 0 && (
                          <div className="flex justify-between text-xs text-slate-secondary">
                            <span>CGST</span>
                            <span className="font-semibold text-slate-primary">+{formatINR(inv.cgstTotal)}</span>
                          </div>
                        )}
                        {inv.sgstTotal && inv.sgstTotal > 0 && (
                          <div className="flex justify-between text-xs text-slate-secondary">
                            <span>SGST</span>
                            <span className="font-semibold text-slate-primary">+{formatINR(inv.sgstTotal)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {inv.extraCharges && inv.extraCharges > 0 && (
                  <div className="flex justify-between text-xs text-slate-secondary">
                    <span>Additional Charges</span>
                    <span className="font-semibold text-slate-primary">+{formatINR(inv.extraCharges)}</span>
                  </div>
                )}

                {inv.roundOff !== 0 && (
                  <div className="flex justify-between text-xs text-slate-secondary">
                    <span>Round Off</span>
                    <span className="font-semibold text-slate-primary">
                      {inv.roundOff > 0 ? '+' : '−'}
                      {formatINR(Math.abs(inv.roundOff))}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-border flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-primary">Grand Total</span>
                  <span className="text-xl font-extrabold text-blue-700">{formatINR(inv.total)}</span>
                </div>

                <div className="flex justify-between text-xs pt-1 border-t border-border/60">
                  <span className="text-slate-secondary">Amount Settled</span>
                  <span className="font-bold text-emerald-700">{formatINR(inv.paidAmount)}</span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-slate-secondary font-bold">Remaining Balance Due</span>
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
                  <span className="text-sm font-bold text-slate-primary">Recorded Amount</span>
                  <span
                    className={`text-xl font-extrabold ${
                      isSale ? 'text-blue-700' : 'text-rose-600'
                    }`}
                  >
                    {formatINR(txn?.amount || 0)}
                  </span>
                </div>
                {txn?.note && (
                  <div className="text-xs text-slate-secondary pt-1 border-t border-border/60">
                    <span>Note: {txn.note}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="p-3 sm:p-4 border-t border-border bg-white flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintOrViewPdf}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-primary bg-white border border-border hover:bg-surface-subtle flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
              title="Print or view formatted PDF"
            >
              <Printer size={15} />
              <span>Print / View</span>
            </button>

            {inv && (
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-primary bg-white border border-border hover:bg-surface-subtle flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                title="Download PDF directly to device"
              >
                <Download size={15} />
                <span>Download PDF</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDirectShare}
              className="px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
              title="Share PDF or receipt directly"
            >
              <Share2 size={15} />
              <span>Direct Share</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEdit}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
            >
              <Edit size={14} />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={closeTransactionDetail}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-secondary hover:text-slate-primary hover:bg-surface-subtle transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
