import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { ENV } from '../../config/env';
import { ApiError } from '../../utils/apiError';
import { logger } from '../../utils/logger';

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  bytes: number;
}

export interface IUploadService {
  uploadImage(buffer: Buffer, originalname: string, mimetype: string): Promise<UploadResult>;
  uploadVoice(buffer: Buffer, originalname: string, mimetype: string): Promise<UploadResult>;
}

export class CloudinaryUploadService implements IUploadService {
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = Boolean(
      ENV.CLOUDINARY_CLOUD_NAME && ENV.CLOUDINARY_API_KEY && ENV.CLOUDINARY_API_SECRET
    );

    if (this.isConfigured) {
      cloudinary.config({
        cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
        api_key: ENV.CLOUDINARY_API_KEY,
        api_secret: ENV.CLOUDINARY_API_SECRET,
        secure: true
      });
    }
  }

  async uploadImage(
    buffer: Buffer,
    originalname: string,
    mimetype: string
  ): Promise<UploadResult> {
    if (this.isConfigured) {
      try {
        return await this.uploadToCloudinaryStream(buffer, 'aayucare/pills', 'image');
      } catch (err: any) {
        logger.warn(`Cloudinary stream upload unreachable (${err?.message || 'network'}), falling back to local storage.`);
        return this.fallbackLocalStorage(buffer, originalname, mimetype, 'pills');
      }
    }
    return this.fallbackLocalStorage(buffer, originalname, mimetype, 'pills');
  }

  async uploadVoice(
    buffer: Buffer,
    originalname: string,
    mimetype: string
  ): Promise<UploadResult> {
    if (this.isConfigured) {
      try {
        return await this.uploadToCloudinaryStream(buffer, 'aayucare/voice-notes', 'video');
      } catch (err: any) {
        logger.warn(`Cloudinary voice stream unreachable (${err?.message || 'network'}), falling back to local storage.`);
        return this.fallbackLocalStorage(buffer, originalname, mimetype, 'voice-notes');
      }
    }
    return this.fallbackLocalStorage(buffer, originalname, mimetype, 'voice-notes');
  }

  private uploadToCloudinaryStream(
    buffer: Buffer,
    folder: string,
    resourceType: 'image' | 'video' | 'raw' = 'image'
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          unique_filename: true,
          overwrite: false
        },
        (error, result) => {
          if (error || !result) {
            return reject(
              ApiError.internal(`Cloudinary Upload Failed: ${error?.message || 'Unknown error'}`)
            );
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format || 'unknown',
            bytes: result.bytes
          });
        }
      );

      stream.end(buffer);
    });
  }

  private async fallbackLocalStorage(
    buffer: Buffer,
    originalname: string,
    mimetype: string,
    subfolder: string
  ): Promise<UploadResult> {
    const uploadDir = path.join(process.cwd(), 'uploads', subfolder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(originalname) || (mimetype.includes('image') ? '.jpg' : '.webm');
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadDir, filename);

    await fs.promises.writeFile(filePath, buffer);

    const relativeUrl = `/uploads/${subfolder}/${filename}`;
    return {
      url: relativeUrl,
      publicId: `local-${filename}`,
      format: ext.replace('.', ''),
      bytes: buffer.length
    };
  }
}
