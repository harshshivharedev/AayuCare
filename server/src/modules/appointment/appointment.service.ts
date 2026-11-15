import { IAppointmentRepository, ClinicalBriefcaseRawData } from './appointment.repository';
import { CreateAppointmentInput, UpdateAppointmentInput } from './appointment.schema';
import { Appointment, AppointmentStatus } from '@prisma/client';
import { ApiError } from '../../utils/apiError';

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
  activeRegimen: {
    id: string;
    name: string;
    dosage: string;
    scheduleTimes: string[];
    mealRelation: string;
    criticality: string;
    instructions: string | null;
  }[];
  missedDosesLog: {
    medicationName: string;
    dosage: string;
    scheduledFor: Date;
    status: string;
  }[];
  recentAppointments: Appointment[];
  generatedAt: string;
}

export class AppointmentService {
  constructor(private readonly repo: IAppointmentRepository) {}

  async createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    const appointmentDate = new Date(input.appointmentDate);
    if (isNaN(appointmentDate.getTime())) {
      throw ApiError.badRequest('Invalid appointment date format');
    }

    return await this.repo.create({
      elderProfileId: input.elderProfileId,
      doctorName: input.doctorName,
      specialty: input.specialty,
      clinicAddress: input.clinicAddress,
      appointmentDate,
      prepNotes: input.prepNotes
    });
  }

  async getAppointmentsByElder(elderProfileId: string): Promise<Appointment[]> {
    return await this.repo.findByElderId(elderProfileId);
  }

  async getUpcomingAppointments(elderProfileId: string): Promise<Appointment[]> {
    const now = new Date();
    return await this.repo.findUpcoming(elderProfileId, now);
  }

  async updateAppointment(id: string, input: UpdateAppointmentInput): Promise<Appointment> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw ApiError.notFound('Appointment not found');
    }

    const dataToUpdate: Partial<Appointment> = {};
    if (input.doctorName) dataToUpdate.doctorName = input.doctorName;
    if (input.specialty) dataToUpdate.specialty = input.specialty;
    if (input.clinicAddress !== undefined) dataToUpdate.clinicAddress = input.clinicAddress;
    if (input.appointmentDate) dataToUpdate.appointmentDate = new Date(input.appointmentDate);
    if (input.status) dataToUpdate.status = input.status as AppointmentStatus;
    if (input.prepNotes !== undefined) dataToUpdate.prepNotes = input.prepNotes;

    return await this.repo.update(id, dataToUpdate);
  }

  async deleteAppointment(id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw ApiError.notFound('Appointment not found');
    }
    await this.repo.delete(id);
  }

  /**
   * Generates the 30-Day Clinical Briefcase for Doctor Consultations
   */
  async getClinicalBriefcase(
    elderProfileId: string,
    days = 30
  ): Promise<ClinicalBriefcaseResponse> {
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rawData = await this.repo.getClinicalBriefcaseRawData(elderProfileId, sinceDate);

    if (!rawData.elder) {
      throw ApiError.notFound('Elder profile not found for clinical briefcase');
    }

    const totalScheduled = rawData.totalScheduled;
    const totalTaken = rawData.totalTaken;
    const missedDosesCount = rawData.missedDoses.length;

    const adherenceRate =
      totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 100;

    let adherenceRating: 'EXCELLENT' | 'MODERATE' | 'CRITICAL_ATTENTION_NEEDED' = 'EXCELLENT';
    if (adherenceRate < 75) {
      adherenceRating = 'CRITICAL_ATTENTION_NEEDED';
    } else if (adherenceRate < 90) {
      adherenceRating = 'MODERATE';
    }

    const executiveSummary = `Patient ${rawData.elder.fullName} (${rawData.elder.age} yrs, ${
      rawData.elder.bloodGroup || 'Blood Group N/A'
    }) has maintained a ${adherenceRating} adherence score of ${adherenceRate}% over the past ${days} days (${totalTaken}/${totalScheduled} scheduled doses taken). ${
      missedDosesCount > 0
        ? `${missedDosesCount} missed dose(s) logged.`
        : 'Zero missed doses logged.'
    } Currently active on ${rawData.activeMedications.length} medication regimen(s).`;

    return {
      elder: rawData.elder,
      metrics: {
        analysisPeriodDays: days,
        adherenceRate,
        adherenceRating,
        totalScheduledDoses: totalScheduled,
        totalTakenDoses: totalTaken,
        missedDosesCount
      },
      executiveSummary,
      activeRegimen: rawData.activeMedications.map((m) => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage,
        scheduleTimes: m.scheduleTimes,
        mealRelation: m.mealRelation,
        criticality: m.criticality,
        instructions: m.instructions
      })),
      missedDosesLog: rawData.missedDoses.map((l) => ({
        medicationName: l.medicationName,
        dosage: l.dosage,
        scheduledFor: l.scheduledFor,
        status: l.status
      })),
      recentAppointments: rawData.recentAppointments,
      generatedAt: new Date().toISOString()
    };
  }
}
