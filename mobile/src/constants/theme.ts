export const colors = {
  bg: '#F7F3EA',              // Cream background
  bgSecondary: '#EDE7D8',     // Muted secondary background
  surface: '#FFFFFF',         // White card surfaces
  surfaceHover: '#F4EFE2',    // Slightly darker surface on tap
  border: '#E3DCCB',          // Warm light border
  borderHover: '#C9C2B0',     // Darker border on focus
  primary: '#1F3D2B',         // Racing green
  secondary: '#8C2F1B',       // Burgundy
  accent: '#1F3D2B',          // brand action color: Racing Green
  accentDim: '#E9E5D9',       // very light tint
  accentBorder: '#D2C9B5',    // warm border
  text: '#23201A',            // charcoal/dark brown text
  textMuted: '#7A7468',       // muted gray-brown
  textSubtle: '#9A937F',      // light gray-brown
  success: '#10b981',         // green
  successDim: 'rgba(16,185,129,0.1)',
  danger: '#B42318',          // red
  dangerDim: 'rgba(180,35,24,0.1)',
  warning: '#f59e0b',         // orange
  warningDim: 'rgba(245,158,11,0.1)',
  purple: '#8C2F1B',          // Burgundy
  purpleDim: 'rgba(140,47,27,0.1)',
  blue: '#1F3D2B',            // Racing green
  blueDim: 'rgba(31,61,43,0.1)',
  gold: '#C9A227',            // Gold
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};
