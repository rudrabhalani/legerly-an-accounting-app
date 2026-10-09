import React, { useState, useEffect } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { PaymentMode } from '../../types';
import { rupeesToPaise, paiseToRupees, getTodayDateString, formatINR } from '../../utils/formatters';
import { X, ArrowDownLeft, ArrowUpRight, Check, Building2, Wallet } from 'lucide-react';
import confetti from 'canvas-confetti';

export const PaymentInOutModal: React.FC = () => {
  const isPaymentInOpen = useLedgerlyStore((state) => state.isPaymentInOpen);
  const isPaymentOutOpen = useLedgerlyStore((state) => state.isPaymentOutOpen);
  const closePaymentIn = useLedgerlyStore((state) => state.closePaymentIn);
  const closePaymentOut = useLedgerlyStore((state) => state.closePaymentOut);
  const prefilledPartyId = useLedgerlyStore((state) => state.prefilledPartyIdForTxn);

  const parties = useLedgerlyStore((state) => state.parties);
  const accounts = useLedgerlyStore((state) => state.accounts);
  const invoices = useLedgerlyStore((state) => state.invoices);
  const addPayment = useLedgerlyStore((state) => state.addPayment);
  const canEditDelete = useLedgerlyStore((state) => state.canCurrentUserEditDelete());

  const isOpen = isPaymentInOpen || isPaymentOutOpen;
  const isPaymentIn = isPaymentInOpen;

  const [partyId, setPartyId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [mode, setMode] = useState<PaymentMode>('UPI');
  const [accountType, setAccountType] = useState<'CASH' | 'BANK'>('BANK');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [note, setNote] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPartyId(prefilledPartyId || parties[0]?.id || '');
      setAmountStr('');
      setDate(getTodayDateString());
      setNote('');
      setSelectedInvoiceId('');

      const defaultCash = accounts.find((a) => a.type === 'CASH');
      const defaultBank = accounts.find((a) => a.type === 'BANK');
      if (defaultBank) {
        setAccountType('BANK');
        setSelectedAccountId(defaultBank.id);
        setMode('UPI');
      } else if (defaultCash) {
        setAccountType('CASH');
        setSelectedAccountId(defaultCash.id);
        setMode('CASH');
      }
    }
  }, [isOpen, prefilledPartyId]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isPaymentIn) closePaymentIn();
    else closePaymentOut();
  };

  const selectedParty = parties.find((p) => p.id === partyId);

  // Unpaid invoices for this party
  const pendingInvoices = invoices.filter(
    (i) =>
      !i.isDeleted &&
      i.partyId === partyId &&
      i.paidAmount < i.total &&
      (isPaymentIn ? i.type === 'SALE' : i.type === 'PURCHASE')
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditDelete) {
      alert('Viewers cannot record payments.');
      return;
    }

    const amtPaise = rupeesToPaise(parseFloat(amountStr) || 0);
    if (amtPaise <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    if (!partyId) {
      alert('Please select a party.');
      return;
    }

    let accId = selectedAccountId;
    if (!accId) {
      const acc = accounts.find((a) => a.type === accountType);
      accId = acc?.id || accounts[0]?.id || '';
    }

    addPayment({
      direction: isPaymentIn ? 'IN' : 'OUT',
      partyId,
      amountPaise: amtPaise,
      mode: accountType === 'CASH' ? 'CASH' : mode,
      accountId: accId,
      date,
      note: note.trim() || undefined,
      invoiceId: selectedInvoiceId || undefined,
    });

    confetti({ particleCount: 30, spread: 50 });
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-floating border border-border animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${
                isPaymentIn ? 'bg-moneyIn' : 'bg-moneyOut'
              }`}
            >
              {isPaymentIn ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-primary">
                {isPaymentIn ? 'Payment In (Receive Money)' : 'Payment Out (Pay Money)'}
              </h3>
              <p className="text-xs text-slate-secondary">
                {isPaymentIn ? 'Record customer settlement' : 'Record supplier payout'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-surface-subtle text-slate-secondary flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Party Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-primary">Party *</label>
            <select
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-border bg-white text-sm font-semibold"
            >
              {parties
                .filter((p) => !p.isDeleted)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.phone || 'No phone'})
                  </option>
                ))}
            </select>
            {selectedParty && (
              <span className="text-[11px] text-slate-secondary block px-1">
                Current Balance:{' '}
                {selectedParty.openingType === 'RECEIVABLE' ? "You'll get" : "You'll give"}{' '}
                {formatINR(selectedParty.openingBalance)}
              </span>
            )}
          </div>

          {/* Amount (Big touch target) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-primary">Amount (₹) *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-secondary">
                ₹
              </span>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                autoFocus
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full h-12 pl-8 pr-4 rounded-xl border border-border bg-white text-xl font-bold text-slate-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Deposit Into / Paid From (Cash or Bank) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-primary">
              {isPaymentIn ? 'Received in' : 'Paid from'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAccountType('CASH');
                  const cashAcc = accounts.find((a) => a.type === 'CASH');
                  if (cashAcc) setSelectedAccountId(cashAcc.id);
                  setMode('CASH');
                }}
                className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  accountType === 'CASH'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                    : 'bg-white text-slate-secondary border-border'
                }`}
              >
                <Wallet size={16} />
                <span>Cash in Hand</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAccountType('BANK');
                  const bankAcc = accounts.find((a) => a.type === 'BANK');
                  if (bankAcc) setSelectedAccountId(bankAcc.id);
                  setMode('UPI');
                }}
                className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  accountType === 'BANK'
                    ? 'bg-indigo-50 text-indigo-800 border-indigo-300 shadow-xs'
                    : 'bg-white text-slate-secondary border-border'
                }`}
              >
                <Building2 size={16} />
                <span>Bank Account</span>
              </button>
            </div>

            {accountType === 'BANK' && (
              <div className="space-y-2 pt-1">
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-white text-xs font-semibold"
                >
                  {accounts
                    .filter((a) => a.type === 'BANK')
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.bankName || a.nickname} ({a.accountNumberMasked || 'Primary'})
                      </option>
                    ))}
                </select>

                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {(['UPI', 'NEFT_RTGS', 'IMPS', 'CHEQUE'] as PaymentMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                        mode === m
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-white text-slate-secondary border-border'
                      }`}
                    >
                      {m.replace('_', '/')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pending Invoices Link (Optional) */}
          {pendingInvoices.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-primary">
                Link to Pending Invoice (Optional)
              </label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => {
                  setSelectedInvoiceId(e.target.value);
                  const inv = pendingInvoices.find((i) => i.id === e.target.value);
                  if (inv && !amountStr) {
                    setAmountStr(paiseToRupees(inv.total - inv.paidAmount).toString());
                  }
                }}
                className="w-full h-10 px-3 rounded-xl border border-border bg-white text-xs font-semibold"
              >
                <option value="">No invoice linked</option>
                {pendingInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    #{inv.number} - Due {formatINR(inv.total - inv.paidAmount)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date & Note */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-primary">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-white text-xs font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-primary">Note / Remarks</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-white text-xs"
                placeholder="Reference / Cheque no"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full h-12 rounded-xl text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all ${
                isPaymentIn ? 'bg-moneyIn hover:bg-moneyIn-hover' : 'bg-moneyOut hover:bg-moneyOut-hover'
              }`}
            >
              <Check size={18} />
              <span>Record {isPaymentIn ? 'Payment In' : 'Payment Out'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
