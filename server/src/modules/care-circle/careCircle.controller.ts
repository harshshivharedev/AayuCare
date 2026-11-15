import { Request, Response, NextFunction } from 'express';
import { CareCircleService } from './careCircle.service';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';

export class CareCircleController {
  constructor(private readonly service: CareCircleService) {}

  pair = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caregiverUserId = req.user!.id;
      const { carePasscode } = req.body;

      const result = await this.service.pairWithElder(caregiverUserId, carePasscode);

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

  getLinkedElders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caregiverUserId = req.user!.id;
      const elders = await this.service.getLinkedElders(caregiverUserId);

      res.status(200).json(
        ApiResponse.success('Linked elders retrieved successfully', elders)
      );
    } catch (error) {
      next(error);
    }
  };

  getMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const elderId = typeof req.params.elderId === 'string' ? req.params.elderId : req.params.elderId?.[0];
      if (!elderId) throw ApiError.badRequest('Elder Profile ID is required');

      const members = await this.service.getMembers(elderId);

      res.status(200).json(
        ApiResponse.success('CareCircle members retrieved successfully', members)
      );
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const elderId = typeof req.params.elderId === 'string' ? req.params.elderId : req.params.elderId?.[0];
      if (!elderId) throw ApiError.badRequest('Elder Profile ID is required');

      const updated = await this.service.updateProfile(elderId, req.body);

      res.status(200).json(
        ApiResponse.success('Elder profile updated successfully', updated)
      );
    } catch (error) {
      next(error);
    }
  };
}
