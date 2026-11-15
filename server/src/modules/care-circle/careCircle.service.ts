import {
  ICareCircleRepository,
  ElderProfileRecord,
  CareCircleMemberRecord
} from './careCircle.repository';
import { ApiError } from '../../utils/apiError';
import { AccessRole } from '@prisma/client';

export class CareCircleService {
  constructor(private readonly repo: ICareCircleRepository) {}

  async pairWithElder(
    caregiverUserId: string,
    carePasscode: string
  ): Promise<{ elder: ElderProfileRecord; access: CareCircleMemberRecord }> {
    const normalizedCode = carePasscode.trim().toUpperCase();
    const elder = await this.repo.findByPasscode(normalizedCode);

    if (!elder) {
      throw ApiError.notFound(
        `Invalid CarePasscode [${normalizedCode}]. Please check the CarePasscode shown on the elder's screen (e.g. CARE-8421).`
      );
    }

    if (elder.userId === caregiverUserId) {
      throw ApiError.badRequest('You cannot pair with your own elder profile.');
    }

    const access = await this.repo.addCaregiverAccess(
      elder.id,
      caregiverUserId,
      AccessRole.PRIMARY_ADMIN
    );

    return { elder, access };
  }

  async getLinkedElders(caregiverUserId: string): Promise<ElderProfileRecord[]> {
    return await this.repo.getLinkedEldersForCaregiver(caregiverUserId);
  }

  async getMembers(elderProfileId: string): Promise<CareCircleMemberRecord[]> {
    const elder = await this.repo.findById(elderProfileId);
    if (!elder) {
      throw ApiError.notFound('Elder profile not found');
    }
    return await this.repo.getCircleMembersForElder(elderProfileId);
  }

  async updateProfile(
    elderProfileId: string,
    data: Partial<ElderProfileRecord>
  ): Promise<ElderProfileRecord> {
    const elder = await this.repo.findById(elderProfileId);
    if (!elder) {
      throw ApiError.notFound('Elder profile not found');
    }
    return await this.repo.updateElderProfile(elderProfileId, data);
  }
}
