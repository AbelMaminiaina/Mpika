/**
 * Theme Configuration
 * React Native Paper Theme
 */

import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Custom colors
const customColors = {
  primary: '#6366f1', // Indigo
  primaryContainer: '#e0e7ff',
  secondary: '#ec4899', // Pink
  secondaryContainer: '#fce7f3',
  tertiary: '#14b8a6', // Teal
  tertiaryContainer: '#ccfbf1',

  // Semantic colors
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Mental load colors
  loadLight: '#22c55e',
  loadBalanced: '#84cc16',
  loadBusy: '#f59e0b',
  loadOverloaded: '#f97316',
  loadCritical: '#ef4444',

  // Category colors
  categoryWork: '#6366f1',
  categoryStudy: '#8b5cf6',
  categoryLeisure: '#22c55e',
  categoryRest: '#06b6d4',
  categorySport: '#f97316',
  categorySocial: '#ec4899',
  categoryHousehold: '#84cc16',
  categoryPersonal: '#14b8a6',
};

// Light theme
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...customColors,
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceVariant: '#f1f5f9',
    onSurface: '#1e293b',
    onSurfaceVariant: '#64748b',
    outline: '#cbd5e1',
  },
  custom: {
    ...customColors,
  },
};

// Dark theme
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...customColors,
    background: '#0f172a',
    surface: '#1e293b',
    surfaceVariant: '#334155',
    onSurface: '#f1f5f9',
    onSurfaceVariant: '#94a3b8',
    outline: '#475569',
  },
  custom: {
    ...customColors,
  },
};

// Default export
export const theme = lightTheme;

// Get color for mental load level
export function getMentalLoadColor(level) {
  const colors = {
    light: customColors.loadLight,
    balanced: customColors.loadBalanced,
    busy: customColors.loadBusy,
    overloaded: customColors.loadOverloaded,
    critical: customColors.loadCritical,
  };
  return colors[level] || customColors.loadBalanced;
}

// Get color for category
export function getCategoryColor(category) {
  const colors = {
    WORK: customColors.categoryWork,
    STUDY: customColors.categoryStudy,
    LEISURE: customColors.categoryLeisure,
    REST: customColors.categoryRest,
    SPORT: customColors.categorySport,
    SOCIAL: customColors.categorySocial,
    HOUSEHOLD: customColors.categoryHousehold,
    PERSONAL: customColors.categoryPersonal,
  };
  return colors[category] || customColors.primary;
}

// Get color for priority
export function getPriorityColor(priority) {
  const colors = {
    LOW: '#94a3b8',
    MEDIUM: '#3b82f6',
    HIGH: '#f97316',
    URGENT: '#ef4444',
  };
  return colors[priority] || colors.MEDIUM;
}
