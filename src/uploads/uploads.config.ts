import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import type { Options as MulterOptions } from 'multer';

// Validate Cloudinary ENV variables (only in production)
const isProduction = process.env.NODE_ENV === 'production';
const hasCloudinaryVars = process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isProduction && !hasCloudinaryVars) {
  throw new Error(
    'Missing Cloudinary environment variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET',
  );
}

// Configure Cloudinary (only if variables are available)
if (hasCloudinaryVars) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Cloudinary storage instance (only if Cloudinary is configured)
const storage = hasCloudinaryVars ? new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: process.env.CLOUDINARY_FOLDER || 'mawaddah/uploads',
    resource_type: 'image',
  }),
}) : undefined;

// Export Multer options
export const uploadMulterOptions: MulterOptions = storage ? {
  storage,
} : {};

export { cloudinary };
