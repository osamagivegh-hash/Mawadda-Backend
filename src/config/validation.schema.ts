import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().integer().default(3000),
  GLOBAL_PREFIX: Joi.string().default('api'),
  JWT_SECRET: Joi.string().min(16).default('change-me-in-production'),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(4).default(10),
  MONGODB_URI: Joi.string().optional().allow('').default('mongodb://localhost:27017/mawaddah'),
  DB_URI: Joi.string().optional().allow(''),
  CORS_ORIGINS: Joi.string().optional(),
  FRONTEND_URL: Joi.string()
    .uri()
    .default('https://frontend.onrender.com'),
  CLOUDINARY_CLOUD_NAME: Joi.string().optional().allow(''),
  CLOUDINARY_API_KEY: Joi.string().optional().allow(''),
  CLOUDINARY_API_SECRET: Joi.string().optional().allow(''),
  USE_CLOUDINARY: Joi.string().valid('true', 'false').optional(),
  CLOUDINARY_FOLDER: Joi.string().optional(),
  MAX_FILE_SIZE: Joi.number().integer().optional(),
  ALLOWED_FILE_TYPES: Joi.string().optional(),
  MEMBERSHIP_PAYMENT_URL: Joi.string().uri().optional(),
  EXAM_PAYMENT_URL: Joi.string().uri().optional(),
  PAYMENT_SECRET_KEY: Joi.string().optional(),
}).custom((value, helpers) => {
  // Use default if neither is provided
  const mongoUri = value?.MONGODB_URI || value?.DB_URI || 'mongodb://localhost:27017/mawaddah';
  const trimmedUri = typeof mongoUri === 'string' ? mongoUri.trim() : '';
  
  if (!trimmedUri) {
    return helpers.error('any.custom', {
      message: 'At least one of MONGODB_URI or DB_URI must be provided and non-empty',
    });
  }
  
  // Validate URI format if provided
  try {
    new URL(trimmedUri);
  } catch (e) {
    return helpers.error('any.custom', {
      message: `MONGODB_URI or DB_URI must be a valid URI. Received: ${trimmedUri.substring(0, 50)}`,
    });
  }
  return value;
});
