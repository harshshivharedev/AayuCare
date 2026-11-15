import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodObject } from 'zod';
import { ApiError } from '../utils/apiError';

export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isWrapped =
        schema instanceof ZodObject &&
        ('body' in schema.shape || 'query' in schema.shape || 'params' in schema.shape);

      if (isWrapped) {
        await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params
        });
      } else {
        await schema.parseAsync(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        next(ApiError.badRequest('Validation Failed', formattedErrors));
      } else {
        next(error);
      }
    }
  };
};
