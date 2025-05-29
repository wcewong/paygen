import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// load env vars
config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'paygen_user',
  password: process.env.DB_PASSWORD ?? 'paygen_pass',
  database: process.env.DB_NAME ?? 'paygen',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: true,
});
