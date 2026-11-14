import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/pagination';

export const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 characters').max(100),
    description: z.string().max(1000).optional(),
    metadata: z.record(z.any()).optional()
  })
});

export const updateProjectSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid project ID format')
  }),
  body: z.object({
    title: z.string().min(2).max(100).optional(),
    description: z.string().max(1000).optional(),
    status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
    metadata: z.record(z.any()).optional()
  })
});

export const projectParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid project ID format')
  })
});

export const projectQuerySchema = z.object({
  query: paginationQuerySchema.extend({
    status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional()
  })
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>['body'];
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>['body'];
export type ProjectQueryInput = z.input<typeof projectQuerySchema>['query'];
