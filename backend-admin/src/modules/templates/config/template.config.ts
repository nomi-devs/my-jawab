/**
 * Template Configuration
 * Color scheme and branding configuration for email templates
 */
export const templateConfig = {
  // Branding
  logo: {
    url: 'https://demo.jantrah.com/jawab-admin/logo.png',
    alt: 'Jawab Admin',
    width: 150,
    height: 'auto',
  },

  // Color Scheme - Purple Theme (matching Jawab Admin dashboard)
  colors: {
    // Primary Colors
    primary: '#7C3AED', // Purple-600 (main brand color)
    primaryDark: '#6D28D9', // Purple-700 (hover states)
    primaryLight: '#8B5CF6', // Purple-500 (light accents)

    // Secondary Colors
    secondary: '#A78BFA', // Purple-400
    secondaryLight: '#C4B5FD', // Purple-300

    // Background Colors
    background: '#FFFFFF', // White
    backgroundLight: '#F8F9FA', // Light gray background
    backgroundDark: '#F4F4F4', // Darker gray for body

    // Text Colors
    textPrimary: '#1F2937', // Dark gray (main text)
    textSecondary: '#6B7280', // Medium gray (secondary text)
    textLight: '#9CA3AF', // Light gray (muted text)
    textWhite: '#FFFFFF', // White text

    // Border Colors
    border: '#E5E7EB', // Light gray border
    borderLight: '#F3F4F6', // Very light border

    // Status Colors
    success: '#10B981', // Green-500
    warning: '#F59E0B', // Amber-500
    error: '#EF4444', // Red-500
    info: '#3B82F6', // Blue-500

    // Accent Colors
    accent: '#7C3AED', // Same as primary
    accentLight: '#EDE9FE', // Purple-100 (light background)
  },

  // Typography
  typography: {
    fontFamily: 'Arial, sans-serif',
    fontSize: {
      small: '12px',
      base: '14px',
      large: '16px',
      xlarge: '18px',
      xxlarge: '24px',
      heading: '28px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.6,
    },
  },

  // Spacing
  spacing: {
    xs: '5px',
    sm: '10px',
    md: '20px',
    lg: '30px',
    xl: '40px',
  },

  // Border Radius
  borderRadius: {
    sm: '5px',
    md: '10px',
    lg: '15px',
    full: '9999px',
  },

  // Box Shadow
  boxShadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 0 10px rgba(0, 0, 0, 0.1)',
    lg: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },

  // App Information
  app: {
    name: 'Jawab',
    url: process.env.FRONTEND_URL || 'https://jawab.com',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@jawab.com',
  },
};

export default templateConfig;
