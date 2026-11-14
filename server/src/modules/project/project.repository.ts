import { ProjectData, Prisma } from '@prisma/client';
import { prisma } from '../../config/db';

export interface FindProjectsFilter {
  userId?: string;
  status?: string;
  search?: string;
  skip: number;
  take: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IProjectRepository {
  findById(id: string): Promise<ProjectData | null>;
  findMany(filter: FindProjectsFilter): Promise<{ items: ProjectData[]; total: number }>;
  create(data: Prisma.ProjectDataCreateInput): Promise<ProjectData>;
  update(id: string, data: Prisma.ProjectDataUpdateInput): Promise<ProjectData>;
  delete(id: string): Promise<ProjectData>;
}

export class PrismaProjectRepository implements IProjectRepository {
  async findById(id: string): Promise<ProjectData | null> {
    return prisma.projectData.findUnique({
      where: { id }
    });
  }

  async findMany(filter: FindProjectsFilter): Promise<{ items: ProjectData[]; total: number }> {
    const where: Prisma.ProjectDataWhereInput = {};

    if (filter.userId) where.userId = filter.userId;
    if (filter.status) where.status = filter.status;
    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } }
      ];
    }

    const orderBy: Prisma.ProjectDataOrderByWithRelationInput = {
      [filter.sortBy || 'createdAt']: filter.sortOrder || 'desc'
    };

    const [items, total] = await prisma.$transaction([
      prisma.projectData.findMany({
        where,
        skip: filter.skip,
        take: filter.take,
        orderBy
      }),
      prisma.projectData.count({ where })
    ]);

    return { items, total };
  }

  async create(data: Prisma.ProjectDataCreateInput): Promise<ProjectData> {
    return prisma.projectData.create({ data });
  }

  async update(id: string, data: Prisma.ProjectDataUpdateInput): Promise<ProjectData> {
    return prisma.projectData.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<ProjectData> {
    return prisma.projectData.delete({
      where: { id }
    });
  }
}
