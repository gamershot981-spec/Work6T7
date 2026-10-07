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
}

export type JobStatus = 'Pending Approval' | 'Approved' | 'Rejected' | 'Completed';

export interface Job {
  id: number;
  poster: string;
  posterName?: string;
  title: string;
  category: string;
  pay: number;
  needed: number;
  done: number;
  inst: string;
  status: JobStatus;
  rejectionReason?: string;
  createdAt: string;
}

export interface Application {
  id: number;
  jobId: number;
  title: string;
  user: string;
  pay: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  proof: string;
  submittedAt: string;
  feedback?: string;
}

export interface Transaction {
  id: string;
  user: string;
  type: 'Signup Bonus' | 'Referral Bonus' | 'Job Posting Fee' | 'Job Escrow Budget' | 'Job Payout' | 'Deposit' | 'Withdrawal' | 'Escrow Refund';
  amount: number;
  status: 'Success' | 'Pending' | 'Rejected';
  date: string;
  details?: string;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  jobId?: number;
  jobTitle?: string;
  text: string;
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

export interface AppState {
  user: User | null;
  allUsers: User[];
  jobs: Job[];
  applications: Application[];
  transactions: Transaction[];
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
  tickets: SupportTicket[];
  messages: Message[];
  depositNumber: string;
}
