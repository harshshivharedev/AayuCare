import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env';
import { apiRateLimiter } from './middlewares/rateLimiter.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { requestIdMiddleware } from './middlewares/requestId.middleware';
import { ApiError } from './utils/apiError';

// Routes
import authRoutes from './modules/auth/auth.routes';
import healthRoutes from './modules/health/health.routes';
import projectRoutes from './modules/project/project.routes';

const app: Application = express();

// Request ID Tracing (must be before logger / routes)
app.use(requestIdMiddleware);

// Hardened Security Headers
app.use(helmet());

// Production-Safe CORS Whitelist
const allowedOrigins = [
  ENV.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, postman, mobile) or explicit whitelist
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(ApiError.forbidden(`Origin [${origin}] is not allowed by CORS policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
  })
);

// Strict Body Parsers (1mb payload limit for security against memory exhaustion)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Rate Limiting
app.use('/api', apiRateLimiter);

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// 404 Route Handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Route [${req.method} ${req.originalUrl}] does not exist on this server.`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
