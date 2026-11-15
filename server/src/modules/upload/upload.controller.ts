import { Request, Response, NextFunction } from 'express';
import { IUploadService } from './upload.service';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';

export class UploadController {
  constructor(private readonly uploadService: IUploadService) {}

  uploadPillImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw ApiError.badRequest('No image file uploaded. Please provide a file in the "file" field.');
      }

      const result = await this.uploadService.uploadImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      res.status(200).json(
        ApiResponse.success('Tablet photo uploaded successfully', result)
      );
    } catch (error) {
      next(error);
    }
  };

  uploadVoiceNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw ApiError.badRequest('No audio file uploaded. Please provide a file in the "file" field.');
      }

      const result = await this.uploadService.uploadVoice(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      res.status(200).json(
        ApiResponse.success('Caretaker voice guidance uploaded successfully', result)
      );
    } catch (error) {
      next(error);
    }
  };
}
