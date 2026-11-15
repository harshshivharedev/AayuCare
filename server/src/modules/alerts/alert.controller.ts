import { Request, Response, NextFunction } from 'express';
import { AlertService } from './alert.service';
import { CreateAlertSchema } from './alert.schema';
import { ApiResponse } from '../../utils/apiResponse';

export class AlertController {
  constructor(private readonly service: AlertService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const elderId = (typeof req.params.elderId === 'string' ? req.params.elderId : typeof req.query.elderId === 'string' ? req.query.elderId : 'elder-ramesh-001');
      const alerts = await this.service.getAlerts(elderId);

      res.status(200).json(
        ApiResponse.success('Alert notifications retrieved successfully', alerts)
      );
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = CreateAlertSchema.parse(req.body);
      const alert = await this.service.createAlert(validated);

      res.status(201).json(
        ApiResponse.success('Alert notification sent successfully', alert)
      );
    } catch (error) {
      next(error);
    }
  };

  evaluate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const elderId = (typeof req.params.elderId === 'string' ? req.params.elderId : typeof req.query.elderId === 'string' ? req.query.elderId : 'elder-ramesh-001');
      const triggeredAlerts = await this.service.evaluateMissedDoses(elderId);

      res.status(200).json(
        ApiResponse.success(
          `Missed dose audit complete. ${triggeredAlerts.length} alerts generated.`,
          triggeredAlerts
        )
      );
    } catch (error) {
      next(error);
    }
  };
}
