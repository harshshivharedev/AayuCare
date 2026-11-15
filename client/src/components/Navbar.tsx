import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  HeartPulse,
  LogOut,
  LogIn,
  KeyRound,
  Users,
  Languages
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenPair: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onOpenPair }) => {
  const {
    user,
    elderProfile,
    activeMode,
    setActiveMode,
    linkedElders,
    activeElder,
    setActiveElder,
    logout
  } = useAuth();

  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 1. Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-600/30">
              <HeartPulse className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Aayu<span className="text-teal-600">Care</span>
                </span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-hindi">
                  आयु-Care
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
                Elderly Medication & Care Safety
              </p>
            </div>
          </div>

          {/* 2. Middle Persona Switcher (Clean Medical Tab Pill) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setActiveMode('ELDER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeMode === 'ELDER'
                  ? 'bg-white text-teal-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>👴</span>
              <span>{t.dadaJiView}</span>
            </button>
            <button
              onClick={() => setActiveMode('CAREGIVER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeMode === 'CAREGIVER'
                  ? 'bg-white text-teal-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-teal-600" />
              <span>{t.caretakerView}</span>
            </button>
          </div>

          {/* 3. Right Action Area */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher Pill */}
            <button
              onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition"
              title={language === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
            >
              <Languages className="w-3.5 h-3.5 text-teal-600" />
              <span>{language === 'hi' ? '🇮🇳 हिंदी' : '🇬🇧 English'}</span>
            </button>

            {/* If in Elder mode, show Elder's Passcode pill so caregiver can link */}
            {activeMode === 'ELDER' && elderProfile && (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium">
                <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                <span>{t.pairCodeLabel}:</span>
                <span className="font-bold tracking-wider font-mono bg-white px-1.5 py-0.5 rounded border border-teal-300">
                  {elderProfile.carePasscode}
                </span>
              </div>
            )}

            {/* If in Caregiver mode and has linked elders, show switcher */}
            {activeMode === 'CAREGIVER' && linkedElders.length > 0 && (
              <div className="relative">
                <select
                  value={activeElder?.id || ''}
                  onChange={(e) => {
                    const selected = linkedElders.find((el) => el.id === e.target.value);
                    if (selected) setActiveElder(selected);
                  }}
                  className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {linkedElders.map((el) => (
                    <option key={el.id} value={el.id}>
                      {el.fullName} ({el.carePasscode})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Caregiver Pair button if no elder linked or want to link another */}
            {user && (user.role === 'CAREGIVER' || user.role === 'FAMILY' || user.role === 'ADMIN') && (
              <button
                onClick={onOpenPair}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-teal-600 text-teal-700 hover:bg-teal-50 transition"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Pair Elder</span>
              </button>
            )}

            {/* User Profile or Login */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800 leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-sm shadow-teal-600/20"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
