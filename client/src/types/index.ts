export type UserRole = 'ELDERLY' | 'CAREGIVER' | 'FAMILY' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface ElderProfile {
  id: string;
  userId: string;
  fullName: string;
  age: number;
  bloodGroup: string | null;
  emergencyContact: string;
  carePasscode: string;
  notes: string | null;
}

export interface CareCircleMember {
  id: string;
  elderProfileId: string;
  userId: string;
  userName: string;
  userEmail: string;
  accessRole: 'PRIMARY_ADMIN' | 'OBSERVER';
  grantedAt: string;
}

export interface Medication {
  id: string;
  elderProfileId: string;
  name: string;
  dosage: string;
  frequency: string;
  scheduleTimes: string[];
  mealRelation: 'BEFORE_MEAL' | 'AFTER_MEAL' | 'WITH_MEAL' | 'ANYTIME';
  criticality: 'HIGH_RISK' | 'ROUTINE';
  pillImageUrl: string | null;
  voiceNoteUrl: string | null;
  voiceNoteText: string | null;
  dietaryGuidelines: string[];
  instructions: string | null;
  isActive: boolean;
}

export type TimeSlot = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

export interface PillboxSlotItem {
  id: string; // medicationId
  logId?: string;
  name: string;
  dosage: string;
  mealRelation: 'BEFORE_MEAL' | 'AFTER_MEAL' | 'WITH_MEAL' | 'ANYTIME';
  criticality: 'HIGH_RISK' | 'ROUTINE';
  pillImageUrl: string | null;
  voiceNoteUrl: string | null;
  voiceNoteText: string | null;
  dietaryGuidelines: string[];
  instructions: string | null;
  scheduledTime: string;
  timeSlot: TimeSlot;
  status: 'SCHEDULED' | 'TAKEN' | 'MISSED' | 'SKIPPED';
  takenAt: string | null;
  isDueNow: boolean;
}

export interface TodayPillboxResponse {
  elderProfileId: string;
  date: string;
  summary: {
    totalDoses: number;
    takenDoses: number;
    pendingDoses: number;
  };
  slots: {
    morning: PillboxSlotItem[];
    afternoon: PillboxSlotItem[];
    evening: PillboxSlotItem[];
    night: PillboxSlotItem[];
  };
}

export interface Appointment {
  id: string;
  elderProfileId: string;
  doctorName: string;
  specialty: string;
  clinicAddress: string;
  appointmentDate: string;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  prepNotes: string | null;
}

export interface ClinicalBriefcaseResponse {
  elder: {
    id: string;
    fullName: string;
    age: number;
    bloodGroup: string | null;
    emergencyContact: string;
    notes: string | null;
  };
  metrics: {
    analysisPeriodDays: number;
    adherenceRate: number;
    adherenceRating: 'EXCELLENT' | 'MODERATE' | 'CRITICAL_ATTENTION_NEEDED';
    totalScheduledDoses: number;
    totalTakenDoses: number;
    missedDosesCount: number;
  };
  executiveSummary: string;
  activeRegimen: Array<{
    id: string;
    name: string;
    dosage: string;
    scheduleTimes: string[];
    mealRelation: string;
    criticality: string;
    instructions: string | null;
  }>;
  missedDosesLog: Array<{
    medicationName: string;
    dosage: string;
    scheduledFor: string;
    status: string;
  }>;
  recentAppointments: Appointment[];
  generatedAt: string;
}

export interface AlertNotification {
  id: string;
  elderProfileId: string;
  recipientEmail: string;
  alertType: 'MISSED_DOSE' | 'UPCOMING_DOSE' | 'APPOINTMENT';
  title: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'ACKNOWLEDGED' | 'FAILED';
  createdAt: string;
}

export interface AlertFeedResponse {
  elderProfileId: string;
  totalAlerts: number;
  unreadCount: number;
  alerts: AlertNotification[];
}
