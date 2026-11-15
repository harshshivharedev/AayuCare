import { Request, Response, NextFunction } from 'express';
import { MedicationService } from './medication.service';
import { CreateMedicationSchema, ConfirmDoseSchema, UpdateMedicationSchema } from './medication.schema';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';

export class MedicationController {
  constructor(private readonly service: MedicationService) {}

  getPillbox = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const elderId = (typeof req.query.elderId === 'string' ? req.query.elderId : 'elder-ramesh-001');
      const items = await this.service.getPillboxToday(elderId);

      res.status(200).json(
        ApiResponse.success('Today pillbox schedule retrieved successfully', items)
      );
    } catch (error) {
      next(error);
    }
  };

  confirmDose = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = ConfirmDoseSchema.parse(req.body);
      const result = await this.service.confirmDose(validated);

      res.status(200).json(
        ApiResponse.success(result.message, result)
      );
    } catch (error) {
      next(error);
    }
  };

  getAdherence = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const elderId = (typeof req.query.elderId === 'string' ? req.query.elderId : 'elder-ramesh-001');
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
      const stats = await this.service.getAdherenceRate(elderId, days);

      res.status(200).json(
        ApiResponse.success('Adherence metrics computed successfully', stats)
      );
    } catch (error) {
      next(error);
    }
  };

  listByElder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const elderId = (typeof req.params.elderId === 'string' ? req.params.elderId : typeof req.query.elderId === 'string' ? req.query.elderId : 'elder-ramesh-001');
      const meds = await this.service.getMedications(elderId);

      res.status(200).json(
        ApiResponse.success('Medications retrieved successfully', meds)
      );
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = CreateMedicationSchema.parse(req.body);
      const created = await this.service.createMedication(validated);

      res.status(201).json(
        ApiResponse.success('Medication registered successfully', created)
      );
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const medId = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0];
      if (!medId) throw ApiError.badRequest('Medication ID required');

      const validated = UpdateMedicationSchema.parse(req.body);
      const updated = await this.service.updateMedication(medId, validated);

      res.status(200).json(
        ApiResponse.success('Medication updated successfully', updated)
      );
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const medId = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0];
      if (!medId) throw ApiError.badRequest('Medication ID required');

      await this.service.deleteMedication(medId);
      res.status(200).json(
        ApiResponse.success('Medication removed successfully', null)
      );
    } catch (error) {
      next(error);
    }
  };
}
