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
  Trash2
} from 'lucide-react';

interface DashboardViewProps {
  currentUser: User;
  jobs: Job[];
  applications: Application[];
  allUsers?: User[];
  onOpenPostJob: () => void;
  onNavigate: (view: string) => void;
  onApproveApplication: (applicationId: number) => void;
  onRejectApplication: (applicationId: number) => void;
  onDeleteJob: (jobId: number) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
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
  onDeleteJob,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'applied' | 'posted' | 'referrals'>('applied');
  const [reviewingJobId, setReviewingJobId] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // User's applied jobs
  const myApplications = applications.filter(
    a => a.user.toLowerCase() === currentUser.username.toLowerCase()
  );

  // User's posted jobs
  const myPostedJobs = jobs.filter(
    j => j.poster.toLowerCase() === currentUser.username.toLowerCase()
  );

  // User's referrals
  const myReferrals = allUsers.filter(
    u => u.referredBy && u.referredBy.toUpperCase() === currentUser.refCode.toUpperCase()
  );

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Welcome & Referral Banner */}
      <div className="bg-indigo-700 text-white rounded-2xl p-6 sm:p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-indigo-200">
            Account Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Hello, {currentUser.name}!
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-indigo-100">
            <span>Referral Code:</span>
            <span className="font-mono font-bold bg-indigo-900/60 px-2 py-0.5 rounded text-amber-300 select-all">
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
            <span>· প্রতি রেফারে ৳5 বোনাস</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenPostJob}
            className="px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Post New Task (৳10 Fee)
          </button>
          <button
            onClick={() => onNavigate('wallet')}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Manage Wallet
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Wallet Balance
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono tabular-nums mt-1 block">
            ৳{currentUser.balance.toFixed(2)}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Tasks Completed
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-800 font-mono tabular-nums mt-1 block">
            {myApplications.filter(a => a.status === 'Approved').length}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Earned
          </span>
          <span className="text-2xl sm:text-3xl font-black text-indigo-600 font-mono tabular-nums mt-1 block">
            ৳{currentUser.earnings.toFixed(2)}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Jobs Posted
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-800 font-mono tabular-nums mt-1 block">
            {myPostedJobs.length}
          </span>
        </div>
      </div>

      {/* Tabbed Content Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 px-6 pt-4 gap-6 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('applied')}
            className={`pb-4 text-sm font-bold transition-colors border-b-2 ${
              activeTab === 'applied'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            My Applications ({myApplications.length})
          </button>
          <button
            onClick={() => setActiveTab('posted')}
            className={`pb-4 text-sm font-bold transition-colors border-b-2 ${
              activeTab === 'posted'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            My Posted Jobs ({myPostedJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('referrals')}
            className={`pb-4 text-sm font-bold transition-colors border-b-2 ${
              activeTab === 'referrals'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Referrals & Earn ৳5 ({myReferrals.length})
          </button>
        </div>

        {/* Tab 1: My Applications */}
        {activeTab === 'applied' && (
          <div className="p-6">
            {myApplications.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">No Task Applications Yet</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Visit the marketplace to complete quick microjobs and earn BDT.
                </p>
                <button
                  onClick={() => onNavigate('jobs')}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
                >
                  Browse Available Tasks
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myApplications.map(app => (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-slate-900">{app.title}</span>
                        <span className="text-xs text-slate-400">· Job #{app.jobId}</span>
                      </div>
                      <p className="text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-100 max-w-xl">
                        <b>Proof Submitted:</b> {app.proof}
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                        Submitted: {app.submittedAt}
                      </span>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0">
                      <span className="text-base font-black text-emerald-600 font-mono tabular-nums">
                        ৳{app.pay.toFixed(2)}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          app.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: My Posted Jobs */}
        {activeTab === 'posted' && (
          <div className="p-6">
            {myPostedJobs.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">You Haven't Posted Any Tasks</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Need subscribers, app reviews, or survey respondents? Post your microjob.
                </p>
                <button
                  onClick={onOpenPostJob}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
                >
                  Create First Task (৳10 Fee)
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myPostedJobs.map(job => {
                  const submissions = getSubmissionsForJob(job.id);
                  const isReviewing = reviewingJobId === job.id;

                  return (
                    <div
                      key={job.id}
                      className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-indigo-600">{job.category}</span>
                            <span>·</span>
                            <span className="text-xs text-slate-400 font-mono">Job #{job.id}</span>
                            <span>·</span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                job.status === 'Approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : job.status === 'Pending Approval'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {job.status === 'Pending Approval' ? 'Pending Admin Review' : job.status}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-slate-900">{job.title}</h4>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-800">
                            Completed: {job.done} / {job.needed}
                          </span>
                          <span className="text-xs text-slate-400 block font-mono">
                            Worker Pay: ৳{job.pay.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Pending approval notice */}
                      {job.status === 'Pending Approval' && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-center gap-2">
                          <Clock className="w-4 h-4 shrink-0 text-amber-600" />
                          <span>
                            This task is currently in the <strong>Admin Job Approval</strong> queue. Once approved, it will be published to the public marketplace.
                          </span>
                        </div>
                      )}

                      {/* Rejection notice */}
                      {job.status === 'Rejected' && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                          <span>
                            Rejected by Admin: {job.rejectionReason || 'Violated platform submission rules.'}
                          </span>
                        </div>
                      )}

                      {/* Submissions review toggle button & Delete action */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 gap-2">
                        <span className="text-xs text-slate-500">
                          {submissions.length} worker proofs submitted
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete "${job.title}"? This cannot be undone.`)) {
                                onDeleteJob(job.id);
                              }
                            }}
                            className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                            title="Delete this task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setReviewingJobId(isReviewing ? null : job.id)}
                            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                          >
                            {isReviewing ? 'Hide Submissions' : 'Review Worker Proofs'}
                          </button>
                        </div>
                      </div>

                      {/* Submissions List */}
                      {isReviewing && (
                        <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                          <h5 className="text-xs font-bold text-slate-700 uppercase">Worker Submissions:</h5>
                          {submissions.length === 0 ? (
                            <p className="text-xs text-slate-400 py-2">No proofs submitted for this task yet.</p>
                          ) : (
                            submissions.map(sub => (
                              <div
                                key={sub.id}
                                className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                              >
                                <div>
                                  <div className="flex items-center gap-2 font-bold text-slate-800">
                                    <span>Worker: @{sub.user}</span>
                                    <span className="text-slate-400">· {sub.submittedAt}</span>
                                  </div>
                                  <p className="text-slate-600 mt-1 bg-slate-50 p-2 rounded">
                                    {sub.proof}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {sub.status === 'Pending' ? (
                                    <>
                                      <button
                                        onClick={() => onRejectApplication(sub.id)}
                                        className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-lg border border-rose-200"
                                      >
                                        Reject
                                      </button>
                                      <button
                                        onClick={() => onApproveApplication(sub.id)}
                                        className="px-3 py-1 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-lg shadow-xs"
                                      >
                                        Approve & Pay ৳{sub.pay.toFixed(2)}
                                      </button>
                                    </>
                                  ) : (
                                    <span
                                      className={`px-2 py-0.5 rounded font-bold ${
                                        sub.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {sub.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))
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

        {/* Tab 3: Referral Program & Earnings */}
        {activeTab === 'referrals' && (
          <div className="p-6 space-y-6">
            {/* Promo Banner */}
            <div className="bg-gradient-to-r from-amber-500/15 via-indigo-50 to-emerald-50 rounded-2xl p-6 border border-amber-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs mb-2">
                    <span>🎁</span>
                    <span>৳5.00 প্রতি সফল রেফারেল বোনাস</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Invite Friends & Earn Real BDT!
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                    আপনার ইউনিক Referral Link বা Code দিয়ে নতুন ইউজারদের ইনভাইট করুন। তারা সফলভাবে অ্যাকাউন্ট তৈরি করলেই আপনি পাবেন ৳5.00 যা সাথে সাথে আপনার ওয়ালেটে যোগ হবে।
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <button
                    onClick={handleCopyRefCode}
                    className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? 'Code Copied!' : `Copy Code (${currentUser.refCode})`}</span>
                  </button>
                  <button
                    onClick={handleCopyRefLink}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Referral Link'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Referral Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Referred Users
                </span>
                <span className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-1 block">
                  {myReferrals.length} জন
                </span>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Referral Earnings Added
                </span>
                <span className="text-2xl font-black text-emerald-700 font-mono tabular-nums mt-1 block">
                  ৳{(myReferrals.length * 5).toFixed(2)}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                  Reward Per User
                </span>
                <span className="text-2xl font-black text-amber-700 font-mono tabular-nums mt-1 block">
                  ৳5.00
                </span>
              </div>
            </div>

            {/* List of Invited Users */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Invited Friends ({myReferrals.length})
              </h4>

              {myReferrals.length === 0 ? (
                <div className="p-8 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                  আপনি এখনও কোনো ফ্রেন্ডকে ইনভাইট করেননি। আপনার Referral Link শেয়ার করুন এবং প্রতি রেফারে ৳5 ইনকাম করুন!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="p-3">User</th>
                        <th className="p-3">Joined Date</th>
                        <th className="p-3">Reward Status</th>
                        <th className="p-3 text-right">Bonus Credited</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myReferrals.map(refUser => (
                        <tr key={refUser.username} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                              {refUser.username.slice(0, 1).toUpperCase()}
                            </span>
                            <span>@{refUser.username}</span>
                          </td>
                          <td className="p-3 text-slate-500 font-mono">{refUser.joinedAt}</td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <Check className="w-3 h-3" />
                              <span>Verified Eligible</span>
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600">
                            +৳5.00
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
