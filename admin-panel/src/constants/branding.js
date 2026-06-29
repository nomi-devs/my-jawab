// src/constants/branding.js

/**
 * Branding constants for the application
 * Centralized branding information for consistent use across the app
 */

export const BRANDING = {
  // Brand Name
  name: "Jawab Admin",
  shortName: "SA",
  tagline: "Admin Panel",
  description: "Jawab Administration Platform",
  
  // Logo
  logo: {
    // Main logo path (from public folder)
    main: "./logo.png",
    // Alternative logo paths if needed
    light: "./logo.png",
    dark: "./logo.png",
    // Logo dimensions (can be adjusted based on actual logo)
    width: 40,
    height: 40,
    // Icon fallback (if logo fails to load)
    icon: "LayoutDashboard"
  },
  
  // Colors
  colors: {
    primary: {
      50: "#faf5ff",
      100: "#f3e8ff",
      200: "#e9d5ff",
      300: "#d8b4fe",
      400: "#c084fc",
      500: "#a855f7",
      600: "#9333ea",
      700: "#7e22ce",
      800: "#6b21a8",
      900: "#581c87",
      950: "#3b0764"
    },
    gradient: "linear-gradient(135deg, #9333ea 0%, #6b21a8 100%)"
  },
  
  // Typography
  typography: {
    fontFamily: "font-sans",
    heading: {
      size: "text-lg",
      weight: "font-bold"
    },
    subheading: {
      size: "text-sm",
      weight: "font-medium"
    }
  },
  
  // Links
  links: {
    website: "#",
    support: "#",
    documentation: "#"
  },
  
  // Copyright
  copyright: {
    year: new Date().getFullYear(),
    text: `© ${new Date().getFullYear()} Jawab Admin. All rights reserved.`
  }
};

export default BRANDING;

