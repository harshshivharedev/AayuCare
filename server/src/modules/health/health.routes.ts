import { Router, Request, Response } from 'express';
import { prisma } from '../../config/db';
import { ApiResponse } from '../../utils/apiResponse';

const router = Router();

// Liveness probe (Kubernetes / Render / Cloud health check)
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json(
    ApiResponse.success('Server process is alive', {
      status: 'UP',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    })
  );
});

// Readiness probe (Checks critical infrastructure like PostgreSQL)
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;

    res.status(200).json(
      ApiResponse.success('Server is ready to accept traffic', {
        status: 'READY',
        database: { status: 'healthy', latencyMs },
        timestamp: new Date().toISOString()
      })
    );
  } catch (error: any) {
    res.status(503).json(
      ApiResponse.error('Server is not ready: Database unreachable', {
        status: 'NOT_READY',
        database: { status: 'unhealthy', error: error.message },
        timestamp: new Date().toISOString()
      })
    );
  }
});

// Comprehensive Diagnostic summary
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

  const memory = process.memoryUsage();

  res.status(200).json(
    ApiResponse.success('Full system health diagnostics', {
      status: dbStatus === 'healthy' ? 'UP' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs
      },
      system: {
        memoryHeapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
        memoryHeapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
        nodeVersion: process.version
      }
    })
  );
});

export default router;
