import { prisma } from '../../config/db';
import { AppointmentStatus } from '@prisma/client';

export interface AppointmentRecord {
  id: string;
  elderProfileId: string;
  doctorName: string;
  specialty: string;
  clinicAddress: string;
  appointmentDate: Date;
  status: AppointmentStatus;
  prepNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAppointmentRepository {
  create(data: Omit<AppointmentRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<AppointmentRecord>;
  findById(id: string): Promise<AppointmentRecord | null>;
  findByElderId(elderProfileId: string): Promise<AppointmentRecord[]>;
  update(id: string, data: Partial<AppointmentRecord>): Promise<AppointmentRecord>;
  delete(id: string): Promise<void>;
}

// In-Memory Seed Storage for offline fallback
const now = new Date();
const in3Days = new Date(now.getTime() + 3 * 24 * 3600 * 1000);
in3Days.setHours(10, 30, 0, 0);

const inMemoryAppointments: AppointmentRecord[] = [
  {
    id: 'apt-mehta-001',
    elderProfileId: 'elder-ramesh-001',
    doctorName: 'Dr. Anjali Mehta',
    specialty: 'Cardiologist & Geriatric Care',
    clinicAddress: 'Apollo Clinic, Sector 14, Gurugram (Room 204)',
    appointmentDate: in3Days,
    status: AppointmentStatus.UPCOMING,
    prepNotes: 'Bring fasting BP log book & last HbA1c test reports. Doctor requested to check potassium levels.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export class InMemoryAppointmentRepository implements IAppointmentRepository {
  private appointments = [...inMemoryAppointments];

  async create(data: Omit<AppointmentRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<AppointmentRecord> {
    const item: AppointmentRecord = {
      ...data,
      id: `apt-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.appointments.push(item);
    return item;
  }

  async findById(id: string): Promise<AppointmentRecord | null> {
    return this.appointments.find((a) => a.id === id) || null;
  }

  async findByElderId(elderProfileId: string): Promise<AppointmentRecord[]> {
    return this.appointments
      .filter((a) => a.elderProfileId === elderProfileId)
      .sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime());
  }

  async update(id: string, data: Partial<AppointmentRecord>): Promise<AppointmentRecord> {
    const item = await this.findById(id);
    if (!item) throw new Error('Appointment not found');
    Object.assign(item, data, { updatedAt: new Date() });
    return item;
  }

  async delete(id: string): Promise<void> {
    this.appointments = this.appointments.filter((a) => a.id !== id);
  }
}

export class PrismaAppointmentRepository implements IAppointmentRepository {
  private fallback = new InMemoryAppointmentRepository();

  async create(data: Omit<AppointmentRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<AppointmentRecord> {
    try {
      return await prisma.appointment.create({ data });
    } catch {
      return this.fallback.create(data);
    }
  }

  async findById(id: string): Promise<AppointmentRecord | null> {
    try {
      return await prisma.appointment.findUnique({ where: { id } });
    } catch {
      return this.fallback.findById(id);
    }
  }

  async findByElderId(elderProfileId: string): Promise<AppointmentRecord[]> {
    try {
      return await prisma.appointment.findMany({
        where: { elderProfileId },
        orderBy: { appointmentDate: 'asc' },
      });
    } catch {
      return this.fallback.findByElderId(elderProfileId);
    }
  }

  async update(id: string, data: Partial<AppointmentRecord>): Promise<AppointmentRecord> {
    try {
      return await prisma.appointment.update({ where: { id }, data });
    } catch {
      return this.fallback.update(id, data);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.appointment.delete({ where: { id } });
    } catch {
      await this.fallback.delete(id);
    }
  }
}
