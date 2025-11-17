import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config();

const configService = new ConfigService();

export default new DataSource({
  type: 'mysql',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 3306),
  username: configService.get('DB_USERNAME', 'root'),
  password: configService.get('DB_PASSWORD', ''),
  database: configService.get('DB_NAME', 'mawaddah_db'),
  synchronize: false,
  logging: true,
  entities: [join(__dirname, '../modules/**/entities/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../database/migrations/**/*{.ts,.js}')],
  subscribers: [join(__dirname, '../database/subscribers/*{.ts,.js}')],
  ssl: configService.get('DB_SSL') === 'true' ? {} : false,
});

