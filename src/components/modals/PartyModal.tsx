import React, { useState } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { PartyType, OpeningBalanceType } from '../../types';
import { rupeesToPaise } from '../../utils/formatters';
import { UserPlus, X, Check, BookUser } from 'lucide-react';
import { pickMobileContacts } from '../../utils/contactPicker';

export const PartyModal: React.FC = () => {
  const isPartyModalOpen = useLedgerlyStore((state) => state.isPartyModalOpen);
  const closePartyModal = useLedgerlyStore((state) => state.closePartyModal);
  const addParty = useLedgerlyStore((state) => state.addParty);

  const partyGroups = useLedgerlyStore((state) => state.partyGroups);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState<PartyType>('CUSTOMER');
  const [address, setAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [creditLimitStr, setCreditLimitStr] = useState('');
  const [creditDaysStr, setCreditDaysStr] = useState('30');
  const [groupId, setGroupId] = useState('');
  const [openingBalanceStr, setOpeningBalanceStr] = useState('');
  const [openingType, setOpeningType] = useState<OpeningBalanceType>('RECEIVABLE');

  if (!isPartyModalOpen) return null;

  const handlePickPhoneContact = async () => {
    const contacts = await pickMobileContacts(false);
    if (contacts.length > 0) {
      setName(contacts[0].name);
      setPhone(contacts[0].phone);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter party name.');
      return;
    }

    const openingPaise = openingBalanceStr ? rupeesToPaise(parseFloat(openingBalanceStr) || 0) : 0;
    const creditLimitPaise = creditLimitStr ? rupeesToPaise(parseFloat(creditLimitStr) || 0) : undefined;
    const creditDays = creditDaysStr ? parseInt(creditDaysStr) : undefined;

    addParty({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      type,
      address: address.trim() || undefined,
      shippingAddress: shippingAddress.trim() || undefined,
      gstin: gstin.trim().toUpperCase() || undefined,
      pan: pan.trim().toUpperCase() || undefined,
      creditLimit: creditLimitPaise,
      creditDays,
      groupId: groupId || undefined,
      openingBalance: openingPaise,
      openingType,
    });

    closePartyModal();
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setShippingAddress('');
    setGstin('');
    setPan('');
    setCreditLimitStr('');
    setCreditDaysStr('30');
    setGroupId('');
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
          {/* Pick from Mobile Contacts */}
          <button
            type="button"
            onClick={handlePickPhoneContact}
            className="w-full py-2 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs"
          >
            <BookUser size={16} />
            <span>Auto-Fill from Phone Contacts</span>
          </button>

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

          {/* Address & Shipping Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-secondary mb-1">
              Billing Address (Optional)
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
              Shipping Address (Optional, if different)
            </label>
            <input
              type="text"
              placeholder="Delivery / warehouse address"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-input bg-surface border border-border text-xs text-slate-primary focus:outline-none focus:border-primary"
            />
          </div>

          {/* GSTIN & PAN */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">
                GSTIN (Optional)
              </label>
              <input
                type="text"
                placeholder="24ABCDE1234F1Z5"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full px-3 py-2 rounded-input bg-surface border border-border text-xs text-slate-primary focus:outline-none focus:border-primary uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">
                PAN Number (Optional)
              </label>
              <input
                type="text"
                placeholder="ABCDE1234F"
                value={pan}
                onChange={(e) => setPan(e.target.value)}
                className="w-full px-3 py-2 rounded-input bg-surface border border-border text-xs text-slate-primary focus:outline-none focus:border-primary uppercase"
              />
            </div>
          </div>

          {/* Credit Limit & Credit Days */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">
                Credit Limit (₹)
              </label>
              <input
                type="number"
                placeholder="0 (Unlimited)"
                value={creditLimitStr}
                onChange={(e) => setCreditLimitStr(e.target.value)}
                className="w-full px-3 py-2 rounded-input bg-surface border border-border text-xs text-slate-primary focus:outline-none focus:border-primary font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">
                Credit Period (Days)
              </label>
              <input
                type="number"
                placeholder="30"
                value={creditDaysStr}
                onChange={(e) => setCreditDaysStr(e.target.value)}
                className="w-full px-3 py-2 rounded-input bg-surface border border-border text-xs text-slate-primary focus:outline-none focus:border-primary font-semibold"
              />
            </div>
          </div>

          {/* Party Group & Email */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">
                Party Group
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full px-3 py-2 rounded-input bg-surface border border-border text-xs text-slate-primary focus:outline-none focus:border-primary font-semibold"
              >
                <option value="">General Group</option>
                {partyGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-secondary mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="party@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-input bg-surface border border-border text-xs text-slate-primary focus:outline-none focus:border-primary"
              />
            </div>
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
