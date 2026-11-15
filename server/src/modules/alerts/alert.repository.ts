import { prisma } from '../../config/db';
import { AlertType, AlertStatus } from '@prisma/client';

export interface AlertNotificationRecord {
  id: string;
  elderProfileId: string;
  recipientEmail: string;
  alertType: AlertType;
  title: string;
  message: string;
  status: AlertStatus;
  sentAt: Date | null;
  createdAt: Date;
}

export interface IAlertRepository {
  create(data: Omit<AlertNotificationRecord, 'id' | 'createdAt'>): Promise<AlertNotificationRecord>;
  findByElderId(elderProfileId: string, limit?: number): Promise<AlertNotificationRecord[]>;
  updateStatus(id: string, status: AlertStatus): Promise<AlertNotificationRecord>;
}

const inMemoryAlerts: AlertNotificationRecord[] = [
  {
    id: 'alert-001',
    elderProfileId: 'elder-ramesh-001',
    recipientEmail: 'priya.sharma@aayucare.in',
    alertType: AlertType.APPOINTMENT,
    title: 'Upcoming Cardiologist Appointment in 3 Days',
    message: 'Dr. Anjali Mehta at Apollo Clinic on Nov 18, 10:30 AM.',
    status: AlertStatus.SENT,
    sentAt: new Date(),
    createdAt: new Date(),
  },
];

export class InMemoryAlertRepository implements IAlertRepository {
  private alerts = [...inMemoryAlerts];

  async create(data: Omit<AlertNotificationRecord, 'id' | 'createdAt'>): Promise<AlertNotificationRecord> {
    const item: AlertNotificationRecord = {
      ...data,
      id: `alert-${Date.now()}`,
      createdAt: new Date(),
    };
    this.alerts.unshift(item);
    return item;
  }

  async findByElderId(elderProfileId: string, limit = 20): Promise<AlertNotificationRecord[]> {
    return this.alerts
      .filter((a) => a.elderProfileId === elderProfileId)
      .slice(0, limit);
  }

  async updateStatus(id: string, status: AlertStatus): Promise<AlertNotificationRecord> {
    const alert = this.alerts.find((a) => a.id === id);
    if (!alert) throw new Error('Alert not found');
    alert.status = status;
    return alert;
  }
}

export class PrismaAlertRepository implements IAlertRepository {
  private fallback = new InMemoryAlertRepository();

  async create(data: Omit<AlertNotificationRecord, 'id' | 'createdAt'>): Promise<AlertNotificationRecord> {
    try {
      return await prisma.alertNotification.create({ data });
    } catch {
      return this.fallback.create(data);
    }
  }

  async findByElderId(elderProfileId: string, limit = 20): Promise<AlertNotificationRecord[]> {
    try {
      return await prisma.alertNotification.findMany({
        where: { elderProfileId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch {
      return this.fallback.findByElderId(elderProfileId, limit);
    }
  }

  async updateStatus(id: string, status: AlertStatus): Promise<AlertNotificationRecord> {
    try {
      return await prisma.alertNotification.update({
        where: { id },
        data: { status },
      });
    } catch {
      return this.fallback.updateStatus(id, status);
    }
  }
}
