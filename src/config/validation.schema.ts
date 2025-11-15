import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().integer().default(3000),
  GLOBAL_PREFIX: Joi.string().default('api'),
  JWT_SECRET: Joi.string().min(16).default('change-me-in-production'),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(4).default(10),
  MONGODB_URI: Joi.string().uri(),
  DB_URI: Joi.string().uri(),
  CORS_ORIGINS: Joi.string().optional(),
  FRONTEND_URL: Joi.string()
    .uri()
    .default('https://frontend.onrender.com'),
  CLOUDINARY_CLOUD_NAME: Joi.string().optional(),
  CLOUDINARY_API_KEY: Joi.string().optional(),
  CLOUDINARY_API_SECRET: Joi.string().optional(),
  USE_CLOUDINARY: Joi.string().valid('true', 'false').optional(),
  CLOUDINARY_FOLDER: Joi.string().optional(),
  MAX_FILE_SIZE: Joi.number().integer().optional(),
  ALLOWED_FILE_TYPES: Joi.string().optional(),
  MEMBERSHIP_PAYMENT_URL: Joi.string().uri().optional(),
  EXAM_PAYMENT_URL: Joi.string().uri().optional(),
  PAYMENT_SECRET_KEY: Joi.string().optional(),
}).or('MONGODB_URI', 'DB_URI');
