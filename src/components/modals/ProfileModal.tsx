import React, { useState } from 'react';
import { useLedgerlyStore } from '../../store/useLedgerlyStore';
import {
  X,
  Building2,
  User,
  ShieldCheck,
  CreditCard,
  QrCode,
  MapPin,
  Phone,
  Mail,
  Check,
  Crown,
  KeyRound,
  LogOut,
  Users,
  Briefcase,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { INDIAN_STATES } from '../../data/indianStates';
import { isValidGSTIN, isValidPAN, isValidIndianPhone } from '../../utils/validators';

export const ProfileModal: React.FC = () => {
  const isOpen = useLedgerlyStore((state) => state.isProfileModalOpen);
  const closeProfileModal = useLedgerlyStore((state) => state.closeProfileModal);
  const business = useLedgerlyStore((state) => state.business);
  const updateBusinessProfile = useLedgerlyStore((state) => state.updateBusinessProfile);
  const users = useLedgerlyStore((state) => state.users);
  const currentUserId = useLedgerlyStore((state) => state.currentUserId);
  const switchActiveUser = useLedgerlyStore((state) => state.switchActiveUser);
  const updateUserPin = useLedgerlyStore((state) => state.updateUserPin);
  const logoutUser = useLedgerlyStore((state) => state.logoutUser);
  const openMultiUserModal = useLedgerlyStore((state) => state.openMultiUserModal);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  const [activeTab, setActiveTab] = useState<'BUSINESS' | 'ACCOUNT' | 'SECURITY'>('BUSINESS');

  // Business Form State
  const [bizName, setBizName] = useState(business.name || '');
  const [ownerName, setOwnerName] = useState(business.ownerName || '');
  const [phone, setPhone] = useState(business.phone || '');
  const [email, setEmail] = useState(business.email || '');
  const [gstin, setGstin] = useState(business.gstin || '');
  const [address, setAddress] = useState(business.address || '');
  const [stateName, setStateName] = useState(business.state || 'Gujarat');
  const [pincode, setPincode] = useState(business.pincode || '');
  const [bizType, setBizType] = useState(business.businessType || 'RETAILER');
  const [upiId, setUpiId] = useState(business.upiId || '');
  const [bankName, setBankName] = useState(business.bankName || '');
  const [bankAccNo, setBankAccNo] = useState(business.bankAccountNo || '');
  const [bankIfsc, setBankIfsc] = useState(business.bankIfsc || '');

  // PIN / Security State
  const [currentPin, setCurrentPin] = useState(currentUser?.pin || '1234');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!bizName.trim()) {
      setErrorMsg('Business / Shop Name is required.');
      return;
    }

    if (gstin && !isValidGSTIN(gstin.trim())) {
      setErrorMsg('Please enter a valid 15-character Indian GSTIN.');
      return;
    }

    updateBusinessProfile({
      name: bizName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      gstin: gstin.trim().toUpperCase() || undefined,
      gstEnabled: !!gstin.trim(),
      address: address.trim(),
      state: stateName,
      pincode: pincode.trim(),
      businessType: bizType,
      upiId: upiId.trim() || undefined,
      bankName: bankName.trim() || undefined,
      bankAccountNo: bankAccNo.trim() || undefined,
      bankIfsc: bankIfsc.trim().toUpperCase() || undefined,
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      closeProfileModal();
    }, 1200);
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      setErrorMsg('PIN must be exactly 4 digits.');
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMsg('New PIN and Confirm PIN do not match.');
      return;
    }

    if (currentUser) {
      updateUserPin(currentUser.id, newPin);
      setCurrentPin(newPin);
      setNewPin('');
      setConfirmPin('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header with Vyapar Red Banner */}
        <div className="bg-gradient-to-r from-[#ED1A3B] to-[#C21833] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#ED1A3B] font-black text-xl flex items-center justify-center shadow-md">
              {(business.name || 'S').substring(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg sm:text-xl leading-tight">
                  {business.name || 'Business Profile'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider">
                  Vyapar Pro
                </span>
              </div>
              <p className="text-xs text-white/90 mt-0.5">
                Manage shop details, GSTIN, UPI QR, and team authentication
              </p>
            </div>
          </div>
          <button
            onClick={closeProfileModal}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation (Business Profile, My Account, Security & PIN) */}
        <div className="flex border-b border-gray-200 bg-gray-50/80 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('BUSINESS')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'BUSINESS'
                ? 'border-[#ED1A3B] text-[#ED1A3B]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Building2 size={15} />
            <span>Shop Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ACCOUNT')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'ACCOUNT'
                ? 'border-[#ED1A3B] text-[#ED1A3B]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <User size={15} />
            <span>Active User & Team</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SECURITY')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'SECURITY'
                ? 'border-[#ED1A3B] text-[#ED1A3B]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <ShieldCheck size={15} />
            <span>PIN & Security</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold animate-shake">
              ⚠️ {errorMsg}
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check size={16} className="text-emerald-600" />
              <span>Profile details saved successfully!</span>
            </div>
          )}

          {/* TAB 1: BUSINESS PROFILE */}
          {activeTab === 'BUSINESS' && (
            <form onSubmit={handleSaveBusiness} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Shop / Business Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    placeholder="e.g. Shree Sweet"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#ED1A3B] focus:outline-none font-semibold text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Owner / Manager Name</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Keyur Bhai"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#ED1A3B] focus:outline-none font-semibold text-gray-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Business Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-400 font-bold">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-12 pr-3 py-2 rounded-xl border border-gray-300 focus:border-[#ED1A3B] focus:outline-none font-semibold text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@shreesweet.com"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#ED1A3B] focus:outline-none font-semibold text-gray-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Business Type</label>
                  <select
                    value={bizType}
                    onChange={(e) => setBizType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#ED1A3B] focus:outline-none font-semibold text-gray-900 bg-white"
                  >
                    <option value="RETAILER">Retail Store / Kirana / Sweets</option>
                    <option value="WHOLESALER">Wholesaler / Distributor</option>
                    <option value="MANUFACTURER">Manufacturer</option>
                    <option value="SERVICE">Service Provider</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="24ABCDE1234F1Z5"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#ED1A3B] focus:outline-none font-mono font-bold text-gray-900"
                  />
                </div>
              </div>

              {/* Address details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-gray-100">
                <div className="sm:col-span-2">
                  <label className="font-bold text-gray-700 block mb-1">Shop Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Shop No. 4, Market Road, Near Station"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#ED1A3B] focus:outline-none font-semibold text-gray-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">State</label>
                  <select
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#ED1A3B] focus:outline-none font-semibold text-gray-900 bg-white"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st.name} value={st.name}>
                        {st.name} ({st.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* UPI & Bank details for Invoice QR */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center gap-2">
                  <QrCode size={16} className="text-[#ED1A3B]" />
                  <span className="font-bold text-gray-800">Bank & UPI for Invoices</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-600 block mb-1">UPI ID (for Bill QR Code)</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="shreesweet@okhdfcbank"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 font-mono text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-600 block mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="HDFC Bank / State Bank of India"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-600 block mb-1">Bank Account Number</label>
                    <input
                      type="text"
                      value={bankAccNo}
                      onChange={(e) => setBankAccNo(e.target.value)}
                      placeholder="50200012345678"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 font-mono text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-600 block mb-1">IFSC Code</label>
                    <input
                      type="text"
                      maxLength={11}
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                      placeholder="HDFC0001234"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 font-mono text-gray-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeProfileModal}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#ED1A3B] hover:bg-[#D32F2F] text-white font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Check size={16} />
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ACTIVE USER & TEAM SWITCHER */}
          {activeTab === 'ACCOUNT' && (
            <div className="space-y-4 text-xs">
              {/* Current Active User Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#ED1A3B] text-white font-extrabold text-lg flex items-center justify-center">
                    {(currentUser?.name || 'U').substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base">{currentUser?.name || 'Admin'}</span>
                      <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-black text-[10px] font-extrabold">
                        {currentUser?.role || 'OWNER'}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-300 block mt-0.5">
                      {currentUser?.phone ? `+91 ${currentUser.phone}` : 'Device Admin Session'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logoutUser}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center gap-1.5 text-xs transition-all"
                >
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>

              {/* User Switcher List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="font-bold text-gray-700 uppercase tracking-wide text-[11px]">
                    Switch Active User ({users.length} members)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      closeProfileModal();
                      openMultiUserModal();
                    }}
                    className="text-[#ED1A3B] hover:underline font-bold text-[11px]"
                  >
                    + Add New Member
                  </button>
                </div>

                <div className="space-y-2 divide-y divide-gray-100 bg-white rounded-2xl border border-gray-200 p-2">
                  {users.map((u) => {
                    const isCurrent = u.id === currentUser?.id;
                    return (
                      <div
                        key={u.id}
                        onClick={() => switchActiveUser(u.id)}
                        className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                          isCurrent
                            ? 'bg-red-50 border border-red-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                              isCurrent
                                ? 'bg-[#ED1A3B] text-white'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {u.name.substring(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block leading-tight">{u.name}</span>
                            <span className="text-[10px] text-gray-500">
                              {u.phone ? `+91 ${u.phone}` : 'Local Account'} • {u.role}
                            </span>
                          </div>
                        </div>

                        {isCurrent ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Active Now
                          </span>
                        ) : (
                          <span className="text-xs text-blue-600 font-bold hover:underline">
                            Switch &rarr;
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Role Permissions Reference */}
              <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-2 text-xs">
                <span className="font-bold text-blue-900 block">Role Permissions Overview:</span>
                <ul className="space-y-1 text-blue-800 text-[11px]">
                  <li>• <strong>Owner / Admin:</strong> Full access to all modules, P&L, bank transfers, and delete privileges.</li>
                  <li>• <strong>Accountant:</strong> Manage Day Book, GST Returns, Balance Sheet, and bank passbooks.</li>
                  <li>• <strong>Salesperson:</strong> Create sale bills, record payments in, view customer khata only.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: PIN & SECURITY */}
          {activeTab === 'SECURITY' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
                <KeyRound size={20} className="text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900">4-Digit Security PIN Protection</h4>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Your 4-digit PIN secures billing and authorizes switching accounts. Default PIN is <code className="font-bold">1234</code>.
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpdatePin} className="space-y-3.5 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">New 4-Digit PIN</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="••••"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono text-center text-lg tracking-widest text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Confirm New PIN</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      placeholder="••••"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono text-center text-lg tracking-widest text-gray-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#ED1A3B] hover:bg-[#D32F2F] text-white font-bold flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Check size={16} />
                    <span>Update Security PIN</span>
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
