import React from 'react';

interface LedgerlyLogoProps {
  variant?: 'full' | 'icon' | 'monochrome-dark' | 'monochrome-light';
  size?: number;
  className?: string;
  showTagline?: boolean;
}

export const LedgerlyLogo: React.FC<LedgerlyLogoProps> = ({
  variant = 'full',
  size = 40,
  className = '',
  showTagline = false,
}) => {
  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 512 512"
        width={size}
        height={size}
        className={`flex-shrink-0 ${className}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ledgerly-grad-comp" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#4338CA" />
          </linearGradient>
          <linearGradient id="growth-accent-comp" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
        </defs>

        <rect x="32" y="32" width="448" height="448" rx="112" fill="url(#ledgerly-grad-comp)" />

        <path
          d="M140 140 C140 128 152 120 164 120 L236 144 C244 146 250 154 250 164 L250 360 C250 372 238 380 226 380 L152 356 C144 354 140 346 140 336 Z"
          fill="#FFFFFF"
          fillOpacity="0.95"
        />

        <path
          d="M262 164 C262 154 268 146 276 144 L348 120 C360 120 372 128 372 140 L372 310 C372 320 364 328 354 330 L276 348 C268 350 262 344 262 336 Z"
          fill="#EEF2FF"
          fillOpacity="0.85"
        />

        <path d="M168 180 L226 198" stroke="#6366F1" strokeWidth="6" strokeLinecap="round" />
        <path d="M168 224 L226 242" stroke="#6366F1" strokeWidth="6" strokeLinecap="round" />
        <path d="M168 268 L226 286" stroke="#6366F1" strokeWidth="6" strokeLinecap="round" />
        <path d="M286 200 L344 180" stroke="#818CF8" strokeWidth="6" strokeLinecap="round" />
        <path d="M286 244 L344 224" stroke="#818CF8" strokeWidth="6" strokeLinecap="round" />

        <path
          d="M140 336 C140 354 154 368 172 368 L360 368 C374 368 384 378 384 392 C384 402 374 410 360 410 L172 410 C132 410 100 378 100 338 L100 160 C100 146 110 136 124 136 C138 136 140 148 140 160 Z"
          fill="#FFFFFF"
        />

        <circle cx="376" cy="136" r="44" fill="url(#growth-accent-comp)" />
        <path d="M360 136 L372 148 L396 124" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Full Brand Logo with Wordmark
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LedgerlyLogo variant="icon" size={size} />
      <div className="flex flex-col justify-center text-left">
        <span className="font-bold text-slate-primary tracking-tight leading-none text-xl">
          Ledger<span className="text-primary">ly</span>
        </span>
        {showTagline && (
          <span className="text-[10px] text-slate-secondary font-medium tracking-normal mt-0.5">
            Simple accounting for everyone
          </span>
        )}
      </div>
    </div>
  );
};
