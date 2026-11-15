import { Router } from 'express';
import { MedicationController } from './medication.controller';
import { MedicationService } from './medication.service';
import { PrismaMedicationRepository } from './medication.repository';
import { authenticateJwt } from '../../middlewares/auth.middleware';

const router = Router();
const repo = new PrismaMedicationRepository();
const service = new MedicationService(repo);
const controller = new MedicationController(service);

// Public/Elder friendly pillbox view for kiosk & elder mode
router.get('/pillbox', controller.getPillbox);

// Confirm dose taken (voice or giant button tap) with 6-hr anti-overdose shield check
router.post('/confirm', controller.confirmDose);

// Adherence metrics (for Caregiver dashboard & reports)
router.get('/adherence', authenticateJwt, controller.getAdherence);

// Medication CRUD
router.get('/elder/:elderId', authenticateJwt, controller.listByElder);
router.post('/', authenticateJwt, controller.create);
router.patch('/:id', authenticateJwt, controller.update);
router.delete('/:id', authenticateJwt, controller.delete);

export default router;
