import React, { useState } from 'react';
import { User, Job } from '../types';
import { 
  X, 
  MessageSquare, 
  CheckCircle, 
  Send, 
  User as UserIcon, 
  Calendar,
  Layers,
  ArrowRight,
  Trash2
} from 'lucide-react';

interface JobDetailsModalProps {
  job: Job;
  currentUser: User | null;
  onClose: () => void;
  onOpenMessagePoster: (posterUsername: string, jobId: number, jobTitle: string) => void;
  onSubmitProof: (jobId: number, proof: string) => void;
  onRequireLogin: () => void;
  hasAppliedAlready: boolean;
  onDeleteJob?: (jobId: number) => void;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  currentUser,
  onClose,
  onOpenMessagePoster,
  onSubmitProof,
  onRequireLogin,
  hasAppliedAlready,
  onDeleteJob,
}) => {
  const [proofText, setProofText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isOwner = currentUser?.username.toLowerCase() === job.poster.toLowerCase();
  const isAdmin = currentUser?.isAdmin;
  const isAdminPost = job.poster.toLowerCase() === 'admin' || job.posterName === 'Work 6T7 Official';

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    if (!proofText.trim()) return;

    setSubmitting(true);
    onSubmitProof(job.id, proofText.trim());
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden relative my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                {job.category}
              </span>
              <span>·</span>
              <span className="font-mono">Job #{job.id}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {job.createdAt}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{job.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {(isAdmin || isOwner) && onDeleteJob && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Permanently delete post #${job.id}: "${job.title}"?`)) {
                    onDeleteJob(job.id);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                title="Delete Post"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isAdmin ? 'Admin: Delete Post' : 'Delete Post'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Key Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Worker Payout
              </span>
              <span className="text-2xl font-black text-emerald-600 font-mono tabular-nums">
                ৳{job.pay.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Completion
              </span>
              <span className="text-lg font-bold text-slate-800 font-mono tabular-nums">
                {job.done} / {job.needed}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {Math.max(0, job.needed - job.done)} slots remaining
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Posted By
              </span>
              {isAdminPost ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-base">👑</span>
                  <span className="text-sm font-black text-amber-900 truncate block">
                    Post by Admin
                  </span>
                </div>
              ) : (
                <>
                  <span className="text-sm font-bold text-slate-900 truncate block">
                    {job.posterName || job.poster}
                  </span>
                  <span className="text-[11px] font-mono text-indigo-600">
                    @{job.poster}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Job Poster & Message / Inbox Action */}
          {isAdminPost ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-50 rounded-xl border border-amber-300 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 font-bold flex items-center justify-center text-xl shadow-xs ring-1 ring-amber-300 select-none">
                  👑
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-amber-950 block">
                      Post by Admin
                    </span>
                    <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Official Task
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-800">
                    This task is officially posted and guaranteed by Work 6T7 Administration.
                  </span>
                </div>
              </div>

              {!isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser) {
                      onRequireLogin();
                      return;
                    }
                    onOpenMessagePoster(job.poster, job.id, job.title);
                    onClose();
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
                >
                  <MessageSquare className="w-4 h-4" />
                  Contact Admin
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {job.poster.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Employer: {job.posterName || job.poster}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Have questions about this task? Chat directly with the poster.
                  </span>
                </div>
              </div>

              {/* MANDATORY: "Message / Inbox" button linking to Poster with Job ID */}
              {!isOwner ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser) {
                      onRequireLogin();
                      return;
                    }
                    onOpenMessagePoster(job.poster, job.id, job.title);
                    onClose();
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors shrink-0"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message / Inbox
                </button>
              ) : (
                <span className="text-xs font-medium text-indigo-700 bg-white px-3 py-1.5 rounded-lg border border-indigo-200">
                  You created this job
                </span>
              )}
            </div>
          )}

          {/* Instructions */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-400" />
              Detailed Task Instructions
            </h4>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {job.inst}
            </div>
          </div>

          {/* Submission Proof Section */}
          {!isOwner && (
            <div className="border-t border-slate-200 pt-5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Submit Work Proof
              </h4>

              {hasAppliedAlready ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                  ✓ You have already submitted proof for this task. Check your <strong>Dashboard &gt; My Applications</strong> to track review status and earnings.
                </div>
              ) : job.done >= job.needed ? (
                <div className="p-4 bg-slate-100 rounded-xl text-slate-500 text-xs">
                  All worker slots for this job have been filled.
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-3">
                  <textarea
                    required
                    rows={3}
                    value={proofText}
                    onChange={e => setProofText(e.target.value)}
                    placeholder="Enter your proof (e.g. your YouTube username, screenshot link, transaction ID, or verification code)..."
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting || !proofText.trim()}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Submit Proof for ৳{job.pay.toFixed(2)}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
