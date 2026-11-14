import { PrismaClient } from '@prisma/client';
import { ENV } from './env';

// Singleton pattern for Prisma Client to prevent connection exhaustion
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ENV.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
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
    // Don't exit immediately so app can still boot for mock/health checks if needed
  }
}
