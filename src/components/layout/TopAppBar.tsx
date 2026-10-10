import React, { useState } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import {
  Store,
  Pencil,
  Bell,
  Settings as SettingsIcon,
  Check,
  X,
  User,
} from 'lucide-react';

export const TopAppBar: React.FC = () => {
  const business = useLedgerlyStore((state) => state.business);
  const updateBusinessProfile = useLedgerlyStore((state) => state.updateBusinessProfile);
  const openSettings = useLedgerlyStore((state) => state.openSettings);
  const openProfileModal = useLedgerlyStore((state) => state.openProfileModal);
  const users = useLedgerlyStore((state) => state.users);
  const currentUserId = useLedgerlyStore((state) => state.currentUserId);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(business.name || '');

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      updateBusinessProfile({ name: tempName.trim() });
    }
    setIsEditingName(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200/80 shadow-xs">
      <div className="max-w-xl lg:max-w-7xl mx-auto flex items-center justify-between px-3.5 h-14">
        {/* Left: 🏪 Shop Icon + Company Name with Inline Edit Pencil ✏️ (Exact Vyapar Header) */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Blue circular store icon */}
          <div
            onClick={openProfileModal}
            className="w-9 h-9 rounded-full border border-blue-400/80 bg-blue-50/60 text-[#1A73E8] flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-blue-100 transition-colors"
            title="View & Edit Business Profile"
          >
            <Store size={18} strokeWidth={2.2} />
          </div>

          {/* Company Name with inline pencil edit */}
          {isEditingName ? (
            <form onSubmit={handleSaveName} className="flex items-center gap-1.5 flex-1 max-w-xs">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                autoFocus
                className="px-2 py-1 text-sm font-bold text-gray-900 border border-blue-500 rounded-lg focus:outline-none flex-1 min-w-0"
              />
              <button
                type="submit"
                className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Check size={14} />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="p-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                <X size={14} />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0 cursor-pointer" onClick={() => setIsEditingName(true)}>
              <span className="text-base sm:text-lg font-bold text-[#1E293B] truncate leading-tight tracking-tight">
                {business.name || 'Enter Company Name'}
              </span>
              <button
                type="button"
                className="p-1 text-gray-400 hover:text-gray-700 flex-shrink-0 transition-colors"
                title="Edit Company Name"
              >
                <Pencil size={15} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>

        {/* Right: Notification Bell 🔔 + Settings Gear ⚙️ (Exact Vyapar Header) */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Notification Bell */}
          <button
            type="button"
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors relative"
            title="Notifications"
          >
            <Bell size={20} strokeWidth={1.8} />
          </button>

          {/* Settings Gear */}
          <button
            type="button"
            onClick={openSettings}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            title="Settings"
          >
            <SettingsIcon size={20} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </header>
  );
};
