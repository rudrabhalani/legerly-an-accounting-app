import React, { useState } from 'react';
import { useLedgerlyStore } from '../store/useLedgerlyStore';
import { calculateAccountBalance, buildAccountLedger } from '../utils/accounting';
import { formatINR, paiseToRupees, rupeesToPaise, getTodayDateString, getCurrentTimeString } from '../utils/formatters';
import { INDIAN_BANKS, searchIndianBanks } from '../data/indianBanks';
import { Account, BankStatementRow, Transaction } from '../types';
import { generatePartyStatementPdf } from '../services/pdfService';
import * as XLSX from 'xlsx';
import {
  Building2,
  Search,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  X,
  CreditCard,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const BankLedgerScreen: React.FC = () => {
  const accounts = useLedgerlyStore((state) => state.accounts);
  const transactions = useLedgerlyStore((state) => state.transactions);
  const addBankAccount = useLedgerlyStore((state) => state.addBankAccount);
  const addTransaction = useLedgerlyStore((state) => state.addTransaction);
  const importBankStatement = useLedgerlyStore((state) => state.importBankStatement);
  const openTransferModal = useLedgerlyStore((state) => state.openTransferModal);

  // Bank accounts filter (exclude cash)
  const bankAccounts = accounts.filter((a) => a.type === 'BANK');

  // Currently selected account ID
  const [selectedAccId, setSelectedAccId] = useState<string>(
    bankAccounts[0]?.id || ''
  );

  // Add Bank Modal State
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [selectedBankCode, setSelectedBankCode] = useState('SBI');
  const [accountNickname, setAccountNickname] = useState('');
  const [last4, setLast4] = useState('');
  const [openingBalStr, setOpeningBalStr] = useState('0');

  // Add Manual Entry Modal State
  const [isManualEntryModalOpen, setIsManualEntryModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [entryAmountStr, setEntryAmountStr] = useState('');
  const [entryDesc, setEntryDesc] = useState('');
  const [entryDate, setEntryDate] = useState(getTodayDateString());

  // Import Statement Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<BankStatementRow[]>([]);
  const [importFileName, setImportFileName] = useState('');

  // Active account
  const activeAccount = bankAccounts.find((a) => a.id === selectedAccId) || bankAccounts[0];

  // Calculations for current bank ledger
  const currentLedger = activeAccount ? buildAccountLedger(activeAccount, transactions) : [];

  let totalDebit = 0;
  let totalCredit = 0;
  for (const entry of currentLedger) {
    if (entry.type !== 'OPENING') {
      totalDebit += entry.debit;
      totalCredit += entry.credit;
    }
  }
  const closingBalance = activeAccount ? calculateAccountBalance(activeAccount, transactions) : 0;

  // Search filtered banks
  const filteredBanks = searchIndianBanks(bankSearchQuery);
  const selectedBankObj = INDIAN_BANKS.find((b) => b.code === selectedBankCode) || INDIAN_BANKS[0];

  // Handle Add Bank Account
  const handleSaveBankAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const newAcc = addBankAccount({
      bankName: selectedBankObj.name,
      bankCode: selectedBankObj.code,
      nickname: accountNickname.trim() || `${selectedBankObj.shortName} Account`,
      last4: last4.trim() || undefined,
      openingBalancePaise: rupeesToPaise(parseFloat(openingBalStr) || 0),
    });

    setSelectedAccId(newAcc.id);
    setIsAddBankModalOpen(false);
    setAccountNickname('');
    setLast4('');
    setOpeningBalStr('0');
  };

  // Handle Manual Entry Save
  const handleSaveManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount) return;
    const rawAmt = parseFloat(entryAmountStr);
    if (isNaN(rawAmt) || rawAmt <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const paise = rupeesToPaise(rawAmt);
    addTransaction({
      type: entryType === 'CREDIT' ? 'IN' : 'OUT',
      amount: paise,
      accountId: activeAccount.id,
      mode: 'NEFT_RTGS',
      category: entryType === 'CREDIT' ? 'Bank Deposit' : 'Bank Withdrawal',
      date: entryDate,
      time: getCurrentTimeString(),
      note: entryDesc.trim() || (entryType === 'CREDIT' ? 'Deposit' : 'Withdrawal'),
    });

    setIsManualEntryModalOpen(false);
    setEntryAmountStr('');
    setEntryDesc('');
  };

  // Handle Excel / CSV File Upload & Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonRows.length < 2) {
          alert('File is empty or missing headers.');
          return;
        }

        // Header inspection
        const headers: string[] = jsonRows[0].map((h: any) => String(h || '').toLowerCase().trim());
        const dateIdx = headers.findIndex((h) => h.includes('date') || h.includes('dt'));
        const descIdx = headers.findIndex((h) => h.includes('desc') || h.includes('particular') || h.includes('narr') || h.includes('detail'));
        const debitIdx = headers.findIndex((h) => h.includes('debit') || h.includes('dr') || h.includes('withdrawal'));
        const creditIdx = headers.findIndex((h) => h.includes('credit') || h.includes('cr') || h.includes('deposit'));
        const amountIdx = headers.findIndex((h) => h.includes('amount') || h.includes('amt'));

        const parsed: BankStatementRow[] = [];

        for (let i = 1; i < jsonRows.length; i++) {
          const row = jsonRows[i];
          if (!row || row.length === 0) continue;

          let rawDate = dateIdx !== -1 ? String(row[dateIdx] || '') : getTodayDateString();
          if (!rawDate || rawDate === 'undefined') rawDate = getTodayDateString();

          const desc = descIdx !== -1 ? String(row[descIdx] || 'Bank Transaction') : 'Bank Transaction';
          let debitVal = debitIdx !== -1 ? parseFloat(row[debitIdx]) || 0 : 0;
          let creditVal = creditIdx !== -1 ? parseFloat(row[creditIdx]) || 0 : 0;

          if (debitVal === 0 && creditVal === 0 && amountIdx !== -1) {
            const rawAmt = parseFloat(row[amountIdx]) || 0;
            if (rawAmt < 0) debitVal = Math.abs(rawAmt);
            else creditVal = rawAmt;
          }

          if (debitVal > 0 || creditVal > 0) {
            parsed.push({
              date: rawDate,
              description: desc,
              debit: rupeesToPaise(debitVal),
              credit: rupeesToPaise(creditVal),
            });
          }
        }

        if (parsed.length === 0) {
          alert('Could not detect debit/credit rows. Please ensure columns include Date, Description, Debit, Credit.');
          return;
        }

        setParsedRows(parsed);
        setIsImportModalOpen(true);
      } catch (err) {
        alert('Failed to parse statement file. Please upload a valid CSV or Excel file.');
      }
    };

    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!activeAccount || parsedRows.length === 0) return;
    importBankStatement(activeAccount.id, parsedRows);
    setIsImportModalOpen(false);
    setParsedRows([]);
  };

  return (
    <div className="space-y-4 pb-28 pt-2">
      {/* 1. Header & Bank Accounts Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-primary leading-tight">Bank Ledger</h2>
          <span className="text-xs text-slate-secondary">
            Passbook running ledgers for all your Indian bank accounts
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setBankSearchQuery('');
            setIsAddBankModalOpen(true);
          }}
          className="h-9 px-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
        >
          <Plus size={14} /> Add Bank
        </button>
      </div>

      {/* Bank Account Selector Tabs */}
      {bankAccounts.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {bankAccounts.map((acc) => {
            const isSelected = (activeAccount?.id || '') === acc.id;
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => setSelectedAccId(acc.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-slate-primary border-border hover:border-slate-muted'
                }`}
              >
                <Building2 size={16} />
                <span>{acc.nickname}</span>
                {acc.accountNumberMasked && (
                  <span className={`text-[10px] font-mono ${isSelected ? 'opacity-80' : 'text-slate-secondary'}`}>
                    ({acc.accountNumberMasked})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="p-4 bg-white rounded-2xl border border-dashed border-border text-center">
          <p className="text-xs text-slate-secondary">No bank accounts linked yet.</p>
        </div>
      )}

      {/* 2. Top Summary Cards (Total Debit, Total Credit, Closing Balance) */}
      {activeAccount && (
        <div className="grid grid-cols-3 gap-2">
          {/* Total Debit */}
          <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100 flex flex-col justify-between">
            <div className="flex items-center gap-1 text-moneyOut">
              <ArrowUpRight size={14} />
              <span className="text-[10px] font-bold uppercase">Total Debit</span>
            </div>
            <span className="text-sm sm:text-base font-extrabold text-moneyOut tabular-nums mt-1">
              −{formatINR(totalDebit)}
            </span>
          </div>

          {/* Total Credit */}
          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex flex-col justify-between">
            <div className="flex items-center gap-1 text-moneyIn">
              <ArrowDownLeft size={14} />
              <span className="text-[10px] font-bold uppercase">Total Credit</span>
            </div>
            <span className="text-sm sm:text-base font-extrabold text-moneyIn tabular-nums mt-1">
              +{formatINR(totalCredit)}
            </span>
          </div>

          {/* Closing Balance */}
          <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col justify-between">
            <div className="flex items-center gap-1 text-primary">
              <Building2 size={14} />
              <span className="text-[10px] font-bold uppercase">Closing Balance</span>
            </div>
            <span className="text-sm sm:text-base font-extrabold text-primary tabular-nums mt-1">
              {formatINR(closingBalance)}
            </span>
          </div>
        </div>
      )}

      {/* 3. Action Toolbar (Add Entry, Import Statement, Export) */}
      {activeAccount && (
        <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white border border-border shadow-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsManualEntryModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <Plus size={14} /> Manual Entry
            </button>

            {/* Import Statement */}
            <label className="px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-slate-200/60 border border-border text-slate-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all">
              <Upload size={14} className="text-primary" />
              <span>Import Statement</span>
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={openTransferModal}
              className="px-2.5 py-1.5 rounded-xl bg-surface-subtle hover:bg-slate-200/60 text-slate-secondary text-xs font-bold flex items-center gap-1"
              title="Transfer to Cash / Other Bank"
            >
              Transfer
            </button>
          </div>
        </div>
      )}

      {/* 4. Ledger Table with Columns: Date | Description | Debit | Credit | Running Balance */}
      {activeAccount && (
        <div className="bg-white rounded-card border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-subtle text-slate-secondary border-b border-border font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Debit (Paid)</th>
                  <th className="py-2.5 px-3 text-right">Credit (Rcvd)</th>
                  <th className="py-2.5 px-3 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {currentLedger.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-primary whitespace-nowrap">
                      {row.date}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-primary block leading-tight">{row.description}</span>
                      {row.paymentMode && (
                        <span className="text-[10px] text-slate-secondary mt-0.5 block">{row.paymentMode}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-moneyOut tabular-nums whitespace-nowrap">
                      {row.debit > 0 ? `−${formatINR(row.debit)}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-moneyIn tabular-nums whitespace-nowrap">
                      {row.credit > 0 ? `+${formatINR(row.credit)}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-slate-primary tabular-nums whitespace-nowrap">
                      {formatINR(row.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD BANK ACCOUNT (SEARCH INDIAN BANKS) */}
      {isAddBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-floating border border-border animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-primary">Add Bank Account</h3>
                  <span className="text-xs text-slate-secondary">Link any Indian bank ledger</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBankModalOpen(false)}
                className="p-1 rounded-full text-slate-secondary"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBankAccount} className="space-y-4 py-4 max-h-[72vh] overflow-y-auto">
              {/* Search Indian Banks */}
              <div>
                <label className="block text-xs font-bold text-slate-secondary uppercase mb-1">
                  1. Search Indian Bank (e.g. typing "SBI" shows State Bank of India)
                </label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-secondary" />
                  <input
                    type="text"
                    placeholder="Type bank name or acronym (SBI, HDFC, PNB)..."
                    value={bankSearchQuery}
                    onChange={(e) => setBankSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-subtle border border-border text-xs text-slate-primary focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Filtered Banks Horizontal Chips */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 mt-2 no-scrollbar max-h-24">
                  {filteredBanks.map((bank) => (
                    <button
                      key={bank.code}
                      type="button"
                      onClick={() => {
                        setSelectedBankCode(bank.code);
                        setAccountNickname(`${bank.shortName} Account`);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap transition-all ${
                        selectedBankCode === bank.code
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-white text-slate-primary border-border hover:border-slate-muted'
                      }`}
                    >
                      <span>{bank.name}</span>
                      <span className="text-[10px] ml-1 opacity-80">({bank.code})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Nickname */}
              <div>
                <label className="block text-xs font-semibold text-slate-secondary mb-1">
                  Account Nickname
                </label>
                <input
                  type="text"
                  placeholder="e.g. Current Business Account"
                  value={accountNickname}
                  onChange={(e) => setAccountNickname(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs font-semibold text-slate-primary focus:outline-none focus:border-primary"
                />
              </div>

              {/* Last 4 Digits */}
              <div>
                <label className="block text-xs font-semibold text-slate-secondary mb-1">
                  Last 4 Digits of Account Number
                </label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="e.g. 4821"
                  value={last4}
                  onChange={(e) => setLast4(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs font-mono font-bold text-slate-primary focus:outline-none focus:border-primary"
                />
              </div>

              {/* Opening Balance */}
              <div>
                <label className="block text-xs font-semibold text-slate-secondary mb-1">
                  Opening Balance (₹)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={openingBalStr}
                  onChange={(e) => setOpeningBalStr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm font-bold text-primary focus:outline-none focus:border-primary tabular-nums"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBankModalOpen(false)}
                  className="flex-1 h-11 rounded-xl bg-surface-subtle text-slate-primary font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
                >
                  <Check size={16} /> Link Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD MANUAL ENTRY */}
      {isManualEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-floating border border-border animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-slate-primary">Manual Bank Ledger Entry</h3>
              <button
                type="button"
                onClick={() => setIsManualEntryModalOpen(false)}
                className="p-1 rounded-full text-slate-secondary"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveManualEntry} className="space-y-4 py-4">
              {/* Debit / Credit Segmented Control */}
              <div className="grid grid-cols-2 p-1 bg-surface-subtle rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setEntryType('CREDIT')}
                  className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    entryType === 'CREDIT'
                      ? 'bg-moneyIn text-white shadow-xs'
                      : 'text-slate-secondary hover:text-slate-primary'
                  }`}
                >
                  <ArrowDownLeft size={16} /> Credit (+ Deposit)
                </button>
                <button
                  type="button"
                  onClick={() => setEntryType('DEBIT')}
                  className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    entryType === 'DEBIT'
                      ? 'bg-moneyOut text-white shadow-xs'
                      : 'text-slate-secondary hover:text-slate-primary'
                  }`}
                >
                  <ArrowUpRight size={16} /> Debit (− Withdrawal)
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-secondary uppercase mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  autoFocus
                  placeholder="0"
                  value={entryAmountStr}
                  onChange={(e) => setEntryAmountStr(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-subtle border border-border text-2xl font-bold text-slate-primary focus:outline-none focus:border-primary tabular-nums"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-secondary mb-1">
                  Description / Particulars
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI transfer from customer or RTGS vendor bill"
                  value={entryDesc}
                  onChange={(e) => setEntryDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs text-slate-primary focus:outline-none focus:border-primary"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-secondary mb-1">
                  Transaction Date
                </label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs text-slate-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualEntryModalOpen(false)}
                  className="flex-1 h-11 rounded-xl bg-surface-subtle text-slate-primary font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
                >
                  <Check size={16} /> Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: IMPORT STATEMENT PREVIEW MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-floating border border-border flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-slate-primary">Confirm Statement Import</h3>
                <span className="text-xs text-slate-secondary">
                  {parsedRows.length} transactions detected from {importFileName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-full text-slate-secondary"
              >
                <X size={20} />
              </button>
            </div>

            {/* Preview List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {parsedRows.slice(0, 50).map((r, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-surface-subtle border border-border flex items-center justify-between text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-primary">{r.description}</span>
                    <span className="text-[10px] text-slate-secondary">{r.date}</span>
                  </div>
                  <span
                    className={`font-bold tabular-nums ${
                      r.credit > 0 ? 'text-moneyIn' : 'text-moneyOut'
                    }`}
                  >
                    {r.credit > 0 ? `+${formatINR(r.credit)}` : `−${formatINR(r.debit)}`}
                  </span>
                </div>
              ))}
              {parsedRows.length > 50 && (
                <p className="text-[11px] text-slate-secondary text-center pt-2">
                  + {parsedRows.length - 50} more entries will also be imported.
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="flex-1 h-11 rounded-xl bg-surface-subtle text-slate-primary font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Check size={16} /> Import All {parsedRows.length} Entries
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
