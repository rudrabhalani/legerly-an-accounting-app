import React from 'react';
import { formatINR } from '../../utils/formatters';

interface AmountDisplayProps {
  amount: number; // in paise
  type?: 'IN' | 'OUT' | 'NEUTRAL';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'huge';
  showSign?: boolean;
  showPaisa?: boolean;
  className?: string;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  type = 'NEUTRAL',
  size = 'md',
  showSign = false,
  showPaisa = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-sm font-semibold',
    md: 'text-base font-semibold',
    lg: 'text-xl font-bold',
    xl: 'text-2xl font-extrabold',
    huge: 'text-3xl sm:text-4xl font-extrabold tracking-tight',
  }[size];

  const colorClasses = {
    IN: 'text-moneyIn',
    OUT: 'text-moneyOut',
    NEUTRAL: 'text-slate-primary',
  }[type];

  const formatted = formatINR(amount, {
    showSign,
    type,
    showPaisa,
  });

  return (
    <span className={`tabular-nums inline-flex items-center ${sizeClasses} ${colorClasses} ${className}`}>
      {formatted}
    </span>
  );
};
