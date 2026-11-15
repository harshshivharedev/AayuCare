import { Router } from 'express';
import { AlertController } from './alert.controller';
import { AlertService } from './alert.service';
import { PrismaAlertRepository } from './alert.repository';
import { PrismaMedicationRepository } from '../medication/medication.repository';
import { PrismaCareCircleRepository } from '../care-circle/careCircle.repository';
import { authenticateJwt } from '../../middlewares/auth.middleware';

const router = Router();
const alertRepo = new PrismaAlertRepository();
const medRepo = new PrismaMedicationRepository();
const careRepo = new PrismaCareCircleRepository();

const service = new AlertService(alertRepo, medRepo, careRepo);
const controller = new AlertController(service);

// List alerts
router.get('/elder/:elderId', authenticateJwt, controller.list);
router.get('/', authenticateJwt, controller.list);

// Evaluate missed doses and trigger alerts
router.post('/evaluate/:elderId', authenticateJwt, controller.evaluate);
router.post('/evaluate', authenticateJwt, controller.evaluate);

// Trigger manual alert notification
router.post('/', authenticateJwt, controller.create);

export default router;
