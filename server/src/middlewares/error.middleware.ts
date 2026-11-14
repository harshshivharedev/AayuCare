import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';
import { ENV } from '../config/env';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any[] = [];
  const requestId = req.id;

  // 1. Handled Operational Errors
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } 
  // 2. Zod Validation Errors
  else if (err instanceof ZodError) {
    statusCode = 422;
    message = 'Request validation failed';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));
  }
  // 3. Prisma Known Database Request Errors
  else if (err.name === 'PrismaClientKnownRequestError') {
    switch (err.code) {
      case 'P2002': {
        statusCode = 409;
        const target = (err.meta?.target as string[])?.join(', ') || 'field';
        message = `A resource with this ${target} already exists.`;
        errors = [{ field: target, message: 'Must be unique' }];
        break;
      }
      case 'P2025': {
        statusCode = 404;
        message = (err.meta?.cause as string) || 'Requested record was not found.';
        break;
      }
      case 'P2003': {
        statusCode = 400;
        message = 'Foreign key constraint violation: Related entity does not exist.';
        break;
      }
      case 'P2014': {
        statusCode = 400;
        message = 'Invalid relation mutation: A required relational link was broken.';
        break;
      }
      case 'P2000': {
        statusCode = 400;
        message = 'Input value exceeds maximum allowed column length.';
        break;
      }
      default: {
        statusCode = 400;
        message = 'Database operation failed.';
        break;
      }
    }
  } 
  // 4. JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired.';
  }

  // Structured Logging
  logger.error(
    `[${req.method}] ${req.originalUrl} - ${statusCode} - ${message}`,
    requestId,
    { errors, stack: ENV.NODE_ENV === 'development' ? err.stack : undefined }
  );

  res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : undefined,
    requestId,
    timestamp: new Date().toISOString(),
    stack: ENV.NODE_ENV === 'development' && statusCode === 500 ? err.stack : undefined
  });
};
