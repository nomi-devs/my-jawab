import { registerAs } from '@nestjs/config';

/**
 * Email Configuration
 *
 * All email-related configuration is centralized here.
 * Access via ConfigService.get('email.*')
 */
export default registerAs('email', () => ({
  // Enable/Disable Email Service
  enabled: process.env.EMAIL_ENABLED !== 'false', // Default: true

  // Default Sender Information
  from: process.env.EMAIL_FROM || 'jawabtest@pakentforum.com',
  fromName: process.env.EMAIL_FROM_NAME || 'Jawab',
  replyTo:
    process.env.EMAIL_REPLY_TO ||
    process.env.EMAIL_FROM ||
    'jawabtest@pakentforum.com',

  // Email Provider (smtp, sendgrid, ses)
  provider: process.env.EMAIL_PROVIDER || 'smtp',

  // SMTP Configuration
  smtp: {
    enabled: process.env.SMTP_ENABLED !== 'false', // Default: true
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    // For port 465, secure should be true. For port 587, secure should be false
    secure:
      process.env.SMTP_SECURE !== undefined
        ? process.env.SMTP_SECURE === 'true'
        : parseInt(process.env.SMTP_PORT || '465', 10) === 465, // Auto-detect: true for 465, false for others
    auth: {
      user: process.env.SMTP_USER || 'jawabtest@pakentforum.com',
      pass: process.env.SMTP_PASSWORD || '+8aaZ?Ei@;SYU8%F358Go7nH',
    },
    // Connection pool options
    pool: process.env.SMTP_POOL === 'true', // Use connection pooling
    maxConnections: parseInt(process.env.SMTP_MAX_CONNECTIONS || '5', 10),
    maxMessages: parseInt(process.env.SMTP_MAX_MESSAGES || '100', 10),
    // Connection timeout (milliseconds)
    connectionTimeout: parseInt(
      process.env.SMTP_CONNECTION_TIMEOUT || '10000',
      10,
    ), // 10 seconds
    // Socket timeout (milliseconds)
    socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT || '30000', 10), // 30 seconds
    // Greeting timeout (milliseconds)
    greetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT || '5000', 10), // 5 seconds
    // TLS options
    tls: {
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
      ciphers: process.env.SMTP_TLS_CIPHERS || 'SSLv3',
    },
  },

  // SendGrid Configuration (if using SendGrid)
  sendgrid: {
    enabled: process.env.SENDGRID_ENABLED === 'true', // Default: false
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail:
      process.env.SENDGRID_FROM_EMAIL ||
      process.env.EMAIL_FROM ||
      'jawabtest@pakentforum.com',
    fromName:
      process.env.SENDGRID_FROM_NAME || process.env.EMAIL_FROM_NAME || 'Jawab',
  },

  // AWS SES Configuration (if using AWS SES)
  awsSes: {
    enabled: process.env.AWS_SES_ENABLED === 'true', // Default: false
    region: process.env.AWS_SES_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY || '',
    fromEmail:
      process.env.AWS_SES_FROM_EMAIL ||
      process.env.EMAIL_FROM ||
      'jawabtest@pakentforum.com',
    fromName:
      process.env.AWS_SES_FROM_NAME || process.env.EMAIL_FROM_NAME || 'Jawab',
  },

  // Rate Limiting
  rateLimit: {
    enabled: process.env.EMAIL_RATE_LIMIT_ENABLED !== 'false', // Default: true
    maxEmailsPerMinute: parseInt(process.env.EMAIL_RATE_LIMIT || '10', 10),
    maxEmailsPerHour: parseInt(process.env.EMAIL_RATE_LIMIT_HOUR || '100', 10),
    maxEmailsPerDay: parseInt(process.env.EMAIL_RATE_LIMIT_DAY || '1000', 10),
  },

  // Retry Configuration
  retry: {
    enabled: process.env.EMAIL_RETRY_ENABLED !== 'false', // Default: true
    maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY || '5000', 10), // milliseconds
    exponentialBackoff: process.env.EMAIL_RETRY_EXPONENTIAL === 'true', // Default: false
  },

  // Email Queue Configuration
  queue: {
    enabled: process.env.EMAIL_QUEUE_ENABLED === 'true', // Default: false
    maxConcurrent: parseInt(process.env.EMAIL_QUEUE_MAX_CONCURRENT || '5', 10),
    batchSize: parseInt(process.env.EMAIL_QUEUE_BATCH_SIZE || '10', 10),
  },

  // Email Service Features (Enable/Disable specific email types)
  features: {
    accountCreation: process.env.EMAIL_FEATURE_ACCOUNT_CREATION !== 'false', // Default: true
    verification: process.env.EMAIL_FEATURE_VERIFICATION !== 'false', // Default: true
    passwordReset: process.env.EMAIL_FEATURE_PASSWORD_RESET !== 'false', // Default: true
    subscriptionConfirmation:
      process.env.EMAIL_FEATURE_SUBSCRIPTION_CONFIRMATION !== 'false', // Default: true
    subscriptionExpired:
      process.env.EMAIL_FEATURE_SUBSCRIPTION_EXPIRED !== 'false', // Default: true
    subscriptionReminder:
      process.env.EMAIL_FEATURE_SUBSCRIPTION_REMINDER !== 'false', // Default: true
    notifications: process.env.EMAIL_FEATURE_NOTIFICATIONS !== 'false', // Default: true
  },

  // Email Templates Configuration
  templates: {
    enabled: process.env.EMAIL_TEMPLATES_ENABLED !== 'false', // Default: true
    cacheEnabled: process.env.EMAIL_TEMPLATES_CACHE !== 'false', // Default: true
    viewsPath:
      process.env.EMAIL_TEMPLATES_PATH || 'src/modules/templates/views',
  },

  // Email Logging & Debugging
  logging: {
    enabled: process.env.EMAIL_LOGGING_ENABLED !== 'false', // Default: true
    logLevel: process.env.EMAIL_LOG_LEVEL || 'info', // debug, info, warn, error
    logFailedOnly: process.env.EMAIL_LOG_FAILED_ONLY === 'true', // Default: false
  },
}));
