import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { layout, spacing } from '@/theme';

/** Bottom tab bar body height — keep in sync with AppTabBar. */
export const TAB_BAR_HEIGHT = 68;

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const horizontal = width < 340 ? spacing.md : spacing.lg;
    const contentWidth = Math.min(width, layout.contentMaxWidth);

    return {
      width,
      height,
      /** iPhone SE, small Android */
      isCompact: width < 340,
      /** Narrow phones */
      isNarrow: width < 380,
      /** Tablets / large phones */
      isWide: width >= 500,
      horizontal,
      contentWidth,
      scrollBottom: spacing.xxl,
      /** Centered page column — use on the inner wrapper inside ScrollView */
      page: {
        width: '100%' as const,
        maxWidth: contentWidth,
        paddingHorizontal: horizontal,
        alignSelf: 'center' as const,
      },
    };
  }, [width, height]);
}
