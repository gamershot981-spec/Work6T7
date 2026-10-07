import React, { useState } from 'react';
import { User, Job, Transaction } from '../types';
import { X, AlertCircle, CheckCircle2, DollarSign, Calendar, Upload, Image as ImageIcon, ShieldAlert } from 'lucide-react';

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
  'Facebook',
  'Telegram / Discord',
  'App Testing',
  'Data Entry',
  'Survey',
  'Content & Reviews',
  'Website Visit & Signup',
];

const DEADLINES = [
  '24 Hours',
  '2 Days',
  '3 Days',
  '5 Days',
  '7 Days',
  '14 Days',
  'No Expiry',
];

export const PostJobModal: React.FC<PostJobModalProps> = ({
  currentUser,
  onClose,
  onPostJob,
  onShowToast,
  onOpenWallet,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [payPerWorker, setPayPerWorker] = useState<number>(5.0);
  const [workersNeeded, setWorkersNeeded] = useState<number>(10);
  const [instructions, setInstructions] = useState('');
  const [requiredProof, setRequiredProof] = useState('');
  const [deadline, setDeadline] = useState(DEADLINES[2]); // 3 Days default
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Escrow Budget calculation:
  // Total Worker Budget = payPerWorker * workersNeeded
  // Platform Review Fee = ৳10 (or ৳0 for admin)
  const PLATFORM_FEE = currentUser.isAdmin ? 0 : 10.0;
  const workerBudget = Math.max(0, payPerWorker * workersNeeded);
  const totalRequiredBudget = workerBudget + PLATFORM_FEE;
  const hasEnoughFunds = currentUser.balance >= totalRequiredBudget;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        onShowToast('Image size must be under 5MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
          onShowToast('Task image attached successfully!', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!title.trim() || title.length < 5) {
      onShowToast('Please enter a descriptive task title (min 5 characters).', 'error');
      return;
    }
    if (payPerWorker < 1) {
      onShowToast('Minimum worker reward is ৳1.00.', 'error');
      return;
    }
    if (workersNeeded < 1) {
      onShowToast('Must require at least 1 worker slot.', 'error');
      return;
    }
    if (!instructions.trim() || instructions.length < 15) {
      onShowToast('Please write step-by-step instructions for workers (min 15 characters).', 'error');
      return;
    }
    if (!requiredProof.trim()) {
      onShowToast('Please specify what proof the worker must submit (e.g. username + screenshot).', 'error');
      return;
    }

    // Escrow balance validation
    if (!hasEnoughFunds) {
      onShowToast(
        `Insufficient wallet balance! You need ৳${totalRequiredBudget.toFixed(2)} to post this task.`,
        'error'
      );
      return;
    }

    setIsSubmitting(true);

    const jobId = Date.now();
    const newJob: Job = {
      id: jobId,
      poster: currentUser.username,
      posterName: currentUser.name,
      title: title.trim(),
      description: description.trim() || title.trim(),
      category,
      pay: Number(payPerWorker),
      needed: Number(workersNeeded),
      done: 0,
      inst: instructions.trim(),
      requiredProof: requiredProof.trim(),
      deadline,
      imageUrl: imageUrl.trim() || undefined,
      totalBudget: workerBudget,
      spentBudget: 0,
      status: currentUser.isAdmin ? 'Approved' : 'Active', // Instantly active for trusted post
      createdAt: new Date().toISOString().split('T')[0],
    };

    const txDate = new Date().toLocaleDateString();
    const transactions: Transaction[] = [];

    // 1. Escrow Budget Reserve Transaction
    if (workerBudget > 0) {
      transactions.push({
        id: `tx_${Date.now()}_escrow`,
        user: currentUser.username,
        type: 'Task Budget Reserve',
        amount: -workerBudget,
        taskId: jobId,
        status: 'Success',
        date: txDate,
        details: `Task budget escrow reserved for Task #${jobId} (${workersNeeded} slots × ৳${payPerWorker.toFixed(2)})`,
        description: `Reserved for worker payouts on task: ${newJob.title}`,
      });
    }

    // 2. Platform Posting Fee Transaction (if applicable)
    if (PLATFORM_FEE > 0) {
      transactions.push({
        id: `tx_${Date.now() + 1}_fee`,
        user: currentUser.username,
        type: 'Job Posting Fee',
        amount: -PLATFORM_FEE,
        taskId: jobId,
        status: 'Success',
        date: txDate,
        details: `Platform task publication fee for Task #${jobId}`,
      });
    }

    onPostJob(newJob, transactions, totalRequiredBudget);
    onShowToast(
      `Task published! ৳${workerBudget.toFixed(2)} escrow reserved in your task pool.`,
      'success'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden relative my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">💼</span>
              <h2 className="text-xl font-extrabold text-slate-900">Create Paid Microjob / Task</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Set task instructions, slots, and escrow reward. Budget is safely held until you approve worker proofs.
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Follow Facebook Page & Like Latest Post"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Task Description / Overview
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief overview explaining why this task is needed and what workers will achieve..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Category & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Deadline / Time Limit
              </label>
              <select
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              >
                {DEADLINES.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Slots & Reward Per Worker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
            <div>
              <label className="block text-xs font-bold text-indigo-950 mb-1">
                Reward Amount (৳ per Worker) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-indigo-700">৳</span>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  required
                  value={payPerWorker}
                  onChange={e => setPayPerWorker(parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-3 py-2 text-sm bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-bold text-slate-900"
                />
              </div>
              <span className="text-[10px] text-indigo-600 block mt-0.5">Amount credited to worker on approval</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-indigo-950 mb-1">
                Available Slots (Total Workers) *
              </label>
              <input
                type="number"
                min="1"
                max="5000"
                required
                value={workersNeeded}
                onChange={e => setWorkersNeeded(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-bold text-slate-900"
              />
              <span className="text-[10px] text-indigo-600 block mt-0.5">Auto-completes when slots are filled</span>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Step-by-Step Task Instructions *
            </label>
            <textarea
              required
              rows={3}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="1. Open link: https://...\n2. Click Follow / Subscribe button\n3. Leave a positive comment\n4. Take a clear screenshot of your profile"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs"
            />
          </div>

          {/* Required Proof */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Required Proof Information *
            </label>
            <input
              type="text"
              required
              value={requiredProof}
              onChange={e => setRequiredProof(e.target.value)}
              placeholder="e.g. Your Facebook username + Screenshot link proving you followed"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
            />
          </div>

          {/* Task Image / Attachment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Task Image / Screenshot Sample (Optional)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={imageUrl.startsWith('data:') ? 'Image uploaded from device' : imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="Enter image URL or select from device gallery..."
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <label className="cursor-pointer px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>Gallery</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>
            </div>
            {imageUrl && (
              <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border border-slate-300 bg-slate-100">
                <img src={imageUrl} alt="Task preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-1 right-1 bg-slate-900/80 text-white p-0.5 rounded-full hover:bg-rose-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Pricing & Escrow Breakdown Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Worker Escrow Budget ({workersNeeded} slots × ৳{payPerWorker.toFixed(2)}):</span>
              <span className="font-mono font-bold text-slate-900">৳{workerBudget.toFixed(2)}</span>
            </div>
            {PLATFORM_FEE > 0 && (
              <div className="flex justify-between items-center text-slate-600">
                <span>Platform Publication Fee:</span>
                <span className="font-mono font-bold text-indigo-700">৳{PLATFORM_FEE.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold">
              <span className="text-slate-900">Total Wallet Deduction (Escrow Reserved):</span>
              <span className="font-mono font-extrabold text-indigo-600 text-base">
                ৳{totalRequiredBudget.toFixed(2)}
              </span>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] border-t border-slate-200/60">
              <span className="text-slate-500">Your Available Balance:</span>
              <span className={`font-mono font-bold ${hasEnoughFunds ? 'text-emerald-600' : 'text-rose-600'}`}>
                ৳{currentUser.balance.toFixed(2)}
              </span>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
              🛡️ <b>Escrow Protection:</b> ৳{workerBudget.toFixed(2)} আপনার ওয়ালেট থেকে সুরক্ষিত রিজার্ভে থাকবে। Worker কাজ জমা দেওয়ার পর আপনি যাচাই করে Approve করলে তবেই worker টাকা পাবে। Task বাতিল করলে অব্যবহৃত টাকা ওয়ালেটে ফেরত আসবে।
            </p>

            {!hasEnoughFunds && (
              <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>
                    Insufficient balance! You need ৳{(totalRequiredBudget - currentUser.balance).toFixed(2)} more to reserve this task budget.
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

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
              Instant Escrow Protected
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
                className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>{isSubmitting ? 'Publishing...' : `Reserve ৳${totalRequiredBudget.toFixed(2)} & Publish Task`}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
