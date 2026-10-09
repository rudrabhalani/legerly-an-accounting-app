import React, { useState, useEffect, useRef } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { getTranslation } from '../../i18n/translations';
import { PaymentMode, AccountType } from '../../types';
import { rupeesToPaise, getTodayDateString, getCurrentTimeString, formatINR } from '../../utils/formatters';
import { calculateAccountBalance } from '../../utils/accounting';
import { BankChip, POPULAR_INDIAN_BANKS } from '../common/BankChip';
import { X, Check, ArrowUpRight, Plus, AlertTriangle, Camera } from 'lucide-react';

export const MoneyOutModal: React.FC = () => {
  const isMoneyOutOpen = useLedgerlyStore((state) => state.isMoneyOutOpen);
  const closeMoneyOut = useLedgerlyStore((state) => state.closeMoneyOut);
  const prefilledPartyId = useLedgerlyStore((state) => state.prefilledPartyIdForTxn);
  const accounts = useLedgerlyStore((state) => state.accounts);
  const transactions = useLedgerlyStore((state) => state.transactions);
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
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [category, setCategory] = useState('Purchase');
  const [note, setNote] = useState('');
  const [attachmentName, setAttachmentName] = useState<string | null>(null);

  // Negative Cash Confirmation
  const [showNegativeWarning, setShowNegativeWarning] = useState(false);
  const [pendingSaveAnother, setPendingSaveAnother] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isMoneyOutOpen) {
      setAmountStr('');
      setShowNegativeWarning(false);
      setDate(getTodayDateString());
      setTime(getCurrentTimeString());
      setNote('');
      setAttachmentName(null);
      setCategory('Purchase');

      if (prefilledPartyId) {
        setSelectedPartyId(prefilledPartyId);
      } else {
        setSelectedPartyId('');
      }

      const defaultCash = accounts.find((a) => a.type === 'CASH');
      const defaultBank = accounts.find((a) => a.type === 'BANK');
      if (defaultCash) {
        setAccountType('CASH');
        setSelectedAccountId(defaultCash.id);
        setPaymentMode('CASH');
      } else if (defaultBank) {
        setAccountType('BANK');
        setSelectedAccountId(defaultBank.id);
        setSelectedBankName(defaultBank.bankName || 'SBI');
        setPaymentMode('UPI');
      }

      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }
  }, [isMoneyOutOpen, prefilledPartyId, accounts]);

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
      const firstBank = accounts.find((a) => a.type === 'BANK');
      if (firstBank) setSelectedAccountId(firstBank.id);
    }
  };

  const executeSave = (addAnother: boolean) => {
    const rawVal = parseFloat(amountStr);
    const paise = rupeesToPaise(rawVal);

    let targetAccId = selectedAccountId;
    if (!targetAccId) {
      const fallback = accounts.find((a) => (accountType === 'CASH' ? a.type === 'CASH' : a.type === 'BANK'));
      targetAccId = fallback ? fallback.id : accounts[0].id;
    }

    addTransaction({
      type: 'OUT',
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

    if (addAnother) {
      setAmountStr('');
      setNote('');
      setAttachmentName(null);
      setShowNegativeWarning(false);
      amountInputRef.current?.focus();
    } else {
      closeMoneyOut();
    }
  };

  const handleSave = (addAnother: boolean = false) => {
    const rawVal = parseFloat(amountStr);
    if (isNaN(rawVal) || rawVal <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const paise = rupeesToPaise(rawVal);

    // Negative cash check rule from Section 6
    if (accountType === 'CASH') {
      const cashAcc = accounts.find((a) => a.id === selectedAccountId) || accounts.find((a) => a.type === 'CASH');
      if (cashAcc) {
        const currentCash = calculateAccountBalance(cashAcc, transactions);
        if (currentCash - paise < 0) {
          setPendingSaveAnother(addAnother);
          setShowNegativeWarning(true);
          return;
        }
      }
    }

    executeSave(addAnother);
  };

  if (!isMoneyOutOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs transition-opacity p-0 sm:p-4">
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-floating border border-border animate-in slide-in-from-bottom-5 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-rose-50/50 rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-moneyOut text-white flex items-center justify-center">
              <ArrowUpRight size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base font-bold text-moneyOut-dark">{t.payMoney}</h2>
              <p className="text-xs text-slate-secondary">Record payment going out</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeMoneyOut}
            className="p-1.5 rounded-full hover:bg-slate-200/50 text-slate-secondary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Negative Cash Alert Warning Modal Overlay */}
        {showNegativeWarning ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-warning mx-auto flex items-center justify-center">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-primary">Cash will go below zero!</h3>
              <p className="text-xs text-slate-secondary mt-1">
                Your Cash in Hand does not have enough balance for this payment. Are you sure you want to continue?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowNegativeWarning(false)}
                className="flex-1 h-12 rounded-button bg-surface-subtle border border-border text-slate-primary font-bold text-xs"
              >
                No, Go Back
              </button>
              <button
                type="button"
                onClick={() => executeSave(pendingSaveAnother)}
                className="flex-1 h-12 rounded-button bg-moneyOut hover:bg-moneyOut-hover text-white font-bold text-xs"
              >
                Yes, Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
            {/* 1. HUGE AMOUNT FIELD */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-secondary mb-1.5">
                {t.amount} <span className="text-moneyOut">*</span>
              </label>
              <div className="relative flex items-center bg-surface-subtle border-2 border-rose-500/40 focus-within:border-moneyOut rounded-2xl px-4 py-3 shadow-inner">
                <span className="text-3xl font-extrabold text-moneyOut mr-2">₹</span>
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

            {/* 2. PAID FROM: SEGMENTED CONTROL */}
            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1.5">
                {t.paidFrom}
              </label>
              <div className="grid grid-cols-2 p-1 bg-surface-subtle rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => handleAccountTypeChange('CASH')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    accountType === 'CASH'
                      ? 'bg-white text-moneyOut shadow-sm border border-rose-200'
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

            {/* 2B. BANK PICKER */}
            {accountType === 'BANK' && (
              <div className="space-y-3 p-3 bg-primary-light/40 rounded-2xl border border-primary/20">
                <span className="text-xs font-semibold text-slate-primary block">
                  Select Paying Bank Account
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

            {/* 3. TO (PARTY) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-secondary">
                  {t.toParty}
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
                <option value="">— Select Supplier / Person (Optional) —</option>
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

            {/* 5. CATEGORIES */}
            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1.5">
                {t.category}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Purchase',
                  'Rent',
                  'Salary',
                  'Electricity',
                  'Transport',
                  'Food',
                  'Other expense',
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      category === cat
                        ? 'bg-moneyOut-tint text-moneyOut-dark border-moneyOut font-bold'
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
              <input
                type="text"
                placeholder="e.g. Shop maintenance or goods bill payment"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 rounded-input border border-border bg-surface text-xs text-slate-primary focus:outline-none focus:border-primary"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-slate-secondary">
                <button
                  type="button"
                  onClick={() => setAttachmentName(attachmentName ? null : 'bill-receipt.jpg')}
                  className="flex items-center gap-1.5 text-primary hover:text-primary-hover font-medium"
                >
                  <Camera size={14} />
                  <span>{attachmentName ? 'Receipt Attached (tap to remove)' : t.attachment}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        {!showNegativeWarning && (
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
              className="flex-1 h-12 rounded-button bg-moneyOut hover:bg-moneyOut-hover text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all active:scale-98"
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
