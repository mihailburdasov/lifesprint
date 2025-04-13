/**
 * Theme configuration
 */

import { THEMES } from '../constants';

/**
 * Theme interface
 */
export interface Theme {
  name: string;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
    info: string;
  };
}

/**
 * Light theme
 */
export const lightTheme: Theme = {
  name: THEMES.LIGHT,
  colors: {
    primary: '#4F46E5', // Indigo-600
    primaryLight: '#E0E7FF', // Indigo-100
    primaryDark: '#4338CA', // Indigo-700
    secondary: '#10B981', // Emerald-500
    secondaryLight: '#D1FAE5', // Emerald-100
    secondaryDark: '#059669', // Emerald-600
    background: '#F9FAFB', // Gray-50
    surface: '#FFFFFF', // White
    text: '#111827', // Gray-900
    textSecondary: '#6B7280', // Gray-500
    border: '#E5E7EB', // Gray-200
    error: '#EF4444', // Red-500
    success: '#10B981', // Emerald-500
    warning: '#F59E0B', // Amber-500
    info: '#3B82F6', // Blue-500
  },
};

/**
 * Dark theme
 */
export const darkTheme: Theme = {
  name: THEMES.DARK,
  colors: {
    primary: '#6366F1', // Indigo-500
    primaryLight: '#4F46E5', // Indigo-600
    primaryDark: '#4338CA', // Indigo-700
    secondary: '#10B981', // Emerald-500
    secondaryLight: '#059669', // Emerald-600
    secondaryDark: '#047857', // Emerald-700
    background: '#111827', // Gray-900
    surface: '#1F2937', // Gray-800
    text: '#F9FAFB', // Gray-50
    textSecondary: '#9CA3AF', // Gray-400
    border: '#374151', // Gray-700
    error: '#EF4444', // Red-500
    success: '#10B981', // Emerald-500
    warning: '#F59E0B', // Amber-500
    info: '#3B82F6', // Blue-500
  },
};

/**
 * Get theme by name
 * @param themeName The theme name
 * @returns The theme
 */
export function getTheme(themeName: string): Theme {
  return themeName === THEMES.DARK ? darkTheme : lightTheme;
}

/**
 * Apply theme to document
 * @param theme The theme to apply
 */
export function applyTheme(theme: Theme): void {
  // Set theme class on document
  if (theme.name === THEMES.DARK) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  // Set CSS variables
  const root = document.documentElement;
  
  Object.entries(theme.colors).forEach(([key, value]) => {
    // Convert camelCase to kebab-case
    const cssVarName = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    root.style.setProperty(`--color-${cssVarName}`, value);
  });
}

/**
 * Initialize theme
 * @param initialTheme The initial theme name
 */
export function initializeTheme(initialTheme: string = THEMES.LIGHT): void {
  const theme = getTheme(initialTheme);
  applyTheme(theme);
}
