import React, { useState } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { getTranslation } from '../../i18n/translations';
import { Calendar, Settings as SettingsIcon, Globe, Users, Crown } from 'lucide-react';
import { LanguageCode } from '../../types';

export const TopAppBar: React.FC = () => {
  const business = useLedgerlyStore((state) => state.business);
  const users = useLedgerlyStore((state) => state.users);
  const currentUserId = useLedgerlyStore((state) => state.currentUserId);
  const setLanguage = useLedgerlyStore((state) => state.setLanguage);
  const openSettings = useLedgerlyStore((state) => state.openSettings);
  const openMultiUserModal = useLedgerlyStore((state) => state.openMultiUserModal);
  const openFinancialYearModal = useLedgerlyStore((state) => state.openFinancialYearModal);
  const activeFY = useLedgerlyStore((state) => state.activeFinancialYear);

  const t = getTranslation(business.language);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.goodMorning;
    if (hour < 17) return t.goodAfternoon;
    return t.goodEvening;
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-border px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Greeting & Business */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-secondary">
              {getGreeting()}, {currentUser?.name || business.ownerName || 'Merchant'}
            </span>
            {currentUser?.role === 'OWNER' && (
              <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[9px] font-bold flex items-center gap-0.5">
                <Crown size={10} /> Owner
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-slate-primary leading-tight truncate max-w-[180px] sm:max-w-xs">
            {business.name || 'Ledgerly Business'}
          </h2>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Financial Year Button */}
          <button
            type="button"
            onClick={openFinancialYearModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary-light hover:bg-indigo-100 border border-primary/20 text-primary text-xs font-bold transition-all active:scale-95 shadow-xs"
            title="Financial Year & Rollover"
          >
            <Calendar size={13} />
            <span className="hidden sm:inline">FY</span>
            <span>{activeFY}</span>
          </button>

          {/* Multi-User Access (Team) Button */}
          <button
            type="button"
            onClick={openMultiUserModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-primary text-xs font-bold transition-all active:scale-95 shadow-xs"
            title="Manage Team & Shared Access"
          >
            <Users size={14} />
            <span className="hidden sm:inline">Team</span>
            <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
              {users.length || 1}
            </span>
          </button>

          {/* Language Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="p-1.5 rounded-xl bg-surface-subtle hover:bg-slate-200/60 border border-border text-slate-secondary transition-all active:scale-95"
              title="Change Language"
            >
              <Globe size={16} />
            </button>

            {showLangDropdown && (
              <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-2xl shadow-elevated border border-border py-1.5 z-40">
                {[
                  { code: 'en' as LanguageCode, label: 'English' },
                  { code: 'hi' as LanguageCode, label: 'हिन्दी' },
                  { code: 'gu' as LanguageCode, label: 'ગુજરાતી' },
                ].map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLanguage(l.code);
                      setShowLangDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-primary-light hover:text-primary ${
                      business.language === l.code ? 'text-primary font-bold bg-primary-light/50' : 'text-slate-primary'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Settings Button */}
          <button
            type="button"
            onClick={openSettings}
            className="p-1.5 rounded-xl bg-surface-subtle hover:bg-slate-200/60 border border-border text-slate-secondary hover:text-slate-primary transition-all active:scale-95"
            title="Settings & Profile"
          >
            <SettingsIcon size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
