const parseOrigins = (origins?: string) =>
  (origins ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const configuration = () => {
  const corsOrigins = parseOrigins(process.env.CORS_ORIGINS);
  const defaultFrontendUrl = 'https://frontend.onrender.com';
  const frontendUrl =
    process.env.FRONTEND_URL ?? corsOrigins[0] ?? defaultFrontendUrl;
  const mongoUri =
    process.env.DB_URI ?? process.env.MONGODB_URI ?? '';

  return {
    app: {
      port: parseInt(process.env.PORT ?? '3000', 10),
      globalPrefix: process.env.GLOBAL_PREFIX ?? 'api',
    },
    auth: {
      jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-production',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
      bcryptSaltRounds: parseInt(
        process.env.BCRYPT_SALT_ROUNDS ?? '10',
        10,
      ),
    },
    cors: {
      origins: corsOrigins.length
        ? corsOrigins
        : [defaultFrontendUrl],
    },
    frontend: {
      url: frontendUrl,
    },
    database: {
      mongoUri,
    },
    uploads: {
      cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
        apiKey: process.env.CLOUDINARY_API_KEY ?? '',
        apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
      },
    },
  };
};

export default configuration;
