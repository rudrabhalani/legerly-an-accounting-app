import React, { useState } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import { UserRole, AppUser } from '../../types';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Smartphone,
  Check,
  X,
  Trash2,
  KeyRound,
  Crown,
  Briefcase,
  Eye,
  AlertCircle,
} from 'lucide-react';

export const MultiUserModal: React.FC = () => {
  const isMultiUserModalOpen = useLedgerlyStore((state) => state.isMultiUserModalOpen);
  const closeMultiUserModal = useLedgerlyStore((state) => state.closeMultiUserModal);
  const business = useLedgerlyStore((state) => state.business);
  const users = useLedgerlyStore((state) => state.users);
  const currentUserId = useLedgerlyStore((state) => state.currentUserId);
  const pendingInvite = useLedgerlyStore((state) => state.pendingInvite);
  const requestAddUser = useLedgerlyStore((state) => state.requestAddUser);
  const verifyAddUserOtp = useLedgerlyStore((state) => state.verifyAddUserOtp);
  const cancelPendingInvite = useLedgerlyStore((state) => state.cancelPendingInvite);
  const switchActiveUser = useLedgerlyStore((state) => state.switchActiveUser);
  const removeUser = useLedgerlyStore((state) => state.removeUser);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('STAFF');

  // OTP Verification State
  const [enteredOtp, setEnteredOtp] = useState('');
  const [simulatedOwnerOtp, setSimulatedOwnerOtp] = useState<string | null>(null);
  const [otpError, setOtpError] = useState(false);

  if (!isMultiUserModalOpen) return null;

  const ownerPhone = business.ownerPhone || business.phone || '9876543210';

  const handleRequestApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Please enter member name and mobile number.');
      return;
    }

    const { otp } = requestAddUser(name.trim(), phone.trim(), role);
    setSimulatedOwnerOtp(otp);
    setEnteredOtp('');
    setOtpError(false);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const success = verifyAddUserOtp(enteredOtp);
    if (success) {
      setSimulatedOwnerOtp(null);
      setName('');
      setPhone('');
      setRole('STAFF');
      setEnteredOtp('');
    } else {
      setOtpError(true);
      setTimeout(() => setOtpError(false), 2000);
    }
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'OWNER':
        return { label: 'Owner', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Crown };
      case 'MANAGER':
        return { label: 'Manager', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Briefcase };
      case 'STAFF':
        return { label: 'Staff', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: ShieldCheck };
      case 'VIEWER':
        return { label: 'Viewer', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: Eye };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-floating border border-border animate-in slide-in-from-bottom-5">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-subtle rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-primary">Multi-User Access</h3>
              <p className="text-xs text-slate-secondary">Share ledger access with team members</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeMultiUserModal}
            className="p-1.5 rounded-full hover:bg-slate-200/50 text-slate-secondary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto px-6 py-4 space-y-5 flex-1">
          {/* Owner Registered Device Notice */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
            <Smartphone size={20} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-primary-dark block">
                Registered Owner Device: +91 {ownerPhone}
              </span>
              <span className="text-[11px] text-slate-secondary mt-0.5 block leading-tight">
                All invitations require an instant OTP sent to this Owner device before access is granted.
              </span>
            </div>
          </div>

          {/* ACTIVE TEAM MEMBERS LIST */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-secondary">
                Active Users ({users.length})
              </span>
              <span className="text-[11px] text-slate-secondary">Tap user to switch role preview</span>
            </div>

            <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden bg-white">
              {users.map((u) => {
                const badge = getRoleBadge(u.role);
                const RoleIcon = badge.icon;
                const isCurrent = currentUserId === u.id;

                return (
                  <div
                    key={u.id}
                    onClick={() => switchActiveUser(u.id)}
                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                      isCurrent ? 'bg-primary-light/40' : 'hover:bg-surface-subtle'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-surface-subtle border border-border flex items-center justify-center font-bold text-xs text-primary">
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-primary leading-tight">
                            {u.name}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded-full bg-primary text-white text-[9px] font-bold">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-secondary mt-0.5 block">
                          +91 {u.phone}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 ${badge.color}`}
                      >
                        <RoleIcon size={12} />
                        <span>{badge.label}</span>
                      </span>

                      {u.role !== 'OWNER' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Remove access for ${u.name}?`)) {
                              removeUser(u.id);
                            }
                          }}
                          className="p-1 text-slate-muted hover:text-red-500"
                          title="Remove user"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ADD NEW MEMBER FORM */}
          {!pendingInvite ? (
            <form onSubmit={handleRequestApproval} className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-3">
              <span className="text-xs font-bold text-slate-primary uppercase block">
                + Add New Person (Owner Approval Required)
              </span>

              <div>
                <label className="block text-[11px] font-semibold text-slate-secondary mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Suresh Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-border text-xs font-semibold text-slate-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-secondary mb-1">
                  Mobile Number
                </label>
                <div className="flex items-center rounded-xl border border-border bg-white px-2.5 py-1.5">
                  <span className="text-xs font-bold text-slate-secondary mr-2">+91</span>
                  <input
                    type="tel"
                    placeholder="98250 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-slate-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Roles */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-secondary mb-1">
                  Assign Role & Permissions
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['STAFF', 'MANAGER', 'VIEWER'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition-all text-center ${
                        role === r
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-white text-slate-primary border-border hover:border-slate-muted'
                      }`}
                    >
                      {r === 'STAFF' ? 'Staff' : r === 'MANAGER' ? 'Manager' : 'Viewer'}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-slate-secondary mt-1 block">
                  {role === 'STAFF' && 'Staff can record Money In / Money Out transactions.'}
                  {role === 'MANAGER' && 'Manager has access to party ledgers, bank books, and invoices.'}
                  {role === 'VIEWER' && 'Viewer has read-only access to statements.'}
                </span>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all mt-2"
              >
                <KeyRound size={15} />
                <span>Send OTP to Owner's Device (+91 {ownerPhone})</span>
              </button>
            </form>
          ) : (
            /* OWNER DEVICE OTP VERIFICATION STEP */
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-4 animate-in fade-in">
              {/* Simulated Notification Header */}
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
                  <Smartphone size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900 leading-tight">
                    OTP Sent to Owner's Device (+91 {ownerPhone})
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    An approval OTP was sent to the Owner's phone to verify adding {pendingInvite.name} ({pendingInvite.phone}).
                  </p>
                </div>
              </div>

              {/* Simulated SMS Notification Banner */}
              <div className="p-3 bg-white rounded-xl border border-amber-200/80 text-xs shadow-xs space-y-1">
                <div className="flex justify-between items-center text-[10px] text-slate-secondary">
                  <span className="font-bold text-primary">📩 SMS Notification (Owner Device)</span>
                  <span>Just now</span>
                </div>
                <p className="text-slate-primary font-medium">
                  "Ledgerly Security: Use OTP <strong className="text-primary font-mono text-sm tracking-wider">{simulatedOwnerOtp}</strong> to approve adding {pendingInvite.name} ({pendingInvite.phone}) as {pendingInvite.role}."
                </p>
              </div>

              {/* Verification Form */}
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 uppercase mb-1">
                    Enter Owner Verification OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    placeholder="Enter 6-digit OTP"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-amber-300 text-center font-mono font-bold tracking-widest text-lg text-slate-primary focus:outline-none focus:border-primary"
                  />
                  {otpError && (
                    <span className="text-xs font-bold text-rose-600 block mt-1">
                      Invalid OTP. Please check the code sent to the Owner's device.
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={cancelPendingInvite}
                    className="flex-1 h-10 rounded-xl bg-white border border-border text-slate-secondary font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-10 rounded-xl bg-moneyIn hover:bg-moneyIn-hover text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Check size={16} /> Verify & Add User
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
