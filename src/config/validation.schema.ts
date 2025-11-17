import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().integer().default(3000),
  GLOBAL_PREFIX: Joi.string().default('api'),
  JWT_SECRET: Joi.string().min(16).default('change-me-in-production'),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(4).default(10),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().integer().default(3306),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DB_SSL: Joi.string().valid('true', 'false').optional(),
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
});
