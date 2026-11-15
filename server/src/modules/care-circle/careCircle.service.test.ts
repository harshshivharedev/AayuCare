import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CareCircleService } from './careCircle.service';
import { InMemoryCareCircleRepository } from './careCircle.repository';

describe('CareCircleService Unit Tests (SOLID Verification)', () => {
  const repo = new InMemoryCareCircleRepository();
  const service = new CareCircleService(repo);

  it('should pair caregiver with elder using valid 6-char passcode', async () => {
    const result = await service.pairWithElder('user-daughter-101', 'CARE-8421');

    assert.ok(result.elder);
    assert.equal(result.elder.carePasscode, 'CARE-8421');
    assert.equal(result.elder.fullName, 'Ramesh Sharma');
    assert.ok(result.access);
    assert.equal(result.access.userId, 'user-daughter-101');
  });

  it('should reject invalid care passcode with 404 not found', async () => {
    await assert.rejects(
      async () => {
        await service.pairWithElder('user-random-999', 'WRONG-PASS');
      },
      (err: any) => {
        assert.equal(err.statusCode, 404);
        assert.match(err.message, /Invalid CarePasscode/i);
        return true;
      }
    );
  });

  it('should retrieve elder profile by ID', async () => {
    const elder = await service.getElderProfile('elder-ramesh-001');
    assert.equal(elder.fullName, 'Ramesh Sharma');
    assert.equal(elder.age, 74);
  });

  it('should retrieve care circle members for an elder', async () => {
    const members = await service.getCareCircleMembers('elder-ramesh-001');
    assert.ok(members.length >= 1);
  });
});
