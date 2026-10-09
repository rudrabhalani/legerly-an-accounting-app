import React, { useState, useEffect, useRef } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { getTranslation } from '../../i18n/translations';
import { PaymentMode, AccountType } from '../../types';
import { rupeesToPaise, getTodayDateString, getCurrentTimeString, formatINR } from '../../utils/formatters';
import { BankChip, POPULAR_INDIAN_BANKS } from '../common/BankChip';
import { X, Check, Share2, Plus, ArrowDownLeft, Camera } from 'lucide-react';
import confetti from 'canvas-confetti';

export const MoneyInModal: React.FC = () => {
  const isMoneyInOpen = useLedgerlyStore((state) => state.isMoneyInOpen);
  const closeMoneyIn = useLedgerlyStore((state) => state.closeMoneyIn);
  const prefilledPartyId = useLedgerlyStore((state) => state.prefilledPartyIdForTxn);
  const accounts = useLedgerlyStore((state) => state.accounts);
  const parties = useLedgerlyStore((state) => state.parties);
  const addTransaction = useLedgerlyStore((state) => state.addTransaction);
  const openPartyModal = useLedgerlyStore((state) => state.openPartyModal);
  const language = useLedgerlyStore((state) => state.business.language);
  const t = getTranslation(language);

  // Form State
  const [amountStr, setAmountStr] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('CASH');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedBankName, setSelectedBankName] = useState('SBI');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [category, setCategory] = useState('Sales');
  const [note, setNote] = useState('');
  const [attachmentName, setAttachmentName] = useState<string | null>(null);

  // Success State
  const [isSuccess, setIsSuccess] = useState(false);
  const [savedAmount, setSavedAmount] = useState(0);

  const amountInputRef = useRef<HTMLInputElement>(null);

  // Reset or initialize on open
  useEffect(() => {
    if (isMoneyInOpen) {
      setAmountStr('');
      setIsSuccess(false);
      setDate(getTodayDateString());
      setTime(getCurrentTimeString());
      setNote('');
      setAttachmentName(null);
      setCategory('Sales');

      if (prefilledPartyId) {
        setSelectedPartyId(prefilledPartyId);
      } else {
        setSelectedPartyId('');
      }

      // Default account
      const defaultCash = accounts.find((a) => a.type === 'CASH');
      const defaultBank = accounts.find((a) => a.type === 'BANK');
      if (defaultCash) {
        setAccountType('CASH');
        setSelectedAccountId(defaultCash.id);
      } else if (defaultBank) {
        setAccountType('BANK');
        setSelectedAccountId(defaultBank.id);
        setSelectedBankName(defaultBank.bankName || 'SBI');
      }

      // Autofocus
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }
  }, [isMoneyInOpen, prefilledPartyId, accounts]);

  // Handle bank type toggle
  const handleAccountTypeChange = (type: AccountType) => {
    setAccountType(type);
    if (type === 'CASH') {
      const cash = accounts.find((a) => a.type === 'CASH');
      if (cash) setSelectedAccountId(cash.id);
      setPaymentMode('CASH');
    } else {
      const bank = accounts.find((a) => a.type === 'BANK');
      if (bank) {
        setSelectedAccountId(bank.id);
        setSelectedBankName(bank.bankName || 'SBI');
      }
      setPaymentMode('UPI');
    }
  };

  const handleSelectBankChip = (bName: string) => {
    setSelectedBankName(bName);
    const matchedAccount = accounts.find((a) => a.type === 'BANK' && a.bankName === bName);
    if (matchedAccount) {
      setSelectedAccountId(matchedAccount.id);
    } else {
      // Find any bank or default
      const firstBank = accounts.find((a) => a.type === 'BANK');
      if (firstBank) setSelectedAccountId(firstBank.id);
    }
  };

  const handleSave = (addAnother: boolean = false) => {
    const rawVal = parseFloat(amountStr);
    if (isNaN(rawVal) || rawVal <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const paise = rupeesToPaise(rawVal);

    // Determine accountId
    let targetAccId = selectedAccountId;
    if (!targetAccId) {
      const fallback = accounts.find((a) => (accountType === 'CASH' ? a.type === 'CASH' : a.type === 'BANK'));
      targetAccId = fallback ? fallback.id : accounts[0].id;
    }

    addTransaction({
      type: 'IN',
      amount: paise,
      accountId: targetAccId,
      partyId: selectedPartyId || undefined,
      mode: paymentMode,
      category,
      date,
      time,
      note: note.trim() || undefined,
      attachmentUrl: attachmentName || undefined,
    });

    setSavedAmount(paise);
    setIsSuccess(true);

    // Micro celebratory confetti
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#16A34A', '#22C55E', '#4F46E5', '#6366F1'],
      });
    } catch {
      // Ignore if confetti context not ready
    }

    if (addAnother) {
      setTimeout(() => {
        setIsSuccess(false);
        setAmountStr('');
        setNote('');
        setAttachmentName(null);
        amountInputRef.current?.focus();
      }, 700);
    }
  };

  const handleShareWhatsApp = () => {
    const partyObj = parties.find((p) => p.id === selectedPartyId);
    const msg = `Payment Confirmation: Received ₹${amountStr} via ${paymentMode} on ${date}. Thank you! - Sharma Kirana`;
    const phone = partyObj?.phone ? `91${partyObj.phone}` : '';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (!isMoneyInOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs transition-opacity p-0 sm:p-4">
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-floating border border-border animate-in slide-in-from-bottom-5 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-emerald-50/50 rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-moneyIn text-white flex items-center justify-center">
              <ArrowDownLeft size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base font-bold text-moneyIn-dark">{t.receiveMoney}</h2>
              <p className="text-xs text-slate-secondary">Record payment coming in</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeMoneyIn}
            className="p-1.5 rounded-full hover:bg-slate-200/50 text-slate-secondary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content / Form */}
        {!isSuccess ? (
          <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
            {/* 1. HUGE NUMERIC AMOUNT FIELD */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-secondary mb-1.5">
                {t.amount} <span className="text-moneyIn">*</span>
              </label>
              <div className="relative flex items-center bg-surface-subtle border-2 border-emerald-500/40 focus-within:border-moneyIn rounded-2xl px-4 py-3 shadow-inner">
                <span className="text-3xl font-extrabold text-moneyIn mr-2">₹</span>
                <input
                  ref={amountInputRef}
                  type="number"
                  inputMode="decimal"
                  step="any"
                  placeholder="0"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="w-full bg-transparent text-3xl font-extrabold text-slate-primary focus:outline-none tabular-nums placeholder:text-slate-muted"
                />
              </div>
            </div>

            {/* 2. RECEIVED IN: SEGMENTED CONTROL [ CASH | BANK ] */}
            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1.5">
                {t.receivedIn}
              </label>
              <div className="grid grid-cols-2 p-1 bg-surface-subtle rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => handleAccountTypeChange('CASH')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    accountType === 'CASH'
                      ? 'bg-white text-moneyIn shadow-sm border border-emerald-200'
                      : 'text-slate-secondary hover:text-slate-primary'
                  }`}
                >
                  💵 {t.cash}
                </button>
                <button
                  type="button"
                  onClick={() => handleAccountTypeChange('BANK')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    accountType === 'BANK'
                      ? 'bg-white text-primary shadow-sm border border-indigo-200'
                      : 'text-slate-secondary hover:text-slate-primary'
                  }`}
                >
                  🏦 {t.bank}
                </button>
              </div>
            </div>

            {/* 2B. IF BANK SELECTED: BANK PICKER CHIPS */}
            {accountType === 'BANK' && (
              <div className="space-y-3 p-3 bg-primary-light/40 rounded-2xl border border-primary/20">
                <span className="text-xs font-semibold text-slate-primary block">
                  Select Receiving Bank Account
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {POPULAR_INDIAN_BANKS.map((bName) => (
                    <BankChip
                      key={bName}
                      name={bName}
                      selected={selectedBankName === bName}
                      onClick={() => handleSelectBankChip(bName)}
                    />
                  ))}
                </div>

                {/* PAYMENT MODE CHIPS (UPI, NEFT/RTGS, IMPS, Cheque, Card) */}
                <div>
                  <span className="text-xs font-semibold text-slate-secondary block mb-1.5">
                    {t.paymentMode}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(['UPI', 'NEFT_RTGS', 'IMPS', 'CHEQUE', 'CARD'] as PaymentMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMode(mode)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          paymentMode === mode
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-white text-slate-primary border-border hover:border-slate-muted'
                        }`}
                      >
                        {mode.replace('_', ' / ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. FROM (PARTY) SEARCHABLE DROPDOWN WITH INLINE ADD */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-secondary">
                  {t.fromParty}
                </label>
                <button
                  type="button"
                  onClick={() => openPartyModal()}
                  className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1"
                >
                  <Plus size={14} /> Add new party
                </button>
              </div>
              <select
                value={selectedPartyId}
                onChange={(e) => setSelectedPartyId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-input bg-surface border border-border text-slate-primary text-sm font-medium focus:outline-none focus:border-primary shadow-xs"
              >
                <option value="">— Select Customer (Optional) —</option>
                {parties
                  .filter((p) => !p.isDeleted)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.phone ? `(${p.phone})` : ''}
                    </option>
                  ))}
              </select>
            </div>

            {/* 4. DATE & TIME */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-secondary mb-1">
                  {t.date}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-input border border-border bg-surface text-xs font-medium text-slate-primary focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-secondary mb-1">
                  {t.time}
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-input border border-border bg-surface text-xs font-medium text-slate-primary focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* 5. CATEGORY CHIPS */}
            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1.5">
                {t.category}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['Sales', 'Payment received', 'Loan', 'Capital', 'Other'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      category === cat
                        ? 'bg-moneyIn-tint text-moneyIn-dark border-moneyIn font-bold'
                        : 'bg-surface-subtle text-slate-primary border-border hover:bg-slate-200/50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. NOTE & ATTACHMENT */}
            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">
                {t.notes}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Festival wholesale grocery order"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-input border border-border bg-surface text-xs text-slate-primary focus:outline-none focus:border-primary"
                />
              </div>

              {/* Fake photo attach toggle */}
              <div className="mt-2 flex items-center justify-between text-xs text-slate-secondary">
                <button
                  type="button"
                  onClick={() => setAttachmentName(attachmentName ? null : 'receipt-img.jpg')}
                  className="flex items-center gap-1.5 text-primary hover:text-primary-hover font-medium"
                >
                  <Camera size={14} />
                  <span>{attachmentName ? 'Receipt Attached (tap to remove)' : t.attachment}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* SUCCESS SCREEN AFTER SAVE */
          <div className="px-6 py-10 flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-moneyIn-tint border-4 border-moneyIn flex items-center justify-center text-moneyIn animate-bounce">
              <Check size={44} strokeWidth={3} />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-primary">Money In Recorded!</h3>
              <p className="text-sm font-semibold text-moneyIn mt-1">
                +{formatINR(savedAmount)} added successfully
              </p>
              <p className="text-xs text-slate-secondary mt-1">
                Ledger and bank balances updated instantly.
              </p>
            </div>

            <div className="w-full pt-4 space-y-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full h-12 rounded-button bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Share2 size={18} />
                <span>Share Receipt on WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => handleSave(true)}
                className="w-full h-12 rounded-button bg-primary-light hover:bg-indigo-100 text-primary font-bold text-sm transition-all"
              >
                {t.saveAndAddAnother}
              </button>

              <button
                type="button"
                onClick={closeMoneyIn}
                className="w-full h-10 rounded-button text-slate-secondary hover:text-slate-primary font-semibold text-xs transition-all"
              >
                Done / Close
              </button>
            </div>
          </div>
        )}

        {/* MODAL FOOTER BUTTONS (SAVE) */}
        {!isSuccess && (
          <div className="p-4 border-t border-border bg-surface-subtle rounded-b-3xl flex gap-3">
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="flex-1 h-12 rounded-button bg-white border border-border text-slate-primary font-bold text-xs hover:bg-slate-100 transition-all active:scale-98"
            >
              {t.saveAndAddAnother}
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="flex-1 h-12 rounded-button bg-moneyIn hover:bg-moneyIn-hover text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Check size={18} strokeWidth={2.5} />
              <span>{t.save}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
