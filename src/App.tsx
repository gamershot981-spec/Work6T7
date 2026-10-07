import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  AppState, 
  User, 
  Job, 
  Application, 
  Transaction, 
  Message, 
  DepositRequest,
  WithdrawalRequest, 
  SupportTicket,
  Dispute,
  ActivityLog
} from './types';
import { getInitialState, saveState } from './mockData';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { JobMarketplace } from './components/JobMarketplace';
import { DashboardView } from './components/DashboardView';
import { WalletView } from './components/WalletView';
import { SupportView } from './components/SupportView';
import { AdminView } from './components/AdminView';
import { AuthModals } from './components/AuthModals';
import { ProfileModal } from './components/ProfileModal';
import { InboxModal } from './components/InboxModal';
import { PostJobModal } from './components/PostJobModal';
import { JobDetailsModal } from './components/JobDetailsModal';
import { DisputeModal } from './components/DisputeModal';
import { Home, Briefcase, Wallet, User as UserIcon, MessageSquare, Wrench, ShieldAlert } from 'lucide-react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  const [state, setState] = useState<AppState>(() => getInitialState());
  const [currentView, setCurrentView] = useState<string>('home');

  // Modals state
  const [authModal, setAuthModal] = useState<'login' | 'register' | 'admin' | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showPostJobModal, setShowPostJobModal] = useState<boolean>(false);
  const [showInboxModal, setShowInboxModal] = useState<boolean>(false);
  const [inboxRecipient, setInboxRecipient] = useState<string | null>(null);
  const [inboxJobContext, setInboxJobContext] = useState<{ id: number; title: string } | null>(null);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<Job | null>(null);
  const [initialRefCode, setInitialRefCode] = useState<string>('');
  const [showDisputeModal, setShowDisputeModal] = useState<boolean>(false);
  const [disputeContext, setDisputeContext] = useState<{ task?: Job | null; submission?: Application | null } | null>(null);

  // Check URL query parameters for referral link (e.g. ?ref=W6T7-ABC)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        setInitialRefCode(ref.trim().toUpperCase());
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  // Hydrate State & Active User Wallet Balance from Server Database on Mount
  useEffect(() => {
    let isMounted = true;

    const hydrateFromDatabase = async () => {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const data = await res.json();
          if (data.state && Array.isArray(data.state.allUsers) && isMounted) {
            setState(prev => {
              const serverUsers: User[] = data.state.allUsers;
              let currentUser = prev.user;

              if (currentUser) {
                const freshUser = serverUsers.find(
                  u => u.username.toLowerCase() === currentUser!.username.toLowerCase()
                );
                if (freshUser) {
                  currentUser = {
                    ...currentUser,
                    ...freshUser,
                    balance: typeof freshUser.balance === 'number' ? freshUser.balance : currentUser.balance,
                    earnings: typeof freshUser.earnings === 'number' ? freshUser.earnings : currentUser.earnings,
                  };
                }
              }

              // Server database is the single source of truth for users and balances
              const mergedUsers = serverUsers.map(su => ({
                ...su,
                balance: typeof su.balance === 'number' ? su.balance : 5.0,
                earnings: typeof su.earnings === 'number' ? su.earnings : 0.0,
              }));

              // Also include any newly registered local users not yet on server
              prev.allUsers.forEach(lu => {
                if (!mergedUsers.some(mu => mu.username.toLowerCase() === lu.username.toLowerCase())) {
                  mergedUsers.push(lu);
                }
              });

              // Filter out permanently removed or deleted jobs
              const activeJobs = (data.state.jobs || []).filter(
                (j: any) => !j.isDeleted && j.status !== 'Removed' && j.status !== 'Deleted'
              );

              return {
                ...data.state,
                user: currentUser,
                allUsers: mergedUsers,
                jobs: activeJobs,
                transactions: (data.state.transactions && data.state.transactions.length > 0) ? data.state.transactions : prev.transactions,
              };
            });
          }
        }
      } catch (err) {
        console.warn('Database server connection notice:', err);
      }
    };

    hydrateFromDatabase();
    return () => { isMounted = false; };
  }, []);

  // Periodic Auto-Expire & Escrow Refund for Tasks past Deadline
  useEffect(() => {
    const checkTaskDeadlines = () => {
      const now = new Date();
      setState(prev => {
        let hasExpired = false;
        let updatedUsers = [...prev.allUsers];
        let currentUser = prev.user ? { ...prev.user } : null;
        let newTransactions: Transaction[] = [];

        const nextJobs = prev.jobs.map(job => {
          if ((job.status === 'Active' || job.status === 'Approved') && job.deadline) {
            const deadlineDate = new Date(job.deadline);
            if (!isNaN(deadlineDate.getTime()) && now > deadlineDate) {
              hasExpired = true;
              const remainingSlots = Math.max(0, job.needed - job.done);
              const unusedEscrow = remainingSlots * job.pay;

              if (unusedEscrow > 0) {
                updatedUsers = updatedUsers.map(u => {
                  if (u.username.toLowerCase() === job.poster.toLowerCase()) {
                    return { ...u, balance: u.balance + unusedEscrow };
                  }
                  return u;
                });

                if (currentUser && currentUser.username.toLowerCase() === job.poster.toLowerCase()) {
                  currentUser.balance += unusedEscrow;
                }

                newTransactions.push({
                  id: `tx_${Date.now()}_exp_${job.id}`,
                  user: job.poster,
                  type: 'Escrow Refund',
                  amount: unusedEscrow,
                  taskId: job.id,
                  status: 'Success',
                  date: new Date().toLocaleDateString(),
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  details: `Auto-refund for expired Task #${job.id} (${remainingSlots} slots * ৳${job.pay.toFixed(2)})`,
                });
              }

              return { ...job, status: 'Expired' as const };
            }
          }
          return job;
        });

        if (!hasExpired) return prev;

        return {
          ...prev,
          user: currentUser,
          allUsers: updatedUsers,
          jobs: nextJobs,
          transactions: [...newTransactions, ...prev.transactions],
        };
      });
    };

    checkTaskDeadlines();
    const interval = setInterval(checkTaskDeadlines, 60000);
    return () => clearInterval(interval);
  }, []);

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  // Sync to localStorage and persist to server database whenever state changes
  useEffect(() => {
    saveState(state);
    // Background sync to server database
    fetch('/api/state/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    }).catch(() => {});
  }, [state]);

  // Unread messages count for currentUser
  const unreadCount = useMemo(() => {
    if (!state.user) return 0;
    return state.messages.filter(
      m => m.to.toLowerCase() === state.user?.username.toLowerCase() && !m.isRead
    ).length;
  }, [state.messages, state.user]);

  // View navigation helper
  const navigateTo = (view: string) => {
    if ((view === 'dashboard' || view === 'wallet') && !state.user) {
      setAuthModal('login');
      showToast('Please login to access your account.', 'info');
      return;
    }
    if (view === 'admin' && !state.user?.isAdmin) {
      setAuthModal('admin');
      return;
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth Handlers with Authoritative Database Wallet Hydration
  const handleLoginSuccess = async (loggedInUser: User) => {
    let freshUser = { ...loggedInUser };

    // Fetch authoritative wallet balance and records from permanent database
    try {
      const res = await fetch(`/api/user/wallet/${encodeURIComponent(loggedInUser.username)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          freshUser = {
            ...freshUser,
            ...data.user,
            balance: typeof data.user.balance === 'number' ? data.user.balance : freshUser.balance,
            earnings: typeof data.user.earnings === 'number' ? data.user.earnings : freshUser.earnings,
          };
        }
      }
    } catch {
      // offline fallback
    }

    setState(prev => {
      // Ensure the user's permanent wallet in allUsers is never overwritten or reset to 0
      const nextUsers = prev.allUsers.map(u =>
        u.username.toLowerCase() === freshUser.username.toLowerCase() ? freshUser : u
      );
      if (!nextUsers.some(u => u.username.toLowerCase() === freshUser.username.toLowerCase())) {
        nextUsers.push(freshUser);
      }

      return {
        ...prev,
        user: freshUser,
        allUsers: nextUsers,
      };
    });

    if (freshUser.isAdmin) {
      setCurrentView('admin');
    }
  };

  const handleRegisterSuccess = (newUser: User, newTxList: Transaction[], updatedReferrer?: User) => {
    setState(prev => {
      const nextUsers = [...prev.allUsers, newUser];
      if (updatedReferrer) {
        const refIndex = nextUsers.findIndex(u => u.username.toLowerCase() === updatedReferrer.username.toLowerCase());
        if (refIndex !== -1) {
          nextUsers[refIndex] = updatedReferrer;
        }
      }

      return {
        ...prev,
        user: newUser,
        allUsers: nextUsers,
        transactions: [...newTxList, ...prev.transactions],
      };
    });
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    // CRITICAL: Logout ≠ Wallet Reset.
    // Logging out ONLY ends authentication session (user: null).
    // The user's document in allUsers, their wallet balance, earnings, and transactions remain 100% permanently preserved in database!
    setState(prev => ({
      ...prev,
      user: null, // Clear session only
    }));
    setCurrentView('home');
    showToast('Logged out successfully. Your wallet balance is securely saved.', 'info');
  };

  // Profile Update Handler
  const handleUpdateProfile = (updatedData: Partial<User>) => {
    if (!state.user) return;
    const updatedUser: User = {
      ...state.user,
      ...updatedData,
    };

    setState(prev => ({
      ...prev,
      user: updatedUser,
      allUsers: prev.allUsers.map(u => 
        u.username.toLowerCase() === updatedUser.username.toLowerCase() ? updatedUser : u
      ),
    }));
  };

  // Post Job Handler (Deducts ৳10 fee + worker escrow budget)
  const handlePostJob = (newJob: Job, newTransactions: Transaction[], totalDeduction: number) => {
    if (!state.user) return;
    const updatedUser: User = {
      ...state.user,
      balance: state.user.balance - totalDeduction,
    };

    setState(prev => ({
      ...prev,
      user: updatedUser,
      allUsers: prev.allUsers.map(u => 
        u.username.toLowerCase() === updatedUser.username.toLowerCase() ? updatedUser : u
      ),
      jobs: [newJob, ...prev.jobs],
      transactions: [...newTransactions, ...prev.transactions],
    }));

    // Persist to server database atomically
    fetch('/api/tasks/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: state.user.username, jobData: newJob }),
    }).catch(() => {});
  };

  // Submit Proof for Job Handler
  const handleSubmitProof = (
    jobId: number,
    proof: string,
    screenshot?: string,
    submittedLink?: string
  ) => {
    if (!state.user) return;
    const job = state.jobs.find(j => j.id === jobId);
    if (!job) return;

    // Fraud prevention: Cannot submit work on own task
    if (job.poster.toLowerCase() === state.user.username.toLowerCase()) {
      showToast('You cannot submit work on your own task!', 'error');
      return;
    }

    // Fraud prevention: Only 1 active submission per worker per task
    const alreadyApplied = state.applications.some(
      a => a.jobId === jobId && a.user.toLowerCase() === state.user!.username.toLowerCase()
    );
    if (alreadyApplied) {
      showToast('You have already submitted proof for this task.', 'error');
      return;
    }

    // Slots validation
    if (job.done >= job.needed) {
      showToast('All slots for this task have already been filled.', 'error');
      return;
    }

    const subId = Date.now();
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newApp: Application = {
      id: subId,
      jobId,
      title: job.title,
      user: state.user.username,
      workerName: state.user.name,
      workerId: state.user.id || state.user.username,
      pay: job.pay,
      status: 'Pending',
      proof,
      screenshot,
      submittedLink,
      submittedAt: currentDate,
      submittedTime: currentTime,
    };

    // Notification to task creator
    const newOwnerNotification: Message = {
      id: `msg_sub_${Date.now()}`,
      from: 'system',
      to: job.poster,
      jobId: job.id,
      jobTitle: job.title,
      text: `📥 New task submission from @${state.user.username} for task: "${job.title}". Please inspect proof in your Dashboard > My Posted Tasks.`,
      timestamp: currentTime,
      isRead: false,
    };

    setState(prev => ({
      ...prev,
      applications: [newApp, ...prev.applications],
      messages: [newOwnerNotification, ...prev.messages],
    }));

    // Persist to server database
    fetch('/api/tasks/submit-proof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: state.user.username,
        jobId,
        proof,
        screenshot,
        submittedLink,
      }),
    }).catch(() => {});

    showToast(`Task proof submitted! Employer @${job.poster} will review your submission.`, 'success');
  };

  // Employer Approves Worker Application (Atomic Transfer: User A -৳Reward -> User B +৳Reward)
  const handleApproveApplication = async (appId: number) => {
    const app = state.applications.find(a => a.id === appId);
    if (!app || app.status !== 'Pending') {
      showToast('This submission is not pending or has already been approved.', 'info');
      return;
    }

    const job = state.jobs.find(j => j.id === app.jobId);
    if (!job) return;

    // Permission validation: Only Task Owner or Admin can approve
    const isOwner = state.user?.username.toLowerCase() === job.poster.toLowerCase() || state.user?.isAdmin;
    if (!isOwner) {
      showToast('Only the task owner or admin can approve this submission.', 'error');
      return;
    }

    // Find User A (Employer) and User B (Worker)
    const employerUser = state.allUsers.find(u => u.username.toLowerCase() === job.poster.toLowerCase());
    const workerUser = state.allUsers.find(u => u.username.toLowerCase() === app.user.toLowerCase());

    if (!workerUser) {
      showToast('Worker account not found.', 'error');
      return;
    }

    const payout = app.pay;

    // BALANCE CHECK: Task Owner must have sufficient funds (unless Admin)
    if (employerUser && !employerUser.isAdmin && employerUser.balance < payout) {
      showToast(
        `Insufficient wallet balance! Task owner @${job.poster} needs at least ৳${payout.toFixed(2)} to approve this worker. Please deposit funds.`,
        'error'
      );
      return;
    }

    try {
      const res = await fetch('/api/financial/approve-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId,
          callerUsername: state.user?.username,
          currentState: state,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to approve submission on server.', 'error');
        return;
      }

      if (data.state) {
        setState(prev => {
          const activeJobs = (data.state.jobs || []).filter(
            (j: any) => !j.isDeleted && j.status !== 'Removed' && j.status !== 'Deleted'
          );
          return {
            ...data.state,
            jobs: activeJobs,
            user: prev.user
              ? (data.state.allUsers?.find((u: any) => u.username.toLowerCase() === prev.user!.username.toLowerCase()) || prev.user)
              : null,
          };
        });
      }

      showToast(`Task approved! ৳${payout.toFixed(2)} transferred to @${app.user}'s wallet.`, 'success');
    } catch (err) {
      console.error('Error approving task:', err);
      showToast('Network error while processing task approval.', 'error');
    }
  };

  // Employer Rejects Worker Application (with reason & notification)
  const handleRejectApplication = async (appId: number, reason: string) => {
    const app = state.applications.find(a => a.id === appId);
    if (!app || app.status !== 'Pending') return;

    const rejectionNote = (reason || 'Proof is not valid.').trim();

    try {
      const res = await fetch('/api/tasks/reject-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId,
          callerUsername: state.user?.username,
          reason: rejectionNote,
          currentState: state,
        }),
      });

      const data = await res.json();
      if (res.ok && data.state) {
        setState(prev => {
          const activeJobs = (data.state.jobs || []).filter(
            (j: any) => !j.isDeleted && j.status !== 'Removed' && j.status !== 'Deleted'
          );
          return {
            ...data.state,
            jobs: activeJobs,
            user: prev.user
              ? (data.state.allUsers?.find((u: any) => u.username.toLowerCase() === prev.user!.username.toLowerCase()) || prev.user)
              : null,
          };
        });
      } else {
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setState(prev => ({
          ...prev,
          applications: prev.applications.map(a => 
            a.id === appId ? { ...a, status: 'Rejected' as const, rejectionReason: rejectionNote, reviewedAt: new Date().toLocaleDateString() } : a
          ),
          messages: [
            {
              id: `msg_rej_${Date.now()}`,
              from: 'system',
              to: app.user,
              jobId: app.jobId,
              jobTitle: app.title,
              text: `⚠️ Your task submission for "${app.title}" was rejected.\n\nReason: "${rejectionNote}".\nNo payment was deducted or credited.`,
              timestamp: currentTime,
              isRead: false,
            },
            ...prev.messages,
          ],
        }));
      }

      showToast(`Submission rejected. Reason sent to @${app.user}.`, 'info');
    } catch {
      showToast('Network error while rejecting application.', 'error');
    }
  };

  // Cancel Job Handler (Task creator cancels task -> Unused escrow refunded to owner)
  const handleCancelJob = (jobId: number) => {
    const job = state.jobs.find(j => j.id === jobId);
    if (!job) return;

    const remainingSlots = Math.max(0, job.needed - job.done);
    const unusedEscrow = remainingSlots * job.pay;

    setState(prev => {
      const nextUsers = prev.allUsers.map(u => {
        if (u.username.toLowerCase() === job.poster.toLowerCase() && unusedEscrow > 0) {
          return { ...u, balance: u.balance + unusedEscrow };
        }
        return u;
      });

      let currentUser = prev.user;
      if (currentUser && currentUser.username.toLowerCase() === job.poster.toLowerCase() && unusedEscrow > 0) {
        currentUser = { ...currentUser, balance: currentUser.balance + unusedEscrow };
      }

      const nextJobs = prev.jobs.map(j => j.id === jobId ? { ...j, status: 'Cancelled' as const } : j);

      const nextTransactions: Transaction[] = unusedEscrow > 0 ? [
        {
          id: `tx_${Date.now()}_escrow_refund`,
          user: job.poster,
          type: 'Escrow Refund',
          amount: unusedEscrow,
          taskId: job.id,
          status: 'Success',
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          details: `Unused escrow refund for cancelled task #${job.id} (${remainingSlots} slots * ৳${job.pay.toFixed(2)})`,
        },
        ...prev.transactions,
      ] : prev.transactions;

      const nextMessages: Message[] = unusedEscrow > 0 ? [
        {
          id: `msg_cancel_${Date.now()}`,
          from: 'system',
          to: job.poster,
          jobId: job.id,
          jobTitle: job.title,
          text: `ℹ️ Task #${job.id} has been cancelled. ৳${unusedEscrow.toFixed(2)} unused escrow has been refunded to your wallet.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: false,
        },
        ...prev.messages,
      ] : prev.messages;

      return {
        ...prev,
        user: currentUser,
        allUsers: nextUsers,
        jobs: nextJobs,
        transactions: nextTransactions,
        messages: nextMessages,
      };
    });

    // Sync with backend API
    fetch('/api/financial/cancel-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, callerUsername: state.user?.username, currentState: state })
    }).catch(() => {});

    showToast(`Task #${jobId} cancelled. ৳${unusedEscrow.toFixed(2)} refunded to your wallet.`, 'info');
  };

  // ADMIN: Approve Job Submission -> Published on Marketplace
  const handleAdminApproveJob = async (jobId: number) => {
    const targetJob = state.jobs.find(j => j.id === jobId);
    if (!targetJob) return;

    try {
      const res = await fetch('/api/jobs/manage-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          action: 'approve',
          callerUsername: state.user?.username || 'admin',
          currentState: state,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to approve job on server.', 'error');
        return;
      }

      if (data.state) {
        setState(prev => {
          const activeJobs = (data.state.jobs || []).filter(
            (j: any) => !j.isDeleted && j.status !== 'Removed' && j.status !== 'Deleted'
          );
          return {
            ...data.state,
            jobs: activeJobs,
            user: prev.user
              ? (data.state.allUsers?.find((u: any) => u.username.toLowerCase() === prev.user!.username.toLowerCase()) || prev.user)
              : null,
          };
        });
      } else {
        setState(prev => ({
          ...prev,
          jobs: prev.jobs.map(j => j.id === jobId ? { ...j, status: 'Approved' as const } : j),
        }));
      }

      showToast(`Job #${jobId} Approved! It is now live in the Job Marketplace.`, 'success');
    } catch {
      showToast('Network error while approving job.', 'error');
    }
  };

  // ADMIN: Reject Job Submission
  const handleAdminRejectJob = async (jobId: number, reason: string) => {
    const targetJob = state.jobs.find(j => j.id === jobId);
    if (!targetJob) return;

    try {
      const res = await fetch('/api/jobs/manage-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          action: 'reject',
          reason,
          callerUsername: state.user?.username || 'admin',
          currentState: state,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to reject job on server.', 'error');
        return;
      }

      if (data.state) {
        setState(prev => {
          const activeJobs = (data.state.jobs || []).filter(
            (j: any) => !j.isDeleted && j.status !== 'Removed' && j.status !== 'Deleted'
          );
          return {
            ...data.state,
            jobs: activeJobs,
            user: prev.user
              ? (data.state.allUsers?.find((u: any) => u.username.toLowerCase() === prev.user!.username.toLowerCase()) || prev.user)
              : null,
          };
        });
      } else {
        setState(prev => ({
          ...prev,
          jobs: prev.jobs.map(j => j.id === jobId ? { ...j, status: 'Rejected' as const, rejectionReason: reason } : j),
        }));
      }

      showToast(`Job #${jobId} Rejected. Poster has been notified.`, 'info');
    } catch {
      showToast('Network error while rejecting job.', 'error');
    }
  };

  // Delete / Remove Job Handler (Admin or Job Owner -> Permanent database deletion & real-time update)
  const handleDeleteJob = async (jobId: number) => {
    if (!state.user) return;
    const targetJob = state.jobs.find(j => j.id === jobId);
    if (!targetJob) return;

    const isOwner = targetJob.poster.toLowerCase() === state.user.username.toLowerCase();
    const isAdmin = !!state.user.isAdmin || state.user.username.toLowerCase() === 'admin';

    if (!isAdmin && !isOwner) {
      showToast('Unauthorized: You can only remove tasks you created.', 'error');
      return;
    }

    // Immediately remove from UI state so it disappears in real-time without page refresh!
    setState(prev => ({
      ...prev,
      jobs: prev.jobs.filter(j => j.id !== jobId),
    }));
    if (selectedJobForDetails?.id === jobId) {
      setSelectedJobForDetails(null);
    }

    try {
      const res = await fetch('/api/jobs/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          callerUsername: state.user.username,
          reason: isAdmin ? 'Removed by administrator' : 'Deleted by task owner',
          currentState: {
            ...state,
            jobs: state.jobs.filter(j => j.id !== jobId),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to remove task from database.', 'error');
      } else {
        if (data.state) {
          setState(prev => {
            const activeJobs = (data.state.jobs || []).filter(
              (j: any) => !j.isDeleted && j.status !== 'Removed' && j.status !== 'Deleted' && j.id !== jobId
            );
            return {
              ...data.state,
              jobs: activeJobs,
              user: prev.user
                ? (data.state.allUsers?.find((u: any) => u.username.toLowerCase() === prev.user!.username.toLowerCase()) || prev.user)
                : null,
            };
          });
        }
        showToast(`Job #${jobId} permanently removed.`, 'success');
      }
    } catch (err) {
      console.error('Failed to remove job from backend:', err);
    }
  };

  // ADMIN: Mark Withdrawal as Processing
  const handleAdminProcessWithdrawal = (id: number) => {
    const targetWd = state.withdrawals.find(w => w.id === id);
    if (!targetWd || targetWd.status !== 'Pending') return;

    setState(prev => ({
      ...prev,
      withdrawals: prev.withdrawals.map(w => w.id === id ? { ...w, status: 'Processing' as const } : w),
      messages: [
        {
          id: `msg_wd_proc_${Date.now()}`,
          from: 'admin',
          to: targetWd.user,
          text: `ℹ️ [উইথড্র প্রসেসিং / Withdrawal Processing]\nআপনার ৳${targetWd.amount.toFixed(2)} (${targetWd.method}, ${targetWd.acc}) উইথড্রয়াল রিকোয়েস্টটি অ্যাডমিন প্রসেসিং করছে। কিছুক্ষণের মধ্যে টাকা পাঠানো হবে।`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: false,
        },
        ...prev.messages,
      ],
    }));
    showToast(`Withdrawal #${id} status changed to Processing.`, 'info');
  };

  // ADMIN: Approve Withdrawal Payout (Mark as Paid)
  const handleAdminApproveWithdrawal = (id: number) => {
    const targetWd = state.withdrawals.find(w => w.id === id);
    if (!targetWd || (targetWd.status !== 'Pending' && targetWd.status !== 'Processing')) return;

    setState(prev => ({
      ...prev,
      withdrawals: prev.withdrawals.map(w => w.id === id ? { ...w, status: 'Paid' as const } : w),
      transactions: prev.transactions.map(t => {
        if (t.id.includes(`_${id}_wd`)) {
          return { ...t, status: 'Success' as const, details: `Payout sent to ${targetWd.method} (${targetWd.acc}) - Paid` };
        }
        return t;
      }),
      messages: [
        {
          id: `msg_wd_appr_${Date.now()}`,
          from: 'admin',
          to: targetWd.user,
          text: `Your withdrawal request has been paid successfully. (৳${targetWd.amount.toFixed(2)} sent to ${targetWd.method}: ${targetWd.acc})`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: false,
        },
        ...prev.messages,
      ],
    }));

    // Persist to server database
    fetch('/api/financial/manage-withdrawal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ withdrawId: id, action: 'approve' }),
    }).catch(() => {});

    showToast(`Withdrawal of ৳${targetWd.amount.toFixed(2)} marked as Paid successfully!`, 'success');
  };

  // ADMIN: Reject Withdrawal Payout (Refund balance to user with notification)
  const handleAdminRejectWithdrawal = (id: number, reason: string) => {
    const targetWd = state.withdrawals.find(w => w.id === id);
    if (!targetWd || (targetWd.status !== 'Pending' && targetWd.status !== 'Processing')) return;

    const rejectionNote = reason.trim() || 'ভুল একাউন্ট নম্বর বা পেমেন্ট গেটওয়ে সমস্যা';

    setState(prev => {
      // Refund reserved user balance back to available balance
      const nextUsers = prev.allUsers.map(u => {
        if (u.username.toLowerCase() === targetWd.user.toLowerCase()) {
          return { ...u, balance: u.balance + targetWd.amount };
        }
        return u;
      });

      let currentUser = prev.user;
      if (currentUser && currentUser.username.toLowerCase() === targetWd.user.toLowerCase()) {
        currentUser = { ...currentUser, balance: currentUser.balance + targetWd.amount };
      }

      const nextWithdrawals = prev.withdrawals.map(w => 
        w.id === id ? { ...w, status: 'Rejected' as const, rejectionReason: rejectionNote } : w
      );

      const nextTransactions: Transaction[] = [
        {
          id: `tx_${Date.now()}_wd_refund`,
          user: targetWd.user,
          type: 'Escrow Refund',
          amount: targetWd.amount,
          status: 'Success',
          date: new Date().toLocaleDateString(),
          details: `Withdrawal refund (Rejected: ${rejectionNote})`,
        },
        ...prev.transactions,
      ];

      const nextMessages: Message[] = [
        {
          id: `msg_wd_rej_${Date.now()}`,
          from: 'admin',
          to: targetWd.user,
          text: `⚠️ [উইথড্র বাতিল / Payout Rejected]\nআপনার ৳${targetWd.amount.toFixed(2)} (${targetWd.method}, Acc: ${targetWd.acc}) উইথড্র রিকোয়েস্টটি বাতিল করা হয়েছে।\n\n📌 কারণ: "${rejectionNote}"\n\n৳${targetWd.amount.toFixed(2)} আপনার ওয়ালেট ব্যালেন্সে রিফান্ড করা হয়েছে।`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: false,
        },
        ...prev.messages,
      ];

      return {
        ...prev,
        user: currentUser,
        allUsers: nextUsers,
        withdrawals: nextWithdrawals,
        transactions: nextTransactions,
        messages: nextMessages,
      };
    });

    // Persist to server database
    fetch('/api/financial/manage-withdrawal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ withdrawId: id, action: 'reject', reason: rejectionNote }),
    }).catch(() => {});

    showToast(`Withdrawal request #${id} rejected. ৳${targetWd.amount.toFixed(2)} refunded to @${targetWd.user}.`, 'info');
  };

  // ADMIN: Toggle User Ban
  const handleAdminToggleUserBan = async (username: string) => {
    const userToToggle = state.allUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
    const newBanStatus = !userToToggle?.isBanned;

    setState(prev => ({
      ...prev,
      allUsers: prev.allUsers.map(u => 
        u.username.toLowerCase() === username.toLowerCase() 
          ? { ...u, isBanned: newBanStatus } 
          : u
      ),
    }));

    try {
      await fetch('/api/admin/users/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, ban: newBanStatus }),
      });
      showToast(`User @${username} account ${newBanStatus ? 'suspended' : 'activated'}.`, 'info');
    } catch {
      showToast(`User @${username} status updated.`, 'info');
    }
  };

  // ADMIN: Reply Support Ticket
  const handleAdminReplyTicket = (id: number, reply: string) => {
    setState(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => 
        t.id === id ? { ...t, status: 'Answered' as const, adminReply: reply } : t
      ),
    }));
    showToast('Reply dispatched to user support ticket.', 'success');
  };

  // Wallet Deposit & Withdraw handlers with Duplicate TrxID Protection
  const handleDeposit = (
    amount: number,
    trxId: string,
    method: string,
    senderNumber?: string,
    screenshot?: string
  ): boolean => {
    if (!state.user) return false;

    const cleanTrx = trxId.trim().toUpperCase();

    // SECTION 5 & 15: DUPLICATE TRXID PROTECTION
    const isDuplicate = state.deposits.some(
      d => d.trxId.trim().toUpperCase() === cleanTrx
    );
    if (isDuplicate) {
      showToast('This transaction ID has already been used.', 'error');
      return false;
    }

    const depId = Date.now();
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newDepRequest: DepositRequest = {
      id: depId,
      user: state.user.username,
      userName: state.user.name,
      amount,
      trxId: cleanTrx,
      senderNumber: senderNumber?.trim() || '',
      screenshot: screenshot?.trim() || '',
      method,
      status: 'Pending',
      date: currentDate,
      time: currentTime,
    };

    const newTx: Transaction = {
      id: `tx_dep_${depId}`,
      user: state.user.username,
      type: 'Deposit',
      amount,
      status: 'Pending',
      date: currentDate,
      details: `${method} Deposit Request (TrxID: ${cleanTrx}) - Pending Admin Verification`,
    };

    setState(prev => ({
      ...prev,
      deposits: [newDepRequest, ...prev.deposits],
      transactions: [newTx, ...prev.transactions],
    }));

    // Persist to server database
    fetch('/api/wallet/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: state.user.username,
        amount,
        trxId: cleanTrx,
        method,
        senderNumber,
        screenshot,
      }),
    }).catch(() => {});

    showToast(`Deposit request of ৳${amount.toFixed(2)} submitted! Balance will be added after admin verifies TrxID.`, 'success');
    return true;
  };

  // ADMIN: Approve Deposit Request -> Adds balance to user's account (Anti-duplicate approval safe)
  const handleAdminApproveDeposit = (depositId: number) => {
    const deposit = state.deposits.find(d => d.id === depositId);
    if (!deposit || deposit.status !== 'Pending') {
      showToast('This request is not pending or has already been processed.', 'info');
      return;
    }

    setState(prev => {
      const currentDep = prev.deposits.find(d => d.id === depositId);
      if (!currentDep || currentDep.status !== 'Pending') return prev;

      const nextUsers = prev.allUsers.map(u => {
        if (u.username.toLowerCase() === deposit.user.toLowerCase()) {
          return { ...u, balance: u.balance + deposit.amount };
        }
        return u;
      });

      let currentUser = prev.user;
      if (currentUser && currentUser.username.toLowerCase() === deposit.user.toLowerCase()) {
        currentUser = { ...currentUser, balance: currentUser.balance + deposit.amount };
      }

      const nextDeposits = prev.deposits.map(d => 
        d.id === depositId ? { ...d, status: 'Approved' as const } : d
      );

      const nextTransactions = prev.transactions.map(t => {
        if (t.id === `tx_dep_${depositId}`) {
          return {
            ...t,
            status: 'Success' as const,
            details: `${deposit.method} Deposit Approved (+৳${deposit.amount.toFixed(2)}, TrxID: ${deposit.trxId})`,
          };
        }
        return t;
      });

      const nextMessages: Message[] = [
        {
          id: `msg_dep_appr_${Date.now()}`,
          from: 'admin',
          to: deposit.user,
          text: `Your ৳${deposit.amount.toFixed(2)} deposit has been approved and added to your wallet. (${deposit.method}, TrxID: ${deposit.trxId})`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: false,
        },
        ...prev.messages,
      ];

      return {
        ...prev,
        user: currentUser,
        allUsers: nextUsers,
        deposits: nextDeposits,
        transactions: nextTransactions,
        messages: nextMessages,
      };
    });

    // Persist to server database
    fetch('/api/financial/manage-deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ depositId, action: 'approve' }),
    }).catch(() => {});

    showToast(`Deposit approved! ৳${deposit.amount.toFixed(2)} added to @${deposit.user}'s wallet.`, 'success');
  };

  // ADMIN: Reject Deposit Request with reason notification
  const handleAdminRejectDeposit = (depositId: number, reason: string) => {
    const deposit = state.deposits.find(d => d.id === depositId);
    if (!deposit || deposit.status !== 'Pending') return;

    const rejectionNote = reason.trim() || 'ভুল বা অমিল TrxID (Invalid Transaction ID / Payment not received)';

    setState(prev => ({
      ...prev,
      deposits: prev.deposits.map(d => 
        d.id === depositId ? { ...d, status: 'Rejected' as const, rejectionReason: rejectionNote } : d
      ),
      transactions: prev.transactions.map(t => 
        t.id === `tx_dep_${depositId}` ? { 
          ...t, 
          status: 'Rejected' as const,
          details: `${deposit.method} Deposit Rejected: ${rejectionNote}`
        } : t
      ),
      messages: [
        {
          id: `msg_dep_rej_${Date.now()}`,
          from: 'admin',
          to: deposit.user,
          text: `⚠️ [ডিপোজিট রিজেক্ট / Deposit Rejected]\nআপনার ৳${deposit.amount.toFixed(2)} (${deposit.method}, TrxID: ${deposit.trxId}) ডিপোজিট রিকোয়েস্টটি অ্যাডমিন বাতিল করেছে।\n\n📌 বাতিল করার কারণ: "${rejectionNote}"\n\nদয়া করে সঠিক TrxID দিয়ে পুনরায় আবেদন করুন অথবা হেল্প ডেস্কে যোগাযোগ করুন।`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: false,
        },
        ...prev.messages,
      ],
    }));

    // Persist to server database
    fetch('/api/financial/manage-deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ depositId, action: 'reject', reason: rejectionNote }),
    }).catch(() => {});

    showToast(`Deposit request #${depositId} rejected. Reason sent to @${deposit.user}.`, 'info');
  };

  const handleUpdateDepositNumber = (newNumber: string) => {
    setState(prev => ({
      ...prev,
      depositNumber: newNumber,
    }));
    showToast(`Deposit number updated to ${newNumber}!`, 'success');
  };

  const handleWithdraw = (amount: number, acc: string, method: string) => {
    if (!state.user) return;
    if (state.user.balance < amount) {
      showToast(`Insufficient balance! Your available balance is ৳${state.user.balance.toFixed(2)}.`, 'error');
      return;
    }

    const updatedUser = { ...state.user, balance: state.user.balance - amount };
    const wdId = Date.now();
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newWithdrawal: WithdrawalRequest = {
      id: wdId,
      user: state.user.username,
      userName: state.user.name,
      amount,
      acc,
      method,
      status: 'Pending',
      date: currentDate,
      time: currentTime,
    };

    setState(prev => ({
      ...prev,
      user: updatedUser,
      allUsers: prev.allUsers.map(u => 
        u.username.toLowerCase() === updatedUser.username.toLowerCase() ? updatedUser : u
      ),
      withdrawals: [newWithdrawal, ...prev.withdrawals],
      transactions: [
        {
          id: `tx_${wdId}_wd`,
          user: state.user!.username,
          type: 'Withdrawal',
          amount: -amount,
          status: 'Pending',
          date: currentDate,
          details: `${method} Withdrawal Request to ${acc} - Pending Admin Payout`,
        },
        ...prev.transactions,
      ],
    }));

    // Persist to server database atomically
    fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: state.user.username,
        amount,
        method,
        acc,
      }),
    }).catch(() => {});

    showToast(`Withdrawal request of ৳${amount.toFixed(2)} submitted! Payout will be sent after Admin verification.`, 'info');
  };

  // Support Ticket Handler
  const handleSubmitTicket = (subject: string, category: string, message: string) => {
    if (!state.user) return;
    const newTicket: SupportTicket = {
      id: Date.now(),
      user: state.user.username,
      subject,
      category,
      message,
      status: 'Open',
      createdAt: new Date().toLocaleDateString(),
    };

    setState(prev => ({
      ...prev,
      tickets: [newTicket, ...prev.tickets],
    }));
  };

  // Messaging / Inbox Handlers
  const handleOpenMessagePoster = (posterUsername: string, jobId: number, jobTitle: string) => {
    if (!state.user) {
      setAuthModal('login');
      showToast('Please login to message the job poster.', 'info');
      return;
    }
    setInboxRecipient(posterUsername);
    setInboxJobContext({ id: jobId, title: jobTitle });
    setShowInboxModal(true);
  };

  const handleSendMessage = (toUser: string, text: string, jobId?: number, jobTitle?: string, imageUrl?: string) => {
    if (!state.user) return;

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      from: state.user.username,
      to: toUser,
      jobId,
      jobTitle,
      text,
      imageUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMsg],
    }));
  };

  // Dispute Handlers
  const handleOpenDispute = (task?: Job | null, sub?: Application | null) => {
    if (!state.user) {
      setAuthModal('login');
      showToast('Please login to file a dispute.', 'info');
      return;
    }
    setDisputeContext({ task, submission: sub });
    setShowDisputeModal(true);
  };

  const handleSubmitDispute = (
    taskId: number,
    taskTitle: string,
    submissionId: number | undefined,
    reportedUser: string,
    reason: string,
    details: string,
    proofAttachment?: string
  ) => {
    if (!state.user) return;

    const newDispute: Dispute = {
      id: `disp_${Date.now()}`,
      taskId,
      taskTitle,
      submissionId,
      reporter: state.user.username,
      reportedUser,
      reason,
      details,
      proofAttachment,
      status: 'Open',
      createdAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newLog: ActivityLog = {
      id: `act_${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      user: state.user.username,
      action: 'DISPUTE_FILED',
      details: `Filed dispute against @${reportedUser} regarding Task #${taskId}: ${reason}`,
      category: 'dispute',
    };

    setState(prev => ({
      ...prev,
      disputes: [newDispute, ...(prev.disputes || [])],
      activityLogs: [newLog, ...(prev.activityLogs || [])],
    }));

    // Sync to backend
    fetch('/api/disputes/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId,
        taskTitle,
        submissionId,
        reporter: state.user.username,
        reportedUser,
        reason,
        details,
        proofAttachment,
        currentState: state,
      }),
    }).catch(() => {});

    showToast('Dispute submitted! Platform Admin has been alerted for mediation.', 'success');
  };

  const handleResolveDispute = (id: string, resolution: any, note: string) => {
    const dispute = state.disputes.find(d => d.id === id);
    if (!dispute) return;

    setState(prev => {
      let updatedUsers = [...prev.allUsers];
      let currentUser = prev.user ? { ...prev.user } : null;
      let newTransactions: Transaction[] = [];

      // If resolving by paying worker
      if (resolution === 'Resolved - Worker Paid' && dispute.submissionId) {
        const sub = prev.applications.find(a => a.id === dispute.submissionId);
        if (sub) {
          const payout = sub.pay;
          updatedUsers = updatedUsers.map(u => {
            if (u.username.toLowerCase() === dispute.reporter.toLowerCase() || u.username.toLowerCase() === dispute.reportedUser.toLowerCase()) {
              if (u.username.toLowerCase() === sub.user.toLowerCase()) {
                return { ...u, balance: u.balance + payout, earnings: (u.earnings || 0) + payout };
              }
            }
            return u;
          });

          if (currentUser && currentUser.username.toLowerCase() === sub.user.toLowerCase()) {
            currentUser.balance += payout;
            currentUser.earnings = (currentUser.earnings || 0) + payout;
          }

          newTransactions.push({
            id: `tx_${Date.now()}_disp_pay`,
            user: sub.user,
            type: 'Task Reward',
            amount: payout,
            taskId: dispute.taskId,
            submissionId: sub.id,
            status: 'Success',
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            details: `Dispute Override Payment (Case #${dispute.id})`,
          });
        }
      }

      const updatedDisputes = prev.disputes.map(d =>
        d.id === id ? { ...d, status: resolution, resolutionNote: note, resolvedAt: new Date().toLocaleDateString() } : d
      );

      const newLog: ActivityLog = {
        id: `act_${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        user: 'admin',
        action: 'DISPUTE_RESOLVED',
        details: `Resolved dispute #${id}: ${resolution}. Note: ${note}`,
        category: 'dispute',
      };

      return {
        ...prev,
        user: currentUser,
        allUsers: updatedUsers,
        disputes: updatedDisputes,
        transactions: [...newTransactions, ...prev.transactions],
        activityLogs: [newLog, ...(prev.activityLogs || [])],
      };
    });

    // Sync to backend
    fetch('/api/disputes/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disputeId: id, resolution, resolutionNote: note, currentState: state }),
    }).catch(() => {});

    showToast(`Dispute #${id} resolved: ${resolution}`, 'success');
  };

  const handleToggleMaintenance = (enabled: boolean, message?: string) => {
    setState(prev => ({
      ...prev,
      maintenanceMode: enabled,
      maintenanceMessage: message || prev.maintenanceMessage,
    }));
    showToast(enabled ? 'Maintenance Mode ENABLED.' : 'Maintenance Mode DISABLED.', 'info');
  };

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `work6t7_backup_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
    showToast('Database backup downloaded successfully!', 'success');
  };

  const handleImportBackup = (backupData: any) => {
    if (!backupData || !Array.isArray(backupData.allUsers)) {
      showToast('Invalid backup file format.', 'error');
      return;
    }
    setState(backupData);
    saveState(backupData);
    showToast('Platform database restored successfully from backup!', 'success');
  };

  const handleMarkThreadAsRead = useCallback((otherUser: string) => {
    if (!state.user) return;
    setState(prev => {
      let changed = false;
      const nextMessages = prev.messages.map(m => {
        if (
          m.to.toLowerCase() === state.user?.username.toLowerCase() &&
          m.from.toLowerCase() === otherUser.toLowerCase() &&
          !m.isRead
        ) {
          changed = true;
          return { ...m, isRead: true };
        }
        return m;
      });
      return changed ? { ...prev, messages: nextMessages } : prev;
    });
  }, [state.user]);

  // Check if current user has applied to selectedJobForDetails
  const hasAppliedToSelectedJob = useMemo(() => {
    if (!selectedJobForDetails || !state.user) return false;
    return state.applications.some(
      a => a.jobId === selectedJobForDetails.id && a.user.toLowerCase() === state.user?.username.toLowerCase()
    );
  }, [selectedJobForDetails, state.applications, state.user]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans pb-16 md:pb-0">
      {/* Maintenance Mode Banner if active */}
      {state.maintenanceMode && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-xs sticky top-0 z-50">
          <div className="flex items-center gap-2 mx-auto">
            <Wrench className="w-4 h-4 shrink-0" />
            <span>{state.maintenanceMessage || 'Website is undergoing scheduled maintenance. Some functions may be paused.'}</span>
          </div>
          {!state.user?.isAdmin && (
            <button
              onClick={() => setAuthModal('admin')}
              className="text-[11px] underline hover:text-slate-900 shrink-0 font-medium ml-2"
            >
              Admin Access
            </button>
          )}
        </div>
      )}

      {/* Toast Notifications Toast Container */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-xl text-xs font-bold text-white flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 ${
              toast.type === 'error'
                ? 'bg-rose-600'
                : toast.type === 'info'
                ? 'bg-slate-800'
                : 'bg-emerald-600'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Primary Header */}
      <Header
        currentView={currentView}
        onNavigate={navigateTo}
        currentUser={state.user}
        unreadCount={unreadCount}
        onOpenAuth={mode => setAuthModal(mode)}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenPostJob={() => {
          if (!state.user) {
            setAuthModal('login');
            showToast('Please login to post a task.', 'info');
          } else {
            setShowPostJobModal(true);
          }
        }}
        onOpenInbox={() => {
          if (!state.user) {
            setAuthModal('login');
            showToast('Please login to view messages.', 'info');
          } else {
            setInboxRecipient(null);
            setInboxJobContext(null);
            setShowInboxModal(true);
          }
        }}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomeView
            jobs={state.jobs}
            currentUser={state.user}
            onNavigate={navigateTo}
            onSelectJob={job => setSelectedJobForDetails(job)}
            onOpenAuth={mode => setAuthModal(mode)}
            onOpenMessagePoster={handleOpenMessagePoster}
            onRequireLogin={() => {
              setAuthModal('login');
              showToast('Please login to continue.', 'info');
            }}
            onDeleteJob={handleDeleteJob}
          />
        )}

        {currentView === 'jobs' && (
          <JobMarketplace
            jobs={state.jobs}
            currentUser={state.user}
            onSelectJob={job => setSelectedJobForDetails(job)}
            onOpenMessagePoster={handleOpenMessagePoster}
            onRequireLogin={() => {
              setAuthModal('login');
              showToast('Please login to apply or message employers.', 'info');
            }}
            onDeleteJob={handleDeleteJob}
          />
        )}

        {currentView === 'dashboard' && state.user && (
          <DashboardView
            currentUser={state.user}
            jobs={state.jobs}
            applications={state.applications}
            allUsers={state.allUsers}
            onOpenPostJob={() => setShowPostJobModal(true)}
            onNavigate={navigateTo}
            onApproveApplication={handleApproveApplication}
            onRejectApplication={handleRejectApplication}
            onCancelJob={handleCancelJob}
            onDeleteJob={handleDeleteJob}
            onShowToast={showToast}
            onOpenDispute={handleOpenDispute}
          />
        )}

        {currentView === 'wallet' && state.user && (
          <WalletView
            currentUser={state.user}
            transactions={state.transactions}
            deposits={state.deposits}
            withdrawals={state.withdrawals}
            depositNumber={state.depositNumber}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            onOpenInbox={() => setShowInboxModal(true)}
            onShowToast={showToast}
          />
        )}

        {currentView === 'support' && (
          <SupportView
            currentUser={state.user}
            tickets={state.tickets}
            onSubmitTicket={handleSubmitTicket}
            onRequireLogin={() => {
              setAuthModal('login');
              showToast('Please login to submit support tickets.', 'info');
            }}
            onShowToast={showToast}
          />
        )}

        {currentView === 'admin' && (
          <AdminView
            jobs={state.jobs}
            users={state.allUsers}
            applications={state.applications}
            deposits={state.deposits}
            withdrawals={state.withdrawals}
            tickets={state.tickets}
            disputes={state.disputes}
            activityLogs={state.activityLogs}
            transactions={state.transactions}
            depositNumber={state.depositNumber}
            maintenanceMode={state.maintenanceMode}
            maintenanceMessage={state.maintenanceMessage}
            onApproveJob={handleAdminApproveJob}
            onRejectJob={handleAdminRejectJob}
            onDeleteJob={handleDeleteJob}
            onApproveDeposit={handleAdminApproveDeposit}
            onRejectDeposit={handleAdminRejectDeposit}
            onApproveWithdrawal={handleAdminApproveWithdrawal}
            onRejectWithdrawal={handleAdminRejectWithdrawal}
            onToggleUserBan={handleAdminToggleUserBan}
            onReplyTicket={handleAdminReplyTicket}
            onUpdateDepositNumber={handleUpdateDepositNumber}
            onResolveDispute={handleResolveDispute}
            onToggleMaintenance={handleToggleMaintenance}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={navigateTo} onOpenAuth={mode => setAuthModal(mode)} />

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 flex items-center justify-around py-2.5 shadow-lg">
        <button
          onClick={() => navigateTo('home')}
          className={`flex flex-col items-center text-[10px] font-bold ${
            currentView === 'home' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          Home
        </button>
        <button
          onClick={() => navigateTo('jobs')}
          className={`flex flex-col items-center text-[10px] font-bold ${
            currentView === 'jobs' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          <Briefcase className="w-5 h-5 mb-0.5" />
          Jobs
        </button>
        <button
          onClick={() => {
            if (!state.user) {
              setAuthModal('login');
            } else {
              setInboxRecipient(null);
              setInboxJobContext(null);
              setShowInboxModal(true);
            }
          }}
          className="flex flex-col items-center text-[10px] font-bold text-slate-500 relative"
        >
          <MessageSquare className="w-5 h-5 mb-0.5" />
          Inbox
          {unreadCount > 0 && (
            <span className="absolute -top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => navigateTo('wallet')}
          className={`flex flex-col items-center text-[10px] font-bold ${
            currentView === 'wallet' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          <Wallet className="w-5 h-5 mb-0.5" />
          Wallet
        </button>
        <button
          onClick={() => navigateTo('dashboard')}
          className={`flex flex-col items-center text-[10px] font-bold ${
            currentView === 'dashboard' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          <UserIcon className="w-5 h-5 mb-0.5" />
          Account
        </button>
      </nav>

      {/* MODALS */}
      {/* 1. Auth Modals (Login, Register with ৳5 + Referral ৳5, Admin Login) */}
      <AuthModals
        mode={authModal}
        onClose={() => setAuthModal(null)}
        allUsers={state.allUsers}
        initialRefCode={initialRefCode}
        onLoginSuccess={handleLoginSuccess}
        onRegisterSuccess={handleRegisterSuccess}
        onShowToast={showToast}
      />

      {/* 2. User Profile Modal */}
      {showProfileModal && state.user && (
        <ProfileModal
          user={state.user}
          onClose={() => setShowProfileModal(false)}
          onUpdateProfile={handleUpdateProfile}
          onShowToast={showToast}
        />
      )}

      {/* 3. Post Job Modal (৳10 fee, budget check, Pending Approval status) */}
      {showPostJobModal && state.user && (
        <PostJobModal
          currentUser={state.user}
          onClose={() => setShowPostJobModal(false)}
          onPostJob={handlePostJob}
          onShowToast={showToast}
          onOpenWallet={() => navigateTo('wallet')}
        />
      )}

      {/* 4. Direct Messages / Inbox Modal */}
      {showInboxModal && state.user && (
        <InboxModal
          currentUser={state.user}
          allUsers={state.allUsers}
          messages={state.messages}
          initialRecipient={inboxRecipient}
          initialJobContext={inboxJobContext}
          onClose={() => {
            setShowInboxModal(false);
            setInboxRecipient(null);
            setInboxJobContext(null);
          }}
          onSendMessage={handleSendMessage}
          onMarkThreadAsRead={handleMarkThreadAsRead}
        />
      )}

      {/* 5. Job Details Modal with Direct "Message / Inbox" button linking Job ID */}
      {selectedJobForDetails && (
        <JobDetailsModal
          job={selectedJobForDetails}
          currentUser={state.user}
          onClose={() => setSelectedJobForDetails(null)}
          onOpenMessagePoster={handleOpenMessagePoster}
          onSubmitProof={handleSubmitProof}
          onRequireLogin={() => {
            setAuthModal('login');
            showToast('Please login to apply or message employers.', 'info');
          }}
          hasAppliedAlready={hasAppliedToSelectedJob}
          onDeleteJob={handleDeleteJob}
        />
      )}

      {/* 6. Dispute & Mediation Investigation Modal */}
      {showDisputeModal && state.user && (
        <DisputeModal
          currentUser={state.user}
          task={disputeContext?.task}
          submission={disputeContext?.submission}
          onClose={() => {
            setShowDisputeModal(false);
            setDisputeContext(null);
          }}
          onSubmitDispute={handleSubmitDispute}
        />
      )}
    </div>
  );
}
