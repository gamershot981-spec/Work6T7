import React from 'react';
import { Job, User } from '../types';
import { 
  Gift, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Eye, 
  MessageSquare,
  Users,
  CheckCircle2,
  DollarSign,
  Trash2
} from 'lucide-react';

interface HomeViewProps {
  jobs: Job[];
  currentUser: User | null;
  onNavigate: (view: string) => void;
  onSelectJob: (job: Job) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenMessagePoster: (posterUsername: string, jobId: number, jobTitle: string) => void;
  onRequireLogin: () => void;
  onDeleteJob?: (jobId: number) => void;
}

const POPULAR_CATEGORIES = [
  { name: 'YouTube', icon: '▶', count: '120+ tasks', desc: 'Watch, subscribe, like' },
  { name: 'Social Media', icon: '👥', count: '85+ tasks', desc: 'Follow, share, join groups' },
  { name: 'App Testing', icon: '📱', count: '45+ tasks', desc: 'Install, test, review apps' },
  { name: 'Data Entry', icon: '⌨', count: '60+ tasks', desc: 'Form filling, copy paste' },
  { name: 'Survey', icon: '📋', count: '30+ tasks', desc: 'Quick feedback forms' },
  { name: 'Content & Reviews', icon: '✍', count: '50+ tasks', desc: 'Ratings & genuine feedback' },
];

export const HomeView: React.FC<HomeViewProps> = ({
  jobs,
  currentUser,
  onNavigate,
  onSelectJob,
  onOpenAuth,
  onOpenMessagePoster,
  onRequireLogin,
  onDeleteJob,
}) => {
  // Only show approved jobs
  const approvedJobs = jobs.filter(j => j.status === 'Approved').slice(0, 3);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white py-16 sm:py-24 px-4 overflow-hidden text-center">
        <div className="max-w-4xl mx-auto relative z-10">
          {/* Signup Bonus Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-200 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border border-indigo-400/30 backdrop-blur-xs">
            <Gift className="w-4 h-4 text-amber-400" />
            <span>Signup Bonus: Get ৳5 Free Instantly + ৳5 Per Referral!</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Work Online. <span className="text-indigo-400">Earn Real Money.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-2xl mx-auto font-normal leading-relaxed">
            Bangladesh's trusted microjob marketplace. Complete verified tasks, chat directly with employers, and receive fast payouts via bKash & Nagad.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto">
            <button
              onClick={() => onNavigate('jobs')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 text-sm"
            >
              Browse Jobs
              <ArrowRight className="w-4 h-4" />
            </button>
            {!currentUser && (
              <button
                onClick={() => onOpenAuth('register')}
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 rounded-xl border border-white/20 transition-colors text-sm"
              >
                Create Account (Get ৳5)
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Popular Categories</h2>
            <p className="text-xs text-slate-500 mt-1">Explore microjobs across multiple categories.</p>
          </div>
          <button
            onClick={() => onNavigate('jobs')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            View All Categories <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {POPULAR_CATEGORIES.map(cat => (
            <div
              key={cat.name}
              onClick={() => onNavigate('jobs')}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-xs transition-all cursor-pointer group text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 text-lg font-bold">
                {cat.icon}
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                {cat.name}
              </h3>
              <span className="text-[10px] text-slate-400 block mt-0.5">{cat.count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Verified Jobs */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Verified</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Featured Tasks</h2>
            </div>
            <button
              onClick={() => onNavigate('jobs')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              See All Jobs <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {approvedJobs.map(job => {
              const isOwner = currentUser?.username.toLowerCase() === job.poster.toLowerCase();
              const isAdminPost = job.poster.toLowerCase() === 'admin' || job.posterName === 'Work 6T7 Official';

              return (
                <div
                  key={job.id}
                  className={`p-5 rounded-2xl shadow-xs transition-all flex flex-col justify-between ${
                    isAdminPost
                      ? 'bg-gradient-to-b from-amber-50/60 via-white to-white border-2 border-amber-400 ring-2 ring-amber-200/50 shadow-amber-500/10 hover:shadow-amber-500/20'
                      : 'bg-white border border-slate-200 hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Top Header */}
                    {isAdminPost ? (
                      <div className="flex justify-between items-start mb-3">
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[11px] shadow-xs border border-amber-300">
                          <span>👑</span>
                          <span>Post by Admin</span>
                        </div>
                        <span className="text-xl font-black text-emerald-600 font-mono tabular-nums">
                          ৳{job.pay.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {job.category}
                        </span>
                        <span className="text-xl font-black text-emerald-600 font-mono tabular-nums">
                          ৳{job.pay.toFixed(2)}
                        </span>
                      </div>
                    )}

                    <h3
                      onClick={() => onSelectJob(job)}
                      className={`font-bold text-sm mb-2 cursor-pointer line-clamp-2 transition-colors ${
                        isAdminPost ? 'text-slate-950 hover:text-amber-700' : 'text-slate-900 hover:text-indigo-600'
                      }`}
                    >
                      {job.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                      {job.inst}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[11px] text-slate-500 mb-3 pt-3 border-t border-slate-100">
                      {isAdminPost ? (
                        <span className="font-bold text-amber-900 flex items-center gap-1">
                          <span>👑</span>
                          <span>Post by Admin</span>
                        </span>
                      ) : (
                        <span>By: <b>@{job.poster}</b></span>
                      )}
                      <span>{job.done}/{job.needed} slots</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onSelectJob(job)}
                        className={`w-full py-2 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 ${
                          isAdminPost
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>
                      <button
                        onClick={() => {
                          if (!currentUser) {
                            onRequireLogin();
                            return;
                          }
                          onOpenMessagePoster(job.poster, job.id, job.title);
                        }}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Message
                      </button>
                    </div>

                    {/* ADMIN 1-CLICK DELETE BUTTON */}
                    {currentUser?.isAdmin && onDeleteJob && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Permanently delete post #${job.id}: "${job.title}"?`)) {
                            onDeleteJob(job.id);
                          }
                        }}
                        className="mt-2 w-full py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-rose-200"
                        title="Admin 1-Click Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Admin: Delete Post (1-Click)
                      </button>
                    )}

                    {/* USER DELETE OWN POST */}
                    {!currentUser?.isAdmin && isOwner && onDeleteJob && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Permanently delete your post #${job.id}: "${job.title}"?`)) {
                            onDeleteJob(job.id);
                          }
                        }}
                        className="mt-2 w-full py-1.5 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-200 hover:border-rose-200"
                        title="Delete My Post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete My Post
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Features / Guarantees */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center sm:text-left">
          <div className="p-6 rounded-2xl bg-white border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Gift className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">৳5 Signup & Referral Bonus</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every new user receives ৳5 immediately upon registration, and referrers receive ৳5 for every successful invite.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Admin Approval & ৳10 Posting Fee</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Employers pay a flat ৳10 fee. Every task is manually reviewed by platform admins to prevent spam and scams.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Direct Task Inbox</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Need clarification? Every job details page connects directly to the employer with linked task IDs for seamless communication.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
