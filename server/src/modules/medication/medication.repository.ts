import { prisma } from '../../config/db';
import { MealRelation, Criticality, MedicationLogStatus, ConfirmationMethod } from '@prisma/client';

export interface MedicationRecord {
  id: string;
  elderProfileId: string;
  name: string;
  dosage: string;
  frequency: string;
  scheduleTimes: string[];
  mealRelation: MealRelation;
  criticality: Criticality;
  pillImageUrl: string | null;
  dietaryGuidelines: string[];
  instructions: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationLogRecord {
  id: string;
  medicationId: string;
  scheduledFor: Date;
  takenAt: Date | null;
  status: MedicationLogStatus;
  confirmationMethod: ConfirmationMethod | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PillboxItem {
  medication: MedicationRecord;
  todayLogs: MedicationLogRecord[];
  isLockedOut: boolean;
  lockoutExpiresAt: Date | null;
  nextScheduledTime: string | null;
}

export interface IMedicationRepository {
  create(data: Omit<MedicationRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicationRecord>;
  findById(id: string): Promise<MedicationRecord | null>;
  findByElderId(elderProfileId: string, activeOnly?: boolean): Promise<MedicationRecord[]>;
  update(id: string, data: Partial<MedicationRecord>): Promise<MedicationRecord>;
  delete(id: string): Promise<void>;

  // Log Operations
  createLog(data: Omit<MedicationLogRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicationLogRecord>;
  updateLog(id: string, data: Partial<MedicationLogRecord>): Promise<MedicationLogRecord>;
  findLogsForMedication(medicationId: string, startDate?: Date, endDate?: Date): Promise<MedicationLogRecord[]>;
  findLastTakenLog(medicationId: string): Promise<MedicationLogRecord | null>;
  findLogsForElder(elderProfileId: string, startDate?: Date, endDate?: Date): Promise<(MedicationLogRecord & { medication: MedicationRecord })[]>;
}

// In-Memory Seed Storage for offline fallback
const now = new Date();
const today9am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);

const inMemoryMedications: MedicationRecord[] = [
  {
    id: 'med-bp-001',
    elderProfileId: 'elder-ramesh-001',
    name: 'Telmisartan 40mg',
    dosage: '1 Round White Tablet',
    frequency: 'DAILY',
    scheduleTimes: ['09:00'],
    mealRelation: MealRelation.AFTER_MEAL,
    criticality: Criticality.HIGH_RISK,
    pillImageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=60',
    dietaryGuidelines: [
      'Take within 30 minutes after breakfast',
      'Avoid high-potassium salt substitutes',
      'Drink a full glass of lukewarm water',
    ],
    instructions: 'Subah nashte ke baad lein. BP niyantran ke liye anivarya hai.',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'med-diabetes-002',
    elderProfileId: 'elder-ramesh-001',
    name: 'Metformin 500mg SR',
    dosage: '1 Oval Blue Tablet',
    frequency: 'DAILY',
    scheduleTimes: ['20:30'],
    mealRelation: MealRelation.AFTER_MEAL,
    criticality: Criticality.HIGH_RISK,
    pillImageUrl: 'https://images.unsplash.com/photo-1550572017-ed200f5e5a43?w=400&auto=format&fit=crop&q=60',
    dietaryGuidelines: [
      'Strictly take during or immediately after dinner',
      'Do not skip meals before taking this medicine',
      'Avoid sugary foods late at night',
    ],
    instructions: 'Raat ke khane ke turant baad lein. Sugar niyantrit rakhta hai.',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'med-multi-003',
    elderProfileId: 'elder-ramesh-001',
    name: 'Neurobion Forte / Zinc',
    dosage: '1 Red Strip Capsule',
    frequency: 'DAILY',
    scheduleTimes: ['13:30'],
    mealRelation: MealRelation.AFTER_MEAL,
    criticality: Criticality.ROUTINE,
    pillImageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&auto=format&fit=crop&q=60',
    dietaryGuidelines: [
      'Take after lunch',
      'Supports nerve health and daily energy',
    ],
    instructions: 'Dopahar ke khane ke baad lein.',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const inMemoryLogs: MedicationLogRecord[] = [
  {
    id: 'log-001',
    medicationId: 'med-bp-001',
    scheduledFor: today9am,
    takenAt: new Date(today9am.getTime() + 10 * 60000),
    status: MedicationLogStatus.TAKEN,
    confirmationMethod: ConfirmationMethod.VOICE,
    notes: 'Voice confirmed: "Maine subah ki BP ki goli kha li"',
    createdAt: today9am,
    updatedAt: today9am,
  },
];

export class InMemoryMedicationRepository implements IMedicationRepository {
  private meds = [...inMemoryMedications];
  private logs = [...inMemoryLogs];

  async create(data: Omit<MedicationRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicationRecord> {
    const newMed: MedicationRecord = {
      ...data,
      id: `med-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.meds.push(newMed);
    return newMed;
  }

  async findById(id: string): Promise<MedicationRecord | null> {
    return this.meds.find((m) => m.id === id) || null;
  }

  async findByElderId(elderProfileId: string, activeOnly: boolean = true): Promise<MedicationRecord[]> {
    return this.meds.filter((m) => m.elderProfileId === elderProfileId && (!activeOnly || m.isActive));
  }

  async update(id: string, data: Partial<MedicationRecord>): Promise<MedicationRecord> {
    const med = await this.findById(id);
    if (!med) throw new Error('Medication not found');
    Object.assign(med, data, { updatedAt: new Date() });
    return med;
  }

  async delete(id: string): Promise<void> {
    this.meds = this.meds.filter((m) => m.id !== id);
  }

  async createLog(data: Omit<MedicationLogRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicationLogRecord> {
    const newLog: MedicationLogRecord = {
      ...data,
      id: `log-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.logs.push(newLog);
    return newLog;
  }

  async updateLog(id: string, data: Partial<MedicationLogRecord>): Promise<MedicationLogRecord> {
    const log = this.logs.find((l) => l.id === id);
    if (!log) throw new Error('Log not found');
    Object.assign(log, data, { updatedAt: new Date() });
    return log;
  }

  async findLogsForMedication(medicationId: string, startDate?: Date, endDate?: Date): Promise<MedicationLogRecord[]> {
    return this.logs.filter((l) => {
      if (l.medicationId !== medicationId) return false;
      if (startDate && l.scheduledFor < startDate) return false;
      if (endDate && l.scheduledFor > endDate) return false;
      return true;
    });
  }

  async findLastTakenLog(medicationId: string): Promise<MedicationLogRecord | null> {
    const takenLogs = this.logs
      .filter((l) => l.medicationId === medicationId && l.status === MedicationLogStatus.TAKEN && l.takenAt !== null)
      .sort((a, b) => (b.takenAt?.getTime() || 0) - (a.takenAt?.getTime() || 0));

    return takenLogs.length > 0 ? takenLogs[0] : null;
  }

  async findLogsForElder(
    elderProfileId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<(MedicationLogRecord & { medication: MedicationRecord })[]> {
    const medIds = this.meds.filter((m) => m.elderProfileId === elderProfileId).map((m) => m.id);
    const medMap = new Map(this.meds.map((m) => [m.id, m]));

    return this.logs
      .filter((l) => {
        if (!medIds.includes(l.medicationId)) return false;
        if (startDate && l.scheduledFor < startDate) return false;
        if (endDate && l.scheduledFor > endDate) return false;
        return true;
      })
      .map((l) => ({
        ...l,
        medication: medMap.get(l.medicationId)!,
      }));
  }
}

export class PrismaMedicationRepository implements IMedicationRepository {
  private fallback = new InMemoryMedicationRepository();

  async create(data: Omit<MedicationRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicationRecord> {
    try {
      return await prisma.medication.create({ data });
    } catch {
      return this.fallback.create(data);
    }
  }

  async findById(id: string): Promise<MedicationRecord | null> {
    try {
      return await prisma.medication.findUnique({ where: { id } });
    } catch {
      return this.fallback.findById(id);
    }
  }

  async findByElderId(elderProfileId: string, activeOnly: boolean = true): Promise<MedicationRecord[]> {
    try {
      return await prisma.medication.findMany({
        where: {
          elderProfileId,
          ...(activeOnly ? { isActive: true } : {}),
        },
        orderBy: { createdAt: 'asc' },
      });
    } catch {
      return this.fallback.findByElderId(elderProfileId, activeOnly);
    }
  }

  async update(id: string, data: Partial<MedicationRecord>): Promise<MedicationRecord> {
    try {
      return await prisma.medication.update({ where: { id }, data });
    } catch {
      return this.fallback.update(id, data);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.medication.delete({ where: { id } });
    } catch {
      await this.fallback.delete(id);
    }
  }

  async createLog(data: Omit<MedicationLogRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicationLogRecord> {
    try {
      return await prisma.medicationLog.create({ data });
    } catch {
      return this.fallback.createLog(data);
    }
  }

  async updateLog(id: string, data: Partial<MedicationLogRecord>): Promise<MedicationLogRecord> {
    try {
      return await prisma.medicationLog.update({ where: { id }, data });
    } catch {
      return this.fallback.updateLog(id, data);
    }
  }

  async findLogsForMedication(medicationId: string, startDate?: Date, endDate?: Date): Promise<MedicationLogRecord[]> {
    try {
      return await prisma.medicationLog.findMany({
        where: {
          medicationId,
          ...(startDate || endDate
            ? {
                scheduledFor: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {}),
                },
              }
            : {}),
        },
        orderBy: { scheduledFor: 'desc' },
      });
    } catch {
      return this.fallback.findLogsForMedication(medicationId, startDate, endDate);
    }
  }

  async findLastTakenLog(medicationId: string): Promise<MedicationLogRecord | null> {
    try {
      return await prisma.medicationLog.findFirst({
        where: {
          medicationId,
          status: MedicationLogStatus.TAKEN,
          takenAt: { not: null },
        },
        orderBy: { takenAt: 'desc' },
      });
    } catch {
      return this.fallback.findLastTakenLog(medicationId);
    }
  }

  async findLogsForElder(
    elderProfileId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<(MedicationLogRecord & { medication: MedicationRecord })[]> {
    try {
      return await prisma.medicationLog.findMany({
        where: {
          medication: { elderProfileId },
          ...(startDate || endDate
            ? {
                scheduledFor: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {}),
                },
              }
            : {}),
        },
        include: { medication: true },
        orderBy: { scheduledFor: 'desc' },
      });
    } catch {
      return this.fallback.findLogsForElder(elderProfileId, startDate, endDate);
    }
  }
}
