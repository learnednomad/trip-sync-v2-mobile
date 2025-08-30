/**
 * Trip Sync Design System - Design Tokens
 * Travel-inspired color palette with accessibility compliance
 */

export const tokens = {
  colors: {
    // Primary: Sky/Travel blues
    primary: {
      50: '#f0f9ff', // Light sky
      100: '#e0f2fe', // Lighter blue
      200: '#bae6fd', // Light blue
      300: '#7dd3fc', // Medium blue
      400: '#38bdf8', // Bright blue
      500: '#0ea5e9', // Main brand blue
      600: '#0284c7', // Darker blue
      700: '#0369a1', // Deep blue
      800: '#075985', // Very deep blue
      900: '#0c4a6e', // Darkest blue
    },

    // Secondary: Sunset/Adventure oranges
    secondary: {
      50: '#fff7ed', // Light cream
      100: '#ffedd5', // Light orange
      200: '#fed7aa', // Medium light orange
      300: '#fdba74', // Medium orange
      400: '#fb923c', // Bright orange
      500: '#f97316', // Main orange
      600: '#ea580c', // Darker orange
      700: '#c2410c', // Deep orange
      800: '#9a3412', // Very deep orange
      900: '#7c2d12', // Darkest orange
    },

    // Success: Nature greens
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e', // Main success green
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },

    // Warning: Caution yellows
    warning: {
      50: '#fefce8',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b', // Main warning yellow
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },

    // Error: Alert reds
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444', // Main error red
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },

    // Neutral: Modern greys
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
  },

  typography: {
    fontFamily: {
      sans: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        'system-ui',
        'sans-serif',
      ],
      mono: ['JetBrains Mono', 'Monaco', 'Cascadia Code', 'monospace'],
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
      '6xl': 60,
    },
    lineHeight: {
      xs: 16,
      sm: 20,
      base: 24,
      lg: 28,
      xl: 32,
      '2xl': 36,
      '3xl': 42,
      '4xl': 48,
      '5xl': 60,
      '6xl': 72,
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
  },

  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
    32: 128,
  },

  borderRadius: {
    none: 0,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
  },

  shadows: {
    sm: {
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    base: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    md: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 6,
    },
    lg: {
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    xl: {
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 12,
    },
  },

  breakpoints: {
    sm: 640, // Small phones
    md: 768, // Large phones
    lg: 1024, // Tablets
    xl: 1280, // Desktop
    '2xl': 1536, // Large desktop
  },

  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
} as const;

export type DesignTokens = typeof tokens;
export type ColorScale = keyof typeof tokens.colors;
export type ColorShade = keyof typeof tokens.colors.primary;
