import React, { useState, useEffect } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { PurchaseEntry, PurchaseEntryType, PurchaseItemLine } from '../../types';
import { formatINR } from '../../utils/formatters';
import { sharePurchaseVoucher } from '../../services/purchaseVoucherService';
import {
  X,
  Plus,
  Check,
  Share2,
  Calendar,
  Wallet,
  ChevronDown,
  ChevronUp,
  Trash2,
  ShoppingBag,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  User,
  Search,
} from 'lucide-react';

export const PurchaseEntryModal: React.FC = () => {
  const isOpen = useLedgerlyStore((state) => state.isPurchaseModalOpen);
  const modalType = useLedgerlyStore((state) => state.purchaseModalType);
  const selectedToEdit = useLedgerlyStore((state) => state.selectedPurchaseToEdit);
  const closePurchaseModal = useLedgerlyStore((state) => state.closePurchaseModal);
  const addPurchaseEntry = useLedgerlyStore((state) => state.addPurchaseEntry);
  const updatePurchaseEntry = useLedgerlyStore((state) => state.updatePurchaseEntry);
  const parties = useLedgerlyStore((state) => state.parties);
  const itemsMaster = useLedgerlyStore((state) => state.items);
  const business = useLedgerlyStore((state) => state.business);
  const purchaseSettings = useLedgerlyStore((state) => state.purchaseSettings);

  const [type, setType] = useState<PurchaseEntryType>('PURCHASE_IN');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'BANK' | 'CHEQUE' | 'CREDIT'>('CREDIT');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [items, setItems] = useState<PurchaseItemLine[]>([]);
  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (selectedToEdit) {
        setType(selectedToEdit.type);
        setSupplierName(selectedToEdit.supplierName || selectedToEdit.partyName || '');
        setSupplierPhone(selectedToEdit.supplierPhone || selectedToEdit.partyPhone || '');
        setSupplierId(selectedToEdit.supplierId || selectedToEdit.partyId || '');
        setAmountRupees((selectedToEdit.amount / 100).toString());
        setPaymentMode(selectedToEdit.paymentMode);
        setDate(selectedToEdit.date);
        setNote(selectedToEdit.note || '');
        setShowNote(Boolean(selectedToEdit.note));
        setItems(selectedToEdit.items || []);
        setShowItems(Boolean(selectedToEdit.items && selectedToEdit.items.length > 0));
      } else {
        setType(modalType || 'PURCHASE_IN');
        setSupplierName('');
        setSupplierPhone('');
        setSupplierId('');
        setAmountRupees('');
        setPaymentMode(purchaseSettings?.defaultPaymentMode || 'CASH');
        setDate(new Date().toISOString().slice(0, 10));
        setNote('');
        setShowNote(false);
        setItems([]);
        setShowItems(purchaseSettings?.enableItemDetailsByDefault || false);
      }
    }
  }, [isOpen, modalType, selectedToEdit, purchaseSettings]);

  if (!isOpen) return null;

  const handleSelectParty = (p: any) => {
    setSupplierId(p.id);
    setSupplierName(p.name);
    setSupplierPhone(p.phone || '');
    setIsPartyDropdownOpen(false);
  };

  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `pi-${Date.now()}`,
        itemName: '',
        qty: 1,
        unit: 'pcs',
        rate: 0,
        amount: 0,
      },
    ]);
    setShowItems(true);
  };

  const handleUpdateItemRow = (idx: number, field: keyof PurchaseItemLine, val: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const row = { ...updated[idx], [field]: val };
      if (field === 'qty' || field === 'rate') {
        row.amount = Math.round(row.qty * row.rate);
      }
      updated[idx] = row;

      // Auto-update total amount from items if items are active
      const totalPaise = updated.reduce((sum, it) => sum + it.amount, 0);
      if (totalPaise > 0) {
        setAmountRupees((totalPaise / 100).toString());
      }
      return updated;
    });
  };

  const handleRemoveItemRow = (idx: number) => {
    setItems((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      const totalPaise = updated.reduce((sum, it) => sum + it.amount, 0);
      if (totalPaise > 0) {
        setAmountRupees((totalPaise / 100).toString());
      }
      return updated;
    });
  };

  const handleSave = async (shareWhatsApp = false) => {
    if (!supplierName.trim()) {
      alert('Please enter supplier or party name.');
      return;
    }
    const valPaise = Math.round((parseFloat(amountRupees) || 0) * 100);
    if (valPaise <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    setIsSaving(true);
    try {
      let savedEntry: PurchaseEntry;
      if (selectedToEdit) {
        updatePurchaseEntry(selectedToEdit.id, {
          type,
          supplierName: supplierName.trim(),
          supplierPhone: supplierPhone.trim(),
          amount: valPaise,
          paymentMode,
          date,
          note: note.trim() || undefined,
          items: items.filter((it) => it.itemName.trim()),
        });
        savedEntry = {
          ...selectedToEdit,
          type,
          supplierName: supplierName.trim(),
          supplierPhone: supplierPhone.trim(),
          amount: valPaise,
          paymentMode,
          date,
          note: note.trim() || undefined,
          items: items.filter((it) => it.itemName.trim()),
        };
      } else {
        savedEntry = addPurchaseEntry({
          type,
          supplierId,
          supplierName: supplierName.trim(),
          supplierPhone: supplierPhone.trim(),
          amount: valPaise,
          paymentMode,
          date,
          note: note.trim() || undefined,
          items: items.filter((it) => it.itemName.trim()),
        });
      }

      if (shareWhatsApp) {
        const partyObj = parties.find((p) => p.id === savedEntry.supplierId);
        await sharePurchaseVoucher(savedEntry, business, partyObj, true);
      }

      closePurchaseModal();
    } catch (err) {
      console.error('Failed saving purchase:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter existing suppliers
  const supplierParties = parties.filter((p) => !p.isDeleted);
  const matchedSuppliers = supplierParties.filter((p) => {
    const q = supplierName.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || (p.phone && p.phone.includes(q));
  });

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs ${
                type === 'PURCHASE_IN'
                  ? 'bg-blue-600'
                  : type === 'PURCHASE_OUT'
                  ? 'bg-amber-600'
                  : 'bg-purple-600'
              }`}
            >
              {type === 'PURCHASE_IN' ? (
                <ArrowDownLeft size={20} />
              ) : type === 'PURCHASE_OUT' ? (
                <ArrowUpRight size={20} />
              ) : (
                <FileText size={20} />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {selectedToEdit ? 'Edit Purchase Voucher' : 'New Purchase Entry'}
              </h2>
              <p className="text-xs text-slate-500">Fast, minimalist supplier recording</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closePurchaseModal}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* 3 Simple Mode Switcher Tabs */}
        <div className="p-2 bg-slate-100 border-b border-slate-200 grid grid-cols-3 gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setType('PURCHASE_IN')}
            className={`py-2 px-1 rounded-xl text-center transition-all ${
              type === 'PURCHASE_IN'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Purchase In
          </button>
          <button
            type="button"
            onClick={() => setType('PURCHASE_OUT')}
            className={`py-2 px-1 rounded-xl text-center transition-all ${
              type === 'PURCHASE_OUT'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Purchase Out (Return)
          </button>
          <button
            type="button"
            onClick={() => setType('DEBIT_NOTE')}
            className={`py-2 px-1 rounded-xl text-center transition-all ${
              type === 'DEBIT_NOTE'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3. Debit Note
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* 1. Supplier / Party Selector with Search Dropdown */}
          <div className="relative">
            <label className="font-bold text-slate-800 block mb-1">
              Supplier / Party Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <User size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={supplierName}
                onFocus={() => setIsPartyDropdownOpen(true)}
                onChange={(e) => {
                  setSupplierName(e.target.value);
                  setIsPartyDropdownOpen(true);
                }}
                placeholder="Type or select supplier..."
                className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-300 bg-white font-bold text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
              />
              {supplierName && (
                <button
                  type="button"
                  onClick={() => {
                    setSupplierName('');
                    setSupplierId('');
                    setSupplierPhone('');
                  }}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Dropdown suggestions */}
            {isPartyDropdownOpen && matchedSuppliers.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white rounded-2xl shadow-xl border border-slate-200 max-h-48 overflow-y-auto divide-y divide-slate-100">
                <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Existing Supplier ({matchedSuppliers.length})
                </div>
                {matchedSuppliers.slice(0, 8).map((p) => (
                  <div
                    key={p.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectParty(p);
                    }}
                    className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{p.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {p.phone ? `+91 ${p.phone}` : 'No phone'} • Balance: {formatINR(p.openingBalance)} ({p.openingType})
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      Select
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Supplier Phone (Optional) */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Supplier Phone (Optional, for WhatsApp voucher):
            </label>
            <input
              type="tel"
              value={supplierPhone}
              onChange={(e) => setSupplierPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="e.g. 9825102030"
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-xs"
            />
          </div>

          {/* 2. Amount Field (Paise-accurate, big friendly display) */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-base font-extrabold text-slate-400">₹</span>
              <input
                type="number"
                step="any"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                placeholder="0.00"
                className="w-full h-12 pl-8 pr-4 rounded-xl border-2 border-slate-300 bg-white font-black text-lg sm:text-xl text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
              />
            </div>
          </div>

          {/* 3. Payment Mode & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Payment Mode:</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white font-bold text-xs"
              >
                <option value="CREDIT">Credit (Unpaid / Udhar)</option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI (GPay, PhonePe, Paytm)</option>
                <option value="BANK">Bank Transfer (NEFT/RTGS/IMPS)</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Date:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white font-bold text-xs"
              />
            </div>
          </div>

          {/* 4. Optional Collapsible Note */}
          <div className="border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={() => setShowNote(!showNote)}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>{showNote ? '– Hide Note' : '+ Add Note (Optional)'}</span>
            </button>
            {showNote && (
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Bill reference, vehicle, or supplier remarks..."
                className="w-full mt-2 p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-xs"
              />
            )}
          </div>

          {/* 5. Optional Item Details (Accordion) */}
          <div className="border-t border-slate-100 pt-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowItems(!showItems)}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5"
              >
                <span>Add Item-wise Details (Optional)</span>
                {showItems ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showItems && (
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px] hover:bg-blue-100 transition-all"
                >
                  + Add Item Line
                </button>
              )}
            </div>

            {showItems && (
              <div className="mt-3 space-y-2">
                {items.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-400 text-xs">
                    No items added. Click "+ Add Item Line" to record item quantities.
                  </div>
                ) : (
                  items.map((it, idx) => (
                    <div
                      key={it.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-12 gap-2 items-center text-xs"
                    >
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={it.itemName}
                          onChange={(e) => handleUpdateItemRow(idx, 'itemName', e.target.value)}
                          placeholder="Item name"
                          className="w-full p-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={it.qty || ''}
                          onChange={(e) => handleUpdateItemRow(idx, 'qty', parseFloat(e.target.value) || 0)}
                          placeholder="Qty"
                          className="w-full p-1.5 rounded-lg border border-slate-300 bg-white font-medium text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={it.unit || 'pcs'}
                          onChange={(e) => handleUpdateItemRow(idx, 'unit', e.target.value)}
                          placeholder="Unit"
                          className="w-full p-1.5 rounded-lg border border-slate-300 bg-white font-medium text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={it.rate ? it.rate / 100 : ''}
                          onChange={(e) =>
                            handleUpdateItemRow(idx, 'rate', Math.round((parseFloat(e.target.value) || 0) * 100))
                          }
                          placeholder="Rate"
                          className="w-full p-1.5 rounded-lg border border-slate-300 bg-white font-medium text-right"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <button
            type="button"
            onClick={closePurchaseModal}
            className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 font-bold text-xs text-slate-700"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Share2 size={15} />
              <span>Save & Share (WhatsApp)</span>
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(false)}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Check size={16} />
              <span>Save Voucher</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
