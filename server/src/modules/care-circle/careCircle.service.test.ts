import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { CareCircleService } from './careCircle.service';
import { InMemoryCareCircleRepository } from './careCircle.repository';
import { AccessRole } from '@prisma/client';

describe('CareCircleService Unit Tests', () => {
  let repo: InMemoryCareCircleRepository;
  let service: CareCircleService;

  beforeEach(() => {
    repo = new InMemoryCareCircleRepository();
    service = new CareCircleService(repo);
  });

  it('should successfully pair a caregiver with an elder using a valid 6-character CarePasscode', async () => {
    const caregiverUserId = 'user-caregiver-priya-123';
    const passcode = 'CARE-8421';

    const result = await service.pairWithElder(caregiverUserId, passcode);

    assert.ok(result.elder);
    assert.equal(result.elder.carePasscode, 'CARE-8421');
    assert.equal(result.elder.fullName, 'Ramesh Sharma');
    assert.equal(result.access.userId, caregiverUserId);
    assert.equal(result.access.elderProfileId, result.elder.id);
    assert.equal(result.access.accessRole, AccessRole.PRIMARY_ADMIN);

    // Verify it is listed in getLinkedElders
    const linked = await service.getLinkedElders(caregiverUserId);
    assert.equal(linked.length, 1);
    assert.equal(linked[0].id, result.elder.id);
  });

  it('should handle lowercase or spaced passcode gracefully', async () => {
    const caregiverUserId = 'user-caregiver-amit-456';
    const passcode = '  care-8421  ';

    const result = await service.pairWithElder(caregiverUserId, passcode);
    assert.equal(result.elder.carePasscode, 'CARE-8421');
  });

  it('should reject pairing with a non-existent CarePasscode with 404', async () => {
    const caregiverUserId = 'user-caregiver-priya-123';
    const wrongPasscode = 'CARE-9999';

    await assert.rejects(
      async () => {
        await service.pairWithElder(caregiverUserId, wrongPasscode);
      },
      (err: any) => {
        assert.equal(err.statusCode, 404);
        assert.ok(err.message.includes('Invalid CarePasscode'));
        return true;
      }
    );
  });

  it('should prevent an elder from pairing with their own profile (self-pairing check)', async () => {
    // Ramesh's userId is 'user-ramesh-001'
    const elderSelfUserId = 'user-ramesh-001';
    const passcode = 'CARE-8421';

    await assert.rejects(
      async () => {
        await service.pairWithElder(elderSelfUserId, passcode);
      },
      (err: any) => {
        assert.equal(err.statusCode, 400);
        assert.equal(err.message, 'You cannot pair with your own elder profile.');
        return true;
      }
    );
  });

  it('should retrieve circle members for an elder', async () => {
    const caregiverUserId = 'user-caregiver-priya-123';
    await service.pairWithElder(caregiverUserId, 'CARE-8421');

    const members = await service.getMembers('elder-ramesh-001');
    assert.equal(members.length, 1);
    assert.equal(members[0].userId, caregiverUserId);
  });

  it('should update elder profile details successfully', async () => {
    const updated = await service.updateProfile('elder-ramesh-001', {
      emergencyContact: '+91 99999 88888',
      notes: 'Updated medication instructions: reduced salt diet'
    });

    assert.equal(updated.emergencyContact, '+91 99999 88888');
    assert.equal(updated.notes, 'Updated medication instructions: reduced salt diet');
  });

  it('should throw 404 when updating a non-existent elder profile', async () => {
    await assert.rejects(
      async () => {
        await service.updateProfile('non-existent-id', {
          emergencyContact: '+91 00000 00000'
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 404);
        assert.equal(err.message, 'Elder profile not found');
        return true;
      }
    );
  });
});
