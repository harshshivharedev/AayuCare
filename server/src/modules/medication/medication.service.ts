import {
  IMedicationRepository,
  MedicationRecord,
  MedicationLogRecord,
  PillboxItem,
} from './medication.repository';
import { CreateMedicationInput, ConfirmDoseInput, UpdateMedicationInput } from './medication.schema';
import { ApiError } from '../../utils/apiError';
import { MedicationLogStatus, ConfirmationMethod } from '@prisma/client';

export class MedicationService {
  constructor(private readonly repo: IMedicationRepository) {}

  async createMedication(input: CreateMedicationInput): Promise<MedicationRecord> {
    return await this.repo.create({
      elderProfileId: input.elderProfileId,
      name: input.name,
      dosage: input.dosage,
      frequency: input.frequency,
      scheduleTimes: input.scheduleTimes,
      mealRelation: input.mealRelation,
      criticality: input.criticality,
      pillImageUrl: input.pillImageUrl || null,
      dietaryGuidelines: input.dietaryGuidelines || [],
      instructions: input.instructions || null,
      isActive: true,
    });
  }

  async getPillboxToday(elderProfileId: string): Promise<PillboxItem[]> {
    const meds = await this.repo.findByElderId(elderProfileId, true);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const pillboxItems: PillboxItem[] = [];

    for (const med of meds) {
      const todayLogs = await this.repo.findLogsForMedication(med.id, startOfDay, endOfDay);
      const lastTaken = await this.repo.findLastTakenLog(med.id);

      let isLockedOut = false;
      let lockoutExpiresAt: Date | null = null;

      if (lastTaken && lastTaken.takenAt) {
        const timeSinceTakenMs = now.getTime() - lastTaken.takenAt.getTime();
        const sixHoursMs = 6 * 60 * 60 * 1000;

        if (timeSinceTakenMs < sixHoursMs) {
          isLockedOut = true;
          lockoutExpiresAt = new Date(lastTaken.takenAt.getTime() + sixHoursMs);
        }
      }

      // Find next scheduled time today
      const currentHoursMinutes = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const nextScheduledTime = med.scheduleTimes.find((t) => t >= currentHoursMinutes) || med.scheduleTimes[0] || null;

      pillboxItems.push({
        medication: med,
        todayLogs,
        isLockedOut,
        lockoutExpiresAt,
        nextScheduledTime,
      });
    }

    return pillboxItems;
  }

  async confirmDose(input: ConfirmDoseInput): Promise<{
    log: MedicationLogRecord;
    message: string;
    shieldActive: boolean;
    lockoutUntil: Date;
  }> {
    const med = await this.repo.findById(input.medicationId);
    if (!med) throw ApiError.notFound('Medication not found');

    const now = new Date();
    const lastTaken = await this.repo.findLastTakenLog(input.medicationId);

    // Anti-Overdose 6-Hour Lockout Shield
    if (lastTaken && lastTaken.takenAt && !input.overrideLockout) {
      const timeSinceMs = now.getTime() - lastTaken.takenAt.getTime();
      const sixHoursMs = 6 * 60 * 60 * 1000;

      if (timeSinceMs < sixHoursMs) {
        const unlockTime = new Date(lastTaken.takenAt.getTime() + sixHoursMs);
        const hoursLeft = Math.ceil((sixHoursMs - timeSinceMs) / (60 * 60 * 1000));
        throw ApiError.badRequest(
          `ANTI_OVERDOSE_SHIELD: ${med.name} was already taken at ${lastTaken.takenAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Safe lockout active for ~${hoursLeft}h until ${unlockTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
        );
      }
    }

    const scheduledDate = input.scheduledFor ? new Date(input.scheduledFor) : now;
    const confirmationMethod = (input.confirmationMethod as ConfirmationMethod) || ConfirmationMethod.BUTTON_TAP;

    const log = await this.repo.createLog({
      medicationId: med.id,
      scheduledFor: scheduledDate,
      takenAt: now,
      status: MedicationLogStatus.TAKEN,
      confirmationMethod,
      notes: input.voiceTranscript
        ? `Voice Confirmed: "${input.voiceTranscript}"`
        : input.notes || 'Confirmed via touch target',
    });

    const lockoutUntil = new Date(now.getTime() + 6 * 60 * 60 * 1000);

    return {
      log,
      message: `Dose confirmed for ${med.name}. Green Shield anti-overdose protection active until ${lockoutUntil.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      shieldActive: true,
      lockoutUntil,
    };
  }

  async getAdherenceRate(elderProfileId: string, days = 7): Promise<{
    totalScheduled: number;
    totalTaken: number;
    adherencePercentage: number;
    criticalMissed: number;
  }> {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const logs = await this.repo.findLogsForElder(elderProfileId, startDate, now);

    const totalScheduled = logs.length;
    const totalTaken = logs.filter((l) => l.status === MedicationLogStatus.TAKEN).length;
    const criticalMissed = logs.filter(
      (l) => l.status === MedicationLogStatus.MISSED && l.medication.criticality === 'HIGH_RISK'
    ).length;

    const adherencePercentage =
      totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 100;

    return {
      totalScheduled,
      totalTaken,
      adherencePercentage,
      criticalMissed,
    };
  }

  async getMedications(elderProfileId: string): Promise<MedicationRecord[]> {
    return await this.repo.findByElderId(elderProfileId, false);
  }

  async updateMedication(id: string, input: UpdateMedicationInput): Promise<MedicationRecord> {
    return await this.repo.update(id, input as any);
  }

  async deleteMedication(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
