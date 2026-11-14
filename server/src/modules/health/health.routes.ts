import { Router, Request, Response } from 'express';
import { prisma } from '../../config/db';
import { ApiResponse } from '../../utils/apiResponse';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  let dbStatus = 'healthy';
  let dbLatencyMs = 0;

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
  } catch (error) {
    dbStatus = 'disconnected';
  }

  const memoryUsage = process.memoryUsage();

  res.status(200).json(
    ApiResponse.success('System health check passed', {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs
      },
      system: {
        memoryHeapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        nodeVersion: process.version
      }
    })
  );
});

export default router;
