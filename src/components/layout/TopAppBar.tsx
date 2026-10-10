import React, { useState } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { getTranslation } from '../../i18n/translations';
import {
  Menu,
  Bell,
  Settings as SettingsIcon,
  ChevronDown,
  Globe,
  Users,
  Search,
} from 'lucide-react';
import { LanguageCode } from '../../types';
import { VyaparDrawer } from './VyaparDrawer';

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showBizDropdown, setShowBizDropdown] = useState(false);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#ED1A3B] text-white shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-4 h-14">
          {/* Left: Hamburger Menu (☰) + Business Name Dropdown */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Hamburger Button to open Vyapar Side Drawer */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-colors flex-shrink-0"
              aria-label="Open Navigation Menu"
            >
              <Menu size={22} strokeWidth={2.2} />
            </button>

            {/* Business avatar & name */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBizDropdown(!showBizDropdown)}
                className="flex items-center gap-1.5 min-w-0 text-left active:opacity-90"
              >
                <div className="w-8 h-8 rounded-lg bg-white text-[#ED1A3B] font-extrabold flex items-center justify-center flex-shrink-0 shadow-xs text-sm">
                  {(business.name || 'S').substring(0, 1).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-white text-[13px] sm:text-sm font-bold leading-tight truncate max-w-[140px] sm:max-w-[200px]">
                    {business.name || 'Shree Sweet'}
                  </span>
                  <span className="text-white/80 text-[10px] leading-tight font-medium">
                    FY {activeFY}
                  </span>
                </div>
                <ChevronDown size={14} className="text-white/80 flex-shrink-0" />
              </button>

              {/* Company Switcher Dropdown */}
              {showBizDropdown && (
                <div className="absolute left-0 top-full mt-2 w-52 bg-white rounded-xl shadow-elevated border border-gray-200 py-1.5 z-50 text-gray-800 animate-in fade-in zoom-in-95">
                  <div className="px-3.5 py-1.5 border-b border-gray-100">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Current Business</span>
                    <span className="text-xs font-bold text-gray-900 block truncate">{business.name || 'Shree Sweet'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { openFinancialYearModal(); setShowBizDropdown(false); }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>📅</span> Change Financial Year
                  </button>
                  <button
                    type="button"
                    onClick={() => { openSettings(); setShowBizDropdown(false); }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>⚙️</span> Business Profile & GST
                  </button>
                  <button
                    type="button"
                    onClick={() => { openMultiUserModal(); setShowBizDropdown(false); }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>👥</span> Manage Team ({users.length || 1})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions (Language, Multi-user, Settings) */}
          <div className="flex items-center gap-1">
            {/* Language Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white/90 hover:bg-white/10 transition-colors"
                title="Change Language"
              >
                <Globe size={18} />
              </button>
              {showLangDropdown && (
                <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-elevated border border-gray-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  {[
                    { code: 'en' as LanguageCode, label: 'English' },
                    { code: 'hi' as LanguageCode, label: 'हिन्दी' },
                    { code: 'gu' as LanguageCode, label: 'ગુજરાતી' },
                  ].map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => { setLanguage(l.code); setShowLangDropdown(false); }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 ${
                        business.language === l.code ? 'text-[#ED1A3B] font-bold bg-red-50' : 'text-gray-700'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Team / Multi-User */}
            <button
              type="button"
              onClick={openMultiUserModal}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white/90 hover:bg-white/10 transition-colors relative"
              title="Team Access"
            >
              <Users size={18} />
              {users.length > 1 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-yellow-400 text-black text-[9px] font-extrabold rounded-full flex items-center justify-center">
                  {users.length}
                </span>
              )}
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={openSettings}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white/90 hover:bg-white/10 transition-colors"
              title="Settings"
            >
              <SettingsIcon size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Vyapar Side Navigation Drawer */}
      <VyaparDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
};
