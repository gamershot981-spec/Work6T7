import React, { useState } from 'react';
import { User, Transaction, DepositRequest, WithdrawalRequest } from '../types';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Smartphone,
  ShieldCheck,
  Copy,
  Check,
  MessageSquare,
  AlertTriangle,
  FileText,
  Image as ImageIcon
} from 'lucide-react';

interface WalletViewProps {
  currentUser: User;
  transactions: Transaction[];
  deposits?: DepositRequest[];
  withdrawals?: WithdrawalRequest[];
  depositNumber: string;
  onDeposit: (amount: number, trxId: string, method: string, senderNumber?: string, screenshot?: string) => boolean | void;
  onWithdraw: (amount: number, acc: string, method: string) => void;
  onOpenInbox?: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const WalletView: React.FC<WalletViewProps> = ({
  currentUser,
  transactions,
  deposits = [],
  withdrawals = [],
  depositNumber,
  onDeposit,
  onWithdraw,
  onOpenInbox,
  onShowToast,
}) => {
  // Deposit Form
  const [depAmt, setDepAmt] = useState<string>('500');
  const [depTrx, setDepTrx] = useState<string>('');
  const [depSender, setDepSender] = useState<string>(currentUser.phone || '');
  const [depScreenshot, setDepScreenshot] = useState<string>('');
  const [depMethod, setDepMethod] = useState<string>('bKash');
  const [copiedNumber, setCopiedNumber] = useState(false);

  // Withdraw Form
  const [wdAmt, setWdAmt] = useState<string>('50');
  const [wdAcc, setWdAcc] = useState<string>(currentUser.phone || '');
  const [wdMethod, setWdMethod] = useState<string>('bKash');

  const DEPOSIT_NUMBER = depositNumber || '01774922356';

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(DEPOSIT_NUMBER);
    setCopiedNumber(true);
    onShowToast(`Deposit number ${DEPOSIT_NUMBER} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedNumber(false), 2500);
  };

  const userTransactions = transactions.filter(t => t.user.toLowerCase() === currentUser.username.toLowerCase());
  const userDeposits = deposits.filter(d => d.user.toLowerCase() === currentUser.username.toLowerCase());
  const userWithdrawals = withdrawals.filter(w => w.user.toLowerCase() === currentUser.username.toLowerCase());

  const pendingDepositTotal = userDeposits
    .filter(d => d.status === 'Pending')
    .reduce((sum, d) => sum + d.amount, 0);

  const pendingWithdrawalTotal = userWithdrawals
    .filter(w => w.status === 'Pending' || w.status === 'Processing')
    .reduce((sum, w) => sum + w.amount, 0);

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depAmt);
    if (isNaN(amt) || amt < 50) {
      onShowToast('Minimum deposit amount is ৳50.', 'error');
      return;
    }
    const cleanTrx = depTrx.trim().toUpperCase();
    if (!cleanTrx) {
      onShowToast('Please provide the bKash/Nagad Transaction ID (TrxID).', 'error');
      return;
    }

    // Duplicate TrxID check
    const isDuplicate = deposits.some(d => d.trxId.trim().toUpperCase() === cleanTrx);
    if (isDuplicate) {
      onShowToast('This transaction ID has already been used.', 'error');
      return;
    }

    if (!depSender.trim() || depSender.trim().length < 11) {
      onShowToast('Please enter your 11-digit sender phone number.', 'error');
      return;
    }

    onDeposit(amt, cleanTrx, depMethod, depSender.trim(), depScreenshot.trim());
    setDepTrx('');
    setDepScreenshot('');
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(wdAmt);
    if (isNaN(amt) || amt < 50) {
      onShowToast('Minimum withdrawal amount is ৳50.', 'error');
      return;
    }
    if (currentUser.balance < amt) {
      onShowToast(`Insufficient balance! Your available balance is ৳${currentUser.balance.toFixed(2)}.`, 'error');
      return;
    }
    if (!wdAcc.trim() || wdAcc.length < 11) {
      onShowToast('Please enter a valid 11-digit mobile account number.', 'error');
      return;
    }

    onWithdraw(amt, wdAcc.trim(), wdMethod);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Wallet & Payments</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your funds, add balance for job posting via bKash/Nagad, or withdraw earned rewards.
        </p>
      </div>

      {/* Top 3 Balance & Payment Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Balance Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-7 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Available Balance</span>
              <span className="text-emerald-400 font-mono">Verified Active</span>
            </div>
            <div className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono tabular-nums my-3">
              ৳{currentUser.balance.toFixed(2)}
            </div>
            <p className="text-xs text-slate-400">
              Only approved funds are available to spend or withdraw.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Deposit:</span>
              </span>
              <span className="font-mono font-bold text-amber-400">
                ৳{pendingDepositTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Reserved for Withdrawal:</span>
              <span className="font-mono font-bold text-slate-300">
                ৳{pendingWithdrawalTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/60">
              <span>Min. Withdrawal / Deposit:</span>
              <span className="text-white font-bold font-mono">৳50.00</span>
            </div>
          </div>
        </div>

        {/* Deposit Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base mb-1">
            <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
            <h3>Deposit Balance</h3>
          </div>
          
          {/* Prominent Deposit Instructions Box */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 my-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Send Money (Personal)
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                bKash / Nagad
              </span>
            </div>
            
            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-emerald-200/60">
              <span className="font-mono font-black text-slate-900 text-base tracking-wider select-all">
                {DEPOSIT_NUMBER}
              </span>
              <button
                type="button"
                onClick={handleCopyNumber}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                title="Copy Number"
              >
                {copiedNumber ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNumber ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="mt-2.5 pt-2 border-t border-emerald-200/60">
              <p className="text-xs font-bold text-emerald-950 leading-relaxed">
                “প্রথমে উপরের bKash/Nagad number-এ টাকা পাঠান। টাকা পাঠানোর পর নিচের তথ্য দিয়ে Deposit Request করুন।”
              </p>
              <span className="text-[10px] text-emerald-800 block mt-0.5">
                Admin approve করার আগে ব্যালেন্স যোগ হবে না (Pending থাকবে)।
              </span>
            </div>
          </div>

          <form onSubmit={handleDepositSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Step 1 — Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {['bKash', 'Nagad', 'Rocket'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDepMethod(m)}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      depMethod === m ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Step 2 — Amount (৳)</label>
                <input
                  type="number"
                  min="50"
                  step="10"
                  required
                  value={depAmt}
                  onChange={e => setDepAmt(e.target.value)}
                  placeholder="500"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Sender Number</label>
                <input
                  type="text"
                  required
                  value={depSender}
                  onChange={e => setDepSender(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Step 3 — Transaction ID (TrxID)
              </label>
              <input
                type="text"
                required
                value={depTrx}
                onChange={e => setDepTrx(e.target.value)}
                placeholder="SMS-এ পাওয়া TrxID লিখুন (e.g. BL92XA12)"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Optional Screenshot / Reference
              </label>
              <input
                type="text"
                value={depScreenshot}
                onChange={e => setDepScreenshot(e.target.value)}
                placeholder="Screenshot link or note (ঐচ্ছিক)"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-sans"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Submit Deposit Request</span>
            </button>
          </form>
        </div>

        {/* Withdraw Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base mb-1">
            <ArrowUpRight className="w-5 h-5 text-indigo-600" />
            <h3>Withdraw Earnings</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Payout processed directly to your mobile wallet within 2–6 hours after Admin verification.
          </p>

          <form onSubmit={handleWithdrawSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Method</label>
              <div className="grid grid-cols-3 gap-2">
                {['bKash', 'Nagad', 'Rocket'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setWdMethod(m)}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      wdMethod === m ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Amount to Payout (Min ৳50)</label>
              <input
                type="number"
                min="50"
                step="5"
                required
                value={wdAmt}
                onChange={e => setWdAmt(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Account Number</label>
              <input
                type="text"
                required
                value={wdAcc}
                onChange={e => setWdAcc(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Submit Withdrawal Request</span>
            </button>
          </form>
        </div>
      </div>

      {/* User Deposit Requests Tracking */}
      {userDeposits.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                <span>My Deposit Requests (ডিপোজিট রিকোয়েস্ট তালিকা)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                টাকা পাঠিয়ে সাবমিট করা আপনার ডিপোজিটের বর্তমান অবস্থা ও অ্যাডমিন ভেরিফিকেশন ফলাফল।
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
              {userDeposits.length} টি রিকোয়েস্ট
            </span>
          </div>

          <div className="space-y-3">
            {userDeposits.map(dep => {
              const isApproved = dep.status === 'Completed' || dep.status === 'Approved';
              const isPending = dep.status === 'Pending';
              const isRejected = dep.status === 'Rejected';

              return (
                <div
                  key={dep.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isApproved
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : isPending
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-800">
                        {dep.method}
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        ৳{dep.amount.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        · TrxID: <b className="text-slate-800 select-all">{dep.trxId}</b>
                      </span>
                      {dep.senderNumber && (
                        <span className="text-xs text-slate-400 font-mono">
                          · প্রেরক: {dep.senderNumber}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-mono">· {dep.date}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPending
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isApproved ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approved & Added ✓ (অনুমোদিত)</span>
                          </>
                        ) : isPending ? (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            <span>Awaiting Admin Approval (যাচাই চলছে)</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rejected (বাতিল করা হয়েছে)</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Show Rejection Reason clearly if rejected */}
                  {isRejected && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-rose-200 text-xs text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-rose-950">বাতিল করার কারণ (Admin Rejection Reason):</span>
                          <p className="text-rose-800 font-medium mt-0.5">
                            {dep.rejectionReason || 'ভুল TrxID বা অ্যাকাউন্টে টাকা জমা হয়নি।'}
                          </p>
                        </div>
                      </div>
                      {onOpenInbox && (
                        <button
                          onClick={onOpenInbox}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>ইনবক্স মেসেজ দেখুন</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* User Withdrawal Requests Tracking */}
      {userWithdrawals.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-indigo-600" />
                <span>My Withdrawal Requests (উইথড্র রিকোয়েস্ট তালিকা)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                আপনার দেওয়া উত্তোলনের আবেদনের অগ্রগতি এবং পেমেন্ট স্ট্যাটাস।
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
              {userWithdrawals.length} টি উত্তোলন
            </span>
          </div>

          <div className="space-y-3">
            {userWithdrawals.map(wd => {
              const isPaid = wd.status === 'Completed' || wd.status === 'Paid';
              const isProcessing = wd.status === 'Approved' || wd.status === 'Processing';
              const isPending = wd.status === 'Pending';
              const isRejected = wd.status === 'Rejected';

              return (
                <div
                  key={wd.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isPaid
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : isProcessing
                      ? 'bg-blue-50/40 border-blue-200'
                      : isPending
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-800">
                        {wd.method}
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        ৳{wd.amount.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        · নম্বর: <b className="text-slate-800">{wd.acc}</b>
                      </span>
                      <span className="text-xs text-slate-400 font-mono">· {wd.date}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-800'
                          : isProcessing
                          ? 'bg-blue-100 text-blue-800'
                          : isPending
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isPaid ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Paid Successfully ✓ (টাকা পাঠানো হয়েছে)</span>
                          </>
                        ) : isProcessing ? (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            <span>Processing (পেমেন্ট পাঠানো হচ্ছে)</span>
                          </>
                        ) : isPending ? (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending Approval (অ্যাডমিন অনুমোদনের অপেক্ষায়)</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rejected & Refunded (বাতিল ও রিফান্ডকৃত)</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {isRejected && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-rose-950">বাতিলের কারণ (টাকা মূল ব্যালেন্সে রিফান্ড করা হয়েছে):</span>
                        <p className="text-rose-800 font-medium mt-0.5">
                          {wd.rejectionReason || 'ভুল মোবাইল একাউন্ট নম্বর।'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transaction History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-lg font-bold text-slate-900 mb-1">Ledger & Transaction History</h3>
        <p className="text-xs text-slate-500 mb-5">
          Complete log of bonuses, ৳10 job posting fees, task earnings, deposits, and payouts.
        </p>

        {userTransactions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No transactions yet. Complete tasks or claim bonuses to start.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Details / Reference</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userTransactions.map(t => {
                  const isPositive = t.amount > 0;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-800">
                        {t.type}
                      </td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">
                        {t.details || 'System transaction'}
                      </td>
                      <td className={`p-3 text-right font-mono font-bold tabular-nums ${
                        isPositive ? 'text-emerald-600' : 'text-slate-900'
                      }`}>
                        {isPositive ? `+৳${t.amount.toFixed(2)}` : `-৳${Math.abs(t.amount).toFixed(2)}`}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'Success'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-400">
                        {t.date}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
