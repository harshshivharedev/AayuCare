import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { ApiError } from '../utils/apiError';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

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

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (error: any) {
    next(error);
  }
};

/**
 * Role-Based Access Control (RBAC) Middleware
 * Verifies if the authenticated user has one of the allowed roles
 */
export const requireRole = (...allowedRoles: Array<'USER' | 'ADMIN'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role as any)) {
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
 * Ownership Verification Middleware
 * Ensures the resource being modified belongs to the requester, or requester is ADMIN
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
