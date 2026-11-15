import { Router } from 'express';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { PrismaAppointmentRepository } from './appointment.repository';
import { PrismaMedicationRepository } from '../medication/medication.repository';
import { PrismaCareCircleRepository } from '../care-circle/careCircle.repository';
import { authenticateJwt } from '../../middlewares/auth.middleware';

const router = Router();
const aptRepo = new PrismaAppointmentRepository();
const medRepo = new PrismaMedicationRepository();
const elderRepo = new PrismaCareCircleRepository();

const service = new AppointmentService(aptRepo, medRepo, elderRepo);
const controller = new AppointmentController(service);

// List appointments for elder
router.get('/elder/:elderId', authenticateJwt, controller.list);
router.get('/', authenticateJwt, controller.list);

// 1-Click 30-Day Clinical Briefcase Export for doctor consultation
router.get('/briefcase/:elderId', authenticateJwt, controller.getBriefcase);
router.get('/briefcase', authenticateJwt, controller.getBriefcase);

// Appointment CRUD
router.post('/', authenticateJwt, controller.create);
router.patch('/:id', authenticateJwt, controller.update);
router.delete('/:id', authenticateJwt, controller.delete);

export default router;
