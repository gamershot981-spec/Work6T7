import React, { useState, useEffect, useMemo } from 'react';
import { User, Message } from '../types';
import { X, Send, MessageSquare, Briefcase, User as UserIcon } from 'lucide-react';

interface InboxModalProps {
  currentUser: User;
  allUsers: User[];
  messages: Message[];
  initialRecipient?: string | null;
  initialJobContext?: { id: number; title: string } | null;
  onClose: () => void;
  onSendMessage: (toUser: string, text: string, jobId?: number, jobTitle?: string) => void;
  onMarkThreadAsRead: (otherUser: string) => void;
}

export const InboxModal: React.FC<InboxModalProps> = ({
  currentUser,
  allUsers,
  messages,
  initialRecipient,
  initialJobContext,
  onClose,
  onSendMessage,
  onMarkThreadAsRead,
}) => {
  // Current user's messages (sent or received)
  const myMessages = useMemo(() => {
    return messages.filter(
      m => m.from.toLowerCase() === currentUser.username.toLowerCase() ||
           m.to.toLowerCase() === currentUser.username.toLowerCase()
    );
  }, [messages, currentUser.username]);

  // Distinct conversational partners
  const partnerUsernames = useMemo(() => {
    const set = new Set<string>();
    if (initialRecipient && initialRecipient.toLowerCase() !== currentUser.username.toLowerCase()) {
      set.add(initialRecipient.toLowerCase());
    }
    myMessages.forEach(m => {
      const other = m.from.toLowerCase() === currentUser.username.toLowerCase() ? m.to.toLowerCase() : m.from.toLowerCase();
      set.add(other);
    });
    return Array.from(set);
  }, [myMessages, currentUser.username, initialRecipient]);

  // Selected conversation partner
  const [activePartner, setActivePartner] = useState<string>(
    initialRecipient?.toLowerCase() || partnerUsernames[0] || ''
  );
  const [inputText, setInputText] = useState('');

  // Active thread's messages
  const activeThread = useMemo(() => {
    if (!activePartner) return [];
    return myMessages
      .filter(
        m =>
          (m.from.toLowerCase() === currentUser.username.toLowerCase() && m.to.toLowerCase() === activePartner) ||
          (m.from.toLowerCase() === activePartner && m.to.toLowerCase() === currentUser.username.toLowerCase())
      )
      .sort((a, b) => (a.id > b.id ? 1 : -1));
  }, [myMessages, currentUser.username, activePartner]);

  // Mark active thread as read when viewed
  useEffect(() => {
    if (activePartner) {
      onMarkThreadAsRead(activePartner);
    }
  }, [activePartner, onMarkThreadAsRead, myMessages.length]);

  // Job context associated with this thread (from initial prop or latest message in thread with jobId)
  const linkedJobContext = useMemo(() => {
    if (initialJobContext && initialRecipient?.toLowerCase() === activePartner) {
      return initialJobContext;
    }
    const msgWithJob = [...activeThread].reverse().find(m => m.jobId);
    if (msgWithJob && msgWithJob.jobId) {
      return { id: msgWithJob.jobId, title: msgWithJob.jobTitle || `Job #${msgWithJob.jobId}` };
    }
    return null;
  }, [initialJobContext, initialRecipient, activePartner, activeThread]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activePartner) return;

    onSendMessage(
      activePartner,
      inputText.trim(),
      linkedJobContext?.id,
      linkedJobContext?.title
    );
    setInputText('');
  };

  const getPartnerUser = (username: string) => {
    return allUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
  };

  const activePartnerUser = getPartnerUser(activePartner);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[600px] max-h-[90vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col relative animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Direct Messages & Job Chats</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Sidebar + Thread) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conversation List Sidebar */}
          <div className="w-64 sm:w-72 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Conversations ({partnerUsernames.length})
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {partnerUsernames.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No conversations yet. Message a job poster to start chatting!
                </div>
              ) : (
                partnerUsernames.map(uname => {
                  const partner = getPartnerUser(uname);
                  const thread = myMessages.filter(
                    m =>
                      (m.from.toLowerCase() === currentUser.username.toLowerCase() && m.to.toLowerCase() === uname) ||
                      (m.from.toLowerCase() === uname && m.to.toLowerCase() === currentUser.username.toLowerCase())
                  );
                  const lastMsg = thread[thread.length - 1];
                  const unreadCount = thread.filter(
                    m => m.from.toLowerCase() === uname && !m.isRead
                  ).length;
                  const isSelected = activePartner === uname;

                  return (
                    <button
                      key={uname}
                      onClick={() => setActivePartner(uname)}
                      className={`w-full p-3.5 flex items-start gap-3 text-left transition-colors ${
                        isSelected ? 'bg-white border-l-4 border-l-indigo-600 shadow-xs' : 'hover:bg-slate-100/70'
                      }`}
                    >
                      <img
                        src={partner?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uname}`}
                        alt={uname}
                        className="w-10 h-10 rounded-full border border-slate-200 bg-slate-200 shrink-0 object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {partner?.name || `@${uname}`}
                          </span>
                          {lastMsg && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {lastMsg.timestamp}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-xs text-slate-500 truncate">
                            {lastMsg ? lastMsg.text : 'Start conversation...'}
                          </span>
                          {unreadCount > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 bg-indigo-600 text-white font-bold text-[10px] rounded-full shrink-0">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Chat Thread View */}
          <div className="flex-1 flex flex-col bg-white">
            {activePartner ? (
              <>
                {/* Chat Partner Top Bar */}
                <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <img
                      src={activePartnerUser?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activePartner}`}
                      alt={activePartner}
                      className="w-9 h-9 rounded-full border border-slate-200 bg-slate-100 object-cover"
                    />
                    <div>
                      <div className="text-sm font-bold text-slate-900 leading-none">
                        {activePartnerUser?.name || `@${activePartner}`}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        @{activePartner} {activePartnerUser?.isAdmin && '· Platform Admin'}
                      </span>
                    </div>
                  </div>

                  {/* Linked Job Context Banner */}
                  {linkedJobContext && (
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-700 max-w-xs truncate">
                      <Briefcase className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Job #{linkedJobContext.id}: {linkedJobContext.title}</span>
                    </div>
                  )}
                </div>

                {/* Job Context on small screens */}
                {linkedJobContext && (
                  <div className="sm:hidden px-4 py-1.5 bg-indigo-50 border-b border-indigo-100 flex items-center gap-1 text-[11px] text-indigo-700 truncate">
                    <Briefcase className="w-3 h-3 shrink-0" />
                    <span className="truncate">Discussing: {linkedJobContext.title}</span>
                  </div>
                )}

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/50">
                  {activeThread.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                      <MessageSquare className="w-10 h-10 mb-2 stroke-slate-300" />
                      <p className="text-sm font-medium">No previous messages with @{activePartner}</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        Discuss instructions, verify proof submissions, or ask questions about tasks.
                      </p>
                    </div>
                  ) : (
                    activeThread.map(msg => {
                      const isMe = msg.from.toLowerCase() === currentUser.username.toLowerCase();
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          {/* Attached job title tag if present */}
                          {msg.jobTitle && (
                            <span className="text-[10px] text-indigo-600 bg-indigo-50/90 px-2 py-0.5 rounded-md mb-1 border border-indigo-100 flex items-center gap-1">
                              <Briefcase className="w-2.5 h-2.5" />
                              Re: {msg.jobTitle}
                            </span>
                          )}

                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-xs ${
                              isMe
                                ? 'bg-indigo-600 text-white rounded-br-xs'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                            <span
                              className={`text-[10px] block mt-1 font-mono text-right ${
                                isMe ? 'text-indigo-200' : 'text-slate-400'
                              }`}
                            >
                              {msg.timestamp}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder={`Message @${activePartner}...`}
                    className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition-colors shrink-0"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Select a user to begin messaging
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
