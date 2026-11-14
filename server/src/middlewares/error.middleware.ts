import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';
import { ENV } from '../config/env';

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any[] = [];

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors || [];
  } else if (err.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    message = 'Database operation failed due to a constraint violation';
  } else {
    message = err.message || message;
  }

  logger.error(`[${req.method}] ${req.url} -> ${statusCode} - ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: ENV.NODE_ENV === 'development' ? err.stack : undefined
  });
};
