import { prisma } from '../../config/db';
import { AccessRole } from '@prisma/client';

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
  addMember(elderProfileId: string, userId: string, role?: AccessRole): Promise<CareCircleMemberRecord>;
  getMembers(elderProfileId: string): Promise<CareCircleMemberRecord[]>;
  getEldersForCaregiver(userId: string): Promise<ElderProfileRecord[]>;
  updateProfile(id: string, data: Partial<ElderProfileRecord>): Promise<ElderProfileRecord>;
}

// In-Memory Seed Data for Offline / Fallback Reliability
const inMemoryProfiles: ElderProfileRecord[] = [
  {
    id: 'elder-ramesh-001',
    userId: 'user-ramesh-001',
    fullName: 'Ramesh Sharma',
    age: 74,
    bloodGroup: 'B+',
    emergencyContact: '+91 98765 43210',
    carePasscode: 'CARE-8421',
    notes: 'Hypertension (BP) and Type-2 Diabetes management. Mild morning disorientation.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const inMemoryAccess: CareCircleMemberRecord[] = [
  {
    id: 'access-priya-001',
    elderProfileId: 'elder-ramesh-001',
    userId: 'user-priya-001',
    userName: 'Priya Sharma (Daughter)',
    userEmail: 'priya.sharma@aayucare.in',
    accessRole: AccessRole.PRIMARY_ADMIN,
    grantedAt: new Date(),
  },
];

export class InMemoryCareCircleRepository implements ICareCircleRepository {
  private profiles = [...inMemoryProfiles];
  private access = [...inMemoryAccess];

  async findByPasscode(passcode: string): Promise<ElderProfileRecord | null> {
    const normalized = passcode.trim().toUpperCase();
    return this.profiles.find((p) => p.carePasscode.toUpperCase() === normalized) || null;
  }

  async findByElderUserId(userId: string): Promise<ElderProfileRecord | null> {
    return this.profiles.find((p) => p.userId === userId) || null;
  }

  async findById(id: string): Promise<ElderProfileRecord | null> {
    return this.profiles.find((p) => p.id === id) || null;
  }

  async addMember(elderProfileId: string, userId: string, role: AccessRole = AccessRole.PRIMARY_ADMIN): Promise<CareCircleMemberRecord> {
    const existing = this.access.find((a) => a.elderProfileId === elderProfileId && a.userId === userId);
    if (existing) return existing;

    const newRecord: CareCircleMemberRecord = {
      id: `access-${Date.now()}`,
      elderProfileId,
      userId,
      userName: 'Caregiver Member',
      userEmail: 'caregiver@aayucare.in',
      accessRole: role,
      grantedAt: new Date(),
    };
    this.access.push(newRecord);
    return newRecord;
  }

  async getMembers(elderProfileId: string): Promise<CareCircleMemberRecord[]> {
    return this.access.filter((a) => a.elderProfileId === elderProfileId);
  }

  async getEldersForCaregiver(userId: string): Promise<ElderProfileRecord[]> {
    const elderIds = this.access.filter((a) => a.userId === userId).map((a) => a.elderProfileId);
    return this.profiles.filter((p) => elderIds.includes(p.id));
  }

  async updateProfile(id: string, data: Partial<ElderProfileRecord>): Promise<ElderProfileRecord> {
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
      const profile = await prisma.elderProfile.findUnique({
        where: { carePasscode: passcode.trim().toUpperCase() },
      });
      return profile;
    } catch {
      return this.fallback.findByPasscode(passcode);
    }
  }

  async findByElderUserId(userId: string): Promise<ElderProfileRecord | null> {
    try {
      const profile = await prisma.elderProfile.findUnique({
        where: { userId },
      });
      return profile;
    } catch {
      return this.fallback.findByElderUserId(userId);
    }
  }

  async findById(id: string): Promise<ElderProfileRecord | null> {
    try {
      return await prisma.elderProfile.findUnique({ where: { id } });
    } catch {
      return this.fallback.findById(id);
    }
  }

  async addMember(elderProfileId: string, userId: string, role: AccessRole = AccessRole.PRIMARY_ADMIN): Promise<CareCircleMemberRecord> {
    try {
      const record = await prisma.careCircleAccess.upsert({
        where: {
          elderProfileId_userId: { elderProfileId, userId },
        },
        update: { accessRole: role },
        create: {
          elderProfileId,
          userId,
          accessRole: role,
        },
        include: { user: true },
      });

      return {
        id: record.id,
        elderProfileId: record.elderProfileId,
        userId: record.userId,
        userName: record.user.name,
        userEmail: record.user.email,
        accessRole: record.accessRole,
        grantedAt: record.grantedAt,
      };
    } catch {
      return this.fallback.addMember(elderProfileId, userId, role);
    }
  }

  async getMembers(elderProfileId: string): Promise<CareCircleMemberRecord[]> {
    try {
      const members = await prisma.careCircleAccess.findMany({
        where: { elderProfileId },
        include: { user: true },
      });

      return members.map((m) => ({
        id: m.id,
        elderProfileId: m.elderProfileId,
        userId: m.userId,
        userName: m.user.name,
        userEmail: m.user.email,
        accessRole: m.accessRole,
        grantedAt: m.grantedAt,
      }));
    } catch {
      return this.fallback.getMembers(elderProfileId);
    }
  }

  async getEldersForCaregiver(userId: string): Promise<ElderProfileRecord[]> {
    try {
      const accesses = await prisma.careCircleAccess.findMany({
        where: { userId },
        include: { elderProfile: true },
      });
      return accesses.map((a) => a.elderProfile);
    } catch {
      return this.fallback.getEldersForCaregiver(userId);
    }
  }

  async updateProfile(id: string, data: Partial<ElderProfileRecord>): Promise<ElderProfileRecord> {
    try {
      return await prisma.elderProfile.update({
        where: { id },
        data,
      });
    } catch {
      return this.fallback.updateProfile(id, data);
    }
  }
}
