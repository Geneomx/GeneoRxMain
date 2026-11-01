import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/theme';

const paths = {
  close: 'm6 6 12 12M18 6 6 18',
  copy: 'M8 8h12v13H8ZM4 16H3V3h12v1',
  edit: 'm15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14Z',
  download: 'M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4',
  camera: 'M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Zm8 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  pill: 'M9 5 5 9a6 6 0 0 0 8 8l4-4a6 6 0 0 0-8-8ZM8 8l8 8',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5',
  moon: 'M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10Z',
  focus: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v3m0 14v3M2 12h3m14 0h3',
  chart: 'M4 4v16h16M8 15l4-4 4 2 4-7',
  file: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9ZM14 3v6h6M8 13h8m-8 4h6',
  calendar: 'M6 5h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3ZM3 10h18M8 3v4m8-4v4m-8 7 2 2 5-5',
  plan: 'M8 4h8a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Zm1-1h6v3H9ZM9 11h6m-6 4h6',
  chevron: 'm9 5 7 7-7 7',
  down: 'm6 9 6 6 6-6',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  check: 'm5 12 4 4L19 6',
  spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z',
  speaker: 'M11 4 6 8H3v8h3l5 4ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  stop: 'M6 6h12v12H6Z',
  account: 'M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21a8 8 0 0 1 16 0',
} as const;

export type AppIconName = keyof typeof paths;
export const AppIcon: React.FC<{ name: AppIconName; size?: number; color?: string }> = ({ name, size = 20, color = colors.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Path d={paths[name]} stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
