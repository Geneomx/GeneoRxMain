import React, { useContext, useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { Button } from '@/components/Button';
import { FormFocusContext } from '@/components/FormScrollView';
import { DropdownSelect } from '@/components/DropdownSelect';
import { useWizard } from '@/store/WizardContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Accordion, Section } from '@/screens/wizard/ui';
import { colors, spacing, touchMin } from '@/theme';
import { isValidOptionalAge, normalizeOptionalAge } from '@/wizard/account';

export const AccountStep: React.FC = () => {
  const { state, update, retrySave, setStep } = useWizard();
  const { t } = useTranslation();
  const revealFocus = useContext(FormFocusContext);
  const ageRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const [ageDraft, setAgeDraft] = useState(state.profile.age);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setAgeDraft(state.profile.age); }, [state.profile.age]);
  const ageValid = isValidOptionalAge(ageDraft);
  const conditionCount = [state.profile.pregnant, state.profile.kidneyDisease, state.profile.anticoagulants].filter(Boolean).length;
  const continueToMedications = async () => {
    if (!ageValid) { Alert.alert(t('mobile.alert.error'), t('parity.age_error')); return; }
    Keyboard.dismiss();
    setSaving(true);
    try { await retrySave(); setStep(1); }
    catch { Alert.alert(t('mobile.profile.save_error_title'), t('mobile.profile.save_error_body')); }
    finally { setSaving(false); }
  };

  return (
    <View style={styles.content}>
      <View style={styles.intro}>
        <Text accessibilityRole="header" style={styles.title}>{t('clean.account_start_title')}</Text>
        <Text style={styles.subtitle}>{t('clean.account_start_sub')}</Text>
      </View>

      <Section style={styles.formGroup}>
        <View style={styles.formRow}>
          <Text style={styles.rowLabel}>{t('account.age')}</Text>
          <TextInput
            ref={ageRef}
            accessibilityLabel={t('account.age')}
            placeholder={t('account.age_placeholder')}
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={3}
            value={ageDraft}
            onFocus={() => revealFocus(ageRef.current)}
            onChangeText={text => {
              const value = text.replace(/[^0-9]/g, '');
              setAgeDraft(value);
              if (isValidOptionalAge(value)) update(draft => { draft.profile.age = normalizeOptionalAge(value); });
            }}
            style={styles.ageInput}
          />
        </View>
        {!ageValid ? <Text style={styles.error} accessibilityRole="alert">{t('parity.age_error')}</Text> : null}
        <View style={[styles.formRow, styles.genderRow]}>
          <Text style={styles.rowLabel}>{t('account.gender')}</Text>
          <View style={styles.genderSelect}>
            <DropdownSelect
              inline
              accessibilityLabel={t('account.gender')}
              placeholder={t('clean.account_choose')}
              value={state.profile.gender || ''}
              onChange={value => update(draft => { draft.profile.gender = value; })}
              options={[
                { label: t('gender.female'), value: 'Female' },
                { label: t('gender.male'), value: 'Male' },
                { label: t('gender.non_binary'), value: 'Non-binary' },
                { label: t('gender.prefer_not'), value: 'Prefer not to say' },
              ]}
            />
          </View>
        </View>
      </Section>

      <Accordion
        title={t('clean.account_health')}
        badge={conditionCount || undefined}
        defaultOpen={conditionCount > 0}
      >
        <CheckRow first label={t('account.pregnant')} checked={state.profile.pregnant} onChange={value => update(draft => { draft.profile.pregnant = value; })} />
        <CheckRow label={t('account.chip.kidney')} checked={state.profile.kidneyDisease} onChange={value => update(draft => { draft.profile.kidneyDisease = value; })} />
        <CheckRow label={t('account.chip.anticoag')} checked={state.profile.anticoagulants} onChange={value => update(draft => { draft.profile.anticoagulants = value; })} />
      </Accordion>

      <Section style={styles.formGroup}>
        <Text style={styles.contactLabel}>{t('account.email')} ({t('design.optional')})</Text>
        <TextInput
          ref={emailRef}
          accessibilityLabel={t('account.email')}
          placeholder={t('account.email_placeholder')}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          value={state.account.email}
          onFocus={() => revealFocus(emailRef.current)}
          onChangeText={text => update(draft => { draft.account.email = text; })}
          style={styles.emailInput}
        />
        <CheckRow label={t('parity.consent')} checked={state.account.consent} onChange={value => update(draft => { draft.account.consent = value; })} />
      </Section>
      <Button title={t('clean.continue_to_meds')} loading={saving} onPress={() => { void continueToMedications(); }} />
    </View>
  );
};

const CheckRow: React.FC<{ label: string; checked: boolean; onChange: (value: boolean) => void; first?: boolean }> = ({ label, checked, onChange, first = false }) => (
  <Pressable
    onPress={() => onChange(!checked)}
    style={[styles.checkRow, first && styles.checkRowFirst]}
    accessibilityRole="checkbox"
    accessibilityLabel={label}
    accessibilityState={{ checked }}
  >
    <Text style={styles.checkLabel}>{label}</Text>
    <View style={[styles.checkbox, checked && styles.checkboxOn]}>
      {checked ? <Text style={styles.checkmark}>✓</Text> : null}
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  intro: { gap: spacing.xs, marginBottom: spacing.xs },
  title: { fontSize: 27, lineHeight: 33, letterSpacing: -0.8, fontWeight: '500', color: colors.text },
  subtitle: { fontSize: 17, lineHeight: 25, color: colors.textMuted },
  formRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  genderRow: { borderBottomWidth: 0 },
  formGroup: { padding: spacing.md, gap: 0 },
  rowLabel: { flexShrink: 1, fontSize: 17, color: colors.text },
  ageInput: { flex: 1, minHeight: touchMin, textAlign: 'right', fontSize: 17, color: colors.text, paddingHorizontal: spacing.sm },
  genderSelect: { flex: 1, maxWidth: 190 },
  contactLabel: { fontSize: 16, fontWeight: '500', color: colors.textMuted, marginBottom: spacing.sm },
  emailInput: { minHeight: touchMin, borderBottomWidth: 1, borderColor: colors.controlBorder, backgroundColor: colors.surface, paddingHorizontal: 0, fontSize: 17, color: colors.text },
  error: { color: colors.danger, fontSize: 16, lineHeight: 23, paddingVertical: 8 },
  checkRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  checkRowFirst: { borderTopWidth: 0 },
  checkLabel: { flex: 1, fontSize: 17, color: colors.text },
  checkbox: { width: 21, height: 21, borderRadius: 5, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { fontSize: 17, lineHeight: 21, fontWeight: '500', color: colors.onPrimary },
});
