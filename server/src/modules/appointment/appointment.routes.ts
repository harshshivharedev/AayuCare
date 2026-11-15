import { Router } from 'express';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { PrismaAppointmentRepository } from './appointment.repository';
import { authenticateJwt, requireRole } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { createAppointmentSchema, updateAppointmentSchema } from './appointment.schema';

const router = Router();
const repo = new PrismaAppointmentRepository();
const service = new AppointmentService(repo);
const controller = new AppointmentController(service);

// 1. Schedule a new Doctor Appointment
router.post(
  '/',
  authenticateJwt,
  requireRole('CAREGIVER', 'FAMILY', 'ADMIN'),
  validateRequest(createAppointmentSchema),
  controller.create
);

// 2. The 30-Day Clinical Briefcase Report (Doctor Visit Summary)
router.get(
  '/briefcase/:elderId',
  authenticateJwt,
  controller.getClinicalBriefcase
);

// 3. Get Upcoming Appointments for an Elder
router.get(
  '/upcoming/:elderId',
  authenticateJwt,
  controller.getUpcoming
);

// 4. Get All Appointments for an Elder
router.get(
  '/elder/:elderId',
  authenticateJwt,
  controller.getByElder
);

// 5. Update/Reschedule or Mark Appointment Completed
router.patch(
  '/:id',
  authenticateJwt,
  requireRole('CAREGIVER', 'FAMILY', 'ADMIN'),
  validateRequest(updateAppointmentSchema),
  controller.update
);

// 6. Cancel an Appointment
router.delete(
  '/:id',
  authenticateJwt,
  requireRole('CAREGIVER', 'FAMILY', 'ADMIN'),
  controller.delete
);

export default router;
