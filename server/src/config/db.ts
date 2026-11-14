import { PrismaClient, Prisma } from '@prisma/client';
import { ENV } from './env';

// Singleton pattern for Prisma Client to prevent connection exhaustion
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const logLevels: Prisma.LogLevel[] =
  ENV.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'];

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: logLevels
  });

if (ENV.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectDB(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL database connected successfully via Prisma');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    // Graceful continuation so offline/mock dev works
  }
}
