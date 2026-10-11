import React, { useState, useEffect } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { Reminder, ReminderType } from '../../types';
import { formatINR, paiseToRupees, rupeesToPaise } from '../../utils/formatters';
import {
  checkNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  openSystemAppSettings,
  AppNotificationPermission,
} from '../../services/reminderNotificationService';
import {
  Bell,
  X,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  AlertTriangle,
  Search,
  Filter,
  Trash2,
  Edit2,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const RemindersModal: React.FC = () => {
  const isOpen = useLedgerlyStore((state) => state.isRemindersModalOpen);
  const closeReminders = useLedgerlyStore((state) => state.closeRemindersModal);
  const reminders = useLedgerlyStore((state) => state.reminders);
  const addReminder = useLedgerlyStore((state) => state.addReminder);
  const updateReminder = useLedgerlyStore((state) => state.updateReminder);
  const deleteReminder = useLedgerlyStore((state) => state.deleteReminder);
  const toggleReminderComplete = useLedgerlyStore((state) => state.toggleReminderComplete);
  const snoozeReminder = useLedgerlyStore((state) => state.snoozeReminder);
  const parties = useLedgerlyStore((state) => state.parties);

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UPCOMING' | 'OVERDUE' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [type, setType] = useState<ReminderType>('PAYMENT_FOLLOWUP');
  const [amountRupees, setAmountRupees] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState('');

  // Permission State
  const [permStatus, setPermStatus] = useState<AppNotificationPermission>('prompt');
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkNotificationPermission().then(setPermStatus);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const now = new Date();

  // Filter & Search Reminders
  const filteredReminders = reminders.filter((rem) => {
    const remDate = new Date(rem.dateTime);
    const isOverdue = !rem.completed && remDate.getTime() < now.getTime();

    if (activeFilter === 'UPCOMING' && (rem.completed || isOverdue)) return false;
    if (activeFilter === 'OVERDUE' && (!isOverdue || rem.completed)) return false;
    if (activeFilter === 'COMPLETED' && !rem.completed) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = rem.title.toLowerCase().includes(q);
      const matchDesc = rem.description?.toLowerCase().includes(q) || false;
      const matchParty = rem.linkedName?.toLowerCase().includes(q) || false;
      return matchTitle || matchDesc || matchParty;
    }

    return true;
  });

  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a reminder title.');
      return;
    }

    const dateTimeStr = new Date(`${date}T${time}:00`).toISOString();
    const party = parties.find((p) => p.id === selectedPartyId);
    const paiseAmount = amountRupees ? rupeesToPaise(parseFloat(amountRupees) || 0) : undefined;

    if (editingReminderId) {
      updateReminder(editingReminderId, {
        title: title.trim(),
        description: description.trim() || undefined,
        dateTime: dateTimeStr,
        type,
        amount: paiseAmount,
        linkedId: selectedPartyId || undefined,
        linkedName: party?.name,
      });
      setEditingReminderId(null);
    } else {
      addReminder({
        title: title.trim(),
        description: description.trim() || undefined,
        dateTime: dateTimeStr,
        type,
        amount: paiseAmount,
        linkedId: selectedPartyId || undefined,
        linkedName: party?.name,
      });
    }

    // Reset Form
    setTitle('');
    setDescription('');
    setAmountRupees('');
    setSelectedPartyId('');
    setIsCreating(false);
  };

  const handleStartEdit = (rem: Reminder) => {
    setTitle(rem.title);
    setDescription(rem.description || '');
    const d = new Date(rem.dateTime);
    setDate(d.toISOString().split('T')[0]);
    setTime(d.toTimeString().substring(0, 5));
    setType(rem.type);
    setAmountRupees(rem.amount ? paiseToRupees(rem.amount).toString() : '');
    setSelectedPartyId(rem.linkedId || '');
    setEditingReminderId(rem.id);
    setIsCreating(true);
  };

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermStatus(res);
  };

  const handleTestNotification = async () => {
    const ok = await sendTestNotification();
    if (ok) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl max-h-[92dvh] flex flex-col shadow-2xl border border-border animate-in slide-in-from-bottom-5 duration-200 overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-[#161F30] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight leading-tight">Reminders & Follow-ups</h2>
              <p className="text-[11px] text-slate-300 font-medium">
                Scheduled notifications for dues, cheques, and tasks
              </p>
            </div>
          </div>
          <button
            onClick={closeReminders}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Permission Status Banner */}
        <div className="bg-slate-50 border-b border-border px-5 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                permStatus === 'granted' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="font-semibold text-slate-700">
              Notification Status:{' '}
              <strong className={permStatus === 'granted' ? 'text-emerald-700' : 'text-amber-700'}>
                {permStatus === 'granted' ? 'Active & Ready' : 'Permission Required'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {permStatus !== 'granted' ? (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition-colors"
              >
                Enable Notifications
              </button>
            ) : (
              <button
                type="button"
                onClick={handleTestNotification}
                className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[11px] transition-colors"
              >
                {testSent ? '✓ Sent Test Alert!' : '🔔 Test Alert'}
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Create / Edit Form Collapsible */}
          {isCreating ? (
            <form onSubmit={handleSaveReminder} className="bg-surface-subtle p-4 sm:p-5 rounded-2xl border border-indigo-200 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-sm font-bold text-slate-primary">
                  {editingReminderId ? 'Edit Reminder' : 'Create New Reminder'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingReminderId(null);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-secondary uppercase mb-1">
                    Reminder Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Call for balance payment, Deposit cheque"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-border text-sm font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-secondary uppercase mb-1">
                      Reminder Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as ReminderType)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-border text-xs font-semibold focus:outline-none"
                    >
                      <option value="PAYMENT_FOLLOWUP">Payment Follow-up</option>
                      <option value="INVOICE_DUE">Invoice Due Date</option>
                      <option value="CHEQUE_DUE">Cheque Clearance</option>
                      <option value="LOW_STOCK">Low Stock Re-order</option>
                      <option value="TASK">General Business Task</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-secondary uppercase mb-1">
                      Link Customer / Party (Optional)
                    </label>
                    <select
                      value={selectedPartyId}
                      onChange={(e) => setSelectedPartyId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-border text-xs font-semibold focus:outline-none"
                    >
                      <option value="">No Party Linked</option>
                      {parties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (+91 {p.phone || '—'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-secondary uppercase mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-border text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-secondary uppercase mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-border text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block font-bold text-slate-secondary uppercase mb-1">
                      Amount (₹ Optional)
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amountRupees}
                      onChange={(e) => setAmountRupees(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-border text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-secondary uppercase mb-1">
                    Notes / Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Details about the reminder..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-border text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingReminderId(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm"
                >
                  {editingReminderId ? 'Update Reminder' : 'Save & Schedule'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search reminders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-subtle border border-border text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex-shrink-0"
              >
                <Plus size={16} />
                <span>Add Reminder</span>
              </button>
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {(['ALL', 'UPCOMING', 'OVERDUE', 'COMPLETED'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                className={`px-3 py-1.5 rounded-full font-bold transition-colors whitespace-nowrap ${
                  activeFilter === tab
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-surface-subtle text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Reminders List */}
          {filteredReminders.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-border space-y-3">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Bell size={24} />
              </div>
              <h4 className="text-sm font-bold text-slate-primary">No reminders found</h4>
              <p className="text-xs text-slate-secondary max-w-xs mx-auto">
                {activeFilter === 'OVERDUE'
                  ? 'Great job! You have no overdue reminders or follow-ups.'
                  : 'Create reminders to keep track of customer payment dues, cheque dates, and business tasks.'}
              </p>
              {!isCreating && (
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Plus size={15} />
                  <span>Create First Reminder</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredReminders.map((rem) => {
                const remDate = new Date(rem.dateTime);
                const isOverdue = !rem.completed && remDate.getTime() < now.getTime();

                return (
                  <div
                    key={rem.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      rem.completed
                        ? 'bg-slate-50/70 border-slate-200 opacity-70'
                        : isOverdue
                        ? 'bg-rose-50/50 border-rose-200 shadow-xs'
                        : 'bg-white border-border shadow-xs hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Checkbox toggle */}
                        <button
                          type="button"
                          onClick={() => toggleReminderComplete(rem.id)}
                          className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors flex-shrink-0"
                        >
                          {rem.completed ? (
                            <CheckCircle2 size={20} className="text-emerald-600" />
                          ) : (
                            <Circle size={20} />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              className={`text-sm font-bold truncate leading-tight ${
                                rem.completed ? 'line-through text-slate-500' : 'text-slate-900'
                              }`}
                            >
                              {rem.title}
                            </h4>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                rem.type === 'PAYMENT_FOLLOWUP'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : rem.type === 'CHEQUE_DUE'
                                  ? 'bg-blue-100 text-blue-800'
                                  : rem.type === 'LOW_STOCK'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {rem.type.replace('_', ' ')}
                            </span>
                          </div>

                          {rem.description && (
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                              {rem.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 mt-2 text-[11px] font-semibold text-slate-500 flex-wrap">
                            <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-600 font-bold' : ''}`}>
                              <Clock size={13} />
                              <span>{remDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at {remDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                              {isOverdue && <span className="text-rose-600 font-bold">(Overdue)</span>}
                            </span>

                            {rem.linkedName && (
                              <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                                👤 {rem.linkedName}
                              </span>
                            )}

                            {rem.amount && (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                                {formatINR(rem.amount)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!rem.completed && (
                          <div className="flex items-center gap-1 mr-1">
                            <button
                              type="button"
                              onClick={() => snoozeReminder(rem.id, 60)}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold"
                              title="Snooze 1 Hour"
                            >
                              +1h
                            </button>
                            <button
                              type="button"
                              onClick={() => snoozeReminder(rem.id, 1440)}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold"
                              title="Snooze 1 Day"
                            >
                              +1d
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleStartEdit(rem)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteReminder(rem.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
