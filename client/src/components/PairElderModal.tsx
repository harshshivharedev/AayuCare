import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

interface PairElderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PairElderModal: React.FC<PairElderModalProps> = ({ isOpen, onClose }) => {
  const { pairWithElder } = useAuth();
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePair = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await pairWithElder(passcode);
      setSuccess(`Successfully paired with ${res.elder.fullName}'s Care Circle!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Invalid passcode. Please check code on elder device.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-xl overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pair with Elder</h3>
              <p className="text-[11px] text-slate-500">Enter the 6-character code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handlePair} className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Elder's CarePasscode
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CARE-8421"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value.toUpperCase())}
              className="w-full text-center font-mono font-bold tracking-widest text-base py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent uppercase placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Find this 6-character code at the top of the Elder's screen.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !passcode.trim()}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            {loading ? 'Pairing...' : 'Link Care Circle'}
          </button>
        </form>
      </div>
    </div>
  );
};
