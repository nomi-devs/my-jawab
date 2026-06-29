import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
// Import entities directly - this ensures they're loaded with proper metadata
import { Notification } from '../../modules/notification/entities/notification.entity';
import { Email } from '../../modules/email/entities/email.entity';
import { Job } from '../../modules/job/entities/job.entity';
import { Template } from '../../modules/templates/entities/template.entity';

/**
 * Notification Database Configuration
 * 
 * Separate database configuration for notifications, emails, and jobs.
 * Database name: jawab_notify
 * 
 * To use this:
 * 1. Set NOTIFICATION_DB_HOST, NOTIFICATION_DB_NAME, etc. in .env
 * 2. Import this config in app.module.ts
 * 3. Use 'notification' connection name in NotificationModule
 * 
 * Note: Entities must be listed here AND registered via TypeOrmModule.forFeature()
 * in their respective modules for the named connection to work properly.
 */
export const getNotificationDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  // Direct entity class references - most reliable approach
  const entities = [Notification, Email, Job, Template];

  return {
    type: 'mysql',
    // host: configService.get<string>('NOTIFICATION_DB_HOST', 'localhost'),
    host: configService.get<string>('NOTIFICATION_DB_HOST', 'sql_container'),
    port: configService.get<number>('NOTIFICATION_DB_PORT', 3306),
    username: configService.get<string>('NOTIFICATION_DB_USERNAME', 'root'),
    // password: configService.get<string>('NOTIFICATION_DB_PASSWORD', ''),
    password: configService.get<string>('NOTIFICATION_DB_PASSWORD', 'Kj9#f2Lp!7Xm99'),
    database: configService.get<string>('NOTIFICATION_DB_NAME', 'db_jawab_notify'),
    synchronize: configService.get<boolean>('NOTIFICATION_DB_SYNCHRONIZE', false),
    logging: configService.get<boolean>('NOTIFICATION_DB_LOGGING', false),
    charset: 'utf8mb4',
    timezone: '+00:00',
    // Load entities explicitly using direct class references
    // This is required for named connections to work properly
    autoLoadEntities: false,
    entities,
    extra: {
      connectionLimit: configService.get<number>('NOTIFICATION_DB_CONNECTION_LIMIT', 10),
      connectTimeout: configService.get<number>('NOTIFICATION_DB_TIMEOUT', 60000),
      ssl: configService.get<boolean>('NOTIFICATION_DB_SSL', false)
        ? {
            rejectUnauthorized: configService.get<boolean>(
              'NOTIFICATION_DB_SSL_REJECT_UNAUTHORIZED',
              true,
            ),
          }
        : false,
    },
    retryAttempts: configService.get<number>('NOTIFICATION_DB_RETRY_ATTEMPTS', 10),
    retryDelay: configService.get<number>('NOTIFICATION_DB_RETRY_DELAY', 3000),
    maxQueryExecutionTime: configService.get<number>(
      'NOTIFICATION_DB_MAX_QUERY_EXECUTION_TIME',
      10000,
    ),
  };
};

