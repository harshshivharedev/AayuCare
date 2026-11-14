import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env';
import { apiRateLimiter } from './middlewares/rateLimiter.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { ApiError } from './utils/apiError';

// Routes
import authRoutes from './modules/auth/auth.routes';
import healthRoutes from './modules/health/health.routes';

const app: Application = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, postman) or localhost/client url
      if (!origin || origin === ENV.CLIENT_URL || origin.includes('localhost')) {
        callback(null, true);
      } else {
        callback(null, true); // Allow during hackathon testing, can be tightened
      }
    },
    credentials: true
  })
);

// Standard Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiting
app.use('/api', apiRateLimiter);

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

// 404 Route Handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Path [${req.method} ${req.originalUrl}] not found on server`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
