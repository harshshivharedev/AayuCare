import { Router } from 'express';
import { CareCircleController } from './careCircle.controller';
import { CareCircleService } from './careCircle.service';
import { PrismaCareCircleRepository } from './careCircle.repository';
import { authenticateJwt, requireRole } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { pairCareCircleSchema, updateElderProfileSchema } from './careCircle.schema';

const router = Router();
const repo = new PrismaCareCircleRepository();
const service = new CareCircleService(repo);
const controller = new CareCircleController(service);

// 1. Caregiver pairs with Elder using 6-character Passcode (CARE-8421)
router.post(
  '/pair',
  authenticateJwt,
  requireRole('CAREGIVER', 'FAMILY', 'ADMIN'),
  validateRequest(pairCareCircleSchema),
  controller.pair
);

// 2. Caregiver gets all their linked elders
router.get(
  '/elders',
  authenticateJwt,
  requireRole('CAREGIVER', 'FAMILY', 'ADMIN'),
  controller.getLinkedElders
);

// 3. Get members of an Elder's Care Circle
router.get(
  '/members/:elderId',
  authenticateJwt,
  controller.getMembers
);

// 4. Update Elder health profile / emergency contacts
router.patch(
  '/elder/:elderId',
  authenticateJwt,
  requireRole('CAREGIVER', 'FAMILY', 'ADMIN'),
  validateRequest(updateElderProfileSchema),
  controller.updateProfile
);

export default router;
