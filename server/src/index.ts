import app from './app';
import { ENV } from './config/env';
import { connectDB, prisma } from './config/db';
import { logger } from './utils/logger';

async function bootstrap() {
  await connectDB();

  const server = app.listen(ENV.PORT, () => {
    logger.info(`🚀 Catalyst Backend Server running on port ${ENV.PORT} [${ENV.NODE_ENV}]`);
    logger.info(`🔗 Health check available at: http://localhost:${ENV.PORT}/api/health`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Database disconnected. Process exited.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
