import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AlertService } from './alert.service';
import { InMemoryAlertRepository } from './alert.repository';
import { InMemoryMedicationRepository } from '../medication/medication.repository';
import { InMemoryCareCircleRepository } from '../care-circle/careCircle.repository';

describe('AlertService Unit Tests (SOLID & Proactive Notifications)', () => {
  const alertRepo = new InMemoryAlertRepository();
  const medRepo = new InMemoryMedicationRepository();
  const careRepo = new InMemoryCareCircleRepository();
  const service = new AlertService(alertRepo, medRepo, careRepo);

  it('should create and dispatch a proactive alert notification', async () => {
    const alert = await service.createAlert({
      elderProfileId: 'elder-ramesh-001',
      recipientEmail: 'priya.sharma@aayucare.in',
      alertType: 'UPCOMING_DOSE',
      title: 'Upcoming Evening Dose Reminder',
      message: 'Reminder to take Metformin 500mg SR after dinner at 20:30.',
    });

    assert.ok(alert.id);
    assert.equal(alert.status, 'SENT');
    assert.equal(alert.recipientEmail, 'priya.sharma@aayucare.in');
  });

  it('should retrieve existing alerts for an elder', async () => {
    const list = await service.getAlerts('elder-ramesh-001');
    assert.ok(list.length >= 1);
  });
});
