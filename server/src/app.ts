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
import aiRoutes from './modules/ai/ai.routes';

const app: Application = express();

// 1. Request ID Tracing (must be first)
app.use(requestIdMiddleware);

// 2. Hardened Security Headers
app.use(helmet());

// 3. Strict CORS Whitelist (Zero Wildcards)
const allowedOrigins = [
  ENV.CLIENT_URL.replace(/\/$/, '')
];

if (ENV.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173');
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin only in development (curl, postman)
      if (!origin) {
        if (ENV.NODE_ENV === 'development') {
          return callback(null, true);
        }
        return callback(ApiError.forbidden('CORS: Missing Origin header'));
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(ApiError.forbidden(`CORS: Origin [${origin}] is not authorized`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
  })
);

// 4. Strict Body Parsers (1MB limit to protect against memory exhaustion)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// 5. Rate Limiting
app.use('/api', apiRateLimiter);

// 6. Application Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ai', aiRoutes);

// 7. 404 Route Handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Route [${req.method} ${req.originalUrl}] does not exist on this server.`));
});

// 8. Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
