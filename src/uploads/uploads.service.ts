import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { cloudinary } from './uploads.config';

export type UploadProvider = 'cloudinary';

export interface UploadResult {
  url: string;
  secureUrl: string;
  provider: UploadProvider;
  publicId?: string;
  bytes: number;
  width?: number;
  height?: number;
  format?: string;
  mimeType?: string;
  originalName?: string;
  metadata?: Record<string, unknown>;
}

type CloudinaryMulterFile = Express.Multer.File & {
  path?: string;          // Sometimes multer-cloudinary uses .path
  filename?: string;
  public_id?: string;
  secure_url?: string;
  format?: string;
  width?: number;
  height?: number;
  resource_type?: string;
  bytes?: number;
};

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  async upload(file: Express.Multer.File | undefined): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`
      );
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size must not exceed 5MB');
    }

    const uploaded = file as CloudinaryMulterFile;

    // Cloudinary always returns secure_url for images/files
    const secureUrl = uploaded.secure_url ?? uploaded.path;

    if (!secureUrl) {
      throw new InternalServerErrorException(
        'Cloudinary upload did not return a valid URL.',
      );
    }

    // File size (Cloudinary or Multer fallback)
    const bytes =
      typeof uploaded.bytes === 'number' && !Number.isNaN(uploaded.bytes)
        ? uploaded.bytes
        : file.size ?? 0;

    return {
      url: secureUrl,
      secureUrl,
      provider: 'cloudinary',
      publicId: uploaded.public_id ?? uploaded.filename,
      bytes,
      width: uploaded.width,
      height: uploaded.height,
      format: uploaded.format,
      mimeType: file.mimetype,
      originalName: file.originalname,
      metadata: {
        resourceType: uploaded.resource_type,
      },
    };
  }

  async remove(identifier: string): Promise<void> {
    if (!identifier) {
      throw new BadRequestException('Identifier is required');
    }

    try {
      const response = await cloudinary.uploader.destroy(identifier, {
        invalidate: true,
      });

      if (response.result !== 'ok' && response.result !== 'not found') {
        throw new Error(`Unexpected Cloudinary response: ${response.result}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to remove Cloudinary asset "${identifier}": ${(error as Error).message}`,
        (error as Error).stack,
      );

      throw new InternalServerErrorException(
        'Failed to remove Cloudinary asset.',
      );
    }
  }
}
