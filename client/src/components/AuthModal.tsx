import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User as UserIcon, HeartPulse, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, googleLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<UserRole>('ELDERLY');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register(name, email, password, role);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Instant 1-Click Demo Logins for Hackathon Evaluators
  const handleQuickDemo = async (demoRole: 'ELDER' | 'CAREGIVER') => {
    setLoading(true);
    setError(null);
    try {
      if (demoRole === 'ELDER') {
        // Register or login as elder
        try {
          await login('ramesh.sharma@aayucare.in', 'dadaJi@123');
        } catch {
          await register('Ramesh Sharma', 'ramesh.sharma@aayucare.in', 'dadaJi@123', 'ELDERLY');
        }
      } else {
        // Register or login as caregiver
        try {
          await login('priya.caregiver@aayucare.in', 'caregiver@123');
        } catch {
          await register('Priya Sharma', 'priya.caregiver@aayucare.in', 'caregiver@123', 'CAREGIVER');
        }
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isRegister ? 'Create AayuCare Account' : 'Welcome to AayuCare'}
              </h3>
              <p className="text-xs text-slate-500">
                {isRegister ? 'Sign up for safe elderly care' : 'Sign in to access your medication plan'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100 text-xs font-semibold">
          <button
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`flex-1 py-3 text-center transition ${
              !isRegister
                ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50/50 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
            className={`flex-1 py-3 text-center transition ${
              isRegister
                ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50/50 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            New Registration
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Role selector if registering */}
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Who are you registering as?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('ELDERLY')}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-left transition flex items-center gap-2 ${
                    role === 'ELDERLY'
                      ? 'border-teal-500 bg-teal-50 text-teal-800 font-semibold ring-1 ring-teal-500'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span className="text-base">👴</span>
                  <div>
                    <div className="text-xs font-bold">Elder / Patient</div>
                    <div className="text-[10px] text-slate-500">I take medications</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('CAREGIVER')}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-left transition flex items-center gap-2 ${
                    role === 'CAREGIVER'
                      ? 'border-teal-500 bg-teal-50 text-teal-800 font-semibold ring-1 ring-teal-500'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span className="text-base">🧑‍⚕️</span>
                  <div>
                    <div className="text-xs font-bold">Caregiver / Family</div>
                    <div className="text-[10px] text-slate-500">I manage care</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            {loading ? 'Processing...' : isRegister ? 'Complete Registration' : 'Sign In'}
          </button>
        </form>

        {/* 1-Click Demo Evaluation Bar */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-2.5">
            ⚡ Instant Evaluator Demo Logins
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickDemo('ELDER')}
              className="py-1.5 px-2 bg-white hover:bg-teal-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium transition text-center shadow-2xs"
            >
              👴 Login as <b>Dada Ji</b>
            </button>
            <button
              onClick={() => handleQuickDemo('CAREGIVER')}
              className="py-1.5 px-2 bg-white hover:bg-teal-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium transition text-center shadow-2xs"
            >
              🧑‍⚕️ Login as <b>Caretaker</b>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
