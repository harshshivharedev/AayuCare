import { Router } from 'express';
import { CareCircleController } from './careCircle.controller';
import { CareCircleService } from './careCircle.service';
import { PrismaCareCircleRepository } from './careCircle.repository';
import { authenticateJwt } from '../../middlewares/auth.middleware';

const router = Router();
const repo = new PrismaCareCircleRepository();
const service = new CareCircleService(repo);
const controller = new CareCircleController(service);

// Caregiver pairs with Elder using Passcode (CARE-8421)
router.post('/pair', authenticateJwt, controller.pair);

// Get current elder profile (either for elder user or caregiver's paired elder)
router.get('/current', authenticateJwt, controller.getCurrentElder);

// Care circle members
router.get('/:elderId/members', authenticateJwt, controller.getMembers);

// Update profile details / emergency contact
router.patch('/:elderId', authenticateJwt, controller.updateElder);

export default router;
