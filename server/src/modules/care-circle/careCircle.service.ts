import { ICareCircleRepository, ElderProfileRecord, CareCircleMemberRecord } from './careCircle.repository';
import { ApiError } from '../../utils/apiError';
import { AccessRole } from '@prisma/client';

export class CareCircleService {
  constructor(private readonly repo: ICareCircleRepository) {}

  async pairWithElder(caregiverUserId: string, passcode: string): Promise<{ elder: ElderProfileRecord; access: CareCircleMemberRecord }> {
    const elder = await this.repo.findByPasscode(passcode);
    if (!elder) {
      throw ApiError.notFound('Invalid CarePasscode. Please verify the 6-character code with your elder.');
    }

    const access = await this.repo.addMember(elder.id, caregiverUserId, AccessRole.PRIMARY_ADMIN);
    return { elder, access };
  }

  async getElderProfile(elderProfileId: string): Promise<ElderProfileRecord> {
    const profile = await this.repo.findById(elderProfileId);
    if (!profile) {
      throw ApiError.notFound('Elder profile not found');
    }
    return profile;
  }

  async getProfileForUser(userId: string, role: string): Promise<ElderProfileRecord | null> {
    if (role === 'ELDERLY') {
      return await this.repo.findByElderUserId(userId);
    }
    // For caregiver, return the first linked elder (or null if not yet paired)
    const elders = await this.repo.getEldersForCaregiver(userId);
    return elders.length > 0 ? elders[0] : null;
  }

  async getCareCircleMembers(elderProfileId: string): Promise<CareCircleMemberRecord[]> {
    return await this.repo.getMembers(elderProfileId);
  }

  async updateElderProfile(elderProfileId: string, data: Partial<ElderProfileRecord>): Promise<ElderProfileRecord> {
    return await this.repo.updateProfile(elderProfileId, data);
  }
}
