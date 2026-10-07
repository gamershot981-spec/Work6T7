import React, { useState } from 'react';
import { User, SupportTicket } from '../types';
import { MessageSquare, Send, CheckCircle2 } from 'lucide-react';

interface SupportViewProps {
  currentUser: User | null;
  tickets: SupportTicket[];
  onSubmitTicket: (subject: string, category: string, message: string) => void;
  onRequireLogin: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const SupportView: React.FC<SupportViewProps> = ({
  currentUser,
  tickets,
  onSubmitTicket,
  onRequireLogin,
  onShowToast,
}) => {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Payment/Withdrawal');
  const [message, setMessage] = useState('');

  const userTickets = currentUser
    ? tickets.filter(t => t.user.toLowerCase() === currentUser.username.toLowerCase())
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    if (!subject.trim() || !message.trim()) return;

    onSubmitTicket(subject.trim(), category, message.trim());
    setSubject('');
    setMessage('');
    onShowToast('Support ticket opened! Admin will review your query.', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Support Center</h1>
        <p className="text-sm text-slate-500 mt-1">
          Have an issue with a bKash deposit, task proof verification, or account? Open a ticket below.
        </p>
      </div>

      {/* Ticket Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          Open a Support Ticket
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Deposit not reflecting or Task dispute"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Payment/Withdrawal">Payment & Withdrawal</option>
                <option value="Task Proof Dispute">Task Proof Dispute</option>
                <option value="Job Posting Approval">Job Posting Approval</option>
                <option value="Account & Security">Account & Security</option>
                <option value="Other">Other Inquiry</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Details
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe your issue with transaction IDs, job numbers, or screenshots..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Ticket
            </button>
          </div>
        </form>
      </div>

      {/* User's Existing Tickets */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Your Tickets</h3>

        {userTickets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
            No support tickets submitted yet.
          </div>
        ) : (
          userTickets.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-slate-900">{t.subject}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  t.status === 'Open' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {t.status}
                </span>
              </div>
              <p className="text-xs text-slate-600">{t.message}</p>
              <div className="text-[10px] text-slate-400 font-mono">
                Category: {t.category} · Created: {t.createdAt}
              </div>

              {t.adminReply && (
                <div className="mt-3 p-3 bg-indigo-50 rounded-lg text-xs text-indigo-900 border border-indigo-100">
                  <span className="font-bold block mb-0.5">Admin Response:</span>
                  {t.adminReply}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
