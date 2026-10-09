import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: 'primary' | 'moneyIn' | 'moneyOut';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'primary',
}) => {
  const buttonColors = {
    primary: 'bg-primary hover:bg-primary-hover text-white',
    moneyIn: 'bg-moneyIn hover:bg-moneyIn-hover text-white',
    moneyOut: 'bg-moneyOut hover:bg-moneyOut-hover text-white',
  }[actionVariant];

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-card border border-border my-4 shadow-card">
      <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center text-primary mb-4">
        <Icon size={32} strokeWidth={1.75} />
      </div>
      <h3 className="text-lg font-bold text-slate-primary">{title}</h3>
      <p className="mt-1 text-sm text-slate-secondary max-w-xs">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={`mt-5 px-5 h-12 rounded-button font-semibold text-sm transition-all duration-150 active:scale-95 shadow-sm ${buttonColors}`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
