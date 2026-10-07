import React, { useState } from 'react';
import { User, Transaction } from '../types';
import { X, Lock, User as UserIcon, ShieldAlert, Gift, ArrowRight } from 'lucide-react';

interface AuthModalsProps {
  mode: 'login' | 'register' | 'admin' | null;
  onClose: () => void;
  allUsers: User[];
  initialRefCode?: string;
  onLoginSuccess: (user: User) => void;
  onRegisterSuccess: (newUser: User, newTxList: Transaction[], updatedReferrer?: User) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AuthModals: React.FC<AuthModalsProps> = ({
  mode,
  onClose,
  allUsers,
  initialRefCode = '',
  onLoginSuccess,
  onRegisterSuccess,
  onShowToast,
}) => {
  // Login State
  const [logIdentifier, setLogIdentifier] = useState('');
  const [logPassword, setLogPassword] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRefCode, setRegRefCode] = useState(initialRefCode);

  // Admin State
  const [adminUsername] = useState('WORK6T7');
  const [adminPassword, setAdminPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!mode) return null;

  // Handle Login with Server-side Database Verification
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = logIdentifier.trim().toLowerCase();
    const cleanPass = logPassword.trim();

    if (!cleanId || !cleanPass) {
      onShowToast('Please enter both username/email and password.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. First attempt authoritative database login via server
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, password: cleanPass }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setIsSubmitting(false);
          onLoginSuccess(data.user);
          onShowToast(`Welcome back, ${data.user.name}! (Wallet: ৳${Number(data.user.balance).toFixed(2)})`, 'success');
          onClose();
          return;
        }
      } else if (res.status === 403) {
        setIsSubmitting(false);
        onShowToast('This account has been suspended by administrator.', 'error');
        return;
      }
    } catch {
      // Server unreachable, fallback to local database
    }

    // Fallback to local verified store
    const matchedUser = allUsers.find(
      u => (u.username.toLowerCase() === cleanId || (u.email && u.email.toLowerCase() === cleanId)) && u.password === cleanPass
    );

    setIsSubmitting(false);

    if (matchedUser) {
      if (matchedUser.isBanned) {
        onShowToast('This account has been suspended by administrator.', 'error');
        return;
      }
      onLoginSuccess(matchedUser);
      onShowToast(`Welcome back, ${matchedUser.name}! (Wallet: ৳${Number(matchedUser.balance).toFixed(2)})`, 'success');
      onClose();
    } else {
      onShowToast('Invalid username or password. Please verify credentials.', 'error');
    }
  };

  // Handle Registration with Database Atomicity & Signup Bonus
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = regUsername.trim().toLowerCase();
    const cleanPassword = regPassword.trim();
    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanRef = regRefCode.trim().toUpperCase();

    // Validations
    if (!cleanUsername || cleanUsername.length < 3) {
      onShowToast('Username must be at least 3 characters.', 'error');
      return;
    }
    if (!cleanPassword || cleanPassword.length < 4) {
      onShowToast('Password must be at least 4 characters.', 'error');
      return;
    }

    // Fraud / Duplicate Check 1: Username exists
    const userExists = allUsers.some(u => u.username.toLowerCase() === cleanUsername);
    if (userExists) {
      onShowToast('This username is already taken. Please pick another.', 'error');
      return;
    }

    // Fraud / Duplicate Check 2: Email exists (if provided)
    if (cleanEmail) {
      const emailExists = allUsers.some(u => u.email && u.email.toLowerCase() === cleanEmail);
      if (emailExists) {
        onShowToast('An account with this email already exists.', 'error');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          password: cleanPassword,
          name: cleanName || cleanUsername,
          email: cleanEmail || `${cleanUsername}@mail.bd`,
          refCode: cleanRef,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsSubmitting(false);
        onRegisterSuccess(data.user, data.transactions, data.referrer);
        onShowToast('Registration successful! ৳5.00 bonus credited to your wallet.', 'success');
        onClose();
        return;
      }
    } catch {
      // Fallback
    }

    setIsSubmitting(false);
    const generatedRefCode = `W6T7-${cleanUsername.toUpperCase()}`;

    // Create New User with ৳5.00 Signup Bonus
    const newUser: User = {
      username: cleanUsername,
      password: cleanPassword,
      name: cleanName || cleanUsername,
      email: cleanEmail || `${cleanUsername}@mail.bd`,
      bio: 'Ready to work on verified microjobs!',
      profilePhoto: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
      balance: 5.0, // Initial ৳5 Signup Bonus
      earnings: 0.0,
      refCode: generatedRefCode,
      isAdmin: false,
      joinedAt: new Date().toISOString().split('T')[0],
    };

    const newTransactions: Transaction[] = [
      {
        id: `tx_${Date.now()}_bonus`,
        user: cleanUsername,
        type: 'Signup Bonus',
        amount: 5.0,
        status: 'Success',
        date: new Date().toLocaleDateString(),
        details: 'One-time registration bonus added to wallet',
      },
    ];

    // Referral Bonus Logic: Referrer gets ৳5.00
    let updatedReferrer: User | undefined;
    if (cleanRef) {
      if (cleanRef === generatedRefCode || cleanRef === `W6T7-${cleanUsername.toUpperCase()}`) {
        onShowToast('Self-referral is strictly prohibited.', 'error');
        return;
      }

      const referrer = allUsers.find(u => u.refCode.toUpperCase() === cleanRef);
      if (referrer) {
        updatedReferrer = {
          ...referrer,
          balance: referrer.balance + 5.0,
          earnings: referrer.earnings + 5.0,
        };
        newUser.referredBy = cleanRef;

        newTransactions.push({
          id: `tx_${Date.now()}_ref`,
          user: referrer.username,
          type: 'Referral Bonus',
          amount: 5.0,
          status: 'Success',
          date: new Date().toLocaleDateString(),
          details: `Referral reward for inviting @${cleanUsername}`,
        });
      } else {
        onShowToast('Referral code not found. Account created without referral bonus.', 'error');
      }
    }

    onRegisterSuccess(newUser, newTransactions, updatedReferrer);
    onShowToast('Registration successful! ৳5.00 bonus credited.', 'success');
    onClose();
  };

  // Handle Admin Access
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const SECRET_ADMIN_PASSCODE = 'work6t7admin87358#45#$6@';

    if (adminPassword === SECRET_ADMIN_PASSCODE) {
      let adminAccount = allUsers.find(u => u.isAdmin || u.username === 'admin');
      if (!adminAccount) {
        adminAccount = {
          username: 'admin',
          password: SECRET_ADMIN_PASSCODE,
          name: 'Work 6T7 Admin',
          balance: 50.0,
          earnings: 0,
          refCode: 'W6T7-ADMIN',
          isAdmin: true,
          joinedAt: '2026-01-01',
        };
      }
      onLoginSuccess({ ...adminAccount, isAdmin: true });
      onShowToast('Admin authentication confirmed. Access granted.', 'success');
      onClose();
    } else {
      onShowToast('Incorrect admin passcode. Access denied.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden relative my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. LOGIN MODAL */}
        {mode === 'login' && (
          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Login to Work 6T7</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your registered username/email and password to access your account.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username or Email
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={logIdentifier}
                    onChange={e => setLogIdentifier(e.target.value)}
                    placeholder="e.g. shakib or your username"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={logPassword}
                    onChange={e => setLogPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                Sign In
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* 2. REGISTER MODAL */}
        {mode === 'register' && (
          <div className="p-6 sm:p-8">
            <div className="mb-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold mb-2">
                <Gift className="w-3.5 h-3.5" />
                <span>Instant ৳5 Signup Bonus Credited</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create Free Account</h2>
              <p className="text-xs text-slate-500">
                Join thousands of verified workers and employers across Bangladesh.
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="e.g. Shakib Al Hasan"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={e => setRegUsername(e.target.value)}
                    placeholder="shakib75"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="Min. 4 chars"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="shakib@gmail.com"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Referral Code (Optional)
                  </label>
                  <span className="text-[11px] text-indigo-600 font-medium">Referrer earns ৳5</span>
                </div>
                <input
                  type="text"
                  value={regRefCode}
                  onChange={e => setRegRefCode(e.target.value)}
                  placeholder="e.g. W6T7-DIGITAL"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 uppercase tracking-wider outline-none"
                />
              </div>

              <p className="text-[11px] text-slate-400">
                By registering, you accept our anti-fraud policy. Duplicate accounts will be frozen.
              </p>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 mt-2"
              >
                <Gift className="w-4 h-4" />
                Claim ৳5 & Register
              </button>
            </form>
          </div>
        )}

        {/* 3. ADMIN LOGIN MODAL */}
        {mode === 'admin' && (
          <div className="p-6 sm:p-8 bg-slate-900 text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Admin Portal</h2>
                <p className="text-xs text-slate-400">Security verification required</p>
              </div>
            </div>

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Admin Identifier
                </label>
                <input
                  type="text"
                  value={adminUsername}
                  readOnly
                  className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 text-slate-300 rounded-xl cursor-not-allowed outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Admin Security Passcode
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="Enter secret admin passcode"
                  className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 text-white rounded-xl focus:border-amber-400 outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-colors"
              >
                Access Administration
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
