import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: configService.get<string>('NOTIFICATION_DB_HOST', 'localhost'),
  // host: configService.get<string>('NOTIFICATION_DB_HOST', 'sql_container'),
  port: configService.get<number>('NOTIFICATION_DB_PORT', 3306),
  username: configService.get<string>('NOTIFICATION_DB_USERNAME', 'root'),
  password: configService.get<string>('NOTIFICATION_DB_PASSWORD', ''),
  // password: configService.get<string>('NOTIFICATION_DB_PASSWORD', 'Kj9#f2Lp!7Xm99'),
  database: configService.get<string>('DB_NAME', 'db_jawab_media'),
  synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false),
  logging: configService.get<boolean>('DB_LOGGING', false),
  charset: 'utf8mb4',
  timezone: '+00:00',
  extra: {
    connectionLimit: configService.get<number>('DB_CONNECTION_LIMIT', 20),
    acquireTimeout: configService.get<number>('DB_ACQUIRE_TIMEOUT', 60000),
    timeout: configService.get<number>('DB_TIMEOUT', 60000),
    reconnect: true,
    pool: {
      min: configService.get<number>('DB_POOL_MIN', 5),
      max: configService.get<number>('DB_POOL_MAX', 20),
      idle: configService.get<number>('DB_POOL_IDLE', 10000),
      acquire: configService.get<number>('DB_POOL_ACQUIRE', 60000),
      evict: configService.get<number>('DB_POOL_EVICT', 1000),
    },
    ssl: configService.get<boolean>('DB_SSL', false)
      ? {
        rejectUnauthorized: configService.get<boolean>(
          'DB_SSL_REJECT_UNAUTHORIZED',
          true,
        ),
      }
      : false,
  },
  retryAttempts: configService.get<number>('DB_RETRY_ATTEMPTS', 10),
  retryDelay: configService.get<number>('DB_RETRY_DELAY', 3000),
  autoLoadEntities: true,
  maxQueryExecutionTime: configService.get<number>(
    'DB_MAX_QUERY_EXECUTION_TIME',
    10000,
  ),
});

