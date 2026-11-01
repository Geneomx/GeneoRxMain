// GeneoRx: soft-blue canvas, clear white groups and a restrained royal-blue accent.
export const colors = {
  primary: '#3159B3', primaryDark: '#24458C', primaryLight: '#7899E5',
  primary50: '#EAF0FD', primary100: '#D4E0FC', buttonPrimary: '#3159B3', onPrimary: '#FFFFFF',
  background: '#F5F7FC', backgroundAlt: '#F0F4FC', surface: '#FFFFFF', surfaceAlt: '#F0F3F9', card: 'rgba(255,255,255,0.91)', hero: '#FFFFFF',
  glass: 'rgba(255,255,255,0.91)', glassBorder: '#FFFFFF',
  border: '#DEE6F2', borderStrong: '#BDCCE2', controlBorder: '#8294AE', borderSoft: '#E8EDF5',
  text: '#182A44', textSoft: '#425570', textMuted: '#5D6C81', textDim: '#718199', textInverse: '#FFFFFF',
  violet: '#6A4EE0', pink: '#B0426F', amber: '#8A5A0F',
  success: '#1F6B45', warning: '#8A5A0F', danger: '#B42318',
  successBg: '#E8F6EE', warningBg: '#FFF4E3', dangerBg: '#FDECEC',
  buttonText: '#1D2D46', inputBg: '#F8FAFE', ghostBg: '#EDF2FB', buttonBg: '#EDF2FB',
  cardTop: '#FFFFFF', cardBottom: '#FFFFFF', badgeBg: '#F5F6F8',
};
export const gradients = {
  primaryCta: ['#315BB5', '#4169B4'] as const,
  stepActive: ['#315BB5', '#4169B4'] as const,
  start: { x: 0, y: 0 }, end: { x: 1, y: 1 },
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
  sm:     8,
  md:     12,
  lg:     16,
  card:   22,
  button: 16,
  pill:   999,
};

/** Minimum comfortable tap height (older adults / accessibility). */
export const touchMin = 48;

export const typography = {
  h1:        { fontSize: 24, fontWeight: '600' as const, color: colors.text,    letterSpacing: -0.3 },
  h2:        { fontSize: 19, fontWeight: '500' as const, color: colors.text,    letterSpacing: -0.2 },
  h3:        { fontSize: 17, fontWeight: '500' as const, color: colors.text, letterSpacing: -0.2 },
  body:      { fontSize: 17, fontWeight: '400' as const, color: colors.text,    lineHeight: 26 },
  bodyMuted: { fontSize: 17, fontWeight: '400' as const, color: colors.textMuted, lineHeight: 26 },
  small:     { fontSize: 15, fontWeight: '500' as const, color: colors.textMuted },
  button:    { fontSize: 17, fontWeight: '500' as const },
  caption:   { fontSize: 15, fontWeight: '400' as const, color: colors.textMuted, lineHeight: 23 },
  label:     { fontSize: 15, fontWeight: '500' as const, color: colors.text },
};

/** Max content width on large phones / tablets — keeps reading comfortable. */
export const layout = {
  contentMaxWidth: 640,
};

export const shadow = {
  card: {
    shadowColor: '#193B70',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 1,
  },
  raised: {
    shadowColor: '#385DAA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 4,
  },
};

/** Shared portal card — matches website `.card` */
export const portalCard = {
  borderRadius: radius.card,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.card,
  ...shadow.card,
};
