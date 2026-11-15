import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MedicationService } from './medication.service';
import { InMemoryMedicationRepository } from './medication.repository';

describe('MedicationService Unit Tests (SOLID & Anti-Overdose Verification)', () => {
  const repo = new InMemoryMedicationRepository();
  const service = new MedicationService(repo);

  it('should retrieve pillbox for today with scheduled medication items', async () => {
    const items = await service.getPillboxToday('elder-ramesh-001');

    assert.ok(items.length >= 2, 'Pillbox should contain seeded medications');
    const telmisartan = items.find((i) => i.medication.name.includes('Telmisartan'));
    assert.ok(telmisartan, 'Telmisartan should be in pillbox');
    assert.equal(telmisartan?.medication.criticality, 'HIGH_RISK');
    assert.ok(telmisartan?.medication.dietaryGuidelines.length > 0);
  });

  it('should enforce Anti-Overdose 6-Hour Lockout Shield if already taken recently', async () => {
    // Telmisartan was seeded as taken this morning, so taking it again immediately must trigger the shield
    await assert.rejects(
      async () => {
        await service.confirmDose({
          medicationId: 'med-bp-001',
          confirmationMethod: 'BUTTON_TAP',
          overrideLockout: false,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /ANTI_OVERDOSE_SHIELD/);
        return true;
      }
    );
  });

  it('should allow confirming dose with caregiver overrideLockout flag', async () => {
    const result = await service.confirmDose({
      medicationId: 'med-bp-001',
      confirmationMethod: 'CAREGIVER_OVERRIDE',
      overrideLockout: true,
      notes: 'Doctor instructed extra dose due to BP spike',
    });

    assert.ok(result.log);
    assert.equal(result.shieldActive, true);
    assert.match(result.message, /Green Shield/);
  });

  it('should calculate adherence percentage correctly', async () => {
    const metrics = await service.getAdherenceRate('elder-ramesh-001', 7);

    assert.ok(metrics.totalScheduled >= 1);
    assert.ok(metrics.totalTaken >= 1);
    assert.ok(metrics.adherencePercentage >= 0 && metrics.adherencePercentage <= 100);
  });
});
