/**
 * AwaazPay design tokens — extracted from design/AwaazPay.dc.html
 * Palette: deep navy + gold on warm cream. High contrast for sunlight.
 */
export const colors = {
  // Brand
  navy: '#1a2e6e',
  gold: '#f0b429',
  goldDark: '#c98f10', // pressed / hard shadow under gold buttons

  // Surfaces
  bg: '#f7f5ef',
  card: '#ffffff',
  border: '#eceadf',
  borderStrong: '#e3e0d5',
  borderInput: '#d7d4c8',

  // Text
  ink: '#15161a',
  muted: '#5a5c66',
  faint: '#8a8c96',
  disabled: '#b9b6aa',

  // Sources
  easypaisa: '#1e7f4f',
  jazzcash: '#c0392b',
  bank: '#2f5fb3',

  // Live / success
  liveDot: '#3ddc84',
  liveBorder: '#2ea36a',
  liveText: '#c9f2db',
  liveTextDim: '#a8dfc0',

  // Error
  error: '#c0392b',
  errorDark: '#8f2a1f', // hard shadow under red buttons
  errorBg: '#fbeae7',

  // Tints
  navyTint: '#e8edf8',
  greenTint: '#e7f2ea',
  goldTint: '#fdf3dc',
  chartBar: '#c9cede',
  chartBarDim: '#e6e3d8',

  // On-navy translucents
  whiteOnNavy10: 'rgba(255,255,255,0.1)',
  whiteOnNavy12: 'rgba(255,255,255,0.12)',
  white60: 'rgba(255,255,255,0.6)',
  white70: 'rgba(255,255,255,0.7)',
  white75: 'rgba(255,255,255,0.75)',
  white80: 'rgba(255,255,255,0.8)',
  white90: 'rgba(255,255,255,0.9)',
  white50: 'rgba(255,255,255,0.5)',
} as const;

export const radius = {
  sm: 10,
  md: 12,
  card: 14,
  lg: 16,
  xl: 20,
  header: 28, // bottom corners of the navy header
  pill: 999,
} as const;

export const fonts = {
  // Poppins — Latin UI
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extrabold: 'Poppins_800ExtraBold',
  // Noto Nastaliq Urdu — Urdu text
  urdu: 'NotoNastaliqUrdu_400Regular',
  urduSemibold: 'NotoNastaliqUrdu_600SemiBold',
  urduBold: 'NotoNastaliqUrdu_700Bold',
} as const;

export const layout = {
  screenPad: 20,
  headerTopPad: 44,
  tabBarHeight: 68,
} as const;
