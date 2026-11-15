import multer from 'multer';
import { Request } from 'express';
import { ApiError } from '../../utils/apiError';

// 1. Storage: Store in memory as Buffer for scanning and streaming to Cloudinary
const storage = multer.memoryStorage();

// 2. Strict MIME Type Whitelist
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_AUDIO_TYPES = [
  'audio/webm',
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/m4a',
  'audio/ogg',
  'audio/mp4'
];

export const imageUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max for tablet photos
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        ApiError.badRequest(
          `Invalid image file type [${file.mimetype}]. Allowed types: JPG, PNG, WEBP.`
        )
      );
    }
  }
});

export const voiceUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB max for audio recordings
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        ApiError.badRequest(
          `Invalid audio file type [${file.mimetype}]. Allowed types: MP3, WEBM, WAV, M4A, OGG.`
        )
      );
    }
  }
});
