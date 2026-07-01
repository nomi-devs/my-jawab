import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  // Application Information
  name: process.env.APP_NAME || 'Jawab',
  url: process.env.APP_URL || 'https://jawab.jantrah.io',
  apiUrl: process.env.API_URL || 'https://jawab.jantrah.io/api',
  frontendUrl: process.env.FRONTEND_URL || 'https://jawab.jantrah.io',
  // Environment
  env: process.env.NODE_ENV || 'production',
  port: parseInt(process.env.PORT || '3001', 10),

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d', // 1 month (30 days)
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '90d', // 3 months (90 days)
  },

  // Verification & Reset Codes
  verification: {
    codeExpiresIn: parseInt(
      process.env.VERIFICATION_CODE_EXPIRES_IN || '900000',
      10,
    ), // 15 minutes
    resetCodeExpiresIn: parseInt(
      process.env.RESET_CODE_EXPIRES_IN || '3600000',
      10,
    ), // 1 hour
  },

  // Subscription Reminders
  subscription: {
    reminderDaysBeforeExpiry: parseInt(
      process.env.SUBSCRIPTION_REMINDER_DAYS || '3',
      10,
    ),
    pendingReminderHours: parseInt(
      process.env.PENDING_SUBSCRIPTION_REMINDER_HOURS || '24',
      10,
    ),
  },

  // Feature Flags (Application-wide)
  features: {
    emailVerification: process.env.FEATURE_EMAIL_VERIFICATION !== 'false',
    passwordReset: process.env.FEATURE_PASSWORD_RESET !== 'false',
    subscriptionReminders:
      process.env.FEATURE_SUBSCRIPTION_REMINDERS !== 'false',
  },

  // Timezone Configuration
  timezone: {
    // Server timezone offset in hours (e.g., 3 for UTC+3, -5 for UTC-5)
    // This is used for parsing datetime-local inputs and converting UTC dates back to local time
    offset: parseInt(process.env.SERVER_TIMEZONE_OFFSET || '0', 10),
    // Timezone name (e.g., 'Asia/Riyadh', 'America/New_York')
    // If not provided, uses offset
    name: process.env.SERVER_TIMEZONE || undefined,
  },
}));
