import React, { useState } from 'react';
import { User, Job } from '../types';
import { 
  X, 
  MessageSquare, 
  CheckCircle, 
  Send, 
  Calendar,
  Layers,
  Trash2,
  Upload,
  Link as LinkIcon,
  Clock,
  AlertTriangle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface JobDetailsModalProps {
  job: Job;
  currentUser: User | null;
  onClose: () => void;
  onOpenMessagePoster: (posterUsername: string, jobId: number, jobTitle: string) => void;
  onSubmitProof: (jobId: number, proof: string, screenshot?: string, submittedLink?: string) => void;
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
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [submittedLink, setSubmittedLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isOwner = currentUser?.username.toLowerCase() === job.poster.toLowerCase();
  const isAdmin = currentUser?.isAdmin;
  const isAdminPost = job.poster.toLowerCase() === 'admin' || job.posterName === 'Work 6T7 Official';

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setScreenshotUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    if (isOwner) {
      return;
    }
    if (!proofText.trim()) return;

    setSubmitting(true);
    onSubmitProof(job.id, proofText.trim(), screenshotUrl.trim() || undefined, submittedLink.trim() || undefined);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden relative my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                {job.category}
              </span>
              <span>·</span>
              <span className="font-mono">Task #{job.id}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {job.createdAt}
              </span>
              {job.deadline && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                    <Clock className="w-3 h-3" />
                    {job.deadline}
                  </span>
                </>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">{job.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {(isAdmin || isOwner) && onDeleteJob && (
              <button
                type="button"
                onClick={() => {
                  onDeleteJob(job.id);
                  onClose();
                }}
                className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                title="Delete Post"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isAdmin ? 'Admin Delete' : 'Delete Task'}</span>
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
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Key Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Worker Reward
              </span>
              <span className="text-2xl font-black text-emerald-600 font-mono tabular-nums">
                ৳{job.pay.toFixed(2)}
              </span>
              <span className="text-[10px] text-emerald-700 block mt-0.5">Escrow Guaranteed ✓</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Available Slots
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

          {/* Job Poster Banner / Action */}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-base">
                  {job.poster.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {job.posterName || job.poster}
                    </span>
                    <span className="text-xs font-mono text-indigo-600">
                      @{job.poster}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    Employer & Task Publisher
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
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message Employer
                </button>
              )}
            </div>
          )}

          {/* Description & Image Attachment */}
          {job.description && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Task Overview
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                {job.description}
              </p>
            </div>
          )}

          {job.imageUrl && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Reference Image / Attachment
              </h4>
              <div className="rounded-xl overflow-hidden border border-slate-200 max-h-64 bg-slate-100">
                <img src={job.imageUrl} alt="Task Attachment" className="w-full h-full object-contain" />
              </div>
            </div>
          )}

          {/* Task Instructions */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Step-by-Step Instructions
            </h4>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line font-sans">
              {job.inst}
            </div>
          </div>

          {/* Required Proof Section */}
          <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Required Proof Information
            </h4>
            <p className="text-xs text-indigo-900 leading-relaxed font-medium">
              {job.requiredProof || 'Submit your username and screenshot proving task completion.'}
            </p>
          </div>

          {/* Submission Proof Section */}
          {isOwner ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
              👑 <strong>You are the creator of this task.</strong> Worker submissions can be inspected and approved in your <strong>Dashboard &gt; My Tasks</strong> section.
            </div>
          ) : (
            <div className="border-t border-slate-200 pt-5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Submit Task Proof & Claim ৳{job.pay.toFixed(2)}
              </h4>

              {hasAppliedAlready ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Proof already submitted!</span>
                  </div>
                  <p>
                    You have an active submission for this task. You can track review status and earnings in <strong>Dashboard &gt; My Completed Tasks</strong>.
                  </p>
                </div>
              ) : job.done >= job.needed ? (
                <div className="p-4 bg-slate-100 rounded-xl text-slate-500 text-xs">
                  All worker slots for this task have been filled.
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Proof Description / Username / Text *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={proofText}
                      onChange={e => setProofText(e.target.value)}
                      placeholder="e.g. My YouTube account is @shakib_bd. Subscribed, liked, and watched 2 minutes..."
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* Screenshot Link / Gallery File */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Proof Screenshot / Image (Optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={screenshotUrl.startsWith('data:') ? 'Screenshot attached from device' : screenshotUrl}
                        onChange={e => setScreenshotUrl(e.target.value)}
                        placeholder="Image URL (e.g. imgur, drive, or select from gallery)..."
                        className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
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
                    {screenshotUrl && (
                      <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border border-slate-300 bg-slate-100">
                        <img src={screenshotUrl} alt="Screenshot preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setScreenshotUrl('')}
                          className="absolute top-1 right-1 bg-slate-900/80 text-white p-0.5 rounded-full hover:bg-rose-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Submitted Link */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Submitted Link / Profile URL (Optional)
                    </label>
                    <div className="relative">
                      <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="url"
                        value={submittedLink}
                        onChange={e => setSubmittedLink(e.target.value)}
                        placeholder="https://facebook.com/your-profile"
                        className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-500">
                      Payment of ৳{job.pay.toFixed(2)} is held in escrow and released upon employer approval.
                    </span>

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
