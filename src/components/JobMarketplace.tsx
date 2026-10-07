import React, { useState, useMemo } from 'react';
import { Job, User } from '../types';
import { 
  Search, 
  MessageSquare, 
  Eye, 
  Users, 
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Trash2
} from 'lucide-react';

interface JobMarketplaceProps {
  jobs: Job[];
  currentUser: User | null;
  onSelectJob: (job: Job) => void;
  onOpenMessagePoster: (posterUsername: string, jobId: number, jobTitle: string) => void;
  onRequireLogin: () => void;
  onDeleteJob?: (jobId: number) => void;
}

const CATEGORIES = [
  'All',
  'YouTube',
  'Social Media',
  'App Testing',
  'Data Entry',
  'Survey',
  'Content & Reviews',
];

export const JobMarketplace: React.FC<JobMarketplaceProps> = ({
  jobs,
  currentUser,
  onSelectJob,
  onOpenMessagePoster,
  onRequireLogin,
  onDeleteJob,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // CRITICAL REQUIREMENT: Only show Active / Approved jobs in marketplace, strictly exclude Removed/Deleted
  const approvedJobs = useMemo(() => {
    return jobs.filter(
      j => (j.status === 'Approved' || j.status === 'Active') && !j.isDeleted
    );
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return approvedJobs.filter(job => {
      const matchesCategory = selectedCategory === 'All' || job.category === selectedCategory;
      const matchesSearch =
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.inst.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.poster.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [approvedJobs, selectedCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Title & Search Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Verified Microjobs in Bangladesh</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Job Marketplace
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse verified micro-tasks, submit simple proofs, and earn instant BDT payouts.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks, keywords..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs text-slate-700"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Pills (Interactive Filter Controls) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none text-xs">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Verified Jobs */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-base font-semibold text-slate-700">No jobs match your search</p>
          <p className="text-xs text-slate-400 mt-1">
            Try resetting your filters or check back shortly for newly approved employer tasks.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map(job => {
            const isOwner = currentUser?.username.toLowerCase() === job.poster.toLowerCase();
            const isAdminPost = job.poster.toLowerCase() === 'admin' || job.posterName === 'Work 6T7 Official';
            const pct = Math.min(100, Math.round((job.done / job.needed) * 100));

            return (
              <div
                key={job.id}
                className={`rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between relative overflow-hidden ${
                  isAdminPost
                    ? 'bg-gradient-to-b from-amber-50/60 via-white to-white border-2 border-amber-400 ring-2 ring-amber-200/50 shadow-amber-500/10 hover:shadow-amber-500/20'
                    : 'bg-white border border-slate-200 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Top Bar of Card */}
                  {isAdminPost ? (
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs shadow-xs border border-amber-300">
                        <span className="text-sm">👑</span>
                        <span className="tracking-wide">Post by Admin</span>
                        <span className="text-[10px] bg-slate-950/20 text-slate-900 px-1.5 py-0.5 rounded font-bold uppercase ml-0.5">Official</span>
                      </div>
                      <span className="text-xl font-black text-emerald-600 font-mono tabular-nums leading-none">
                        ৳{job.pay.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-xs font-medium text-slate-500">
                        {job.category} · By @{job.poster}
                      </span>
                      <span className="text-xl font-black text-emerald-600 font-mono tabular-nums leading-none">
                        ৳{job.pay.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <h3
                    onClick={() => onSelectJob(job)}
                    className={`text-base font-bold leading-snug cursor-pointer transition-colors line-clamp-2 mb-2 ${
                      isAdminPost ? 'text-slate-950 hover:text-amber-700' : 'text-slate-900 hover:text-indigo-600'
                    }`}
                  >
                    {job.title}
                  </h3>

                  {/* Instructions Snippet */}
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                    {job.inst}
                  </p>
                </div>

                <div>
                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center text-[11px] text-slate-500 mb-1">
                      <span>Completed: <b>{job.done} / {job.needed}</b></span>
                      <span className="font-mono">{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isAdminPost ? 'bg-amber-500' : 'bg-indigo-600'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Card Actions: View Details + Message Poster */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onSelectJob(job)}
                      className={`w-full py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                        isAdminPost
                          ? 'bg-amber-100/70 hover:bg-amber-200/70 text-amber-900 font-bold'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </button>

                    {/* Direct Message / Inbox button */}
                    <button
                      onClick={() => {
                        if (!currentUser) {
                          onRequireLogin();
                          return;
                        }
                        if (isOwner) {
                          onSelectJob(job);
                        } else {
                          onOpenMessagePoster(job.poster, job.id, job.title);
                        }
                      }}
                      className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      title="Message Job Poster directly"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {isOwner ? 'My Task' : 'Message'}
                    </button>
                  </div>

                  {/* ADMIN 1-CLICK DELETE BUTTON (Admin can delete ANY user's post in 1-click) */}
                  {currentUser?.isAdmin && onDeleteJob && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteJob(job.id);
                      }}
                      className="mt-2 w-full py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-rose-200"
                      title="Admin 1-Click Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Admin: Delete Post (1-Click)
                    </button>
                  )}

                  {/* USER DELETE OWN POST (User can ONLY delete their own post) */}
                  {!currentUser?.isAdmin && isOwner && onDeleteJob && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteJob(job.id);
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
      )}
    </div>
  );
};
