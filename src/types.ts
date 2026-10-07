export interface User {
  id?: string | number;
  username: string;
  password?: string;
  name: string;
  email?: string;
  phone?: string;
  bio?: string;
  profilePhoto?: string;
  balance: number;
  earnings: number;
  refCode: string;
  referredBy?: string;
  isAdmin: boolean;
  isBanned?: boolean;
  joinedAt: string;
  lastActive?: string;
  currentSection?: string;
}

export type JobStatus = 'Draft' | 'Pending Approval' | 'Active' | 'Approved' | 'Paused' | 'Disabled' | 'Completed' | 'Expired' | 'Cancelled' | 'Rejected' | 'Removed' | 'Deleted';

export interface Job {
  id: number;
  poster: string;
  posterName?: string;
  title: string;
  description?: string;
  category: string;
  pay: number;
  needed: number;
  done: number;
  inst: string;
  requiredProof?: string;
  deadline?: string;
  deadlineTimestamp?: number;
  imageUrl?: string;
  totalBudget?: number;
  spentBudget?: number;
  status: JobStatus;
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deleteReason?: string;
  previousStatus?: string;
}

export interface Application {
  id: number;
  jobId: number;
  taskId?: number;
  title: string;
  taskTitle?: string;
  user: string;
  workerName?: string;
  workerId?: string | number;
  taskOwnerId?: string;
  rewardAmount?: number;
  pay: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  proof: string;
  screenshot?: string;
  submittedLink?: string;
  submittedAt: string;
  submittedTime?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  idempotencyKey?: string;
}

export type TransactionType = 
  | 'Task Payment'
  | 'Task Reward' 
  | 'Task Budget Reserve' 
  | 'Task Budget Refund' 
  | 'Job Posting Fee' 
  | 'Task Posting Fee'
  | 'Escrow Hold'
  | 'Deposit' 
  | 'Withdrawal' 
  | 'Referral Bonus' 
  | 'Admin Adjustment' 
  | 'Signup Bonus' 
  | 'Escrow Refund' 
  | 'Job Payout';

export interface Transaction {
  id: string;
  userId?: string | number;
  user: string;
  type: TransactionType;
  amount: number;
  direction?: 'in' | 'out';
  taskId?: string | number;
  submissionId?: string | number;
  status: 'Success' | 'Pending' | 'Rejected' | 'Completed';
  date: string;
  time?: string;
  details?: string;
  description?: string;
  isFlagged?: boolean;
  flagReason?: string;
  idempotencyKey?: string;
  adminId?: string;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  jobId?: number;
  jobTitle?: string;
  text: string;
  imageUrl?: string;
  timestamp: string;
  isRead: boolean;
}

export type DepositStatus = 'Pending' | 'Approved' | 'Completed' | 'Rejected';

export interface DepositRequest {
  id: number;
  user: string;
  userName?: string;
  amount: number;
  trxId: string;
  senderNumber?: string;
  screenshot?: string;
  method: string;
  status: DepositStatus;
  rejectionReason?: string;
  date: string;
  time?: string;
}

export type WithdrawalStatus = 'Pending' | 'Approved' | 'Processing' | 'Paid' | 'Completed' | 'Rejected' | 'Cancelled';

export interface WithdrawalRequest {
  id: number;
  user: string;
  userName?: string;
  amount: number;
  acc: string;
  method: string;
  status: WithdrawalStatus;
  rejectionReason?: string;
  date: string;
  time?: string;
}

export interface SupportTicket {
  id: number;
  user: string;
  subject: string;
  category: string;
  message: string;
  status: 'Open' | 'Answered' | 'Closed';
  adminReply?: string;
  createdAt: string;
}

export interface Dispute {
  id: string;
  taskId: number;
  taskTitle: string;
  submissionId?: number;
  reporter: string;
  reportedUser: string;
  reason: string;
  details: string;
  proofAttachment?: string;
  status: 'Open' | 'Resolved - Worker Paid' | 'Resolved - Owner Refunded' | 'Dismissed';
  resolutionNote?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  category: 'auth' | 'task' | 'finance' | 'admin' | 'dispute';
}

export interface AppState {
  user: User | null;
  allUsers: User[];
  jobs: Job[];
  applications: Application[];
  transactions: Transaction[];
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
  tickets: SupportTicket[];
  disputes: Dispute[];
  activityLogs: ActivityLog[];
  messages: Message[];
  depositNumber: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
}
