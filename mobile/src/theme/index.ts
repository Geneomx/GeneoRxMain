import { progressPalette as palette, coral, sage, sand } from './progress';

// Warm Editorial across every screen, form, sheet, and navigation surface:
// cream paper, pine green for structure, a single coral for the one action on a screen.
export const colors = {
  primary: palette.accent, primaryDark: '#0F2A21', primaryLight: '#24503F',
  primary50: palette.soft, primary100: sage, buttonPrimary: coral.action, onPrimary: '#FFFFFF',
  background: palette.background, backgroundAlt: '#F2EADB', surface: palette.surface, surfaceAlt: '#F3EBDC', card: palette.surface, hero: palette.soft,
  glass: palette.surface, glassBorder: palette.border,
  border: palette.border, borderStrong: '#B9A98A', controlBorder: '#9C8C6B', borderSoft: '#EFE5D0',
  text: palette.text, textSoft: '#3B4A42', textMuted: palette.muted, textDim: '#7A8478', textInverse: '#FFFBF3',
  violet: '#6F5BA8', pink: '#B8527A', amber: '#9A6A12',
  success: '#2F7A53', warning: '#9A6A12', danger: '#B8402C',
  successBg: '#DCEBDD', warningBg: '#F6E7C8', dangerBg: coral.tint,
  buttonText: palette.text, inputBg: palette.surface, ghostBg: palette.soft, buttonBg: palette.soft,
  cardTop: palette.surface, cardBottom: palette.surface, badgeBg: palette.soft,
  overlay: 'rgba(22, 53, 43, 0.5)',
  // Warm Editorial extras
  pine: '#16352B', pine2: '#24503F', sage, sand, coral: coral.action, coralSoft: coral.soft,
  onPine: '#F7F1E6', onPineMuted: '#C5D4C9', onPineEyebrow: '#E9B7A8',
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

/** Fraunces for headings and big numbers, DM Sans (via AppText) for everything else. */
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
    shadowColor: '#16352B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 1,
  },
  raised: {
    shadowColor: '#16352B',
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
