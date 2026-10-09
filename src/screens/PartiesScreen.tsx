import React, { useState } from 'react';
import { useLedgerlyStore } from '../store/useLedgerlyStore';
import { getTranslation } from '../i18n/translations';
import { calculatePartyNetBalance, calculateReceivablesAndPayables } from '../utils/accounting';
import { formatINR } from '../utils/formatters';
import { EmptyState } from '../components/common/EmptyState';
import { Search, UserPlus, Users, Phone, ChevronRight, BookUser } from 'lucide-react';
import { PartyType } from '../types';
import { pickMobileContacts } from '../utils/contactPicker';

export const PartiesScreen: React.FC = () => {
  const parties = useLedgerlyStore((state) => state.parties);
  const transactions = useLedgerlyStore((state) => state.transactions);
  const invoices = useLedgerlyStore((state) => state.invoices);
  const addPartiesBatch = useLedgerlyStore((state) => state.addPartiesBatch);
  const openPartyModal = useLedgerlyStore((state) => state.openPartyModal);
  const openPartyLedger = useLedgerlyStore((state) => state.openPartyLedger);
  const language = useLedgerlyStore((state) => state.business.language);
  const t = getTranslation(language);

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'ALL' | 'CUSTOMERS' | 'SUPPLIERS'>('ALL');

  const { toReceive, toPay } = calculateReceivablesAndPayables(parties, transactions, invoices);

  const filteredParties = parties
    .filter((p) => !p.isDeleted)
    .filter((p) => {
      if (tab === 'CUSTOMERS') return p.type === 'CUSTOMER' || p.type === 'BOTH';
      if (tab === 'SUPPLIERS') return p.type === 'SUPPLIER' || p.type === 'BOTH';
      return true;
    })
    .filter((p) => {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.phone && p.phone.includes(q));
    });

  const handleImportMobileContacts = async () => {
    const contacts = await pickMobileContacts(true);
    if (contacts.length > 0) {
      const added = addPartiesBatch(
        contacts.map((c) => ({
          name: c.name,
          phone: c.phone,
          type: tab === 'SUPPLIERS' ? 'SUPPLIER' : 'CUSTOMER',
          openingBalance: 0,
          openingType: 'RECEIVABLE',
        }))
      );
      if (added.length > 0) {
        alert(`Successfully imported ${added.length} contacts from your phone into Ledgerly!`);
      } else {
        alert('All selected contacts are already saved in Ledgerly.');
      }
    }
  };

  return (
    <div className="space-y-3 pb-24 pt-2">
      {/* Total Receivable & Payable Summary Cards (White background with thin blue/red border) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-blue-500 shadow-xs flex flex-col">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">
            You'll Get (Receivable)
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-blue-700 tabular-nums mt-0.5">
            {formatINR(toReceive)}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-rose-500 shadow-xs flex flex-col">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wide">
            You'll Give (Payable)
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-rose-600 tabular-nums mt-0.5">
            {formatINR(toPay)}
          </span>
        </div>
      </div>


      {/* Top Search & Add Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-secondary" />
          <input
            type="text"
            placeholder="Search party by name or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-border text-sm text-slate-primary focus:outline-none focus:border-primary shadow-xs"
          />
        </div>

        <button
          type="button"
          onClick={handleImportMobileContacts}
          className="h-10 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all flex-shrink-0"
          title="Import saved contacts directly from your phone address book"
        >
          <BookUser size={16} className="text-emerald-700" />
          <span className="hidden sm:inline">Phone Contacts</span>
        </button>

        <button
          type="button"
          onClick={openPartyModal}
          className="h-10 px-3.5 rounded-2xl bg-primary hover:bg-primary-hover text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all flex-shrink-0"
        >
          <UserPlus size={16} />
          <span>Add Party</span>
        </button>
      </div>

      {/* Tabs [ All | Customers | Suppliers ] */}
      <div className="grid grid-cols-3 p-1 bg-white rounded-2xl border border-border">
        {(
          [
            { key: 'ALL', label: 'All Parties' },
            { key: 'CUSTOMERS', label: 'Customers' },
            { key: 'SUPPLIERS', label: 'Suppliers' },
          ] as const
        ).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
              tab === item.key
                ? 'bg-primary-light text-primary shadow-xs font-extrabold'
                : 'text-slate-secondary hover:text-slate-primary'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Parties List */}
      {filteredParties.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t.noPartiesYet}
          description="Keep track of credit and khata for customers and suppliers."
          actionLabel="Add First Party"
          onAction={openPartyModal}
        />
      ) : (
        <div className="bg-white rounded-card border border-border shadow-card divide-y divide-border overflow-hidden">
          {filteredParties.map((party) => {
            const net = calculatePartyNetBalance(party, transactions, invoices);

            return (
              <div
                key={party.id}
                onClick={() => openPartyLedger(party.id)}
                className="p-3.5 flex items-center justify-between hover:bg-surface-subtle/50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary-light/70 text-primary font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {party.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-primary leading-tight group-hover:text-primary transition-colors">
                      {party.name}
                    </h4>
                    <span className="text-[11px] text-slate-secondary mt-0.5 block">
                      {party.phone ? `+91 ${party.phone}` : 'No phone'} • {party.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end">
                    {net > 0 ? (
                      <>
                        <span className="text-[10px] font-semibold text-moneyIn-dark uppercase">
                          {t.youWillGet}
                        </span>
                        <span className="text-sm font-extrabold text-moneyIn tabular-nums">
                          {formatINR(net)}
                        </span>
                      </>
                    ) : net < 0 ? (
                      <>
                        <span className="text-[10px] font-semibold text-moneyOut-dark uppercase">
                          {t.youWillGive}
                        </span>
                        <span className="text-sm font-extrabold text-moneyOut tabular-nums">
                          {formatINR(Math.abs(net))}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-slate-muted">Settled (₹0)</span>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-slate-muted group-hover:text-primary transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
