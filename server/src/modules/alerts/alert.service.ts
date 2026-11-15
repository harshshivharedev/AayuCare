import { IAlertRepository, AlertNotificationRecord } from './alert.repository';
import { IMedicationRepository } from '../medication/medication.repository';
import { ICareCircleRepository } from '../care-circle/careCircle.repository';
import { CreateAlertInput } from './alert.schema';
import { AlertType, AlertStatus, MedicationLogStatus } from '@prisma/client';
import { logger } from '../../utils/logger';

export class AlertService {
  constructor(
    private readonly repo: IAlertRepository,
    private readonly medRepo: IMedicationRepository,
    private readonly careRepo: ICareCircleRepository
  ) {}

  async createAlert(input: CreateAlertInput): Promise<AlertNotificationRecord> {
    const alert = await this.repo.create({
      elderProfileId: input.elderProfileId,
      recipientEmail: input.recipientEmail,
      alertType: input.alertType as AlertType,
      title: input.title,
      message: input.message,
      status: AlertStatus.SENT,
      sentAt: new Date(),
    });

    logger.info(`📧 [PROACTIVE EMAIL DISPATCHED] To: ${input.recipientEmail} | Subject: ${input.title}`);
    return alert;
  }

  async getAlerts(elderProfileId: string): Promise<AlertNotificationRecord[]> {
    return await this.repo.findByElderId(elderProfileId);
  }

  async evaluateMissedDoses(elderProfileId: string): Promise<AlertNotificationRecord[]> {
    const members = await this.careRepo.getMembers(elderProfileId);
    const caregiverEmail = members[0]?.userEmail || 'caregiver@aayucare.in';

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const logs = await this.medRepo.findLogsForElder(elderProfileId, startOfDay, now);

    const generatedAlerts: AlertNotificationRecord[] = [];

    for (const log of logs) {
      if (log.status === MedicationLogStatus.SCHEDULED) {
        const timeDiffMinutes = (now.getTime() - log.scheduledFor.getTime()) / (60 * 1000);

        // If scheduled dose was > 45 mins ago and not confirmed
        if (timeDiffMinutes > 45) {
          const alert = await this.createAlert({
            elderProfileId,
            recipientEmail: caregiverEmail,
            alertType: 'MISSED_DOSE',
            title: `⚠️ Alert: Missed Dose - ${log.medication.name}`,
            message: `Babuji was scheduled to take ${log.medication.name} (${log.medication.dosage}) at ${log.scheduledFor.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, but no confirmation was received.`,
          });
          generatedAlerts.push(alert);
        }
      }
    }

    return generatedAlerts;
  }
}
