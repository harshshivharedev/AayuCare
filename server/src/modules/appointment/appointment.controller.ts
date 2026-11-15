import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from './appointment.service';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';

export class AppointmentController {
  constructor(private readonly service: AppointmentService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointment = await this.service.createAppointment(req.body);
      res
        .status(201)
        .json(ApiResponse.success('Doctor appointment scheduled successfully', appointment));
    } catch (error) {
      next(error);
    }
  };

  getByElder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const elderId = typeof req.params.elderId === 'string' ? req.params.elderId : req.params.elderId?.[0];
      if (!elderId) throw ApiError.badRequest('Elder ID is required');

      const appointments = await this.service.getAppointmentsByElder(elderId);
      res
        .status(200)
        .json(ApiResponse.success('Appointments retrieved successfully', appointments));
    } catch (error) {
      next(error);
    }
  };

  getUpcoming = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const elderId = typeof req.params.elderId === 'string' ? req.params.elderId : req.params.elderId?.[0];
      if (!elderId) throw ApiError.badRequest('Elder ID is required');

      const appointments = await this.service.getUpcomingAppointments(elderId);
      res
        .status(200)
        .json(ApiResponse.success('Upcoming appointments retrieved successfully', appointments));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0];
      if (!id) throw ApiError.badRequest('Appointment ID is required');

      const updated = await this.service.updateAppointment(id, req.body);
      res.status(200).json(ApiResponse.success('Appointment updated successfully', updated));
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0];
      if (!id) throw ApiError.badRequest('Appointment ID is required');

      await this.service.deleteAppointment(id);
      res.status(200).json(ApiResponse.success('Appointment cancelled successfully'));
    } catch (error) {
      next(error);
    }
  };

  getClinicalBriefcase = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const elderId = typeof req.params.elderId === 'string' ? req.params.elderId : req.params.elderId?.[0];
      if (!elderId) throw ApiError.badRequest('Elder ID is required');

      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const briefcase = await this.service.getClinicalBriefcase(elderId, days);

      res
        .status(200)
        .json(
          ApiResponse.success(
            "Doctor's 30-Day Clinical Briefcase report generated successfully",
            briefcase
          )
        );
    } catch (error) {
      next(error);
    }
  };
}
