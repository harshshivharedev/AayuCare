import { Router } from 'express';
import { UploadController } from './upload.controller';
import { CloudinaryUploadService } from './upload.service';
import { imageUpload, voiceUpload } from './upload.middleware';
import { authenticateJwt } from '../../middlewares/auth.middleware';

const router = Router();
const uploadService = new CloudinaryUploadService();
const uploadController = new UploadController(uploadService);

// 1. Upload tablet strip / packaging photo (authenticated)
router.post(
  '/image',
  authenticateJwt,
  imageUpload.single('file'),
  uploadController.uploadPillImage
);

// 2. Upload caretaker recorded voice guidance audio (authenticated)
router.post(
  '/voice',
  authenticateJwt,
  voiceUpload.single('file'),
  uploadController.uploadVoiceNote
);

export default router;
