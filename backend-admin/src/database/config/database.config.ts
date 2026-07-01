import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: configService.get<string>('DB_HOST', 'sql_container'),
  port: configService.get<number>('DB_PORT', 3306),
  username: configService.get<string>('DB_USERNAME', 'root'),
  password: configService.get<string>('DB_PASSWORD', ''),
  database: configService.get<string>('DB_NAME', 'db_jawab'),
  // Entities are auto-loaded from modules using autoLoadEntities: true
  // Entities are co-located with their modules (e.g., src/modules/auth/entities/)
  // and registered via TypeOrmModule.forFeature() in each module
  synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false),
  logging: configService.get<boolean>('DB_LOGGING', false),
  charset: 'utf8mb4',
  timezone: '+00:00',
  // Connection Pooling Configuration for High Load
  extra: {
    connectionLimit: configService.get<number>('DB_CONNECTION_LIMIT', 20),
    connectTimeout: configService.get<number>('DB_TIMEOUT', 60000),
    // SSL Configuration (optional, for production)
    ssl: configService.get<boolean>('DB_SSL', false)
      ? {
        rejectUnauthorized: configService.get<boolean>(
          'DB_SSL_REJECT_UNAUTHORIZED',
          true,
        ),
      }
      : false,
  },
  // Connection retry configuration
  retryAttempts: configService.get<number>('DB_RETRY_ATTEMPTS', 10),
  retryDelay: configService.get<number>('DB_RETRY_DELAY', 3000),
  // Auto reconnect on connection loss
  autoLoadEntities: true,
  // Maximum query execution time (milliseconds)
  maxQueryExecutionTime: configService.get<number>(
    'DB_MAX_QUERY_EXECUTION_TIME',
    10000,
  ),
});

