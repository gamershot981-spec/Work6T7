import React, { useState } from 'react';
import { User } from '../types';
import { X, Camera, Copy, Check, Save } from 'lucide-react';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdateProfile: (updatedData: Partial<User>) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=tanvir',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=digitalagent',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=shakib',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=fatima',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=rahim',
  'https://api.dicebear.com/7.x/bottts/svg?seed=cyberbd',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  onClose,
  onUpdateProfile,
  onShowToast,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [profilePhoto, setProfilePhoto] = useState(user.profilePhoto || PRESET_AVATARS[0]);
  const [copied, setCopied] = useState(false);

  const handleCopyRef = () => {
    navigator.clipboard.writeText(user.refCode);
    setCopied(true);
    onShowToast('Referral code copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onShowToast('Name cannot be empty', 'error');
      return;
    }

    onUpdateProfile({
      name: name.trim(),
      bio: bio.trim(),
      email: email.trim(),
      phone: phone.trim(),
      profilePhoto: profilePhoto.trim(),
    });
    setIsEditing(false);
    onShowToast('Profile updated successfully!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden relative my-6">
        {/* Top Banner */}
        <div className={`h-28 relative px-6 flex items-end justify-between ${
          user.isAdmin 
            ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 border-b border-amber-500/30' 
            : 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800'
        }`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1.5 rounded-lg bg-black/20 hover:bg-black/40 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="px-6 pb-6 pt-0">
          {/* Avatar and Primary Info */}
          <div className="relative flex justify-between items-end -mt-12 mb-4">
            {user.isAdmin ? (
              <div className="w-24 h-24 rounded-2xl border-4 border-amber-300 bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-400 shadow-xl flex flex-col items-center justify-center text-slate-950 relative select-none">
                <span className="text-4xl drop-shadow-md">👑</span>
                <span className="text-[9px] font-black tracking-widest uppercase bg-slate-950/80 text-amber-300 px-2 py-0.5 rounded-full mt-1">
                  MASTER ADMIN
                </span>
              </div>
            ) : (
              <div className="relative group">
                <img
                  src={profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                  alt={user.name}
                  className="w-24 h-24 rounded-2xl border-4 border-white bg-slate-100 shadow-md object-cover"
                />
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center text-white text-xs">
                    <Camera className="w-5 h-5" />
                  </div>
                )}
              </div>
            )}

            <div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {!isEditing ? (
            /* VIEW MODE */
            <div>
              <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-900 leading-tight">{user.name}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="font-mono text-indigo-600 font-semibold">@{user.username}</span>
                  <span>·</span>
                  <span>Member since {user.joinedAt}</span>
                  {user.isAdmin && (
                    <>
                      <span>·</span>
                      <span className="text-amber-600 font-bold">Admin</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {user.bio || 'No bio provided yet.'}
                </p>
              </div>

              {/* Statistics grid */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                  <span className="text-[11px] font-semibold text-emerald-700 block uppercase">Balance</span>
                  <span className="text-lg font-bold text-emerald-900 font-mono tabular-nums">
                    ৳{user.balance.toFixed(2)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
                  <span className="text-[11px] font-semibold text-indigo-700 block uppercase">Earnings</span>
                  <span className="text-lg font-bold text-indigo-900 font-mono tabular-nums">
                    ৳{user.earnings.toFixed(2)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase">Status</span>
                  <span className="text-sm font-bold text-slate-800">
                    {user.isBanned ? 'Suspended' : 'Verified'}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4 mb-4">
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-medium text-slate-800">{user.email || 'Not provided'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-medium text-slate-800">{user.phone || 'Not provided'}</span>
                </div>
              </div>

              {/* Referral Code Box */}
              <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                    My Referral Code (Earn ৳5/Invite)
                  </span>
                  <span className="text-sm font-mono font-bold tracking-wider text-amber-400">
                    {user.refCode}
                  </span>
                </div>
                <button
                  onClick={handleCopyRef}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          ) : (
            /* EDIT MODE */
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={2}
                  placeholder="Tell clients and task creators about your skills..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone (bKash/Nagad)
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {!user.isAdmin ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Choose Avatar or Enter Image URL
                  </label>
                  <div className="flex gap-2 mb-2">
                    {PRESET_AVATARS.map((av, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setProfilePhoto(av)}
                        className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-transform ${
                          profilePhoto === av ? 'border-indigo-600 scale-105 ring-2 ring-indigo-200' : 'border-slate-200 opacity-70'
                        }`}
                      >
                        <img src={av} alt="Preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={profilePhoto}
                    onChange={e => setProfilePhoto(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                  <span className="text-xl">👑</span>
                  <span>Admin প্রোফাইল সবসময় অফিশিয়াল রাজকীয় মুকুট (👑) আইকন দ্বারা সুরক্ষিত।</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
