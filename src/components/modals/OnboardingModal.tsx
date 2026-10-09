import React, { useState } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { rupeesToPaise } from '../../utils/formatters';
import { LedgerlyLogo } from '../brand/LedgerlyLogo';
import { Check, ArrowRight } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const business = useLedgerlyStore((state) => state.business);
  const isOnboardingOpen = useLedgerlyStore((state) => state.isOnboardingOpen);
  const updateBusiness = useLedgerlyStore((state) => state.updateBusiness);
  const accounts = useLedgerlyStore((state) => state.accounts);
  const updateAccount = useLedgerlyStore((state) => state.updateAccount);

  const [step, setStep] = useState(1);
  const [bizName, setBizName] = useState(business.name);
  const [owner, setOwner] = useState(business.ownerName);
  const [phone, setPhone] = useState(business.phone);
  const [cashBalanceStr, setCashBalanceStr] = useState('15000');
  const [sbiBalanceStr, setSbiBalanceStr] = useState('50000');

  if (!isOnboardingOpen && business.isOnboarded) return null;

  const handleFinish = () => {
    updateBusiness({
      name: bizName.trim() || 'My Business',
      ownerName: owner.trim() || 'Owner',
      phone: phone.trim() || '9876543210',
      isOnboarded: true,
    });

    // Update cash opening balance
    const cashAcc = accounts.find((a) => a.type === 'CASH');
    if (cashAcc) {
      updateAccount(cashAcc.id, {
        openingBalance: rupeesToPaise(parseFloat(cashBalanceStr) || 0),
      });
    }

    // Update first bank account
    const bankAcc = accounts.find((a) => a.type === 'BANK');
    if (bankAcc) {
      updateAccount(bankAcc.id, {
        openingBalance: rupeesToPaise(parseFloat(sbiBalanceStr) || 0),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-floating border border-border">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <LedgerlyLogo size={36} />
          <button
            type="button"
            onClick={handleFinish}
            className="text-xs font-bold text-slate-secondary hover:text-slate-primary"
          >
            Skip & Explore Demo
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 my-4">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-slate-200'}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-slate-200'}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-slate-200'}`} />
        </div>

        {/* Step 1: Business Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-primary">Welcome to Ledgerly! 👋</h3>
              <p className="text-xs text-slate-secondary mt-0.5">Let's set up your business in under 30 seconds.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">Business Name</label>
              <input
                type="text"
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                placeholder="e.g. Sharma Kirana Store"
                className="w-full px-3 py-2.5 rounded-input bg-surface border border-border text-sm font-bold text-slate-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">Your Name</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g. Ramesh Sharma"
                className="w-full px-3 py-2.5 rounded-input bg-surface border border-border text-sm text-slate-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">Mobile Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit number"
                className="w-full px-3 py-2.5 rounded-input bg-surface border border-border text-sm text-slate-primary focus:outline-none focus:border-primary"
              />
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full h-12 rounded-button bg-primary hover:bg-primary-hover text-white font-bold text-sm flex items-center justify-center gap-2 mt-4"
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2: Opening Balances */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-primary">Opening Balances</h3>
              <p className="text-xs text-slate-secondary mt-0.5">Enter what you currently have in cash and bank.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">Cash in Hand (₹)</label>
              <input
                type="number"
                value={cashBalanceStr}
                onChange={(e) => setCashBalanceStr(e.target.value)}
                placeholder="10000"
                className="w-full px-3 py-2.5 rounded-input bg-surface border border-border text-base font-bold text-moneyIn focus:outline-none focus:border-primary tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">Primary Bank Balance (₹)</label>
              <input
                type="number"
                value={sbiBalanceStr}
                onChange={(e) => setSbiBalanceStr(e.target.value)}
                placeholder="50000"
                className="w-full px-3 py-2.5 rounded-input bg-surface border border-border text-base font-bold text-primary focus:outline-none focus:border-primary tabular-nums"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 h-12 rounded-button bg-surface-subtle text-slate-primary font-bold text-xs"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 h-12 rounded-button bg-primary hover:bg-primary-hover text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: All Set! */}
        {step === 3 && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-moneyIn mx-auto flex items-center justify-center">
              <Check size={36} strokeWidth={3} />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-primary">You are all set! 🎉</h3>
              <p className="text-xs text-slate-secondary mt-1 max-w-xs mx-auto">
                Ledgerly is ready. Start recording your daily Money In and Money Out in seconds with zero tutorials.
              </p>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full h-12 rounded-button bg-moneyIn hover:bg-moneyIn-hover text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Go to Home Dashboard</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
