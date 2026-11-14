import { Request, Response, NextFunction } from 'express';
import { IProjectService } from './project.service';
import { ApiResponse } from '../../utils/apiResponse';

export class ProjectController {
  constructor(private readonly projectService: IProjectService) {}

  private getParamId(req: Request): string {
    const id = req.params.id;
    return Array.isArray(id) ? id[0] : id;
  }

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.role === 'ADMIN' ? undefined : req.user?.id;
      const result = await this.projectService.getProjects(req.query as any, userId);
      res.status(200).json(ApiResponse.paginated('Projects fetched successfully', result.items, result.meta));
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const project = await this.projectService.getProjectById(this.getParamId(req));
      res.status(200).json(ApiResponse.success('Project retrieved successfully', project));
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const project = await this.projectService.createProject(req.body, userId, req.id);
      res.status(201).json(ApiResponse.success('Project created successfully', project));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const updated = await this.projectService.updateProject(this.getParamId(req), req.body);
      res.status(200).json(ApiResponse.success('Project updated successfully', updated));
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await this.projectService.deleteProject(this.getParamId(req));
      res.status(200).json(ApiResponse.success('Project deleted successfully', deleted));
    } catch (error) {
      next(error);
    }
  };

  analyzeWithAi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const insights = await this.projectService.runAiInsights(this.getParamId(req), req.id);
      res.status(200).json(ApiResponse.success('AI analysis executed successfully', insights));
    } catch (error) {
      next(error);
    }
  };
}
