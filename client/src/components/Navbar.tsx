import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, Sparkles, User as UserIcon, LogOut } from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
  systemHealth: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, systemHealth }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Catalyst<span className="text-brand-400">.ai</span>
            </span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-brand-950 text-brand-300 border border-brand-800/60 rounded-full">
              Enterprise Ready
            </span>
          </div>
        </div>

        {/* Status Badge & Actions */}
        <div className="flex items-center gap-4">
          {/* Health indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className={`w-2 h-2 rounded-full ${systemHealth === 'UP' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span>API: {systemHealth === 'UP' ? 'Operational' : 'Connecting...'}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-300 hidden sm:flex">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Rate-Limited & Encrypted</span>
          </div>

          {/* User Section */}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-sm text-slate-200">
                <UserIcon className="w-4 h-4 text-brand-400" />
                <span className="font-medium">{user.name}</span>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 active:scale-95 transition-all duration-200 rounded-lg shadow-md shadow-brand-600/20"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
