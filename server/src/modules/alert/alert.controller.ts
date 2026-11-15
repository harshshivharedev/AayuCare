import { Request, Response, NextFunction } from 'express';
import { AlertService } from './alert.service';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';
import { AlertStatus } from '@prisma/client';

export class AlertController {
  constructor(private readonly service: AlertService) {}

  getAlertsByElder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const elderId = typeof req.params.elderId === 'string' ? req.params.elderId : req.params.elderId?.[0];
      if (!elderId) throw ApiError.badRequest('Elder ID is required');

      const statusFilter = req.query.status as AlertStatus | undefined;
      const feed = await this.service.getAlertsByElder(elderId, statusFilter);

      res.status(200).json(ApiResponse.success('Alert notifications feed retrieved', feed));
    } catch (error) {
      next(error);
    }
  };

  acknowledge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0];
      if (!id) throw ApiError.badRequest('Alert ID is required');

      const acknowledged = await this.service.acknowledgeAlert(id);
      res
        .status(200)
        .json(ApiResponse.success('Alert acknowledged and marked resolved', acknowledged));
    } catch (error) {
      next(error);
    }
  };

  evaluateMissed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let { elderProfileId, thresholdMinutes } = req.body;

      if (!elderProfileId && req.user) {
        const { prisma } = await import('../../config/db');
        const profile = await prisma.elderProfile.findFirst({
          where: {
            OR: [
              { userId: req.user.id },
              { careCircleMembers: { some: { userId: req.user.id } } }
            ]
          }
        });
        elderProfileId = profile?.id;
      }

      if (!elderProfileId) {
        res.status(200).json(
          ApiResponse.success('No active elder profile linked to evaluate.', {
            overdueDosesCount: 0,
            escalatedAlertsCount: 0,
            escalatedAlerts: []
          })
        );
        return;
      }

      const result = await this.service.evaluateAndEscalateMissedDoses(
        elderProfileId,
        thresholdMinutes || 45
      );

      res
        .status(200)
        .json(
          ApiResponse.success(
            `Missed-dose evaluation completed. ${result.escalatedAlertsCount} critical alert(s) escalated to caregivers.`,
            result
          )
        );
    } catch (error) {
      next(error);
    }
  };

  createAlert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const alert = await this.service.createAlert(req.body);
      res.status(201).json(ApiResponse.success('Alert notification dispatched', alert));
    } catch (error) {
      next(error);
    }
  };
}
