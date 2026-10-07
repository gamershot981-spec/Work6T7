import { AppState, User, Job } from './types';

export const STORAGE_KEY = 'w6t7_db';
export const DEFAULT_DEPOSIT_NUMBER = '01774922356';

const defaultUsers: User[] = [
  {
    username: 'admin',
    password: 'work6t7admin87358#45#$6@',
    name: 'Work 6T7 Admin',
    email: 'admin@work6t7.bd',
    bio: 'Platform Administrator & Quality Assurance',
    profilePhoto: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin6t7',
    balance: 50.0,
    earnings: 0,
    refCode: 'W6T7-ADMIN',
    isAdmin: true,
    joinedAt: '2026-01-01',
  },
];

const defaultJobs: Job[] = [
  {
    id: 1,
    poster: 'admin',
    posterName: 'Work 6T7 Official',
    title: 'Subscribe to YouTube Channel & Watch 1 Min',
    category: 'YouTube',
    pay: 5.0,
    needed: 100,
    done: 24,
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
    inst: '1. Search for "Work 6T7 Community" on Facebook/Telegram.\n2. Answer the membership question with your username.\n3. Submit your profile link or screenshot as proof.',
    status: 'Approved',
    createdAt: '2026-03-12',
  },
];

export function getInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.allUsers)) {
        // Filter out legacy demo users (tanvir_dev, digitalagent)
        const cleanedUsers = parsed.allUsers
          .filter((u: User) => u.username !== 'tanvir_dev' && u.username !== 'digitalagent')
          .map((u: User) => {
            // Strictly preserve user balance and earnings from database/storage
            return {
              ...u,
              balance: typeof u.balance === 'number' ? u.balance : 5.0,
              earnings: typeof u.earnings === 'number' ? u.earnings : 0,
            };
          });

        // Ensure admin user is always present with the updated secret passcode
        const adminIdx = cleanedUsers.findIndex((u: User) => u.isAdmin || u.username === 'admin');
        if (adminIdx !== -1) {
          cleanedUsers[adminIdx] = {
            ...cleanedUsers[adminIdx],
            password: 'work6t7admin87358#45#$6@',
          };
        } else {
          cleanedUsers.unshift(defaultUsers[0]);
        }

        // If current logged-in user was a demo user, log out; otherwise keep exact state
        let currentUser = parsed.user;
        if (currentUser && (currentUser.username === 'tanvir_dev' || currentUser.username === 'digitalagent')) {
          currentUser = null;
        } else if (currentUser) {
          // Sync currentUser with their authoritative entry in cleanedUsers
          const found = cleanedUsers.find((u: User) => u.username.toLowerCase() === currentUser.username.toLowerCase());
          if (found) {
            currentUser = { ...found };
          }
        }

        return {
          user: currentUser,
          allUsers: cleanedUsers,
          jobs: parsed.jobs || defaultJobs,
          applications: parsed.applications || [],
          transactions: parsed.transactions || [],
          deposits: parsed.deposits || [],
          withdrawals: parsed.withdrawals || [],
          tickets: parsed.tickets || [],
          disputes: parsed.disputes || [],
          activityLogs: parsed.activityLogs || [
            {
              id: 'log_init_1',
              timestamp: '2026-03-15 10:00 AM',
              user: 'system',
              action: 'SYSTEM_BOOT',
              details: 'Secure Financial Engine initialized. Escrow protection active.',
              category: 'admin',
            }
          ],
          messages: parsed.messages || [],
          depositNumber: parsed.depositNumber || DEFAULT_DEPOSIT_NUMBER,
          maintenanceMode: !!parsed.maintenanceMode,
          maintenanceMessage: parsed.maintenanceMessage || 'Website is undergoing scheduled maintenance. We will be back shortly!',
        };
      }
    }
  } catch (e) {
    console.error('Failed to parse state from localStorage', e);
  }

  const initialState: AppState = {
    user: null, // Start clean, no forced demo user logged in
    allUsers: defaultUsers,
    jobs: defaultJobs,
    applications: [],
    transactions: [],
    deposits: [],
    withdrawals: [],
    tickets: [],
    disputes: [],
    activityLogs: [
      {
        id: 'log_init_1',
        timestamp: '2026-03-15 10:00 AM',
        user: 'system',
        action: 'SYSTEM_BOOT',
        details: 'Secure Financial Engine initialized. Escrow protection active.',
        category: 'admin',
      }
    ],
    messages: [],
    depositNumber: DEFAULT_DEPOSIT_NUMBER,
    maintenanceMode: false,
    maintenanceMessage: 'Website is undergoing scheduled maintenance. We will be back shortly!',
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
  return initialState;
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage', err);
  }
}
