import { Router } from 'express';
import { AlertController } from './alert.controller';
import { AlertService } from './alert.service';
import { PrismaAlertRepository } from './alert.repository';
import { authenticateJwt, requireRole } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { createAlertSchema, evaluateMissedSchema } from './alert.schema';

const router = Router();
const repo = new PrismaAlertRepository();
const service = new AlertService(repo);
const controller = new AlertController(service);

// 1. Get alert notifications feed for an elder (with unread counter)
router.get(
  '/elder/:elderId',
  authenticateJwt,
  controller.getAlertsByElder
);

// 2. Acknowledge and resolve an alert notification
router.patch(
  '/:id/acknowledge',
  authenticateJwt,
  requireRole('CAREGIVER', 'FAMILY', 'ADMIN'),
  controller.acknowledge
);

// 3. Trigger 45-Minute Missed-Dose Evaluation & Escalation
router.post(
  '/evaluate-missed',
  authenticateJwt,
  validateRequest(evaluateMissedSchema),
  controller.evaluateMissed
);

// 4. Create custom or system alert notification
router.post(
  '/',
  authenticateJwt,
  validateRequest(createAlertSchema),
  controller.createAlert
);

export default router;
