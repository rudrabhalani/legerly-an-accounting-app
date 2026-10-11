import React, { useState, useEffect, useRef } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import {
  loadDeviceContacts,
  pickSingleDeviceContact,
  isContactsAccessSupported,
  MobileContact,
} from '../../services/mobileContactsService';
import {
  Search,
  User,
  Phone,
  BookOpen,
  Smartphone,
  Check,
  X,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { formatINR } from '../../utils/formatters';

interface CustomerContactPickerProps {
  selectedPartyId: string;
  customerName: string;
  customerPhone: string;
  isSale?: boolean;
  onSelectCustomer: (data: { partyId: string; name: string; phone: string }) => void;
  onClearCustomer?: () => void;
  onOpenQuickAddParty?: () => void;
}

export const CustomerContactPicker: React.FC<CustomerContactPickerProps> = ({
  selectedPartyId,
  customerName,
  customerPhone,
  isSale = true,
  onSelectCustomer,
  onClearCustomer,
  onOpenQuickAddParty,
}) => {
  const parties = useLedgerlyStore((state) => state.parties);
  const addParty = useLedgerlyStore((state) => state.addParty);

  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [deviceContacts, setDeviceContacts] = useState<MobileContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [permissionNotice, setPermissionNotice] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Sync search input if customer name changed from outside
  useEffect(() => {
    if (customerName && !searchTerm && !isOpen) {
      setSearchTerm(customerName);
    }
  }, [customerName, isOpen]);

  // Load device contacts in background when dropdown opens
  const handleDropdownOpen = async () => {
    setIsOpen(true);
    if (deviceContacts.length === 0 && isContactsAccessSupported()) {
      setIsLoadingContacts(true);
      try {
        const list = await loadDeviceContacts(false);
        setDeviceContacts(list);
      } catch (err) {
        console.warn('Failed loading contacts:', err);
      } finally {
        setIsLoadingContacts(false);
      }
    }
  };

  const handlePickNativeContact = async () => {
    setIsLoadingContacts(true);
    try {
      const picked = await pickSingleDeviceContact();
      if (picked) {
        // Auto-select
        handleSelectDeviceContact(picked);
      }
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleSelectParty = (party: any) => {
    onSelectCustomer({
      partyId: party.id,
      name: party.name,
      phone: party.phone || '',
    });
    setSearchTerm(party.name);
    setIsOpen(false);
  };

  const handleSelectDeviceContact = (contact: MobileContact) => {
    // Check if matching party already exists in Ledgerly
    let existingParty = parties.find(
      (p) =>
        !p.isDeleted &&
        (p.name.trim().toLowerCase() === contact.name.trim().toLowerCase() ||
          (contact.phone && p.phone && p.phone === contact.phone))
    );

    let partyId = existingParty ? existingParty.id : '';

    // If not existing, auto-create party in Ledgerly so transaction history and ledger are ready
    if (!existingParty) {
      try {
        const created = addParty({
          name: contact.name,
          phone: contact.phone || '',
          type: isSale ? 'CUSTOMER' : 'SUPPLIER',
          openingBalance: 0,
          openingType: 'RECEIVABLE',
          state: '24 - Gujarat',
        });
        partyId = created.id;
      } catch (err) {
        console.warn('Could not auto-add party:', err);
      }
    }

    onSelectCustomer({
      partyId,
      name: contact.name,
      phone: contact.phone,
    });
    setSearchTerm(contact.name);
    setIsOpen(false);
  };

  // Filter parties
  const q = searchTerm.trim().toLowerCase();
  const matchedParties = parties
    .filter((p) => !p.isDeleted)
    .filter((p) => {
      if (!q) return true;
      const nameMatch = p.name.toLowerCase().includes(q);
      const phoneMatch = p.phone ? p.phone.includes(q) : false;
      return nameMatch || phoneMatch;
    });

  // Filter device contacts
  const matchedDeviceContacts = deviceContacts.filter((c) => {
    if (!q) return true;
    const nameMatch = c.name.toLowerCase().includes(q);
    const phoneMatch = c.phone.includes(q);
    return nameMatch || phoneMatch;
  });

  const selectedParty = parties.find((p) => p.id === selectedPartyId);

  return (
    <div className="space-y-2" ref={dropdownRef}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-primary flex items-center gap-1.5">
          <User size={13} className="text-primary" />
          <span>{isSale ? 'Customer' : 'Supplier'} Selection</span>
          <span className="text-rose-500">*</span>
        </label>

        <div className="flex items-center gap-2">
          {isContactsAccessSupported() && (
            <button
              type="button"
              onClick={handlePickNativeContact}
              className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center gap-1 transition-all"
              title="Pick directly from phone address book"
            >
              <Smartphone size={12} />
              <span>Mobile Contacts</span>
            </button>
          )}

          {onOpenQuickAddParty && (
            <button
              type="button"
              onClick={onOpenQuickAddParty}
              className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1 transition-all"
            >
              <Plus size={12} />
              <span>+ New Party</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Search Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onFocus={handleDropdownOpen}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              // Also update billed name in parent
              onSelectCustomer({
                partyId: selectedPartyId,
                name: e.target.value,
                phone: customerPhone,
              });
              setIsOpen(true);
            }}
            placeholder="Search customer name, phone number, or contacts..."
            className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-white text-xs sm:text-sm font-bold text-slate-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs transition-all"
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                if (onClearCustomer) {
                  onClearCustomer();
                } else {
                  onSelectCustomer({ partyId: '', name: '', phone: '' });
                }
              }}
              className="absolute right-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Selected Customer Highlight Card */}
        {customerName && (
          <div className="mt-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                ✓
              </span>
              <div>
                <span className="font-extrabold text-slate-900 block leading-tight">{customerName}</span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {customerPhone ? `Mobile: +91 ${customerPhone}` : 'No phone specified'}
                  {selectedParty && ` • Balance: ${selectedParty.openingType === 'RECEIVABLE' ? "You'll get" : "You'll give"} ${formatINR(selectedParty.openingBalance)}`}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Billed To
            </span>
          </div>
        )}

        {/* Dropdown with Ledgerly Parties & Mobile Contacts */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-2xl border border-border max-h-72 overflow-y-auto divide-y divide-border/60 animate-in fade-in zoom-in-95 duration-100">
            {/* Header / Loading Bar */}
            <div className="p-2 bg-slate-50/80 flex items-center justify-between text-[11px] text-slate-500 font-semibold sticky top-0 backdrop-blur-xs z-10 border-b border-border/60">
              <span>Customer Suggestions</span>
              <div className="flex items-center gap-2">
                {isLoadingContacts && (
                  <span className="flex items-center gap-1 text-primary text-[10px]">
                    <Loader2 size={12} className="animate-spin" /> Loading Contacts...
                  </span>
                )}
                {isContactsAccessSupported() && (
                  <button
                    type="button"
                    onClick={async () => {
                      setIsLoadingContacts(true);
                      const list = await loadDeviceContacts(true);
                      setDeviceContacts(list);
                      setIsLoadingContacts(false);
                    }}
                    className="text-primary hover:underline text-[10px] font-bold"
                  >
                    Refresh Phone Contacts
                  </button>
                )}
              </div>
            </div>

            {/* Permission helper message if contacts are empty and supported */}
            {deviceContacts.length === 0 && !isLoadingContacts && isContactsAccessSupported() && (
              <div className="p-2.5 bg-blue-50/60 text-blue-800 text-[11px] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Smartphone size={14} className="text-blue-600 flex-shrink-0" />
                  <span>Tap to load contacts saved on this phone for instant 1-tap customer billing.</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setIsLoadingContacts(true);
                    const list = await loadDeviceContacts(true);
                    setDeviceContacts(list);
                    setIsLoadingContacts(false);
                  }}
                  className="px-2 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10px] whitespace-nowrap"
                >
                  Load Contacts
                </button>
              </div>
            )}

            {/* SECTION 1: SAVED LEDGERLY PARTIES */}
            {matchedParties.length > 0 && (
              <div>
                <div className="px-3 py-1 bg-surface-subtle text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <BookOpen size={11} />
                  <span>Saved Shop Customers / Parties ({matchedParties.length})</span>
                </div>
                {matchedParties.slice(0, 10).map((p) => {
                  const isSelected = p.id === selectedPartyId || p.name === customerName;
                  return (
                    <div
                      key={p.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectParty(p);
                      }}
                      className={`p-2.5 sm:p-3 hover:bg-surface-subtle cursor-pointer flex items-center justify-between text-xs transition-colors ${
                        isSelected ? 'bg-primary-light/40 border-l-4 border-primary' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-primary text-xs sm:text-sm">{p.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-semibold">
                              {p.type}
                            </span>
                          </div>
                          {p.phone && (
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Phone size={10} /> +91 {p.phone}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-bold text-slate-700 block">
                          {formatINR(p.openingBalance)}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {p.openingType === 'RECEIVABLE' ? 'Receivable' : 'Payable'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* SECTION 2: DEVICE MOBILE CONTACTS */}
            {matchedDeviceContacts.length > 0 && (
              <div>
                <div className="px-3 py-1 bg-surface-subtle text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Smartphone size={11} className="text-blue-600" />
                  <span>Mobile Phone Contacts ({matchedDeviceContacts.length})</span>
                </div>
                {matchedDeviceContacts.slice(0, 15).map((dc) => (
                  <div
                    key={dc.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectDeviceContact(dc);
                    }}
                    className="p-2.5 sm:p-3 hover:bg-blue-50/50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {dc.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-primary text-xs sm:text-sm">{dc.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                            Phone Contact
                          </span>
                        </div>
                        {dc.phone && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                            <Phone size={10} /> {dc.displayPhone}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold"
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state & custom name add */}
            {matchedParties.length === 0 && matchedDeviceContacts.length === 0 && (
              <div className="p-4 text-center space-y-2">
                <AlertCircle className="mx-auto text-slate-400" size={24} />
                <p className="text-xs text-slate-600 font-semibold">
                  No matching customer found for "{searchTerm}"
                </p>
                {searchTerm.trim() && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelectCustomer({
                        partyId: '',
                        name: searchTerm.trim(),
                        phone: customerPhone,
                      });
                      setIsOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold"
                  >
                    Use "{searchTerm.trim()}" on this Bill
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Direct Name and Mobile Number Fields for custom editing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-dashed border-border">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">
            Billed Customer Name (Printed on PDF)
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) =>
              onSelectCustomer({
                partyId: selectedPartyId,
                name: e.target.value,
                phone: customerPhone,
              })
            }
            placeholder="Name on Bill & Invoice"
            className="w-full h-8 px-2.5 rounded-lg border border-border bg-white text-xs font-bold text-slate-primary focus:outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">
            Customer Phone (WhatsApp Chat)
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
              +91
            </span>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) =>
                onSelectCustomer({
                  partyId: selectedPartyId,
                  name: customerName,
                  phone: e.target.value.replace(/\D/g, '').slice(-10),
                })
              }
              placeholder="10-digit mobile"
              className="w-full h-8 pl-9 pr-2.5 rounded-lg border border-border bg-white text-xs font-bold text-slate-primary focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
