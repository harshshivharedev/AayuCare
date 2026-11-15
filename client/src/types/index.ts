export type UserRole = 'ELDERLY' | 'CAREGIVER' | 'FAMILY' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface HealthCheckData {
  status: string;
  uptimeSeconds: number;
  database: {
    status: string;
    latencyMs: number;
  };
  system: {
    memoryHeapUsedMB: number;
    nodeVersion: string;
  };
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
  dietaryGuidelines: string[];
  instructions: string | null;
  isActive: boolean;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  scheduledFor: string;
  takenAt: string | null;
  status: 'SCHEDULED' | 'TAKEN' | 'MISSED' | 'SKIPPED';
  confirmationMethod: 'VOICE' | 'BUTTON_TAP' | 'CAREGIVER_OVERRIDE' | 'SYSTEM_AUTO' | null;
  notes: string | null;
}

export interface PillboxItem {
  medication: Medication;
  todayLogs: MedicationLog[];
  isLockedOut: boolean;
  lockoutExpiresAt: string | null;
  nextScheduledTime: string | null;
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

export interface AlertNotification {
  id: string;
  elderProfileId: string;
  recipientEmail: string;
  alertType: 'MISSED_DOSE' | 'UPCOMING_DOSE' | 'APPOINTMENT';
  title: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt: string | null;
  createdAt: string;
}

export interface ClinicalBriefcaseReport {
  patient: {
    fullName: string;
    age: number;
    bloodGroup: string | null;
    emergencyContact: string;
    notes: string | null;
  };
  adherenceSummary: {
    complianceScore: number;
    totalDosesMonitored: number;
    dosesTakenOnTime: number;
    criticalMissed: number;
  };
  activePrescriptions: Array<{
    name: string;
    dosage: string;
    scheduleTimes: string[];
    mealRelation: string;
    criticality: string;
    dietaryGuidelines: string[];
  }>;
  upcomingAppointments: Array<{
    doctorName: string;
    specialty: string;
    date: string;
    clinicAddress: string;
    prepNotes: string | null;
  }>;
  generatedAt: string;
}

export interface AdherenceStats {
  totalScheduled: number;
  totalTaken: number;
  adherencePercentage: number;
  criticalMissed: number;
}
