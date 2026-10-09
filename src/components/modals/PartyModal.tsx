import React, { useState } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { PartyType, OpeningBalanceType } from '../../types';
import { rupeesToPaise } from '../../utils/formatters';
import { UserPlus, X, Check } from 'lucide-react';

export const PartyModal: React.FC = () => {
  const isPartyModalOpen = useLedgerlyStore((state) => state.isPartyModalOpen);
  const closePartyModal = useLedgerlyStore((state) => state.closePartyModal);
  const addParty = useLedgerlyStore((state) => state.addParty);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<PartyType>('CUSTOMER');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [openingBalanceStr, setOpeningBalanceStr] = useState('');
  const [openingType, setOpeningType] = useState<OpeningBalanceType>('RECEIVABLE');

  if (!isPartyModalOpen) return null;

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter party name.');
      return;
    }

    const openingPaise = openingBalanceStr ? rupeesToPaise(parseFloat(openingBalanceStr) || 0) : 0;

    addParty({
      name: name.trim(),
      phone: phone.trim(),
      type,
      address: address.trim() || undefined,
      gstin: gstin.trim().toUpperCase() || undefined,
      openingBalance: openingPaise,
      openingType,
    });

    closePartyModal();
    setName('');
    setPhone('');
    setAddress('');
    setGstin('');
    setOpeningBalanceStr('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-floating border border-border animate-in slide-in-from-bottom-5 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center">
              <UserPlus size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-primary">Add New Party</h3>
              <p className="text-xs text-slate-secondary">Customer, Supplier, or Trader</p>
            </div>
          </div>
          <button type="button" onClick={closePartyModal} className="p-1.5 rounded-full hover:bg-surface-subtle text-slate-secondary">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3.5 py-4 max-h-[70vh] overflow-y-auto">
          {/* Party Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-secondary mb-1">
              Party / Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Ratan Lal Grocery or Sunita Textiles"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-input bg-surface border border-border text-sm font-semibold text-slate-primary focus:outline-none focus:border-primary"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-secondary mb-1">
              Mobile Number
            </label>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-input bg-surface border border-border text-sm text-slate-primary focus:outline-none focus:border-primary"
            />
          </div>

          {/* Party Type Chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-secondary mb-1">
              Party Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['CUSTOMER', 'SUPPLIER', 'BOTH'] as PartyType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    type === t
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface-subtle text-slate-primary border-border hover:border-slate-muted'
                  }`}
                >
                  {t === 'CUSTOMER' ? 'Customer' : t === 'SUPPLIER' ? 'Supplier' : 'Both'}
                </button>
              ))}
            </div>
          </div>

          {/* Opening Balance with To Receive / To Pay toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-secondary mb-1">
              Opening Balance (₹)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="0"
                value={openingBalanceStr}
                onChange={(e) => setOpeningBalanceStr(e.target.value)}
                className="flex-1 px-3 py-2 rounded-input bg-surface border border-border text-sm font-bold text-slate-primary focus:outline-none focus:border-primary tabular-nums"
              />
              <div className="flex rounded-xl p-0.5 bg-surface-subtle border border-border">
                <button
                  type="button"
                  onClick={() => setOpeningType('RECEIVABLE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    openingType === 'RECEIVABLE'
                      ? 'bg-moneyIn text-white shadow-xs'
                      : 'text-slate-secondary hover:text-slate-primary'
                  }`}
                >
                  You'll get
                </button>
                <button
                  type="button"
                  onClick={() => setOpeningType('PAYABLE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    openingType === 'PAYABLE'
                      ? 'bg-moneyOut text-white shadow-xs'
                      : 'text-slate-secondary hover:text-slate-primary'
                  }`}
                >
                  You'll give
                </button>
              </div>
            </div>
          </div>

          {/* Address & GSTIN */}
          <div>
            <label className="block text-xs font-semibold text-slate-secondary mb-1">
              Address (Optional)
            </label>
            <input
              type="text"
              placeholder="Shop address or city"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-input bg-surface border border-border text-xs text-slate-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-secondary mb-1">
              GSTIN (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 24ABCDE1234F1Z5"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              className="w-full px-3 py-2 rounded-input bg-surface border border-border text-xs text-slate-primary focus:outline-none focus:border-primary uppercase"
            />
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={closePartyModal}
            className="flex-1 h-12 rounded-button bg-surface-subtle text-slate-primary font-bold text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 h-12 rounded-button bg-primary hover:bg-primary-hover text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Check size={16} /> Save Party
          </button>
        </div>
      </div>
    </div>
  );
};
