import React from 'react';
import { Text, View } from 'react-native';
import { Input } from '@/components/Input';
import { useWizard } from '@/store/WizardContext';
import { safetyFlags } from '@/wizard/engine';
import { useTranslation } from '@/hooks/useTranslation';
import { FinePrint, HelpNote, NoteBox, Section, Segmented, Tagline, ToggleRow } from '@/screens/wizard/ui';
import { colors } from '@/theme';

export const AccountStep: React.FC = () => {
  const { state, update } = useWizard();
  const { t } = useTranslation();
  const flags = safetyFlags(state, t);

  return (
    <View style={{ gap: 16 }}>
      <HelpNote what={t('step.0.sub')} why={t('account.safety_flags_hint')} />
      <Section>
        <Tagline title={t('step.0')} body={t('step.0.sub')} />

        <Input
          label={t('account.email')}
          placeholder={t('account.email_placeholder')}
          autoCapitalize="none"
          keyboardType="email-address"
          value={state.account.email}
          onChangeText={(text) => update((d) => { d.account.email = text; })}
        />

        <ToggleRow
          label={t('common.agree')}
          value={state.account.consent}
          onChange={(v) => update((d) => { d.account.consent = v; })}
        />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Input
              label={t('account.age')}
              placeholder={t('account.age_placeholder')}
              keyboardType="number-pad"
              value={state.profile.age}
              onChangeText={(text) => update((d) => { d.profile.age = text.replace(/[^0-9]/g, ''); })}
            />
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{t('account.gender')}</Text>
          <Segmented
            value={state.profile.gender || ''}
            onChange={(v) => update((d) => { d.profile.gender = v; })}
            options={[
              { label: t('gender.female'), value: 'Female' },
              { label: t('gender.male'), value: 'Male' },
              { label: t('gender.non_binary'), value: 'Non-binary' },
            ]}
          />
        </View>

        <View style={{ gap: 2 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{t('account.safety_flags')}</Text>
          <Text style={{ fontSize: 12.5, color: colors.textMuted, lineHeight: 18, marginBottom: 6 }}>
            {t('account.safety_flags_hint')}
          </Text>
          <ToggleRow label={t('account.pregnant')} value={state.profile.pregnant} onChange={(v) => update((d) => { d.profile.pregnant = v; })} />
          <ToggleRow label={t('account.chip.kidney')} value={state.profile.kidneyDisease} onChange={(v) => update((d) => { d.profile.kidneyDisease = v; })} />
          <ToggleRow label={t('account.chip.anticoag')} value={state.profile.anticoagulants} onChange={(v) => update((d) => { d.profile.anticoagulants = v; })} />
        </View>

        {flags.length ? (
          <NoteBox>
            {t('account.banner_title')} {t('account.banner_body', { flags: flags.join(', ') })}
          </NoteBox>
        ) : (
          <FinePrint>{t('account.prototype_note')}</FinePrint>
        )}
      </Section>
    </View>
  );
};
