import { useColorScheme } from 'react-native';

// CribChat Brand Colors
export const colors = {
  light: {
    // Backgrounds
    bgPrimary: '#FAF9F7',
    bgSecondary: '#F3F1ED',
    bgCard: '#FFFFFF',
    bgInput: '#F3F1ED',
    
    // Text
    textPrimary: '#2C2C2C',
    textSecondary: '#6B6B6B',
    textMuted: '#9A9A9A',
    textInverse: '#FFFFFF',
    
    // Accents
    accentPrimary: '#A8B5A0', // Sage
    accentSecondary: '#D4B5B0', // Dusty Rose
    accentLight: 'rgba(168, 181, 160, 0.15)',
    accentHover: '#8FA085',
    
    // Chat bubbles
    userBubble: '#A8B5A0',
    assistantBubble: '#F3F1ED',
    assistantText: '#2C2C2C',
    
    // States
    success: '#10b981',
    successBg: 'rgba(16, 185, 129, 0.15)',
    successText: '#059669',
    warning: '#f59e0b',
    warningBg: 'rgba(245, 158, 11, 0.15)',
    error: '#ef4444',
    errorBg: 'rgba(239, 68, 68, 0.15)',
    
    // Borders
    border: '#E5E2DC',
    
    // Gradients (as arrays for LinearGradient)
    gradientPrimary: ['#FAF9F7', '#F3F1ED', '#EBE8E3'],
    gradientAccent: ['#A8B5A0', '#8FA085'],
    gradientWarning: ['#f59e0b', '#d97706'],
    gradientSleep: ['#6366f1', '#4f46e5'],
    gradientNursing: ['#8b5cf6', '#7c3aed'],
    gradientBottle: ['#a78bfa', '#8b5cf6'],
    gradientSolids: ['#f472b6', '#ec4899'],
    gradientDiaper: ['#64748b', '#475569'],
    gradientSuccess: ['#10b981', '#059669'],
  },
  dark: {
    // Backgrounds - OLED friendly
    bgPrimary: '#1A1A1A',
    bgSecondary: '#242422',
    bgCard: '#2A2A28',
    bgInput: '#333330',
    
    // Text
    textPrimary: '#F5F3EF',
    textSecondary: '#9A9A94',
    textMuted: '#6B6B67',
    textInverse: '#1A1A1A',
    
    // Accents - slightly muted for dark mode
    accentPrimary: '#8FA085',
    accentSecondary: '#C4A5A0',
    accentLight: 'rgba(143, 160, 133, 0.2)',
    accentHover: '#7A8B72',
    
    // Chat bubbles
    userBubble: '#8FA085',
    assistantBubble: '#333330',
    assistantText: '#F5F3EF',
    
    // States
    success: '#10b981',
    successBg: 'rgba(16, 185, 129, 0.2)',
    successText: '#34d399',
    warning: '#f59e0b',
    warningBg: 'rgba(245, 158, 11, 0.2)',
    error: '#ef4444',
    errorBg: 'rgba(239, 68, 68, 0.2)',
    
    // Borders
    border: '#333330',
    
    // Gradients
    gradientPrimary: ['#1A1A1A', '#242422', '#2A2A28'],
    gradientAccent: ['#8FA085', '#7A8B72'],
    gradientWarning: ['#f59e0b', '#d97706'],
    gradientSleep: ['#6366f1', '#4f46e5'],
    gradientNursing: ['#8b5cf6', '#7c3aed'],
    gradientBottle: ['#a78bfa', '#8b5cf6'],
    gradientSolids: ['#f472b6', '#ec4899'],
    gradientDiaper: ['#64748b', '#475569'],
    gradientSuccess: ['#10b981', '#059669'],
  },
};

export type Theme = typeof colors.light;

export function useTheme(): Theme {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? colors.dark : colors.light;
}

// Common spacing values
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Common radius values
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Typography
export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};
