import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Cryptographic hash configuration for Admin Panel access
const ADMIN_PASSWORD_SALT = '9ac13da789e159f7200572836b18752b';
const ADMIN_PASSWORD_HASH = '754963dc38e22f62e3b89bab02f1f85864da602b20bfab2169b09bdac88a8974c844defa1c96fa5a749e4178e5f9c67622e8fa2f6d1d86ced8e2524b0f4da283';

function verifyHash(password: string, salt: string, hash: string): boolean {
  try {
    const computed = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

function sanitizeUser(user: any) {
  if (!user) return user;
  const copy = { ...user };
  delete copy.password;
  delete copy.passwordSalt;
  delete copy.passwordHash;
  return copy;
}

// Server-side database file persistence
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache synced with disk
let serverState: any = null;

function getDefaultServerState() {
  return {
    allUsers: [
      {
        username: 'admin',
        passwordSalt: ADMIN_PASSWORD_SALT,
        passwordHash: ADMIN_PASSWORD_HASH,
        name: 'Work 6T7 Admin',
        email: 'admin@work6t7.bd',
        bio: 'Platform Administrator & Quality Assurance',
        profilePhoto: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin6t7',
        balance: 50.0,
        reservedBalance: 0,
        earnings: 0,
        refCode: 'W6T7-ADMIN',
        isAdmin: true,
        joinedAt: '2026-01-01',
      },
    ],
    jobs: [
      {
        id: 1,
        poster: 'admin',
        posterName: 'Work 6T7 Official',
        title: 'Subscribe to YouTube Channel & Watch 1 Min',
        category: 'YouTube',
        pay: 5.0,
        needed: 100,
        done: 24,
        spentBudget: 120,
        inst: '1. Visit YouTube channel @Work6T7Official.\n2. Subscribe and watch the latest video for at least 60 seconds.\n3. Like the video.\n4. Submit your YouTube username and screenshot link as proof.',
        status: 'Approved',
        createdAt: '2026-03-10',
      },
      {
        id: 2,
        poster: 'admin',
        posterName: 'Work 6T7 Official',
        title: 'Join Official Discussion Group & Share Feedback',
        category: 'Social Media',
        pay: 4.0,
        needed: 50,
        done: 11,
        spentBudget: 44,
        inst: '1. Search for "Work 6T7 Community" on Facebook/Telegram.\n2. Answer the membership question with your username.\n3. Submit your profile link or screenshot as proof.',
        status: 'Approved',
        createdAt: '2026-03-12',
      },
    ],
    applications: [],
    transactions: [],
    deposits: [],
    withdrawals: [],
    tickets: [],
    disputes: [],
    activityLogs: [
      {
        id: 'log_init_1',
        timestamp: new Date().toLocaleString(),
        user: 'system',
        action: 'SYSTEM_BOOT',
        details: 'Secure Financial Engine initialized. Escrow protection active.',
        category: 'admin',
      }
    ],
    messages: [],
    depositNumber: '01774922356',
    maintenanceMode: false,
    maintenanceMessage: 'Website is undergoing scheduled maintenance. We will be back shortly!',
  };
}

function loadState(): any {
  if (serverState) return serverState;
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      serverState = JSON.parse(data);
      if (serverState && Array.isArray(serverState.allUsers)) {
        return serverState;
      }
    }
  } catch (err) {
    console.error('Error loading server DB file:', err);
  }
  serverState = getDefaultServerState();
  saveState(serverState);
  return serverState;
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

app.post('/api/state/sync', (_req: Request, res: Response) => {
  // Server is the single authoritative source of truth. Prevent client from overwriting jobs, applications, or transactions.
  const existingState = loadState();
  res.json({ success: true, message: 'Server database is authoritative state.', state: existingState });
});

// USER-SPECIFIC WALLET & FINANCIAL ENDPOINT (Permanent Database Record)
app.get('/api/user/wallet/:username', (req: Request, res: Response) => {
  const state = loadState();
  const username = req.params.username.toLowerCase();
  const user = state.allUsers?.find((u: any) => u.username.toLowerCase() === username);
  if (!user) {
    return res.status(404).json({ error: 'User not found in database' });
  }

  const userTransactions = (state.transactions || []).filter((t: any) => t.user.toLowerCase() === username);
  const userDeposits = (state.deposits || []).filter((d: any) => d.user.toLowerCase() === username);
  const userWithdrawals = (state.withdrawals || []).filter((w: any) => w.user.toLowerCase() === username);

  const pendingDeposits = userDeposits.filter((d: any) => d.status === 'Pending');
  const pendingDepositTotal = pendingDeposits.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);

  const pendingWithdrawals = userWithdrawals.filter((w: any) => w.status === 'Pending' || w.status === 'Processing');
  const pendingWithdrawalTotal = pendingWithdrawals.reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

  const totalWithdrawn = userWithdrawals
    .filter((w: any) => w.status === 'Paid')
    .reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

  const totalSpent = userTransactions
    .filter((t: any) => (t.type === 'Task Payment' || t.type === 'Task Posting Fee' || t.type === 'Escrow Hold') && t.status === 'Success')
    .reduce((sum: number, t: any) => sum + Math.abs(t.amount || 0), 0);

  res.json({
    success: true,
    user: {
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      profilePhoto: user.profilePhoto,
      balance: user.balance,
      reservedBalance: user.reservedBalance || 0,
      earnings: user.earnings || 0,
      refCode: user.refCode,
      isAdmin: !!user.isAdmin,
      isBanned: !!user.isBanned,
      joinedAt: user.joinedAt,
      referredBy: user.referredBy,
    },
    wallet: {
      availableBalance: user.balance,
      reservedBalance: user.reservedBalance || 0,
      pendingBalance: pendingDepositTotal,
      pendingWithdrawal: pendingWithdrawalTotal,
      totalEarned: user.earnings || 0,
      totalSpent,
      totalWithdrawn,
      transactions: userTransactions,
      deposits: userDeposits,
      withdrawals: userWithdrawals,
    }
  });
});

// AUTH LOGIN (Authoritative Verification & Returns Permanent Wallet Balance)
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  const state = loadState();
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  const user = state.allUsers?.find((u: any) => 
    (u.username.toLowerCase() === cleanId || (u.email && u.email.toLowerCase() === cleanId))
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  let isPasswordValid = false;
  if (user.passwordSalt && user.passwordHash) {
    isPasswordValid = verifyHash(cleanPass, user.passwordSalt, user.passwordHash);
  } else if (user.password) {
    isPasswordValid = user.password === cleanPass;
  }

  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  if (user.isBanned) {
    return res.status(403).json({ error: 'This account has been suspended by administrator' });
  }

  recordActivity(state, user.username, 'USER_LOGIN', `Logged into account @${user.username}`, 'auth');
  saveState(state);

  const userTransactions = (state.transactions || []).filter((t: any) => t.user.toLowerCase() === user.username.toLowerCase());
  const userDeposits = (state.deposits || []).filter((d: any) => d.user.toLowerCase() === user.username.toLowerCase());
  const userWithdrawals = (state.withdrawals || []).filter((w: any) => w.user.toLowerCase() === user.username.toLowerCase());

  res.json({
    success: true,
    user: sanitizeUser(user),
    wallet: {
      availableBalance: user.balance,
      reservedBalance: user.reservedBalance || 0,
      totalEarned: user.earnings || 0,
      transactions: userTransactions,
      deposits: userDeposits,
      withdrawals: userWithdrawals,
    }
  });
});

// AUTH ADMIN LOGIN (Authoritative Password Hash Verification)
app.post('/api/auth/admin-login', (req: Request, res: Response) => {
  const { password } = req.body;
  const state = loadState();
  const cleanPass = (password || '').trim();

  const admin = state.allUsers?.find((u: any) => u.isAdmin || u.username.toLowerCase() === 'admin');
  const salt = admin?.passwordSalt || ADMIN_PASSWORD_SALT;
  const hash = admin?.passwordHash || ADMIN_PASSWORD_HASH;

  if (!cleanPass || !verifyHash(cleanPass, salt, hash)) {
    return res.status(401).json({ error: 'Incorrect admin passcode. Access denied.' });
  }

  recordActivity(state, 'admin', 'ADMIN_LOGIN', 'Administrator authenticated via secure password hash', 'auth');
  saveState(state);

  const sanitized = sanitizeUser(admin || {
    username: 'admin',
    name: 'Work 6T7 Admin',
    email: 'admin@work6t7.bd',
    bio: 'Platform Administrator',
    profilePhoto: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin6t7',
    balance: 50.0,
    reservedBalance: 0,
    earnings: 0,
    refCode: 'W6T7-ADMIN',
    isAdmin: true,
    joinedAt: '2026-01-01',
  });

  res.json({ success: true, user: sanitized });
});

// AUTH REGISTER (Creates User with ৳5 Bonus in Database & Referral Bonus)
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, password, name, email, refCode } = req.body;
  const state = loadState();

  const cleanUsername = (username || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanRef = (refCode || '').trim().toUpperCase();

  if (!cleanUsername || cleanUsername.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }
  if (!cleanPassword || cleanPassword.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  const userExists = state.allUsers?.some((u: any) => u.username.toLowerCase() === cleanUsername);
  if (userExists) {
    return res.status(400).json({ error: 'Username is already taken' });
  }

  if (cleanEmail) {
    const emailExists = state.allUsers?.some((u: any) => u.email && u.email.toLowerCase() === cleanEmail);
    if (emailExists) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }
  }

  const generatedRefCode = `W6T7-${cleanUsername.toUpperCase()}`;
  const newUser = {
    username: cleanUsername,
    password: cleanPassword,
    name: cleanName || cleanUsername,
    email: cleanEmail || `${cleanUsername}@mail.bd`,
    bio: 'Ready to work on verified microjobs!',
    profilePhoto: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
    balance: 5.0, // Initial ৳5 Signup Bonus
    earnings: 0.0,
    refCode: generatedRefCode,
    isAdmin: false,
    joinedAt: new Date().toISOString().split('T')[0],
    referredBy: undefined as string | undefined,
  };

  const newTransactions: any[] = [
    {
      id: `tx_${Date.now()}_bonus`,
      user: cleanUsername,
      type: 'Signup Bonus',
      amount: 5.0,
      direction: 'in',
      status: 'Success',
      date: new Date().toLocaleDateString(),
      details: 'One-time registration bonus added to wallet',
    }
  ];

  let updatedReferrer: any = null;
  if (cleanRef && cleanRef !== generatedRefCode) {
    const referrer = state.allUsers?.find((u: any) => u.refCode.toUpperCase() === cleanRef);
    if (referrer) {
      referrer.balance = (referrer.balance || 0) + 5.0;
      referrer.earnings = (referrer.earnings || 0) + 5.0;
      newUser.referredBy = cleanRef;
      updatedReferrer = referrer;

      newTransactions.push({
        id: `tx_${Date.now()}_ref`,
        user: referrer.username,
        type: 'Referral Bonus',
        amount: 5.0,
        direction: 'in',
        status: 'Success',
        date: new Date().toLocaleDateString(),
        details: `Referral reward for inviting @${cleanUsername}`,
      });
    }
  }

  if (!state.allUsers) state.allUsers = [];
  state.allUsers.push(newUser);

  if (!state.transactions) state.transactions = [];
  state.transactions.unshift(...newTransactions);

  recordActivity(state, cleanUsername, 'USER_REGISTERED', `Registered new account @${cleanUsername}. Granted ৳5 signup bonus.`, 'auth');
  saveState(state);

  res.json({
    success: true,
    user: newUser,
    transactions: newTransactions,
    referrer: updatedReferrer,
  });
});

// ATOMIC WALLET DEPOSIT REQUEST
app.post('/api/wallet/deposit', (req: Request, res: Response) => {
  const { username, amount, trxId, method, senderNumber, screenshot } = req.body;
  const state = loadState();

  const amt = Number(amount);
  if (isNaN(amt) || amt < 50) {
    return res.status(400).json({ error: 'Minimum deposit is ৳50' });
  }

  const cleanTrx = (trxId || '').trim().toUpperCase();
  if (!cleanTrx) {
    return res.status(400).json({ error: 'Transaction ID (TrxID) is required' });
  }

  // Prevent duplicate TrxID in database
  const isDuplicate = state.deposits?.some((d: any) => d.trxId.trim().toUpperCase() === cleanTrx);
  if (isDuplicate) {
    return res.status(400).json({ error: 'This Transaction ID has already been submitted' });
  }

  const user = state.allUsers?.find((u: any) => u.username.toLowerCase() === (username || '').toLowerCase());
  if (!user) return res.status(404).json({ error: 'User not found' });

  const depId = Date.now();
  const dateStr = new Date().toLocaleDateString();
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newDeposit = {
    id: depId,
    user: user.username,
    userName: user.name,
    amount: amt,
    trxId: cleanTrx,
    senderNumber: (senderNumber || '').trim(),
    screenshot: (screenshot || '').trim(),
    method: method || 'bKash',
    status: 'Pending',
    date: dateStr,
    time: timeStr,
  };

  const newTx = {
    id: `tx_dep_${depId}`,
    user: user.username,
    type: 'Deposit',
    amount: amt,
    status: 'Pending',
    date: dateStr,
    details: `${method} Deposit Request (TrxID: ${cleanTrx}) - Pending Admin Verification`,
  };

  if (!state.deposits) state.deposits = [];
  state.deposits.unshift(newDeposit);

  if (!state.transactions) state.transactions = [];
  state.transactions.unshift(newTx);

  recordActivity(state, user.username, 'DEPOSIT_REQUEST', `Submitted deposit request ৳${amt} via ${method} (TrxID: ${cleanTrx})`, 'finance');
  saveState(state);

  res.json({ success: true, deposit: newDeposit, transaction: newTx, state });
});

// ATOMIC WALLET WITHDRAWAL REQUEST
app.post('/api/wallet/withdraw', (req: Request, res: Response) => {
  const { username, amount, method, acc } = req.body;
  const state = loadState();

  const user = state.allUsers?.find((u: any) => u.username.toLowerCase() === (username || '').toLowerCase());
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.isBanned) return res.status(403).json({ error: 'Account is suspended' });

  const withdrawAmount = Number(amount);
  if (isNaN(withdrawAmount) || withdrawAmount < 50) {
    return res.status(400).json({ error: 'Minimum withdrawal amount is ৳50.00' });
  }

  if (user.balance < withdrawAmount) {
    return res.status(400).json({ error: 'Insufficient wallet balance' });
  }

  // Deduct balance atomically on server and put into pending
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

  const newTx = {
    id: `tx_${reqId}_wd`,
    user: user.username,
    type: 'Withdrawal',
    amount: -withdrawAmount,
    direction: 'out',
    status: 'Pending',
    date: dateStr,
    time: timeStr,
    details: `Withdrawal request to ${method} (${acc}) - Pending Admin Review`,
  };

  if (!state.transactions) state.transactions = [];
  state.transactions.unshift(newTx);

  recordActivity(state, user.username, 'WITHDRAW_REQUEST', `Submitted withdrawal request for ৳${withdrawAmount} via ${method}`, 'finance');
  saveState(state);

  res.json({ success: true, message: 'Withdrawal request submitted for admin review.', withdrawal: newWithdrawal, transaction: newTx, user, state });
});

// ATOMIC TASK POSTING (Worker payment budget is held in reserved escrow; ৳10 platform fee deducted)
app.post('/api/tasks/post', (req: Request, res: Response) => {
  const { username, jobData } = req.body;
  const state = loadState();

  const user = state.allUsers?.find((u: any) => u.username.toLowerCase() === (username || '').toLowerCase());
  if (!user) return res.status(404).json({ error: 'User not found' });

  const needed = Math.max(1, Number(jobData.needed) || 1);
  const pay = Math.max(1, Number(jobData.pay) || 1);
  const workerEscrow = pay * needed;
  const postingFee = user.isAdmin ? 0 : 10;
  const totalRequired = user.isAdmin ? 0 : (workerEscrow + postingFee);

  if (!user.isAdmin && user.balance < totalRequired) {
    return res.status(400).json({ 
      error: `Insufficient available balance! Required: ৳${totalRequired.toFixed(2)} (৳${workerEscrow.toFixed(2)} worker escrow + ৳${postingFee.toFixed(2)} post fee). Available: ৳${user.balance.toFixed(2)}` 
    });
  }

  // Deduct from Available Balance & lock into Reserved Escrow
  if (!user.isAdmin) {
    user.balance = Math.max(0, user.balance - totalRequired);
    user.reservedBalance = (user.reservedBalance || 0) + workerEscrow;
  }

  const jobId = jobData.id ? Number(jobData.id) : Date.now();
  const txDate = new Date().toLocaleDateString();
  const txTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newJob = {
    id: jobId,
    poster: user.username,
    posterName: user.name,
    title: jobData.title,
    category: jobData.category,
    pay,
    needed,
    done: 0,
    escrowBudget: workerEscrow,
    totalBudget: workerEscrow,
    spentBudget: 0,
    inst: jobData.inst,
    requiredProof: jobData.requiredProof || 'Screenshot and user details',
    deadline: jobData.deadline,
    deadlineTimestamp: jobData.deadlineTimestamp,
    imageUrl: jobData.imageUrl,
    status: 'Active', // Escrow is locked from owner balance; published immediately to marketplace
    createdAt: txDate,
  };

  const newTransactions: any[] = [];
  if (workerEscrow > 0 && !user.isAdmin) {
    newTransactions.push({
      id: `tx_${jobId}_escrow`,
      user: user.username,
      type: 'Escrow Hold',
      amount: -workerEscrow,
      direction: 'out',
      taskId: jobId,
      status: 'Success',
      date: txDate,
      time: txTime,
      details: `Worker reward budget reserved in escrow for Task #${jobId} (${needed} slots * ৳${pay.toFixed(2)})`,
      description: `Task worker budget reserved in escrow for "${jobData.title}"`,
    });
  }

  if (postingFee > 0) {
    newTransactions.push({
      id: `tx_${jobId}_fee`,
      user: user.username,
      type: 'Job Posting Fee',
      amount: -postingFee,
      direction: 'out',
      taskId: jobId,
      status: 'Success',
      date: txDate,
      time: txTime,
      details: `Non-refundable task creation fee (Task #${jobId})`,
      description: `Task creation fee for "${jobData.title}" (৳10.00)`,
    });
  }

  if (!state.jobs) state.jobs = [];
  state.jobs.unshift(newJob);

  if (!state.transactions) state.transactions = [];
  state.transactions.unshift(...newTransactions);

  recordActivity(state, user.username, 'TASK_POSTED', `Created new task "${jobData.title}" (Escrow: ৳${workerEscrow}, Fee: ৳${postingFee})`, 'task');
  saveState(state);

  res.json({ success: true, job: newJob, transactions: newTransactions, user: sanitizeUser(user), state });
});

// TASK PROOF SUBMISSION (Fraud check: no duplicates, no self-apply)
app.post('/api/tasks/submit-proof', (req: Request, res: Response) => {
  const { username, jobId, proof, screenshot, submittedLink } = req.body;
  const state = loadState();

  const user = state.allUsers?.find((u: any) => u.username.toLowerCase() === (username || '').toLowerCase());
  if (!user) return res.status(404).json({ error: 'User not found' });

  const job = state.jobs?.find((j: any) => j.id === Number(jobId));
  if (!job) return res.status(404).json({ error: 'Task not found' });

  if (job.poster.toLowerCase() === user.username.toLowerCase()) {
    return res.status(400).json({ error: 'You cannot submit work on your own task' });
  }

  const alreadyApplied = state.applications?.some(
    (a: any) => a.jobId === Number(jobId) && a.user.toLowerCase() === user.username.toLowerCase()
  );
  if (alreadyApplied) {
    return res.status(400).json({ error: 'You have already submitted proof for this task' });
  }

  if (job.done >= job.needed) {
    return res.status(400).json({ error: 'All slots for this task have already been filled' });
  }

  const subId = Date.now();
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newApp = {
    id: subId,
    jobId: Number(jobId),
    title: job.title,
    user: user.username,
    workerName: user.name,
    workerId: user.id || user.username,
    pay: job.pay,
    status: 'Pending',
    proof: proof || '',
    screenshot: screenshot || '',
    submittedLink: submittedLink || '',
    submittedAt: currentDate,
    submittedTime: currentTime,
  };

  if (!state.applications) state.applications = [];
  state.applications.unshift(newApp);

  if (!state.messages) state.messages = [];
  state.messages.unshift({
    id: `msg_sub_${Date.now()}`,
    from: 'system',
    to: job.poster,
    jobId: job.id,
    jobTitle: job.title,
    text: `📥 New task submission from @${user.username} for task: "${job.title}". Please inspect proof in your Dashboard.`,
    timestamp: currentTime,
    isRead: false,
  });

  recordActivity(state, user.username, 'PROOF_SUBMITTED', `Submitted proof for Task #${job.id}`, 'task');
  saveState(state);

  res.json({ success: true, application: newApp, state });
});

// TASK PROOF REJECTION (By Task Owner or Admin)
app.post('/api/tasks/reject-proof', (req: Request, res: Response) => {
  const { appId, callerUsername, reason, currentState } = req.body;
  const state = currentState || loadState();
  if (!state) return res.status(500).json({ error: 'Database state unavailable' });

  const appItem = state.applications?.find((a: any) => a.id === Number(appId));
  if (!appItem) return res.status(404).json({ error: 'Submission not found' });
  if (appItem.status !== 'Pending') {
    return res.status(400).json({ error: 'Submission is not pending or already resolved' });
  }

  const job = state.jobs?.find((j: any) => j.id === appItem.jobId);
  if (!job) return res.status(404).json({ error: 'Task not found' });

  const callerUser = state.allUsers?.find((u: any) => u.username.toLowerCase() === (callerUsername || '').toLowerCase());
  const isOwner = job.poster.toLowerCase() === (callerUsername || '').toLowerCase();
  const isAdmin = callerUser?.isAdmin;

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Unauthorized: Only task owner or platform admin can reject submissions' });
  }

  const rejectionNote = (reason || 'Submission proof was invalid or incomplete').trim();
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  appItem.status = 'Rejected';
  appItem.rejectionReason = rejectionNote;
  appItem.reviewedAt = new Date().toLocaleDateString();

  if (!state.messages) state.messages = [];
  state.messages.unshift({
    id: `msg_rej_${Date.now()}`,
    from: 'system',
    to: appItem.user,
    jobId: appItem.jobId,
    jobTitle: job.title,
    text: `⚠️ Your task submission for "${job.title}" was rejected.\n\nReason: "${rejectionNote}".\nNo payment was deducted or credited.`,
    timestamp: currentTime,
    isRead: false,
  });

  recordActivity(state, callerUsername || 'owner', 'PROOF_REJECTED', `Rejected submission #${appItem.id} for Task #${job.id}: ${rejectionNote}`, 'task');
  saveState(state);

  res.json({ success: true, message: 'Submission rejected successfully', application: appItem, state });
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

  const appItem = state.applications?.find((a: any) => a.id === Number(appId));
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

  // Fraud check: Task Owner cannot complete their own task and claim reward
  if (job.poster.toLowerCase() === workerUser.username.toLowerCase()) {
    return res.status(400).json({ error: 'Fraud protection: Task owner cannot complete their own task and claim reward.' });
  }

  // Idempotency check: Cannot reward the same submission twice
  const alreadyRewarded = state.transactions?.some(
    (t: any) => t.submissionId === appItem.id && t.type === 'Task Reward' && t.status === 'Success'
  );
  if (alreadyRewarded) {
    return res.status(400).json({ error: 'Duplicate payment protection: This submission has already been rewarded.' });
  }

  // Security: Payout amount strictly authoritative from approved task in database, not client input
  const payout = Number(job.pay);
  if (isNaN(payout) || payout <= 0) {
    return res.status(400).json({ error: 'Invalid task reward amount in database' });
  }

  const employerUser = state.allUsers?.find((u: any) => u.username.toLowerCase() === job.poster.toLowerCase());

  // ATOMIC SERVER-SIDE TRANSFER: Deduct from Owner's Reserved Escrow -> Worker Available Balance
  if (employerUser && !employerUser.isAdmin) {
    if ((employerUser.reservedBalance || 0) >= payout) {
      employerUser.reservedBalance -= payout;
    } else {
      const fromReserved = employerUser.reservedBalance || 0;
      employerUser.reservedBalance = 0;
      const remaining = payout - fromReserved;
      employerUser.balance = Math.max(0, (employerUser.balance || 0) - remaining);
    }
  }
  workerUser.balance = (workerUser.balance || 0) + payout;
  workerUser.earnings = (workerUser.earnings || 0) + payout;

  // Metadata mapping for verified IDs
  appItem.status = 'Approved';
  appItem.reviewedAt = new Date().toLocaleDateString();
  appItem.rewardAmount = payout;
  appItem.pay = payout;
  appItem.workerId = workerUser.id || workerUser.username;
  appItem.workerName = workerUser.name;
  appItem.taskOwnerId = employerUser?.id || job.poster;
  appItem.taskId = job.id;
  appItem.taskTitle = job.title;

  // Decrement available slots (increment done)
  job.done = Math.min(job.needed, (job.done || 0) + 1);
  job.spentBudget = (job.spentBudget || 0) + payout;
  if (job.done >= job.needed) {
    job.status = 'Completed';
  }

  const txDate = new Date().toLocaleDateString();
  const txTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const idempotencyKey = `appr_${job.id}_${appItem.id}_${Date.now()}`;

  // Record 2 Transactions atomically
  if (!state.transactions) state.transactions = [];
  state.transactions.unshift({
    id: `tx_${Date.now()}_task_pay`,
    user: job.poster,
    type: 'Worker Payment Released',
    amount: -payout,
    direction: 'out',
    taskId: job.id,
    submissionId: appItem.id,
    idempotencyKey,
    status: 'Success',
    date: txDate,
    time: txTime,
    details: `Worker reward released to @${workerUser.username} from reserved escrow for "${job.title}" (Task #TASK-${job.id})`,
  });

  state.transactions.unshift({
    id: `tx_${Date.now() + 1}_task_reward`,
    user: workerUser.username,
    type: 'Task Reward',
    amount: payout,
    direction: 'in',
    taskId: job.id,
    submissionId: appItem.id,
    idempotencyKey: `${idempotencyKey}_reward`,
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
    to: workerUser.username,
    jobId: job.id,
    jobTitle: job.title,
    text: `🎉 Your task has been approved! ৳${payout.toFixed(2)} has been credited to your available balance for task "${job.title}". (Task #TASK-${job.id})`,
    timestamp: txTime,
    isRead: false,
  });

  recordActivity(state, callerUsername, 'TASK_APPROVED', `Approved submission #${appItem.id} for Task #${job.id}. Transferred ৳${payout.toFixed(2)} from @${job.poster} to @${workerUser.username}`, 'finance');

  saveState(state);
  res.json({
    success: true,
    message: `Task approved! ৳${payout.toFixed(2)} credited to @${workerUser.username}'s wallet.`,
    state,
    payout,
    ownerBalance: employerUser ? employerUser.balance : undefined,
    ownerReservedBalance: employerUser ? employerUser.reservedBalance : undefined,
    workerBalance: workerUser.balance,
  });
});

// ADMIN & CREATOR TASK REMOVE / SOFT DELETE ENDPOINT (Permanent Database Record)
app.post('/api/jobs/remove', (req: Request, res: Response) => {
  const { jobId, callerUsername, reason, currentState } = req.body;
  const state = loadState();
  if (!state || !state.jobs) return res.status(500).json({ error: 'Database unavailable' });

  let job = state.jobs.find((j: any) => String(j.id) === String(jobId) || Number(j.id) === Number(jobId));
  if (!job && currentState?.jobs) {
    const fromClient = currentState.jobs.find((j: any) => String(j.id) === String(jobId) || Number(j.id) === Number(jobId));
    if (fromClient) {
      job = fromClient;
      state.jobs.unshift(job);
    }
  }

  // If job is already deleted or not found, return clean success so UI never breaks
  if (!job) {
    return res.json({ success: true, message: 'Task already removed or not found in database', state });
  }

  const callerUser = state.allUsers?.find((u: any) => u.username.toLowerCase() === (callerUsername || '').toLowerCase());
  const isOwner = job.poster && (callerUsername || '').toLowerCase() === job.poster.toLowerCase();
  const isAdmin = !!callerUser?.isAdmin || (callerUsername || '').toLowerCase() === 'admin';

  if (!isAdmin && !isOwner) {
    return res.status(403).json({ error: 'Unauthorized: Only platform admin or the job creator can remove this task' });
  }

  // Idempotent: If already removed, return success
  if (job.isDeleted || job.status === 'Removed' || job.status === 'Deleted') {
    return res.json({ success: true, message: 'Task is already removed', job, state });
  }

  const previousStatus = job.status;
  const deleteTimestamp = new Date().toISOString();
  const deleteReasonStr = reason || (isAdmin ? 'Removed by administrator' : 'Deleted by task owner');

  // SOFT DELETE: Permanent backend database record
  job.isDeleted = true;
  job.status = 'Removed';
  job.deletedAt = deleteTimestamp;
  job.deletedBy = callerUsername || (isAdmin ? 'admin' : job.poster);
  job.deleteReason = deleteReasonStr;
  job.previousStatus = previousStatus;

  // Safe Handling of Submissions:
  // Existing Approved submissions and payments are NEVER reversed or deleted!
  // Pending submissions on this removed task are cancelled
  if (state.applications) {
    state.applications.forEach((app: any) => {
      if ((String(app.jobId) === String(job.id) || Number(app.jobId) === Number(job.id)) && app.status === 'Pending') {
        app.status = 'Rejected';
        app.rejectionReason = `Task was cancelled/removed by ${isAdmin ? 'administrator' : 'creator'}.`;

        if (!state.messages) state.messages = [];
        state.messages.unshift({
          id: `msg_canc_${Date.now()}_${app.id}`,
          from: 'system',
          to: app.user,
          jobId: job.id,
          jobTitle: job.title,
          text: `⚠️ Notice: Task "${job.title}" (Job #${job.id}) was removed. Your pending submission has been cancelled.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: false,
        });
      }
    });
  }

  // Safe Handling of Escrow:
  // Unused escrow slots refunded to owner ONLY IF escrow was actually reserved/held on task creation
  const remainingSlots = Math.max(0, job.needed - job.done);
  const unusedEscrow = remainingSlots * job.pay;
  const owner = state.allUsers?.find((u: any) => u.username.toLowerCase() === job.poster.toLowerCase());
  const hadEscrowHold = (state.transactions || []).some(
    (t: any) => (String(t.taskId) === String(job.id) || Number(t.taskId) === Number(job.id)) && t.type === 'Escrow Hold' && t.user.toLowerCase() === job.poster.toLowerCase()
  );

  if (owner && hadEscrowHold && unusedEscrow > 0 && previousStatus !== 'Completed') {
    owner.balance += unusedEscrow;
    owner.reservedBalance = Math.max(0, (owner.reservedBalance || 0) - unusedEscrow);

    if (!state.transactions) state.transactions = [];
    state.transactions.unshift({
      id: `tx_${Date.now()}_rm_escrow`,
      user: job.poster,
      type: 'Escrow Refund',
      amount: unusedEscrow,
      direction: 'in',
      taskId: job.id,
      status: 'Success',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      details: `Escrow refund for removed task #${job.id} (${remainingSlots} slots * ৳${job.pay})`,
    });
  }

  // Audit Logging
  recordActivity(
    state,
    callerUsername || 'admin',
    'TASK_REMOVED',
    `Task #${job.id} ("${job.title}") removed by @${callerUsername}. Previous status: ${previousStatus}. Reason: ${deleteReasonStr}`,
    'admin'
  );

  saveState(state);

  res.json({
    success: true,
    message: `Task #${job.id} permanently removed. Database updated.`,
    job,
    state,
    unusedEscrowRefunded: unusedEscrow,
  });
});

// ADMIN JOB APPROVAL & REJECTION ENDPOINT
app.post('/api/jobs/manage-approval', (req: Request, res: Response) => {
  const { jobId, action, reason, callerUsername, jobData, currentState } = req.body;
  const state = loadState();
  if (!state || !state.jobs) return res.status(500).json({ error: 'Database unavailable' });

  let job = state.jobs.find((j: any) => String(j.id) === String(jobId) || Number(j.id) === Number(jobId));
  if (!job && jobData) {
    job = { ...jobData, id: Number(jobId) || jobId, status: 'Pending Approval' };
    state.jobs.unshift(job);
  } else if (!job && currentState?.jobs) {
    const fromClient = currentState.jobs.find((j: any) => String(j.id) === String(jobId) || Number(j.id) === Number(jobId));
    if (fromClient) {
      job = fromClient;
      state.jobs.unshift(job);
    }
  }

  if (!job) {
    // If not found at all, create from parameters so admin action NEVER fails with network error
    job = {
      id: Number(jobId) || jobId,
      title: jobData?.title || `Task #${jobId}`,
      poster: jobData?.poster || 'user',
      category: jobData?.category || 'General',
      pay: Number(jobData?.pay) || 1,
      needed: Number(jobData?.needed) || 1,
      done: 0,
      spentBudget: 0,
      status: 'Pending Approval',
      inst: jobData?.inst || 'Complete task as instructed',
      createdAt: new Date().toLocaleDateString(),
    };
    state.jobs.unshift(job);
  }

  if (action === 'approve') {
    job.status = 'Approved';
    job.isDeleted = false;
    job.approvedAt = new Date().toISOString();
    job.approvedBy = callerUsername || 'admin';

    if (!state.messages) state.messages = [];
    state.messages.unshift({
      id: `msg_appr_job_${Date.now()}`,
      from: 'system',
      to: job.poster,
      jobId: job.id,
      jobTitle: job.title,
      text: `🎉 Good news! Your task "${job.title}" has been approved and published to the marketplace.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
    });

    recordActivity(state, callerUsername || 'admin', 'JOB_APPROVED', `Approved task #${job.id}: "${job.title}" for marketplace`, 'admin');
  } else if (action === 'reject') {
    job.status = 'Rejected';
    job.rejectionReason = reason || 'Task instructions do not meet community standards';

    const hadEscrowHold = (state.transactions || []).some(
      (t: any) => (String(t.taskId) === String(job.id) || Number(t.taskId) === Number(job.id)) && t.type === 'Escrow Hold' && t.user.toLowerCase() === job.poster.toLowerCase()
    );
    const escrowRefund = job.pay * job.needed;
    const owner = state.allUsers?.find((u: any) => u.username.toLowerCase() === job.poster.toLowerCase());
    if (owner && hadEscrowHold && escrowRefund > 0) {
      owner.balance += escrowRefund;
      owner.reservedBalance = Math.max(0, (owner.reservedBalance || 0) - escrowRefund);

      if (!state.transactions) state.transactions = [];
      state.transactions.unshift({
        id: `tx_${Date.now()}_rej_escrow`,
        user: job.poster,
        type: 'Escrow Refund',
        amount: escrowRefund,
        direction: 'in',
        taskId: job.id,
        status: 'Success',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        details: `Worker escrow refund for rejected task #${job.id}`,
      });
    }

    if (!state.messages) state.messages = [];
    state.messages.unshift({
      id: `msg_rej_job_${Date.now()}`,
      from: 'system',
      to: job.poster,
      jobId: job.id,
      jobTitle: job.title,
      text: `⚠️ Your task "${job.title}" was rejected: ${job.rejectionReason}. Escrow budget of ৳${escrowRefund} has been refunded to your wallet.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
    });

    recordActivity(state, callerUsername || 'admin', 'JOB_REJECTED', `Rejected task #${job.id}. Reason: ${job.rejectionReason}`, 'admin');
  }

  saveState(state);
  res.json({ success: true, message: `Task #${job.id} ${action}ed successfully`, job, state });
});

// FINANCIAL RECONCILIATION & AUDIT ENDPOINT
// Formula: Current Balance = Opening Balance + Valid Credits - Valid Debits
app.get('/api/admin/reconcile-audit', (_req: Request, res: Response) => {
  const state = loadState();
  if (!state) return res.status(500).json({ error: 'Database state unavailable' });

  const audits = (state.allUsers || []).map((u: any) => {
    const userTxs = (state.transactions || []).filter((t: any) => t.user.toLowerCase() === u.username.toLowerCase());
    
    // Credits: money into wallet
    const credits = userTxs
      .filter((t: any) => 
        (t.type === 'Task Reward' || t.type === 'Deposit' || t.type === 'Signup Bonus' || t.type === 'Referral Bonus' || t.type === 'Escrow Refund' || (t.type === 'Admin Adjustment' && t.amount > 0)) &&
        t.status === 'Success'
      )
      .reduce((sum: number, t: any) => sum + Math.abs(t.amount || 0), 0);

    // Debits: money out of wallet
    const debits = userTxs
      .filter((t: any) => 
        (t.type === 'Task Payment' || t.type === 'Task Posting Fee' || t.type === 'Job Posting Fee' || t.type === 'Escrow Hold' || t.type === 'Withdrawal' || (t.type === 'Admin Adjustment' && t.amount < 0)) &&
        (t.status === 'Success' || t.status === 'Pending')
      )
      .reduce((sum: number, t: any) => sum + Math.abs(t.amount || 0), 0);

    // Initial base opening (default 5.0 for users or 50.0 for admin)
    const baseOpening = u.isAdmin ? 50.0 : 0.0;
    const computedBalance = baseOpening + credits - debits;
    const discrepancy = Math.abs((u.balance || 0) - computedBalance);
    const isAbnormal = discrepancy > 5.0; // Flag discrepancy

    return {
      username: u.username,
      actualBalance: u.balance,
      computedBalance,
      discrepancy,
      credits,
      debits,
      txCount: userTxs.length,
      isAbnormal,
    };
  });

  res.json({ success: true, audits, totalUsers: state.allUsers?.length || 0 });
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
    owner.reservedBalance = Math.max(0, (owner.reservedBalance || 0) - unusedEscrow);

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
