import React from 'react';
import { ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
  onOpenAuth: (mode: 'admin') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenAuth }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-sm flex items-center justify-center">
              6T7
            </div>
            <div>
              <span className="text-sm font-extrabold text-white">Work 6T7</span>
              <p className="text-[11px] text-slate-500">Bangladesh Microjob Marketplace</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors">
              Home
            </button>
            <button onClick={() => onNavigate('jobs')} className="hover:text-white transition-colors">
              Jobs
            </button>
            <button onClick={() => onNavigate('wallet')} className="hover:text-white transition-colors">
              Wallet
            </button>
            <button onClick={() => onNavigate('support')} className="hover:text-white transition-colors">
              Support
            </button>
            <button onClick={() => onOpenAuth('admin')} className="hover:text-amber-400 transition-colors flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Portal
            </button>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <span>
            © 2026 Work 6T7. All rights reserved. Registered micro-tasks & payment escrow in Bangladesh.
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            Instant bKash, Nagad, Rocket Payouts
          </span>
        </div>
      </div>
    </footer>
  );
};
