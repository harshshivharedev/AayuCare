import { User, Prisma } from '@prisma/client';
import { prisma } from '../../config/db';

export interface ElderProfileSummary {
  id: string;
  userId: string;
  fullName: string;
  carePasscode: string;
}

export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  create(data: Prisma.UserCreateInput): Promise<User>;
  update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
  createElderProfile(data: {
    userId: string;
    fullName: string;
    carePasscode: string;
    emergencyContact?: string;
  }): Promise<ElderProfileSummary>;
  findElderProfileByUserId(userId: string): Promise<ElderProfileSummary | null>;
}

export class PrismaAuthRepository implements IAuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id }
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { googleId }
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({
      data
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data
    });
  }

  async createElderProfile(data: {
    userId: string;
    fullName: string;
    carePasscode: string;
    emergencyContact?: string;
  }): Promise<ElderProfileSummary> {
    return prisma.elderProfile.create({
      data: {
        userId: data.userId,
        fullName: data.fullName,
        carePasscode: data.carePasscode,
        emergencyContact: data.emergencyContact || 'Not specified',
        age: 70
      },
      select: {
        id: true,
        userId: true,
        fullName: true,
        carePasscode: true
      }
    });
  }

  async findElderProfileByUserId(userId: string): Promise<ElderProfileSummary | null> {
    return prisma.elderProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        fullName: true,
        carePasscode: true
      }
    });
  }
}
