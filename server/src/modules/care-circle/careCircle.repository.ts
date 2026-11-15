import { AccessRole } from '@prisma/client';
import { prisma } from '../../config/db';

export interface ElderProfileRecord {
  id: string;
  userId: string;
  fullName: string;
  age: number;
  bloodGroup: string | null;
  emergencyContact: string;
  carePasscode: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CareCircleMemberRecord {
  id: string;
  elderProfileId: string;
  userId: string;
  userName: string;
  userEmail: string;
  accessRole: AccessRole;
  grantedAt: Date;
}

export interface ICareCircleRepository {
  findByPasscode(passcode: string): Promise<ElderProfileRecord | null>;
  findByElderUserId(userId: string): Promise<ElderProfileRecord | null>;
  findById(id: string): Promise<ElderProfileRecord | null>;
  addCaregiverAccess(elderProfileId: string, userId: string, role?: AccessRole): Promise<CareCircleMemberRecord>;
  getLinkedEldersForCaregiver(userId: string): Promise<ElderProfileRecord[]>;
  getCircleMembersForElder(elderProfileId: string): Promise<CareCircleMemberRecord[]>;
  updateElderProfile(id: string, data: Partial<ElderProfileRecord>): Promise<ElderProfileRecord>;
}

// In-Memory implementation for fast, isolated unit testing (LSP / DIP)
export class InMemoryCareCircleRepository implements ICareCircleRepository {
  public profiles: ElderProfileRecord[] = [
    {
      id: 'elder-ramesh-001',
      userId: 'user-ramesh-001',
      fullName: 'Ramesh Sharma',
      age: 74,
      bloodGroup: 'B+',
      emergencyContact: '+91 98765 43210',
      carePasscode: 'CARE-8421',
      notes: 'Hypertension and Type-2 Diabetes management',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  public accesses: CareCircleMemberRecord[] = [];

  async findByPasscode(passcode: string): Promise<ElderProfileRecord | null> {
    const code = passcode.trim().toUpperCase();
    return this.profiles.find((p) => p.carePasscode.toUpperCase() === code) || null;
  }

  async findByElderUserId(userId: string): Promise<ElderProfileRecord | null> {
    return this.profiles.find((p) => p.userId === userId) || null;
  }

  async findById(id: string): Promise<ElderProfileRecord | null> {
    return this.profiles.find((p) => p.id === id) || null;
  }

  async addCaregiverAccess(
    elderProfileId: string,
    userId: string,
    role: AccessRole = AccessRole.PRIMARY_ADMIN
  ): Promise<CareCircleMemberRecord> {
    const existing = this.accesses.find(
      (a) => a.elderProfileId === elderProfileId && a.userId === userId
    );
    if (existing) return existing;

    const record: CareCircleMemberRecord = {
      id: `access-${Date.now()}`,
      elderProfileId,
      userId,
      userName: 'Family Caregiver',
      userEmail: 'caregiver@example.com',
      accessRole: role,
      grantedAt: new Date()
    };
    this.accesses.push(record);
    return record;
  }

  async getLinkedEldersForCaregiver(userId: string): Promise<ElderProfileRecord[]> {
    const elderIds = this.accesses
      .filter((a) => a.userId === userId)
      .map((a) => a.elderProfileId);
    return this.profiles.filter((p) => elderIds.includes(p.id));
  }

  async getCircleMembersForElder(elderProfileId: string): Promise<CareCircleMemberRecord[]> {
    return this.accesses.filter((a) => a.elderProfileId === elderProfileId);
  }

  async updateElderProfile(
    id: string,
    data: Partial<ElderProfileRecord>
  ): Promise<ElderProfileRecord> {
    const profile = await this.findById(id);
    if (!profile) throw new Error('Elder profile not found');
    Object.assign(profile, data, { updatedAt: new Date() });
    return profile;
  }
}

export class PrismaCareCircleRepository implements ICareCircleRepository {
  private fallback = new InMemoryCareCircleRepository();

  async findByPasscode(passcode: string): Promise<ElderProfileRecord | null> {
    try {
      const code = passcode.trim().toUpperCase();
      return await prisma.elderProfile.findUnique({
        where: { carePasscode: code }
      });
    } catch {
      return this.fallback.findByPasscode(passcode);
    }
  }

  async findByElderUserId(userId: string): Promise<ElderProfileRecord | null> {
    try {
      return await prisma.elderProfile.findUnique({
        where: { userId }
      });
    } catch {
      return this.fallback.findByElderUserId(userId);
    }
  }

  async findById(id: string): Promise<ElderProfileRecord | null> {
    try {
      return await prisma.elderProfile.findUnique({
        where: { id }
      });
    } catch {
      return this.fallback.findById(id);
    }
  }

  async addCaregiverAccess(
    elderProfileId: string,
    userId: string,
    role: AccessRole = AccessRole.PRIMARY_ADMIN
  ): Promise<CareCircleMemberRecord> {
    try {
      const record = await prisma.careCircleAccess.upsert({
        where: {
          elderProfileId_userId: { elderProfileId, userId }
        },
        update: { accessRole: role },
        create: {
          elderProfileId,
          userId,
          accessRole: role
        },
        include: { user: true }
      });

      return {
        id: record.id,
        elderProfileId: record.elderProfileId,
        userId: record.userId,
        userName: record.user.name,
        userEmail: record.user.email,
        accessRole: record.accessRole,
        grantedAt: record.grantedAt
      };
    } catch {
      return this.fallback.addCaregiverAccess(elderProfileId, userId, role);
    }
  }

  async getLinkedEldersForCaregiver(userId: string): Promise<ElderProfileRecord[]> {
    try {
      const accesses = await prisma.careCircleAccess.findMany({
        where: { userId },
        include: { elderProfile: true }
      });
      return accesses.map((a) => a.elderProfile);
    } catch {
      return this.fallback.getLinkedEldersForCaregiver(userId);
    }
  }

  async getCircleMembersForElder(elderProfileId: string): Promise<CareCircleMemberRecord[]> {
    try {
      const accesses = await prisma.careCircleAccess.findMany({
        where: { elderProfileId },
        include: { user: true }
      });
      return accesses.map((a) => ({
        id: a.id,
        elderProfileId: a.elderProfileId,
        userId: a.userId,
        userName: a.user.name,
        userEmail: a.user.email,
        accessRole: a.accessRole,
        grantedAt: a.grantedAt
      }));
    } catch {
      return this.fallback.getCircleMembersForElder(elderProfileId);
    }
  }

  async updateElderProfile(
    id: string,
    data: Partial<ElderProfileRecord>
  ): Promise<ElderProfileRecord> {
    try {
      return await prisma.elderProfile.update({
        where: { id },
        data
      });
    } catch {
      return this.fallback.updateElderProfile(id, data);
    }
  }
}
