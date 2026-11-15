import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryQueueService } from './queue.service';

describe('QueueService Unit Tests (Background Dose Reminders & Delayed Escalation)', () => {
  it('should process delayed job after timer completes', async () => {
    const queue = new InMemoryQueueService();
    let processed = false;
    let receivedPayload = '';

    queue.registerWorker<{ alertType: string }>('MISSED_DOSE_ALERT', async (data) => {
      processed = true;
      receivedPayload = data.alertType;
    });

    await queue.enqueueDelayed('MISSED_DOSE_ALERT', { alertType: '45_MIN_ESCALATION' }, 50);

    // Wait 70ms for timer
    await new Promise((resolve) => setTimeout(resolve, 70));

    assert.equal(processed, true);
    assert.equal(receivedPayload, '45_MIN_ESCALATION');
  });

  it('should successfully cancel a pending delayed job before execution', async () => {
    const queue = new InMemoryQueueService();
    let executed = false;

    queue.registerWorker('CANCEL_TEST', async () => {
      executed = true;
    });

    const jobId = await queue.enqueueDelayed('CANCEL_TEST', {}, 100);
    await queue.cancelJob(jobId);

    // Wait 120ms
    await new Promise((resolve) => setTimeout(resolve, 120));

    assert.equal(executed, false, 'Cancelled job must not execute');
  });
});
