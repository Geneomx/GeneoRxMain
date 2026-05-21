// GeneoRx mobile theme   clean, clinical light design matching the brand.
export const colors = {
  // Brand
  primary:       '#0E7C66',   // teal   from the real logo
  primaryDark:   '#075F4F',
  primaryLight:  '#3FB39A',
  primary50:     '#ECF6F3',
  primary100:    '#D7EDE7',

  // Surfaces
  background:    '#FFFFFF',
  backgroundAlt: '#F7FAF9',
  surface:       '#FFFFFF',
  surfaceAlt:    '#F1F5F4',

  // Borders
  border:        '#DDE6E3',
  borderSoft:    '#E8EDEC',

  // Text
  text:          '#0F1F1B',
  textSoft:      '#3C4F4A',
  textMuted:     '#6B7B77',
  textDim:       '#9CA8A4',
  textInverse:   '#FFFFFF',

  // Semantic
  success:  '#16A34A',
  warning:  '#D97706',
  danger:   '#DC2626',

  // Status backgrounds
  successBg: '#F0FDF4',
  warningBg: '#FFFBEB',
  dangerBg:  '#FEF2F2',
};

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const radius = {
  sm:   7,
  md:   10,
  lg:   14,
  pill: 999,
};

export const typography = {
  h1:        { fontSize: 26, fontWeight: '700' as const, color: colors.text,    letterSpacing: -0.5 },
  h2:        { fontSize: 20, fontWeight: '700' as const, color: colors.text,    letterSpacing: -0.3 },
  h3:        { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  body:      { fontSize: 15, fontWeight: '400' as const, color: colors.text,    lineHeight: 22 },
  bodyMuted: { fontSize: 14, fontWeight: '400' as const, color: colors.textMuted, lineHeight: 20 },
  small:     { fontSize: 12, fontWeight: '500' as const, color: colors.textMuted },
  button:    { fontSize: 15, fontWeight: '600' as const, letterSpacing: 0.1 },
};

export const shadow = {
  card: {
    shadowColor: '#0F1F1B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  raised: {
    shadowColor: '#0F1F1B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
};
