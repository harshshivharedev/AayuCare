import { ProjectData } from '@prisma/client';
import { IProjectRepository } from './project.repository';
import { CreateProjectInput, UpdateProjectInput, ProjectQueryInput } from './project.schema';
import { calculatePagination, PaginationQuery } from '../../utils/pagination';
import { PaginationMeta } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';
import { AiService } from '../../services/ai/ai.service';

export interface PaginatedProjectsResult {
  items: ProjectData[];
  meta: PaginationMeta;
}

export interface IProjectService {
  getProjects(query: ProjectQueryInput, userId?: string): Promise<PaginatedProjectsResult>;
  getProjectById(id: string): Promise<ProjectData>;
  createProject(input: CreateProjectInput, userId: string, requestId?: string): Promise<ProjectData>;
  updateProject(id: string, input: UpdateProjectInput): Promise<ProjectData>;
  deleteProject(id: string): Promise<ProjectData>;
  runAiInsights(id: string, requestId?: string): Promise<any>;
}

export class ProjectService implements IProjectService {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly aiService: AiService
  ) {}

  async getProjects(query: ProjectQueryInput, userId?: string): Promise<PaginatedProjectsResult> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const { items, total } = await this.projectRepository.findMany({
      userId,
      status: query.status,
      search: query.search,
      skip,
      take: limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder
    });

    const meta = calculatePagination(page, limit, total);
    return { items, meta };
  }

  async getProjectById(id: string): Promise<ProjectData> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw ApiError.notFound(`Project with id [${id}] not found`);
    }
    return project;
  }

  async createProject(input: CreateProjectInput, userId: string, requestId?: string): Promise<ProjectData> {
    return this.projectRepository.create({
      title: input.title,
      description: input.description,
      status: 'PENDING',
      metadata: input.metadata || {},
      user: { connect: { id: userId } }
    });
  }

  async updateProject(id: string, input: UpdateProjectInput): Promise<ProjectData> {
    await this.getProjectById(id); // Ensure existence

    return this.projectRepository.update(id, {
      title: input.title,
      description: input.description,
      status: input.status,
      metadata: input.metadata
    });
  }

  async deleteProject(id: string): Promise<ProjectData> {
    await this.getProjectById(id); // Ensure existence
    return this.projectRepository.delete(id);
  }

  async runAiInsights(id: string, requestId?: string): Promise<any> {
    const project = await this.getProjectById(id);

    const prompt = `Analyze this hackathon project and generate executive recommendations:
Title: ${project.title}
Description: ${project.description || 'No description provided'}
Status: ${project.status}`;

    const aiOutput = await this.aiService.generateStructuredJson(
      prompt,
      { systemInstruction: 'You are an elite enterprise software auditor and system designer.' },
      requestId
    );

    // Save insights back to project metadata
    const updatedMetadata = {
      ...((project.metadata as any) || {}),
      aiInsights: aiOutput.result,
      analyzedAt: new Date().toISOString()
    };

    await this.projectRepository.update(id, {
      metadata: updatedMetadata,
      status: 'COMPLETED'
    });

    return {
      projectId: project.id,
      insights: aiOutput.result,
      provider: aiOutput.provider,
      latencyMs: aiOutput.latencyMs
    };
  }
}
