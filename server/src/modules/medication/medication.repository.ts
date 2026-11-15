import {
  Medication,
  MedicationLog,
  Prisma,
  MealRelation,
  Criticality,
  LogStatus,
  ConfirmationMethod
} from '@prisma/client';
import { prisma } from '../../config/db';

export interface IMedicationRepository {
  create(data: {
    elderProfileId: string;
    name: string;
    dosage: string;
    frequency?: string;
    scheduleTimes: string[];
    mealRelation?: MealRelation;
    criticality?: Criticality;
    pillImageUrl?: string | null;
    voiceNoteUrl?: string | null;
    voiceNoteText?: string | null;
    dietaryGuidelines?: string[];
    instructions?: string | null;
  }): Promise<Medication>;
  findById(id: string): Promise<Medication | null>;
  findByElderId(elderProfileId: string, isActiveOnly?: boolean): Promise<Medication[]>;
  update(id: string, data: Partial<Medication>): Promise<Medication>;
  delete(id: string): Promise<void>;

  createLog(data: {
    medicationId: string;
    scheduledFor: Date;
    takenAt?: Date | null;
    status: LogStatus;
    confirmationMethod?: ConfirmationMethod | null;
    notes?: string | null;
  }): Promise<MedicationLog>;
  findRecentTakenLog(medicationId: string, since: Date): Promise<MedicationLog | null>;
  findExistingSlotLog(
    medicationId: string,
    scheduledFor: Date,
    windowMinutes?: number
  ): Promise<MedicationLog | null>;
  findTodayLogs(
    elderProfileId: string,
    startOfDay: Date,
    endOfDay: Date
  ): Promise<(MedicationLog & { medication: Medication })[]>;
  getAdherenceStats(
    elderProfileId: string,
    since: Date
  ): Promise<{ totalScheduled: number; totalTaken: number }>;
}

export class InMemoryMedicationRepository implements IMedicationRepository {
  public medications: Map<string, Medication> = new Map();
  public logs: Map<string, MedicationLog> = new Map();

  async create(data: {
    elderProfileId: string;
    name: string;
    dosage: string;
    frequency?: string;
    scheduleTimes: string[];
    mealRelation?: MealRelation;
    criticality?: Criticality;
    pillImageUrl?: string | null;
    voiceNoteUrl?: string | null;
    voiceNoteText?: string | null;
    dietaryGuidelines?: string[];
    instructions?: string | null;
  }): Promise<Medication> {
    const id = `med-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const med: Medication = {
      id,
      elderProfileId: data.elderProfileId,
      name: data.name,
      dosage: data.dosage,
      frequency: data.frequency || 'DAILY',
      scheduleTimes: data.scheduleTimes,
      mealRelation: data.mealRelation || MealRelation.AFTER_MEAL,
      criticality: data.criticality || Criticality.ROUTINE,
      pillImageUrl: data.pillImageUrl || null,
      voiceNoteUrl: data.voiceNoteUrl || null,
      voiceNoteText: data.voiceNoteText || null,
      dietaryGuidelines: data.dietaryGuidelines || [],
      instructions: data.instructions || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.medications.set(id, med);
    return med;
  }

  async findById(id: string): Promise<Medication | null> {
    return this.medications.get(id) || null;
  }

  async findByElderId(elderProfileId: string, isActiveOnly = true): Promise<Medication[]> {
    return Array.from(this.medications.values()).filter(
      (m) => m.elderProfileId === elderProfileId && (!isActiveOnly || m.isActive)
    );
  }

  async update(id: string, data: Partial<Medication>): Promise<Medication> {
    const existing = this.medications.get(id);
    if (!existing) throw new Error('Medication not found');
    const updated: Medication = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };
    this.medications.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const existing = this.medications.get(id);
    if (existing) {
      existing.isActive = false;
      this.medications.set(id, existing);
    }
  }

  async createLog(data: {
    medicationId: string;
    scheduledFor: Date;
    takenAt?: Date | null;
    status: LogStatus;
    confirmationMethod?: ConfirmationMethod | null;
    notes?: string | null;
  }): Promise<MedicationLog> {
    const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const log: MedicationLog = {
      id,
      medicationId: data.medicationId,
      scheduledFor: data.scheduledFor,
      takenAt: data.takenAt || null,
      status: data.status,
      confirmationMethod: data.confirmationMethod || null,
      notes: data.notes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.logs.set(id, log);
    return log;
  }

  async findRecentTakenLog(medicationId: string, since: Date): Promise<MedicationLog | null> {
    for (const log of this.logs.values()) {
      if (
        log.medicationId === medicationId &&
        log.status === LogStatus.TAKEN &&
        log.takenAt &&
        log.takenAt >= since
      ) {
        return log;
      }
    }
    return null;
  }

  async findExistingSlotLog(
    medicationId: string,
    scheduledFor: Date,
    windowMinutes = 30
  ): Promise<MedicationLog | null> {
    const windowMs = windowMinutes * 60 * 1000;
    const targetTime = scheduledFor.getTime();
    for (const log of this.logs.values()) {
      if (
        log.medicationId === medicationId &&
        log.status === LogStatus.TAKEN &&
        Math.abs(log.scheduledFor.getTime() - targetTime) <= windowMs
      ) {
        return log;
      }
    }
    return null;
  }

  async findTodayLogs(
    elderProfileId: string,
    startOfDay: Date,
    endOfDay: Date
  ): Promise<(MedicationLog & { medication: Medication })[]> {
    const result: (MedicationLog & { medication: Medication })[] = [];
    for (const log of this.logs.values()) {
      const med = this.medications.get(log.medicationId);
      if (
        med &&
        med.elderProfileId === elderProfileId &&
        log.scheduledFor >= startOfDay &&
        log.scheduledFor <= endOfDay
      ) {
        result.push({ ...log, medication: med });
      }
    }
    return result;
  }

  async getAdherenceStats(
    elderProfileId: string,
    since: Date
  ): Promise<{ totalScheduled: number; totalTaken: number }> {
    let totalScheduled = 0;
    let totalTaken = 0;

    for (const log of this.logs.values()) {
      const med = this.medications.get(log.medicationId);
      if (med && med.elderProfileId === elderProfileId && log.scheduledFor >= since) {
        totalScheduled++;
        if (log.status === LogStatus.TAKEN) {
          totalTaken++;
        }
      }
    }

    return { totalScheduled, totalTaken };
  }
}

export class PrismaMedicationRepository implements IMedicationRepository {
  async create(data: {
    elderProfileId: string;
    name: string;
    dosage: string;
    frequency?: string;
    scheduleTimes: string[];
    mealRelation?: MealRelation;
    criticality?: Criticality;
    pillImageUrl?: string | null;
    voiceNoteUrl?: string | null;
    voiceNoteText?: string | null;
    dietaryGuidelines?: string[];
    instructions?: string | null;
  }): Promise<Medication> {
    return prisma.medication.create({
      data: {
        elderProfileId: data.elderProfileId,
        name: data.name,
        dosage: data.dosage,
        frequency: data.frequency || 'DAILY',
        scheduleTimes: data.scheduleTimes,
        mealRelation: data.mealRelation || MealRelation.AFTER_MEAL,
        criticality: data.criticality || Criticality.ROUTINE,
        pillImageUrl: data.pillImageUrl || null,
        voiceNoteUrl: data.voiceNoteUrl || null,
        voiceNoteText: data.voiceNoteText || null,
        dietaryGuidelines: data.dietaryGuidelines || [],
        instructions: data.instructions || null
      }
    });
  }

  async findById(id: string): Promise<Medication | null> {
    return prisma.medication.findUnique({
      where: { id }
    });
  }

  async findByElderId(elderProfileId: string, isActiveOnly = true): Promise<Medication[]> {
    return prisma.medication.findMany({
      where: {
        elderProfileId,
        ...(isActiveOnly ? { isActive: true } : {})
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async update(id: string, data: Partial<Medication>): Promise<Medication> {
    return prisma.medication.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.medication.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async createLog(data: {
    medicationId: string;
    scheduledFor: Date;
    takenAt?: Date | null;
    status: LogStatus;
    confirmationMethod?: ConfirmationMethod | null;
    notes?: string | null;
  }): Promise<MedicationLog> {
    return prisma.medicationLog.create({
      data: {
        medicationId: data.medicationId,
        scheduledFor: data.scheduledFor,
        takenAt: data.takenAt || null,
        status: data.status,
        confirmationMethod: data.confirmationMethod || null,
        notes: data.notes || null
      }
    });
  }

  async findRecentTakenLog(medicationId: string, since: Date): Promise<MedicationLog | null> {
    return prisma.medicationLog.findFirst({
      where: {
        medicationId,
        status: LogStatus.TAKEN,
        takenAt: { gte: since }
      },
      orderBy: { takenAt: 'desc' }
    });
  }

  async findExistingSlotLog(
    medicationId: string,
    scheduledFor: Date,
    windowMinutes = 30
  ): Promise<MedicationLog | null> {
    const windowMs = windowMinutes * 60 * 1000;
    const startTime = new Date(scheduledFor.getTime() - windowMs);
    const endTime = new Date(scheduledFor.getTime() + windowMs);
    return prisma.medicationLog.findFirst({
      where: {
        medicationId,
        status: LogStatus.TAKEN,
        scheduledFor: {
          gte: startTime,
          lte: endTime
        }
      }
    });
  }

  async findTodayLogs(
    elderProfileId: string,
    startOfDay: Date,
    endOfDay: Date
  ): Promise<(MedicationLog & { medication: Medication })[]> {
    return prisma.medicationLog.findMany({
      where: {
        medication: { elderProfileId },
        scheduledFor: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        medication: true
      },
      orderBy: { scheduledFor: 'asc' }
    });
  }

  async getAdherenceStats(
    elderProfileId: string,
    since: Date
  ): Promise<{ totalScheduled: number; totalTaken: number }> {
    const totalScheduled = await prisma.medicationLog.count({
      where: {
        medication: { elderProfileId },
        scheduledFor: { gte: since }
      }
    });

    const totalTaken = await prisma.medicationLog.count({
      where: {
        medication: { elderProfileId },
        scheduledFor: { gte: since },
        status: LogStatus.TAKEN
      }
    });

    return { totalScheduled, totalTaken };
  }
}
