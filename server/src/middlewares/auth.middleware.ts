import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { ENV } from '../config/env';
import { ApiError } from '../utils/apiError';

// Strict runtime schema validation for JWT payload
export const jwtPayloadSchema = z.object({
  id: z.string().min(1, 'Token must contain a valid subject id'),
  email: z.string().email('Token must contain a valid email address'),
  role: z.enum(['USER', 'ADMIN'])
});

export type AuthenticatedUser = z.infer<typeof jwtPayloadSchema>;

export const authenticateJwt = (req: Request, res: Response, next: NextFunction): void => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw ApiError.unauthorized('Authentication required: Token missing');
    }

    // 1. Cryptographic Signature Verification
    const rawDecoded = jwt.verify(token, ENV.JWT_SECRET);

    // 2. Strict Runtime Schema Validation (Defense against forged/malformed payload)
    const validation = jwtPayloadSchema.safeParse(rawDecoded);
    if (!validation.success) {
      throw ApiError.unauthorized('Invalid authentication token payload structure');
    }

    req.user = validation.data;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      next(ApiError.unauthorized('Authentication token expired, please login again'));
    } else if (error.name === 'JsonWebTokenError') {
      next(ApiError.unauthorized('Malformed or invalid authorization token'));
    } else {
      next(error);
    }
  }
};

/**
 * Role-Based Access Control (RBAC) Middleware
 */
export const requireRole = (...allowedRoles: Array<'USER' | 'ADMIN'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access forbidden: Requires one of [${allowedRoles.join(', ')}] role`
        )
      );
    }

    next();
  };
};

/**
 * Resource Ownership Verification Middleware
 */
export const requireOwnership = (
  getResourceOwnerId: (req: Request) => Promise<string | null | undefined>
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized('Authentication required'));
      }

      // Admins bypass ownership checks
      if (req.user.role === 'ADMIN') {
        return next();
      }

      const ownerId = await getResourceOwnerId(req);

      if (!ownerId) {
        return next(ApiError.notFound('Resource owner not found'));
      }

      if (ownerId !== req.user.id) {
        return next(
          ApiError.forbidden('Forbidden: You do not have permission to modify this resource')
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
