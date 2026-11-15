import { Request, Response, NextFunction } from 'express';
import { CareCircleService } from './careCircle.service';
import { PairCareCircleSchema, UpdateElderProfileSchema } from './careCircle.schema';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';

export class CareCircleController {
  constructor(private readonly service: CareCircleService) {}

  pair = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const validated = PairCareCircleSchema.parse(req.body);
      const result = await this.service.pairWithElder(req.user.id, validated.carePasscode);

      res.status(200).json(
        ApiResponse.success(
          `Successfully paired with ${result.elder.fullName}'s CareCircle`,
          result
        )
      );
    } catch (error) {
      next(error);
    }
  };

  getCurrentElder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const elder = await this.service.getProfileForUser(req.user.id, req.user.role);

      res.status(200).json(
        ApiResponse.success('Elder profile retrieved successfully', elder)
      );
    } catch (error) {
      next(error);
    }
  };

  getMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const elderProfileId = typeof req.params.elderId === 'string' ? req.params.elderId : req.params.elderId?.[0];
      if (!elderProfileId) throw ApiError.badRequest('Elder Profile ID required');

      const members = await this.service.getCareCircleMembers(elderProfileId);
      res.status(200).json(
        ApiResponse.success('CareCircle members retrieved successfully', members)
      );
    } catch (error) {
      next(error);
    }
  };

  updateElder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const elderProfileId = typeof req.params.elderId === 'string' ? req.params.elderId : req.params.elderId?.[0];
      if (!elderProfileId) throw ApiError.badRequest('Elder Profile ID required');

      const validated = UpdateElderProfileSchema.parse(req.body);
      const updated = await this.service.updateElderProfile(elderProfileId, validated as any);

      res.status(200).json(
        ApiResponse.success('Elder profile updated successfully', updated)
      );
    } catch (error) {
      next(error);
    }
  };
}
