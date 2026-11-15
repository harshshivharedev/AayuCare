import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env';
import { apiRateLimiter } from './middlewares/rateLimiter.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { requestIdMiddleware } from './middlewares/requestId.middleware';
import { ApiError } from './utils/apiError';

// Base Routes
import healthRoutes from './modules/health/health.routes';
import authRoutes from './modules/auth/auth.routes';
import careCircleRoutes from './modules/care-circle/careCircle.routes';
import medicationRoutes from './modules/medication/medication.routes';
import uploadRoutes from './modules/upload/upload.routes';
import appointmentRoutes from './modules/appointment/appointment.routes';
import alertRoutes from './modules/alert/alert.routes';
import aiRoutes from './modules/ai/ai.routes';

const app: Application = express();

// 1. Request ID Tracing
app.use(requestIdMiddleware);

// 2. Security Headers
app.use(helmet());

// 3. CORS
const allowedOrigins = [
  ENV.CLIENT_URL.replace(/\/$/, '')
];

if (ENV.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173');
}

app.use(
  cors({
    origin: (origin, callback) => {
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

// 4. Body Parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// 5. Rate Limiting
app.use('/api', apiRateLimiter);

// 6. Application Routes
app.use('/uploads', express.static('uploads'));
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/care-circle', careCircleRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/ai', aiRoutes);

// 7. 404 Route Handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Route [${req.method} ${req.originalUrl}] does not exist on this server.`));
});

// 8. Centralized Error Handler
app.use(errorHandler);

export default app;
