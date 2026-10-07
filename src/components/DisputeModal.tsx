import React, { useState } from 'react';
import { User, Job, Application } from '../types';
import { X, AlertTriangle, Send, ShieldAlert, FileText, Upload } from 'lucide-react';

interface DisputeModalProps {
  currentUser: User;
  task?: Job | null;
  submission?: Application | null;
  onClose: () => void;
  onSubmitDispute: (
    taskId: number,
    taskTitle: string,
    submissionId: number | undefined,
    reportedUser: string,
    reason: string,
    details: string,
    proofAttachment?: string
  ) => void;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  currentUser,
  task,
  submission,
  onClose,
  onSubmitDispute,
}) => {
  const isWorker = submission?.user.toLowerCase() === currentUser.username.toLowerCase();
  const defaultReported = isWorker ? (task?.poster || 'employer') : (submission?.user || 'worker');

  const [reportedUser, setReportedUser] = useState(defaultReported);
  const [reason, setReason] = useState(
    isWorker ? 'Owner unfairly rejected valid proof' : 'Worker submitted fake / invalid proof'
  );
  const [details, setDetails] = useState('');
  const [proofAttachment, setProofAttachment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    setIsSubmitting(true);
    onSubmitDispute(
      task?.id || 0,
      task?.title || `Task #${task?.id || 'General'}`,
      submission?.id,
      reportedUser.trim(),
      reason,
      details.trim(),
      proofAttachment.trim() || undefined
    );
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden relative animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-800">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Task Dispute & Investigation Request</h2>
              <p className="text-[11px] text-rose-700">Official review by Platform Mediation Administration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Anti-Fraud & Fair Play Protection</span>
            </div>
            <p className="text-[11px] text-amber-800">
              Disputes are thoroughly inspected. If an employer rejected a genuine submission, funds will be refunded or credited. Submitting fraudulent reports may lead to account suspension.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Task Context</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 truncate">
                #{task?.id || '—'} {task?.title || 'General Task'}
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Reporting User</label>
              <input
                type="text"
                required
                value={reportedUser}
                onChange={e => setReportedUser(e.target.value)}
                placeholder="Username (e.g. employer or worker)"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Dispute Category</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-rose-500"
            >
              <option value="Owner unfairly rejected valid proof">Employer unfairly rejected valid proof</option>
              <option value="Worker submitted fake / invalid proof">Worker submitted fake / cheated proof</option>
              <option value="Payment / Reward not credited">Reward payment not credited to wallet</option>
              <option value="Misleading task instructions">Misleading or impossible task instructions</option>
              <option value="Off-platform scam attempt">Off-platform scam or phishing attempt</option>
              <option value="Other grievance">Other grievance</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Detailed Statement & Timeline <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="State what happened clearly: explain your submission, the instructions followed, or why the counterparty is in violation..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Evidence / Screenshot URL (Optional)
            </label>
            <input
              type="text"
              value={proofAttachment}
              onChange={e => setProofAttachment(e.target.value)}
              placeholder="https://... or image link demonstrating your case"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !details.trim()}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Dispute for Mediation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
