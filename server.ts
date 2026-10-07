import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Server-side database file persistence
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache synced with disk
let serverState: any = null;

function loadState(): any {
  if (serverState) return serverState;
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      serverState = JSON.parse(data);
      return serverState;
    }
  } catch (err) {
    console.error('Error loading server DB file:', err);
  }
  return null;
}

function saveState(state: any) {
  try {
    serverState = state;
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing server DB file:', err);
  }
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Sync / State Endpoints
app.get('/api/state', (_req: Request, res: Response) => {
  const state = loadState();
  res.json({ state });
});

app.post('/api/state/sync', (req: Request, res: Response) => {
  const { state } = req.body;
  if (state) {
    saveState(state);
    return res.json({ success: true, message: 'State synced with server database.' });
  }
  res.status(400).json({ error: 'Missing state body' });
});

// Helper to log user activity
function recordActivity(state: any, user: string, action: string, details: string, category: 'auth' | 'task' | 'finance' | 'admin' | 'dispute') {
  if (!state.activityLogs) state.activityLogs = [];
  state.activityLogs.unshift({
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleString(),
    user,
    action,
    details,
    category,
  });
  // Keep last 500 logs
  if (state.activityLogs.length > 500) {
    state.activityLogs = state.activityLogs.slice(0, 500);
  }
}

// 1. ATOMIC SECURE TASK APPROVAL
// Deducts from Owner, credits to Worker, records 2 transactions, updates slot & app status
app.post('/api/financial/approve-task', (req: Request, res: Response) => {
  const { appId, callerUsername, currentState } = req.body;
  const state = currentState || loadState();
  if (!state) return res.status(500).json({ error: 'Database state unavailable' });

  const appItem = state.applications?.find((a: any) => a.id === appId);
  if (!appItem) return res.status(404).json({ error: 'Submission not found' });
  if (appItem.status !== 'Pending') {
    return res.status(400).json({ error: 'Submission is not pending or already approved/rejected' });
  }

  const job = state.jobs?.find((j: any) => j.id === appItem.jobId);
  if (!job) return res.status(404).json({ error: 'Task not found' });

  // Fraud / Permission validation
  const callerUser = state.allUsers?.find((u: any) => u.username.toLowerCase() === callerUsername?.toLowerCase());
  const isOwner = job.poster.toLowerCase() === callerUsername?.toLowerCase();
  const isAdmin = callerUser?.isAdmin;

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Unauthorized: Only task owner or platform admin can approve' });
  }

  const workerUser = state.allUsers?.find((u: any) => u.username.toLowerCase() === appItem.user.toLowerCase());
  if (!workerUser) return res.status(404).json({ error: 'Worker account not found' });

  const payout = Number(appItem.pay);
  const employerUser = state.allUsers?.find((u: any) => u.username.toLowerCase() === job.poster.toLowerCase());

  // Balance validation for employer (if not admin)
  if (employerUser && !employerUser.isAdmin && employerUser.balance < payout) {
    return res.status(400).json({
      error: `Insufficient balance! Task owner requires at least ৳${payout.toFixed(2)} to approve this task.`,
    });
  }

  // ATOMIC TRANSFER
  if (employerUser && !employerUser.isAdmin) {
    employerUser.balance = Math.max(0, employerUser.balance - payout);
  }
  workerUser.balance = (workerUser.balance || 0) + payout;
  workerUser.earnings = (workerUser.earnings || 0) + payout;

  // Update submission status
  appItem.status = 'Approved';
  appItem.reviewedAt = new Date().toLocaleDateString();

  // Decrement available slots (increment done)
  job.done = Math.min(job.needed, (job.done || 0) + 1);
  job.spentBudget = (job.spentBudget || 0) + payout;
  if (job.done >= job.needed) {
    job.status = 'Completed';
  }

  const txDate = new Date().toLocaleDateString();
  const txTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Record 2 Transactions atomically
  if (!state.transactions) state.transactions = [];
  state.transactions.unshift({
    id: `tx_${Date.now()}_task_pay`,
    user: job.poster,
    type: 'Task Payment',
    amount: -payout,
    direction: 'out',
    taskId: job.id,
    submissionId: appItem.id,
    status: 'Success',
    date: txDate,
    time: txTime,
    details: `Task Payment to @${appItem.user} for "${job.title}" (Task #TASK-${job.id})`,
  });

  state.transactions.unshift({
    id: `tx_${Date.now() + 1}_task_reward`,
    user: appItem.user,
    type: 'Task Reward',
    amount: payout,
    direction: 'in',
    taskId: job.id,
    submissionId: appItem.id,
    status: 'Success',
    date: txDate,
    time: txTime,
    details: `Task Reward from @${job.poster} for "${job.title}" (Task #TASK-${job.id})`,
  });

  // Notify Worker
  if (!state.messages) state.messages = [];
  state.messages.unshift({
    id: `msg_appr_${Date.now()}`,
    from: 'system',
    to: appItem.user,
    jobId: job.id,
    jobTitle: job.title,
    text: `🎉 Your task has been approved! ৳${payout.toFixed(2)} has been credited to your wallet for task "${job.title}". (Task #TASK-${job.id})`,
    timestamp: txTime,
    isRead: false,
  });

  recordActivity(state, callerUsername, 'TASK_APPROVED', `Approved submission #${appItem.id} for Task #${job.id}. Transferred ৳${payout.toFixed(2)} to @${appItem.user}`, 'finance');

  saveState(state);
  res.json({
    success: true,
    message: `Task approved! ৳${payout.toFixed(2)} transferred to @${appItem.user}`,
    state,
    payout,
  });
});

// 2. ATOMIC TASK CANCEL & UNUSED ESCROW REFUND
app.post('/api/financial/cancel-task', (req: Request, res: Response) => {
  const { jobId, callerUsername, currentState } = req.body;
  const state = currentState || loadState();
  if (!state) return res.status(500).json({ error: 'Database state unavailable' });

  const job = state.jobs?.find((j: any) => j.id === jobId);
  if (!job) return res.status(404).json({ error: 'Task not found' });

  const callerUser = state.allUsers?.find((u: any) => u.username.toLowerCase() === callerUsername?.toLowerCase());
  const isOwner = job.poster.toLowerCase() === callerUsername?.toLowerCase();
  const isAdmin = callerUser?.isAdmin;

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Unauthorized to cancel this task' });
  }

  const remainingSlots = Math.max(0, job.needed - job.done);
  const unusedEscrow = remainingSlots * job.pay;

  job.status = 'Cancelled';

  // Refund unused escrow to owner
  const owner = state.allUsers?.find((u: any) => u.username.toLowerCase() === job.poster.toLowerCase());
  if (owner && unusedEscrow > 0) {
    owner.balance += unusedEscrow;

    if (!state.transactions) state.transactions = [];
    state.transactions.unshift({
      id: `tx_${Date.now()}_escrow_refund`,
      user: job.poster,
      type: 'Escrow Refund',
      amount: unusedEscrow,
      direction: 'in',
      taskId: job.id,
      status: 'Success',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      details: `Refund of unused escrow for cancelled Task #${job.id} (${remainingSlots} slots * ৳${job.pay})`,
    });
  }

  recordActivity(state, callerUsername, 'TASK_CANCELLED', `Cancelled Task #${job.id}. Refunded ৳${unusedEscrow.toFixed(2)} to owner @${job.poster}`, 'finance');

  saveState(state);
  res.json({
    success: true,
    message: `Task #${jobId} cancelled. ৳${unusedEscrow.toFixed(2)} refunded to @${job.poster}.`,
    state,
    refundedAmount: unusedEscrow,
  });
});

// 3. AUTO-EXPIRE TASKS & REFUND
app.post('/api/tasks/check-expirations', (req: Request, res: Response) => {
  const { currentState } = req.body;
  const state = currentState || loadState();
  if (!state || !state.jobs) return res.json({ expiredCount: 0 });

  const now = new Date();
  let expiredCount = 0;

  state.jobs.forEach((job: any) => {
    if ((job.status === 'Active' || job.status === 'Approved') && job.deadline) {
      const deadlineDate = new Date(job.deadline);
      if (!isNaN(deadlineDate.getTime()) && now > deadlineDate) {
        job.status = 'Expired';
        const remainingSlots = Math.max(0, job.needed - job.done);
        const unusedEscrow = remainingSlots * job.pay;

        const owner = state.allUsers?.find((u: any) => u.username.toLowerCase() === job.poster.toLowerCase());
        if (owner && unusedEscrow > 0) {
          owner.balance += unusedEscrow;
          state.transactions.unshift({
            id: `tx_${Date.now()}_expired_refund_${job.id}`,
            user: job.poster,
            type: 'Escrow Refund',
            amount: unusedEscrow,
            direction: 'in',
            taskId: job.id,
            status: 'Success',
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            details: `Auto-refund for expired Task #${job.id} (${remainingSlots} slots * ৳${job.pay})`,
          });
        }
        expiredCount++;
      }
    }
  });

  if (expiredCount > 0) {
    saveState(state);
  }
  res.json({ success: true, expiredCount, state });
});

// 4. ATOMIC WITHDRAWAL REQUEST
app.post('/api/financial/withdraw-request', (req: Request, res: Response) => {
  const { username, amount, method, acc, currentState } = req.body;
  const state = currentState || loadState();
  if (!state) return res.status(500).json({ error: 'Database state unavailable' });

  const user = state.allUsers?.find((u: any) => u.username.toLowerCase() === username?.toLowerCase());
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.isBanned) return res.status(403).json({ error: 'Account is suspended' });

  const withdrawAmount = Number(amount);
  if (isNaN(withdrawAmount) || withdrawAmount < 50) {
    return res.status(400).json({ error: 'Minimum withdrawal amount is ৳50.00' });
  }

  if (user.balance < withdrawAmount) {
    return res.status(400).json({ error: 'Insufficient wallet balance' });
  }

  // Deduct balance atomically and put into pending
  user.balance -= withdrawAmount;

  const reqId = Date.now();
  const dateStr = new Date().toLocaleDateString();
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newWithdrawal = {
    id: reqId,
    user: user.username,
    userName: user.name,
    amount: withdrawAmount,
    method: method || 'bKash',
    acc: acc || '01XXXXXXXXX',
    status: 'Pending',
    date: dateStr,
    time: timeStr,
  };

  if (!state.withdrawals) state.withdrawals = [];
  state.withdrawals.unshift(newWithdrawal);

  if (!state.transactions) state.transactions = [];
  state.transactions.unshift({
    id: `tx_${reqId}_wd`,
    user: user.username,
    type: 'Withdrawal',
    amount: -withdrawAmount,
    direction: 'out',
    status: 'Pending',
    date: dateStr,
    time: timeStr,
    details: `Withdrawal request to ${method} (${acc}) - Pending Admin Review`,
  });

  recordActivity(state, user.username, 'WITHDRAW_REQUEST', `Submitted withdrawal request for ৳${withdrawAmount} via ${method}`, 'finance');

  saveState(state);
  res.json({ success: true, message: 'Withdrawal request submitted for admin review.', state });
});

// 5. ADMIN APPROVE OR REJECT WITHDRAWAL (With Auto-Refund on reject)
app.post('/api/financial/manage-withdrawal', (req: Request, res: Response) => {
  const { withdrawId, action, reason, currentState } = req.body;
  const state = currentState || loadState();
  if (!state) return res.status(500).json({ error: 'Database state unavailable' });

  const wd = state.withdrawals?.find((w: any) => w.id === withdrawId);
  if (!wd) return res.status(404).json({ error: 'Withdrawal request not found' });
  if (wd.status !== 'Pending') {
    return res.status(400).json({ error: 'Withdrawal is already processed' });
  }

  const user = state.allUsers?.find((u: any) => u.username.toLowerCase() === wd.user.toLowerCase());

  if (action === 'approve') {
    wd.status = 'Paid';
    const tx = state.transactions?.find((t: any) => t.id === `tx_${wd.id}_wd` || (t.user.toLowerCase() === wd.user.toLowerCase() && t.type === 'Withdrawal' && t.status === 'Pending'));
    if (tx) tx.status = 'Success';

    state.messages?.unshift({
      id: `msg_wd_${Date.now()}`,
      from: 'system',
      to: wd.user,
      text: `✅ Your withdrawal request #${wd.id} for ৳${wd.amount} to ${wd.method} (${wd.acc}) has been approved and paid!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
    });

    recordActivity(state, 'admin', 'WITHDRAW_APPROVED', `Paid withdrawal #${wd.id} of ৳${wd.amount} to @${wd.user}`, 'finance');
  } else if (action === 'reject') {
    wd.status = 'Rejected';
    wd.rejectionReason = reason || 'Rejected by administrator';

    // AUTO REFUND back to user balance!
    if (user) {
      user.balance += wd.amount;
    }

    const tx = state.transactions?.find((t: any) => t.id === `tx_${wd.id}_wd`);
    if (tx) tx.status = 'Rejected';

    state.transactions?.unshift({
      id: `tx_${Date.now()}_wd_refund`,
      user: wd.user,
      type: 'Admin Adjustment',
      amount: wd.amount,
      direction: 'in',
      status: 'Success',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      details: `Refund for rejected withdrawal #${wd.id}: ${wd.rejectionReason}`,
    });

    state.messages?.unshift({
      id: `msg_wd_rej_${Date.now()}`,
      from: 'system',
      to: wd.user,
      text: `❌ Your withdrawal request #${wd.id} for ৳${wd.amount} was rejected (${wd.rejectionReason}). ৳${wd.amount} has been refunded to your wallet balance.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
    });

    recordActivity(state, 'admin', 'WITHDRAW_REJECTED', `Rejected withdrawal #${wd.id} and refunded ৳${wd.amount} to @${wd.user}`, 'finance');
  }

  saveState(state);
  res.json({ success: true, message: `Withdrawal ${action}ed successfully.`, state });
});

// 6. ADMIN APPROVE OR REJECT DEPOSIT
app.post('/api/financial/manage-deposit', (req: Request, res: Response) => {
  const { depositId, action, reason, currentState } = req.body;
  const state = currentState || loadState();
  if (!state) return res.status(500).json({ error: 'Database state unavailable' });

  const dep = state.deposits?.find((d: any) => d.id === depositId);
  if (!dep) return res.status(404).json({ error: 'Deposit request not found' });
  if (dep.status !== 'Pending') {
    return res.status(400).json({ error: 'Deposit is already processed' });
  }

  const user = state.allUsers?.find((u: any) => u.username.toLowerCase() === dep.user.toLowerCase());

  if (action === 'approve') {
    dep.status = 'Approved';
    if (user) {
      user.balance += dep.amount;
    }

    const tx = state.transactions?.find((t: any) => t.id === `tx_${dep.id}_dep`);
    if (tx) tx.status = 'Success';

    state.messages?.unshift({
      id: `msg_dep_${Date.now()}`,
      from: 'system',
      to: dep.user,
      text: `✅ Deposit verified! ৳${dep.amount} added to your wallet balance (TrxID: ${dep.trxId}).`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
    });

    recordActivity(state, 'admin', 'DEPOSIT_APPROVED', `Approved deposit #${dep.id} (৳${dep.amount}, TrxID: ${dep.trxId}) for @${dep.user}`, 'finance');
  } else if (action === 'reject') {
    dep.status = 'Rejected';
    dep.rejectionReason = reason || 'Invalid TrxID or payment not received';

    const tx = state.transactions?.find((t: any) => t.id === `tx_${dep.id}_dep`);
    if (tx) tx.status = 'Rejected';

    state.messages?.unshift({
      id: `msg_dep_rej_${Date.now()}`,
      from: 'system',
      to: dep.user,
      text: `❌ Deposit request #${dep.id} was rejected: ${dep.rejectionReason}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
    });

    recordActivity(state, 'admin', 'DEPOSIT_REJECTED', `Rejected deposit #${dep.id} for @${dep.user}`, 'finance');
  }

  saveState(state);
  res.json({ success: true, message: `Deposit ${action}ed successfully.`, state });
});

// 7. TASK DISPUTE / REPORT SYSTEM
app.post('/api/disputes/create', (req: Request, res: Response) => {
  const { taskId, taskTitle, submissionId, reporter, reportedUser, reason, details, proofAttachment, currentState } = req.body;
  const state = currentState || loadState();
  if (!state) return res.status(500).json({ error: 'Database state unavailable' });

  if (!state.disputes) state.disputes = [];

  const dispute = {
    id: `disp_${Date.now()}`,
    taskId,
    taskTitle,
    submissionId,
    reporter,
    reportedUser,
    reason,
    details,
    proofAttachment,
    status: 'Open',
    createdAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  state.disputes.unshift(dispute);
  recordActivity(state, reporter, 'DISPUTE_FILED', `Filed dispute against @${reportedUser} regarding Task #${taskId}: ${reason}`, 'dispute');

  saveState(state);
  res.json({ success: true, message: 'Dispute submitted. Admin has been notified for resolution.', dispute, state });
});

app.post('/api/disputes/resolve', (req: Request, res: Response) => {
  const { disputeId, resolution, resolutionNote, currentState } = req.body;
  const state = currentState || loadState();
  if (!state) return res.status(500).json({ error: 'Database state unavailable' });

  const dispute = state.disputes?.find((d: any) => d.id === disputeId);
  if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

  dispute.status = resolution; // 'Resolved - Worker Paid' | 'Resolved - Owner Refunded' | 'Dismissed'
  dispute.resolutionNote = resolutionNote;
  dispute.resolvedAt = new Date().toLocaleDateString();

  recordActivity(state, 'admin', 'DISPUTE_RESOLVED', `Resolved dispute #${disputeId}: ${resolution}. Note: ${resolutionNote}`, 'dispute');

  saveState(state);
  res.json({ success: true, message: 'Dispute resolved.', state });
});

// 8. ADMIN USER BAN / UNBAN
app.post('/api/admin/users/ban', (req: Request, res: Response) => {
  const { username, ban, currentState } = req.body;
  const state = currentState || loadState();
  if (!state) return res.status(500).json({ error: 'Database state unavailable' });

  const user = state.allUsers?.find((u: any) => u.username.toLowerCase() === username?.toLowerCase());
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.isBanned = !!ban;
  recordActivity(state, 'admin', ban ? 'USER_BANNED' : 'USER_UNBANNED', `${ban ? 'Suspended' : 'Activated'} account for @${username}`, 'admin');

  saveState(state);
  res.json({ success: true, message: `User @${username} ${ban ? 'suspended' : 'activated'}.`, state });
});

// 9. BACKUP & RESTORE DATABASE
app.get('/api/admin/backup', (_req: Request, res: Response) => {
  const state = loadState();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=work6t7_backup_${Date.now()}.json`);
  res.send(JSON.stringify(state, null, 2));
});

app.post('/api/admin/restore', (req: Request, res: Response) => {
  const { backupData } = req.body;
  if (!backupData || !backupData.allUsers) {
    return res.status(400).json({ error: 'Invalid backup data format' });
  }
  saveState(backupData);
  res.json({ success: true, message: 'Database restored successfully from backup!', state: backupData });
});

// Vite Middleware mounting in Dev or Static Serving in Prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(__dirname, 'dist');

  if (isProd && fs.existsSync(distPath)) {
    console.log('Serving production build from dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log('Starting Vite in middleware mode');
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Work 6T7 Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
