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
      type: 'mysql' as const,
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '3306', 10),
      username: process.env.DB_USERNAME ?? 'root',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME ?? 'mawaddah_db',
      synchronize: false,
      ssl: process.env.DB_SSL === 'true' ? {} : false,
      autoLoadEntities: true,
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
