import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ElderAmbientMode } from './components/ElderAmbientMode';
import { CaregiverCockpit } from './components/CaregiverCockpit';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './context/AuthContext';
import { ApiClient } from './services/api';
import {
  HealthCheckData,
  ElderProfile,
  PillboxItem,
  Medication,
  Appointment,
  AlertNotification,
  AdherenceStats,
} from './types';
import { Sparkles, HeartPulse, ShieldAlert, ArrowLeftRight } from 'lucide-react';

// Default Fallback Elder Data for instantaneous rendering
const defaultElder: ElderProfile = {
  id: 'elder-ramesh-001',
  userId: 'user-ramesh-001',
  fullName: 'Ramesh Sharma',
  age: 74,
  bloodGroup: 'B+',
  emergencyContact: '+91 98765 43210',
  carePasscode: 'CARE-8421',
  notes: 'Hypertension (BP) and Type-2 Diabetes management. Mild morning disorientation.',
};

const defaultPillbox: PillboxItem[] = [
  {
    medication: {
      id: 'med-bp-001',
      elderProfileId: 'elder-ramesh-001',
      name: 'Telmisartan 40mg',
      dosage: '1 Round White Tablet',
      frequency: 'DAILY',
      scheduleTimes: ['09:00'],
      mealRelation: 'AFTER_MEAL',
      criticality: 'HIGH_RISK',
      pillImageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=60',
      dietaryGuidelines: [
        'Take within 30 minutes after breakfast',
        'Avoid high-potassium salt substitutes',
        'Drink a full glass of lukewarm water',
      ],
      instructions: 'Subah nashte ke baad lein. BP niyantran ke liye anivarya hai.',
      isActive: true,
    },
    todayLogs: [],
    isLockedOut: false,
    lockoutExpiresAt: null,
    nextScheduledTime: '09:00',
  },
  {
    medication: {
      id: 'med-diabetes-002',
      elderProfileId: 'elder-ramesh-001',
      name: 'Metformin 500mg SR',
      dosage: '1 Oval Blue Tablet',
      frequency: 'DAILY',
      scheduleTimes: ['20:30'],
      mealRelation: 'AFTER_MEAL',
      criticality: 'HIGH_RISK',
      pillImageUrl: 'https://images.unsplash.com/photo-1550572017-ed200f5e5a43?w=400&auto=format&fit=crop&q=60',
      dietaryGuidelines: [
        'Strictly take during or immediately after dinner',
        'Do not skip meals before taking this medicine',
        'Avoid sugary snacks late at night',
      ],
      instructions: 'Raat ke khane ke turant baad lein. Sugar niyantrit rakhta hai.',
      isActive: true,
    },
    todayLogs: [],
    isLockedOut: false,
    lockoutExpiresAt: null,
    nextScheduledTime: '20:30',
  },
  {
    medication: {
      id: 'med-multi-003',
      elderProfileId: 'elder-ramesh-001',
      name: 'Neurobion Forte / Zinc',
      dosage: '1 Red Strip Capsule',
      frequency: 'DAILY',
      scheduleTimes: ['13:30'],
      mealRelation: 'AFTER_MEAL',
      criticality: 'ROUTINE',
      pillImageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&auto=format&fit=crop&q=60',
      dietaryGuidelines: [
        'Take after lunch',
        'Supports nerve health and daily energy',
      ],
      instructions: 'Dopahar ke khane ke baad lein.',
      isActive: true,
    },
    todayLogs: [],
    isLockedOut: false,
    lockoutExpiresAt: null,
    nextScheduledTime: '13:30',
  },
];

const defaultAppointments: Appointment[] = [
  {
    id: 'apt-mehta-001',
    elderProfileId: 'elder-ramesh-001',
    doctorName: 'Dr. Anjali Mehta',
    specialty: 'Cardiologist & Geriatric Care',
    clinicAddress: 'Apollo Clinic, Sector 14, Gurugram (Room 204)',
    appointmentDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    status: 'UPCOMING',
    prepNotes: 'Bring fasting BP log book & last HbA1c test reports. Doctor requested to check potassium levels.',
  },
];

const defaultAlerts: AlertNotification[] = [
  {
    id: 'alert-001',
    elderProfileId: 'elder-ramesh-001',
    recipientEmail: 'priya.sharma@aayucare.in',
    alertType: 'APPOINTMENT',
    title: 'Upcoming Cardiologist Appointment in 3 Days',
    message: 'Dr. Anjali Mehta at Apollo Clinic on Nov 18, 10:30 AM.',
    status: 'SENT',
    sentAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

export const App: React.FC = () => {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<'elder' | 'caregiver'>('elder');
  const [health, setHealth] = useState<HealthCheckData | null>(null);

  // Core Data States
  const [elder, setElder] = useState<ElderProfile>(defaultElder);
  const [pillbox, setPillbox] = useState<PillboxItem[]>(defaultPillbox);
  const [medications, setMedications] = useState<Medication[]>(defaultPillbox.map((p) => p.medication));
  const [appointments, setAppointments] = useState<Appointment[]>(defaultAppointments);
  const [alerts, setAlerts] = useState<AlertNotification[]>(defaultAlerts);
  const [adherence, setAdherence] = useState<AdherenceStats | null>({
    totalScheduled: 21,
    totalTaken: 20,
    adherencePercentage: 95,
    criticalMissed: 0,
  });

  // Fetch telemetry from backend
  const loadData = useCallback(async () => {
    try {
      const [healthRes, pillboxRes, apptRes, alertRes, adhRes] = await Promise.allSettled([
        ApiClient.get<HealthCheckData>('/health'),
        ApiClient.get<PillboxItem[]>('/medications/pillbox'),
        ApiClient.get<Appointment[]>('/appointments'),
        ApiClient.get<AlertNotification[]>('/alerts'),
        ApiClient.get<AdherenceStats>('/medications/adherence'),
      ]);

      if (healthRes.status === 'fulfilled' && healthRes.value.data) {
        setHealth(healthRes.value.data);
      }
      if (pillboxRes.status === 'fulfilled' && pillboxRes.value.data && pillboxRes.value.data.length > 0) {
        setPillbox(pillboxRes.value.data);
        setMedications(pillboxRes.value.data.map((p) => p.medication));
      }
      if (apptRes.status === 'fulfilled' && apptRes.value.data && apptRes.value.data.length > 0) {
        setAppointments(apptRes.value.data);
      }
      if (alertRes.status === 'fulfilled' && alertRes.value.data && alertRes.value.data.length > 0) {
        setAlerts(alertRes.value.data);
      }
      if (adhRes.status === 'fulfilled' && adhRes.value.data) {
        setAdherence(adhRes.value.data);
      }
    } catch (err) {
      console.warn('Backend loading in fallback mode:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onOpenAuth={() => setAuthOpen(true)}
        systemHealth={health?.status || 'UP'}
        activeMode={activeMode}
        onModeChange={(m) => setActiveMode(m)}
        passcode={elder.carePasscode}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeMode === 'elder' ? (
          <ElderAmbientMode elder={elder} pillbox={pillbox} onRefresh={loadData} />
        ) : (
          <CaregiverCockpit
            elder={elder}
            medications={medications}
            appointments={appointments}
            alerts={alerts}
            adherence={adherence}
            onRefresh={loadData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/70 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <HeartPulse className="w-4 h-4 text-emerald-400" />
            <span>AayuCare (आयु-Care) • Catalyst x PromptWars Hackathon 2026</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Powered by Adaption AI & Gemini Flash</span>
            <span>•</span>
            <span>WCAG AAA Accessible</span>
            <span>•</span>
            <span>PostgreSQL & Prisma</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};
