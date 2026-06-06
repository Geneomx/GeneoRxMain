import React from 'react';
import { Text, View } from 'react-native';
import { Input } from '@/components/Input';
import { useWizard } from '@/store/WizardContext';
import { safetyFlags } from '@/wizard/engine';
import { FinePrint, HelpNote, NoteBox, Section, Segmented, Tagline, ToggleRow } from '@/screens/wizard/ui';
import { colors } from '@/theme';

export const AccountStep: React.FC = () => {
  const { state, update } = useWizard();
  const flags = safetyFlags(state);

  return (
    <View style={{ gap: 16 }}>
      <HelpNote
        what="Add your age and gender, and flip on any health flags that apply to you. Email and consent are optional."
        why="These details let GeneoRx tailor your results and warn you about cautions that depend on your situation, like pregnancy or kidney disease."
      />
      <Section>
      <Tagline title="Account & safety basics" body="These details personalize your results and trigger safety checks. Educational only." />

      <Input
        label="Email (optional)"
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={state.account.email}
        onChangeText={(t) => update((d) => { d.account.email = t; })}
      />

      <ToggleRow
        label="I consent to GeneoRx using my entries to generate educational insights."
        value={state.account.consent}
        onChange={(v) => update((d) => { d.account.consent = v; })}
      />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Input
            label="Age"
            placeholder="e.g. 42"
            keyboardType="number-pad"
            value={state.profile.age}
            onChangeText={(t) => update((d) => { d.profile.age = t.replace(/[^0-9]/g, ''); })}
          />
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Gender</Text>
        <Segmented
          value={state.profile.gender || ''}
          onChange={(v) => update((d) => { d.profile.gender = v; })}
          options={[
            { label: 'Female', value: 'Female' },
            { label: 'Male', value: 'Male' },
            { label: 'Other', value: 'Other' },
          ]}
        />
      </View>

      <View style={{ gap: 2 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Safety flags</Text>
        <Text style={{ fontSize: 12.5, color: colors.textMuted, lineHeight: 18, marginBottom: 6 }}>
          Health conditions that change which cautions we show you. Turn on any that apply — leaving one
          off means you haven’t told us about it, not that it’s safe to ignore.
        </Text>
        <ToggleRow label="Pregnant / breastfeeding" value={state.profile.pregnant} onChange={(v) => update((d) => { d.profile.pregnant = v; })} />
        <ToggleRow label="Kidney disease" value={state.profile.kidneyDisease} onChange={(v) => update((d) => { d.profile.kidneyDisease = v; })} />
        <ToggleRow label="Anticoagulants / blood thinners" value={state.profile.anticoagulants} onChange={(v) => update((d) => { d.profile.anticoagulants = v; })} />
      </View>

      {flags.length ? (
        <NoteBox>Active safety flags: {flags.join(', ')}. GeneoRx will factor these into interaction and caution checks.</NoteBox>
      ) : (
        <FinePrint>No safety flags disclosed. If any apply to you, turn them on so GeneoRx can flag the right cautions — an unchecked flag is treated as “not disclosed,” not “no risk.”</FinePrint>
      )}
      </Section>
    </View>
  );
};
