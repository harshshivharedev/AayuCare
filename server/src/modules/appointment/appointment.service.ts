import { IAppointmentRepository, AppointmentRecord } from './appointment.repository';
import { IMedicationRepository } from '../medication/medication.repository';
import { ICareCircleRepository } from '../care-circle/careCircle.repository';
import { CreateAppointmentInput, UpdateAppointmentInput } from './appointment.schema';
import { ApiError } from '../../utils/apiError';
import { AppointmentStatus, MedicationLogStatus } from '@prisma/client';

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
  activePrescriptions: {
    name: string;
    dosage: string;
    scheduleTimes: string[];
    mealRelation: string;
    criticality: string;
    dietaryGuidelines: string[];
  }[];
  upcomingAppointments: {
    doctorName: string;
    specialty: string;
    date: Date;
    clinicAddress: string;
    prepNotes: string | null;
  }[];
  generatedAt: Date;
}

export class AppointmentService {
  constructor(
    private readonly repo: IAppointmentRepository,
    private readonly medRepo: IMedicationRepository,
    private readonly elderRepo: ICareCircleRepository
  ) {}

  async createAppointment(input: CreateAppointmentInput): Promise<AppointmentRecord> {
    return await this.repo.create({
      elderProfileId: input.elderProfileId,
      doctorName: input.doctorName,
      specialty: input.specialty,
      clinicAddress: input.clinicAddress,
      appointmentDate: new Date(input.appointmentDate),
      status: AppointmentStatus.UPCOMING,
      prepNotes: input.prepNotes || null,
    });
  }

  async getAppointments(elderProfileId: string): Promise<AppointmentRecord[]> {
    return await this.repo.findByElderId(elderProfileId);
  }

  async updateAppointment(id: string, input: UpdateAppointmentInput): Promise<AppointmentRecord> {
    const data: Partial<AppointmentRecord> = { ...input } as any;
    if (input.appointmentDate) {
      data.appointmentDate = new Date(input.appointmentDate);
    }
    return await this.repo.update(id, data);
  }

  async deleteAppointment(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async generateClinicalBriefcase(elderProfileId: string): Promise<ClinicalBriefcaseReport> {
    const elder = await this.elderRepo.findById(elderProfileId);
    if (!elder) throw ApiError.notFound('Elder profile not found');

    const meds = await this.medRepo.findByElderId(elderProfileId, true);
    const appointments = await this.repo.findByElderId(elderProfileId);

    // 30-day log history
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const logs = await this.medRepo.findLogsForElder(elderProfileId, thirtyDaysAgo, now);

    const totalDoses = logs.length;
    const takenDoses = logs.filter((l) => l.status === MedicationLogStatus.TAKEN).length;
    const criticalMissed = logs.filter(
      (l) => l.status === MedicationLogStatus.MISSED && l.medication.criticality === 'HIGH_RISK'
    ).length;

    const complianceScore = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

    return {
      patient: {
        fullName: elder.fullName,
        age: elder.age,
        bloodGroup: elder.bloodGroup,
        emergencyContact: elder.emergencyContact,
        notes: elder.notes,
      },
      adherenceSummary: {
        complianceScore,
        totalDosesMonitored: totalDoses,
        dosesTakenOnTime: takenDoses,
        criticalMissed,
      },
      activePrescriptions: meds.map((m) => ({
        name: m.name,
        dosage: m.dosage,
        scheduleTimes: m.scheduleTimes,
        mealRelation: m.mealRelation,
        criticality: m.criticality,
        dietaryGuidelines: m.dietaryGuidelines,
      })),
      upcomingAppointments: appointments
        .filter((a) => a.status === AppointmentStatus.UPCOMING)
        .map((a) => ({
          doctorName: a.doctorName,
          specialty: a.specialty,
          date: a.appointmentDate,
          clinicAddress: a.clinicAddress,
          prepNotes: a.prepNotes,
        })),
      generatedAt: now,
    };
  }
}
