import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentSchema, UpdateAppointmentSchema } from './appointment.schema';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';

export class AppointmentController {
  constructor(private readonly service: AppointmentService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const elderId = (typeof req.params.elderId === 'string' ? req.params.elderId : typeof req.query.elderId === 'string' ? req.query.elderId : 'elder-ramesh-001');
      const items = await this.service.getAppointments(elderId);

      res.status(200).json(
        ApiResponse.success('Appointments retrieved successfully', items)
      );
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = CreateAppointmentSchema.parse(req.body);
      const created = await this.service.createAppointment(validated);

      res.status(201).json(
        ApiResponse.success('Appointment scheduled successfully', created)
      );
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const aptId = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0];
      if (!aptId) throw ApiError.badRequest('Appointment ID required');

      const validated = UpdateAppointmentSchema.parse(req.body);
      const updated = await this.service.updateAppointment(aptId, validated);

      res.status(200).json(
        ApiResponse.success('Appointment updated successfully', updated)
      );
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const aptId = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0];
      if (!aptId) throw ApiError.badRequest('Appointment ID required');

      await this.service.deleteAppointment(aptId);
      res.status(200).json(
        ApiResponse.success('Appointment cancelled successfully', null)
      );
    } catch (error) {
      next(error);
    }
  };

  getBriefcase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const elderId = (typeof req.params.elderId === 'string' ? req.params.elderId : typeof req.query.elderId === 'string' ? req.query.elderId : 'elder-ramesh-001');
      const briefcase = await this.service.generateClinicalBriefcase(elderId);

      res.status(200).json(
        ApiResponse.success('Clinical Briefcase adherence export generated successfully', briefcase)
      );
    } catch (error) {
      next(error);
    }
  };
}
