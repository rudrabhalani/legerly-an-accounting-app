/**
 * Ledgerly Design Tokens
 * Light-theme only design system compliant with Prompt Bible specs
 */

export const COLORS = {
  // Brand Primary
  primary: '#4F46E5',         // Royal Indigo
  primaryLight: '#EEF2FF',    // Soft Indigo
  primaryHover: '#4338CA',
  primaryDark: '#3730A3',

  // Money In / Success
  moneyIn: '#16A34A',         // Emerald Green
  moneyInTint: '#DCFCE7',     // Soft Green tint
  moneyInHover: '#15803D',
  moneyInDark: '#14532D',

  // Money Out / Danger
  moneyOut: '#DC2626',        // Coral Red
  moneyOutTint: '#FEE2E2',    // Soft Red tint
  moneyOutHover: '#B91C1C',
  moneyOutDark: '#7F1D1D',

  // Warning (low stock, due soon)
  warning: '#F59E0B',         // Amber
  warningTint: '#FEF3C7',     // Soft Amber tint
  warningHover: '#D97706',

  // Neutral Background & Surfaces
  background: '#F8FAFC',      // Off-white
  surface: '#FFFFFF',         // Card white
  surfaceSubtle: '#F1F5F9',   // Very light grey

  // Borders & Dividers
  border: '#E2E8F0',          // Light grey
  borderStrong: '#CBD5E1',

  // Typography
  textPrimary: '#0F172A',     // Slate
  textSecondary: '#64748B',   // Grey
  textMuted: '#94A3B8',       // Light Slate
} as const;

export const TYPOGRAPHY = {
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  scale: {
    display: '28px',
    title: '20px',
    body: '16px',
    caption: '13px',
    tiny: '11px',
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const RADIUS = {
  card: '16px',
  button: '12px',
  input: '12px',
  badge: '8px',
  full: '9999px',
} as const;

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
} as const;

export const SHADOWS = {
  soft: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
  elevated: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
  floating: '0 10px 25px -5px rgba(79, 70, 229, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
} as const;
