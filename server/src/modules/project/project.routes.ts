import { Router } from 'express';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { PrismaProjectRepository } from './project.repository';
import { aiService } from '../../services/ai/ai.service';
import { authenticateJwt, requireOwnership } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  createProjectSchema,
  updateProjectSchema,
  projectParamSchema,
  projectQuerySchema
} from './project.schema';

const router = Router();

// Dependency Injection Wiring (Strict SOLID Principle: Dependency Inversion)
const projectRepository = new PrismaProjectRepository();
const projectService = new ProjectService(projectRepository, aiService);
const projectController = new ProjectController(projectService);

// Helper for ownership middleware
const getOwnerId = async (req: any) => {
  const project = await projectRepository.findById(req.params.id);
  return project?.userId;
};

// All routes require authentication
router.use(authenticateJwt);

router.get(
  '/',
  validateRequest(projectQuerySchema),
  projectController.getAll
);

router.get(
  '/:id',
  validateRequest(projectParamSchema),
  projectController.getById
);

router.post(
  '/',
  validateRequest(createProjectSchema),
  projectController.create
);

router.patch(
  '/:id',
  validateRequest(updateProjectSchema),
  requireOwnership(getOwnerId),
  projectController.update
);

router.delete(
  '/:id',
  validateRequest(projectParamSchema),
  requireOwnership(getOwnerId),
  projectController.delete
);

router.post(
  '/:id/analyze',
  validateRequest(projectParamSchema),
  requireOwnership(getOwnerId),
  projectController.analyzeWithAi
);

export default router;
