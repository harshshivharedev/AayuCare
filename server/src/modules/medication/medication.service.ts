import { IMedicationRepository } from './medication.repository';
import { CreateMedicationInput, UpdateMedicationInput, ConfirmDoseInput } from './medication.schema';
import { Medication, MedicationLog, LogStatus, ConfirmationMethod, MealRelation, Criticality } from '@prisma/client';
import { ApiError } from '../../utils/apiError';
import { ICacheService, InMemoryCacheService } from '../../infrastructure/cache.service';

export type TimeSlot = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

export interface PillboxItem {
  id: string; // medicationId
  logId?: string;
  name: string;
  dosage: string;
  mealRelation: MealRelation;
  criticality: Criticality;
  pillImageUrl: string | null;
  voiceNoteUrl: string | null;
  voiceNoteText: string | null;
  dietaryGuidelines: string[];
  instructions: string | null;
  scheduledTime: string; // "14:00"
  timeSlot: TimeSlot;
  status: LogStatus;
  takenAt: Date | null;
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
    morning: PillboxItem[];
    afternoon: PillboxItem[];
    evening: PillboxItem[];
    night: PillboxItem[];
  };
}

export interface ConfirmDoseResult {
  log: MedicationLog;
  medication: Medication;
  soundAlert: string;
  voiceNoteUrl: string | null;
  voiceNoteText: string | null;
  message: string;
}

export class MedicationService {
  constructor(
    private readonly repo: IMedicationRepository,
    private readonly cache: ICacheService = new InMemoryCacheService()
  ) {}

  async createMedication(input: CreateMedicationInput): Promise<Medication> {
    const med = await this.repo.create({
      elderProfileId: input.elderProfileId,
      name: input.name,
      dosage: input.dosage,
      frequency: input.frequency || 'DAILY',
      scheduleTimes: input.scheduleTimes,
      mealRelation: (input.mealRelation as MealRelation) || MealRelation.AFTER_MEAL,
      criticality: (input.criticality as Criticality) || Criticality.ROUTINE,
      pillImageUrl: input.pillImageUrl,
      voiceNoteUrl: input.voiceNoteUrl,
      voiceNoteText: input.voiceNoteText,
      dietaryGuidelines: input.dietaryGuidelines || [],
      instructions: input.instructions
    });

    await this.cache.del(`pillbox:${input.elderProfileId}`);
    return med;
  }

  async getMedicationsByElder(elderProfileId: string): Promise<Medication[]> {
    return await this.repo.findByElderId(elderProfileId);
  }

  async getMedicationById(id: string): Promise<Medication> {
    const med = await this.repo.findById(id);
    if (!med) {
      throw ApiError.notFound('Medication not found');
    }
    return med;
  }

  async updateMedication(id: string, input: UpdateMedicationInput): Promise<Medication> {
    const med = await this.getMedicationById(id);
    const updated = await this.repo.update(id, input as Partial<Medication>);
    await this.cache.del(`pillbox:${med.elderProfileId}`);
    return updated;
  }

  async deleteMedication(id: string): Promise<void> {
    const med = await this.getMedicationById(id);
    await this.repo.delete(id);
    await this.cache.del(`pillbox:${med.elderProfileId}`);
  }

  /**
   * Generates Today's Visual Pillbox categorized into Morning, Afternoon, Evening, and Night
   */
  async getTodayPillbox(elderProfileId: string): Promise<TodayPillboxResponse> {
    const cacheKey = `pillbox:${elderProfileId}`;
    const cached = await this.cache.get<TodayPillboxResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const medications = await this.repo.findByElderId(elderProfileId, true);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const todayLogs = await this.repo.findTodayLogs(elderProfileId, startOfDay, endOfDay);

    const items: PillboxItem[] = [];

    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotalMinutes = currentHours * 60 + currentMinutes;

    for (const med of medications) {
      for (const timeStr of med.scheduleTimes) {
        const [hourStr, minStr] = timeStr.split(':');
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minStr, 10);
        const schedMinutes = hour * 60 + minute;

        // Check if there's already a log for this specific medication and time slot today
        const matchingLog = todayLogs.find((l) => {
          if (l.medicationId !== med.id) return false;
          const logHour = l.scheduledFor.getHours();
          const logMin = l.scheduledFor.getMinutes();
          // Precise slot match: exact hour/minute or within 30 minutes of this schedule slot
          return (
            (logHour === hour && logMin === minute) ||
            Math.abs(logHour * 60 + logMin - schedMinutes) <= 30
          );
        });

        const status = matchingLog ? matchingLog.status : LogStatus.SCHEDULED;
        const takenAt = matchingLog?.takenAt || null;

        // Due now if within 60 minutes window and not taken yet
        const isDueNow =
          status !== LogStatus.TAKEN && Math.abs(currentTotalMinutes - schedMinutes) <= 60;

        const timeSlot = this.resolveTimeSlot(hour);

        items.push({
          id: med.id,
          logId: matchingLog?.id,
          name: med.name,
          dosage: med.dosage,
          mealRelation: med.mealRelation,
          criticality: med.criticality,
          pillImageUrl: med.pillImageUrl,
          voiceNoteUrl: med.voiceNoteUrl,
          voiceNoteText: med.voiceNoteText,
          dietaryGuidelines: med.dietaryGuidelines,
          instructions: med.instructions,
          scheduledTime: timeStr,
          timeSlot,
          status,
          takenAt,
          isDueNow
        });
      }
    }

    const morning = items.filter((i) => i.timeSlot === 'MORNING');
    const afternoon = items.filter((i) => i.timeSlot === 'AFTERNOON');
    const evening = items.filter((i) => i.timeSlot === 'EVENING');
    const night = items.filter((i) => i.timeSlot === 'NIGHT');

    const totalDoses = items.length;
    const takenDoses = items.filter((i) => i.status === LogStatus.TAKEN).length;
    const pendingDoses = totalDoses - takenDoses;

    const response: TodayPillboxResponse = {
      elderProfileId,
      date: now.toISOString().split('T')[0],
      summary: {
        totalDoses,
        takenDoses,
        pendingDoses
      },
      slots: {
        morning,
        afternoon,
        evening,
        night
      }
    };

    await this.cache.set(cacheKey, response, 60);
    return response;
  }

  /**
   * "Maine Kha Li" Dose Confirmation with 6-Hour Anti-Overdose Lockout Shield
   */
  async confirmDose(input: ConfirmDoseInput): Promise<ConfirmDoseResult> {
    const med = await this.getMedicationById(input.medicationId);

    // 1. Anti-Overdose Lockout Shield (6-Hour Threshold)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const recentTakenLog = await this.repo.findRecentTakenLog(med.id, sixHoursAgo);

    if (recentTakenLog && recentTakenLog.takenAt) {
      const timeTakenStr = recentTakenLog.takenAt.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });
      throw ApiError.badRequest(
        `Anti-Overdose Shield Active: ${med.name} was already taken at ${timeTakenStr}. Please wait for your next prescribed schedule to prevent accidental overdose.`
      );
    }

    // 2. Mark Dose as Taken
    let scheduledFor: Date;
    if (input.scheduledFor) {
      scheduledFor = new Date(input.scheduledFor);
    } else {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      let closestTimeStr = med.scheduleTimes[0] || '08:00';
      let minDiff = Infinity;
      for (const t of med.scheduleTimes) {
        const [h, m] = t.split(':').map(Number);
        const diff = Math.abs(h * 60 + m - currentMinutes);
        if (diff < minDiff) {
          minDiff = diff;
          closestTimeStr = t;
        }
      }
      const [h, m] = closestTimeStr.split(':').map(Number);
      scheduledFor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
    }

    const log = await this.repo.createLog({
      medicationId: med.id,
      scheduledFor,
      takenAt: new Date(),
      status: LogStatus.TAKEN,
      confirmationMethod: (input.method as ConfirmationMethod) || ConfirmationMethod.BUTTON_TAP,
      notes: input.notes || 'Confirmed by elder via "Maine Kha Li" button tap'
    });

    await this.cache.del(`pillbox:${med.elderProfileId}`);

    return {
      log,
      medication: med,
      soundAlert: 'success_chime',
      voiceNoteUrl: med.voiceNoteUrl,
      voiceNoteText: med.voiceNoteText,
      message: `Dose confirmed for ${med.name}. Anti-Overdose shield activated.`
    };
  }

  /**
   * Calculate Adherence Rate over past N days
   */
  async getAdherenceRate(
    elderProfileId: string,
    days = 7
  ): Promise<{ adherenceRate: number; totalScheduled: number; totalTaken: number }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const stats = await this.repo.getAdherenceStats(elderProfileId, since);

    const adherenceRate =
      stats.totalScheduled > 0
        ? Math.round((stats.totalTaken / stats.totalScheduled) * 100)
        : 100;

    return {
      adherenceRate,
      totalScheduled: stats.totalScheduled,
      totalTaken: stats.totalTaken
    };
  }

  private resolveTimeSlot(hour: number): TimeSlot {
    if (hour >= 5 && hour < 12) return 'MORNING';
    if (hour >= 12 && hour < 17) return 'AFTERNOON';
    if (hour >= 17 && hour < 21) return 'EVENING';
    return 'NIGHT';
  }
}
