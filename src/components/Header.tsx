import React from 'react';
import { User } from '../types';
import { 
  Briefcase, 
  Wallet, 
  MessageSquare, 
  User as UserIcon, 
  ShieldCheck, 
  LogOut, 
  PlusCircle, 
  Home
} from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser: User | null;
  unreadCount: number;
  onOpenAuth: (mode: 'login' | 'register' | 'admin') => void;
  onOpenProfile: () => void;
  onOpenPostJob: () => void;
  onOpenInbox: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  currentUser,
  unreadCount,
  onOpenAuth,
  onOpenProfile,
  onOpenPostJob,
  onOpenInbox,
  onLogout,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => onNavigate('home')} 
          className="flex items-center space-x-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-600 group-hover:bg-indigo-700 text-white font-extrabold text-lg flex items-center justify-center shadow-xs transition-colors">
            6T7
          </div>
          <div>
            <div className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
              Work <span className="text-indigo-600">6T7</span>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
              Bangladesh Microjobs
            </span>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-7 text-sm font-medium text-slate-600">
          <button 
            onClick={() => onNavigate('home')} 
            className={`transition-colors flex items-center gap-1.5 ${currentView === 'home' ? 'text-indigo-600 font-semibold' : 'hover:text-slate-900'}`}
          >
            <Home className="w-4 h-4" />
            Home
          </button>
          <button 
            onClick={() => onNavigate('jobs')} 
            className={`transition-colors flex items-center gap-1.5 ${currentView === 'jobs' ? 'text-indigo-600 font-semibold' : 'hover:text-slate-900'}`}
          >
            <Briefcase className="w-4 h-4" />
            Marketplace
          </button>
          <button 
            onClick={() => onNavigate('dashboard')} 
            className={`transition-colors flex items-center gap-1.5 ${currentView === 'dashboard' ? 'text-indigo-600 font-semibold' : 'hover:text-slate-900'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => onNavigate('wallet')} 
            className={`transition-colors flex items-center gap-1.5 ${currentView === 'wallet' ? 'text-indigo-600 font-semibold' : 'hover:text-slate-900'}`}
          >
            <Wallet className="w-4 h-4" />
            Wallet
          </button>
          <button 
            onClick={() => onNavigate('support')} 
            className={`transition-colors ${currentView === 'support' ? 'text-indigo-600 font-semibold' : 'hover:text-slate-900'}`}
          >
            Support
          </button>

          {currentUser?.isAdmin && (
            <button 
              onClick={() => onNavigate('admin')} 
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                currentView === 'admin' 
                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Panel
            </button>
          )}
        </nav>

        {/* User / Auth State */}
        <div className="flex items-center space-x-3">
          {currentUser ? (
            <>
              {/* Post Job Quick CTA */}
              <button
                onClick={onOpenPostJob}
                className="hidden sm:inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors border border-indigo-200"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Post Job
              </button>

              {/* Inbox Trigger with unread count */}
              <button
                onClick={onOpenInbox}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Open Inbox"
                aria-label="Messages"
              >
                <MessageSquare className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Wallet quick badge */}
              <div 
                onClick={() => onNavigate('wallet')}
                className="hidden sm:flex flex-col text-right cursor-pointer group pl-2 border-l border-slate-200"
              >
                <span className="text-[11px] text-slate-500 group-hover:text-slate-700">Balance</span>
                <span className="text-sm font-bold text-emerald-600 font-mono tabular-nums leading-none">
                  ৳{currentUser.balance.toFixed(2)}
                </span>
              </div>

              {/* Profile Avatar trigger */}
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 p-1 pl-2 hover:bg-slate-100 rounded-lg transition-colors text-left"
                title="View & Edit Profile"
              >
                {currentUser.isAdmin ? (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center text-base shadow-sm ring-2 ring-amber-300 font-bold select-none">
                    👑
                  </div>
                ) : (
                  <img 
                    src={currentUser.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`} 
                    alt={currentUser.name} 
                    className="w-8 h-8 rounded-full border border-slate-200 bg-slate-100 object-cover"
                  />
                )}
                <span className="hidden lg:inline text-xs font-semibold text-slate-800 max-w-[100px] truncate">
                  {currentUser.isAdmin ? (
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                      👑 Admin
                    </span>
                  ) : (
                    currentUser.name
                  )}
                </span>
              </button>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="text-slate-700 hover:text-slate-900 font-semibold text-sm px-3.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-xs transition-colors"
              >
                Register
              </button>
            </div>
          )}

          {/* Quick Admin Auth portal */}
          {!currentUser?.isAdmin && (
            <button
              onClick={() => onOpenAuth('admin')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100/80 hover:bg-amber-200/90 border border-amber-300 rounded-lg transition-colors shadow-xs"
              title="Admin Panel Login"
            >
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
