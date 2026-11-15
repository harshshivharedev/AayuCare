import { Router } from 'express';
import { MedicationController } from './medication.controller';
import { MedicationService } from './medication.service';
import { PrismaMedicationRepository } from './medication.repository';
import { cacheService } from '../../infrastructure/cache.service';
import { authenticateJwt, requireRole, requireElderAccess } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  createMedicationSchema,
  updateMedicationSchema,
  confirmDoseSchema
} from './medication.schema';

const router = Router();
const repo = new PrismaMedicationRepository();
const service = new MedicationService(repo, cacheService);
const controller = new MedicationController(service);

// 1. Caretaker creates medication with tablet photo, timings & recorded voice note
router.post(
  '/',
  authenticateJwt,
  requireRole('CAREGIVER', 'FAMILY', 'ADMIN', 'ELDERLY'),
  requireElderAccess(),
  validateRequest(createMedicationSchema),
  controller.create
);

// 2. Elder's Visual Pillbox for Today (categorized in Morning, Afternoon, Evening, Night)
router.get(
  '/today/:elderId',
  authenticateJwt,
  requireElderAccess(),
  controller.getTodayPillbox
);

// 3. "Maine Kha Li" Dose Confirmation (Single button tap with 6-hour anti-overdose shield)
router.post(
  '/confirm-dose',
  authenticateJwt,
  validateRequest(confirmDoseSchema),
  controller.confirmDose
);

// 4. Adherence stats calculation (for caregiver dashboard)
router.get(
  '/adherence/:elderId',
  authenticateJwt,
  requireElderAccess(),
  controller.getAdherence
);

// 5. Get all scheduled medications for an elder
router.get(
  '/elder/:elderId',
  authenticateJwt,
  requireElderAccess(),
  controller.getByElder
);

// 6. Update medication details
router.patch(
  '/:id',
  authenticateJwt,
  requireRole('CAREGIVER', 'FAMILY', 'ADMIN', 'ELDERLY'),
  validateRequest(updateMedicationSchema),
  controller.update
);

// 7. Soft delete / deactivate medication
router.delete(
  '/:id',
  authenticateJwt,
  requireRole('CAREGIVER', 'FAMILY', 'ADMIN', 'ELDERLY'),
  controller.delete
);

export default router;
