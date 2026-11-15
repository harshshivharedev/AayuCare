import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, HeartPulse, User as UserIcon, LogOut, Key } from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
  systemHealth: string;
  activeMode: 'elder' | 'caregiver';
  onModeChange: (mode: 'elder' | 'caregiver') => void;
  passcode?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  systemHealth,
  activeMode,
  onModeChange,
  passcode = 'CARE-8421',
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white">
                Aayu<span className="text-emerald-400">Care</span>
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono">
                आयु-Care
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Elderly Care & Medication Management Ecosystem
            </p>
          </div>
        </div>

        {/* Dual Mode Switcher Tabs */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => onModeChange('elder')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
              activeMode === 'elder'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>👴 Bedside Kiosk (बुज़ुर्ग मोड)</span>
          </button>
          <button
            onClick={() => onModeChange('caregiver')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
              activeMode === 'caregiver'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🛡️ Caregiver Cockpit (देखभाल)</span>
          </button>
        </div>

        {/* Status Badges & Auth */}
        <div className="flex items-center gap-3">
          {/* Passcode Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-indigo-500/30 text-xs text-indigo-300 font-mono font-bold">
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            <span>Passcode: {passcode}</span>
          </div>

          {/* Health indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                systemHealth === 'UP' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span>API: {systemHealth === 'UP' ? 'Operational' : 'Connecting...'}</span>
          </div>

          {/* User Section */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-200">
                <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold">{user.name}</span>
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
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all rounded-xl shadow-md shadow-emerald-600/20"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
