import { AlertNotification, AlertType, AlertStatus, LogStatus } from '@prisma/client';
import { prisma } from '../../config/db';

export interface OverdueDoseInfo {
  logId: string;
  medicationName: string;
  dosage: string;
  scheduledFor: Date;
}

export interface CaregiverRecipient {
  email: string;
  name: string;
}

export interface IAlertRepository {
  create(data: {
    elderProfileId: string;
    recipientEmail: string;
    alertType: AlertType;
    title: string;
    message: string;
    status?: AlertStatus;
  }): Promise<AlertNotification>;
  findById(id: string): Promise<AlertNotification | null>;
  findByElderId(elderProfileId: string, status?: AlertStatus): Promise<AlertNotification[]>;
  updateStatus(id: string, status: AlertStatus): Promise<AlertNotification>;
  findOverdueScheduledDoses(
    elderProfileId: string,
    thresholdTime: Date
  ): Promise<OverdueDoseInfo[]>;
  markDoseAsMissed(logId: string): Promise<void>;
  findCaregiversForElder(elderProfileId: string): Promise<CaregiverRecipient[]>;
}

export class InMemoryAlertRepository implements IAlertRepository {
  public alerts: Map<string, AlertNotification> = new Map();
  public mockOverdueDoses: OverdueDoseInfo[] = [
    {
      logId: 'log-overdue-1',
      medicationName: 'Telmisartan 40mg',
      dosage: '1 Tablet',
      scheduledFor: new Date(Date.now() - 50 * 60 * 1000) // 50 mins ago
    }
  ];
  public mockCaregivers: CaregiverRecipient[] = [
    {
      email: 'priya.caregiver@example.com',
      name: 'Priya Sharma'
    }
  ];

  async create(data: {
    elderProfileId: string;
    recipientEmail: string;
    alertType: AlertType;
    title: string;
    message: string;
    status?: AlertStatus;
  }): Promise<AlertNotification> {
    const id = `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const alert: AlertNotification = {
      id,
      elderProfileId: data.elderProfileId,
      recipientEmail: data.recipientEmail,
      alertType: data.alertType,
      title: data.title,
      message: data.message,
      status: data.status || AlertStatus.PENDING,
      sentAt: new Date(),
      createdAt: new Date()
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async findById(id: string): Promise<AlertNotification | null> {
    return this.alerts.get(id) || null;
  }

  async findByElderId(
    elderProfileId: string,
    status?: AlertStatus
  ): Promise<AlertNotification[]> {
    return Array.from(this.alerts.values())
      .filter((a) => a.elderProfileId === elderProfileId && (!status || a.status === status))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateStatus(id: string, status: AlertStatus): Promise<AlertNotification> {
    const existing = this.alerts.get(id);
    if (!existing) throw new Error('Alert not found');
    const updated: AlertNotification = {
      ...existing,
      status
    };
    this.alerts.set(id, updated);
    return updated;
  }

  async findOverdueScheduledDoses(
    elderProfileId: string,
    thresholdTime: Date
  ): Promise<OverdueDoseInfo[]> {
    return this.mockOverdueDoses.filter((d) => d.scheduledFor <= thresholdTime);
  }

  async markDoseAsMissed(logId: string): Promise<void> {
    this.mockOverdueDoses = this.mockOverdueDoses.filter((d) => d.logId !== logId);
  }

  async findCaregiversForElder(elderProfileId: string): Promise<CaregiverRecipient[]> {
    return this.mockCaregivers;
  }
}

export class PrismaAlertRepository implements IAlertRepository {
  async create(data: {
    elderProfileId: string;
    recipientEmail: string;
    alertType: AlertType;
    title: string;
    message: string;
    status?: AlertStatus;
  }): Promise<AlertNotification> {
    return prisma.alertNotification.create({
      data: {
        elderProfileId: data.elderProfileId,
        recipientEmail: data.recipientEmail,
        alertType: data.alertType,
        title: data.title,
        message: data.message,
        status: data.status || AlertStatus.PENDING,
        sentAt: new Date()
      }
    });
  }

  async findById(id: string): Promise<AlertNotification | null> {
    return prisma.alertNotification.findUnique({
      where: { id }
    });
  }

  async findByElderId(
    elderProfileId: string,
    status?: AlertStatus
  ): Promise<AlertNotification[]> {
    return prisma.alertNotification.findMany({
      where: {
        elderProfileId,
        ...(status ? { status } : {})
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateStatus(id: string, status: AlertStatus): Promise<AlertNotification> {
    return prisma.alertNotification.update({
      where: { id },
      data: { status }
    });
  }

  async findOverdueScheduledDoses(
    elderProfileId: string,
    thresholdTime: Date
  ): Promise<OverdueDoseInfo[]> {
    const overdueLogs = await prisma.medicationLog.findMany({
      where: {
        medication: { elderProfileId },
        status: LogStatus.SCHEDULED,
        scheduledFor: { lte: thresholdTime }
      },
      include: {
        medication: {
          select: { name: true, dosage: true }
        }
      }
    });

    return overdueLogs.map((l) => ({
      logId: l.id,
      medicationName: l.medication.name,
      dosage: l.medication.dosage,
      scheduledFor: l.scheduledFor
    }));
  }

  async markDoseAsMissed(logId: string): Promise<void> {
    await prisma.medicationLog.update({
      where: { id: logId },
      data: { status: LogStatus.MISSED }
    });
  }

  async findCaregiversForElder(elderProfileId: string): Promise<CaregiverRecipient[]> {
    const circle = await prisma.careCircleAccess.findMany({
      where: { elderProfileId },
      include: {
        user: {
          select: { email: true, name: true }
        }
      }
    });

    return circle.map((c) => ({
      email: c.user.email,
      name: c.user.name
    }));
  }
}
