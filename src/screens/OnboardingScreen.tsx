import React, { useState } from 'react';
import { useLedgerlyStore } from '../store/useLedgerlyStore';
import { rupeesToPaise } from '../utils/formatters';
import { INDIAN_BANKS, searchIndianBanks } from '../data/indianBanks';
import { LedgerlyLogo } from '../components/brand/LedgerlyLogo';
import { ArrowRight, Check, Coins, Building2, Store, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

export const OnboardingScreen: React.FC = () => {
  const completeOnboarding = useLedgerlyStore((state) => state.completeOnboarding);

  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  
  const [cashBalanceStr, setCashBalanceStr] = useState('10000');
  
  const [bankBalanceStr, setBankBalanceStr] = useState('50000');
  const [selectedBankCode, setSelectedBankCode] = useState('SBI');
  const [bankSearch, setBankSearch] = useState('');
  const [bankNickname, setBankNickname] = useState('SBI Primary A/c');
  const [last4, setLast4] = useState('4821');

  const filteredBanks = searchIndianBanks(bankSearch);
  const currentBank = INDIAN_BANKS.find((b) => b.code === selectedBankCode) || INDIAN_BANKS[0];

  const handleSelectBank = (code: string) => {
    setSelectedBankCode(code);
    const b = INDIAN_BANKS.find((item) => item.code === code);
    if (b) {
      setBankNickname(`${b.shortName} Account`);
    }
  };

  const handleFinish = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!businessName.trim()) {
      setStep(1);
      alert('Please enter your Business Name.');
      return;
    }

    const cashPaise = rupeesToPaise(parseFloat(cashBalanceStr) || 0);
    const bankPaise = rupeesToPaise(parseFloat(bankBalanceStr) || 0);

    completeOnboarding({
      businessName: businessName.trim(),
      ownerName: ownerName.trim() || 'Owner',
      ownerPhone: ownerPhone.trim() || '9876543210',
      cashBalancePaise: cashPaise,
      bankBalancePaise: bankPaise,
      bankName: currentBank.name,
      bankCode: currentBank.code,
      bankNickname: bankNickname.trim() || `${currentBank.shortName} A/c`,
      last4: last4.trim() || '0000',
    });

    try {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#4F46E5', '#16A34A', '#22C55E'],
      });
    } catch {
      // Confetti fallback
    }
  };

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-floating border border-border flex flex-col">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <LedgerlyLogo size={36} showTagline />
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary-light text-primary">
            Step {step} of 3
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-surface-subtle rounded-full my-5 overflow-hidden flex">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* STEP 1: BUSINESS & OWNER NAME */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-left">
              <div className="w-12 h-12 rounded-2xl bg-primary-light text-primary flex items-center justify-center mb-3">
                <Store size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-primary">Business Profile</h2>
              <p className="text-xs text-slate-secondary mt-1">
                Enter your business and owner details to start your digital bahi-khata.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-secondary uppercase mb-1">
                Business / Shop Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Mahavir Super Store or Sai Enterprises"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-surface-subtle border border-border text-base font-bold text-slate-primary focus:outline-none focus:border-primary shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">
                Owner / Your Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Sharma"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-slate-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">
                Owner Mobile Number (Primary Device)
              </label>
              <div className="flex items-center rounded-xl border border-border bg-surface px-3 py-2.5">
                <span className="text-xs font-bold text-slate-secondary mr-2">+91</span>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-slate-primary focus:outline-none"
                />
              </div>
              <span className="text-[11px] text-slate-secondary mt-1 block">
                This device receives OTPs when approving new staff or manager access.
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!businessName.trim()) {
                  alert('Please enter your Business Name to proceed.');
                  return;
                }
                setStep(2);
              }}
              className="w-full h-12 rounded-button bg-primary hover:bg-primary-hover text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all mt-6"
            >
              <span>Next: Cash in Hand</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2: CASH IN HAND OPENING BALANCE */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-left">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-moneyIn flex items-center justify-center mb-3">
                <Coins size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-primary">Cash in Hand</h2>
              <p className="text-xs text-slate-secondary mt-1">
                How much physical cash is currently in your shop drawer or counter?
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-secondary uppercase mb-1">
                Opening Cash Balance (₹)
              </label>
              <div className="relative flex items-center bg-surface-subtle border-2 border-emerald-500/40 focus-within:border-moneyIn rounded-2xl px-4 py-3 shadow-inner">
                <span className="text-3xl font-extrabold text-moneyIn mr-2">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  autoFocus
                  placeholder="0"
                  value={cashBalanceStr}
                  onChange={(e) => setCashBalanceStr(e.target.value)}
                  className="w-full bg-transparent text-3xl font-extrabold text-slate-primary focus:outline-none tabular-nums"
                />
              </div>
            </div>

            {/* Quick Balance Preset Chips */}
            <div className="flex gap-2 flex-wrap">
              {['5000', '10000', '25000', '50000'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCashBalanceStr(preset)}
                  className="px-3 py-1.5 rounded-xl bg-surface-subtle border border-border text-xs font-semibold text-slate-primary hover:bg-slate-200/50"
                >
                  ₹{parseInt(preset).toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            <span className="text-[11px] text-slate-secondary block">
              💡 Don't worry, you can always adjust or add cash transactions later.
            </span>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-12 px-4 rounded-button bg-surface-subtle text-slate-primary font-bold text-xs"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 h-12 rounded-button bg-primary hover:bg-primary-hover text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all"
              >
                <span>Next: Cash in Bank</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CASH IN BANK OPENING BALANCE */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-left">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-primary flex items-center justify-center mb-3">
                <Building2 size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-primary">Cash in Bank</h2>
              <p className="text-xs text-slate-secondary mt-1">
                Select your primary business bank and enter its opening balance.
              </p>
            </div>

            {/* Bank Selector with Search */}
            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">
                Select Indian Bank
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Search bank (e.g. SBI, HDFC, ICICI)..."
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs text-slate-primary focus:outline-none focus:border-primary"
                />

                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar max-h-24">
                  {filteredBanks.map((bank) => (
                    <button
                      key={bank.code}
                      type="button"
                      onClick={() => handleSelectBank(bank.code)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 whitespace-nowrap transition-all ${
                        selectedBankCode === bank.code
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-surface text-slate-primary border-border hover:border-slate-muted'
                      }`}
                    >
                      <span>{bank.name}</span>
                      <span className="text-[10px] opacity-80">({bank.code})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Account Nickname & Last 4 */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-secondary mb-1">
                  Account Nickname
                </label>
                <input
                  type="text"
                  value={bankNickname}
                  onChange={(e) => setBankNickname(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs font-semibold text-slate-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-secondary mb-1">
                  Last 4 Digits
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={last4}
                  onChange={(e) => setLast4(e.target.value)}
                  placeholder="4821"
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs font-mono font-bold text-slate-primary"
                />
              </div>
            </div>

            {/* Bank Opening Balance */}
            <div>
              <label className="block text-xs font-bold text-slate-secondary uppercase mb-1">
                Bank Opening Balance (₹)
              </label>
              <div className="relative flex items-center bg-surface-subtle border-2 border-indigo-500/40 focus-within:border-primary rounded-2xl px-4 py-3 shadow-inner">
                <span className="text-3xl font-extrabold text-primary mr-2">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={bankBalanceStr}
                  onChange={(e) => setBankBalanceStr(e.target.value)}
                  className="w-full bg-transparent text-3xl font-extrabold text-slate-primary focus:outline-none tabular-nums"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="h-12 px-4 rounded-button bg-surface-subtle text-slate-primary font-bold text-xs"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 h-12 rounded-button bg-moneyIn hover:bg-moneyIn-hover text-white font-bold text-sm flex items-center justify-center gap-2 shadow-floating active:scale-98 transition-all"
              >
                <Check size={18} strokeWidth={2.5} />
                <span>Complete Setup & Open App</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
