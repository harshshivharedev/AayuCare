export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'USER' | 'ADMIN';
      };
      cookies?: Record<string, any>;
      id?: string;
    }
  }
}
