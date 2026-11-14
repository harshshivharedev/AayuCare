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
  // 3. Prisma Known Request Errors (checks both error name and code for bulletproof detection)
  else if (
    err.name === 'PrismaClientKnownRequestError' ||
    (typeof err.code === 'string' && err.code.startsWith('P'))
  ) {
    switch (err.code) {
      case 'P2002': {
        statusCode = 409;
        const target = Array.isArray(err.meta?.target)
          ? err.meta.target.join(', ')
          : (err.meta?.target as string) || 'unique field';
        message = `A resource with this ${target} already exists.`;
        errors = [{ field: target, message: 'Value must be unique' }];
        break;
      }
      case 'P2025': {
        statusCode = 404;
        message = (err.meta?.cause as string) || 'Requested record was not found in database.';
        break;
      }
      case 'P2003': {
        statusCode = 400;
        message = 'Foreign key constraint failed: Referenced entity does not exist.';
        break;
      }
      case 'P2014': {
        statusCode = 400;
        message = 'Relation mutation rejected: A required relational link was broken.';
        break;
      }
      case 'P2000': {
        statusCode = 400;
        message = 'Input length exceeds maximum allowed database column capacity.';
        break;
      }
      default: {
        statusCode = 400;
        message = `Database constraint error [${err.code}].`;
        break;
      }
    }
  }
  // 4. Prisma Validation Error
  else if (err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid database query arguments provided.';
  }
  // 5. JWT Authentication Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authorization token.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authorization token has expired.';
  } else if (err.message && ENV.NODE_ENV === 'development') {
    message = err.message;
  }

  // Structured Logging with Request ID
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
