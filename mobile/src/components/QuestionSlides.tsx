import React, { useState } from 'react';
import { FlatList, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { AppIcon, type AppIconName } from '@/components/AppIcon';
import { FloatingMark } from '@/components/FloatingMark';
import { colors } from '@/theme';

type Slide = { icon: AppIconName; accent?: boolean; tag: string; title: string; paragraphs: string[]; bullets: string[] };

/** The four "how GeneoRx works" questions as swipeable cards, with the GeneoRx mark drifting behind them. */
export const QuestionSlides: React.FC<{ slides: Slide[]; width: number }> = ({ slides, width }) => {
  const [index, setIndex] = useState(0);
  const cardWidth = width;
  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => setIndex(Math.round(e.nativeEvent.contentOffset.x / (cardWidth + GAP)));
  return <View>
    <View style={[styles.dots, { paddingTop: 0, paddingBottom: 14 }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {slides.map((_, i) => <View key={i} style={[styles.pip, i === index && styles.pipOn]} />)}
    </View>
    <FloatingMark size={320} opacity={0.08} tint="#000000" travel={16} tilt={6} duration={5200} style={{ right: -40, top: 60 }} />
    <FlatList
      data={slides}
      horizontal
      pagingEnabled={false}
      snapToInterval={cardWidth + GAP}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      keyExtractor={(_, i) => String(i)}
      ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
      onMomentumScrollEnd={onEnd}
      renderItem={({ item }) => <View style={[styles.card, { width: cardWidth }, item.accent && styles.cardDark]}>
        <View style={[styles.iconTile, item.accent && styles.iconTileDark]}><AppIcon name={item.icon} size={24} color={colors.primary} /></View>
        <Text style={[styles.tag, item.accent && styles.tagDark]}>{item.tag}</Text>
        <Text accessibilityRole="header" style={[styles.title, item.accent && styles.titleDark]}>{item.title}</Text>
        {item.paragraphs[0] ? <Text style={[styles.body, item.accent && styles.bodyDark]}>{item.paragraphs[0]}</Text> : null}
        {item.bullets.map((b, i) => <View key={i} style={styles.bullet}><View style={[styles.dot, item.accent && { backgroundColor: colors.primary }]} /><Text style={[styles.bulletText, item.accent && styles.bodyDark]}>{b}</Text></View>)}
        {item.paragraphs[1] ? <Text style={[styles.body, item.accent && styles.bodyDark]}>{item.paragraphs[1]}</Text> : null}
      </View>}
    />
  </View>;
};

const GAP = 14;
const styles = StyleSheet.create({
  card: { alignSelf: 'flex-start', borderRadius: 32, padding: 22, gap: 8, backgroundColor: 'rgba(255,255,255,0.86)', borderWidth: 1, borderColor: colors.border },
  cardDark: { backgroundColor: 'rgba(234,243,255,0.92)', borderColor: '#D6E8FD' },
  iconTile: { width: 50, height: 50, borderRadius: 15, backgroundColor: colors.primary50, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  iconTileDark: { backgroundColor: 'rgba(0,113,227,0.14)' },
  tag: { fontSize: 13, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase', color: colors.textMuted },
  tagDark: { color: colors.textMuted },
  title: { fontSize: 26, lineHeight: 31, fontWeight: '700', letterSpacing: -0.8, color: colors.pine },
  titleDark: { color: colors.text },
  body: { fontSize: 16, lineHeight: 23, color: colors.textSoft },
  bodyDark: { color: colors.textSoft },
  bullet: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  dot: { width: 7, height: 7, borderRadius: 4, marginTop: 9, backgroundColor: colors.textDim },
  bulletText: { flex: 1, fontSize: 16, lineHeight: 23, color: colors.textSoft },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 7, paddingTop: 16 },
  pip: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
  pipOn: { width: 22, backgroundColor: colors.coral },
});
