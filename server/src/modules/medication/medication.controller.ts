import { Request, Response, NextFunction } from 'express';
import { MedicationService } from './medication.service';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';

export class MedicationController {
  constructor(private readonly service: MedicationService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const medication = await this.service.createMedication(req.body);
      res
        .status(201)
        .json(ApiResponse.success('Medication scheduled successfully with visual reference and voice note', medication));
    } catch (error) {
      next(error);
    }
  };

  getByElder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const elderId = typeof req.params.elderId === 'string' ? req.params.elderId : req.params.elderId?.[0];
      if (!elderId) throw ApiError.badRequest('Elder ID is required');

      const medications = await this.service.getMedicationsByElder(elderId);
      res.status(200).json(ApiResponse.success('Medications retrieved successfully', medications));
    } catch (error) {
      next(error);
    }
  };

  getTodayPillbox = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const elderId = typeof req.params.elderId === 'string' ? req.params.elderId : req.params.elderId?.[0];
      if (!elderId) throw ApiError.badRequest('Elder ID is required');

      const pillbox = await this.service.getTodayPillbox(elderId);
      res.status(200).json(ApiResponse.success("Today's Visual Pillbox retrieved successfully", pillbox));
    } catch (error) {
      next(error);
    }
  };

  confirmDose = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.confirmDose(req.body);
      res.status(200).json(
        ApiResponse.success(result.message, {
          log: result.log,
          soundAlert: result.soundAlert,
          voiceNoteUrl: result.voiceNoteUrl,
          voiceNoteText: result.voiceNoteText
        })
      );
    } catch (error) {
      next(error);
    }
  };

  getAdherence = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const elderId = typeof req.params.elderId === 'string' ? req.params.elderId : req.params.elderId?.[0];
      if (!elderId) throw ApiError.badRequest('Elder ID is required');

      const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
      const stats = await this.service.getAdherenceRate(elderId, days);
      res.status(200).json(ApiResponse.success('Adherence statistics calculated', stats));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0];
      if (!id) throw ApiError.badRequest('Medication ID is required');

      const updated = await this.service.updateMedication(id, req.body);
      res.status(200).json(ApiResponse.success('Medication updated successfully', updated));
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0];
      if (!id) throw ApiError.badRequest('Medication ID is required');

      await this.service.deleteMedication(id);
      res.status(200).json(ApiResponse.success('Medication removed from schedule successfully'));
    } catch (error) {
      next(error);
    }
  };
}
