import React, { useState } from 'react';
import {
  I18nManager,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/store/LanguageContext';
import { useToast } from '@/components/Toast';
import { translate } from '@/content/siteTranslations';
import { colors, radius, shadow, spacing } from '@/theme';
import type { AppLanguage } from '@/content/languages';

type Props = {
  compact?: boolean;
};

function langCode(item: AppLanguage): string {
  return item.code.toUpperCase();
}

const LangCodeBadge: React.FC<{ code: string; active?: boolean; size?: 'sm' | 'md' }> = ({
  code,
  active = false,
  size = 'md',
}) => (
  <View style={[styles.codeBadge, size === 'sm' && styles.codeBadgeSm, active && styles.codeBadgeActive]}>
    <Text style={[styles.codeText, size === 'sm' && styles.codeTextSm, active && styles.codeTextActive]}>
      {code}
    </Text>
  </View>
);

export const LanguageSelector: React.FC<Props> = ({ compact = false }) => {
  const { language, languages, setLanguageCode } = useLanguage();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const rtl = I18nManager.isRTL;

  async function choose(next: AppLanguage) {
    setOpen(false);
    if (next.code === language.code) return;
    await setLanguageCode(next.code);
    show(translate('lang.saved', next.code));
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          compact && styles.triggerCompact,
          rtl && styles.triggerRtl,
          pressed && styles.triggerPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={translate('lang.choose', language.code)}
      >
        <Text style={styles.globe} allowFontScaling={false}>
          🌐
        </Text>
        <LangCodeBadge code={langCode(language)} size="sm" />
        <Text style={[styles.triggerText, compact && styles.triggerTextCompact]} numberOfLines={1}>
          {language.nativeLabel}
        </Text>
        <Text style={[styles.chevron, open && styles.chevronOpen]} allowFontScaling={false}>
          {rtl ? '◂' : '▾'}
        </Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
          >
            <View style={styles.handle} />

            <View style={[styles.sheetHead, rtl && styles.sheetHeadRtl]}>
              <View style={styles.sheetHeadText}>
                <Text style={styles.sheetKicker}>{translate('lang.choose', language.code)}</Text>
                <Text style={styles.sheetTitle}>{translate('lang.all', language.code)}</Text>
                <Text style={styles.sheetSub}>{translate('lang.sub', language.code)}</Text>
              </View>
              <View style={styles.sheetHeadBadge}>
                <Text style={styles.sheetHeadBadgeLabel}>{translate('lang.current', language.code)}</Text>
                <Text style={styles.sheetHeadBadgeValue}>{language.nativeLabel}</Text>
              </View>
            </View>

            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              {languages.map((item) => {
                const selected = item.code === language.code;
                const code = langCode(item);
                return (
                  <Pressable
                    key={item.code}
                    onPress={() => choose(item)}
                    style={({ pressed }) => [
                      styles.option,
                      rtl && styles.optionRtl,
                      selected && styles.optionSelected,
                      pressed && !selected && styles.optionPressed,
                    ]}
                  >
                    <LangCodeBadge code={code} active={selected} />
                    <View style={styles.optionTextWrap}>
                      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                        {item.nativeLabel}
                      </Text>
                      {item.nativeLabel !== item.label ? (
                        <Text style={styles.optionHint}>{item.label}</Text>
                      ) : null}
                    </View>
                    <View style={[styles.radio, selected && styles.radioOn]}>
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.85 }]}
              onPress={() => setOpen(false)}
            >
              <Text style={styles.doneBtnText}>{translate('lang.close', language.code)}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 8,
    paddingRight: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.ghostBg,
    maxWidth: 168,
  },
  triggerCompact: {
    paddingLeft: 7,
    paddingRight: 9,
    maxWidth: 148,
  },
  triggerRtl: {
    flexDirection: 'row-reverse',
  },
  triggerPressed: {
    borderColor: 'rgba(40, 225, 255, 0.35)',
    backgroundColor: 'rgba(40, 225, 255, 0.10)',
  },
  globe: {
    fontSize: 13,
    lineHeight: 16,
  },
  triggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
    flex: 1,
    minWidth: 0,
  },
  triggerTextCompact: {
    fontSize: 11.5,
  },
  chevron: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '800',
    marginTop: 1,
  },
  chevronOpen: {
    color: colors.primaryLight,
  },

  codeBadge: {
    minWidth: 34,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(15, 23, 54, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBadgeSm: {
    minWidth: 30,
    height: 22,
    borderRadius: 6,
  },
  codeBadgeActive: {
    borderColor: 'rgba(40, 225, 255, 0.45)',
    backgroundColor: 'rgba(40, 225, 255, 0.14)',
  },
  codeText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.textSoft,
    letterSpacing: 0.6,
  },
  codeTextSm: {
    fontSize: 9.5,
  },
  codeTextActive: {
    color: colors.primaryLight,
  },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 6, 12, 0.78)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.backgroundAlt,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    maxHeight: '80%',
    ...shadow.raised,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderSoft,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  sheetHeadRtl: {
    flexDirection: 'row-reverse',
  },
  sheetHeadText: {
    flex: 1,
    gap: 4,
  },
  sheetKicker: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.primary,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  sheetSub: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: 2,
  },
  sheetHeadBadge: {
    alignItems: 'flex-end',
    gap: 2,
    paddingTop: 2,
  },
  sheetHeadBadgeLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textDim,
  },
  sheetHeadBadgeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryLight,
  },

  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: 8,
    paddingBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.ghostBg,
  },
  optionRtl: {
    flexDirection: 'row-reverse',
  },
  optionPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: colors.border,
  },
  optionSelected: {
    backgroundColor: 'rgba(40, 225, 255, 0.10)',
    borderColor: 'rgba(40, 225, 255, 0.38)',
  },
  optionTextWrap: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  optionLabelSelected: {
    fontWeight: '800',
    color: colors.primaryLight,
  },
  optionHint: {
    fontSize: 11.5,
    fontWeight: '500',
    color: colors.textMuted,
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.buttonPrimary,
  },

  doneBtn: {
    marginTop: 4,
    paddingVertical: 13,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.buttonBg,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSoft,
  },
});
