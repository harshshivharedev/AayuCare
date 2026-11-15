import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { AlertService } from './alert.service';
import { InMemoryAlertRepository } from './alert.repository';
import { AlertStatus, AlertType } from '@prisma/client';

describe('AlertService & 45-Minute Escalation Engine Unit Tests', () => {
  let repo: InMemoryAlertRepository;
  let service: AlertService;
  const elderProfileId = 'elder-ramesh-1';

  beforeEach(() => {
    repo = new InMemoryAlertRepository();
    service = new AlertService(repo);
  });

  it('should scan overdue doses (>45 mins), mark them MISSED, and escalate urgent alert to caregivers', async () => {
    const result = await service.evaluateAndEscalateMissedDoses(elderProfileId, 45);

    assert.equal(result.elderProfileId, elderProfileId);
    assert.equal(result.overdueDosesFound, 1);
    assert.equal(result.escalatedAlertsCount, 1);
    assert.equal(result.alerts[0].alertType, AlertType.MISSED_DOSE);
    assert.ok(result.alerts[0].title.includes('Missed Dose Escalation - Telmisartan 40mg'));
    assert.ok(result.alerts[0].message.includes('45 minutes overdue'));
    assert.equal(result.alerts[0].recipientEmail, 'priya.caregiver@example.com');
    assert.equal(result.alerts[0].status, AlertStatus.SENT);

    // Verify overdue dose was removed from pending scheduled list
    const remainingOverdue = await repo.findOverdueScheduledDoses(
      elderProfileId,
      new Date()
    );
    assert.equal(remainingOverdue.length, 0);
  });

  it('should return empty result when no doses are overdue', async () => {
    repo.mockOverdueDoses = []; // No overdue doses

    const result = await service.evaluateAndEscalateMissedDoses(elderProfileId, 45);
    assert.equal(result.overdueDosesFound, 0);
    assert.equal(result.escalatedAlertsCount, 0);
    assert.equal(result.alerts.length, 0);
  });

  it('should fetch alert feed with accurate unread counter', async () => {
    await service.createAlert({
      elderProfileId,
      recipientEmail: 'caregiver@example.com',
      alertType: 'APPOINTMENT',
      title: 'Upcoming Visit Reminder',
      message: 'Dr. Sharma visit scheduled for tomorrow morning',
      status: 'SENT'
    });

    const feed = await service.getAlertsByElder(elderProfileId);
    assert.equal(feed.totalAlerts, 1);
    assert.equal(feed.unreadCount, 1);
    assert.equal(feed.alerts[0].title, 'Upcoming Visit Reminder');
  });

  it('should allow caregiver to acknowledge alert and mark it resolved', async () => {
    const created = await service.createAlert({
      elderProfileId,
      recipientEmail: 'caregiver@example.com',
      alertType: 'MISSED_DOSE',
      title: 'Missed Dose',
      message: 'Morning dose was missed',
      status: 'SENT'
    });

    const acknowledged = await service.acknowledgeAlert(created.id);
    assert.equal(acknowledged.status, AlertStatus.ACKNOWLEDGED);

    // Verify unread count is now 0
    const feed = await service.getAlertsByElder(elderProfileId);
    assert.equal(feed.unreadCount, 0);
  });

  it('should throw 404 when acknowledging non-existent alert', async () => {
    await assert.rejects(
      async () => {
        await service.acknowledgeAlert('non-existent-alert-id');
      },
      (err: any) => {
        assert.equal(err.statusCode, 404);
        assert.ok(err.message.includes('Alert notification not found'));
        return true;
      }
    );
  });
});
