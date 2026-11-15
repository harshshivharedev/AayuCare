import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  LogIn,
  HeartPulse,
  Users,
  ShieldCheck
} from 'lucide-react';

interface CaregiverOnboardingProps {
  onOpenAuth: () => void;
}

export const CaregiverOnboarding: React.FC<CaregiverOnboardingProps> = ({ onOpenAuth }) => {
  const { user, pairWithElder } = useAuth();
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await pairWithElder(passcode.trim().toUpperCase());
      setSuccess(`Successfully paired with ${res.elder.fullName}'s Care Circle! Launching dashboard...`);
    } catch (err: any) {
      setError(
        err.message ||
          'Invalid CarePasscode. Please verify the code on your elder’s screen.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-8 px-2 sm:px-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8 space-y-6">
        {/* 1. Onboarding Stepper Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                user
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {user ? '✓' : '1'}
            </div>
            <span
              className={`text-xs font-semibold ${
                user ? 'text-slate-800' : 'text-slate-500'
              }`}
            >
              1. Account Ready
            </span>
          </div>

          <div className="h-0.5 flex-1 mx-3 bg-teal-200"></div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold ring-4 ring-teal-50">
              2
            </div>
            <span className="text-xs font-bold text-teal-800">
              2. Pair Elder
            </span>
          </div>

          <div className="h-0.5 flex-1 mx-3 bg-slate-200"></div>

          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold">
              3
            </div>
            <span className="text-xs font-medium">3. Dashboard</span>
          </div>
        </div>

        {/* 2. Welcome Banner */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-2xl shadow-xs">
            👵👴
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Welcome to AayuCare{user ? `, ${user.name}` : ''}!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            To start monitoring medication schedules, real-time safety alerts, and doctor briefcase reports, connect your elder’s device.
          </p>
        </div>

        {/* 3. If User Not Logged In, Prompt Sign-In */}
        {!user ? (
          <div className="rounded-2xl bg-teal-50/60 border border-teal-200 p-5 text-center space-y-3">
            <p className="text-xs font-medium text-teal-900">
              Please sign in or register as a Caregiver to securely manage your loved one’s Care Circle.
            </p>
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Create Account</span>
            </button>
          </div>
        ) : (
          /* 4. Pairing Form */
          <form onSubmit={handlePair} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Elder's Unique CarePasscode
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. CARE-8421"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value.toUpperCase())}
                  className="w-full text-center font-mono font-bold tracking-widest text-lg sm:text-xl py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent uppercase placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-xs"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                💡 <span className="font-semibold">Where to find it:</span> View the top header on your elder’s screen or ask them for their unique CarePasscode.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !passcode.trim()}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-sm shadow-teal-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                'Connecting Care Circle...'
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Link Elder Device & Open Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* 5. Security & Clinical Safety Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>End-to-End Encrypted Care Circle</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <HeartPulse className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Real-Time Anti-Overdose Protection</span>
          </div>
        </div>
      </div>
    </div>
  );
};
