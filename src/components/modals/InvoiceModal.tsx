import React, { useState } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { InvoiceType, InvoiceLine, PaymentMode } from '../../types';
import { getTodayDateString, paiseToRupees, rupeesToPaise, formatINR } from '../../utils/formatters';
import { generateInvoicePdf } from '../../services/pdfService';
import { FileText, X, Plus, Trash2, Check, Download, Share2 } from 'lucide-react';

export const InvoiceModal: React.FC = () => {
  const isInvoiceModalOpen = useLedgerlyStore((state) => state.isInvoiceModalOpen);
  const closeInvoiceModal = useLedgerlyStore((state) => state.closeInvoiceModal);
  const business = useLedgerlyStore((state) => state.business);
  const parties = useLedgerlyStore((state) => state.parties);
  const items = useLedgerlyStore((state) => state.items);
  const accounts = useLedgerlyStore((state) => state.accounts);
  const invoices = useLedgerlyStore((state) => state.invoices);
  const addInvoice = useLedgerlyStore((state) => state.addInvoice);
  const openPartyModal = useLedgerlyStore((state) => state.openPartyModal);

  // Form State
  const [type, setType] = useState<InvoiceType>('SALE');
  const [partyId, setPartyId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${new Date().getFullYear()}-${(invoices.length + 1).toString().padStart(3, '0')}`);
  const [date, setDate] = useState(getTodayDateString());
  const [dueDate, setDueDate] = useState(getTodayDateString());
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [notes, setNotes] = useState('Thank you for your business!');
  const [terms, setTerms] = useState('Goods once sold will not be returned without bill.');

  // Payment now toggle
  const [receivedNow, setReceivedNow] = useState(false);
  const [paidAmountStr, setPaidAmountStr] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');

  if (!isInvoiceModalOpen) return null;

  // Add line item
  const handleAddLine = () => {
    if (items.length === 0) {
      alert('Please add items to stock first.');
      return;
    }
    const firstItem = items[0];
    const newLine: InvoiceLine = {
      id: `line-${Date.now()}-${Math.random()}`,
      itemId: firstItem.id,
      itemName: firstItem.name,
      unit: firstItem.unit,
      qty: 1,
      rate: type === 'SALE' ? firstItem.salePrice : firstItem.purchasePrice,
      discountPercent: 0,
      taxPercent: firstItem.taxPercent,
      amount: type === 'SALE' ? firstItem.salePrice : firstItem.purchasePrice,
    };
    setLines([...lines, newLine]);
  };

  const handleUpdateLine = (id: string, updates: Partial<InvoiceLine>) => {
    setLines(
      lines.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, ...updates };
        if (updates.itemId) {
          const matched = items.find((i) => i.id === updates.itemId);
          if (matched) {
            updated.itemName = matched.name;
            updated.unit = matched.unit;
            updated.rate = type === 'SALE' ? matched.salePrice : matched.purchasePrice;
            updated.taxPercent = matched.taxPercent;
          }
        }
        // Recalculate amount
        const base = updated.qty * updated.rate;
        const discountAmount = Math.round(base * (updated.discountPercent / 100));
        const afterDiscount = base - discountAmount;
        const taxAmount = Math.round(afterDiscount * (updated.taxPercent / 100));
        updated.amount = afterDiscount + taxAmount;
        return updated;
      })
    );
  };

  const handleRemoveLine = (id: string) => {
    setLines(lines.filter((l) => l.id !== id));
  };

  // Totals calculations
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  for (const l of lines) {
    const lineBase = l.qty * l.rate;
    const lineDisc = Math.round(lineBase * (l.discountPercent / 100));
    const lineAfterDisc = lineBase - lineDisc;
    const lineTax = Math.round(lineAfterDisc * (l.taxPercent / 100));
    subtotal += lineBase;
    discountTotal += lineDisc;
    taxTotal += lineTax;
  }
  const grandTotal = subtotal - discountTotal + taxTotal;
  const paidAmountPaise = receivedNow ? rupeesToPaise(parseFloat(paidAmountStr) || paiseToRupees(grandTotal)) : 0;
  const balanceDue = Math.max(0, grandTotal - paidAmountPaise);

  const handleSave = () => {
    if (!partyId) {
      alert('Please select a customer or supplier party.');
      return;
    }
    if (lines.length === 0) {
      alert('Please add at least one item line to this invoice.');
      return;
    }

    const party = parties.find((p) => p.id === partyId);

    const status = paidAmountPaise >= grandTotal ? 'PAID' : paidAmountPaise > 0 ? 'PARTIAL' : 'UNPAID';

    const inv = addInvoice({
      type,
      number: invoiceNumber,
      partyId,
      partyName: party?.name || 'Customer',
      date,
      dueDate,
      subtotal,
      discountTotal,
      taxTotal,
      roundOff: 0,
      total: grandTotal,
      paidAmount: paidAmountPaise,
      paymentMode: receivedNow ? paymentMode : undefined,
      accountId: receivedNow ? selectedAccountId : undefined,
      status,
      notes,
      terms,
      lines,
    });

    // Generate & download PDF directly
    try {
      const doc = generateInvoicePdf(inv, business, party);
      doc.save(`${invoiceNumber}.pdf`);
    } catch {
      // PDF generation
    }

    closeInvoiceModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-floating border border-border animate-in slide-in-from-bottom-5 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-primary-light/50 rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-primary-dark">Create Accounting Document</h3>
              <p className="text-xs text-slate-secondary">Sale invoice, purchase bill, or challan</p>
            </div>
          </div>
          <button type="button" onClick={closeInvoiceModal} className="p-1.5 rounded-full hover:bg-slate-200/50 text-slate-secondary">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
          {/* Document Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-secondary mb-1">Document Type</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {(
                [
                  { type: 'SALE' as InvoiceType, label: 'Sale Invoice' },
                  { type: 'PURCHASE' as InvoiceType, label: 'Purchase Bill' },
                  { type: 'QUOTATION' as InvoiceType, label: 'Quotation' },
                  { type: 'DELIVERY_CHALLAN' as InvoiceType, label: 'Challan' },
                  { type: 'SALE_RETURN' as InvoiceType, label: 'Sale Return' },
                  { type: 'PURCHASE_RETURN' as InvoiceType, label: 'Pur Return' },
                ]
              ).map((d) => (
                <button
                  key={d.type}
                  type="button"
                  onClick={() => setType(d.type)}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all text-center truncate ${
                    type === d.type
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface-subtle text-slate-primary border-border hover:border-slate-muted'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Party and Invoice Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-secondary">
                  {type === 'PURCHASE' ? 'Supplier (Bill From)' : 'Customer (Bill To)'} *
                </label>
                <button
                  type="button"
                  onClick={openPartyModal}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
                >
                  <Plus size={12} /> Add Party
                </button>
              </div>
              <select
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
                className="w-full px-3 py-2 rounded-input bg-surface border border-border text-sm font-semibold text-slate-primary focus:outline-none focus:border-primary"
              >
                <option value="">— Select Party —</option>
                {parties.filter((p) => !p.isDeleted).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.phone ? `(${p.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">Invoice Number</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-input bg-surface border border-border text-sm font-bold text-slate-primary focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">Invoice Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-input bg-surface border border-border text-xs text-slate-primary focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-input bg-surface border border-border text-xs text-slate-primary focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Item Lines Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-secondary">
                Items & Services ({lines.length})
              </label>
              <button
                type="button"
                onClick={handleAddLine}
                className="px-3 py-1.5 rounded-xl bg-primary-light hover:bg-indigo-100 text-primary font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <Plus size={14} /> Add Line Item
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="p-4 bg-surface-subtle border border-dashed border-border rounded-2xl text-center">
                <p className="text-xs text-slate-secondary">No items added yet. Click "+ Add Line Item" above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lines.map((line, idx) => (
                  <div key={line.id} className="p-3 bg-surface-subtle border border-border rounded-2xl space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-secondary">#{idx + 1}</span>
                      <select
                        value={line.itemId}
                        onChange={(e) => handleUpdateLine(line.id, { itemId: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-border text-xs font-semibold text-slate-primary focus:outline-none focus:border-primary"
                      >
                        {items.filter((i) => !i.isDeleted).map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({formatINR(type === 'SALE' ? item.salePrice : item.purchasePrice)})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(line.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-secondary block">Qty ({line.unit})</span>
                        <input
                          type="number"
                          min="1"
                          value={line.qty}
                          onChange={(e) => handleUpdateLine(line.id, { qty: parseFloat(e.target.value) || 1 })}
                          className="w-full px-2 py-1 rounded-lg bg-white border border-border text-xs font-bold tabular-nums"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-secondary block">Rate (₹)</span>
                        <input
                          type="number"
                          value={paiseToRupees(line.rate)}
                          onChange={(e) => handleUpdateLine(line.id, { rate: rupeesToPaise(parseFloat(e.target.value) || 0) })}
                          className="w-full px-2 py-1 rounded-lg bg-white border border-border text-xs font-bold tabular-nums"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-secondary block">Disc %</span>
                        <input
                          type="number"
                          value={line.discountPercent}
                          onChange={(e) => handleUpdateLine(line.id, { discountPercent: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 rounded-lg bg-white border border-border text-xs font-semibold tabular-nums"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-secondary block">Total</span>
                        <span className="block px-2 py-1 text-xs font-extrabold text-slate-primary tabular-nums">
                          {formatINR(line.amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment received now toggle */}
          <div className="p-3.5 bg-surface-subtle border border-border rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-primary block">Payment settled now?</span>
                <span className="text-[11px] text-slate-secondary">Record instant cash or bank settlement</span>
              </div>
              <input
                type="checkbox"
                checked={receivedNow}
                onChange={(e) => {
                  setReceivedNow(e.target.checked);
                  if (e.target.checked && !paidAmountStr) {
                    setPaidAmountStr(paiseToRupees(grandTotal).toString());
                  }
                }}
                className="w-5 h-5 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
              />
            </div>

            {receivedNow && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border">
                <div>
                  <span className="text-[10px] font-semibold text-slate-secondary block mb-0.5">Amount Paid (₹)</span>
                  <input
                    type="number"
                    value={paidAmountStr}
                    placeholder={paiseToRupees(grandTotal).toString()}
                    onChange={(e) => setPaidAmountStr(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-border text-xs font-bold tabular-nums"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-secondary block mb-0.5">Mode</span>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full px-2 py-1.5 rounded-lg bg-white border border-border text-xs font-semibold"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="NEFT_RTGS">NEFT / RTGS</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-secondary block mb-0.5">Account</span>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-white border border-border text-xs font-semibold"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nickname}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Totals Summary */}
          <div className="bg-primary-light/40 border border-primary/20 rounded-2xl p-4 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-secondary">
              <span>Subtotal:</span>
              <span className="font-semibold tabular-nums">{formatINR(subtotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-xs text-moneyOut">
                <span>Total Discount:</span>
                <span className="font-semibold tabular-nums">−{formatINR(discountTotal)}</span>
              </div>
            )}
            {taxTotal > 0 && (
              <div className="flex justify-between text-xs text-slate-secondary">
                <span>Tax (GST):</span>
                <span className="font-semibold tabular-nums">+{formatINR(taxTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-slate-primary pt-2 border-t border-primary/20">
              <span>Grand Total:</span>
              <span className="text-primary tabular-nums">{formatINR(grandTotal)}</span>
            </div>
            {receivedNow && (
              <div className="flex justify-between text-xs font-bold text-slate-secondary pt-1">
                <span>Balance Due:</span>
                <span className={balanceDue > 0 ? 'text-moneyOut' : 'text-moneyIn'}>
                  {formatINR(balanceDue)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-surface-subtle rounded-b-3xl flex gap-3">
          <button
            type="button"
            onClick={closeInvoiceModal}
            className="flex-1 h-12 rounded-button bg-white border border-border text-slate-primary font-bold text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 h-12 rounded-button bg-primary hover:bg-primary-hover text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Download size={16} /> Save & Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};
