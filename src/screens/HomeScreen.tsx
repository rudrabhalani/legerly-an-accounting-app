import React, { useState, useMemo } from 'react';
import { useLedgerlyStore } from '../store/useLedgerlyStore';
import { formatINR, formatDate, paiseToRupees } from '../utils/formatters';
import {
  FileText,
  FileSpreadsheet,
  Settings,
  ArrowRight,
  Printer,
  Share2,
  MoreVertical,
  Plus,
  Coins,
  Receipt,
  User,
  Users,
  Search,
  Phone,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { calculatePartyNetBalance } from '../utils/accounting';

export const HomeScreen: React.FC = () => {
  const transactions = useLedgerlyStore((state) => state.transactions);
  const invoices = useLedgerlyStore((state) => state.invoices);
  const parties = useLedgerlyStore((state) => state.parties);
  const accounts = useLedgerlyStore((state) => state.accounts);
  const business = useLedgerlyStore((state) => state.business);
  const openInvoiceScreen = useLedgerlyStore((state) => state.openInvoiceScreen);
  const openShareInvoiceModal = useLedgerlyStore((state) => state.openShareInvoiceModal);
  const openTransactionDetail = useLedgerlyStore((state) => state.openTransactionDetail);
  const openPartyLedger = useLedgerlyStore((state) => state.openPartyLedger);
  const openPartyModal = useLedgerlyStore((state) => state.openPartyModal);
  const openDayBook = useLedgerlyStore((state) => state.openDayBook);
  const openPrintSettings = useLedgerlyStore((state) => state.openPrintSettings);
  const setActiveTab = useLedgerlyStore((state) => state.setActiveTab);

  // Subheader toggle: 'TRANSACTIONS' vs 'PARTIES' (Exact Vyapar Home Toggle)
  const [activeSubTab, setActiveSubTab] = useState<'TRANSACTIONS' | 'PARTIES'>('TRANSACTIONS');
  const [searchQuery, setSearchQuery] = useState('');

  // Transactions list
  const recentTransactions = useMemo(() => {
    let list = [...transactions].sort(
      (a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime()
    );

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) => {
        const party = parties.find((p) => p.id === t.partyId);
        return (
          t.note?.toLowerCase().includes(q) ||
          party?.name?.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [transactions, parties, searchQuery]);

  // Parties list for Party Details tab
  const filteredParties = useMemo(() => {
    if (!searchQuery.trim()) return parties;
    const q = searchQuery.toLowerCase();
    return parties.filter((p) => p.name.toLowerCase().includes(q) || p.phone.includes(q));
  }, [parties, searchQuery]);

  return (
    <div className="space-y-3.5 pb-24 pt-3 max-w-xl lg:max-w-4xl mx-auto">
      {/* 1. TOP SUBHEADER PILL TOGGLE: [ Transaction Details ] | [ Party Details ] (Exact Vyapar Screenshot 2) */}
      <div className="flex items-center gap-3 px-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('TRANSACTIONS')}
          className={`flex-1 py-2 px-4 rounded-full text-xs sm:text-sm font-extrabold transition-all border ${
            activeSubTab === 'TRANSACTIONS'
              ? 'border-[#E31E38] text-[#E31E38] bg-white shadow-xs'
              : 'border-gray-300 text-gray-500 bg-white hover:border-gray-400'
          }`}
        >
          Transaction Details
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('PARTIES')}
          className={`flex-1 py-2 px-4 rounded-full text-xs sm:text-sm font-extrabold transition-all border ${
            activeSubTab === 'PARTIES'
              ? 'border-[#E31E38] text-[#E31E38] bg-white shadow-xs'
              : 'border-gray-300 text-gray-500 bg-white hover:border-gray-400'
          }`}
        >
          Party Details
        </button>
      </div>

      {/* 2. TAB CONTENT A: TRANSACTION DETAILS */}
      {activeSubTab === 'TRANSACTIONS' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* Quick Links Card (Exact Vyapar Screenshot 2) */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-3">
            <span className="text-xs sm:text-sm font-extrabold text-gray-900 block">Quick Links</span>

            <div className="grid grid-cols-4 gap-2 text-center">
              {/* 1: Add Txn */}
              <button
                type="button"
                onClick={() => openInvoiceScreen('SALE')}
                className="flex flex-col items-center gap-1.5 p-1 rounded-xl hover:bg-gray-50 transition-all active:scale-95"
              >
                <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#E31E38] shadow-xs">
                  <FileText size={20} strokeWidth={2.2} />
                </div>
                <span className="text-[11px] font-bold text-gray-700 leading-tight">Add Txn</span>
              </button>

              {/* 2: Sale Report */}
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="flex flex-col items-center gap-1.5 p-1 rounded-xl hover:bg-gray-50 transition-all active:scale-95"
              >
                <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1A73E8] shadow-xs">
                  <FileSpreadsheet size={20} strokeWidth={2.2} />
                </div>
                <span className="text-[11px] font-bold text-gray-700 leading-tight">Sale Report</span>
              </button>

              {/* 3: Txn Settings */}
              <button
                type="button"
                onClick={openPrintSettings}
                className="flex flex-col items-center gap-1.5 p-1 rounded-xl hover:bg-gray-50 transition-all active:scale-95"
              >
                <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1A73E8] shadow-xs">
                  <Settings size={20} strokeWidth={2.2} />
                </div>
                <span className="text-[11px] font-bold text-gray-700 leading-tight">Txn Settings</span>
              </button>

              {/* 4: Show All */}
              <button
                type="button"
                onClick={openDayBook}
                className="flex flex-col items-center gap-1.5 p-1 rounded-xl hover:bg-gray-50 transition-all active:scale-95"
              >
                <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1A73E8] shadow-xs">
                  <ArrowRight size={20} strokeWidth={2.2} />
                </div>
                <span className="text-[11px] font-bold text-gray-700 leading-tight">Show All</span>
              </button>
            </div>
          </div>

          {/* Transactions List Feed (Exact Vyapar Card from Screenshot 2) */}
          <div className="space-y-2.5">
            {recentTransactions.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center space-y-3 shadow-xs">
                <div className="w-14 h-14 rounded-full bg-red-50 text-[#E31E38] mx-auto flex items-center justify-center">
                  <Receipt size={26} />
                </div>
                <h3 className="font-extrabold text-base text-gray-800">No Transactions Recorded Yet</h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Tap below to add your first Sale bill and print/share it on WhatsApp!
                </p>
                <button
                  type="button"
                  onClick={() => openInvoiceScreen('SALE')}
                  className="px-6 py-2.5 rounded-full bg-[#E31E38] hover:bg-[#C21833] text-white font-bold text-xs shadow-md active:scale-95 transition-all inline-flex items-center gap-1.5"
                >
                  <Coins size={16} />
                  <span>+ Create First Sale</span>
                </button>
              </div>
            ) : (
              recentTransactions.map((txn) => {
                const inv = txn.invoiceId ? invoices.find((i) => i.id === txn.invoiceId) : null;
                const party = txn.partyId ? parties.find((p) => p.id === txn.partyId) : null;
                const displayName = party?.name || txn.note || 'Customer / Cash';
                const isSale = txn.type === 'IN';
                const billNumber = inv?.number || `#${txn.id.substring(4, 8)}`;
                const balancePaise = inv ? inv.total - inv.paidAmount : (txn.type === 'IN' ? 0 : txn.amount);

                return (
                  <div
                    key={txn.id}
                    className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-xs space-y-2.5 hover:border-gray-300 transition-all cursor-pointer"
                    onClick={() => openTransactionDetail(txn.id, txn.invoiceId)}
                  >
                    {/* Top Row: Party Name & #No + Date */}
                    <div className="flex items-start justify-between">
                      <span className="font-extrabold text-base sm:text-lg text-gray-900 leading-tight truncate">
                        {displayName}
                      </span>
                      <div className="text-right text-[11px] text-gray-500 font-semibold flex items-center gap-1.5 flex-shrink-0">
                        <span className="font-bold text-gray-700">{billNumber}</span>
                        <span>•</span>
                        <span>{formatDate(txn.date)}</span>
                      </div>
                    </div>

                    {/* SALE / PURCHASE Badge (Soft Green/Red Pill) */}
                    <div>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          isSale
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isSale ? 'SALE' : 'PURCHASE'}
                      </span>
                    </div>

                    {/* Bottom Row: Total & Balance + Print / Share / More Action Icons */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                      <div className="flex items-center gap-5 text-xs sm:text-sm">
                        <div>
                          <span className="text-gray-500 block text-[10px] uppercase font-bold">Total</span>
                          <span className="font-extrabold text-gray-900 tabular-nums">
                            {formatINR(txn.amount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-[10px] uppercase font-bold">Balance</span>
                          <span className="font-extrabold text-gray-900 tabular-nums">
                            {formatINR(balancePaise)}
                          </span>
                        </div>
                      </div>

                      {/* Right: Print, Share (WhatsApp PDF), More Icons (Exact Vyapar Screenshot 2) */}
                      <div
                        className="flex items-center gap-2 text-gray-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Print */}
                        <button
                          type="button"
                          onClick={() => {
                            if (inv) {
                              openTransactionDetail(txn.id, inv.id);
                            } else {
                              window.print();
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                          title="Print Invoice"
                        >
                          <Printer size={18} strokeWidth={2} />
                        </button>

                        {/* Share on WhatsApp */}
                        <button
                          type="button"
                          onClick={() => {
                            if (inv) {
                              openShareInvoiceModal(inv);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                          title="Share PDF on WhatsApp"
                        >
                          <Share2 size={18} strokeWidth={2} />
                        </button>

                        {/* More */}
                        <button
                          type="button"
                          onClick={() => openTransactionDetail(txn.id, txn.invoiceId)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                          title="Options"
                        >
                          <MoreVertical size={18} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 2. TAB CONTENT B: PARTY DETAILS */}
      {activeSubTab === 'PARTIES' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 mr-2">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search party by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={openPartyModal}
              className="px-3.5 py-2 rounded-xl bg-[#E31E38] text-white text-xs font-bold flex items-center gap-1 shadow-sm flex-shrink-0"
            >
              <Plus size={15} />
              <span>+ Add Party</span>
            </button>
          </div>

          <div className="space-y-2">
            {filteredParties.map((p) => {
              const net = calculatePartyNetBalance(p, transactions, invoices);
              return (
                <div
                  key={p.id}
                  onClick={() => openPartyLedger(p.id)}
                  className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 text-[#1A73E8] font-bold text-sm flex items-center justify-center">
                      {p.name.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-gray-900 block leading-tight">{p.name}</span>
                      <span className="text-[11px] text-gray-500">{p.phone ? `+91 ${p.phone}` : 'Party'}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-black text-sm tabular-nums block ${
                        net > 0 ? 'text-emerald-600' : net < 0 ? 'text-rose-600' : 'text-gray-500'
                      }`}
                    >
                      {net > 0 ? `+${formatINR(net)}` : net < 0 ? `−${formatINR(Math.abs(net))}` : '₹0.00'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold">
                      {net > 0 ? "You'll Get" : net < 0 ? "You'll Give" : 'Settled'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. BIG FLOATING RED PILL BUTTON AT BOTTOM: "₹ + Add New Sale" (Exact Vyapar Screenshot 2) */}
      <div className="fixed bottom-20 left-0 right-0 flex justify-center z-30 pointer-events-none">
        <button
          type="button"
          onClick={() => openInvoiceScreen('SALE')}
          className="pointer-events-auto h-12 px-6 rounded-full bg-[#E31E38] hover:bg-[#C21833] text-white font-black text-sm flex items-center gap-2 shadow-xl active:scale-95 transition-all"
          style={{ boxShadow: '0 6px 20px rgba(227, 30, 56, 0.45)' }}
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <Coins size={14} className="text-white" />
          </div>
          <span>Add New Sale</span>
        </button>
      </div>
    </div>
  );
};
