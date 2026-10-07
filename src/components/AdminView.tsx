import React, { useState, useMemo } from 'react';
import { 
  Job, 
  User, 
  WithdrawalRequest, 
  SupportTicket, 
  Application, 
  DepositRequest, 
  Dispute, 
  ActivityLog, 
  Transaction 
} from '../types';
import { 
  ShieldCheck, 
  Check, 
  X, 
  DollarSign, 
  Users, 
  Clock, 
  Layers, 
  MessageSquare, 
  Smartphone, 
  Save, 
  Trash2, 
  Eye, 
  Briefcase, 
  Gift, 
  UserCheck, 
  Activity,
  ArrowDownLeft,
  Search,
  Download,
  Upload,
  ShieldAlert,
  Wrench,
  Server,
  BarChart3,
  Filter,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface AdminViewProps {
  jobs: Job[];
  users: User[];
  applications: Application[];
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
  tickets: SupportTicket[];
  disputes?: Dispute[];
  activityLogs?: ActivityLog[];
  transactions?: Transaction[];
  depositNumber: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  onApproveJob: (jobId: number) => void;
  onRejectJob: (jobId: number, reason: string) => void;
  onDeleteJob: (jobId: number) => void;
  onToggleJobPause?: (jobId: number) => void;
  onToggleJobDisable?: (jobId: number) => void;
  onApproveDeposit: (depositId: number) => void;
  onRejectDeposit: (depositId: number, reason: string) => void;
  onApproveWithdrawal: (id: number) => void;
  onRejectWithdrawal: (id: number, reason: string) => void;
  onToggleUserBan: (username: string) => void;
  onReplyTicket: (id: number, reply: string) => void;
  onUpdateDepositNumber: (newNumber: string) => void;
  onResolveDispute?: (id: string, resolution: any, note: string) => void;
  onToggleMaintenance?: (enabled: boolean, message?: string) => void;
  onExportBackup?: () => void;
  onImportBackup?: (data: any) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  jobs,
  users,
  applications,
  deposits,
  withdrawals,
  tickets,
  disputes = [],
  activityLogs = [],
  transactions = [],
  depositNumber,
  maintenanceMode = false,
  maintenanceMessage = 'Website is undergoing scheduled maintenance.',
  onApproveJob,
  onRejectJob,
  onDeleteJob,
  onToggleJobPause,
  onToggleJobDisable,
  onApproveDeposit,
  onRejectDeposit,
  onApproveWithdrawal,
  onRejectWithdrawal,
  onToggleUserBan,
  onReplyTicket,
  onUpdateDepositNumber,
  onResolveDispute,
  onToggleMaintenance,
  onExportBackup,
  onImportBackup,
}) => {
  const [activeTab, setActiveTab] = useState<
    'jobs' | 'deposits' | 'withdrawals' | 'users' | 'financial' | 'disputes' | 'activity' | 'tickets' | 'settings' | 'system'
  >('jobs');
  const [rejectingJobId, setRejectingJobId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingDepositId, setRejectingDepositId] = useState<number | null>(null);
  const [depositRejectReason, setDepositRejectReason] = useState('');
  const [rejectingWithdrawalId, setRejectingWithdrawalId] = useState<number | null>(null);
  const [withdrawalRejectReason, setWithdrawalRejectReason] = useState('');
  const [ticketReplyId, setTicketReplyId] = useState<number | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [newDepositNumber, setNewDepositNumber] = useState(depositNumber);
  const [selectedUserForActivity, setSelectedUserForActivity] = useState<User | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  // Search & Filter States
  const [jobSearch, setJobSearch] = useState('');
  const [depositSearch, setDepositSearch] = useState('');
  const [withdrawSearch, setWithdrawSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('ALL');
  const [disputeSearch, setDisputeSearch] = useState('');
  const [activitySearch, setActivitySearch] = useState('');
  const [activityCategoryFilter, setActivityCategoryFilter] = useState('ALL');

  // Maintenance form state
  const [maintEnabled, setMaintEnabled] = useState(maintenanceMode);
  const [maintText, setMaintText] = useState(maintenanceMessage);
  const [resolvingDisputeId, setResolvingDisputeId] = useState<string | null>(null);
  const [disputeResolveNote, setDisputeResolveNote] = useState('');

  const pendingJobs = useMemo(() => {
    return jobs.filter(
      j => (j.status === 'Pending Approval' || j.status === 'Pending' || j.status === 'Draft') &&
           !j.isDeleted && j.status !== 'Removed' && j.status !== 'Deleted'
    );
  }, [jobs]);

  const approvedJobs = useMemo(() => {
    return jobs.filter(j => (j.status === 'Approved' || j.status === 'Active') && !j.isDeleted);
  }, [jobs]);

  const liveMarketplaceJobs = useMemo(() => {
    return jobs.filter(j => {
      if (j.isDeleted || j.status === 'Removed' || j.status === 'Deleted') return false;
      if (!jobSearch.trim()) return true;
      const q = jobSearch.toLowerCase();
      return (
        j.title.toLowerCase().includes(q) ||
        j.poster.toLowerCase().includes(q) ||
        j.category.toLowerCase().includes(q) ||
        String(j.id).includes(q)
      );
    });
  }, [jobs, jobSearch]);

  const pendingDeposits = deposits.filter(d => d.status === 'Pending');
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'Pending');

  // Platform Analytics
  const activeWorkersCount = new Set(applications.map(a => a.user.toLowerCase())).size;
  const totalCompletedTasks = applications.filter(a => a.status === 'Approved').length;
  const totalReferrals = users.filter(u => u.referredBy).length;

  const handleConfirmReject = (jobId: number) => {
    onRejectJob(jobId, rejectReason || 'Content violates task verification standards.');
    setRejectingJobId(null);
    setRejectReason('');
  };

  const handleConfirmRejectDeposit = (depositId: number) => {
    onRejectDeposit(depositId, depositRejectReason || 'ভুল বা অমিল TrxID (Payment not received)');
    setRejectingDepositId(null);
    setDepositRejectReason('');
  };

  const handleConfirmRejectWithdrawal = (withdrawalId: number) => {
    onRejectWithdrawal(withdrawalId, withdrawalRejectReason || 'ভুল বা বন্ধ মোবাইল একাউন্ট নম্বর');
    setRejectingWithdrawalId(null);
    setWithdrawalRejectReason('');
  };

  const handleConfirmReply = (ticketId: number) => {
    if (!ticketReplyText.trim()) return;
    onReplyTicket(ticketId, ticketReplyText.trim());
    setTicketReplyId(null);
    setTicketReplyText('');
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedValue(text);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  const getJobsPostedByUser = (username: string) => {
    return jobs.filter(j => j.poster.toLowerCase() === username.toLowerCase());
  };

  const getSubmissionsForUser = (username: string) => {
    return applications.filter(a => a.user.toLowerCase() === username.toLowerCase());
  };

  const getReferredUsersForUser = (refCode: string) => {
    return users.filter(u => u.referredBy && u.referredBy.toUpperCase() === refCode.toUpperCase());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Admin Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Master Administration Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Platform Control Center</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review pending job submissions, manage all posts, authorize withdrawals, and view worker activity.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'jobs' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Job Requests ({pendingJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('deposits')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'deposits' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Deposits ({pendingDeposits.length})
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'withdrawals' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Withdrawals ({pendingWithdrawals.length})
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'financial' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Financial Dashboard
          </button>
          <button
            onClick={() => setActiveTab('disputes')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'disputes' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Disputes ({disputes.filter(d => d.status === 'Open').length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Users & Ban ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'activity' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Activity Logs
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'tickets' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Tickets ({tickets.length})
          </button>
          <button
            onClick={() => {
              setNewDepositNumber(depositNumber);
              setActiveTab('settings');
            }}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'settings' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Deposit Num
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'system' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            System & Backup
          </button>
        </div>
      </div>

      {/* Quick Overview Pending Requests Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <button
          type="button"
          onClick={() => setActiveTab('jobs')}
          className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
            activeTab === 'jobs'
              ? 'bg-amber-500/15 border-amber-400 shadow-md ring-2 ring-amber-300'
              : 'bg-white border-amber-200/80 hover:border-amber-400 hover:shadow-xs'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
              💼 Pending Job Requests
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-950 font-mono mt-0.5 block">
              {pendingJobs.length}
            </span>
            <span className="text-[11px] text-amber-700">Waiting for review & approval</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-bold flex items-center justify-center text-lg shadow-xs">
            💼
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deposits')}
          className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
            activeTab === 'deposits'
              ? 'bg-emerald-500/15 border-emerald-500 shadow-md ring-2 ring-emerald-300'
              : 'bg-white border-emerald-200/80 hover:border-emerald-400 hover:shadow-xs'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
              💰 Pending Deposit Requests
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono mt-0.5 block">
              {pendingDeposits.length}
            </span>
            <span className="text-[11px] text-emerald-700">TrxID verification required</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white font-bold flex items-center justify-center text-lg shadow-xs">
            💰
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('withdrawals')}
          className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
            activeTab === 'withdrawals'
              ? 'bg-indigo-500/15 border-indigo-500 shadow-md ring-2 ring-indigo-300'
              : 'bg-white border-indigo-200/80 hover:border-indigo-400 hover:shadow-xs'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
              💸 Pending Withdrawal Requests
            </span>
            <span className="text-2xl sm:text-3xl font-black text-indigo-950 font-mono mt-0.5 block">
              {pendingWithdrawals.length}
            </span>
            <span className="text-[11px] text-indigo-700">Payout to bKash / Nagad needed</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center text-lg shadow-xs">
            💸
          </div>
        </button>
      </div>

      {/* 1. JOB APPROVAL REQUESTS & ALL POSTS MANAGEMENT */}
      {activeTab === 'jobs' && (
        <div className="space-y-8">
          {/* Section A: Pending Job Requests */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Job Approval Requests</h2>
                <p className="text-xs text-slate-500">
                  Tasks submitted by employers. Approve to publish to Marketplace, Reject, or Delete.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-800 rounded-full">
                {pendingJobs.length} Pending Approval
              </span>
            </div>

            {pendingJobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 mb-6">
                <Check className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No Pending Requests</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  All employer tasks have been reviewed.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 mb-6">
                {pendingJobs.map(job => {
                  const posterUser = users.find(u => u.username.toLowerCase() === job.poster.toLowerCase());

                  return (
                    <div
                      key={job.id}
                      className="bg-white rounded-2xl border border-amber-200 p-6 shadow-xs relative overflow-hidden"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                            <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                              {job.category}
                            </span>
                            <span>·</span>
                            <span className="font-mono font-bold text-slate-700">Job #{job.id}</span>
                            <span>·</span>
                            <span>
                              Employer: <b>@{job.poster}</b> ({posterUser?.name || 'User'})
                            </span>
                            <span>·</span>
                            <span>Submitted: {job.createdAt}</span>
                            {job.deadline && (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded font-semibold text-[11px]">
                                ⏰ Deadline: {job.deadline}
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                        </div>

                        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Worker Pay</span>
                            <span className="text-base font-black text-emerald-600 font-mono tabular-nums">৳{job.pay.toFixed(2)}</span>
                          </div>
                          <div className="border-l border-slate-200 pl-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Workers Needed</span>
                            <span className="text-base font-bold text-slate-800 font-mono tabular-nums">{job.needed}</span>
                          </div>
                          <div className="border-l border-slate-200 pl-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Post Fee Paid</span>
                            <span className="text-sm font-bold text-indigo-700 font-mono tabular-nums">৳10.00 ✓</span>
                          </div>
                          <div className="border-l border-slate-200 pl-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Owner Balance</span>
                            <span className="text-sm font-bold text-emerald-600 font-mono tabular-nums">৳{(posterUser?.balance || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Task Description Overview if present */}
                      {job.description && job.description !== job.title && (
                        <div className="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                          <span className="font-bold text-slate-900 block mb-0.5">Task Description / Overview:</span>
                          <p>{job.description}</p>
                        </div>
                      )}

                      {/* Task Instructions */}
                      <div className="mb-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                        <span className="font-bold text-slate-900 block mb-1">Step-by-Step Task Instructions:</span>
                        {job.inst}
                      </div>

                      {/* Required Proof */}
                      {job.requiredProof && (
                        <div className="mb-3 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-950">
                          <span className="font-bold block mb-0.5">Required Proof from Worker:</span>
                          <p>{job.requiredProof}</p>
                        </div>
                      )}

                      {/* Image Attachment Preview if provided */}
                      {job.imageUrl && (
                        <div className="mb-3">
                          <span className="text-xs font-bold text-slate-700 block mb-1">Attached Reference Image:</span>
                          <div className="w-32 h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                            <img src={job.imageUrl} alt="Job reference" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      )}

                      {rejectingJobId === job.id && (
                        <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                          <label className="block text-xs font-bold text-rose-800">
                            Reason for Rejection (sent to user):
                          </label>
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="e.g. Inappropriate task description or invalid verification proof."
                            className="w-full px-3 py-2 text-xs bg-white border border-rose-300 rounded-lg outline-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setRejectingJobId(null)}
                              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleConfirmReject(job.id)}
                              className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
                            >
                              Confirm Reject
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => onDeleteJob(job.id)}
                          className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Permanently Delete Post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Post
                        </button>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setRejectingJobId(job.id)}
                            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject Job
                          </button>
                          <button
                            onClick={() => onApproveJob(job.id)}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve & Publish Live
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section B: All Published Marketplace Posts Management */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">All Live Marketplace Posts ({liveMarketplaceJobs.length})</h3>
                <p className="text-xs text-slate-500">Admin can pause, disable, or delete any job post from the marketplace at any time.</p>
              </div>
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={jobSearch}
                  onChange={e => setJobSearch(e.target.value)}
                  placeholder="Search posts..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Job Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Poster</th>
                    <th className="p-3">Worker Pay</th>
                    <th className="p-3">Completed</th>
                    <th className="p-3">Deadline</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {liveMarketplaceJobs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No active marketplace posts found.
                      </td>
                    </tr>
                  ) : (
                    liveMarketplaceJobs.map(j => (
                    <tr key={j.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-400">#{j.id}</td>
                      <td className="p-3 font-bold text-slate-800 max-w-xs truncate">{j.title}</td>
                      <td className="p-3 text-slate-600">{j.category}</td>
                      <td className="p-3 text-indigo-600 font-medium">@{j.poster}</td>
                      <td className="p-3 font-mono font-bold text-emerald-600 tabular-nums">৳{j.pay.toFixed(2)}</td>
                      <td className="p-3 font-mono tabular-nums">{j.done} / {j.needed}</td>
                      <td className="p-3 font-mono text-slate-500">{j.deadline || '—'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          j.status === 'Active' || j.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : j.status === 'Pending Approval'
                            ? 'bg-amber-100 text-amber-800'
                            : j.status === 'Paused'
                            ? 'bg-yellow-100 text-yellow-800'
                            : j.status === 'Disabled'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {j.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onToggleJobPause && (
                            <button
                              onClick={() => onToggleJobPause(j.id)}
                              className={`px-2 py-1 text-xs font-bold rounded-lg border transition-colors ${
                                j.status === 'Paused'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                              title={j.status === 'Paused' ? 'Resume Task' : 'Pause Task'}
                            >
                              {j.status === 'Paused' ? '▶ Resume' : '⏸ Pause'}
                            </button>
                          )}
                          {onToggleJobDisable && (
                            <button
                              onClick={() => onToggleJobDisable(j.id)}
                              className={`px-2 py-1 text-xs font-bold rounded-lg border transition-colors ${
                                j.status === 'Disabled'
                                  ? 'bg-purple-100 text-purple-900 border-purple-300 hover:bg-purple-200'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                              title={j.status === 'Disabled' ? 'Enable Task' : 'Disable Task'}
                            >
                              {j.status === 'Disabled' ? 'Enable' : 'Disable'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteJob(j.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-100 bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs"
                            title="Delete Task Permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))) }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. DEPOSIT REQUESTS (আলাদা রিকোয়েস্ট কার্ড - Job Request এর মতো) */}
      {activeTab === 'deposits' && (
        <div className="space-y-8">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                  <span>Deposit Requests (টাকা জমা ও TrxID ভেরিফিকেশন)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ব্যবহারকারীর পাঠানো টাকা ও TrxID যাচাই করুন। অ্যাপ্রুভ করলে ইউজারের ওয়ালেটে ব্যালেন্স জমা হবে, রিজেক্ট করলে কারণসহ এসএমএস যাবে।
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full w-fit">
                {pendingDeposits.length} টি নতুন ডিপোজিট রিকোয়েস্ট
              </span>
            </div>

            {pendingDeposits.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 mb-6">
                <Check className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p className="text-sm font-semibold text-slate-700">কোনো পেন্ডিং ডিপোজিট রিকোয়েস্ট নেই</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  সকল ডিপোজিট রিকোয়েস্ট সফলভাবে যাচাই ও প্রসেস করা হয়েছে।
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 mb-6">
                {pendingDeposits.map(d => {
                  const targetUser = users.find(u => u.username.toLowerCase() === d.user.toLowerCase());
                  return (
                    <div
                      key={d.id}
                      className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-xs relative overflow-hidden"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={targetUser?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.user}`}
                            alt={d.user}
                            className="w-12 h-12 rounded-xl bg-slate-100 object-cover border border-slate-200"
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-slate-900 text-base">
                                {targetUser?.name || d.userName || d.user}
                              </span>
                              <span className="text-xs font-mono text-slate-500">@{d.user}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                                {d.method} Deposit
                              </span>
                              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                Req #{d.id}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                              <span>User ID: <b className="font-mono text-slate-700">{targetUser?.id || d.user}</b></span>
                              <span>·</span>
                              <span>তারিখ ও সময়: <b>{d.date} {d.time || ''}</b></span>
                              <span>·</span>
                              <span>বর্তমান ব্যালেন্স: <b className="text-emerald-700 font-mono">৳{targetUser?.balance.toFixed(2) ?? '0.00'}</b></span>
                            </div>
                            {/* Sender Phone & Screenshot Proof */}
                            <div className="mt-2 text-xs flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <div>
                                <span className="text-slate-400 font-medium">প্রেরক নম্বর (Sender No): </span>
                                <span className="font-mono font-bold text-slate-900">{d.senderNumber || 'Not provided'}</span>
                              </div>
                              {d.screenshot && (
                                <div className="border-l border-slate-200 pl-3">
                                  <span className="text-slate-400 font-medium">স্ক্রিনশট / রেফারেন্স: </span>
                                  <span className="font-mono text-indigo-600 font-semibold">{d.screenshot}</span>
                                </div>
                              )}
                              <div className="border-l border-slate-200 pl-3">
                                <span className="text-slate-400 font-medium">স্ট্যাটাস: </span>
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">
                                  {d.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Amount & TrxID Highlight Box */}
                        <div className="flex items-center gap-4 bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 shrink-0 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                              ডিপোজিট পরিমাণ
                            </span>
                            <span className="text-xl font-black text-emerald-700 font-mono tabular-nums">
                              ৳{d.amount.toFixed(2)}
                            </span>
                          </div>
                          <div className="border-l border-emerald-200 pl-4">
                            <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                              Transaction ID (TrxID)
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-emerald-300 text-sm select-all">
                                {d.trxId}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(d.trxId)}
                                className="p-1.5 hover:bg-emerald-200/60 rounded text-emerald-800 transition-colors"
                                title="Copy TrxID"
                              >
                                {copiedValue === d.trxId ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Rejection with SMS Note Drawer */}
                      {rejectingDepositId === d.id && (
                        <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3 animate-in fade-in">
                          <label className="block text-xs font-bold text-rose-900">
                            ডিপোজিট রিজেক্ট করার কারণ (ইউজারকে SMS পাঠানো হবে):
                          </label>

                          {/* Quick Reason Chips */}
                          <div className="flex flex-wrap gap-1.5 text-[11px]">
                            {[
                              'ভুল বা ফেক TrxID',
                              'টাকা অ্যাকাউন্টে জমা হয়নি',
                              'টাকার পরিমাণ অমিল',
                              'ডুপ্লিকেট TrxID (ইতিমধ্যে ব্যবহৃত)',
                            ].map(reason => (
                              <button
                                key={reason}
                                type="button"
                                onClick={() => setDepositRejectReason(reason)}
                                className="px-2.5 py-1 bg-white border border-rose-200 hover:border-rose-400 text-rose-800 rounded-md font-semibold transition-colors"
                              >
                                {reason}
                              </button>
                            ))}
                          </div>

                          <input
                            type="text"
                            value={depositRejectReason}
                            onChange={e => setDepositRejectReason(e.target.value)}
                            placeholder="রিজেক্টের কারণ লিখুন (e.g. আপনার প্রেরিত TrxID টি সঠিক নয়)..."
                            className="w-full px-3 py-2 text-xs bg-white border border-rose-300 rounded-lg outline-none font-medium"
                          />

                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setRejectingDepositId(null);
                                setDepositRejectReason('');
                              }}
                              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                            >
                              বাতিল করুন
                            </button>
                            <button
                              onClick={() => handleConfirmRejectDeposit(d.id)}
                              className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center gap-1.5 shadow-xs"
                            >
                              <X className="w-3.5 h-3.5" />
                              রিজেক্ট ও SMS প্রেরণ নিশ্চিত করুন
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <span className="text-xs text-slate-500">
                          মেথড: <b>{d.method}</b> (Personal)
                        </span>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setRejectingDepositId(d.id);
                              setDepositRejectReason('ভুল বা ফেক TrxID');
                            }}
                            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            রিজেক্ট করুন (SMS সহ)
                          </button>
                          <button
                            onClick={() => onApproveDeposit(d.id)}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            অ্যাপ্রুভ ও ওয়ালেটে ৳{d.amount.toFixed(2)} যোগ করুন
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Deposits History */}
          {deposits.length > pendingDeposits.length && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Deposit History Log ({deposits.length - pendingDeposits.length})
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="p-2.5">User</th>
                      <th className="p-2.5">Method</th>
                      <th className="p-2.5">Amount</th>
                      <th className="p-2.5">TrxID</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">রিজেক্টের কারণ (যদি থাকে)</th>
                      <th className="p-2.5 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deposits.filter(d => d.status !== 'Pending').map(d => (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-800">@{d.user}</td>
                        <td className="p-2.5">{d.method}</td>
                        <td className="p-2.5 font-mono font-bold text-emerald-600">৳{d.amount.toFixed(2)}</td>
                        <td className="p-2.5 font-mono">{d.trxId}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {d.status === 'Completed' ? 'Approved' : 'Rejected'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-500 max-w-xs truncate">
                          {d.rejectionReason || '—'}
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-400">{d.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. WITHDRAWAL REQUESTS (আলাদা রিকোয়েস্ট কার্ড - Job Request এর মতো) */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-8">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-indigo-600" />
                  <span>Withdrawal Payout Requests (টাকা তোলার রিকোয়েস্ট)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ব্যবহারকারীদের উইথড্র রিকোয়েস্ট। bKash / Nagad একাউন্টে টাকা পাঠিয়ে অ্যাপ্রুভ করুন অথবা রিজেক্ট করলে ব্যালেন্স রিফান্ড হয়ে যাবে।
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full w-fit">
                {pendingWithdrawals.length} টি পেন্ডিং উইথড্র রিকোয়েস্ট
              </span>
            </div>

            {pendingWithdrawals.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 mb-6">
                <Check className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p className="text-sm font-semibold text-slate-700">কোনো পেন্ডিং উইথড্র নেই</p>
                <p className="text-xs text-slate-400 mt-0.5">সকল পে-আউট রিকোয়েস্ট পরিশোধ করা হয়েছে।</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 mb-6">
                {pendingWithdrawals.map(w => {
                  const targetUser = users.find(u => u.username.toLowerCase() === w.user.toLowerCase());
                  return (
                    <div
                      key={w.id}
                      className="bg-white rounded-2xl border border-indigo-200 p-6 shadow-xs relative overflow-hidden"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={targetUser?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${w.user}`}
                            alt={w.user}
                            className="w-12 h-12 rounded-xl bg-slate-100 object-cover border border-slate-200"
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-slate-900 text-base">
                                {targetUser?.name || w.userName || w.user}
                              </span>
                              <span className="text-xs font-mono text-slate-500">@{w.user}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md">
                                {w.method} Payout
                              </span>
                              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                Req #{w.id}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                              <span>User ID: <b className="font-mono text-slate-700">{targetUser?.id || w.user}</b></span>
                              <span>·</span>
                              <span>তারিখ ও সময়: <b>{w.date} {w.time || ''}</b></span>
                              <span>·</span>
                              <span>মেইন ব্যালেন্স: <b className="text-emerald-700 font-mono">৳{targetUser?.balance.toFixed(2) ?? '0.00'}</b></span>
                            </div>
                            {/* Account and Status bar */}
                            <div className="mt-2 text-xs flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <div>
                                <span className="text-slate-400 font-medium">উইথড্র অ্যাকাউন্ট: </span>
                                <span className="font-mono font-bold text-slate-900">{w.acc}</span>
                              </div>
                              <div className="border-l border-slate-200 pl-3">
                                <span className="text-slate-400 font-medium">পদ্ধতি: </span>
                                <span className="font-bold text-indigo-700">{w.method} (Personal)</span>
                              </div>
                              <div className="border-l border-slate-200 pl-3">
                                <span className="text-slate-400 font-medium">স্ট্যাটাস: </span>
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">
                                  {w.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Payout Amount & Account Number Box */}
                        <div className="flex items-center gap-4 bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200 shrink-0 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-indigo-800 block">
                              পরিশোধের পরিমাণ
                            </span>
                            <span className="text-xl font-black text-indigo-700 font-mono tabular-nums">
                              ৳{w.amount.toFixed(2)}
                            </span>
                          </div>
                          <div className="border-l border-indigo-200 pl-4">
                            <span className="text-[10px] uppercase font-bold text-indigo-800 block">
                              প্রাপক একাউন্ট ({w.method})
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-indigo-300 text-sm select-all">
                                {w.acc}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(w.acc)}
                                className="p-1.5 hover:bg-indigo-200/60 rounded text-indigo-800 transition-colors"
                                title="Copy Account Number"
                              >
                                {copiedValue === w.acc ? <Check className="w-3.5 h-3.5 text-indigo-700" /> : <Smartphone className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Rejection Drawer with Refund Note */}
                      {rejectingWithdrawalId === w.id && (
                        <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3 animate-in fade-in">
                          <label className="block text-xs font-bold text-rose-900">
                            উইথড্র বাতিল করার কারণ (ইউজারকে SMS যাবে এবং ৳{w.amount.toFixed(2)} রিফান্ড হবে):
                          </label>

                          <div className="flex flex-wrap gap-1.5 text-[11px]">
                            {[
                              'ভুল বা বন্ধ মোবাইল একাউন্ট নম্বর',
                              'বিকাশ/নগদ একাউন্ট লিমিট অতিক্রম করেছে',
                              'নাম ও একাউন্ট তথ্যে অমিল',
                            ].map(reason => (
                              <button
                                key={reason}
                                type="button"
                                onClick={() => setWithdrawalRejectReason(reason)}
                                className="px-2.5 py-1 bg-white border border-rose-200 hover:border-rose-400 text-rose-800 rounded-md font-semibold transition-colors"
                              >
                                {reason}
                              </button>
                            ))}
                          </div>

                          <input
                            type="text"
                            value={withdrawalRejectReason}
                            onChange={e => setWithdrawalRejectReason(e.target.value)}
                            placeholder="রিজেক্টের কারণ লিখুন..."
                            className="w-full px-3 py-2 text-xs bg-white border border-rose-300 rounded-lg outline-none font-medium"
                          />

                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setRejectingWithdrawalId(null);
                                setWithdrawalRejectReason('');
                              }}
                              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                            >
                              বাতিল করুন
                            </button>
                            <button
                              onClick={() => handleConfirmRejectWithdrawal(w.id)}
                              className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center gap-1.5 shadow-xs"
                            >
                              <X className="w-3.5 h-3.5" />
                              রিজেক্ট, রিফান্ড ও SMS নিশ্চিত করুন
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <span className="text-xs text-slate-500">
                          {w.method} নম্বরে <b>৳{w.amount.toFixed(2)}</b> ক্যাশ-আউট/সেন্ড মানি করুন।
                        </span>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setRejectingWithdrawalId(w.id);
                              setWithdrawalRejectReason('ভুল বা বন্ধ মোবাইল একাউন্ট নম্বর');
                            }}
                            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            বাতিল করুন (রিফান্ড সহ)
                          </button>
                          <button
                            onClick={() => onApproveWithdrawal(w.id)}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            টাকা পাঠানো হয়েছে (Confirm Payout Sent)
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Withdrawals History */}
          {withdrawals.length > pendingWithdrawals.length && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Withdrawal History Log ({withdrawals.length - pendingWithdrawals.length})
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="p-2.5">User</th>
                      <th className="p-2.5">Method</th>
                      <th className="p-2.5">Account No.</th>
                      <th className="p-2.5">Amount</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">রিজেক্ট নোট (যদি থাকে)</th>
                      <th className="p-2.5 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {withdrawals.filter(w => w.status !== 'Pending').map(w => (
                      <tr key={w.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-800">@{w.user}</td>
                        <td className="p-2.5">{w.method}</td>
                        <td className="p-2.5 font-mono">{w.acc}</td>
                        <td className="p-2.5 font-mono font-bold text-indigo-600">৳{w.amount.toFixed(2)}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            w.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {w.status === 'Completed' ? 'Completed' : 'Rejected'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-500 max-w-xs truncate">
                          {w.rejectionReason || '—'}
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-400">{w.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. USER MANAGEMENT & DETAILED ACTIVITY ANALYTICS */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Users (মোট ইউজার)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tabular-nums mt-1 block">
                {users.length}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">Registered on platform</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Jobs / Tasks Posted (মোট পোস্ট)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-indigo-600 font-mono tabular-nums mt-1 block">
                {jobs.length}
              </span>
              <span className="text-[11px] text-indigo-500 mt-1 block">Submitted by employers</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Active Workers (কাজ করেছে)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono tabular-nums mt-1 block">
                {activeWorkersCount}
              </span>
              <span className="text-[11px] text-emerald-600 mt-1 block">Submitted work proofs</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Referrals (মোট রেফার)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-500 font-mono tabular-nums mt-1 block">
                {totalReferrals}
              </span>
              <span className="text-[11px] text-amber-600 mt-1 block">Successful invitations</span>
            </div>
          </div>

          {/* User Directory Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">User Directory & Performance</h2>
                <p className="text-xs text-slate-500">
                  কোন ইউজার কয়টি পোস্ট করেছে, কি কি কাজ করেছে এবং কয়জন রেফার করেছে তার সম্পূর্ণ তথ্য।
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Balance</th>
                    <th className="p-3">Earnings</th>
                    <th className="p-3 text-center">Posts (পোস্ট করেছে)</th>
                    <th className="p-3 text-center">Tasks (কাজ করেছে)</th>
                    <th className="p-3 text-center">Referrals (রেফার)</th>
                    <th className="p-3">Ref Code</th>
                    <th className="p-3">Joined</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => {
                    const userPosts = getJobsPostedByUser(u.username);
                    const userSubmissions = getSubmissionsForUser(u.username);
                    const userReferredCount = getReferredUsersForUser(u.refCode).length;

                    return (
                      <tr key={u.username} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {u.isAdmin ? (
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center text-sm shadow-sm ring-2 ring-amber-300 font-bold select-none shrink-0">
                                👑
                              </div>
                            ) : (
                              <img
                                src={u.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                                alt={u.username}
                                className="w-8 h-8 rounded-full bg-slate-100 object-cover shrink-0"
                              />
                            )}
                            <div>
                              <div className="font-bold text-slate-800 flex items-center gap-1">
                                {u.name}
                                {u.isAdmin && <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">👑 Admin</span>}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-600 tabular-nums">৳{u.balance.toFixed(2)}</td>
                        <td className="p-3 font-mono tabular-nums">৳{u.earnings.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-lg font-bold font-mono ${
                            userPosts.length > 0 ? 'bg-indigo-50 text-indigo-700' : 'text-slate-400'
                          }`}>
                            {userPosts.length} posts
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-lg font-bold font-mono ${
                            userSubmissions.length > 0 ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400'
                          }`}>
                            {userSubmissions.length} tasks
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-lg font-bold font-mono ${
                            userReferredCount > 0 ? 'bg-amber-50 text-amber-700' : 'text-slate-400'
                          }`}>
                            {userReferredCount} users {userReferredCount > 0 && `(৳${userReferredCount * 5})`}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-600">{u.refCode}</td>
                        <td className="p-3 text-slate-500">{u.joinedAt}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedUserForActivity(u)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                              title="View full post, work and referral history"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Activity
                            </button>
                            {!u.isAdmin && (
                              <button
                                onClick={() => onToggleUserBan(u.username)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                                  u.isBanned
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                    : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                }`}
                              >
                                {u.isBanned ? 'Unban' : 'Suspend'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* User Activity & Work History Modal */}
      {selectedUserForActivity && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden relative my-6 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedUserForActivity.isAdmin ? (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center text-xl shadow-sm ring-2 ring-amber-300 font-bold select-none shrink-0">
                    👑
                  </div>
                ) : (
                  <img
                    src={selectedUserForActivity.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUserForActivity.username}`}
                    alt={selectedUserForActivity.username}
                    className="w-10 h-10 rounded-full bg-slate-200 object-cover shrink-0"
                  />
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    {selectedUserForActivity.name} (@{selectedUserForActivity.username})
                    {selectedUserForActivity.isAdmin && (
                      <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">👑 Admin</span>
                    )}
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Ref Code: {selectedUserForActivity.refCode} · Joined {selectedUserForActivity.joinedAt}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForActivity(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Financial & Activity Summary Bar */}
              <div className="grid grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Balance</span>
                  <span className="text-lg font-black text-emerald-600 font-mono tabular-nums">
                    ৳{selectedUserForActivity.balance.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Posts Created</span>
                  <span className="text-lg font-bold text-indigo-700 font-mono tabular-nums">
                    {getJobsPostedByUser(selectedUserForActivity.username).length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Tasks Worked</span>
                  <span className="text-lg font-bold text-emerald-700 font-mono tabular-nums">
                    {getSubmissionsForUser(selectedUserForActivity.username).length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Users Referred</span>
                  <span className="text-lg font-bold text-amber-600 font-mono tabular-nums">
                    {getReferredUsersForUser(selectedUserForActivity.refCode).length}
                  </span>
                </div>
              </div>

              {/* Section 1: Jobs / Posts Created by this User ("কয়টি পোস্ট করেছে") */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Jobs Posted by @{selectedUserForActivity.username} (পোস্টকৃত জব তালিকা)</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-600">
                    {getJobsPostedByUser(selectedUserForActivity.username).length} Posts
                  </span>
                </h4>

                {getJobsPostedByUser(selectedUserForActivity.username).length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                    This user has not posted any tasks yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getJobsPostedByUser(selectedUserForActivity.username).map(job => (
                      <div
                        key={job.id}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-900 text-sm">{job.title}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                              {job.category}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              job.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {job.status}
                            </span>
                          </div>
                          <div className="text-slate-500 text-[11px] flex gap-3">
                            <span>Worker Pay: <b className="font-mono text-emerald-600">৳{job.pay.toFixed(2)}</b></span>
                            <span>Completed: <b className="font-mono text-slate-800">{job.done}/{job.needed}</b></span>
                            <span>Posted on: {job.createdAt}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Permanently delete post #${job.id}: "${job.title}"?`)) {
                              onDeleteJob(job.id);
                            }
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0"
                          title="1-Click Delete Post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Post
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Tasks Worked On ("কি কি কাজ করেছে") */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    <span>Tasks Worked On & Submitted Proofs (কি কি কাজ করেছে)</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600">
                    {getSubmissionsForUser(selectedUserForActivity.username).length} Tasks
                  </span>
                </h4>

                {getSubmissionsForUser(selectedUserForActivity.username).length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                    This user has not submitted proofs for any tasks yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getSubmissionsForUser(selectedUserForActivity.username).map(sub => (
                      <div
                        key={sub.id}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-slate-900 text-sm">{sub.title}</span>
                            <span className="text-slate-400 block font-mono text-[11px]">
                              Job #{sub.jobId} · Submitted on {sub.submittedAt}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-emerald-600 text-sm">
                              ৳{sub.pay.toFixed(2)}
                            </span>
                            <span
                              className={`block px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${
                                sub.status === 'Approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : sub.status === 'Pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {sub.status}
                            </span>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <span className="font-bold text-slate-700 block mb-0.5">Submitted Work Proof:</span>
                          <p className="text-slate-600 whitespace-pre-wrap">{sub.proof}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 3: Users Referred ("কাদের রেফার করেছে") */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-amber-500" />
                    <span>Users Referred By @{selectedUserForActivity.username} (রেফারকৃত ইউজার তালিকা)</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-600">
                    {getReferredUsersForUser(selectedUserForActivity.refCode).length} Users
                  </span>
                </h4>

                {getReferredUsersForUser(selectedUserForActivity.refCode).length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                    No users have signed up with referral code {selectedUserForActivity.refCode} yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {getReferredUsersForUser(selectedUserForActivity.refCode).map(refUser => (
                      <div key={refUser.username} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          <img
                            src={refUser.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${refUser.username}`}
                            alt={refUser.username}
                            className="w-7 h-7 rounded-full bg-slate-100 object-cover"
                          />
                          <div>
                            <span className="font-bold text-slate-800">{refUser.name}</span>
                            <span className="font-mono text-slate-400 text-[10px] block">@{refUser.username}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Joined: {refUser.joinedAt}</span>
                          <span className="font-mono font-bold text-emerald-600">৳{refUser.balance.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUPPORT TICKETS */}
      {activeTab === 'tickets' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Customer Support Inquiries</h2>
          <p className="text-xs text-slate-500 mb-6">User support tickets regarding deposits, task disputes, and verification.</p>

          {tickets.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No open support tickets.</p>
          ) : (
            <div className="space-y-4">
              {tickets.map(t => (
                <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-900">{t.subject}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.status === 'Open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100">
                    {t.message}
                  </p>
                  <div className="text-[10px] text-slate-400">
                    From @{t.user} · {t.createdAt}
                  </div>

                  {t.adminReply && (
                    <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-900">
                      <b>Admin Answer:</b> {t.adminReply}
                    </div>
                  )}

                  {ticketReplyId === t.id ? (
                    <div className="pt-2 flex gap-2">
                      <input
                        type="text"
                        value={ticketReplyText}
                        onChange={e => setTicketReplyText(e.target.value)}
                        placeholder="Write official response..."
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none"
                      />
                      <button
                        onClick={() => handleConfirmReply(t.id)}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                      >
                        Send Reply
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <button
                        onClick={() => setTicketReplyId(t.id)}
                        className="text-xs text-indigo-600 hover:underline font-semibold"
                      >
                        Reply to Ticket
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. FINANCIAL DASHBOARD & TRANSACTION AUDIT */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          {/* Financial KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                Total Deposits Verified
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono tabular-nums mt-1 block">
                ৳{deposits.filter(d => d.status === 'Approved' || d.status === 'Completed').reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
              </span>
              <span className="text-[11px] text-emerald-600">bKash / Nagad Approved</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-xs bg-indigo-50/20">
              <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider block">
                Total Withdrawals Paid
              </span>
              <span className="text-2xl sm:text-3xl font-black text-indigo-700 font-mono tabular-nums mt-1 block">
                ৳{withdrawals.filter(w => w.status === 'Paid' || w.status === 'Completed').reduce((sum, w) => sum + w.amount, 0).toFixed(2)}
              </span>
              <span className="text-[11px] text-indigo-600">Paid out to workers</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                Task Rewards Distributed
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-700 font-mono tabular-nums mt-1 block">
                ৳{transactions.filter(t => t.type === 'Task Reward').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
              </span>
              <span className="text-[11px] text-amber-600">Transferred via atomic escrow</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Platform Revenue (Fees)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tabular-nums mt-1 block">
                ৳{(jobs.length * 10).toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-500">৳10 review fee per post</span>
            </div>
          </div>

          {/* Secondary Financial Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-400 block font-semibold mb-0.5">Total User Wallet Balances</span>
              <span className="text-lg font-bold font-mono text-slate-900">
                ৳{users.reduce((sum, u) => sum + (u.balance || 0), 0).toFixed(2)}
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-400 block font-semibold mb-0.5">Total Referral Bonuses Paid</span>
              <span className="text-lg font-bold font-mono text-amber-600">
                ৳{transactions.filter(t => t.type === 'Referral Bonus').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-400 block font-semibold mb-0.5">Total Escrow Refunds Paid</span>
              <span className="text-lg font-bold font-mono text-indigo-600">
                ৳{transactions.filter(t => t.type === 'Escrow Refund').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Transaction History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">All System Transactions</h3>
                <p className="text-xs text-slate-500">Atomic ledger records for all deposits, withdrawals, task rewards, and refunds.</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={txSearch}
                    onChange={e => setTxSearch(e.target.value)}
                    placeholder="Search by User or ID..."
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 w-44"
                  />
                </div>

                <select
                  value={txTypeFilter}
                  onChange={e => setTxTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-medium text-slate-700"
                >
                  <option value="ALL">All Types</option>
                  <option value="Task Payment">Task Payment</option>
                  <option value="Task Reward">Task Reward</option>
                  <option value="Deposit">Deposit</option>
                  <option value="Withdrawal">Withdrawal</option>
                  <option value="Escrow Refund">Escrow Refund</option>
                  <option value="Referral Bonus">Referral Bonus</option>
                  <option value="Job Posting Fee">Job Posting Fee</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3">Tx ID</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Details</th>
                    <th className="p-3 text-right">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions
                    .filter(tx => {
                      const matchSearch = !txSearch.trim() || 
                        tx.user.toLowerCase().includes(txSearch.toLowerCase()) ||
                        tx.id.toLowerCase().includes(txSearch.toLowerCase()) ||
                        (tx.details && tx.details.toLowerCase().includes(txSearch.toLowerCase()));
                      const matchType = txTypeFilter === 'ALL' || tx.type === txTypeFilter;
                      return matchSearch && matchType;
                    })
                    .slice(0, 100)
                    .map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-700">{tx.id}</td>
                        <td className="p-3 font-semibold text-slate-900">@{tx.user}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded font-medium ${
                            tx.type === 'Task Reward' ? 'bg-emerald-50 text-emerald-700' :
                            tx.type === 'Task Payment' ? 'bg-amber-50 text-amber-700' :
                            tx.type === 'Deposit' ? 'bg-indigo-50 text-indigo-700' :
                            tx.type === 'Withdrawal' ? 'bg-rose-50 text-rose-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className={`p-3 text-right font-mono font-bold tabular-nums ${
                          tx.amount >= 0 ? 'text-emerald-600' : 'text-slate-800'
                        }`}>
                          {tx.amount >= 0 ? `+৳${tx.amount.toFixed(2)}` : `-৳${Math.abs(tx.amount).toFixed(2)}`}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.status === 'Success' || tx.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                            tx.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs truncate" title={tx.details}>
                          {tx.details || '—'}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-400">
                          {tx.date} {tx.time && `· ${tx.time}`}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. TASK DISPUTE & MEDIATION CENTER */}
      {activeTab === 'disputes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>Task Dispute & Fraud Investigation Center</span>
              </h2>
              <p className="text-xs text-slate-500">
                Grievances filed by Workers against Employers (or vice versa). Inspect proof and issue payouts or escrow refunds.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={disputeSearch}
                onChange={e => setDisputeSearch(e.target.value)}
                placeholder="Search disputes..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 w-52"
              />
            </div>
          </div>

          {disputes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No Task Disputes</p>
              <p className="mt-0.5 text-slate-400">All task approvals and worker submissions are functioning smoothly.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes
                .filter(d => 
                  !disputeSearch.trim() ||
                  d.reporter.toLowerCase().includes(disputeSearch.toLowerCase()) ||
                  d.reportedUser.toLowerCase().includes(disputeSearch.toLowerCase()) ||
                  d.taskTitle.toLowerCase().includes(disputeSearch.toLowerCase()) ||
                  d.reason.toLowerCase().includes(disputeSearch.toLowerCase())
                )
                .map(d => {
                  const isOpen = d.status === 'Open';

                  return (
                    <div key={d.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                            <span className="font-mono font-bold text-slate-800">#{d.id}</span>
                            <span>·</span>
                            <span>Task #{d.taskId}: <b>{d.taskTitle}</b></span>
                            <span>·</span>
                            <span>Filed: {d.createdAt}</span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900">{d.reason}</h3>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          isOpen ? 'bg-rose-100 text-rose-800 animate-pulse' :
                          d.status.includes('Paid') ? 'bg-emerald-100 text-emerald-800' :
                          d.status.includes('Refunded') ? 'bg-indigo-100 text-indigo-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {d.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Reporter</span>
                          <span className="font-bold text-slate-900">@{d.reporter}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Reported User</span>
                          <span className="font-bold text-rose-700">@{d.reportedUser}</span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-800">
                        <span className="font-bold text-slate-500 uppercase block text-[10px] mb-1">Dispute Statement</span>
                        <p className="leading-relaxed">{d.details}</p>
                      </div>

                      {d.proofAttachment && (
                        <div className="text-xs">
                          <span className="font-bold text-slate-500 uppercase block text-[10px] mb-1">Evidence URL</span>
                          <a href={d.proofAttachment} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline break-all">
                            {d.proofAttachment}
                          </a>
                        </div>
                      )}

                      {d.resolutionNote && (
                        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900">
                          <span className="font-bold block mb-0.5">Admin Resolution Note:</span>
                          <p>{d.resolutionNote}</p>
                        </div>
                      )}

                      {/* Admin Resolution Drawer */}
                      {isOpen && (
                        <div className="pt-3 border-t border-slate-100 space-y-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={resolvingDisputeId === d.id ? disputeResolveNote : ''}
                              onChange={e => {
                                setResolvingDisputeId(d.id);
                                setDisputeResolveNote(e.target.value);
                              }}
                              placeholder="Add resolution explanation or warning..."
                              className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (onResolveDispute) {
                                  onResolveDispute(d.id, 'Dismissed', disputeResolveNote || 'Dispute reviewed and dismissed as unsubstantiated.');
                                }
                              }}
                              className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                            >
                              Dismiss Dispute
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (onResolveDispute) {
                                  onResolveDispute(d.id, 'Resolved - Owner Refunded', disputeResolveNote || 'Evidence confirmed task cancellation or fake worker proof. Owner refunded.');
                                }
                              }}
                              className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors"
                            >
                              Refund Owner
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (onResolveDispute) {
                                  onResolveDispute(d.id, 'Resolved - Worker Paid', disputeResolveNote || 'Worker proof verified as fully compliant with instructions. Worker rewarded.');
                                }
                              }}
                              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                            >
                              Pay Worker (Override)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* 8. AUDIT ACTIVITY LOGS */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <span>Live User Activity & Security Audit Logs</span>
              </h2>
              <p className="text-xs text-slate-500">
                Track when users register, post tasks, submit proofs, approve payouts, deposit, or withdraw.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={activitySearch}
                  onChange={e => setActivitySearch(e.target.value)}
                  placeholder="Filter logs..."
                  className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 w-44"
                />
              </div>

              <select
                value={activityCategoryFilter}
                onChange={e => setActivityCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none font-medium text-slate-700"
              >
                <option value="ALL">All Categories</option>
                <option value="finance">Finance & Wallet</option>
                <option value="task">Tasks & Submissions</option>
                <option value="auth">Auth & Registration</option>
                <option value="dispute">Disputes</option>
                <option value="admin">Admin Actions</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            {activityLogs.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">No activity logs recorded yet.</p>
            ) : (
              <div className="space-y-2.5">
                {activityLogs
                  .filter(log => {
                    const matchSearch = !activitySearch.trim() ||
                      log.user.toLowerCase().includes(activitySearch.toLowerCase()) ||
                      log.action.toLowerCase().includes(activitySearch.toLowerCase()) ||
                      log.details.toLowerCase().includes(activitySearch.toLowerCase());
                    const matchCategory = activityCategoryFilter === 'ALL' || log.category === activityCategoryFilter;
                    return matchSearch && matchCategory;
                  })
                  .slice(0, 150)
                  .map(log => (
                    <div key={log.id} className="p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-100 flex items-start justify-between gap-3 text-xs transition-colors">
                      <div className="flex items-start gap-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 mt-0.5 ${
                          log.category === 'finance' ? 'bg-emerald-100 text-emerald-800' :
                          log.category === 'task' ? 'bg-amber-100 text-amber-800' :
                          log.category === 'admin' ? 'bg-rose-100 text-rose-800' :
                          log.category === 'dispute' ? 'bg-violet-100 text-violet-800' :
                          'bg-indigo-100 text-indigo-800'
                        }`}>
                          {log.action}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 mr-2">@{log.user}</span>
                          <span className="text-slate-700">{log.details}</span>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                        {log.timestamp}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. SYSTEM, MAINTENANCE & BACKUP */}
      {activeTab === 'system' && (
        <div className="space-y-6 max-w-4xl">
          {/* Maintenance Mode Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-5 h-5 text-amber-600" />
              <h2 className="text-xl font-bold text-slate-900">Maintenance Mode Control</h2>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              When Maintenance Mode is enabled, regular visitors see an announcement screen while administrators maintain full access.
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-slate-900 block">Website Maintenance Switch</span>
                  <span className="text-xs text-slate-500">
                    {maintEnabled ? 'Currently ACTIVE (Non-admins will see maintenance banner)' : 'Currently OFF (Website is public)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMaintEnabled(!maintEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    maintEnabled ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      maintEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Custom Maintenance Announcement Message
                </label>
                <input
                  type="text"
                  value={maintText}
                  onChange={e => setMaintText(e.target.value)}
                  placeholder="e.g. Website is undergoing scheduled maintenance..."
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (onToggleMaintenance) {
                      onToggleMaintenance(maintEnabled, maintText);
                    }
                  }}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Apply Maintenance Settings</span>
                </button>
              </div>
            </div>
          </div>

          {/* Backup & Recovery Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Server className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-900">Database Backup & Recovery</h2>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Export and download a complete JSON snapshot of all platform users, tasks, transactions, and deposits. Restore at any time.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Export Backup */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>Download Backup Snapshot</span>
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Creates an encrypted JSON backup file containing all user balances, pending proofs, and transactions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onExportBackup) {
                      onExportBackup();
                    }
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .JSON Backup</span>
                </button>
              </div>

              {/* Restore Backup */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-indigo-600" />
                    <span>Restore from Backup File</span>
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Upload a previously downloaded JSON backup to restore application data.
                  </p>
                </div>
                <label className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Select Backup File to Restore</span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file && onImportBackup) {
                        const reader = new FileReader();
                        reader.onload = evt => {
                          try {
                            const parsed = JSON.parse(evt.target?.result as string);
                            onImportBackup(parsed);
                          } catch {
                            alert('Invalid JSON backup file.');
                          }
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Manage Deposit Mobile Number</h2>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Update the bKash / Nagad / Rocket number displayed to all users across the website for deposits.
          </p>

          <form
            onSubmit={e => {
              e.preventDefault();
              if (!newDepositNumber.trim() || newDepositNumber.trim().length < 11) {
                alert('Please enter a valid 11-digit mobile number.');
                return;
              }
              onUpdateDepositNumber(newDepositNumber.trim());
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Active Deposit Number (Personal)
              </label>
              <input
                type="text"
                required
                value={newDepositNumber}
                onChange={e => setNewDepositNumber(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-bold text-slate-900 text-lg tracking-wider"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Current active number: <b className="font-mono text-slate-700">{depositNumber}</b>
              </span>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <span className="font-bold block">User Experience Preview:</span>
              <p>
                When a user opens their <strong>Wallet &gt; Deposit Balance</strong>, they will see this number with a one-click copy button to send money via bKash/Nagad.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save & Update Website Deposit Number
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
