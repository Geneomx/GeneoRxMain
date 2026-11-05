import { progressPalette as palette, coral, sage, sand } from './progress';

// Clean Apple-style look across every screen:
// white and light grey, near-black for structure, one blue for the action on a screen.
export const colors = {
  primary: coral.action, primaryDark: '#0066CC', primaryLight: '#2997FF',
  primary50: palette.soft, primary100: sage, buttonPrimary: coral.action, onPrimary: '#FFFFFF',
  background: palette.background, backgroundAlt: '#EBEBF0', surface: palette.surface, surfaceAlt: '#F5F5F7', card: palette.surface, hero: palette.soft,
  glass: palette.surface, glassBorder: palette.border,
  border: palette.border, borderStrong: '#A1A1A6', controlBorder: '#8E8E93', borderSoft: '#E5E5EA',
  text: palette.text, textSoft: '#424245', textMuted: palette.muted, textDim: '#86868B', textInverse: '#FFFFFF',
  violet: '#6F5BA8', pink: '#B8527A', amber: '#9A6A12',
  success: '#2F7A53', warning: '#9A6A12', danger: '#B8402C',
  successBg: '#DCEBDD', warningBg: '#F6E7C8', dangerBg: coral.tint,
  buttonText: palette.text, inputBg: palette.surface, ghostBg: palette.soft, buttonBg: palette.soft,
  cardTop: palette.surface, cardBottom: palette.surface, badgeBg: palette.soft,
  overlay: 'rgba(0, 0, 0, 0.5)',
  // Warm Editorial extras
  pine: '#1D1D1F', pine2: '#424245', sage, sand, coral: coral.action, coralSoft: coral.soft,
  onPine: '#F5F5F7', onPineMuted: '#C7C7CC', onPineEyebrow: '#C7C7CC',
};
export const gradients = {
  primaryCta: [coral.action, coral.action] as const,
  stepActive: [palette.accent, palette.accent] as const,
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
  sm:     10,
  md:     16,
  lg:     22,
  card:   28,
  button: 28,
  pill:   999,
};

/** Minimum comfortable tap height (older adults / accessibility). */
export const touchMin = 48;

/** Inter everywhere (the Fraunces names are kept so existing styles keep working). */
export const fonts = {
  serif: 'GeneoRxFraunces700',
  serifSemi: 'GeneoRxFraunces600',
};

export const typography = {
  h1:        { fontFamily: fonts.serif, fontSize: 28, fontWeight: 'normal' as const, color: colors.pine,    letterSpacing: -0.6, lineHeight: 34 },
  h2:        { fontFamily: fonts.serif, fontSize: 21, fontWeight: 'normal' as const, color: colors.pine,    letterSpacing: -0.3, lineHeight: 27 },
  h3:        { fontFamily: fonts.serif, fontSize: 18, fontWeight: 'normal' as const, color: colors.pine, letterSpacing: -0.2, lineHeight: 24 },
  body:      { fontSize: 17, fontWeight: '400' as const, color: colors.text,    lineHeight: 26 },
  bodyMuted: { fontSize: 17, fontWeight: '400' as const, color: colors.textMuted, lineHeight: 26 },
  small:     { fontSize: 15, fontWeight: '500' as const, color: colors.textMuted },
  button:    { fontSize: 17, fontWeight: '700' as const },
  caption:   { fontSize: 15, fontWeight: '400' as const, color: colors.textMuted, lineHeight: 23 },
  label:     { fontSize: 15, fontWeight: '600' as const, color: colors.pine },
};

/** Max content width on large phones / tablets — keeps reading comfortable. */
export const layout = {
  contentMaxWidth: 640,
};

export const shadow = {
  card: {
    shadowColor: '#1D1D1F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 1,
  },
  raised: {
    shadowColor: '#1D1D1F',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 5,
  },
  cta: {
    shadowColor: coral.action,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 4,
  },
};

/** Shared portal card — matches website `.card` */
export const portalCard = {
  borderRadius: radius.card,
  borderWidth: 1.5,
  borderColor: colors.border,
  backgroundColor: colors.card,
  ...shadow.card,
};

export { sand };
