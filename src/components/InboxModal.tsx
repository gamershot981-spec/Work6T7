import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Message } from '../types';
import { X, Send, MessageSquare, Briefcase, User as UserIcon, Image as ImageIcon, Search, ShieldCheck } from 'lucide-react';

interface InboxModalProps {
  currentUser: User;
  allUsers: User[];
  messages: Message[];
  initialRecipient?: string | null;
  initialJobContext?: { id: number; title: string } | null;
  onClose: () => void;
  onSendMessage: (toUser: string, text: string, jobId?: number, jobTitle?: string, imageUrl?: string) => void;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewLightbox, setPreviewLightbox] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');

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
    // Always include admin as a quick partner if current user is not admin
    if (!currentUser.isAdmin) {
      set.add('admin');
    }
    myMessages.forEach(m => {
      const other = m.from.toLowerCase() === currentUser.username.toLowerCase() ? m.to.toLowerCase() : m.from.toLowerCase();
      set.add(other);
    });
    return Array.from(set);
  }, [myMessages, currentUser.username, initialRecipient, currentUser.isAdmin]);

  // Selected conversation partner
  const [activePartner, setActivePartner] = useState<string>(
    initialRecipient?.toLowerCase() || partnerUsernames[0] || (currentUser.isAdmin ? '' : 'admin')
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

  // Job context associated with this thread
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelectedImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedImage) || !activePartner) return;

    onSendMessage(
      activePartner,
      inputText.trim() || (selectedImage ? '📷 Photo' : ''),
      linkedJobContext?.id,
      linkedJobContext?.title,
      selectedImage || undefined
    );

    setInputText('');
    setSelectedImage(null);
  };

  const getPartnerUser = (username: string) => {
    return allUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
  };

  const activePartnerUser = getPartnerUser(activePartner);

  // Available users for starting new chat
  const filteredUsersToStart = useMemo(() => {
    if (!userSearch.trim()) return [];
    return allUsers.filter(u => 
      u.username.toLowerCase() !== currentUser.username.toLowerCase() &&
      (u.username.toLowerCase().includes(userSearch.toLowerCase()) || u.name.toLowerCase().includes(userSearch.toLowerCase()))
    );
  }, [allUsers, userSearch, currentUser.username]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[650px] max-h-[92vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col relative animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-extrabold text-slate-900">Direct Messages & Community Chat</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Sidebar + Chat Thread */}
        <div className="flex-1 flex overflow-hidden">
          {/* Partners Sidebar */}
          <div className="w-64 sm:w-72 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
            {/* Search / Start New Chat */}
            <div className="p-3 border-b border-slate-200 bg-white">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Find user to message..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Search results dropdown */}
              {filteredUsersToStart.length > 0 && (
                <div className="mt-2 max-h-36 overflow-y-auto space-y-1 bg-white border border-slate-200 rounded-lg p-1 shadow-md">
                  {filteredUsersToStart.map(u => (
                    <button
                      key={u.username}
                      type="button"
                      onClick={() => {
                        setActivePartner(u.username);
                        setUserSearch('');
                      }}
                      className="w-full text-left p-1.5 hover:bg-indigo-50 rounded flex items-center gap-2 text-xs"
                    >
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-900 truncate">{u.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">@{u.username}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Conversation Threads List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {partnerUsernames.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No chat conversations yet.
                </div>
              ) : (
                partnerUsernames.map(username => {
                  const partner = getPartnerUser(username);
                  const isSelected = activePartner.toLowerCase() === username.toLowerCase();
                  const unreadInThread = myMessages.filter(
                    m => m.from.toLowerCase() === username.toLowerCase() && !m.isRead
                  ).length;

                  return (
                    <button
                      key={username}
                      type="button"
                      onClick={() => setActivePartner(username)}
                      className={`w-full text-left p-3 flex items-center gap-2.5 transition-colors ${
                        isSelected
                          ? 'bg-indigo-50/80 border-r-2 border-indigo-600'
                          : 'hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="relative shrink-0">
                        {partner?.isAdmin ? (
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold shadow-xs">
                            👑
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">
                            {username.charAt(0)}
                          </div>
                        )}
                        {unreadInThread > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                            {unreadInThread}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {partner?.name || `@${username}`}
                          </span>
                          {partner?.isAdmin && (
                            <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1 rounded">Admin</span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono block truncate">
                          @{username}
                        </span>
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
                    {activePartnerUser?.isAdmin ? (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center text-sm font-bold shadow-xs">
                        👑
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm uppercase">
                        {activePartner.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-slate-900 leading-none flex items-center gap-1.5">
                        <span>{activePartnerUser?.name || `@${activePartner}`}</span>
                        {activePartnerUser?.isAdmin && (
                          <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                            👑 Official Admin
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                        @{activePartner} · Online
                      </span>
                    </div>
                  </div>

                  {linkedJobContext && (
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-700 max-w-xs truncate">
                      <Briefcase className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Job #{linkedJobContext.id}: {linkedJobContext.title}</span>
                    </div>
                  )}
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/50">
                  {activeThread.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                      <MessageSquare className="w-10 h-10 mb-2 stroke-slate-300" />
                      <p className="text-sm font-medium">No previous messages with @{activePartner}</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        Send a message or attach a photo from your gallery to start the conversation.
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
                          {msg.jobTitle && (
                            <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mb-1 border border-indigo-100 flex items-center gap-1">
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
                            {/* Photo Attachment if present */}
                            {msg.imageUrl && (
                              <div className="mb-2 rounded-xl overflow-hidden cursor-pointer border border-white/20">
                                <img
                                  src={msg.imageUrl}
                                  alt="Chat attachment"
                                  onClick={() => setPreviewLightbox(msg.imageUrl || null)}
                                  className="max-h-60 w-auto rounded-lg object-contain hover:opacity-95 transition-opacity"
                                />
                              </div>
                            )}

                            {msg.text && (
                              <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                            )}

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

                {/* Selected Gallery Photo Preview before sending */}
                {selectedImage && (
                  <div className="p-2.5 bg-slate-100 border-t border-slate-200 flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-300 bg-white">
                      <img src={selectedImage} alt="Selected preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-1 right-1 bg-slate-900/80 text-white p-0.5 rounded-full hover:bg-rose-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-xs text-slate-600">
                      <span className="font-bold text-slate-900 block">Photo attached from Gallery</span>
                      <span>Type a message or click Send to deliver this image.</span>
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
                  {/* Gallery Image Upload Button */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl transition-colors shrink-0"
                    title="Send Photo from Device Gallery"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder={`Message @${activePartner}...`}
                    className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() && !selectedImage}
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

      {/* Lightbox for Full-screen Chat Image View */}
      {previewLightbox && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewLightbox(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2">
            <button
              onClick={() => setPreviewLightbox(null)}
              className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white p-1.5 rounded-full z-10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewLightbox}
              alt="Full Preview"
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
