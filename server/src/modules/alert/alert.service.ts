import { IAlertRepository } from './alert.repository';
import { CreateAlertInput } from './alert.schema';
import { AlertNotification, AlertStatus, AlertType } from '@prisma/client';
import { ApiError } from '../../utils/apiError';

export interface AlertFeedResponse {
  elderProfileId: string;
  totalAlerts: number;
  unreadCount: number;
  alerts: AlertNotification[];
}

export interface EscalationEvaluationResult {
  elderProfileId: string;
  overdueDosesFound: number;
  escalatedAlertsCount: number;
  alerts: AlertNotification[];
}

export class AlertService {
  constructor(private readonly repo: IAlertRepository) {}

  async getAlertsByElder(
    elderProfileId: string,
    statusFilter?: AlertStatus
  ): Promise<AlertFeedResponse> {
    const alerts = await this.repo.findByElderId(elderProfileId, statusFilter);
    const unreadCount = alerts.filter(
      (a) => a.status === AlertStatus.PENDING || a.status === AlertStatus.SENT
    ).length;

    return {
      elderProfileId,
      totalAlerts: alerts.length,
      unreadCount,
      alerts
    };
  }

  async acknowledgeAlert(alertId: string): Promise<AlertNotification> {
    const alert = await this.repo.findById(alertId);
    if (!alert) {
      throw ApiError.notFound('Alert notification not found');
    }

    return await this.repo.updateStatus(alertId, AlertStatus.ACKNOWLEDGED);
  }

  async createAlert(input: CreateAlertInput): Promise<AlertNotification> {
    return await this.repo.create({
      elderProfileId: input.elderProfileId,
      recipientEmail: input.recipientEmail,
      alertType: input.alertType as AlertType,
      title: input.title,
      message: input.message,
      status: (input.status as AlertStatus) || AlertStatus.SENT
    });
  }

  /**
   * Evaluates all doses overdue by > thresholdMinutes (default 45 mins)
   * Marks them MISSED and escalates urgent notifications to all CareCircle members
   */
  async evaluateAndEscalateMissedDoses(
    elderProfileId: string,
    thresholdMinutes = 45
  ): Promise<EscalationEvaluationResult> {
    const thresholdTime = new Date(Date.now() - thresholdMinutes * 60 * 1000);

    const overdueDoses = await this.repo.findOverdueScheduledDoses(
      elderProfileId,
      thresholdTime
    );

    if (overdueDoses.length === 0) {
      return {
        elderProfileId,
        overdueDosesFound: 0,
        escalatedAlertsCount: 0,
        alerts: []
      };
    }

    const caregivers = await this.repo.findCaregiversForElder(elderProfileId);
    const createdAlerts: AlertNotification[] = [];

    for (const dose of overdueDoses) {
      // 1. Mark Dose as MISSED in the database
      await this.repo.markDoseAsMissed(dose.logId);

      const timeStr = dose.scheduledFor.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const title = `⚠️ Critical: Missed Dose Escalation - ${dose.medicationName}`;
      const message = `Dada ji has not confirmed their ${timeStr} dose of ${dose.medicationName} (${dose.dosage}). It is now ${thresholdMinutes} minutes overdue. Please check on them immediately.`;

      // 2. Escalate Alert to each linked Caregiver
      if (caregivers.length > 0) {
        for (const caregiver of caregivers) {
          const alert = await this.repo.create({
            elderProfileId,
            recipientEmail: caregiver.email,
            alertType: AlertType.MISSED_DOSE,
            title,
            message,
            status: AlertStatus.SENT
          });
          createdAlerts.push(alert);
        }
      } else {
        // Fallback alert record if no caregiver linked yet
        const alert = await this.repo.create({
          elderProfileId,
          recipientEmail: 'caregiver-alert@aayucare.in',
          alertType: AlertType.MISSED_DOSE,
          title,
          message,
          status: AlertStatus.SENT
        });
        createdAlerts.push(alert);
      }
    }

    return {
      elderProfileId,
      overdueDosesFound: overdueDoses.length,
      escalatedAlertsCount: createdAlerts.length,
      alerts: createdAlerts
    };
  }
}
