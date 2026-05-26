import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { colors, spacing } from '@/theme';
import { useAuth } from '@/auth/AuthContext';
import {
  ABOUT_CARDS,
  DEMO_MEDICATIONS,
  DEMO_SYMPTOMS,
  FAQ_ITEMS,
  FEATURE_CHIPS,
  FOOTER_TAGLINE,
  generateDemoInsight,
  HOW_IT_WORKS_STEPS,
  LEGAL_URLS,
  TESTIMONIALS,
  type DemoInsight,
} from '@/content/homeContent';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

type SectionKey = 'how' | 'demo' | 'faq';

const SectionHeader: React.FC<{
  tag: string;
  title: React.ReactNode;
  desc?: string;
  dark?: boolean;
}> = ({ tag, title, desc, dark }) => (
  <View style={styles.sectionHead}>
    <Text style={[styles.sectionTag, dark && styles.sectionTagDark]}>{tag}</Text>
    <Text style={[styles.sectionTitle, dark && styles.sectionTitleDark]}>{title}</Text>
    {desc ? (
      <Text style={[styles.sectionDesc, dark && styles.sectionDescDark]}>{desc}</Text>
    ) : null}
  </View>
);

const ChoiceRow: React.FC<{
  label: string;
  selected: boolean;
  onPress: () => void;
}> = ({ label, selected, onPress }) => (
  <Pressable
    style={({ pressed }) => [
      styles.choiceRow,
      selected && styles.choiceRowSelected,
      pressed && { opacity: 0.85 },
    ]}
    onPress={onPress}
  >
    <View style={[styles.choiceRadio, selected && styles.choiceRadioSelected]}>
      {selected ? <View style={styles.choiceRadioInner} /> : null}
    </View>
    <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>{label}</Text>
  </Pressable>
);

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const { continueAsGuest } = useAuth();
  const float = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Partial<Record<SectionKey, number>>>({});

  const [activeCard, setActiveCard] = useState(0);
  const [medication, setMedication] = useState('');
  const [symptom, setSymptom] = useState('');
  const [demoResult, setDemoResult] = useState<DemoInsight | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  const prev = () => setActiveCard((c) => (c > 0 ? c - 1 : ABOUT_CARDS.length - 1));
  const next = () => setActiveCard((c) => (c < ABOUT_CARDS.length - 1 ? c + 1 : 0));

  const card = ABOUT_CARDS[activeCard];

  const scrollToSection = (key: SectionKey) => {
    const y = sectionOffsets.current[key];
    if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
  };

  const onSectionLayout = (key: SectionKey) => (e: { nativeEvent: { layout: { y: number } } }) => {
    sectionOffsets.current[key] = e.nativeEvent.layout.y;
  };

  const handleGenerateInsight = () => {
    const result = generateDemoInsight(medication, symptom);
    if (!result) {
      Alert.alert('Select a symptom', 'Please select a symptom to see a sample insight.');
      return;
    }
    setDemoResult(result);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq((current) => (current === index ? null : index));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topNav}>
        <View style={styles.brandRow}>
          <Image source={require('../../assets/logo.png')} style={styles.brandLogo} resizeMode="contain" />
          <Text style={styles.brandName}>GeneoRx</Text>
        </View>
        <View style={styles.navButtons}>
          <Pressable
            style={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.6 }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkBtnText}>Sign in</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.ghostChip, pressed && { backgroundColor: colors.surfaceAlt }]}
            onPress={() => continueAsGuest()}
          >
            <Text style={styles.ghostChipText}>Guest</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.primaryChip, pressed && { backgroundColor: colors.primaryDark }]}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.primaryChipText}>Create</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroVisual}>
          <View style={styles.heroBg} />
          <View style={styles.heroBgGlow} />
          <View style={styles.heroRingOuter} />
          <View style={styles.heroRingMid} />
          <Animated.View style={[styles.heroLogoWrap, { transform: [{ translateY }] }]}>
            <Image source={require('../../assets/logo.png')} style={styles.heroLogo} resizeMode="contain" />
          </Animated.View>
        </View>

        <View style={styles.heroCopy}>
          <View style={styles.heroBadge}>
            <View style={styles.heroBadgeDot}>
              <Text style={styles.heroBadgeDotText}>✕</Text>
            </View>
            <Text style={styles.heroBadgeText}>Personal medication intelligence platform</Text>
          </View>

          <Text style={styles.headline}>
            Understand your meds with{'\n'}
            <Text style={styles.headlineItalic}>clearer insight</Text>
            <Text style={styles.headlineDot}>.</Text>
          </Text>

          <Text style={styles.sub}>
            GeneoRx turns medications, symptoms, and nutrient patterns into simple guidance you can track,
            understand, and discuss with your doctor.
          </Text>

          <View style={styles.chips}>
            {FEATURE_CHIPS.map((chip) => (
              <View key={chip} style={styles.chip}>
                <View style={styles.chipDot} />
                <Text style={styles.chipText}>{chip}</Text>
              </View>
            ))}
          </View>

          <View style={styles.heroActions}>
            <Button title="Create your free account" onPress={() => navigation.navigate('Register')} />
            <Pressable
              style={({ pressed }) => [styles.guestLink, pressed && { opacity: 0.6 }]}
              onPress={() => continueAsGuest()}
            >
              <Text style={styles.guestLinkText}>
                Or <Text style={styles.guestLinkAccent}>continue as guest →</Text>
              </Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.legal}>Free to start · Educational guidance only · not medical advice</Text>

        <View style={styles.sliderHead}>
          <Text style={styles.sliderHeadTag}>About GeneoRx</Text>
          <Text style={styles.sliderHeadTitle}>
            A <Text style={styles.sliderHeadItalic}>clearer</Text> picture of your health.
          </Text>
        </View>

        <View style={styles.sliderWrap}>
          <TouchableOpacity style={styles.arrow} onPress={prev} activeOpacity={0.7}>
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>

          <View style={[styles.card, card.summary && styles.cardSummary]}>
            <View style={styles.cardNumBadge}>
              <Text style={[styles.cardNum, card.summary && styles.cardNumSummary]}>{card.num}</Text>
            </View>
            <View style={[styles.iconWrap, card.summary && styles.iconWrapSummary]}>
              <Text style={styles.iconEmoji}>{card.icon}</Text>
            </View>
            <Text style={[styles.cardTitle, card.summary && styles.cardTitleSummary]}>{card.title}</Text>
            {card.body ? (
              <Text style={[styles.cardBody, card.summary && styles.cardBodySummary]}>{card.body}</Text>
            ) : null}
            {card.bullets.length > 0 && (
              <View style={styles.bulletList}>
                {card.bullets.map((b, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bulletDot, card.summary && styles.bulletDotSummary]} />
                    <Text style={[styles.bulletText, card.summary && styles.bulletTextSummary]}>{b}</Text>
                  </View>
                ))}
              </View>
            )}
            {card.extra ? (
              <Text style={[styles.cardExtra, card.summary && styles.cardBodySummary]}>{card.extra}</Text>
            ) : null}
          </View>

          <TouchableOpacity style={styles.arrow} onPress={next} activeOpacity={0.7}>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dotsRow}>
          {ABOUT_CARDS.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setActiveCard(i)} activeOpacity={0.7}>
              <View style={[styles.dot, i === activeCard && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* How it works */}
        <View onLayout={onSectionLayout('how')} style={styles.sectionBlock}>
          <SectionHeader
            tag="How it works"
            title={
              <>
                Three steps to your{'\n'}
                <Text style={styles.em}>first insight</Text>.
              </>
            }
            desc="No long forms. No medical jargon. Just thoughtful questions and a personalized response."
          />
          <View style={styles.stepsList}>
            {HOW_IT_WORKS_STEPS.map((step) => (
              <View key={step.num} style={styles.stepCard}>
                <View style={styles.stepNumWrap}>
                  <Text style={styles.stepNum}>{step.num}</Text>
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepBody}>{step.body}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick check demo */}
        <View onLayout={onSectionLayout('demo')} style={styles.sectionBlock}>
          <SectionHeader
            tag="Quick check"
            title={
              <>
                See it for <Text style={styles.em}>yourself</Text>.
              </>
            }
            desc="No account required. Pick a medication and a symptom to see a sample insight."
          />
          <View style={styles.demoCard}>
            <View style={styles.demoCardHd}>
              <Text style={styles.demoCardTitle}>Medication & symptom pattern check</Text>
              <Text style={styles.demoCardSub}>This is a guided sample. Sign up to build your full profile.</Text>
            </View>
            <View style={styles.demoCardBd}>
              <Text style={styles.fieldLabel}>Your medication</Text>
              {DEMO_MEDICATIONS.map((opt) => (
                <ChoiceRow
                  key={opt.value || 'none'}
                  label={opt.label}
                  selected={medication === opt.value}
                  onPress={() => {
                    setMedication(opt.value);
                    setDemoResult(null);
                  }}
                />
              ))}

              <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Your main symptom</Text>
              {DEMO_SYMPTOMS.filter((o) => o.value).map((opt) => (
                <ChoiceRow
                  key={opt.value}
                  label={opt.label}
                  selected={symptom === opt.value}
                  onPress={() => {
                    setSymptom(opt.value);
                    setDemoResult(null);
                  }}
                />
              ))}

              <Button title="See my insight" onPress={handleGenerateInsight} style={styles.demoSubmit} />

              {demoResult ? (
                <View style={styles.resultBox}>
                  <Text style={styles.resultTitle}>Your GeneoRx insight</Text>
                  <View style={styles.resultBlock}>
                    <Text style={styles.resultBlockLabel}>What GeneoRx sees</Text>
                    <Text style={styles.resultBlockText}>{demoResult.insight}</Text>
                  </View>
                  <View style={styles.resultBlock}>
                    <Text style={styles.resultBlockLabel}>What this may mean</Text>
                    <Text style={styles.resultBlockText}>{demoResult.meaning}</Text>
                  </View>
                  <View style={styles.resultBlock}>
                    <Text style={styles.resultBlockLabel}>Questions for your doctor</Text>
                    <Text style={styles.resultBlockText}>{demoResult.doctor}</Text>
                  </View>
                  <Text style={styles.resultNote}>
                    Educational guidance only — this is not medical advice. Always discuss persistent symptoms
                    and medication concerns with your healthcare provider.
                  </Text>
                  <View style={styles.resultCta}>
                    <Button title="Save my profile" onPress={() => navigation.navigate('Register')} />
                    <Button
                      title="Sign in"
                      variant="secondary"
                      onPress={() => navigation.navigate('Login')}
                      style={styles.resultCtaSecondary}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Testimonials */}
        <View style={[styles.sectionBlock, styles.testimonialsSection]}>
          <SectionHeader
            tag="What people say"
            title={
              <>
                Built for those who want <Text style={styles.emLight}>real answers</Text>.
              </>
            }
            desc="Educational guidance that helps people prepare for better conversations with their doctors."
            dark
          />
          {TESTIMONIALS.map((t) => (
            <View key={t.initials} style={styles.quoteCard}>
              <Text style={styles.quoteMark}>"</Text>
              <Text style={styles.quoteText}>{t.quote}</Text>
              <View style={styles.quoteAuthor}>
                <View style={styles.quoteAvatar}>
                  <Text style={styles.quoteAvatarText}>{t.initials}</Text>
                </View>
                <View>
                  <Text style={styles.quoteName}>{t.name}</Text>
                  <Text style={styles.quoteRole}>{t.role}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* FAQ */}
        <View onLayout={onSectionLayout('faq')} style={styles.sectionBlock}>
          <SectionHeader
            tag="FAQ"
            title={
              <>
                Frequently asked <Text style={styles.em}>questions</Text>.
              </>
            }
          />
          <View style={styles.faqList}>
            {FAQ_ITEMS.map((item, index) => {
              const open = openFaq === index;
              return (
                <View key={item.question} style={styles.faqItem}>
                  <Pressable
                    style={({ pressed }) => [styles.faqSummary, pressed && { opacity: 0.85 }]}
                    onPress={() => toggleFaq(index)}
                  >
                    <Text style={styles.faqQuestion}>{item.question}</Text>
                    <Text style={styles.faqChevron}>{open ? '−' : '+'}</Text>
                  </Pressable>
                  {open ? <Text style={styles.faqBody}>{item.answer}</Text> : null}
                </View>
              );
            })}
          </View>
        </View>

        {/* Final CTA */}
        <View style={styles.bottomCta}>
          <Text style={styles.bottomCtaTitle}>
            Ready for a <Text style={styles.bottomCtaItalic}>clearer picture</Text> of your health?
          </Text>
          <Text style={styles.bottomCtaSub}>
            Join people who use GeneoRx to turn their medications and symptoms into something useful.
          </Text>
          <View style={styles.bottomCtaActions}>
            <Button title="Create your free account" onPress={() => navigation.navigate('Register')} />
            <Button title="Try as guest" variant="secondary" onPress={() => continueAsGuest()} />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.siteFooter}>
          <View style={styles.footerBrandRow}>
            <Image source={require('../../assets/logo.png')} style={styles.footerLogo} resizeMode="contain" />
            <Text style={styles.footerBrandName}>GeneoRx</Text>
          </View>
          <Text style={styles.footerTagline}>{FOOTER_TAGLINE}</Text>

          <View style={styles.footerCols}>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Product</Text>
              <Pressable onPress={() => scrollToSection('how')}>
                <Text style={styles.footerLink}>How it works</Text>
              </Pressable>
              <Pressable onPress={() => scrollToSection('demo')}>
                <Text style={styles.footerLink}>Demo</Text>
              </Pressable>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Account</Text>
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>Sign in</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('Register')}>
                <Text style={styles.footerLink}>Create account</Text>
              </Pressable>
              <Pressable onPress={() => scrollToSection('faq')}>
                <Text style={styles.footerLink}>FAQ</Text>
              </Pressable>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Company</Text>
              <Pressable onPress={() => Linking.openURL(LEGAL_URLS.contact)}>
                <Text style={styles.footerLink}>Contact</Text>
              </Pressable>
              <Pressable onPress={() => Linking.openURL(LEGAL_URLS.privacy)}>
                <Text style={styles.footerLink}>Privacy Policy</Text>
              </Pressable>
              <Pressable onPress={() => Linking.openURL(LEGAL_URLS.terms)}>
                <Text style={styles.footerLink}>Terms of Service</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.footerBottom}>
            © {new Date().getFullYear()} GeneoRx. Educational guidance only — not medical advice.
          </Text>
          <Text style={styles.footerBottomSub}>Made with care for healthier conversations.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandLogo: { width: 30, height: 30 },
  brandName: { fontSize: 15.5, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  navButtons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkBtn: { paddingHorizontal: 8, paddingVertical: 8 },
  linkBtnText: { fontSize: 13.5, fontWeight: '600', color: colors.textSoft },
  ghostChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  ghostChipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  primaryChip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 7, backgroundColor: colors.primary },
  primaryChipText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },

  heroVisual: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: spacing.md,
  },
  heroBg: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(14,124,102,0.07)',
  },
  heroBgGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(14,124,102,0.10)',
  },
  heroRingOuter: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: 'rgba(14,124,102,0.14)',
  },
  heroRingMid: {
    position: 'absolute',
    width: 155,
    height: 155,
    borderRadius: 78,
    borderWidth: 1,
    borderColor: 'rgba(14,124,102,0.18)',
    borderStyle: 'dashed',
  },
  heroLogoWrap: {
    shadowColor: '#0E7C66',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  heroLogo: { width: 100, height: 100 },

  heroCopy: { alignItems: 'center', marginBottom: spacing.md },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
    paddingLeft: 6,
    borderRadius: 999,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: 20,
    shadowColor: '#0F1F1B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  heroBadgeDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeDotText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  heroBadgeText: { fontSize: 12.5, fontWeight: '600', color: colors.textSoft },

  headline: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
    lineHeight: 40,
    textAlign: 'center',
    marginBottom: 12,
  },
  headlineItalic: { fontStyle: 'italic', fontWeight: '400', color: colors.primaryDark },
  headlineDot: { fontStyle: 'normal', fontWeight: '800', color: colors.text },
  sub: {
    fontSize: 15,
    color: colors.textSoft,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
    marginBottom: 18,
  },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    shadowColor: '#0F1F1B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  chipDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSoft },

  heroActions: { width: '100%', gap: 10, marginTop: 4 },
  guestLink: { paddingVertical: 6, alignItems: 'center' },
  guestLinkText: { fontSize: 14, color: colors.textMuted },
  guestLinkAccent: { color: colors.primaryDark, fontWeight: '700' },

  legal: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },

  sliderHead: { marginBottom: 16 },
  sliderHeadTag: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sliderHeadTitle: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5, lineHeight: 30 },
  sliderHeadItalic: { fontStyle: 'italic', fontWeight: '400', color: colors.primaryDark },

  sliderWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F1F1B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    flexShrink: 0,
  },
  arrowText: { fontSize: 22, color: colors.textSoft, lineHeight: 26, marginTop: -2 },

  card: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    minHeight: 200,
    shadowColor: '#0F1F1B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    position: 'relative',
  },
  cardSummary: {
    backgroundColor: '#053D33',
    borderColor: '#053D33',
    borderLeftColor: colors.primaryLight,
  },
  cardNumBadge: {
    position: 'absolute',
    top: 14,
    right: 16,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  cardNum: { fontSize: 12, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5 },
  cardNumSummary: { color: 'rgba(255,255,255,0.5)' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  iconWrapSummary: { backgroundColor: 'rgba(255,255,255,0.15)' },
  iconEmoji: { fontSize: 22 },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: 10,
    lineHeight: 23,
    paddingRight: 40,
  },
  cardTitleSummary: { color: '#FFFFFF' },
  cardBody: { fontSize: 14, color: colors.textSoft, lineHeight: 21, marginBottom: 4 },
  cardBodySummary: { color: 'rgba(255,255,255,0.80)' },
  cardExtra: { fontSize: 13.5, color: colors.textMuted, lineHeight: 20, marginTop: 10, fontStyle: 'italic' },
  bulletList: { marginTop: 6, gap: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 7,
    flexShrink: 0,
  },
  bulletDotSummary: { backgroundColor: colors.primaryLight },
  bulletText: { flex: 1, fontSize: 14, color: colors.textSoft, lineHeight: 21 },
  bulletTextSummary: { color: 'rgba(255,255,255,0.82)' },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.borderSoft },
  dotActive: { width: 24, borderRadius: 4, backgroundColor: colors.primary },

  sectionBlock: { marginBottom: spacing.xl },
  sectionHead: { marginBottom: spacing.md },
  sectionTag: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sectionTagDark: { color: colors.primaryLight },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 8,
  },
  sectionTitleDark: { color: '#FFFFFF' },
  sectionDesc: { fontSize: 15, color: colors.textSoft, lineHeight: 22 },
  sectionDescDark: { color: 'rgba(255,255,255,0.75)' },
  em: { fontStyle: 'italic', fontWeight: '400', color: colors.primaryDark },
  emLight: { fontStyle: 'italic', fontWeight: '400', color: colors.primaryLight },

  stepsList: { gap: 12 },
  stepCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    shadowColor: '#0F1F1B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  stepNumWrap: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepNum: { fontSize: 17, fontWeight: '800', color: colors.primaryDark, fontStyle: 'italic' },
  stepTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 8, letterSpacing: -0.3 },
  stepBody: { fontSize: 14, color: colors.textSoft, lineHeight: 21 },

  demoCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: 'hidden',
    backgroundColor: colors.background,
    shadowColor: '#0F1F1B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  demoCardHd: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    backgroundColor: colors.backgroundAlt,
  },
  demoCardTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 6, letterSpacing: -0.3 },
  demoCardSub: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  demoCardBd: { padding: spacing.lg },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.textSoft, marginBottom: 8 },
  fieldLabelSpaced: { marginTop: spacing.md },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: 8,
    backgroundColor: colors.background,
  },
  choiceRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary50,
  },
  choiceRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceRadioSelected: { borderColor: colors.primary },
  choiceRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  choiceLabel: { flex: 1, fontSize: 14, color: colors.textSoft, lineHeight: 20 },
  choiceLabelSelected: { color: colors.text, fontWeight: '600' },
  demoSubmit: { marginTop: spacing.sm },
  resultBox: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: 14,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: 12,
  },
  resultTitle: { fontSize: 16, fontWeight: '800', color: colors.primaryDark, marginBottom: 4 },
  resultBlock: { gap: 4 },
  resultBlockLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  resultBlockText: { fontSize: 14, color: colors.textSoft, lineHeight: 21 },
  resultNote: { fontSize: 12.5, color: colors.textMuted, lineHeight: 18, marginTop: 4 },
  resultCta: { gap: 10, marginTop: 4 },
  resultCtaSecondary: {},

  testimonialsSection: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    backgroundColor: '#053D33',
  },
  quoteCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  quoteMark: { fontSize: 36, color: colors.primaryLight, lineHeight: 36, marginBottom: 4, opacity: 0.7 },
  quoteText: { fontSize: 15, color: 'rgba(255,255,255,0.92)', lineHeight: 23, marginBottom: 16 },
  quoteAuthor: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quoteAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteAvatarText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  quoteName: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  quoteRole: { fontSize: 12.5, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  faqList: { gap: 10 },
  faqItem: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  faqSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    gap: 12,
  },
  faqQuestion: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text, lineHeight: 21 },
  faqChevron: { fontSize: 20, fontWeight: '600', color: colors.primaryDark, lineHeight: 22 },
  faqBody: {
    fontSize: 14,
    color: colors.textSoft,
    lineHeight: 21,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },

  bottomCta: {
    backgroundColor: '#0A2E26',
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(63,179,154,0.20)',
    shadowColor: '#0E7C66',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  bottomCtaTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.6,
    lineHeight: 30,
    marginBottom: 10,
  },
  bottomCtaItalic: { fontStyle: 'italic', fontWeight: '400', color: colors.primaryLight },
  bottomCtaSub: {
    fontSize: 14.5,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 18,
  },
  bottomCtaActions: { width: '100%', gap: 10 },

  siteFooter: {
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    gap: spacing.md,
  },
  footerBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  footerLogo: { width: 32, height: 32 },
  footerBrandName: { fontSize: 16, fontWeight: '800', color: colors.text },
  footerTagline: { fontSize: 14, color: colors.textSoft, lineHeight: 21 },
  footerCols: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  footerCol: { minWidth: 100, gap: 8 },
  footerColTitle: { fontSize: 13, fontWeight: '800', color: colors.text, marginBottom: 4 },
  footerLink: { fontSize: 14, color: colors.textSoft, lineHeight: 22 },
  footerBottom: { fontSize: 12, color: colors.textMuted, lineHeight: 18, marginTop: spacing.sm },
  footerBottomSub: { fontSize: 12, color: colors.textDim, lineHeight: 18 },
});
