import React, { useState } from 'react';
import { User, Job, Application } from '../types';
import { 
  Briefcase, 
  CheckCircle, 
  Clock, 
  Copy, 
  Check, 
  PlusCircle, 
  Users, 
  ExternalLink,
  AlertCircle,
  Trash2,
  XCircle,
  Eye,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Link as LinkIcon,
  Image as ImageIcon,
  X
} from 'lucide-react';

interface DashboardViewProps {
  currentUser: User;
  jobs: Job[];
  applications: Application[];
  allUsers?: User[];
  onOpenPostJob: () => void;
  onNavigate: (view: string) => void;
  onApproveApplication: (applicationId: number) => void;
  onRejectApplication: (applicationId: number, reason: string) => void;
  onCancelJob?: (jobId: number) => void;
  onDeleteJob: (jobId: number) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  onOpenDispute?: (task?: Job | null, sub?: Application | null) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  jobs,
  applications,
  allUsers = [],
  onOpenPostJob,
  onNavigate,
  onApproveApplication,
  onRejectApplication,
  onCancelJob,
  onDeleteJob,
  onShowToast,
  onOpenDispute,
}) => {
  const [activeTab, setActiveTab] = useState<'posted' | 'completed' | 'referrals'>('posted');
  const [reviewingJobId, setReviewingJobId] = useState<number | null>(null);
  const [rejectingAppId, setRejectingAppId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // User's applied / worked jobs
  const myCompletedTasks = applications.filter(
    a => a.user.toLowerCase() === currentUser.username.toLowerCase()
  );

  // User's posted tasks (excluding removed/deleted)
  const myPostedTasks = jobs.filter(
    j => j.poster.toLowerCase() === currentUser.username.toLowerCase() && !j.isDeleted && j.status !== 'Removed' && j.status !== 'Deleted'
  );

  // User's referrals
  const myReferrals = allUsers.filter(
    u => u.referredBy && u.referredBy.toUpperCase() === currentUser.refCode.toUpperCase()
  );

  // Metrics for posted tasks
  const totalEscrowHeld = myPostedTasks.reduce((sum, j) => {
    if (j.status === 'Active' || j.status === 'Approved' || j.status === 'Pending Approval') {
      const remainingSlots = Math.max(0, j.needed - j.done);
      return sum + (j.pay * remainingSlots);
    }
    return sum;
  }, 0);

  const totalRewardsPaid = myPostedTasks.reduce((sum, j) => sum + (j.pay * j.done), 0);

  // All submissions across user's posted tasks
  const allSubmissionsForMyTasks = applications.filter(a => 
    myPostedTasks.some(j => j.id === a.jobId)
  );
  const pendingSubmissionsCount = allSubmissionsForMyTasks.filter(a => a.status === 'Pending').length;

  // Metrics for completed tasks (worker)
  const approvedTasksCount = myCompletedTasks.filter(a => a.status === 'Approved').length;
  const pendingTasksCount = myCompletedTasks.filter(a => a.status === 'Pending').length;
  const rejectedTasksCount = myCompletedTasks.filter(a => a.status === 'Rejected').length;
  const totalEarnedFromTasks = myCompletedTasks
    .filter(a => a.status === 'Approved')
    .reduce((sum, a) => sum + a.pay, 0);

  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}`.replace(/\/$/, '')
    : '';
  const referralLink = `${baseUrl}/?ref=${currentUser.refCode}`;

  const handleCopyRefCode = () => {
    navigator.clipboard.writeText(currentUser.refCode);
    setCopiedCode(true);
    onShowToast(`Referral code ${currentUser.refCode} copied!`, 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyRefLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    onShowToast('Referral link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getSubmissionsForJob = (jobId: number) => {
    return applications.filter(a => a.jobId === jobId);
  };

  const handleConfirmReject = (appId: number) => {
    onRejectApplication(appId, rejectionReason || 'Proof does not meet task requirements.');
    setRejectingAppId(null);
    setRejectionReason('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md border border-indigo-600/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-indigo-300">
              Task Dashboard & Control Center
            </span>
            <span className="text-[10px] bg-indigo-500/50 text-indigo-100 px-2 py-0.5 rounded-full font-mono">
              @{currentUser.username}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Welcome, {currentUser.name}!
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-indigo-100">
            <span>Your Referral:</span>
            <span className="font-mono font-bold bg-indigo-950/70 px-2.5 py-0.5 rounded-md text-amber-300 select-all border border-indigo-700/60">
              {currentUser.refCode}
            </span>
            <button
              onClick={handleCopyRefCode}
              className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded font-medium transition-colors flex items-center gap-1"
              title="Copy Referral Code"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Code'}</span>
            </button>
            <button
              onClick={handleCopyRefLink}
              className="px-2.5 py-0.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded font-bold transition-colors flex items-center gap-1 shadow-xs"
              title="Copy Referral Link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied' : 'Copy Link'}</span>
            </button>
            <span>· ৳5 per invite</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenPostJob}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Post New Paid Task
          </button>
          <button
            onClick={() => onNavigate('wallet')}
            className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Wallet (৳{currentUser.balance.toFixed(2)})
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('posted')}
          className={`py-3 px-4 font-bold text-sm border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'posted'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>My Posted Tasks ({myPostedTasks.length})</span>
          {pendingSubmissionsCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full animate-pulse">
              {pendingSubmissionsCount} to review
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`py-3 px-4 font-bold text-sm border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'completed'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>My Completed Tasks ({myCompletedTasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('referrals')}
          className={`py-3 px-4 font-bold text-sm border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'referrals'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Referral Program ({myReferrals.length})</span>
        </button>
      </div>

      {/* SECTION 1: MY POSTED TASKS (EMPLOYER PERSPECTIVE) */}
      {activeTab === 'posted' && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Posted Tasks
              </span>
              <span className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-1 block">
                {myPostedTasks.length}
              </span>
              <span className="text-[11px] text-slate-400">Created by you</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Pending Submissions
              </span>
              <span className="text-2xl font-black text-amber-600 font-mono tabular-nums mt-1 block">
                {pendingSubmissionsCount}
              </span>
              <span className="text-[11px] text-amber-700">Awaiting your approval</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Escrow Reserved
              </span>
              <span className="text-2xl font-black text-indigo-600 font-mono tabular-nums mt-1 block">
                ৳{totalEscrowHeld.toFixed(2)}
              </span>
              <span className="text-[11px] text-indigo-600">Held for worker payouts</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Rewards Paid
              </span>
              <span className="text-2xl font-black text-emerald-600 font-mono tabular-nums mt-1 block">
                ৳{totalRewardsPaid.toFixed(2)}
              </span>
              <span className="text-[11px] text-emerald-700">Distributed to workers</span>
            </div>
          </div>

          {/* List of Posted Tasks */}
          {myPostedTasks.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl">
                💼
              </div>
              <h3 className="text-lg font-bold text-slate-900">You haven't posted any tasks yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Need YouTube subscribers, social media follows, or reviews? Post a paid task with escrow reward and workers will complete it for you.
              </p>
              <button
                onClick={onOpenPostJob}
                className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Post Your First Task
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myPostedTasks.map(task => {
                const submissions = getSubmissionsForJob(task.id);
                const pendingSubs = submissions.filter(s => s.status === 'Pending');
                const approvedSubs = submissions.filter(s => s.status === 'Approved');
                const rejectedSubs = submissions.filter(s => s.status === 'Rejected');
                const isReviewing = reviewingJobId === task.id;
                const remainingSlots = Math.max(0, task.needed - task.done);
                const unusedEscrow = task.pay * remainingSlots;
                const pct = Math.min(100, Math.round((task.done / task.needed) * 100));

                return (
                  <div
                    key={task.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            {task.category}
                          </span>
                          <span className="text-slate-400 font-mono">Task #{task.id}</span>
                          <span className="text-slate-400">· {task.createdAt}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            task.status === 'Active' || task.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : task.status === 'Completed'
                              ? 'bg-blue-100 text-blue-800'
                              : task.status === 'Cancelled'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900">{task.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2">{task.inst}</p>
                      </div>

                      {/* Escrow & Slots Stats */}
                      <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Reward</span>
                          <span className="font-mono font-black text-emerald-600 text-base">
                            ৳{task.pay.toFixed(2)}
                          </span>
                        </div>
                        <div className="border-l border-slate-200 pl-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Slots</span>
                          <span className="font-mono font-bold text-slate-800 text-sm">
                            {task.done} / {task.needed}
                          </span>
                        </div>
                        <div className="border-l border-slate-200 pl-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Budget</span>
                          <span className="font-mono font-bold text-indigo-700 text-sm">
                            ৳{(task.pay * task.needed).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Submissions Counters */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex justify-between text-xs text-slate-500 font-medium">
                        <span>Progress: {task.done} of {task.needed} completed ({pct}%)</span>
                        <div className="flex items-center gap-3">
                          <span className="text-amber-600 font-bold">{pendingSubs.length} Pending</span>
                          <span className="text-emerald-600 font-bold">{approvedSubs.length} Approved</span>
                          <span className="text-rose-600 font-bold">{rejectedSubs.length} Rejected</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-indigo-600 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-500">
                        {remainingSlots} slots remaining · ৳{unusedEscrow.toFixed(2)} in reserved escrow
                      </span>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Cancel & Refund Unused Escrow */}
                        {(task.status === 'Active' || task.status === 'Approved') && remainingSlots > 0 && onCancelJob && (
                          <button
                            type="button"
                            onClick={() => onCancelJob(task.id)}
                            className="px-3 py-1.5 text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                            title="Cancel and refund remaining escrow"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Cancel & Refund ৳{unusedEscrow.toFixed(2)}</span>
                          </button>
                        )}

                        {/* Review Submissions Toggle */}
                        <button
                          type="button"
                          onClick={() => setReviewingJobId(isReviewing ? null : task.id)}
                          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
                            isReviewing
                              ? 'bg-slate-900 text-white'
                              : pendingSubs.length > 0
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs'
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>
                            {isReviewing
                              ? 'Close Review'
                              : `Review Submissions (${submissions.length})`}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteJob(task.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* SUBMISSIONS REVIEW DRAWER */}
                    {isReviewing && (
                      <div className="mt-4 pt-4 border-t-2 border-indigo-100 space-y-4 bg-slate-50/70 p-4 rounded-xl">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <span>Worker Submissions ({submissions.length})</span>
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            Approve to credit ৳{task.pay.toFixed(2)} to worker, or Reject with explanation.
                          </span>
                        </div>

                        {submissions.length === 0 ? (
                          <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                            No worker submissions received for this task yet.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {submissions.map(sub => {
                              const isApproved = sub.status === 'Approved';
                              const isPending = sub.status === 'Pending';
                              const isRejected = sub.status === 'Rejected';

                              return (
                                <div
                                  key={sub.id}
                                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                                        {sub.user.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                          <span>{sub.workerName || sub.user}</span>
                                          <span className="text-slate-400 font-mono text-[11px]">@{sub.user}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400">
                                          Submitted on: {sub.submittedAt} {sub.submittedTime || ''}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                        ৳{sub.pay.toFixed(2)}
                                      </span>
                                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                        isApproved
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : isPending
                                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                                          : 'bg-rose-100 text-rose-800'
                                      }`}>
                                        {sub.status}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Proof Text */}
                                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                      Worker Proof Submission:
                                    </span>
                                    <p className="text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                                      {sub.proof}
                                    </p>
                                  </div>

                                  {/* Attached Link or Screenshot */}
                                  <div className="flex flex-wrap items-center gap-3 text-xs">
                                    {sub.submittedLink && (
                                      <a
                                        href={sub.submittedLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 px-2.5 py-1 rounded-md"
                                      >
                                        <LinkIcon className="w-3.5 h-3.5" />
                                        <span>View Submitted Link</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}

                                    {sub.screenshot && (
                                      <button
                                        type="button"
                                        onClick={() => setPreviewImage(sub.screenshot || null)}
                                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md"
                                      >
                                        <ImageIcon className="w-3.5 h-3.5" />
                                        <span>View Screenshot Proof</span>
                                      </button>
                                    )}
                                  </div>

                                  {/* Rejection Note if Rejected */}
                                  {isRejected && sub.rejectionReason && (
                                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                                      <div>
                                        <span className="font-bold block">Rejection Reason Provided:</span>
                                        <span>{sub.rejectionReason}</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Rejection Drawer for this submission */}
                                  {rejectingAppId === sub.id && (
                                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs">
                                      <label className="block font-bold text-rose-900">
                                        Rejection Reason (Worker will be notified):
                                      </label>
                                      <div className="flex flex-wrap gap-1">
                                        {[
                                          'Proof is not valid',
                                          'Did not subscribe / follow',
                                          'Incorrect username / link',
                                          'Duplicate / fake screenshot',
                                        ].map(chip => (
                                          <button
                                            key={chip}
                                            type="button"
                                            onClick={() => setRejectionReason(chip)}
                                            className="px-2 py-0.5 bg-white border border-rose-200 text-rose-800 rounded text-[10px] font-medium"
                                          >
                                            {chip}
                                          </button>
                                        ))}
                                      </div>
                                      <input
                                        type="text"
                                        value={rejectionReason}
                                        onChange={e => setRejectionReason(e.target.value)}
                                        placeholder="Explain reason clearly..."
                                        className="w-full px-3 py-1.5 bg-white border border-rose-300 rounded-lg outline-none"
                                      />
                                      <div className="flex justify-end gap-2 pt-1">
                                        <button
                                          type="button"
                                          onClick={() => setRejectingAppId(null)}
                                          className="px-3 py-1 text-slate-600 hover:bg-slate-200 rounded-lg"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleConfirmReject(sub.id)}
                                          className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700"
                                        >
                                          Confirm Reject
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Action Buttons */}
                                  {isPending && rejectingAppId !== sub.id && (
                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setRejectingAppId(sub.id);
                                          setRejectionReason('Proof is not valid');
                                        }}
                                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-colors"
                                      >
                                        Reject Submission
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => onApproveApplication(sub.id)}
                                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Approve & Release ৳{sub.pay.toFixed(2)}</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: MY COMPLETED TASKS (WORKER PERSPECTIVE) */}
      {activeTab === 'completed' && (
        <div className="space-y-6">
          {/* Worker KPI Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Tasks Submitted
              </span>
              <span className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-1 block">
                {myCompletedTasks.length}
              </span>
              <span className="text-[11px] text-slate-400">Total proofs sent</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Approved & Paid
              </span>
              <span className="text-2xl font-black text-emerald-600 font-mono tabular-nums mt-1 block">
                {approvedTasksCount}
              </span>
              <span className="text-[11px] text-emerald-700">Earnings credited</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Under Employer Review
              </span>
              <span className="text-2xl font-black text-amber-600 font-mono tabular-nums mt-1 block">
                {pendingTasksCount}
              </span>
              <span className="text-[11px] text-amber-700">Awaiting verification</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Earned from Tasks
              </span>
              <span className="text-2xl font-black text-indigo-600 font-mono tabular-nums mt-1 block">
                ৳{totalEarnedFromTasks.toFixed(2)}
              </span>
              <span className="text-[11px] text-indigo-600">Added to available balance</span>
            </div>
          </div>

          {/* List of Tasks Done */}
          {myCompletedTasks.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
                💰
              </div>
              <h3 className="text-lg font-bold text-slate-900">No completed tasks yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Visit the Tasks / Earn Money section, choose an available task, follow simple steps, and earn cash rewards.
              </p>
              <button
                onClick={() => onNavigate('jobs')}
                className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Browse Available Tasks & Earn
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myCompletedTasks.map(sub => {
                const isApproved = sub.status === 'Approved';
                const isPending = sub.status === 'Pending';
                const isRejected = sub.status === 'Rejected';

                return (
                  <div
                    key={sub.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs space-y-3 transition-all ${
                      isApproved
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : isPending
                        ? 'border-amber-200 bg-amber-50/20'
                        : 'border-rose-200 bg-rose-50/20'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="font-mono">Task #{sub.jobId}</span>
                          <span>·</span>
                          <span>Submitted: {sub.submittedAt}</span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{sub.title}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-600 text-base">
                          ৳{sub.pay.toFixed(2)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : isPending
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isApproved ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Approved & Paid ✓</span>
                            </>
                          ) : isPending ? (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              <span>Under Employer Review</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Rejected</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Proof description */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Your Submitted Proof:
                      </span>
                      <p className="text-slate-800 leading-relaxed font-sans">{sub.proof}</p>
                    </div>

                    {/* Rejection box if rejected */}
                    {isRejected && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-2">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block text-rose-950">Employer Rejection Reason:</span>
                            <p className="mt-0.5 text-rose-800">
                              {sub.rejectionReason || 'Proof did not meet task verification standards.'}
                            </p>
                          </div>
                        </div>
                        {onOpenDispute && (
                          <div className="pt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const parentJob = jobs.find(j => j.id === sub.jobId);
                                onOpenDispute(parentJob, sub);
                              }}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Dispute Rejection / Report to Admin</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Proof Link or Screenshot preview button */}
                    <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                      {sub.submittedLink && (
                        <a
                          href={sub.submittedLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          <span>Submitted Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      {sub.screenshot && (
                        <button
                          type="button"
                          onClick={() => setPreviewImage(sub.screenshot || null)}
                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>View Submitted Screenshot</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: REFERRAL PROGRAM */}
      {activeTab === 'referrals' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-500/15 via-indigo-50 to-emerald-50 rounded-2xl p-6 border border-amber-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold text-amber-800">Refer & Earn Real Cash</span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  Earn ৳5.00 for Every Single User You Invite!
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-xl">
                  Share your referral link with friends on Facebook, Telegram, WhatsApp, or YouTube. When they register, you receive ৳5 instant wallet bonus.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleCopyRefLink}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Referral Link'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h4 className="text-sm font-bold text-slate-900 mb-3">
              Referred Users ({myReferrals.length})
            </h4>
            {myReferrals.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No users have signed up with your code yet. Share your link to start earning!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Joined Date</th>
                      <th className="p-3">Reward Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myReferrals.map(ref => (
                      <tr key={ref.username} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800">
                          {ref.name} <span className="font-mono text-slate-400 font-normal">(@{ref.username})</span>
                        </td>
                        <td className="p-3 text-slate-500">{ref.joinedAt}</td>
                        <td className="p-3 font-mono font-bold text-emerald-600">+৳5.00</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox / Modal for Screenshot Previews */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white p-1.5 rounded-full z-10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Screenshot Preview"
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
