import React, { useState } from 'react';
import {
  ElderProfile,
  Medication,
  Appointment,
  AlertNotification,
  AdherenceStats,
  ClinicalBriefcaseReport,
} from '../types';
import { ApiClient } from '../services/api';
import {
  Shield,
  FileText,
  Calendar,
  Bell,
  Sparkles,
  Plus,
  CheckCircle,
  AlertCircle,
  Download,
  Printer,
  X,
  Send,
  Loader2,
  HeartPulse,
} from 'lucide-react';

interface CaregiverCockpitProps {
  elder: ElderProfile;
  medications: Medication[];
  appointments: Appointment[];
  alerts: AlertNotification[];
  adherence: AdherenceStats | null;
  onRefresh: () => void;
}

export const CaregiverCockpit: React.FC<CaregiverCockpitProps> = ({
  elder,
  medications,
  appointments,
  alerts,
  adherence,
  onRefresh,
}) => {
  // Prescription Scanner State
  const [prescriptionText, setPrescriptionText] = useState<string>('');
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scannerMsg, setScannerMsg] = useState<string | null>(null);

  // Clinical Briefcase Modal State
  const [briefcaseModalOpen, setBriefcaseModalOpen] = useState<boolean>(false);
  const [briefcaseData, setBriefcaseData] = useState<ClinicalBriefcaseReport | null>(null);
  const [briefcaseLoading, setBriefcaseLoading] = useState<boolean>(false);

  // Passcode Pairing State
  const [passcode, setPasscode] = useState<string>('');
  const [pairingLoading, setPairingLoading] = useState<boolean>(false);
  const [pairSuccess, setPairSuccess] = useState<string | null>(null);

  // Evaluate Alerts State
  const [evaluatingAlerts, setEvaluatingAlerts] = useState<boolean>(false);
  const [alertFeedback, setAlertFeedback] = useState<string | null>(null);

  // 1-Click Sample Prescription
  const loadSamplePrescription = () => {
    setPrescriptionText(`Dr. Anjali Mehta, MD (Cardiology)
Apollo Clinic, Sector 14, Gurugram
Patient: Ramesh Sharma, 74 M
Diagnosis: Grade-II Essential Hypertension & Type-2 Diabetes Mellitus

Rx:
1. Tab Telmisartan 40mg - 1 Tab OD (Morning after breakfast at 09:00 AM)
   Warning: Avoid excessive high-potassium intake.
2. Tab Metformin 500mg SR - 1 Tab OD (Night after dinner at 20:30 PM)
   Warning: Do not skip dinner; take with adequate lukewarm water.
3. Cap Neurobion Forte / Zinc - 1 Cap OD (Afternoon after lunch at 13:30 PM)

Advice: Restrict sodium to < 2g/day. Walk 20 minutes daily. Next review in 3 days.`);
  };

  // Run Adaption AI Prescription Scan
  const handleScanPrescription = async () => {
    if (!prescriptionText.trim()) return;
    setScanning(true);
    setScannerMsg(null);
    setScanResult(null);

    try {
      const res = await ApiClient.post<any>('/ai/scan-prescription', {
        prescriptionText: prescriptionText.trim(),
        dietaryPreference: 'Vegetarian Indian Diet',
      });

      setScanResult(res.data);
      setScannerMsg(res.message || 'Prescription scanned successfully via Adaption AI');
    } catch (err: any) {
      setScannerMsg(err.message || 'Error communicating with Adaption AI');
    } finally {
      setScanning(false);
    }
  };

  // 1-Click 30-Day Clinical Briefcase
  const handleOpenBriefcase = async () => {
    setBriefcaseModalOpen(true);
    setBriefcaseLoading(true);

    try {
      const res = await ApiClient.get<ClinicalBriefcaseReport>(`/appointments/briefcase/${elder.id}`);
      if (res.data) setBriefcaseData(res.data);
    } catch (err: any) {
      console.error('Failed to load briefcase:', err);
    } finally {
      setBriefcaseLoading(false);
    }
  };

  // Run Missed Dose Audit
  const handleEvaluateAlerts = async () => {
    setEvaluatingAlerts(true);
    setAlertFeedback(null);

    try {
      const res = await ApiClient.post<any>(`/alerts/evaluate/${elder.id}`, {});
      setAlertFeedback(res.message || 'Alert evaluation complete');
      onRefresh();
    } catch (err: any) {
      setAlertFeedback(err.message || 'Evaluation failed');
    } finally {
      setEvaluatingAlerts(false);
    }
  };

  // Pair with elder using passcode
  const handlePairPasscode = async () => {
    if (!passcode.trim()) return;
    setPairingLoading(true);
    setPairSuccess(null);

    try {
      const res = await ApiClient.post<any>('/care-circle/pair', {
        carePasscode: passcode.trim(),
      });
      setPairSuccess(res.message || 'Successfully paired!');
      setPasscode('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Invalid passcode');
    } finally {
      setPairingLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Caregiver Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-semibold text-xs">
            <Shield className="w-3.5 h-3.5" />
            <span>Caregiver & Family Ecosystem</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Caregiver Cockpit • <span className="text-indigo-400">{elder.fullName}</span> (74y, {elder.bloodGroup})
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Real-time adherence telemetry, doctor appointments, Adaption AI prescription scanner, and proactive email alert dispatch.
          </p>
        </div>

        {/* Passcode Badge */}
        <div className="bg-slate-950/90 border border-indigo-500/40 rounded-2xl p-4 text-center">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">
            Active CarePasscode
          </div>
          <div className="text-2xl font-mono font-black text-indigo-400 tracking-wider">
            {elder.carePasscode}
          </div>
          <div className="text-[10px] text-emerald-400 font-medium mt-1">● Synced with Bedside Kiosk</div>
        </div>
      </div>

      {/* Adherence Telemetry & Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Weekly Adherence</div>
          <div className="text-3xl font-black text-emerald-400">
            {adherence?.adherencePercentage ?? 95}%
          </div>
          <div className="text-xs text-slate-400">Target: &gt;90% for BP stability</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Active Medications</div>
          <div className="text-3xl font-black text-white">{medications.length}</div>
          <div className="text-xs text-slate-400">2 High-Risk, 1 Routine</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Upcoming Appointments</div>
          <div className="text-3xl font-black text-indigo-400">{appointments.length}</div>
          <div className="text-xs text-slate-400">Next: Dr. Anjali Mehta</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Doctor Clinical Export</div>
          <button
            onClick={handleOpenBriefcase}
            className="w-full mt-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <FileText className="w-4 h-4" />
            <span>1-Click Briefcase</span>
          </button>
          <div className="text-[11px] text-slate-400">30-day compliance summary</div>
        </div>
      </div>

      {/* Main Grid: Prescription Scanner + Appointments & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Adaption AI Prescription Scanner */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Prescription AI Scanner</h2>
                <p className="text-xs text-slate-400">Powered by Adaption AI Engine ($500 Credits)</p>
              </div>
            </div>

            <button
              onClick={loadSamplePrescription}
              className="py-1 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 font-medium text-xs border border-purple-500/30 transition-all"
            >
              Load Sample Rx
            </button>
          </div>

          <textarea
            value={prescriptionText}
            onChange={(e) => setPrescriptionText(e.target.value)}
            placeholder="Paste doctor prescription text or clinical notes here..."
            rows={7}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500 transition-colors"
          />

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleScanPrescription}
              disabled={scanning || !prescriptionText.trim()}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-purple-900/30"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing with Adaption AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Scan & Ingest Medication Schedule</span>
                </>
              )}
            </button>
          </div>

          {scannerMsg && (
            <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs font-semibold">
              {scannerMsg}
            </div>
          )}

          {/* Parsed JSON Preview */}
          {scanResult && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Extracted Prescription Details</span>
              </div>

              {scanResult.medications && (
                <div className="space-y-2">
                  {scanResult.medications.map((m: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{m.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-emerald-300">
                          {m.scheduleTimes?.join(', ')} • {m.mealRelation}
                        </span>
                      </div>
                      <div className="text-slate-400">Dosage: {m.dosage}</div>
                      {m.instructionsHindi && (
                        <div className="text-indigo-300 font-medium">🇮🇳 {m.instructionsHindi}</div>
                      )}
                      {m.dietaryGuidelines && (
                        <div className="text-amber-300 text-[11px]">
                          ⚠️ Food caution: {m.dietaryGuidelines.join('; ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Doctor Appointments & Proactive Alert Dispatch */}
        <div className="space-y-6">
          {/* Doctor Appointments Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Upcoming Doctor Visits</h2>
                  <p className="text-xs text-slate-400">Schedule & clinical preparation</p>
                </div>
              </div>

              <button
                onClick={handleOpenBriefcase}
                className="py-1.5 px-3 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export Briefcase</span>
              </button>
            </div>

            <div className="space-y-3">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{apt.doctorName}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {apt.specialty}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">{apt.clinicAddress}</div>
                  <div className="text-xs text-indigo-300 font-mono">
                    🗓️ {new Date(apt.appointmentDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                  {apt.prepNotes && (
                    <div className="text-xs text-amber-300/90 bg-amber-950/30 p-2 rounded-lg border border-amber-900/40">
                      📝 Prep: {apt.prepNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Proactive Email Alerts Center */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Proactive Alert Center</h2>
                  <p className="text-xs text-slate-400">Missed doses & email dispatch telemetry</p>
                </div>
              </div>

              <button
                onClick={handleEvaluateAlerts}
                disabled={evaluatingAlerts}
                className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {evaluatingAlerts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Evaluate Now</span>
              </button>
            </div>

            {alertFeedback && (
              <div className="p-3 rounded-xl bg-slate-950 text-xs text-slate-300 border border-slate-800">
                {alertFeedback}
              </div>
            )}

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="text-xs text-slate-500 p-4 text-center">No alerts recorded today.</div>
              ) : (
                alerts.map((al) => (
                  <div
                    key={al.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{al.title}</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        {al.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">{al.message}</p>
                    <div className="text-[10px] text-slate-500">
                      Sent to: {al.recipientEmail} • {new Date(al.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Briefcase Modal */}
      {briefcaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">30-Day Clinical Adherence Briefcase</h3>
                  <p className="text-xs text-slate-400">Standardized physician handover document</p>
                </div>
              </div>

              <button
                onClick={() => setBriefcaseModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {briefcaseLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                <span>Compiling patient telemetry...</span>
              </div>
            ) : briefcaseData ? (
              <div className="space-y-6 text-sm text-slate-300">
                {/* Patient Summary Header */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 block">Patient Name:</span>
                    <strong className="text-white text-sm">{briefcaseData.patient.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Age / Gender / Blood:</span>
                    <strong className="text-white text-sm">{briefcaseData.patient.age}y / M / {briefcaseData.patient.bloodGroup}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">30-Day Adherence:</span>
                    <strong className="text-emerald-400 text-sm">{briefcaseData.adherenceSummary.complianceScore}%</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Critical Misses:</span>
                    <strong className="text-rose-400 text-sm">{briefcaseData.adherenceSummary.criticalMissed}</strong>
                  </div>
                </div>

                {/* Active Prescriptions Table */}
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                    Current Active Regimen ({briefcaseData.activePrescriptions.length} Meds)
                  </h4>
                  <div className="space-y-2">
                    {briefcaseData.activePrescriptions.map((m, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-white text-sm">{m.name}</strong>
                          <div className="text-slate-400">
                            {m.dosage} • {m.scheduleTimes.join(', ')} ({m.mealRelation})
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          m.criticality === 'HIGH_RISK' ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {m.criticality}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Consultation */}
                {briefcaseData.upcomingAppointments.length > 0 && (
                  <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs space-y-1">
                    <strong className="text-indigo-300 block">Next Scheduled Consultation:</strong>
                    <div className="text-white font-medium">
                      {briefcaseData.upcomingAppointments[0].doctorName} ({briefcaseData.upcomingAppointments[0].specialty})
                    </div>
                    <div className="text-slate-400">
                      {briefcaseData.upcomingAppointments[0].clinicAddress}
                    </div>
                  </div>
                )}

                {/* Modal Footer with Print */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => window.print()}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition-all border border-slate-700"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Clinical Handover</span>
                  </button>
                  <button
                    onClick={() => setBriefcaseModalOpen(false)}
                    className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
