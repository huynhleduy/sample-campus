import path from 'node:path';
import { ConfigService } from '@nestjs/config';
import 'dotenv/config';
import { DataSource, SimpleConsoleLogger } from 'typeorm';
import { SnakeNamingStrategy } from './src/common/database/snake-naming.strategy';

const configService = new ConfigService();
const rootDir = __dirname;

export default new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: Number(configService.get('DB_PORT')),
  database: configService.get('DB_DATABASE'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  entities: [path.join(rootDir, 'src/**/*.entity.{js,ts}')],
  migrations: [path.join(rootDir, 'database/migrations/*.{js,ts}')],
  migrationsTransactionMode: 'each',
  namingStrategy: new SnakeNamingStrategy(),
  logger: new SimpleConsoleLogger(['migration', 'schema', 'error']),
});
