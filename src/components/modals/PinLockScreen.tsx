import React, { useState } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { LedgerlyLogo } from '../brand/LedgerlyLogo';
import { Lock, Delete } from 'lucide-react';

export const PinLockScreen: React.FC = () => {
  const isLocked = useLedgerlyStore((state) => state.isLocked);
  const unlockApp = useLedgerlyStore((state) => state.unlockApp);
  const business = useLedgerlyStore((state) => state.business);

  const [enteredPin, setEnteredPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);

  if (!isLocked || !business.pinEnabled) return null;

  const handlePressKey = (num: string) => {
    if (enteredPin.length >= 4) return;
    const newPin = enteredPin + num;
    setEnteredPin(newPin);

    if (newPin.length === 4) {
      if (newPin === (business.pinCode || '1234')) {
        unlockApp();
        setEnteredPin('');
      } else {
        setErrorShake(true);
        setTimeout(() => {
          setErrorShake(false);
          setEnteredPin('');
        }, 500);
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-between p-6 select-none">
      <div className="flex flex-col items-center pt-8">
        <LedgerlyLogo variant="icon" size={64} />
        <h2 className="text-xl font-bold text-slate-primary mt-4">Ledgerly App Locked</h2>
        <p className="text-xs text-slate-secondary mt-1">Enter your 4-digit PIN to continue</p>

        {/* PIN Dots */}
        <div className={`flex items-center gap-4 mt-8 ${errorShake ? 'animate-bounce' : ''}`}>
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                enteredPin.length > idx
                  ? 'bg-primary border-primary scale-110'
                  : 'bg-transparent border-slate-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Keypad */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-4 pb-8">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handlePressKey(digit)}
            className="w-16 h-16 mx-auto rounded-full bg-surface-subtle hover:bg-slate-200/60 active:scale-95 text-xl font-bold text-slate-primary flex items-center justify-center transition-all shadow-xs"
          >
            {digit}
          </button>
        ))}
        <div />
        <button
          type="button"
          onClick={() => handlePressKey('0')}
          className="w-16 h-16 mx-auto rounded-full bg-surface-subtle hover:bg-slate-200/60 active:scale-95 text-xl font-bold text-slate-primary flex items-center justify-center transition-all shadow-xs"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="w-16 h-16 mx-auto rounded-full hover:bg-slate-100 active:scale-95 text-slate-secondary flex items-center justify-center transition-all"
        >
          <Delete size={22} />
        </button>
      </div>
    </div>
  );
};
