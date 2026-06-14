// GeneoRx mobile theme — dark clinical design matching the website.
export const colors = {
  // Brand — soft clinical teal (toned down from neon #28E1FF)
  primary:       '#4BAEC8',
  primaryDark:   '#3589A3',
  primaryLight:  '#6FC4DA',
  primary50:     'rgba(75, 174, 200, 0.10)',
  primary100:    'rgba(75, 174, 200, 0.18)',
  /** Solid CTA buttons — deeper teal, easy on the eyes */
  buttonPrimary: '#3589A3',

  // Surfaces
  background:    '#070A12',
  backgroundAlt: '#0B1022',
  surface:       'rgba(15, 23, 54, 0.86)',
  surfaceAlt:    '#101B40',
  card:          'rgba(15, 23, 54, 0.72)',
  hero:          '#101B40',

  // Borders
  border:        'rgba(255, 255, 255, 0.12)',
  borderSoft:    'rgba(255, 255, 255, 0.08)',

  // Text
  text:          '#EAF0FF',
  textSoft:      '#A9B4D6',
  textMuted:     '#8E9BC4',
  textDim:       '#6A7498',
  textInverse:   '#070A12',

  // Accent palette (slides, tags)
  violet:        '#A78BFA',
  pink:          '#FF4FD8',
  amber:         '#FBBF24',

  // Semantic
  success:  '#34D399',
  warning:  '#FBBF24',
  danger:   '#FB7185',

  // Status backgrounds
  successBg: 'rgba(52, 211, 153, 0.12)',
  warningBg: 'rgba(251, 191, 36, 0.12)',
  dangerBg:  'rgba(251, 113, 133, 0.12)',

  // Website portal tokens
  buttonText:   '#F5FAFF',
  inputBg:      'rgba(7, 10, 18, 0.45)',
  ghostBg:      'rgba(7, 10, 18, 0.35)',
  buttonBg:     'rgba(15, 23, 54, 0.55)',
  cardTop:      'rgba(15, 23, 54, 0.72)',
  cardBottom:   'rgba(16, 27, 64, 0.58)',
  badgeBg:      'rgba(15, 23, 54, 0.60)',
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
  sm:     7,
  md:     10,
  lg:     14,
  card:   18,
  button: 12,
  pill:   999,
};

/** Minimum comfortable tap height (older adults / accessibility). */
export const touchMin = 52;

export const typography = {
  h1:        { fontSize: 28, fontWeight: '700' as const, color: colors.text,    letterSpacing: -0.5 },
  h2:        { fontSize: 22, fontWeight: '700' as const, color: colors.text,    letterSpacing: -0.3 },
  h3:        { fontSize: 18, fontWeight: '600' as const, color: colors.text },
  body:      { fontSize: 16, fontWeight: '400' as const, color: colors.text,    lineHeight: 24 },
  bodyMuted: { fontSize: 15, fontWeight: '400' as const, color: colors.textMuted, lineHeight: 22 },
  small:     { fontSize: 13, fontWeight: '500' as const, color: colors.textMuted },
  button:    { fontSize: 16, fontWeight: '700' as const, letterSpacing: 0.1 },
  caption:   { fontSize: 13, fontWeight: '400' as const, color: colors.textMuted, lineHeight: 19 },
  label:     { fontSize: 15, fontWeight: '700' as const, color: colors.text },
};

/** Max content width on large phones / tablets — keeps reading comfortable. */
export const layout = {
  contentMaxWidth: 640,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  raised: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
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
