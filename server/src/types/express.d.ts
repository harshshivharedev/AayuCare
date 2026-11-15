export {};

export type UserRole = 'ELDERLY' | 'CAREGIVER' | 'FAMILY' | 'ADMIN';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
      cookies?: Record<string, any>;
      id?: string;
    }
  }
}
