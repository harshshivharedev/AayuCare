import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ProjectService } from './project.service';
import { IProjectRepository, FindProjectsFilter } from './project.repository';
import { ProjectData, Prisma } from '@prisma/client';
import { AiService } from '../../services/ai/ai.service';
import { MockAiProvider } from '../../services/ai/mock.provider';

// Liskov Substitution Principle (LSP): MockProjectRepository substitutes PrismaProjectRepository seamlessly
class InMemoryMockProjectRepository implements IProjectRepository {
  private store: Map<string, ProjectData> = new Map();

  async findById(id: string): Promise<ProjectData | null> {
    return this.store.get(id) || null;
  }

  async findMany(filter: FindProjectsFilter): Promise<{ items: ProjectData[]; total: number }> {
    const all = Array.from(this.store.values());
    const filtered = filter.userId ? all.filter((p) => p.userId === filter.userId) : all;
    return {
      items: filtered.slice(filter.skip, filter.skip + filter.take),
      total: filtered.length
    };
  }

  async create(data: Prisma.ProjectDataCreateInput): Promise<ProjectData> {
    const id = `test-uuid-${Date.now()}-${Math.random()}`;
    const project: ProjectData = {
      id,
      title: data.title,
      description: data.description || null,
      status: data.status || 'PENDING',
      metadata: (data.metadata as any) || null,
      userId: (data.user?.connect?.id as string) || 'default-user',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.store.set(id, project);
    return project;
  }

  async update(id: string, data: Prisma.ProjectDataUpdateInput): Promise<ProjectData> {
    const existing = this.store.get(id);
    if (!existing) throw new Error('Not found');
    const updated: ProjectData = {
      ...existing,
      title: (data.title as string) ?? existing.title,
      description: (data.description as string) ?? existing.description,
      status: (data.status as string) ?? existing.status,
      metadata: (data.metadata as any) ?? existing.metadata,
      updatedAt: new Date()
    };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<ProjectData> {
    const existing = this.store.get(id);
    if (!existing) throw new Error('Not found');
    this.store.delete(id);
    return existing;
  }
}

describe('ProjectService Unit Tests (SOLID Verification)', () => {
  const mockRepo = new InMemoryMockProjectRepository();
  const mockAi = new AiService(new MockAiProvider(), new MockAiProvider());
  const service = new ProjectService(mockRepo, mockAi);

  it('should create a project via repository contract (DIP)', async () => {
    const project = await service.createProject(
      { title: 'Catalyst Hackathon Core', description: 'Enterprise MVP' },
      'user-123'
    );

    assert.equal(project.title, 'Catalyst Hackathon Core');
    assert.equal(project.status, 'PENDING');
    assert.equal(project.userId, 'user-123');
  });

  it('should retrieve paginated projects with correct metadata', async () => {
    const result = await service.getProjects({ page: 1, limit: 10 }, 'user-123');

    assert.equal(result.items.length, 1);
    assert.equal(result.meta.page, 1);
    assert.equal(result.meta.totalItems, 1);
    assert.equal(result.meta.totalPages, 1);
    assert.equal(result.meta.hasNextPage, false);
  });

  it('should execute AI analysis and update project status', async () => {
    const created = await service.createProject(
      { title: 'AI Analysis Test', description: 'Testing AI insights generation' },
      'user-123'
    );

    const analysis = await service.runAiInsights(created.id);

    assert.equal(analysis.projectId, created.id);
    assert.ok(analysis.insights);

    const updated = await service.getProjectById(created.id);
    assert.equal(updated.status, 'COMPLETED');
  });
});
