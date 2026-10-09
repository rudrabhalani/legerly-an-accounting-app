import React from 'react';

// Preset bank badge colors and initials
const BANK_THEMES: Record<string, { bg: string; text: string; initial: string }> = {
  SBI: { bg: 'bg-blue-600', text: 'text-white', initial: 'SBI' },
  HDFC: { bg: 'bg-blue-900', text: 'text-white', initial: 'HDFC' },
  ICICI: { bg: 'bg-amber-700', text: 'text-white', initial: 'ICICI' },
  Axis: { bg: 'bg-rose-800', text: 'text-white', initial: 'AXIS' },
  PNB: { bg: 'bg-red-700', text: 'text-white', initial: 'PNB' },
  'Bank of Baroda': { bg: 'bg-orange-600', text: 'text-white', initial: 'BOB' },
  Kotak: { bg: 'bg-red-600', text: 'text-white', initial: 'KMB' },
  Canara: { bg: 'bg-sky-600', text: 'text-white', initial: 'CAN' },
  Union: { bg: 'bg-indigo-800', text: 'text-white', initial: 'UBI' },
  IDBI: { bg: 'bg-emerald-700', text: 'text-white', initial: 'IDBI' },
  'Yes Bank': { bg: 'bg-blue-500', text: 'text-white', initial: 'YES' },
  Cash: { bg: 'bg-emerald-600', text: 'text-white', initial: '₹' },
};

export const POPULAR_INDIAN_BANKS = [
  'SBI',
  'HDFC',
  'ICICI',
  'Axis',
  'PNB',
  'Bank of Baroda',
  'Kotak',
  'Canara',
  'Union',
  'IDBI',
  'Yes Bank',
  'Other',
];

interface BankChipProps {
  name: string;
  selected?: boolean;
  onClick?: () => void;
  subtitle?: string;
}

export const BankChip: React.FC<BankChipProps> = ({
  name,
  selected = false,
  onClick,
  subtitle,
}) => {
  const theme = BANK_THEMES[name] || { bg: 'bg-slate-700', text: 'text-white', initial: name.substring(0, 3).toUpperCase() };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 active:scale-95 ${
        selected
          ? 'bg-primary-light border-primary text-primary shadow-sm ring-1 ring-primary'
          : 'bg-white border-border text-slate-primary hover:border-slate-muted'
      }`}
    >
      <span
        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] tracking-tight ${theme.bg} ${theme.text}`}
      >
        {theme.initial}
      </span>
      <div className="flex flex-col text-left">
        <span className="leading-tight">{name}</span>
        {subtitle && <span className="text-[10px] text-slate-secondary font-normal">{subtitle}</span>}
      </div>
    </button>
  );
};
