import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { PairElderModal } from './components/PairElderModal';
import { VisualPillbox } from './components/elder/VisualPillbox';
import { MedicineStudio } from './components/caregiver/MedicineStudio';
import { DoctorAppointments } from './components/caregiver/DoctorAppointments';
import { AlertsFeed } from './components/caregiver/AlertsFeed';
import {
  HeartPulse,
  Pill,
  Calendar,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  PhoneCall
} from 'lucide-react';

export const App: React.FC = () => {
  const { user, elderProfile, activeMode, setActiveMode, activeElder } = useAuth();
  const { language, t } = useLanguage();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPairOpen, setIsPairOpen] = useState(false);
  const [caregiverTab, setCaregiverTab] = useState<'MEDICATIONS' | 'APPOINTMENTS' | 'ALERTS'>('MEDICATIONS');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. Global Navigation Bar */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenPair={() => setIsPairOpen(true)}
      />

      {/* 2. Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* If in ELDER MODE */}
        {activeMode === 'ELDER' ? (
          <div className="space-y-6">
            {/* Senior Friendly Top Banner */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-2xl shadow-2xs">
                  👴
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span>{t.greetingNamaste}, {elderProfile?.fullName || user?.name || 'Dada Ji'}</span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* SOS Emergency Call Button & Passcode Pill */}
              <div className="flex items-center gap-3">
                {elderProfile && (
                  <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                    <span>{t.pairCodeLabel}:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300 font-bold text-teal-800">
                      {elderProfile.carePasscode}
                    </span>
                  </div>
                )}
                <a
                  href={`tel:${elderProfile?.emergencyContact || '+919876543210'}`}
                  className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm shadow-rose-600/20"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{t.emergencySos}</span>
                </a>
              </div>
            </div>

            {/* Elder Mode Visual Pillbox (Phase F2 Complete) */}
            <VisualPillbox />
          </div>
        ) : (
          /* CAREGIVER DASHBOARD MODE */
          <div className="space-y-6">
            {/* Caregiver Welcome Banner */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  Caregiver Executive Dashboard
                </span>
                <h1 className="text-xl font-bold text-slate-900 mt-1">
                  Monitoring: {activeElder?.fullName || 'Elder Care Circle'}
                </h1>
                <p className="text-xs text-slate-500">
                  Real-time adherence monitoring, prescription uploads, and clinical briefings.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsPairOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition"
                >
                  <span>Link New Elder</span>
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-semibold">Today's Adherence</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900">94%</div>
                <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
                  56 of 60 doses taken on-time
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-semibold">Active Medications</span>
                  <Pill className="w-4 h-4 text-teal-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900">2 Regimens</div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Telmisartan (BP) & Metformin (Sugar)
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-semibold">Next Doctor Visit</span>
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-sm font-bold text-slate-900 mt-1">Dr. Arvind Sharma</div>
                <div className="text-[11px] text-slate-500 font-medium">Cardiology (Max Hospital)</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-semibold">Safety Alerts</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900">All Clear</div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Zero critical escalations active
                </div>
              </div>
            </div>

            {/* Caregiver Navigation Tabs (Phase F3 & F4) */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
              <button
                onClick={() => setCaregiverTab('MEDICATIONS')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  caregiverTab === 'MEDICATIONS'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Pill className="w-3.5 h-3.5" />
                <span>Medication Studio & AI Scanner</span>
              </button>

              <button
                onClick={() => setCaregiverTab('APPOINTMENTS')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  caregiverTab === 'APPOINTMENTS'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Doctor Visits & 30-Day Briefcase</span>
              </button>

              <button
                onClick={() => setCaregiverTab('ALERTS')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  caregiverTab === 'ALERTS'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Safety Alerts Feed</span>
              </button>
            </div>

            {/* Tab Viewport */}
            {caregiverTab === 'MEDICATIONS' && <MedicineStudio />}
            {caregiverTab === 'APPOINTMENTS' && <DoctorAppointments />}
            {caregiverTab === 'ALERTS' && <AlertsFeed />}
          </div>
        )}
      </main>

      {/* 3. Clean Medical Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-700">AayuCare (आयु-Care)</span>
            <span>—</span>
            <span>Elderly Care & Medication Safety Platform</span>
          </div>
          <div>
            Catalyst x PromptWars 2026 • Powered by Google for Developers & Adaption AI
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <PairElderModal isOpen={isPairOpen} onClose={() => setIsPairOpen(false)} />
    </div>
  );
};
