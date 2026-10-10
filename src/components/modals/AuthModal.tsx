import React, { useState } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import {
  Lock,
  User,
  ShieldCheck,
  Crown,
  Briefcase,
  KeyRound,
  Check,
  AlertCircle,
  X,
} from 'lucide-react';
import { AppUser } from '../../types';

export const AuthModal: React.FC = () => {
  const isOpen = useLedgerlyStore((state) => state.isAuthModalOpen);
  const closeAuthModal = useLedgerlyStore((state) => state.closeAuthModal);
  const business = useLedgerlyStore((state) => state.business);
  const users = useLedgerlyStore((state) => state.users);
  const currentUserId = useLedgerlyStore((state) => state.currentUserId);
  const authenticateUserPin = useLedgerlyStore((state) => state.authenticateUserPin);
  const switchActiveUser = useLedgerlyStore((state) => state.switchActiveUser);

  const [selectedUser, setSelectedUser] = useState<AppUser>(
    users.find((u) => u.id === currentUserId) || users[0]
  );
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  if (!isOpen) return null;

  const handleKeypadPress = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((p) => p.slice(0, -1));
    setPinError(false);
  };

  const verifyPin = (pinToTest: string) => {
    const success = authenticateUserPin(selectedUser.id, pinToTest);
    if (!success) {
      setPinError(true);
      setTimeout(() => {
        setPin('');
        setPinError(false);
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col p-6 space-y-5 animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="text-center space-y-1">
          <div className="w-14 h-14 rounded-2xl bg-[#ED1A3B] text-white mx-auto flex items-center justify-center shadow-md">
            <Lock size={26} strokeWidth={2.5} />
          </div>
          <h3 className="font-extrabold text-lg text-gray-900 pt-2">
            {business.name || 'Vyapar Secure Lock'}
          </h3>
          <p className="text-xs text-gray-500">
            Select user account and enter 4-digit PIN
          </p>
        </div>

        {/* User Selection Pills */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            Select User Account
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
            {users.map((u) => {
              const isSelected = u.id === selectedUser.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setSelectedUser(u);
                    setPin('');
                    setPinError(false);
                  }}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'border-[#ED1A3B] bg-red-50/70 text-gray-900 shadow-xs'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      isSelected ? 'bg-[#ED1A3B] text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {u.name.substring(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs block leading-tight truncate">{u.name}</span>
                    <span className="text-[9px] text-gray-400 block truncate">{u.role}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4-Digit PIN Indicator */}
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center gap-3">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    pinError
                      ? 'border-rose-500 bg-rose-500'
                      : isFilled
                      ? 'border-[#ED1A3B] bg-[#ED1A3B] scale-110'
                      : 'border-gray-300 bg-transparent'
                  }`}
                />
              );
            })}
          </div>
          {pinError ? (
            <span className="text-[11px] font-bold text-rose-600 animate-shake">
              Incorrect PIN. Try again. (Default: 1234)
            </span>
          ) : (
            <span className="text-[10px] text-gray-400">
              Default PIN is 1234
            </span>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto w-full pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeypadPress(digit)}
              className="h-12 rounded-2xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-900 font-extrabold text-lg flex items-center justify-center shadow-xs transition-all active:scale-95"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPin('')}
            className="h-12 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-500 font-bold text-xs flex items-center justify-center transition-all active:scale-95"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleKeypadPress('0')}
            className="h-12 rounded-2xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-900 font-extrabold text-lg flex items-center justify-center shadow-xs transition-all active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-sm flex items-center justify-center transition-all active:scale-95"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
};
