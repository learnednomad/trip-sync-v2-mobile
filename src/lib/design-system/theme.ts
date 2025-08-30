/**
 * Trip Sync Theme System
 * Extends NativeWind with custom design tokens
 */

import { tokens } from './tokens';

export interface TripSyncTheme {
  colors: typeof tokens.colors;
  typography: typeof tokens.typography;
  spacing: typeof tokens.spacing;
  borderRadius: typeof tokens.borderRadius;
  shadows: typeof tokens.shadows;
  breakpoints: typeof tokens.breakpoints;
  zIndex: typeof tokens.zIndex;
  isDark: boolean;
}

export const lightTheme: TripSyncTheme = {
  ...tokens,
  isDark: false,
};

export const darkTheme: TripSyncTheme = {
  ...tokens,
  isDark: true,
  colors: {
    ...tokens.colors,
    // Keep original neutral colors - dark mode handled by Tailwind classes
  },
};

/**
 * Semantic color aliases for consistent usage
 */
export const semanticColors = {
  // Background colors
  background: {
    primary: 'bg-white dark:bg-neutral-900',
    secondary: 'bg-neutral-50 dark:bg-neutral-800',
    tertiary: 'bg-neutral-100 dark:bg-neutral-700',
  },

  // Text colors
  text: {
    primary: 'text-neutral-900 dark:text-white',
    secondary: 'text-neutral-700 dark:text-neutral-200',
    tertiary: 'text-neutral-600 dark:text-neutral-300',
    muted: 'text-neutral-500 dark:text-neutral-400',
    inverse: 'text-white dark:text-neutral-900',
  },

  // Border colors
  border: {
    primary: 'border-neutral-200 dark:border-neutral-700',
    secondary: 'border-neutral-300 dark:border-neutral-600',
    focus: 'border-primary-500 dark:border-primary-400',
    error: 'border-error-500 dark:border-error-400',
    success: 'border-success-500 dark:border-success-400',
  },

  // Interactive states
  interactive: {
    primary: 'bg-primary-500 hover:bg-primary-600 active:bg-primary-700',
    secondary:
      'bg-secondary-500 hover:bg-secondary-600 active:bg-secondary-700',
    ghost:
      'bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 active:bg-neutral-200 dark:active:bg-neutral-700',
    destructive: 'bg-error-500 hover:bg-error-600 active:bg-error-700',
  },
} as const;

/**
 * Component size variants
 */
export const sizeVariants = {
  xs: {
    height: 'h-6',
    padding: 'px-2 py-1',
    text: 'text-xs',
    iconSize: 12,
  },
  sm: {
    height: 'h-8',
    padding: 'px-3 py-2',
    text: 'text-sm',
    iconSize: 16,
  },
  md: {
    height: 'h-10',
    padding: 'px-4 py-2.5',
    text: 'text-base',
    iconSize: 20,
  },
  lg: {
    height: 'h-12',
    padding: 'px-6 py-3',
    text: 'text-lg',
    iconSize: 24,
  },
  xl: {
    height: 'h-14',
    padding: 'px-8 py-4',
    text: 'text-xl',
    iconSize: 28,
  },
} as const;

/**
 * Animation presets for consistent motion
 */
export const animations = {
  durations: {
    fast: 150,
    normal: 200,
    slow: 300,
    slower: 500,
  },

  easings: {
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  presets: {
    fadeIn: {
      from: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slideUp: {
      from: { opacity: 0, translateY: 20 },
      animate: { opacity: 1, translateY: 0 },
      exit: { opacity: 0, translateY: -20 },
    },
    scale: {
      from: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
  },
} as const;

/**
 * Trip-specific component variants
 */
export const tripVariants = {
  status: {
    planning: {
      background: 'bg-warning-100 dark:bg-warning-900',
      text: 'text-warning-800 dark:text-warning-200',
      border: 'border-warning-300 dark:border-warning-600',
    },
    confirmed: {
      background: 'bg-primary-100 dark:bg-primary-900',
      text: 'text-primary-800 dark:text-primary-200',
      border: 'border-primary-300 dark:border-primary-600',
    },
    ongoing: {
      background: 'bg-success-100 dark:bg-success-900',
      text: 'text-success-800 dark:text-success-200',
      border: 'border-success-300 dark:border-success-600',
    },
    completed: {
      background: 'bg-neutral-100 dark:bg-neutral-800',
      text: 'text-neutral-700 dark:text-neutral-300',
      border: 'border-neutral-300 dark:border-neutral-600',
    },
    cancelled: {
      background: 'bg-error-100 dark:bg-error-900',
      text: 'text-error-800 dark:text-error-200',
      border: 'border-error-300 dark:border-error-600',
    },
  },

  priority: {
    low: {
      background: 'bg-neutral-100 dark:bg-neutral-800',
      text: 'text-neutral-600 dark:text-neutral-400',
    },
    medium: {
      background: 'bg-warning-100 dark:bg-warning-900',
      text: 'text-warning-700 dark:text-warning-300',
    },
    high: {
      background: 'bg-error-100 dark:bg-error-900',
      text: 'text-error-700 dark:text-error-300',
    },
  },

  type: {
    business: {
      background: 'bg-neutral-100 dark:bg-neutral-800',
      accent: 'bg-neutral-500',
    },
    leisure: {
      background: 'bg-primary-100 dark:bg-primary-900',
      accent: 'bg-primary-500',
    },
    family: {
      background: 'bg-success-100 dark:bg-success-900',
      accent: 'bg-success-500',
    },
    adventure: {
      background: 'bg-secondary-100 dark:bg-secondary-900',
      accent: 'bg-secondary-500',
    },
  },
} as const;

/**
 * Accessibility configuration
 */
export const accessibility = {
  minimumTouchTarget: 44,
  focusRingWidth: 2,
  focusRingColor: 'border-primary-500',
  focusRingOffset: 2,

  // WCAG 2.1 AA compliant contrast ratios
  contrastRatios: {
    normalText: 4.5,
    largeText: 3.0,
    uiElements: 3.0,
  },

  // Screen reader announcements
  announcements: {
    routeChange: 'Page changed',
    actionComplete: 'Action completed',
    errorOccurred: 'Error occurred',
    loadingStarted: 'Loading',
    loadingComplete: 'Loading complete',
  },
} as const;

/**
 * Responsive design utilities
 */
export const responsive = {
  // Mobile-first breakpoint utilities
  mobile: 'sm:hidden',
  tablet: 'hidden sm:block lg:hidden',
  desktop: 'hidden lg:block',

  // Container max-widths
  container: {
    sm: 'max-w-sm', // 384px
    md: 'max-w-md', // 448px
    lg: 'max-w-lg', // 512px
    xl: 'max-w-xl', // 576px
    '2xl': 'max-w-2xl', // 672px
    '4xl': 'max-w-4xl', // 896px
    '6xl': 'max-w-6xl', // 1152px
  },

  // Grid layouts
  grid: {
    cols1: 'grid-cols-1',
    cols2: 'grid-cols-1 md:grid-cols-2',
    cols3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    cols4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  },
} as const;

export type SizeVariant = keyof typeof sizeVariants;
export type ColorVariant = keyof typeof tokens.colors;
export type TripStatus = keyof typeof tripVariants.status;
export type TripType = keyof typeof tripVariants.type;
