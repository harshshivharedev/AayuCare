import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaAuthRepository } from './auth.repository';
import { validateRequest } from '../../middlewares/validate.middleware';
import { registerSchema, loginSchema, googleAuthSchema } from './auth.schema';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { authRateLimiter } from '../../middlewares/rateLimiter.middleware';

const router = Router();

// Dependency Injection wiring (SOLID Principle: Dependency Inversion)
const authRepository = new PrismaAuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

router.post(
  '/register',
  authRateLimiter,
  validateRequest(registerSchema),
  authController.register
);

router.post(
  '/login',
  authRateLimiter,
  validateRequest(loginSchema),
  authController.login
);

// 1-Click Google OAuth 2.0 Sign-In
router.post(
  '/google',
  authRateLimiter,
  validateRequest(googleAuthSchema),
  authController.googleAuth
);

router.post(
  '/logout',
  authController.logout
);

router.get(
  '/me',
  authenticateJwt,
  authController.getMe
);

export default router;
