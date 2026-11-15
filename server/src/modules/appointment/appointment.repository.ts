import { Appointment, AppointmentStatus, LogStatus, MealRelation, Criticality } from '@prisma/client';
import { prisma } from '../../config/db';

export interface ClinicalElderInfo {
  id: string;
  fullName: string;
  age: number;
  bloodGroup: string | null;
  emergencyContact: string;
  notes: string | null;
}

export interface ClinicalMedicationItem {
  id: string;
  name: string;
  dosage: string;
  scheduleTimes: string[];
  mealRelation: MealRelation;
  criticality: Criticality;
  instructions: string | null;
}

export interface ClinicalMissedDose {
  medicationName: string;
  dosage: string;
  scheduledFor: Date;
  status: LogStatus;
}

export interface ClinicalBriefcaseRawData {
  elder: ClinicalElderInfo | null;
  activeMedications: ClinicalMedicationItem[];
  totalScheduled: number;
  totalTaken: number;
  missedDoses: ClinicalMissedDose[];
  recentAppointments: Appointment[];
}

export interface IAppointmentRepository {
  create(data: {
    elderProfileId: string;
    doctorName: string;
    specialty: string;
    clinicAddress: string;
    appointmentDate: Date;
    prepNotes?: string | null;
  }): Promise<Appointment>;
  findById(id: string): Promise<Appointment | null>;
  findByElderId(elderProfileId: string): Promise<Appointment[]>;
  findUpcoming(elderProfileId: string, fromDate: Date): Promise<Appointment[]>;
  update(id: string, data: Partial<Appointment>): Promise<Appointment>;
  delete(id: string): Promise<void>;
  getClinicalBriefcaseRawData(
    elderProfileId: string,
    sinceDate: Date
  ): Promise<ClinicalBriefcaseRawData>;
}

export class InMemoryAppointmentRepository implements IAppointmentRepository {
  public appointments: Map<string, Appointment> = new Map();
  public mockElder: ClinicalElderInfo = {
    id: 'elder-ramesh-1',
    fullName: 'Ramesh Sharma',
    age: 74,
    bloodGroup: 'B+',
    emergencyContact: '+91 98765 43210',
    notes: 'Hypertension and Type-2 Diabetes management'
  };
  public mockMedications: ClinicalMedicationItem[] = [
    {
      id: 'med-1',
      name: 'Telmisartan 40mg',
      dosage: '1 Tablet',
      scheduleTimes: ['09:00'],
      mealRelation: MealRelation.AFTER_MEAL,
      criticality: Criticality.HIGH_RISK,
      instructions: 'Take after breakfast'
    },
    {
      id: 'med-2',
      name: 'Metformin 500mg',
      dosage: '1 Tablet',
      scheduleTimes: ['14:00', '20:30'],
      mealRelation: MealRelation.AFTER_MEAL,
      criticality: Criticality.ROUTINE,
      instructions: 'Take after meals'
    }
  ];
  public mockMissedDoses: ClinicalMissedDose[] = [
    {
      medicationName: 'Metformin 500mg',
      dosage: '1 Tablet',
      scheduledFor: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: LogStatus.MISSED
    }
  ];

  async create(data: {
    elderProfileId: string;
    doctorName: string;
    specialty: string;
    clinicAddress: string;
    appointmentDate: Date;
    prepNotes?: string | null;
  }): Promise<Appointment> {
    const id = `apt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const apt: Appointment = {
      id,
      elderProfileId: data.elderProfileId,
      doctorName: data.doctorName,
      specialty: data.specialty,
      clinicAddress: data.clinicAddress,
      appointmentDate: data.appointmentDate,
      status: AppointmentStatus.UPCOMING,
      prepNotes: data.prepNotes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.appointments.set(id, apt);
    return apt;
  }

  async findById(id: string): Promise<Appointment | null> {
    return this.appointments.get(id) || null;
  }

  async findByElderId(elderProfileId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter((a) => a.elderProfileId === elderProfileId)
      .sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime());
  }

  async findUpcoming(elderProfileId: string, fromDate: Date): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter((a) => a.elderProfileId === elderProfileId && a.appointmentDate >= fromDate)
      .sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime());
  }

  async update(id: string, data: Partial<Appointment>): Promise<Appointment> {
    const existing = this.appointments.get(id);
    if (!existing) throw new Error('Appointment not found');
    const updated: Appointment = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };
    this.appointments.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.appointments.delete(id);
  }

  async getClinicalBriefcaseRawData(
    elderProfileId: string,
    sinceDate: Date
  ): Promise<ClinicalBriefcaseRawData> {
    const recentAppointments = Array.from(this.appointments.values()).filter(
      (a) => a.elderProfileId === elderProfileId
    );

    return {
      elder: this.mockElder,
      activeMedications: this.mockMedications,
      totalScheduled: 60,
      totalTaken: 56,
      missedDoses: this.mockMissedDoses,
      recentAppointments
    };
  }
}

export class PrismaAppointmentRepository implements IAppointmentRepository {
  async create(data: {
    elderProfileId: string;
    doctorName: string;
    specialty: string;
    clinicAddress: string;
    appointmentDate: Date;
    prepNotes?: string | null;
  }): Promise<Appointment> {
    return prisma.appointment.create({
      data: {
        elderProfileId: data.elderProfileId,
        doctorName: data.doctorName,
        specialty: data.specialty,
        clinicAddress: data.clinicAddress,
        appointmentDate: data.appointmentDate,
        prepNotes: data.prepNotes || null
      }
    });
  }

  async findById(id: string): Promise<Appointment | null> {
    return prisma.appointment.findUnique({
      where: { id }
    });
  }

  async findByElderId(elderProfileId: string): Promise<Appointment[]> {
    return prisma.appointment.findMany({
      where: { elderProfileId },
      orderBy: { appointmentDate: 'asc' }
    });
  }

  async findUpcoming(elderProfileId: string, fromDate: Date): Promise<Appointment[]> {
    return prisma.appointment.findMany({
      where: {
        elderProfileId,
        appointmentDate: { gte: fromDate }
      },
      orderBy: { appointmentDate: 'asc' }
    });
  }

  async update(id: string, data: Partial<Appointment>): Promise<Appointment> {
    return prisma.appointment.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.appointment.delete({
      where: { id }
    });
  }

  async getClinicalBriefcaseRawData(
    elderProfileId: string,
    sinceDate: Date
  ): Promise<ClinicalBriefcaseRawData> {
    const elder = await prisma.elderProfile.findUnique({
      where: { id: elderProfileId },
      select: {
        id: true,
        fullName: true,
        age: true,
        bloodGroup: true,
        emergencyContact: true,
        notes: true
      }
    });

    const activeMedications = await prisma.medication.findMany({
      where: { elderProfileId, isActive: true },
      select: {
        id: true,
        name: true,
        dosage: true,
        scheduleTimes: true,
        mealRelation: true,
        criticality: true,
        instructions: true
      }
    });

    const totalScheduled = await prisma.medicationLog.count({
      where: {
        medication: { elderProfileId },
        scheduledFor: { gte: sinceDate }
      }
    });

    const totalTaken = await prisma.medicationLog.count({
      where: {
        medication: { elderProfileId },
        scheduledFor: { gte: sinceDate },
        status: LogStatus.TAKEN
      }
    });

    const missedLogs = await prisma.medicationLog.findMany({
      where: {
        medication: { elderProfileId },
        scheduledFor: { gte: sinceDate },
        status: { in: [LogStatus.MISSED, LogStatus.SKIPPED] }
      },
      include: {
        medication: {
          select: { name: true, dosage: true }
        }
      },
      orderBy: { scheduledFor: 'desc' },
      take: 20
    });

    const missedDoses: ClinicalMissedDose[] = missedLogs.map((l) => ({
      medicationName: l.medication.name,
      dosage: l.medication.dosage,
      scheduledFor: l.scheduledFor,
      status: l.status
    }));

    const recentAppointments = await prisma.appointment.findMany({
      where: { elderProfileId },
      orderBy: { appointmentDate: 'desc' },
      take: 5
    });

    return {
      elder,
      activeMedications,
      totalScheduled,
      totalTaken,
      missedDoses,
      recentAppointments
    };
  }
}
