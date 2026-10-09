import React, { useEffect, useState } from 'react';
import { LedgerlyLogo } from './LedgerlyLogo';

interface SplashScreenProps {
  onFinish: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  durationMs = 1200,
}) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // Fade in
    const fadeTimer = setTimeout(() => {
      setOpacity(1);
    }, 50);

    // Fade out and finish
    const exitTimer = setTimeout(() => {
      setOpacity(0);
      setTimeout(onFinish, 250);
    }, durationMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(exitTimer);
    };
  }, [durationMs, onFinish]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-300 pointer-events-none"
      style={{ opacity }}
    >
      {/* Subtle Indigo-Blue wash gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-light/40 via-white to-white pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center scale-110 animate-pulse">
        <LedgerlyLogo variant="icon" size={96} />
        <h1 className="mt-4 text-3xl font-extrabold text-slate-primary tracking-tight">
          Ledger<span className="text-primary">ly</span>
        </h1>
        <p className="mt-1 text-sm text-slate-secondary font-medium">
          Simple accounting for everyone
        </p>
      </div>

      <div className="absolute bottom-8 flex flex-col items-center">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
          <span className="text-xs font-semibold text-slate-secondary">Made for Bharat 🇮🇳</span>
        </div>
      </div>
    </div>
  );
};
