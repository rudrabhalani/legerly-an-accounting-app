import React, { useState, useEffect } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import {
  InvoiceType,
  InvoiceLine,
  PaymentMode,
  InvoicePaymentType,
  UnitType,
  DiscountType,
  Party,
  Item,
} from '../../types';
import {
  getTodayDateString,
  paiseToRupees,
  rupeesToPaise,
  formatINR,
} from '../../utils/formatters';
import { INDIAN_STATES, isInterStateSupply } from '../../data/indianStates';
import { calculateLineGST, calculateInvoiceTotals } from '../../utils/gstCalc';
import { generateInvoicePdf } from '../../services/pdfService';
import { pickMobileContacts } from '../../utils/contactPicker';
import {
  X,
  Plus,
  Trash2,
  Check,
  Download,
  Share2,
  AlertTriangle,
  Receipt,
  Building2,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  UserPlus,
  PackagePlus,
  Percent,
  Search,
  BookUser,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const UNIT_OPTIONS: { id: UnitType; label: string }[] = [
  { id: 'pcs', label: 'Pcs' },
  { id: 'kg', label: 'Kg' },
  { id: 'g', label: 'Grams (g)' },
  { id: 'litre', label: 'Litre' },
  { id: 'ml', label: 'ml' },
  { id: 'box', label: 'Box' },
  { id: 'meter', label: 'Meter' },
  { id: 'packet', label: 'Packet' },
  { id: 'dozen', label: 'Dozen' },
  { id: 'hour', label: 'Hour' },
  { id: 'day', label: 'Day' },
];

export const InvoiceScreen: React.FC = () => {
  const isInvoiceScreenOpen = useLedgerlyStore((state) => state.isInvoiceScreenOpen);
  const closeInvoiceScreen = useLedgerlyStore((state) => state.closeInvoiceScreen);
  const mode = useLedgerlyStore((state) => state.invoiceScreenMode);
  const activeInvoiceToEdit = useLedgerlyStore((state) => state.activeInvoiceToEdit);
  const business = useLedgerlyStore((state) => state.business);
  const activeFY = useLedgerlyStore((state) => state.activeFinancialYear);
  const parties = useLedgerlyStore((state) => state.parties);
  const items = useLedgerlyStore((state) => state.items);
  const accounts = useLedgerlyStore((state) => state.accounts);
  const invoices = useLedgerlyStore((state) => state.invoices);
  const atomicSaveInvoice = useLedgerlyStore((state) => state.atomicSaveInvoice);
  const addParty = useLedgerlyStore((state) => state.addParty);
  const addPartiesBatch = useLedgerlyStore((state) => state.addPartiesBatch);
  const addItem = useLedgerlyStore((state) => state.addItem);
  const canEditDelete = useLedgerlyStore((state) => state.canCurrentUserEditDelete());

  const [partySearchTerm, setPartySearchTerm] = useState('');
  const [activeDropdownLineId, setActiveDropdownLineId] = useState<string | null>(null);

  // Invoice Mode
  const [type, setType] = useState<InvoiceType>(mode || 'SALE');
  const [withGst, setWithGst] = useState<boolean>(business.gstEnabled ?? true);
  const [stateOfSupply, setStateOfSupply] = useState<string>('24 - Gujarat');

  // Header
  const [partyId, setPartyId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [dueDate, setDueDate] = useState(getTodayDateString());

  // Item Lines
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [extraChargesStr, setExtraChargesStr] = useState('0');
  const [notes, setNotes] = useState('Thank you for doing business with us!');
  const [terms, setTerms] = useState('Payment due as agreed. Goods once sold are non-refundable.');

  // Payment
  const [paymentType, setPaymentType] = useState<InvoicePaymentType>('CASH');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [paidAmountStr, setPaidAmountStr] = useState('');
  const [isManualPaidAmount, setIsManualPaidAmount] = useState(false);

  // Quick Add Party Modal
  const [showQuickPartyModal, setShowQuickPartyModal] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyPhone, setNewPartyPhone] = useState('');
  const [newPartyGstin, setNewPartyGstin] = useState('');
  const [newPartyState, setNewPartyState] = useState('24 - Gujarat');
  const [newPartyAddress, setNewPartyAddress] = useState('');
  const [newPartyOpeningBal, setNewPartyOpeningBal] = useState('0');

  // Quick Add Item Modal
  const [showQuickItemModal, setShowQuickItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState<UnitType>('pcs');
  const [newItemSalePrice, setNewItemSalePrice] = useState('');
  const [newItemPurchasePrice, setNewItemPurchasePrice] = useState('');
  const [newItemGstPercent, setNewItemGstPercent] = useState(18);
  const [newItemHsn, setNewItemHsn] = useState('');
  const [newItemOpeningStock, setNewItemOpeningStock] = useState('0');

  // Negative Stock Warning Alert
  const [stockWarnings, setStockWarnings] = useState<string[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Determine inter-state
  const isInterState = isInterStateSupply('24', stateOfSupply);

  // Auto-generate invoice number based on type and FY
  const generateNextNumber = (invType: InvoiceType) => {
    const prefix =
      invType === 'SALE'
        ? 'INV'
        : invType === 'PURCHASE'
        ? 'BILL'
        : invType === 'SALE_RETURN'
        ? 'SR'
        : 'PR';
    const fyPart = activeFY.replace('20', '').replace('-', '');
    const count = invoices.filter((i) => i.type === invType && i.financialYear === activeFY).length + 1;
    return `${prefix}/${fyPart}/${count.toString().padStart(3, '0')}`;
  };

  // Reset or load active invoice
  useEffect(() => {
    if (isInvoiceScreenOpen) {
      if (activeInvoiceToEdit) {
        setType(activeInvoiceToEdit.type);
        setPartyId(activeInvoiceToEdit.partyId);
        setInvoiceNumber(activeInvoiceToEdit.number);
        setDate(activeInvoiceToEdit.date);
        setDueDate(activeInvoiceToEdit.dueDate);
        setWithGst(activeInvoiceToEdit.withGst ?? true);
        setStateOfSupply(activeInvoiceToEdit.stateOfSupply || '24 - Gujarat');
        setLines(activeInvoiceToEdit.lines);
        setExtraChargesStr(paiseToRupees(activeInvoiceToEdit.extraCharges || 0).toString());
        setNotes(activeInvoiceToEdit.notes || '');
        setTerms(activeInvoiceToEdit.terms || '');
        setPaymentType(activeInvoiceToEdit.paymentType || 'CASH');
        setSelectedAccountId(activeInvoiceToEdit.accountId || (accounts[0]?.id || ''));
        setPaidAmountStr(paiseToRupees(activeInvoiceToEdit.paidAmount).toString());
        setIsManualPaidAmount(true);
      } else {
        const initialType = mode || 'SALE';
        setType(initialType);
        setPartyId(parties[0]?.id || '');
        setInvoiceNumber(generateNextNumber(initialType));
        setDate(getTodayDateString());
        setDueDate(getTodayDateString());
        setWithGst(business.gstEnabled ?? true);
        setStateOfSupply('24 - Gujarat');
        setExtraChargesStr('0');
        setStockWarnings([]);
        setSaveSuccessMsg(null);
        setIsManualPaidAmount(false);

        const defaultAcc =
          paymentType === 'CASH'
            ? accounts.find((a) => a.type === 'CASH')
            : accounts.find((a) => a.type === 'BANK');
        setSelectedAccountId(defaultAcc?.id || accounts[0]?.id || '');

        // If items exist, add one empty/first line
        if (items.length > 0) {
          const first = items[0];
          const initialRate = initialType === 'SALE' ? first.salePrice : first.purchasePrice;
          const calc = calculateLineGST({
            qty: 1,
            ratePaise: initialRate,
            discountType: 'PERCENT',
            discountPercent: 0,
            taxPercent: first.taxPercent,
            taxIncluded: false,
            withGst: true,
            isInterState: false,
          });

          setLines([
            {
              id: `line-${Date.now()}`,
              itemId: first.id,
              itemName: first.name,
              unit: first.unit,
              qty: 1,
              rate: initialRate,
              discountPercent: 0,
              discountType: 'PERCENT',
              discountAmount: 0,
              taxPercent: first.taxPercent,
              taxIncluded: false,
              taxableAmount: calc.taxableAmountPaise,
              cgst: calc.cgstPaise,
              sgst: calc.sgstPaise,
              igst: calc.igstPaise,
              amount: calc.rowTotalPaise,
              hsn: first.hsn,
            },
          ]);
        } else {
          setLines([]);
        }
      }
    }
  }, [isInvoiceScreenOpen, mode, activeInvoiceToEdit]);

  // Recalculate totals
  const extraChargesPaise = rupeesToPaise(parseFloat(extraChargesStr) || 0);
  const totals = calculateInvoiceTotals(lines, extraChargesPaise, withGst, isInterState);

  // Auto-sync paid amount if not manually modified
  useEffect(() => {
    if (!isManualPaidAmount) {
      if (paymentType === 'CREDIT') {
        setPaidAmountStr('0');
      } else {
        setPaidAmountStr(paiseToRupees(totals.grandTotalPaise).toFixed(2));
      }
    }
  }, [totals.grandTotalPaise, paymentType, isManualPaidAmount]);

  if (!isInvoiceScreenOpen) return null;

  // Selected party object
  const selectedParty = parties.find((p) => p.id === partyId);

  // Line item helpers
  const handleAddLine = (customItem?: Partial<InvoiceLine>) => {
    const defaultItem = items.find((i) => !i.isDeleted);
    const initialName = customItem?.itemName || defaultItem?.name || '';
    const initialRate =
      customItem?.rate !== undefined
        ? customItem.rate
        : defaultItem
        ? type === 'SALE'
          ? defaultItem.salePrice
          : defaultItem.purchasePrice
        : rupeesToPaise(100);
    const initialUnit = customItem?.unit || defaultItem?.unit || 'pcs';
    const initialTax =
      customItem?.taxPercent !== undefined ? customItem.taxPercent : defaultItem?.taxPercent || 0;

    const calc = calculateLineGST({
      qty: customItem?.qty || 1,
      ratePaise: initialRate,
      discountType: 'PERCENT',
      discountPercent: 0,
      taxPercent: initialTax,
      taxIncluded: false,
      withGst,
      isInterState,
    });

    const newLine: InvoiceLine = {
      id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      itemId: defaultItem ? defaultItem.id : `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      itemName: initialName,
      itemType: customItem?.itemType || defaultItem?.itemType || 'PRODUCT',
      unit: initialUnit,
      qty: customItem?.qty || 1,
      rate: initialRate,
      discountPercent: 0,
      discountType: 'PERCENT',
      discountAmount: 0,
      taxPercent: initialTax,
      taxIncluded: false,
      taxableAmount: calc.taxableAmountPaise,
      cgst: calc.cgstPaise,
      sgst: calc.sgstPaise,
      igst: calc.igstPaise,
      amount: calc.rowTotalPaise,
      hsn: defaultItem?.hsn || '',
    };
    setLines([...lines, newLine]);
  };

  const handleSelectSavedItem = (lineId: string, savedItem: Item) => {
    handleUpdateLine(lineId, {
      itemId: savedItem.id,
      itemName: savedItem.name,
      itemType: savedItem.itemType || 'PRODUCT',
      unit: savedItem.unit,
      rate: type === 'SALE' ? savedItem.salePrice : savedItem.purchasePrice,
      taxPercent: savedItem.taxPercent,
      hsn: savedItem.hsn,
    });
    setActiveDropdownLineId(null);
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
            updated.hsn = matched.hsn;
            updated.itemType = matched.itemType || 'PRODUCT';
          }
        }

        const calc = calculateLineGST({
          qty: updated.qty,
          ratePaise: updated.rate,
          discountType: updated.discountType || 'PERCENT',
          discountPercent: updated.discountPercent || 0,
          discountAmountPaise: updated.discountAmount || 0,
          taxPercent: updated.taxPercent,
          taxIncluded: updated.taxIncluded,
          withGst,
          isInterState,
        });

        updated.taxableAmount = calc.taxableAmountPaise;
        updated.cgst = calc.cgstPaise;
        updated.sgst = calc.sgstPaise;
        updated.igst = calc.igstPaise;
        updated.amount = calc.rowTotalPaise;

        return updated;
      })
    );
  };


  const handleRemoveLine = (id: string) => {
    setLines(lines.filter((l) => l.id !== id));
  };

  // Quick Add Party handler
  const handleSaveQuickParty = () => {
    if (!newPartyName.trim()) {
      alert('Please enter party name');
      return;
    }
    const opVal = rupeesToPaise(parseFloat(newPartyOpeningBal) || 0);
    const created = addParty({
      name: newPartyName.trim(),
      phone: newPartyPhone.trim(),
      type: type === 'SALE' ? 'CUSTOMER' : 'SUPPLIER',
      state: newPartyState,
      address: newPartyAddress.trim() || undefined,
      gstin: newPartyGstin.trim().toUpperCase() || undefined,
      openingBalance: opVal,
      openingType: type === 'SALE' ? 'RECEIVABLE' : 'PAYABLE',
    });
    setPartyId(created.id);
    setShowQuickPartyModal(false);
    setNewPartyName('');
    setNewPartyPhone('');
    setNewPartyGstin('');
  };

  // Mobile Contacts Picker Handler for Invoice Party
  const handleImportContactsForInvoice = async () => {
    const contacts = await pickMobileContacts(true);
    if (contacts.length > 0) {
      const created = addPartiesBatch(
        contacts.map((c) => ({
          name: c.name,
          phone: c.phone,
          type: type === 'SALE' ? 'CUSTOMER' : 'SUPPLIER',
          openingBalance: 0,
          openingType: type === 'SALE' ? 'RECEIVABLE' : 'PAYABLE',
        }))
      );
      if (created.length > 0) {
        setPartyId(created[0].id);
        setPartySearchTerm('');
      }
    }
  };

  const handlePickSinglePhoneContact = async () => {
    const contacts = await pickMobileContacts(false);
    if (contacts.length > 0) {
      setNewPartyName(contacts[0].name);
      setNewPartyPhone(contacts[0].phone);
    }
  };

  // Quick Add Item handler
  const handleSaveQuickItem = () => {
    if (!newItemName.trim()) {
      alert('Please enter item name');
      return;
    }
    const sPrice = rupeesToPaise(parseFloat(newItemSalePrice) || 0);
    const pPrice = rupeesToPaise(parseFloat(newItemPurchasePrice) || 0);
    const opStock = parseFloat(newItemOpeningStock) || 0;

    const created = addItem({
      name: newItemName.trim(),
      category: 'General',
      unit: newItemUnit,
      salePrice: sPrice,
      purchasePrice: pPrice,
      openingStock: opStock,
      minStock: 5,
      taxPercent: newItemGstPercent,
      hsn: newItemHsn.trim() || undefined,
    });

    setShowQuickItemModal(false);
    setNewItemName('');
    setNewItemSalePrice('');
    setNewItemPurchasePrice('');
    setNewItemHsn('');

    // Add this item as a line
    const calc = calculateLineGST({
      qty: 1,
      ratePaise: type === 'SALE' ? created.salePrice : created.purchasePrice,
      discountType: 'PERCENT',
      discountPercent: 0,
      taxPercent: created.taxPercent,
      taxIncluded: false,
      withGst,
      isInterState,
    });

    const newLine: InvoiceLine = {
      id: `line-${Date.now()}`,
      itemId: created.id,
      itemName: created.name,
      unit: created.unit,
      qty: 1,
      rate: type === 'SALE' ? created.salePrice : created.purchasePrice,
      discountPercent: 0,
      discountType: 'PERCENT',
      discountAmount: 0,
      taxPercent: created.taxPercent,
      taxIncluded: false,
      taxableAmount: calc.taxableAmountPaise,
      cgst: calc.cgstPaise,
      sgst: calc.sgstPaise,
      igst: calc.igstPaise,
      amount: calc.rowTotalPaise,
      hsn: created.hsn,
    };
    setLines([...lines, newLine]);
  };

  // Validate and Save Invoice
  const validateAndPrepare = () => {
    if (!partyId) {
      alert('Please select or add a party.');
      return null;
    }
    if (lines.length === 0) {
      alert('Please add at least one item line.');
      return null;
    }
    if (!invoiceNumber.trim()) {
      alert('Please enter an invoice number.');
      return null;
    }

    const party = parties.find((p) => p.id === partyId);
    const partyName = party?.name || 'Party';
    const paidPaise = rupeesToPaise(parseFloat(paidAmountStr) || 0);

    let mappedPaymentMode: PaymentMode = 'CASH';
    if (paymentType === 'BANK' || paymentType === 'UPI') {
      mappedPaymentMode = 'UPI';
    } else if (paymentType === 'CHEQUE') {
      mappedPaymentMode = 'CHEQUE';
    }

    let resolvedAccountId = selectedAccountId;
    if (!resolvedAccountId) {
      const defaultCash = accounts.find((a) => a.type === 'CASH');
      const defaultBank = accounts.find((a) => a.type === 'BANK');
      resolvedAccountId = (paymentType === 'CASH' ? defaultCash?.id : defaultBank?.id) || accounts[0]?.id || '';
    }

    let invoiceStatus: 'PAID' | 'PARTIAL' | 'UNPAID' = 'UNPAID';
    if (paidPaise >= totals.grandTotalPaise) {
      invoiceStatus = 'PAID';
    } else if (paidPaise > 0) {
      invoiceStatus = 'PARTIAL';
    }

    return {
      type,
      number: invoiceNumber.trim(),
      partyId,
      partyName,
      date,
      dueDate,
      financialYear: activeFY,
      withGst,
      stateOfSupply,
      subtotal: totals.subtotalPaise,
      discountTotal: totals.discountTotalPaise,
      taxableAmount: totals.taxableAmountPaise,
      taxTotal: totals.taxTotalPaise,
      cgstTotal: totals.cgstTotalPaise,
      sgstTotal: totals.sgstTotalPaise,
      igstTotal: totals.igstTotalPaise,
      extraCharges: extraChargesPaise,
      roundOff: totals.roundOffPaise,
      total: totals.grandTotalPaise,
      paidAmount: paidPaise,
      paymentType,
      paymentMode: mappedPaymentMode,
      accountId: resolvedAccountId,
      status: invoiceStatus,
      notes: undefined,
      terms: 'Standard terms apply. Goods once sold are subject to business policy.',
      lines,
    };

  };

  const handleSave = async (andNew: boolean = false, andShare: boolean = false) => {
    if (!canEditDelete) {
      alert('Viewers cannot create or edit invoices.');
      return;
    }

    const invData = validateAndPrepare();
    if (!invData) return;

    const { invoice, stockWarnings: warnings } = atomicSaveInvoice(invData);
    if (warnings.length > 0) {
      setStockWarnings(warnings);
    }

    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });

    if (andShare) {
      const defaultBankAcc = accounts.find((a) => a.id === invData.accountId && a.type === 'BANK') || accounts.find((a) => a.type === 'BANK');
      const doc = generateInvoicePdf(invoice, business, selectedParty, defaultBankAcc);
      const fileName = `${invoice.number.replace(/[\/\\]/g, '_')}.pdf`;
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // Direct Send PDF file (no links sent!)
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: `${invoice.number}.pdf`,
          });
        } catch (err: any) {
          if (err?.name !== 'AbortError') {
            doc.save(fileName);
          }
        }
      } else {
        doc.save(fileName);
        alert(`Bill PDF (${fileName}) downloaded directly. You can now send or attach the PDF directly without any web link.`);
      }
    }

    if (andNew) {
      setSaveSuccessMsg(`Saved ${invoice.number}! Ready for next.`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      setInvoiceNumber(generateNextNumber(type));
      setLines([]);
      setIsManualPaidAmount(false);
      handleAddLine();
    } else {
      closeInvoiceScreen();
    }
  };

  const isSale = type === 'SALE' || type === 'SALE_RETURN';
  const balanceDue = Math.max(0, totals.grandTotalPaise - rupeesToPaise(parseFloat(paidAmountStr) || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-floating border border-border flex flex-col max-h-[96vh] animate-in fade-in zoom-in-95 duration-200">
        {/* HEADER BAR */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-surface-subtle/50 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${
                isSale ? 'bg-moneyIn' : 'bg-moneyOut'
              }`}
            >
              {isSale ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-primary">
                  {type === 'SALE'
                    ? 'Add Sale'
                    : type === 'PURCHASE'
                    ? 'Add Purchase'
                    : type === 'SALE_RETURN'
                    ? 'Sale Return'
                    : 'Purchase Return'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary-light text-primary">
                  {activeFY}
                </span>
              </div>
              <p className="text-xs text-slate-secondary">
                {isSale ? 'Customer Tax Invoice & Money In' : 'Supplier Bill & Stock Inward'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* With GST / Without GST Toggle */}
            <div className="flex items-center bg-white border border-border rounded-xl p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setWithGst(true)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  withGst ? 'bg-primary text-white shadow-xs' : 'text-slate-secondary hover:text-slate-primary'
                }`}
              >
                With GST
              </button>
              <button
                type="button"
                onClick={() => setWithGst(false)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  !withGst ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-secondary hover:text-slate-primary'
                }`}
              >
                Without GST
              </button>
            </div>

            <button
              type="button"
              onClick={closeInvoiceScreen}
              className="w-9 h-9 rounded-full bg-white hover:bg-surface-subtle text-slate-secondary flex items-center justify-center border border-border shadow-xs transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* NOTIFICATIONS & WARNINGS */}
        {saveSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-2.5 text-xs text-emerald-800 font-bold flex items-center gap-2 px-6">
            <Check size={16} className="text-emerald-600" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {stockWarnings.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 p-2.5 text-xs text-amber-900 font-medium flex items-start gap-2 px-6">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Stock Advisory: </span>
              {stockWarnings.join(' ')}
            </div>
          </div>
        )}

        {/* SCROLLABLE FORM BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* SECTION 1: HEADER DETAILS (Party, Number, Dates, State) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-surface-subtle/40 p-4 rounded-2xl border border-border">
            {/* Party Picker */}
            <div className="sm:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-primary">
                  {isSale ? 'Customer' : 'Supplier'} <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleImportContactsForInvoice}
                    className="text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition-all"
                    title="Import Saved Contacts from Mobile Phone"
                  >
                    <BookUser size={13} />
                    <span>Phone Contacts</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQuickPartyModal(true)}
                    className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"
                  >
                    <UserPlus size={13} />
                    <span>+ Quick Add</span>
                  </button>
                </div>
              </div>

              {/* Instant Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-secondary" />
                <input
                  type="text"
                  placeholder="Filter party by name or mobile number..."
                  value={partySearchTerm}
                  onChange={(e) => setPartySearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-white text-xs font-semibold text-slate-primary focus:outline-none focus:border-primary shadow-xs"
                />
              </div>

              <select
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-border bg-white text-xs font-semibold text-slate-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select Party</option>
                {parties
                  .filter((p) => !p.isDeleted)
                  .filter((p) => {
                    if (!partySearchTerm.trim()) return true;
                    const q = partySearchTerm.toLowerCase();
                    return p.name.toLowerCase().includes(q) || (p.phone && p.phone.includes(q));
                  })
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.phone ? `(+91 ${p.phone})` : ''} • {p.type}
                    </option>
                  ))}
              </select>
              {selectedParty && (
                <div className="text-[11px] text-slate-secondary flex items-center justify-between px-1">
                  <span>{selectedParty.state || 'State: Not specified'}</span>
                  <span>
                    Balance: {selectedParty.openingType === 'RECEIVABLE' ? "You'll get" : "You'll give"}{' '}
                    {formatINR(selectedParty.openingBalance)}
                  </span>
                </div>
              )}
            </div>

            {/* Invoice Number */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-primary">
                {isSale ? 'Invoice No.' : 'Bill No.'}
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-border bg-white text-sm font-semibold text-slate-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="INV-001"
              />
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-primary">Invoice Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-border bg-white text-sm font-semibold text-slate-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* State of Supply (decides CGST+SGST vs IGST) */}
            {withGst && (
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-primary">
                  State of Supply (Place of Supply)
                </label>
                <select
                  value={stateOfSupply}
                  onChange={(e) => setStateOfSupply(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-border bg-white text-sm font-semibold text-slate-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s.code} value={s.label}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-secondary px-1 block">
                  {isInterState ? '⚡ Inter-state (IGST applied)' : '✓ Intra-state (CGST + SGST applied)'}
                </span>
              </div>
            )}

            {/* Due Date */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-primary">Payment Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-border bg-white text-sm font-semibold text-slate-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* SECTION 3: ITEM ROWS (UNLIMITED) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-primary">Items & Services</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickItemModal(true)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-primary bg-primary-light hover:bg-primary-light/80 flex items-center gap-1 transition-all"
                >
                  <PackagePlus size={13} />
                  <span>+ New Item Master</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddLine()}
                  className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-primary hover:bg-primary-hover flex items-center gap-1 transition-all shadow-xs"
                >
                  <Plus size={13} />
                  <span>+ Add Row</span>
                </button>
              </div>
            </div>

            {lines.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-border rounded-2xl text-center space-y-2">
                <Receipt className="mx-auto text-slate-muted" size={32} />
                <p className="text-xs font-semibold text-slate-secondary">No item rows added yet</p>
                <button
                  type="button"
                  onClick={() => handleAddLine()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white"
                >
                  Add First Item
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {lines.map((line, idx) => {
                  const it = items.find((i) => i.id === line.itemId);
                  const isStockLow = it && it.currentStock <= (it.minStock || 0);

                  const filteredSavedItems = items
                    .filter((i) => !i.isDeleted)
                    .filter((i) => {
                      if (!line.itemName.trim()) return true;
                      return i.name.toLowerCase().includes(line.itemName.toLowerCase());
                    });

                  return (
                    <div
                      key={line.id}
                      className="p-3 sm:p-3.5 rounded-2xl border border-border bg-white shadow-xs space-y-2.5"
                    >
                      {/* Top Row: Row #, Item Name & Dropdown, Product/Service badge, Delete */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 relative">
                          <span className="w-6 h-6 rounded-lg bg-surface-subtle text-slate-primary font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>

                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={line.itemName}
                              placeholder="Type or search item / service name..."
                              onFocus={() => setActiveDropdownLineId(line.id)}
                              onChange={(e) => {
                                handleUpdateLine(line.id, { itemName: e.target.value });
                                setActiveDropdownLineId(line.id);
                              }}
                              className="w-full h-9 px-3 rounded-xl border border-border bg-white text-sm sm:text-base font-bold text-slate-primary focus:outline-none focus:border-primary shadow-xs"
                            />

                            {/* Searchable Dropdown for Saved Items & Services */}
                            {activeDropdownLineId === line.id && (
                              <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white rounded-xl shadow-floating border border-border max-h-52 overflow-y-auto divide-y divide-border animate-in fade-in duration-100">
                                {filteredSavedItems.length > 0 && (
                                  <div className="p-1 bg-surface-subtle text-[10px] font-bold text-slate-secondary uppercase px-2">
                                    Saved Items & Services ({filteredSavedItems.length})
                                  </div>
                                )}

                                {filteredSavedItems.map((savedItem) => (
                                  <div
                                    key={savedItem.id}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      handleSelectSavedItem(line.id, savedItem);
                                    }}
                                    className="p-2 sm:p-2.5 hover:bg-surface-subtle cursor-pointer flex items-center justify-between text-xs transition-colors"
                                  >
                                    <div>
                                      <span className="font-bold text-slate-primary block leading-tight">
                                        {savedItem.name}
                                      </span>
                                      <span className="text-[10px] text-slate-secondary">
                                        {savedItem.itemType || 'PRODUCT'} • Stock: {savedItem.currentStock} {savedItem.unit}
                                      </span>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <span className="font-bold text-primary block">
                                        ₹{paiseToRupees(type === 'SALE' ? savedItem.salePrice : savedItem.purchasePrice).toFixed(2)}
                                      </span>
                                      <span className="text-[10px] text-slate-secondary">
                                        per {savedItem.unit}
                                      </span>
                                    </div>
                                  </div>
                                ))}

                                {line.itemName.trim() &&
                                  !items.some(
                                    (i) =>
                                      !i.isDeleted &&
                                      i.name.trim().toLowerCase() === line.itemName.trim().toLowerCase()
                                  ) && (
                                    <div
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        setActiveDropdownLineId(null);
                                      }}
                                      className="p-2.5 bg-blue-50/70 hover:bg-blue-100/70 text-blue-700 cursor-pointer flex items-center justify-between text-xs font-bold"
                                    >
                                      <span>+ Auto-save new item: "{line.itemName.trim()}"</span>
                                      <span className="text-[10px] font-normal text-blue-600">Saved on submit</span>
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>

                          {/* Product vs Service Distinction Badge */}
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateLine(line.id, {
                                itemType: line.itemType === 'SERVICE' ? 'PRODUCT' : 'SERVICE',
                              })
                            }
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex-shrink-0 ${
                              line.itemType === 'SERVICE'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                            title="Click to toggle between Product and Service"
                          >
                            {line.itemType || 'PRODUCT'}
                          </button>
                        </div>

                        {line.hsn && (
                          <span className="text-[11px] text-slate-secondary hidden sm:inline">
                            HSN: {line.hsn}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveLine(line.id)}
                          className="p-1.5 rounded-lg text-slate-muted hover:text-rose-600 hover:bg-rose-50 transition-colors flex-shrink-0"
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Compact Inputs Row: Qty, Unit, Rate, Discount, GST, Row Total */}
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1 border-t border-border/60 items-end">
                        {/* Decimal Quantity */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-secondary uppercase">
                            Qty (e.g. 0.5)
                          </label>
                          <input
                            type="number"
                            min="0.0001"
                            step="any"
                            inputMode="decimal"
                            value={line.qty}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              handleUpdateLine(line.id, { qty: isNaN(val) ? 0 : val });
                            }}
                            className="w-full h-8 px-2 rounded-lg border border-border bg-white text-xs font-bold text-center focus:outline-none focus:border-primary"
                          />
                        </div>

                        {/* Unit Selector */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-secondary uppercase">Unit</label>
                          <select
                            value={line.unit}
                            onChange={(e) => handleUpdateLine(line.id, { unit: e.target.value as UnitType })}
                            className="w-full h-8 px-2 rounded-lg border border-border bg-white text-xs font-semibold focus:outline-none focus:border-primary"
                          >
                            {UNIT_OPTIONS.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Unit Rate */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-secondary uppercase">
                            Rate (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            inputMode="decimal"
                            value={paiseToRupees(line.rate)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              handleUpdateLine(line.id, { rate: isNaN(val) ? 0 : rupeesToPaise(val) });
                            }}
                            className="w-full h-8 px-2 rounded-lg border border-border bg-white text-xs font-bold focus:outline-none focus:border-primary"
                          />
                        </div>

                        {/* Discount */}
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-secondary uppercase">Disc</label>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateLine(line.id, {
                                  discountType: line.discountType === 'FLAT' ? 'PERCENT' : 'FLAT',
                                })
                              }
                              className="text-[9px] text-primary font-bold hover:underline"
                            >
                              {line.discountType === 'FLAT' ? '₹ Flat' : '% Pct'}
                            </button>
                          </div>
                          {line.discountType === 'FLAT' ? (
                            <input
                              type="number"
                              min="0"
                              step="any"
                              inputMode="decimal"
                              value={paiseToRupees(line.discountAmount || 0)}
                              onChange={(e) =>
                                handleUpdateLine(line.id, {
                                  discountAmount: rupeesToPaise(parseFloat(e.target.value) || 0),
                                })
                              }
                              className="w-full h-8 px-2 rounded-lg border border-border bg-white text-xs font-bold focus:outline-none focus:border-primary"
                              placeholder="₹ disc"
                            />
                          ) : (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="any"
                              inputMode="decimal"
                              value={line.discountPercent || ''}
                              onChange={(e) =>
                                handleUpdateLine(line.id, {
                                  discountPercent: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full h-8 px-2 rounded-lg border border-border bg-white text-xs font-bold focus:outline-none focus:border-primary"
                              placeholder="% disc"
                            />
                          )}
                        </div>

                        {/* GST % (if with GST) */}
                        {withGst ? (
                          <div className="space-y-0.5">
                            <label className="text-[10px] font-bold text-slate-secondary uppercase">GST %</label>
                            <select
                              value={line.taxPercent}
                              onChange={(e) =>
                                handleUpdateLine(line.id, { taxPercent: parseFloat(e.target.value) || 0 })
                              }
                              className="w-full h-8 px-2 rounded-lg border border-border bg-white text-xs font-bold focus:outline-none focus:border-primary"
                            >
                              {[0, 0.25, 3, 5, 12, 18, 28].map((pct) => (
                                <option key={pct} value={pct}>
                                  {pct}%
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="hidden sm:block" />
                        )}

                        {/* Line Total */}
                        <div className="space-y-0.5 text-right">
                          <span className="text-[10px] text-slate-secondary uppercase tracking-wider font-bold block">
                            Total
                          </span>
                          <span className="text-xs sm:text-sm font-extrabold text-slate-primary tabular-nums block h-8 flex items-center justify-end">
                            {formatINR(line.amount)}
                          </span>
                        </div>
                      </div>

                      {/* Tax Included / Excluded Switch */}
                      {withGst && (
                        <div className="flex items-center justify-between text-[11px] text-slate-secondary pt-1 border-t border-border/40">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={line.taxIncluded || false}
                              onChange={(e) => handleUpdateLine(line.id, { taxIncluded: e.target.checked })}
                              className="w-3.5 h-3.5 rounded text-primary focus:ring-primary"
                            />
                            <span>Rate includes GST (tax-inclusive)</span>
                          </label>

                          <div className="flex items-center gap-3 text-[10px]">
                            <span>Taxable: {formatINR(line.taxableAmount || 0)}</span>
                            {isInterState ? (
                              <span>IGST: {formatINR(line.igst || 0)}</span>
                            ) : (
                              <span>
                                CGST: {formatINR(line.cgst || 0)} | SGST: {formatINR(line.sgst || 0)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            )}
          </div>

          {/* SECTION 4: FOOTER TOTALS & PAYMENT SETTINGS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
            {/* Left: Notes, Terms, Extra Charges */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-primary">Additional Charges (Transport, Packing ₹)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={extraChargesStr}
                  onChange={(e) => setExtraChargesStr(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-white text-sm font-semibold"
                  placeholder="0"
                />
              </div>
            </div>


            {/* Right: Calculations breakdown card */}
            <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-2.5">
              <div className="flex justify-between text-xs text-slate-secondary">
                <span>Subtotal (Items)</span>
                <span className="font-semibold text-slate-primary">{formatINR(totals.subtotalPaise)}</span>
              </div>

              {totals.discountTotalPaise > 0 && (
                <div className="flex justify-between text-xs text-slate-secondary">
                  <span>Total Discount</span>
                  <span className="font-semibold text-rose-600">−{formatINR(totals.discountTotalPaise)}</span>
                </div>
              )}

              {withGst && (
                <>
                  <div className="flex justify-between text-xs text-slate-secondary">
                    <span>Taxable Amount</span>
                    <span className="font-semibold text-slate-primary">{formatINR(totals.taxableAmountPaise)}</span>
                  </div>
                  {isInterState ? (
                    <div className="flex justify-between text-xs text-slate-secondary">
                      <span>IGST (Integrated Tax)</span>
                      <span className="font-semibold text-slate-primary">+{formatINR(totals.igstTotalPaise)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-xs text-slate-secondary">
                        <span>CGST (Central Tax)</span>
                        <span className="font-semibold text-slate-primary">+{formatINR(totals.cgstTotalPaise)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-secondary">
                        <span>SGST (State Tax)</span>
                        <span className="font-semibold text-slate-primary">+{formatINR(totals.sgstTotalPaise)}</span>
                      </div>
                    </>
                  )}
                </>
              )}

              {extraChargesPaise > 0 && (
                <div className="flex justify-between text-xs text-slate-secondary">
                  <span>Additional Charges</span>
                  <span className="font-semibold text-slate-primary">+{formatINR(extraChargesPaise)}</span>
                </div>
              )}

              {totals.roundOffPaise !== 0 && (
                <div className="flex justify-between text-xs text-slate-secondary">
                  <span>Round Off</span>
                  <span className="font-semibold text-slate-primary">
                    {totals.roundOffPaise > 0 ? '+' : '−'}
                    {formatINR(Math.abs(totals.roundOffPaise))}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-border flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-primary">Grand Total</span>
                <span className="text-xl font-extrabold text-primary">{formatINR(totals.grandTotalPaise)}</span>
              </div>

              {/* Payment Type Selection */}
              <div className="pt-3 border-t border-border space-y-2">
                <label className="text-xs font-bold text-slate-primary block">Payment Method</label>
                <div className="grid grid-cols-5 gap-1">
                  {(['CASH', 'BANK', 'UPI', 'CHEQUE', 'CREDIT'] as InvoicePaymentType[]).map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => {
                        setPaymentType(pm);
                        setIsManualPaidAmount(false);
                      }}
                      className={`py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                        paymentType === pm
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-white text-slate-secondary border-border hover:border-slate-muted'
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>

                {/* Account Picker if Bank/UPI/Cheque */}
                {paymentType !== 'CASH' && paymentType !== 'CREDIT' && (
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-semibold text-slate-secondary">Deposit / Pay via Account</label>
                    <select
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-xl border border-border bg-white text-xs font-semibold"
                    >
                      {accounts
                        .filter((a) => a.type === 'BANK')
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.bankName || a.nickname} ({a.accountNumberMasked || 'Primary'})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Amount Paid Now */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-secondary">
                      {isSale ? 'Received Now (₹)' : 'Paid Now (₹)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={paidAmountStr}
                      onChange={(e) => {
                        setPaidAmountStr(e.target.value);
                        setIsManualPaidAmount(true);
                      }}
                      className="w-full h-9 px-2.5 rounded-xl border border-border bg-white text-xs font-bold text-slate-primary"
                    />
                  </div>

                  <div className="space-y-1 flex flex-col justify-end text-right">
                    <span className="text-[10px] text-slate-secondary font-bold uppercase">Balance Due</span>
                    <span
                      className={`text-sm font-extrabold ${
                        balanceDue > 0 ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {formatINR(balanceDue)}
                    </span>
                  </div>
                </div>

                {balanceDue > 0 && selectedParty && (
                  <span className="text-[10px] text-amber-700 block bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                    ℹ Unpaid balance of {formatINR(balanceDue)} will be posted to {selectedParty.name}'s ledger.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="p-4 border-t border-border bg-white rounded-b-3xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-secondary font-semibold">
            <span>Total: </span>
            <span className="text-base font-extrabold text-slate-primary">{formatINR(totals.grandTotalPaise)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave(true, false)}
              className="px-3.5 py-2.5 rounded-xl border border-border hover:bg-surface-subtle text-slate-primary font-bold text-xs transition-all active:scale-95"
            >
              Save & New
            </button>

            <button
              type="button"
              onClick={() => handleSave(false, true)}
              className="px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-primary border border-indigo-200 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Download size={14} />
              <span>Save & Share PDF</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(false, false)}
              className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-md ${
                isSale ? 'bg-moneyIn hover:bg-moneyIn-hover' : 'bg-moneyOut hover:bg-moneyOut-hover'
              }`}
            >
              <Check size={16} />
              <span>Save {isSale ? 'Sale' : 'Purchase'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK ADD PARTY INLINE MODAL */}
      {showQuickPartyModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-elevated border border-border space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h4 className="text-sm font-bold text-slate-primary">
                + Quick Add {isSale ? 'Customer' : 'Supplier'}
              </h4>
              <button
                type="button"
                onClick={() => setShowQuickPartyModal(false)}
                className="p-1 rounded-full text-slate-muted hover:text-slate-primary"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <button
                type="button"
                onClick={handlePickSinglePhoneContact}
                className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs"
              >
                <BookUser size={15} />
                <span>Auto-Fill from Phone Contacts</span>
              </button>

              <div className="space-y-1">
                <label className="font-bold text-slate-primary">Party Name *</label>
                <input
                  type="text"
                  value={newPartyName}
                  onChange={(e) => setNewPartyName(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-border bg-white"
                  placeholder="e.g. Sharma Traders"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-primary">Mobile Number</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={newPartyPhone}
                  onChange={(e) => setNewPartyPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-9 px-3 rounded-xl border border-border bg-white"
                  placeholder="10-digit mobile"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-primary">State</label>
                <select
                  value={newPartyState}
                  onChange={(e) => setNewPartyState(e.target.value)}
                  className="w-full h-9 px-2 rounded-xl border border-border bg-white"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s.code} value={s.label}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-primary">GSTIN (Optional)</label>
                <input
                  type="text"
                  maxLength={15}
                  value={newPartyGstin}
                  onChange={(e) => setNewPartyGstin(e.target.value.toUpperCase())}
                  className="w-full h-9 px-3 rounded-xl border border-border bg-white uppercase"
                  placeholder="24ABCDE1234F1Z5"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-primary">Opening Balance (₹)</label>
                <input
                  type="number"
                  value={newPartyOpeningBal}
                  onChange={(e) => setNewPartyOpeningBal(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-border bg-white"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowQuickPartyModal(false)}
                className="px-3 py-2 rounded-xl border border-border text-xs font-bold text-slate-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuickParty}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
              >
                Add Party
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD ITEM INLINE MODAL */}
      {showQuickItemModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-elevated border border-border space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h4 className="text-sm font-bold text-slate-primary">+ Quick Add Item Master</h4>
              <button
                type="button"
                onClick={() => setShowQuickItemModal(false)}
                className="p-1 rounded-full text-slate-muted hover:text-slate-primary"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-primary">Item Name *</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-border bg-white"
                  placeholder="e.g. Basmati Rice 5kg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-primary">Unit</label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value as UnitType)}
                    className="w-full h-9 px-2 rounded-xl border border-border bg-white"
                  >
                    {['pcs', 'kg', 'litre', 'box', 'meter', 'packet', 'dozen'].map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-primary">HSN / SAC</label>
                  <input
                    type="text"
                    value={newItemHsn}
                    onChange={(e) => setNewItemHsn(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-white"
                    placeholder="e.g. 1006"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-primary">Sale Price (₹)</label>
                  <input
                    type="number"
                    value={newItemSalePrice}
                    onChange={(e) => setNewItemSalePrice(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-white"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-primary">Purchase Price (₹)</label>
                  <input
                    type="number"
                    value={newItemPurchasePrice}
                    onChange={(e) => setNewItemPurchasePrice(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-white"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-primary">GST Rate (%)</label>
                  <select
                    value={newItemGstPercent}
                    onChange={(e) => setNewItemGstPercent(parseFloat(e.target.value) || 0)}
                    className="w-full h-9 px-2 rounded-xl border border-border bg-white"
                  >
                    {[0, 0.25, 3, 5, 12, 18, 28].map((pct) => (
                      <option key={pct} value={pct}>
                        {pct}%
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-primary">Opening Stock</label>
                  <input
                    type="number"
                    value={newItemOpeningStock}
                    onChange={(e) => setNewItemOpeningStock(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-white"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowQuickItemModal(false)}
                className="px-3 py-2 rounded-xl border border-border text-xs font-bold text-slate-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuickItem}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
