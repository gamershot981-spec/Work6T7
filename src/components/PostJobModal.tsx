import React, { useState } from 'react';
import { User, Job, Transaction } from '../types';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PostJobModalProps {
  currentUser: User;
  onClose: () => void;
  onPostJob: (newJob: Job, newTransactions: Transaction[], totalDeduction: number) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  onOpenWallet: () => void;
}

const CATEGORIES = [
  'YouTube',
  'Social Media',
  'App Testing',
  'Data Entry',
  'Survey',
  'Content & Reviews',
  'Telegram / Discord',
];

export const PostJobModal: React.FC<PostJobModalProps> = ({
  currentUser,
  onClose,
  onPostJob,
  onShowToast,
  onOpenWallet,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [payPerWorker, setPayPerWorker] = useState<number>(3.0);
  const [workersNeeded, setWorkersNeeded] = useState<number>(20);
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const POSTING_FEE = 10.0; // Strictly ৳10 Fee
  const totalCost = POSTING_FEE;
  const hasEnoughFunds = currentUser.balance >= POSTING_FEE;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!title.trim() || title.length < 5) {
      onShowToast('Please enter a descriptive job title (min 5 chars).', 'error');
      return;
    }
    if (payPerWorker < 1) {
      onShowToast('Minimum worker payout is ৳1.00.', 'error');
      return;
    }
    if (workersNeeded < 1) {
      onShowToast('Must require at least 1 worker.', 'error');
      return;
    }
    if (!instructions.trim() || instructions.length < 15) {
      onShowToast('Please write step-by-step instructions for workers (min 15 chars).', 'error');
      return;
    }

    // Wallet balance validation: strictly need ৳10 fee
    if (!hasEnoughFunds) {
      onShowToast(`Insufficient wallet balance! You need at least ৳${POSTING_FEE.toFixed(2)} to post a job.`, 'error');
      return;
    }

    setIsSubmitting(true);

    const jobId = Date.now();
    const newJob: Job = {
      id: jobId,
      poster: currentUser.username,
      posterName: currentUser.name,
      title: title.trim(),
      category,
      pay: Number(payPerWorker),
      needed: Number(workersNeeded),
      done: 0,
      inst: instructions.trim(),
      status: 'Pending Approval', // User job posts start as Pending Approval
      createdAt: new Date().toISOString().split('T')[0],
    };

    // Strictly ৳10 fee transaction
    const txDate = new Date().toLocaleDateString();
    const transactions: Transaction[] = [
      {
        id: `tx_${Date.now()}_fee`,
        user: currentUser.username,
        type: 'Job Posting Fee',
        amount: -POSTING_FEE,
        status: 'Success',
        date: txDate,
        details: `Platform review & posting fee for Job #${jobId}`,
      },
    ];

    onPostJob(newJob, transactions, POSTING_FEE);
    onShowToast('Job submitted! ৳10 fee deducted. Sent to Admin for review.', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden relative my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Post a Microjob Task</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tasks require admin approval before becoming visible on the public marketplace.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Job Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Subscribe to YouTube Channel & Comment"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pay / Worker (৳)
              </label>
              <input
                type="number"
                min="1"
                step="0.5"
                required
                value={payPerWorker}
                onChange={e => setPayPerWorker(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Workers Needed
              </label>
              <input
                type="number"
                min="1"
                max="5000"
                required
                value={workersNeeded}
                onChange={e => setWorkersNeeded(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Instructions for Workers (Step-by-Step)
            </label>
            <textarea
              required
              rows={4}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="1. Visit link...\n2. Perform required action...\n3. Submit screenshot and username as proof."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Pricing breakdown & Wallet balance card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span className="font-semibold text-slate-800">Job Posting Fee (সরাসরি ওয়ালেট থেকে কাটবে):</span>
              <span className="font-mono font-bold text-indigo-700">৳{POSTING_FEE.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Worker Payout per submission (অনুমোদনের সময় দেয়া হবে):</span>
              <span className="font-mono">৳{payPerWorker.toFixed(2)} / worker</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
              <span className="font-bold text-slate-900">Total Deduction Now:</span>
              <span className="font-mono font-extrabold text-indigo-600 text-base">
                ৳{POSTING_FEE.toFixed(2)}
              </span>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Your Current Wallet:</span>
              <span className={`font-mono font-bold ${hasEnoughFunds ? 'text-emerald-600' : 'text-rose-600'}`}>
                ৳{currentUser.balance.toFixed(2)}
              </span>
            </div>

            {!hasEnoughFunds && (
              <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>
                    Insufficient funds! You need ৳{(POSTING_FEE - currentUser.balance).toFixed(2)} more (Min ৳10 needed to post).
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenWallet();
                    }}
                    className="ml-2 font-bold underline hover:text-rose-900"
                  >
                    Deposit now
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
              Reviewed by Admin before publishing
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!hasEnoughFunds || isSubmitting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Pay ৳10 Fee & Submit Job'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
