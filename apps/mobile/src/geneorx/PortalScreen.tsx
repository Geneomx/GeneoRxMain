import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { baseUrl } from '../api';
import { registerForCheckinReminders } from '../push';
import { useGeneo } from './GeneoContext';
import {
  addMedicationRow,
  addOrMergeCustomMed,
  aggregateEvidenceByNutrient,
  buildClinicianSnapshotText,
  citationToLink,
  buildRoutineFromSupplements,
  claimsForSelectedMeds,
  computeContraindications,
  computeDrugInteractions,
  computeInsightEngine,
  computeMedicationSuccessPrediction,
  computeNutrientScores,
  computePopulationInsights,
  computeWeeklyCoachMessage,
  detectHealthPatterns,
  evidenceCoverage,
  evidencePanelContent,
  fmtDate,
  generateDynamicHealthStory,
  getMedicationName,
  getSortedMedsList,
  getSymptomUniverse,
  latestCheckin,
  levelClass,
  mergeCustomSymptom,
  recommendSupplements,
  removeMedicationAt,
  safetyFlags,
  summarizeSourceQuality,
  tierFromScore,
} from './engine';
import { impactValue, IMPACT, STEP_LABELS, type CheckinItem, type GeneoState, type SymptomChange } from './types';

const C = {
  bg0: '#070A12',
  bg: '#0B1022',
  card: 'rgba(15,23,54,0.86)',
  card2: '#101B40',
  line: 'rgba(255,255,255,0.12)',
  txt: '#EAF0FF',
  mut: '#A9B4D6',
  muted2: '#7E8AB8',
  cyan: '#28E1FF',
  amber: '#fbbf24',
  rose: '#fb7185',
  green: '#34d399',
  violet: '#a78bfa',
  pink: '#ff4fd8',
};

const SUB: Record<string, string> = {
  Account: 'Confirm your profile basics and safety flags.',
  Medications: 'Add the medications you want GeneoRx to review.',
  Symptoms: 'Select what you are feeling now.',
  Wellbeing: 'Set a simple baseline for progress tracking.',
  Insights: 'Review possible medication, symptom, and nutrient links.',
  'Check-in': 'Log weekly changes so GeneoRx can spot trends.',
  Progress: 'See your Health Signal over time.',
  Sources: 'Review the evidence referenced in this session.',
  'Doctor summary': 'Prepare a clear summary for your clinician.',
  Feedback: 'Send questions and feedback to GeneoRx.',
};

const JOURNEY_GROUPS = [
  { title: 'Setup', subtitle: 'Tell GeneoRx what to review', steps: [0, 1, 2, 3] },
  { title: 'Insights', subtitle: 'Understand possible patterns', steps: [4] },
  { title: 'Routine', subtitle: 'Start and track weekly actions', steps: [5, 6] },
  { title: 'Share', subtitle: 'Prepare evidence and doctor notes', steps: [8] },
  { title: 'Account', subtitle: 'Settings and support', steps: [9] },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Chip({
  label,
  on,
  onPress,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[s.chip, on && s.chipOn]}>
      <Text style={[s.chipTxt, on && s.chipTxtOn]}>{label}</Text>
    </Pressable>
  );
}

export function PortalScreen({ onLogout, userName }: { onLogout: () => void; userName: string }) {
  const insets = useSafeAreaInsets();
  const g = useGeneo();
  const { state, setState, showToast, displayEmail, setDisplayEmail, ready, resetLocal } = g;

  const [medSearch, setMedSearch] = useState('');
  const [pickMed, setPickMed] = useState<string | null>(null);
  const [dose, setDose] = useState<'low' | 'medium' | 'high'>('medium');
  const [dur, setDur] = useState('12');
  const [customName, setCustomName] = useState('');
  const [newSym, setNewSym] = useState('');

  const [snapOpen, setSnapOpen] = useState(false);
  const [insightOpen, setInsightOpen] = useState(false);
  const [reveal, setReveal] = useState(false);

  // Check-in form (step 5)
  const [ciDate, setCiDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [ciAdh, setCiAdh] = useState('70');
  const [taken, setTaken] = useState<string[]>([]);
  const [ciE, setCiE] = useState('5');
  const [ciM, setCiM] = useState('5');
  const [ciS, setCiS] = useState('5');
  const [ciF, setCiF] = useState('5');
  const [ciSide, setCiSide] = useState('');
  const [ciNotes, setCiNotes] = useState('');
  const [symEdits, setSymEdits] = useState<Record<string, { ch: SymptomChange; sev: string }>>({});

  const symBase = useMemo(() => {
    const u = getSymptomUniverse(state);
    const b = state.symptoms.selected.length ? state.symptoms.selected : u;
    return b.slice(0, 10);
  }, [state]);

  useEffect(() => {
    if (state.step !== 5) return;
    const last = latestCheckin(state);
    if (last) {
      setCiAdh(String(last.adherencePct));
      setCiE(String(last.wellbeing.energy));
      setCiM(String(last.wellbeing.mood));
      setCiS(String(last.wellbeing.sleep));
      setCiF(String(last.wellbeing.focus));
      if (state.plan.recommendedSupplements.length) {
        setTaken([...state.plan.recommendedSupplements]);
      }
    } else {
      setCiAdh('70');
      setCiE(String(state.wellbeingBaseline.energy));
      setCiM(String(state.wellbeingBaseline.mood));
      setCiS(String(state.wellbeingBaseline.sleep));
      setCiF(String(state.wellbeingBaseline.focus));
      setTaken([]);
    }
    setCiDate(new Date().toISOString().slice(0, 10));
    setSymEdits({});
  }, [state.step, state.checkins.length, state.wellbeingBaseline, state.plan.recommendedSupplements, state.symptoms.selected]);

  const setStep = (n: number) => setState((p) => ({ ...p, step: Math.max(0, Math.min(STEP_LABELS.length - 1, n)) }));

  const medFiltered = useMemo(() => {
    const f = medSearch.trim().toLowerCase();
    return getSortedMedsList().filter((m) => !f || m.name.toLowerCase().includes(f) || m.id.toLowerCase().includes(f));
  }, [medSearch, state.customMedCatalog]);

  const openInsightWithReveal = () => {
    setReveal(true);
    setTimeout(() => {
      setReveal(false);
      setInsightOpen(true);
    }, 1600);
  };

  const copySnapshot = async () => {
    const t = buildClinicianSnapshotText(state, state.account.email || displayEmail);
    await Clipboard.setStringAsync(t);
    showToast('Copied ✓');
  };

  const shareSnapshot = async () => {
    const t = buildClinicianSnapshotText(state, state.account.email || displayEmail);
    await Share.share({ message: t, title: 'GeneoRx Snapshot' });
  };

  const exportPacket = async () => {
    const json = JSON.stringify(
      { meta: { createdISO: new Date().toISOString() }, state },
      null,
      2,
    );
    const base = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
    const path = `${base}geneorx_doctor_summary.json`;
    await FileSystem.writeAsStringAsync(path, json);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, { dialogTitle: 'Export GeneoRx doctor summary', mimeType: 'application/json' });
    } else {
      showToast('Sharing not available');
    }
  };

  const exportDoctorHtml = async () => {
    const t = buildClinicianSnapshotText(state, state.account.email || displayEmail);
    const safe = t.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>GeneoRx</title></head><body><pre style="font-family:monospace;white-space:pre-wrap;padding:16px;">${safe}</pre></body></html>`;
    const base = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
    const path = `${base}geneorx_doctor_report.html`;
    await FileSystem.writeAsStringAsync(path, html);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, { dialogTitle: 'Doctor report' });
    }
  };

  const onFeedbackSend = (type: string, can: boolean, message: string) => {
    const subj = encodeURIComponent(`GeneoRx Mobile Feedback (${type})`);
    const body = encodeURIComponent(
      `Type: ${type}\nFrom: ${state.account.email}\nCan contact: ${can ? 'Yes' : 'No'}\n\n${message}\n`,
    );
    setState((p) => ({
      ...p,
      feedback: [
        ...p.feedback,
        { dateISO: new Date().toISOString(), type, message, canContact: can, email: state.account.email || 'anonymous' },
      ],
    }));
    showToast('Opening email…');
    void Linking.openURL(`mailto:info@geneorx.com?subject=${subj}&body=${body}`);
  };

  if (!ready) {
    return (
      <View style={[s.load, { paddingTop: insets.top }]}>
        <ActivityIndicator color={C.cyan} size="large" />
        <Text style={{ color: C.mut, marginTop: 12 }}>Loading your profile…</Text>
      </View>
    );
  }

  const stepLabel = STEP_LABELS[state.step];

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 8 }]}>
      <View pointerEvents="none" style={s.glowCyan} />
      <View pointerEvents="none" style={s.glowViolet} />
      <View pointerEvents="none" style={s.glowPink} />
      <View style={s.topbar}>
        <View style={s.brand}>
          <View style={s.brandmark}>
            <Text style={s.brandmarkText}>Gx</Text>
          </View>
          <View style={s.brandCopy}>
            <Text style={s.h1}>GeneoRx</Text>
            <Text style={s.subh}>Why Do I Feel This Way?</Text>
          </View>
        </View>
        <View style={s.pillsRow}>
          <Text style={s.statusPill}>User: {userName || displayEmail || ' '}</Text>
          <Text style={s.statusPill}>Routine: {state.plan.started ? fmtDate(state.plan.startDate) : 'Not started'}</Text>
          <Text style={s.statusPill}>Check-ins: {state.checkins.length}</Text>
          <Pressable style={s.btnGhost} onPress={exportPacket}>
            <Text style={s.btnGhostTxt}>Doctor summary</Text>
          </Pressable>
          <Pressable style={s.btnGhost} onPress={resetLocal}>
            <Text style={s.btnGhostTxt}>Reset</Text>
          </Pressable>
          <Pressable style={s.btnOut} onPress={onLogout}>
            <Text style={s.btnOutTxt}>Log out</Text>
          </Pressable>
        </View>
      </View>

      <View style={s.heroCard}>
        <Text style={s.eyebrow}>Guided review</Text>
        <Text style={s.heroSub}>Add medications and symptoms, then review insights, routine, progress, and doctor summary.</Text>
      </View>

      <View style={s.journeyContent}>
        {JOURNEY_GROUPS.map((group) => {
          const active = group.steps.includes(state.step);
          return (
            <Pressable key={group.title} onPress={() => setStep(group.steps[0])} style={[s.journeyGroup, active && s.journeyGroupOn]}>
              <Text style={[s.journeyTitle, active && s.journeyTitleOn]}>{group.title}</Text>
              <Text style={[s.journeyCount, active && s.journeyCountOn]}>{group.steps.length} step{group.steps.length > 1 ? 's' : ''}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={s.stepTray}>
        {JOURNEY_GROUPS.find((g2) => g2.steps.includes(state.step))?.steps.map((idx) => (
          <Pressable
            key={STEP_LABELS[idx]}
            onPress={() => setStep(idx)}
            style={[s.stepDot, idx === state.step && s.stepDotOn, idx === state.step && tabTone(idx)]}
          >
            <Text style={[s.stepDotText, idx === state.step && s.stepDotTextOn]}>{STEP_LABELS[idx]}</Text>
          </Pressable>
        ))}
      </View>

      <View style={s.currentStepCard}>
        <Text style={s.progressText}>
          Step {state.step + 1} of {STEP_LABELS.length} · Next best action: {nextBestActionLabel(state)}
        </Text>
        <Text style={s.mainTitle}>{stepLabel}</Text>
        <Text style={s.mainSub}>{SUB[stepLabel] || ''}</Text>
        <View style={s.chipRow}>
          <Text style={s.statusPill}>Subscription: {state.subscription.isPlus ? 'Plus' : 'Free'}</Text>
          <Text style={s.statusPill}>Routine: {state.plan.started ? 'Started' : 'Not started'}</Text>
          <Text style={s.statusPill}>Reminders: {state.reminderPreferences.enabled ? 'On' : 'Off'}</Text>
          <Text style={s.statusPill}>Check-ins: {state.checkins.length}</Text>
        </View>
        {!state.subscription.isPlus ? (
          <Pressable style={s.inlineUpgrade} onPress={() => openBilling()}>
            <Text style={s.inlineUpgradeText}>Upgrade to Plus for unlimited tracking</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView style={s.content} contentContainerStyle={{ paddingBottom: 32 }}>
        {state.step === 0 && (
          <AccountView
            state={state}
            setState={setState}
            setDisplayEmail={setDisplayEmail}
            showToast={showToast}
            setStep={setStep}
            displayEmail={displayEmail}
          />
        )}
        {state.step === 1 && (
          <MedsView
            state={state}
            setState={setState}
            showToast={showToast}
            medSearch={medSearch}
            setMedSearch={setMedSearch}
            medFiltered={medFiltered}
            pickMed={pickMed}
            setPickMed={setPickMed}
            dose={dose}
            setDose={setDose}
            dur={dur}
            setDur={setDur}
            customName={customName}
            setCustomName={setCustomName}
            setStep={setStep}
          />
        )}
        {state.step === 2 && (
          <SymptomsView state={state} setState={setState} newSym={newSym} setNewSym={setNewSym} showToast={showToast} setStep={setStep} />
        )}
        {state.step === 3 && <WellbeingView state={state} setState={setState} showToast={showToast} setStep={setStep} />}
        {state.step === 4 && (
          <ResultsView
            state={state}
            setState={setState}
            showToast={showToast}
            setStep={setStep}
            openSnap={() => setSnapOpen(true)}
            openInsight={openInsightWithReveal}
          />
        )}
        {state.step === 5 && (
          <CheckinView
            state={state}
            setState={setState}
            symBase={symBase}
            showToast={showToast}
            setStep={setStep}
            ciDate={ciDate}
            setCiDate={setCiDate}
            ciAdh={ciAdh}
            setCiAdh={setCiAdh}
            taken={taken}
            setTaken={setTaken}
            ciE={ciE}
            setCiE={setCiE}
            ciM={ciM}
            setCiM={setCiM}
            ciS={ciS}
            setCiS={setCiS}
            ciF={ciF}
            setCiF={setCiF}
            ciSide={ciSide}
            setCiSide={setCiSide}
            ciNotes={ciNotes}
            setCiNotes={setCiNotes}
            symEdits={symEdits}
            setSymEdits={setSymEdits}
          />
        )}
        {state.step === 6 && (
          <ProgressView
            state={state}
            setStep={setStep}
            onSnap={() => setSnapOpen(true)}
            onExport={exportDoctorHtml}
            showToast={showToast}
          />
        )}
        {state.step === 8 && <SummaryView state={state} onSnap={() => setSnapOpen(true)} onInsight={openInsightWithReveal} userName={userName} />}
        {state.step === 9 && <FeedbackView onSend={onFeedbackSend} />}
      </ScrollView>

      {g.toast ? (
        <View style={s.toastW}>
          <Text style={s.toastT}>{g.toast}</Text>
        </View>
      ) : null}

      <Modal visible={snapOpen} animationType="slide" transparent>
        <View style={s.modalBg}>
          <View style={s.modalBox}>
            <Text style={s.h1}>Doctor visit snapshot</Text>
            <ScrollView style={{ maxHeight: 420 }}>
              <Text selectable style={s.mono}>
                {buildClinicianSnapshotText(state, state.account.email || displayEmail)}
              </Text>
            </ScrollView>
            <View style={s.row}>
              <Pressable style={s.primary} onPress={copySnapshot}>
                <Text style={s.primaryTx}>Copy</Text>
              </Pressable>
              <Pressable style={s.primary} onPress={shareSnapshot}>
                <Text style={s.primaryTx}>Share</Text>
              </Pressable>
              <Pressable style={s.ghost} onPress={() => setSnapOpen(false)}>
                <Text style={s.ghostTx}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={reveal} transparent animationType="fade">
        <View style={s.reveal}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: '#fff', marginTop: 12 }}>Building your insight…</Text>
        </View>
      </Modal>

      <Modal visible={insightOpen} animationType="slide" transparent>
        <InsightModalContent state={state} onClose={() => setInsightOpen(false)} showToast={showToast} />
      </Modal>
    </View>
  );
}

function tabTone(i: number) {
  const tones = [
    { backgroundColor: 'rgba(40,225,255,0.88)', borderColor: 'rgba(40,225,255,0.95)' },
    { backgroundColor: 'rgba(251,191,36,0.88)', borderColor: 'rgba(251,191,36,0.95)' },
    { backgroundColor: 'rgba(52,211,153,0.88)', borderColor: 'rgba(52,211,153,0.95)' },
    { backgroundColor: 'rgba(167,139,250,0.88)', borderColor: 'rgba(167,139,250,0.95)' },
    { backgroundColor: 'rgba(255,79,216,0.88)', borderColor: 'rgba(255,79,216,0.95)' },
    { backgroundColor: 'rgba(148,163,184,0.88)', borderColor: 'rgba(148,163,184,0.95)' },
    { backgroundColor: 'rgba(251,113,133,0.88)', borderColor: 'rgba(251,113,133,0.95)' },
    { backgroundColor: 'rgba(59,130,246,0.88)', borderColor: 'rgba(59,130,246,0.95)' },
    { backgroundColor: 'rgba(16,185,129,0.88)', borderColor: 'rgba(16,185,129,0.95)' },
    { backgroundColor: 'rgba(244,114,182,0.88)', borderColor: 'rgba(244,114,182,0.95)' },
  ];
  return tones[i % tones.length];
}

function nextBestActionLabel(state: GeneoState): string {
  if (state.meds.length === 0 && !state.symptomOnlyMode) return 'Add medications';
  if (state.symptoms.selected.length === 0) return 'Select symptoms';
  if (!state.plan.started && state.step < 4) return 'Review insights';
  if (!state.plan.started) return 'Start your routine';
  if (state.checkins.length === 0) return 'Log first check-in';
  return 'Review progress';
}

function openBilling(feature?: string) {
  const suffix = feature ? `?feature=${encodeURIComponent(feature)}` : '';
  void Linking.openURL(`${baseUrl()}/billing${suffix}`);
}

function InsightModalContent({
  state,
  onClose,
  showToast,
}: {
  state: GeneoState;
  onClose: () => void;
  showToast: (m: string) => void;
}) {
  const insight = computeInsightEngine(state);
  const line = `What GeneoRx sees: ${insight.summary}\n\n${insight.meaning}\n\nDiscuss: ${insight.doctorPrompt}`;
  return (
    <View style={s.modalBg}>
      <View style={s.modalBox}>
        <Text style={s.h1}>GeneoRx Insight</Text>
        <ScrollView style={{ maxHeight: 400 }}>
          <Text style={s.lab}>What GeneoRx sees</Text>
          <Text style={s.p}>{insight.summary}</Text>
          <Text style={s.lab}>What this may mean</Text>
          <Text style={s.mut}>{insight.meaning}</Text>
          <Text style={s.lab}>What to discuss with your doctor</Text>
          <Text style={[s.p, { marginTop: 10 }]}>{insight.doctorPrompt}</Text>
          <Text style={s.lab}>Why GeneoRx generated this insight</Text>
          <Text style={s.mut}>Based on medications, symptoms, check-ins, safety flags, and nutrient-signal evidence available in your profile.</Text>
        </ScrollView>
        <Pressable
          style={s.primary}
          onPress={async () => {
            await Clipboard.setStringAsync(`GeneoRx Insight\n\n${line}`);
            showToast('Copied ✓');
          }}
        >
          <Text style={s.primaryTx}>Copy all</Text>
        </Pressable>
        <Pressable style={s.ghost} onPress={onClose}>
          <Text style={s.ghostTx}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---- Step subviews (inline) ----

function AccountView({
  state,
  setState,
  setDisplayEmail,
  showToast,
  setStep,
  displayEmail,
}: {
  state: GeneoState;
  setState: React.Dispatch<React.SetStateAction<GeneoState>>;
  setDisplayEmail: (e: string) => void;
  showToast: (m: string) => void;
  setStep: (n: number) => void;
  displayEmail: string;
}) {
  const flags = safetyFlags(state);
  return (
    <View>
      <Section title="Account">
        <Text style={s.mut}>Set basics, consent, and safety flags. Your data is saved to your account and this device.</Text>
        <Text style={s.lab}>Email</Text>
        <TextInput
          style={s.inp}
          value={state.account.email}
          onChangeText={(t) => {
            setState((p) => ({ ...p, account: { ...p.account, email: t } }));
            setDisplayEmail(t);
          }}
          placeholder="name@email.com"
          placeholderTextColor={C.mut}
        />
        <Text style={s.lab}>Consent</Text>
        <View style={s.row}>
          {(['no', 'yes'] as const).map((v) => (
            <Pressable
              key={v}
              style={[s.pill, state.account.consent === (v === 'yes') && s.pillOn]}
              onPress={() => setState((p) => ({ ...p, account: { ...p.account, consent: v === 'yes' } }))}
            >
              <Text style={v === 'yes' && state.account.consent ? s.tabTxOn : s.tabTx}>{v === 'yes' ? 'I agree' : 'Not yet'}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.lab}>Age</Text>
        <TextInput
          style={s.inp}
          value={String(state.profile.age)}
          onChangeText={(t) => setState((p) => ({ ...p, profile: { ...p.profile, age: t } }))}
          keyboardType="number-pad"
          placeholder="e.g. 42"
          placeholderTextColor={C.mut}
        />
        <Text style={s.lab}>Gender</Text>
        {(['', 'Female', 'Male', 'Non-binary', 'Prefer not to say'] as const).map((g) => (
          <Pressable
            key={g || 'x'}
            style={[s.opt, state.profile.gender === g && s.optOn]}
            onPress={() => setState((p) => ({ ...p, profile: { ...p.profile, gender: g } }))}
          >
            <Text style={s.optTx}>{g || 'Select…'}</Text>
          </Pressable>
        ))}
        <Text style={s.lab}>Pregnant / breastfeeding</Text>
        <View style={s.row}>
          {(['no', 'yes'] as const).map((v) => (
            <Pressable
              key={v}
              style={[s.pill, state.profile.pregnant === (v === 'yes') && s.pillOn]}
              onPress={() => setState((p) => ({ ...p, profile: { ...p.profile, pregnant: v === 'yes' } }))}
            >
              <Text style={s.tabTx}>{v === 'yes' ? 'Yes' : 'No'}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.lab}>Phone number (optional - for SMS check-in reminders)</Text>
        <TextInput
          style={s.inp}
          value={state.profile.phone || ''}
          onChangeText={(t) => setState((p) => ({ ...p, profile: { ...p.profile, phone: t } }))}
          keyboardType="phone-pad"
          placeholder="+1 555 000 0000"
          placeholderTextColor={C.mut}
        />
        <Text style={s.lab}>Safety</Text>
        <View style={s.chipRow}>
          <Chip
            label="Kidney disease"
            on={state.profile.kidneyDisease}
            onPress={() =>
              setState((p) => ({ ...p, profile: { ...p.profile, kidneyDisease: !p.profile.kidneyDisease } }))
            }
          />
          <Chip
            label="Anticoagulants"
            on={state.profile.anticoagulants}
            onPress={() =>
              setState((p) => ({ ...p, profile: { ...p.profile, anticoagulants: !p.profile.anticoagulants } }))
            }
          />
        </View>
        {flags.length > 0 ? (
          <View style={s.banner}>
            <Text style={s.bannerTx}>Safety note: {flags.join(', ')}. Educational only confirm with a clinician.</Text>
          </View>
        ) : null}
        <Text style={s.mutSm}>Account on device: {displayEmail}</Text>
      </Section>
      <Pressable style={s.primary} onPress={() => setStep(1)}>
        <Text style={s.primaryTx}>Continue</Text>
      </Pressable>
    </View>
  );
}

function MedsView({
  state,
  setState,
  showToast,
  medSearch,
  setMedSearch,
  medFiltered,
  pickMed,
  setPickMed,
  dose,
  setDose,
  dur,
  setDur,
  customName,
  setCustomName,
  setStep,
}: {
  state: GeneoState;
  setState: React.Dispatch<React.SetStateAction<GeneoState>>;
  showToast: (m: string) => void;
  medSearch: string;
  setMedSearch: (t: string) => void;
  medFiltered: { id: string; name: string }[];
  pickMed: string | null;
  setPickMed: (id: string | null) => void;
  dose: 'low' | 'medium' | 'high';
  setDose: (d: 'low' | 'medium' | 'high') => void;
  dur: string;
  setDur: (t: string) => void;
  customName: string;
  setCustomName: (t: string) => void;
  setStep: (n: number) => void;
}) {
  const cov = evidenceCoverage(state);
  return (
    <View>
      <Section title="Medications">
        <Text style={s.mut}>
          Pick from common medications, or search and add your own if it is not listed.
        </Text>
        <Text style={s.mut}>
          Evidence coverage: {cov.evidenceCount}/{cov.selectedCount} meds with mapped citations
        </Text>
        <Text style={s.lab}>Search</Text>
        <TextInput style={s.inp} value={medSearch} onChangeText={setMedSearch} placeholder="Filter…" placeholderTextColor={C.mut} />
        <Text style={s.lab}>Select medication</Text>
        <ScrollView style={s.picker} nestedScrollEnabled>
          {medFiltered.map((m) => (
            <Pressable
              key={m.id}
              style={[s.opt, pickMed === m.id && s.optOn]}
              onPress={() => setPickMed(m.id)}
            >
              <Text style={s.optTx}>{m.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={s.lab}>Dose</Text>
        <View style={s.row}>
          {(['low', 'medium', 'high'] as const).map((d) => (
            <Pressable key={d} style={[s.pill, dose === d && s.pillOn]} onPress={() => setDose(d)}>
              <Text style={dose === d ? s.tabTxOn : s.tabTx}>{d}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.lab}>Duration (months)</Text>
        <TextInput
          style={s.inp}
          value={dur}
          onChangeText={setDur}
          keyboardType="number-pad"
          placeholder="12"
          placeholderTextColor={C.mut}
        />
        <Pressable
          style={s.primary}
          onPress={() => {
            if (!pickMed) {
              showToast('Pick a medication first');
              return;
            }
            const mo = Math.max(0, Math.min(360, parseInt(dur || '0', 10) || 0));
            setState((p) => addMedicationRow(p, pickMed, dose, mo));
            showToast('Added ✓');
          }}
        >
          <Text style={s.primaryTx}>Add medication</Text>
        </Pressable>
        <Text style={s.lab}>Custom med name</Text>
        <TextInput
          style={s.inp}
          value={customName}
          onChangeText={setCustomName}
          placeholder="e.g. Spironolactone"
          placeholderTextColor={C.mut}
        />
        <Pressable
          style={s.ghost}
          onPress={() => {
            if (!customName.trim()) {
              showToast('Type a name');
              return;
            }
            const mo = Math.max(0, Math.min(360, parseInt(dur || '0', 10) || 0));
            setState((p) => addOrMergeCustomMed(p, customName.trim(), dose, mo));
            setCustomName('');
            showToast('Custom added ✓');
          }}
        >
          <Text style={s.ghostTx}>Add custom + list</Text>
        </Pressable>
        <Pressable
          style={s.ghost}
          onPress={() => {
            setState((p) => ({ ...p, meds: [], symptomOnlyMode: true }));
            showToast('Symptom-only mode');
          }}
        >
          <Text style={s.ghostTx}>I do not take any medications</Text>
        </Pressable>
      </Section>
      <Section title="Your list">
        {state.meds.length === 0 ? (
          <Text style={s.mut}>Add your first medication so GeneoRx can look for nutrient signals. If you do not take medications, use symptom-only mode.</Text>
        ) : (
          state.meds.map((m, idx) => {
            const name = getMedicationName(m.medId);
            return (
              <View key={`${m.medId}-${idx}`} style={s.item}>
                <Text style={s.p}>{name}</Text>
                <Text style={s.mut}>
                  Dose {m.dose} · {m.durationMonths} mo
                </Text>
                <Pressable
                  onPress={() => {
                    setState((p) => removeMedicationAt(p, idx));
                    showToast('Removed');
                  }}
                >
                  <Text style={s.danger}>Remove</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </Section>
      <Pressable style={s.primary} onPress={() => setStep(2)}>
        <Text style={s.primaryTx}>Continue</Text>
      </Pressable>
    </View>
  );
}

function SymptomsView({
  state,
  setState,
  newSym,
  setNewSym,
  showToast,
  setStep,
}: {
  state: GeneoState;
  setState: React.Dispatch<React.SetStateAction<GeneoState>>;
  newSym: string;
  setNewSym: (t: string) => void;
  showToast: (m: string) => void;
  setStep: (n: number) => void;
}) {
  const universe = getSymptomUniverse(state);
  return (
    <View>
      <Section title="Symptoms">
        <View style={s.chipRow}>
          {universe.map((sym) => {
            const on = state.symptoms.selected.includes(sym);
            return (
              <Chip
                key={sym}
                label={sym}
                on={on}
                onPress={() => {
                  setState((p) => {
                    const sel = p.symptoms.selected.includes(sym)
                      ? p.symptoms.selected.filter((x) => x !== sym)
                      : [...p.symptoms.selected, sym];
                    return { ...p, symptoms: { ...p.symptoms, selected: sel } };
                  });
                  showToast('Saved');
                }}
              />
            );
          })}
        </View>
        <View style={s.row}>
          <Text style={s.lab}>Add custom</Text>
          <TextInput
            style={[s.inp, { flex: 1 }]}
            value={newSym}
            onChangeText={setNewSym}
            placeholder="Your symptom"
            placeholderTextColor={C.mut}
          />
        </View>
        <Pressable
          style={s.ghost}
          onPress={() => {
            if (!newSym.trim()) return;
            setState((p) => mergeCustomSymptom(p, newSym.trim()));
            setNewSym('');
            showToast('Added');
          }}
        >
          <Text style={s.ghostTx}>Add symptom</Text>
        </Pressable>
        <Text style={s.lab}>Severity</Text>
        <View style={s.row}>
          {(['mild', 'moderate', 'severe'] as const).map((sev) => (
            <Pressable
              key={sev}
              style={[s.pill, state.symptoms.severity === sev && s.pillOn]}
              onPress={() => setState((p) => ({ ...p, symptoms: { ...p.symptoms, severity: sev } }))}
            >
              <Text style={state.symptoms.severity === sev ? s.tabTxOn : s.tabTx}>{sev}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={s.ghost}
          onPress={() => setState((p) => ({ ...p, symptoms: { ...p.symptoms, selected: [] } }))}
        >
          <Text style={s.ghostTx}>Clear all</Text>
        </Pressable>
      </Section>
      <Pressable style={s.primary} onPress={() => setStep(3)}>
        <Text style={s.primaryTx}>Continue</Text>
      </Pressable>
    </View>
  );
}

function WellbeingView({
  state,
  setState,
  showToast,
  setStep,
}: {
  state: GeneoState;
  setState: React.Dispatch<React.SetStateAction<GeneoState>>;
  showToast: (m: string) => void;
  setStep: (n: number) => void;
}) {
  const b = state.wellbeingBaseline;
  const setB = (k: keyof typeof b, v: string) => {
    const n = Math.max(0, Math.min(10, parseInt(v || '0', 10) || 0));
    setState((p) => ({ ...p, wellbeingBaseline: { ...p.wellbeingBaseline, [k]: n } }));
  };
  return (
    <View>
      <Section title="Baseline wellbeing (0–10)">
        {(['energy', 'mood', 'sleep', 'focus'] as const).map((k) => (
          <View key={k}>
            <Text style={s.lab}>{k}</Text>
            <TextInput
              style={s.inp}
              value={String(b[k])}
              onChangeText={(t) => setB(k, t)}
              keyboardType="number-pad"
            />
          </View>
        ))}
        <Pressable
          style={s.primary}
          onPress={() => {
            showToast('Baseline saved');
            setStep(4);
          }}
        >
          <Text style={s.primaryTx}>Continue</Text>
        </Pressable>
      </Section>
    </View>
  );
}

function ResultsView({
  state,
  setState,
  showToast,
  setStep,
  openSnap,
  openInsight,
}: {
  state: GeneoState;
  setState: React.Dispatch<React.SetStateAction<GeneoState>>;
  showToast: (m: string) => void;
  setStep: (n: number) => void;
  openSnap: () => void;
  openInsight: () => void;
}) {
  const coach = computeWeeklyCoachMessage(state);
  const scores = computeNutrientScores(state);
  const rec = recommendSupplements(scores);
  const claims = claimsForSelectedMeds(state);
  const evBy = aggregateEvidenceByNutrient(claims);
  const cov = evidenceCoverage(state);
  const flags = safetyFlags(state);
  const interactions = computeDrugInteractions(state);
  const contras = computeContraindications(state);
  const success = computeMedicationSuccessPrediction(state);
  const pop = computePopulationInsights(state);
  const patterns = detectHealthPatterns(state);
  const suppForRoutine =
    state.plan.recommendedSupplements.length > 0 ? state.plan.recommendedSupplements : rec.map((r) => r.supplement);
  const routine = buildRoutineFromSupplements(suppForRoutine);
  const [startDate, setStartDate] = useState(
    state.plan.startDate ? state.plan.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
  );
  const [openEv, setOpenEv] = useState<Record<string, boolean>>({});
  const [reminderSaving, setReminderSaving] = useState(false);

  return (
    <View>
      <Section title="AI Coach">
        <Text style={s.p}>{coach.headline}</Text>
        {coach.bullets.map((b) => (
          <Text key={b} style={s.mut}>
            • {b}
          </Text>
        ))}
        <Text style={[s.p, { marginTop: 8 }]}>Next: {coach.nextBestAction}</Text>
      </Section>
      <Section title="Your results">
        <Text style={s.mut}>
          Evidence coverage: {cov.evidenceCount}/{cov.selectedCount}
        </Text>
        {flags.length > 0 ? (
          <View style={s.banner}>
            <Text style={s.bannerTx}>Safety: {flags.join(', ')}</Text>
          </View>
        ) : null}
        <Text style={s.lab}>Success prediction: {success.score}% ({success.level})</Text>
        <Text style={s.mut}>{success.reason}</Text>
      </Section>
      <Section title="Interactions & cautions">
        {interactions.length === 0 && contras.length === 0 ? (
          <Text style={s.mut}>No alerts for current entries.</Text>
        ) : (
          <>
            {interactions.map((x) => (
              <View key={x.title} style={s.item}>
                <Text style={s.p}>
                  {x.title} ({x.level})
                </Text>
                <Text style={s.mut}>{x.note}</Text>
                <Text style={s.mutSm}>{x.action}</Text>
              </View>
            ))}
            {contras.map((x) => (
              <View key={x.title} style={s.item}>
                <Text style={s.p}>
                  {x.title} ({x.level})
                </Text>
                <Text style={s.mut}>{x.note}</Text>
                <Text style={s.mutSm}>{x.action}</Text>
              </View>
            ))}
          </>
        )}
      </Section>
      <Section title="Population insights">
        <Text style={s.mut}>{pop.message}</Text>
        {pop.trackedSymptoms.length > 0 ? <Text style={s.p}>Tracked: {pop.trackedSymptoms.join(', ')}</Text> : null}
      </Section>
      <Section title="Pattern detection">
        {patterns.length ? (
          <View style={s.item}>
            <Text style={s.p}>{patterns[0].title}</Text>
            <Text style={s.mut}>{patterns[0].note}</Text>
          </View>
        ) : (
          <Text style={s.mut}>No strong pattern yet.</Text>
        )}
      </Section>
      <Section title="Nutrient signals">
        {scores.length === 0 ? (
          <Text style={s.mut}>Add medications and symptoms to unlock nutrient signals and evidence details.</Text>
        ) : (
          scores.slice(0, 10).map(([n, sc]) => {
            const cFor = evBy[n] || [];
            const q = cFor.length ? summarizeSourceQuality(cFor) : 'Pending';
            const ev = evidencePanelContent(n, cFor);
            return (
              <View key={n} style={s.item}>
                <Text style={s.p}>
                  {n}   {tierFromScore(sc)} ({sc}%)
                </Text>
                <Text style={s.mut}>Source quality: {q}</Text>
                {ev.citations.map((c) => (
                  <Text
                    key={c}
                    style={s.link}
                    onPress={() => {
                      const url = citationToUrl(c);
                      if (url) void Linking.openURL(url);
                    }}
                  >
                    {c}
                  </Text>
                ))}
                <Pressable onPress={() => setOpenEv((o) => ({ ...o, [n]: !o[n] }))}>
                  <Text style={s.link}>{openEv[n] ? 'Hide' : 'Show'} evidence details</Text>
                </Pressable>
                {openEv[n] ? (
                  <Text style={s.mutSm}>
                    {ev.noteText}
                    {'\n'}
                    {ev.labsLine}
                  </Text>
                ) : null}
              </View>
            );
          })
        )}
      </Section>
      <Section title="Recommended supplements">
        {rec.length === 0 ? (
          <Text style={s.mut}>No suggestions yet. Add medications and symptoms so GeneoRx can personalize guidance.</Text>
        ) : (
          rec.map((r) => (
            <View key={r.supplement} style={s.item}>
              <Text style={s.p}>
                {r.supplement} ({r.tier})   {r.nutrient} ({r.score})
              </Text>
            </View>
          ))
        )}
        <Text style={s.mutSm}>Educational guidance only. Confirm supplement choices, labs, and medication decisions with a clinician.</Text>
      </Section>
      <Section title="My routine">
        <Text style={s.mut}>Morning: {routine.morning.join(' · ') || ' '}</Text>
        <Text style={s.mut}>Midday: {routine.midday.join(' · ') || ' '}</Text>
        <Text style={s.mut}>Night: {routine.night.join(' · ') || ' '}</Text>
        {routine.notes.map((n) => (
          <Text key={n} style={s.mutSm}>
            • {n}
          </Text>
        ))}
      </Section>
      <Section title="Start / update routine">
        <TextInput
          style={s.inp}
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={C.mut}
        />
        <Pressable
          style={s.primary}
          onPress={() => {
            const scoresNow = computeNutrientScores(state);
            const recNow = recommendSupplements(scoresNow);
            const d = (startDate || new Date().toISOString().slice(0, 10)) + 'T00:00:00';
            setState((p) => ({
              ...p,
              plan: {
                started: true,
                startDate: new Date(d).toISOString(),
                recommendedSupplements: recNow.map((x) => x.supplement),
                routine: buildRoutineFromSupplements(recNow.map((x) => x.supplement)),
              },
            }));
            showToast('Routine saved ✓');
          }}
        >
          <Text style={s.primaryTx}>{state.plan.started ? 'Update routine' : 'Start routine'}</Text>
        </Pressable>
      </Section>
      <Section title="Weekly check-in reminders">
        <Text style={s.p}>Want weekly check-in reminders?</Text>
        <Text style={s.mut}>GeneoRx can remind you to track symptoms, adherence, energy, mood, sleep, and focus.</Text>
        {!state.subscription.isPlus ? (
          <View style={s.banner}>
            <Text style={s.bannerTx}>Reminder scheduling is included with Plus.</Text>
            <Pressable style={s.ghost} onPress={() => openBilling('reminder_schedule')}>
              <Text style={s.ghostTx}>Upgrade on website</Text>
            </Pressable>
          </View>
        ) : null}
        <Text style={s.mutSm}>
          Status: {state.reminderPreferences.enabled ? 'Reminders on' : 'Reminders off'} · {state.reminderPreferences.day} at{' '}
          {state.reminderPreferences.time}
        </Text>
        <View style={s.row}>
          <Pressable
            style={[s.primary, reminderSaving && { opacity: 0.6 }]}
            disabled={reminderSaving || !state.subscription.isPlus}
            onPress={async () => {
              setReminderSaving(true);
              try {
                const token = await registerForCheckinReminders();
                if (!token) {
                  showToast('Permission not granted');
                  return;
                }
                setState((p) => ({
                  ...p,
                  reminderPreferences: {
                    ...p.reminderPreferences,
                    enabled: true,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || p.reminderPreferences.timezone,
                  },
                }));
                showToast('Reminders on');
              } catch {
                showToast('Reminder setup failed');
              } finally {
                setReminderSaving(false);
              }
            }}
          >
            <Text style={s.primaryTx}>{state.reminderPreferences.enabled ? 'Refresh reminders' : 'Allow reminders'}</Text>
          </Pressable>
          <Pressable
            style={s.ghost}
            onPress={() => {
              setState((p) => ({
                ...p,
                reminderPreferences: { ...p.reminderPreferences, enabled: false },
              }));
              showToast('Reminders off');
            }}
          >
            <Text style={s.ghostTx}>Skip for now</Text>
          </Pressable>
        </View>
      </Section>
      <Section title="Subscription">
          <Text style={s.p}>{state.subscription.isPlus ? 'Plus is active' : 'Free subscription'}</Text>
        <Text style={s.mut}>
          {state.subscription.isPlus
            ? 'You have full tracking, doctor report export, reminders, insight history, and advanced trends.'
            : `Free includes basic insight and ${state.subscription.features.maxFreeCheckins} check-ins. Plus unlocks unlimited check-ins, report export, reminders, insight history, and advanced trends.`}
        </Text>
        {state.subscription.isTrialing && state.subscription.trialEndsAt ? (
          <Text style={s.mutSm}>Trial ends {fmtDate(state.subscription.trialEndsAt)}</Text>
        ) : null}
        {state.subscription.isGrace && state.subscription.graceEndsAt ? (
          <Text style={s.mutSm}>Payment grace ends {fmtDate(state.subscription.graceEndsAt)}</Text>
        ) : null}
        {state.subscription.canceledAt && state.subscription.currentPeriodEndsAt ? (
          <Text style={s.mutSm}>Cancels on {fmtDate(state.subscription.currentPeriodEndsAt)}</Text>
        ) : null}
        <Pressable style={state.subscription.isPlus ? s.ghost : s.primary} onPress={() => openBilling()}>
          <Text style={state.subscription.isPlus ? s.ghostTx : s.primaryTx}>{state.subscription.isPlus ? 'Manage on website' : 'Upgrade to Plus'}</Text>
        </Pressable>
      </Section>
      <View style={s.row}>
        <Pressable style={s.primary} onPress={openInsight}>
          <Text style={s.primaryTx}>Reveal GeneoRx Insight</Text>
        </Pressable>
        <Pressable style={s.ghost} onPress={openSnap}>
          <Text style={s.ghostTx}>Open snapshot</Text>
        </Pressable>
      </View>
      <Pressable style={s.primary} onPress={() => setStep(5)}>
        <Text style={s.primaryTx}>Continue to Check-in</Text>
      </Pressable>
    </View>
  );
}

function citationToUrl(c: string): string {
  return citationToLink(c);
}

function CheckinView({
  state,
  setState,
  symBase,
  showToast,
  setStep,
  ciDate,
  setCiDate,
  ciAdh,
  setCiAdh,
  taken,
  setTaken,
  ciE,
  setCiE,
  ciM,
  setCiM,
  ciS,
  setCiS,
  ciF,
  setCiF,
  ciSide,
  setCiSide,
  ciNotes,
  setCiNotes,
  symEdits,
  setSymEdits,
}: {
  state: GeneoState;
  setState: React.Dispatch<React.SetStateAction<GeneoState>>;
  symBase: string[];
  showToast: (m: string) => void;
  setStep: (n: number) => void;
  ciDate: string;
  setCiDate: (t: string) => void;
  ciAdh: string;
  setCiAdh: (t: string) => void;
  taken: string[];
  setTaken: (t: string[] | ((p: string[]) => string[])) => void;
  ciE: string;
  setCiE: (t: string) => void;
  ciM: string;
  setCiM: (t: string) => void;
  ciS: string;
  setCiS: (t: string) => void;
  ciF: string;
  setCiF: (t: string) => void;
  ciSide: string;
  setCiSide: (t: string) => void;
  ciNotes: string;
  setCiNotes: (t: string) => void;
  symEdits: Record<string, { ch: SymptomChange; sev: string }>;
  setSymEdits: React.Dispatch<React.SetStateAction<Record<string, { ch: SymptomChange; sev: string }>>>;
}) {
  const planSupp = state.plan.recommendedSupplements || [];
  const today = new Date().toISOString().slice(0, 10);
  const freeLimitReached = !state.subscription.isPlus && state.checkins.length >= state.subscription.features.maxFreeCheckins;

  return (
    <View>
      {!state.subscription.isPlus ? (
        <View style={s.banner}>
          <Text style={s.bannerTx}>
            Free includes {state.subscription.features.maxFreeCheckins} check-ins. You have used {state.checkins.length}. Plus unlocks ongoing tracking and doctor report export.
          </Text>
          {freeLimitReached ? (
            <Pressable style={s.ghost} onPress={() => openBilling('checkins')}>
              <Text style={s.ghostTx}>See Plus options</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <Section title="Weekly check-in">
        <Text style={s.lab}>Date</Text>
        <TextInput style={s.inp} value={ciDate} onChangeText={setCiDate} placeholder={today} />
        <Text style={s.lab}>Adherence %</Text>
        <TextInput style={s.inp} value={ciAdh} onChangeText={setCiAdh} keyboardType="number-pad" />
      </Section>
      <Section title="Supplements taken">
        {planSupp.length === 0 ? (
          <Text style={s.mut}>Start a routine in Insights first.</Text>
        ) : (
          <View style={s.chipRow}>
            {planSupp.map((n) => {
              const on = taken.includes(n);
              return (
                <Chip
                  key={n}
                  label={n}
                  on={on}
                  onPress={() => setTaken((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]))}
                />
              );
            })}
          </View>
        )}
        <View style={s.row}>
          <Pressable style={s.ghost} onPress={() => setTaken([...planSupp])}>
            <Text style={s.ghostTx}>Select all</Text>
          </Pressable>
          <Pressable style={s.ghost} onPress={() => setTaken([])}>
            <Text style={s.ghostTx}>Clear</Text>
          </Pressable>
        </View>
      </Section>
      {symBase.map((sym) => {
        const ed = symEdits[sym] || { ch: 'No change' as SymptomChange, sev: '5' };
        return (
          <View key={sym} style={s.item}>
            <Text style={s.p}>{sym}</Text>
            <Text style={s.lab}>Change</Text>
            <View style={s.chipRow}>
              {IMPACT.map((im) => (
                <Pressable
                  key={im}
                  style={[s.chipSm, ed.ch === im && s.chipOn]}
                  onPress={() =>
                    setSymEdits((p) => ({
                      ...p,
                      [sym]: { ch: im, sev: p[sym]?.sev || '5' },
                    }))
                  }
                >
                  <Text style={s.mutSm}>{im}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={s.lab}>Severity now 0–10</Text>
            <TextInput
              style={s.inp}
              value={ed.sev}
              onChangeText={(t) =>
                setSymEdits((p) => ({
                  ...p,
                  [sym]: { ch: p[sym]?.ch ?? 'No change', sev: t },
                }))
              }
              keyboardType="number-pad"
            />
          </View>
        );
      })}
      <Section title="Wellbeing this week">
        {(['E', 'M', 'S', 'F'] as const).map((k, i) => {
          const vals = [ciE, ciM, ciS, ciF];
          const sets = [setCiE, setCiM, setCiS, setCiF];
          const lab = ['Energy', 'Mood', 'Sleep', 'Focus'][i];
          return (
            <View key={k}>
              <Text style={s.lab}>{lab}</Text>
              <TextInput style={s.inp} value={vals[i]} onChangeText={sets[i]} keyboardType="number-pad" />
            </View>
          );
        })}
        <Text style={s.lab}>Side effects (optional)</Text>
        <TextInput
          style={s.inp}
          value={ciSide}
          onChangeText={setCiSide}
          placeholder="e.g. nausea, headache"
          placeholderTextColor={C.mut}
        />
        <Text style={s.lab}>Notes (optional)</Text>
        <TextInput
          style={s.inp}
          value={ciNotes}
          onChangeText={setCiNotes}
          placeholder="Context…"
          placeholderTextColor={C.mut}
        />
      </Section>
      <Pressable
        style={s.primary}
        onPress={() => {
          if (freeLimitReached) {
            showToast('Upgrade to Plus to keep tracking weekly progress');
            openBilling('third_checkin');
            return;
          }
          const adh = Math.max(0, Math.min(100, parseInt(ciAdh || '0', 10) || 0));
          const dateISO = new Date((ciDate || today) + 'T00:00:00').toISOString();
          const items: CheckinItem[] = symBase.map((sym) => {
            const ed = symEdits[sym] || { ch: 'No change' as SymptomChange, sev: '5' };
            const sevN = Math.max(0, Math.min(10, parseInt(ed.sev || '0', 10) || 0));
            const ch = ed.ch;
            return { symptom: sym, change: ch, changeScore: impactValue[ch] ?? 0, severityNow: sevN };
          });
          const imp = items.reduce((a, x) => a + (x.changeScore || 0), 0);
          setState((p) => ({
            ...p,
            checkins: [
              ...p.checkins,
              {
                dateISO,
                adherencePct: adh,
                supplementsTaken: [...taken],
                wellbeing: {
                  energy: Math.max(0, Math.min(10, parseInt(ciE || '0', 10) || 0)),
                  mood: Math.max(0, Math.min(10, parseInt(ciM || '0', 10) || 0)),
                  sleep: Math.max(0, Math.min(10, parseInt(ciS || '0', 10) || 0)),
                  focus: Math.max(0, Math.min(10, parseInt(ciF || '0', 10) || 0)),
                },
                symptoms: { items, improvementScore: imp },
                sideEffects: ciSide
                  .split(',')
                  .map((x) => x.trim())
                  .filter(Boolean),
                notes: ciNotes.trim(),
              },
            ],
          }));
          showToast('Check-in saved ✓');
          setStep(6);
        }}
      >
        <Text style={s.primaryTx}>Save check-in</Text>
      </Pressable>
      <Pressable
        style={s.ghost}
        onPress={() => {
          setState((p) => ({ ...p, checkins: p.checkins.slice(0, -1) }));
          showToast('Last removed');
        }}
      >
        <Text style={s.ghostTx}>Delete last check-in</Text>
      </Pressable>
    </View>
  );
}

function ProgressView({
  state,
  setStep,
  onSnap,
  onExport,
  showToast,
}: {
  state: GeneoState;
  setStep: (n: number) => void;
  onSnap: () => void;
  onExport: () => Promise<void>;
  showToast: (m: string) => void;
}) {
  const last = latestCheckin(state);
  if (!last) {
    return (
      <View>
        <Text style={s.mut}>No check-ins yet. Log your first weekly check-in to unlock your Health Signal.</Text>
        <Pressable style={s.primary} onPress={() => setStep(5)}>
          <Text style={s.primaryTx}>Go to Check-in</Text>
        </Pressable>
      </View>
    );
  }
  const coach = computeWeeklyCoachMessage(state);
  const base = state.wellbeingBaseline;
  const dE = last.wellbeing.energy - base.energy;
  const dM = last.wellbeing.mood - base.mood;
  const dS = last.wellbeing.sleep - base.sleep;
  const dF = last.wellbeing.focus - base.focus;
  const items = last.symptoms?.items || [];
  const best = items.reduce<(typeof items)[0] | null>(
    (a, x) => (!a || (x.changeScore || 0) > (a.changeScore || 0) ? x : a),
    null,
  );
  const worst = items.reduce<(typeof items)[0] | null>(
    (a, x) => (!a || (x.changeScore || 0) < (a.changeScore || 0) ? x : a),
    null,
  );
  return (
    <View>
      <Section title="Health Signal">
        <Text style={s.p}>{coach.headline}</Text>
        {!state.subscription.isPlus ? (
          <View style={s.banner}>
            <Text style={s.bannerTx}>You can open the clinician snapshot on Free. Plus unlocks a full exportable doctor report.</Text>
          </View>
        ) : null}
        {coach.bullets.map((b) => (
          <Text key={b} style={s.mut}>
            • {b}
          </Text>
        ))}
        <View style={s.row}>
          <Pressable style={s.primary} onPress={onSnap}>
            <Text style={s.primaryTx}>Snapshot for clinician</Text>
          </Pressable>
          <Pressable
            style={s.ghost}
            onPress={async () => {
              if (!state.subscription.isPlus) {
                showToast('Upgrade to Plus to export doctor reports');
                openBilling('doctor_export');
                return;
              }
              try {
                await onExport();
                showToast('Exported');
              } catch {
                showToast('Export failed');
              }
            }}
          >
            <Text style={s.ghostTx}>Export HTML report</Text>
          </Pressable>
        </View>
        <Pressable style={s.ghost} onPress={() => setStep(5)}>
          <Text style={s.ghostTx}>Add another check-in</Text>
        </Pressable>
      </Section>
      <Section title="Latest check-in">
        <Text style={s.mut}>
          Δ Wellbeing: E {dE >= 0 ? '+' : ''}
          {dE} M {dM >= 0 ? '+' : ''}
          {dM} S {dS >= 0 ? '+' : ''}
          {dS} F {dF >= 0 ? '+' : ''}
          {dF}
        </Text>
        <Text style={s.p}>
          Most improved: {best?.symptom || ' '} / Least: {worst?.symptom || ' '}
        </Text>
        <Text style={s.mut}>Adherence: {last.adherencePct}%</Text>
      </Section>
      <Section title="Timeline">
        {state.checkins.map((c, i) => (
          <View key={c.dateISO + i} style={s.item}>
            <Text style={s.mut}>
              #{i + 1} {fmtDate(c.dateISO)}   {c.adherencePct}%
            </Text>
          </View>
        ))}
      </Section>
    </View>
  );
}

function SummaryView({
  state,
  onSnap,
  onInsight,
  userName,
}: {
  state: GeneoState;
  onSnap: () => void;
  onInsight: () => void;
  userName: string;
}) {
  const story = generateDynamicHealthStory(state);
  const success = computeMedicationSuccessPrediction(state);
  const pat = detectHealthPatterns(state);
  const int = computeDrugInteractions(state);
  const con = computeContraindications(state);
  const insight = computeInsightEngine(state);
  const last = latestCheckin(state);
  return (
    <View>
      <Section title="Your health story">
        <Text style={s.mut}>{story}</Text>
      </Section>
      <View style={s.row}>
        <Pressable style={s.primary} onPress={onSnap}>
          <Text style={s.primaryTx}>Clinician snapshot</Text>
        </Pressable>
        <Pressable style={s.ghost} onPress={onInsight}>
          <Text style={s.ghostTx}>Insight</Text>
        </Pressable>
      </View>
      <Section title="Dashboard">
        <Text style={s.mut}>
          Account: {state.account.email || userName} · Consent: {state.account.consent ? 'Yes' : 'No'}
        </Text>
        <Text style={s.mut}>
          Success: {success.score}% ({success.level})
        </Text>
        <Text style={s.mut}>Pattern: {pat[0]?.title || ' '}</Text>
        <Text style={s.mut}>
          Interactions: {int.length ? int.map((x) => x.title).join(', ') : ' '}
        </Text>
        <Text style={s.mut}>
          Cautions: {con.length ? con.map((x) => x.title).join(', ') : ' '}
        </Text>
        <Text style={s.mut}>
          Insight: {insight.summary} {insight.meaning}
        </Text>
        <Text style={s.mut}>
          Latest check-in: {last ? `${fmtDate(last.dateISO)} · ${last.adherencePct}%` : ' '}
        </Text>
      </Section>
    </View>
  );
}

function FeedbackView({
  onSend,
}: {
  onSend: (type: string, can: boolean, msg: string) => void;
}) {
  const [ty, setTy] = useState('Suggestion');
  const [can, setCan] = useState(true);
  const [msg, setMsg] = useState('');
  return (
    <View>
      <Section title="Feedback">
        <Text style={s.mut}>We read every message. Email: info@geneorx.com</Text>
        <View style={s.row}>
          {['Bug / issue', 'Suggestion', 'Question', 'Other'].map((t) => (
            <Pressable key={t} style={[s.pill, ty === t && s.pillOn]} onPress={() => setTy(t)}>
              <Text style={s.mutSm}>{t}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.lab}>Can we contact you?</Text>
        <View style={s.row}>
          {(['yes', 'no'] as const).map((v) => (
            <Pressable key={v} style={[s.pill, (v === 'yes') === can && s.pillOn]} onPress={() => setCan(v === 'yes')}>
              <Text style={s.tabTx}>{v === 'yes' ? 'Yes' : 'No'}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={[s.inp, { minHeight: 100 }]}
          multiline
          value={msg}
          onChangeText={setMsg}
          placeholder="Message…"
        />
        <Pressable
          style={s.primary}
          onPress={() => {
            onSend(ty, can, msg);
            setMsg('');
          }}
        >
          <Text style={s.primaryTx}>Open email to send</Text>
        </Pressable>
      </Section>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg0, paddingHorizontal: 12 },
  load: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg0 },
  glowCyan: {
    position: 'absolute',
    top: -100,
    left: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(40,225,255,0.12)',
  },
  glowViolet: {
    position: 'absolute',
    top: 12,
    right: -100,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(167,139,250,0.12)',
  },
  glowPink: {
    position: 'absolute',
    bottom: -130,
    left: 30,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255,79,216,0.08)',
  },
  topbar: { marginBottom: 10, gap: 10 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandmark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(15,23,54,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.cyan,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 5,
  },
  brandmarkText: { color: C.cyan, fontSize: 16, fontWeight: '900' },
  brandCopy: { flex: 1 },
  h1: { color: C.txt, fontSize: 18, fontWeight: '900', letterSpacing: 0.2 },
  subh: { color: C.mut, fontSize: 13, marginTop: 3 },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, alignItems: 'center' },
  statusPill: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 11,
    color: C.mut,
    backgroundColor: 'rgba(15,23,54,0.62)',
    fontSize: 12,
  },
  pill: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  pillOn: { backgroundColor: 'rgba(40,225,255,0.18)', borderColor: C.cyan },
  tabTx: { color: C.mut, fontSize: 11 },
  tabTxOn: { color: '#061018', fontWeight: '900', fontSize: 11 },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: 'rgba(15,23,54,0.58)',
    padding: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.32,
    shadowRadius: 28,
    elevation: 7,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    color: C.mut,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: 'rgba(7,10,18,0.36)',
    fontSize: 12,
    marginBottom: 6,
  },
  heroTitle: { color: C.txt, fontSize: 24, lineHeight: 29, fontWeight: '900', letterSpacing: -0.4 },
  heroSub: { color: C.mut, fontSize: 14, lineHeight: 20, marginTop: 8 },
  languageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  languagePill: {
    color: C.txt,
    fontSize: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(7,10,18,0.32)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  currentStepCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: 'rgba(15,23,54,0.42)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  progressText: { color: C.cyan, fontSize: 12, fontWeight: '800', marginBottom: 6 },
  dashboardTitle: { color: C.txt, fontSize: 14, fontWeight: '900', marginBottom: 8 },
  mainTitle: { color: C.txt, fontSize: 20, fontWeight: '900' },
  mainSub: { color: C.mut, fontSize: 13, marginTop: 5, lineHeight: 18 },
  tabScroll: { maxHeight: 50, marginBottom: 8 },
  journeyContent: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 },
  journeyGroup: {
    flexGrow: 1,
    minWidth: 104,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: 'rgba(7,10,18,0.34)',
    paddingHorizontal: 11,
    paddingVertical: 9,
    minHeight: 40,
  },
  journeyGroupOn: { borderColor: 'rgba(40,225,255,0.42)', backgroundColor: 'rgba(40,225,255,0.08)' },
  journeyTitle: { color: C.mut, fontWeight: '900', fontSize: 12 },
  journeyTitleOn: { color: C.txt },
  journeyCount: { color: C.muted2, fontSize: 10, marginTop: 2 },
  journeyCountOn: { color: C.cyan },
  stepTray: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  stepDot: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: 'rgba(15,23,54,0.48)',
  },
  stepDotOn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
  stepDotText: { color: C.mut, fontSize: 11 },
  stepDotTextOn: { color: '#061018', fontWeight: '900' },
  tabContent: { paddingRight: 4 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.line,
    marginRight: 8,
    backgroundColor: 'rgba(7,10,18,0.35)',
  },
  tabOn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
  content: { flex: 1 },
  section: {
    marginBottom: 14,
    padding: 16,
    backgroundColor: 'rgba(7,10,18,0.30)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.line,
  },
  sectionTitle: { color: C.cyan, fontSize: 15, fontWeight: '900', marginBottom: 8 },
  p: { color: C.txt, fontSize: 14, lineHeight: 20 },
  mut: { color: C.mut, fontSize: 13, lineHeight: 18, marginTop: 4 },
  mutSm: { color: C.mut, fontSize: 12 },
  lab: { color: C.mut, fontSize: 12, marginTop: 8, marginBottom: 4 },
  inp: { backgroundColor: 'rgba(7,10,18,0.46)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', borderRadius: 12, padding: 11, color: C.txt, fontSize: 14 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, alignItems: 'center' },
  opt: { padding: 10, borderWidth: 1, borderColor: C.line, borderRadius: 12, marginBottom: 6, backgroundColor: 'rgba(15,23,54,0.42)' },
  optOn: { borderColor: C.cyan, backgroundColor: 'rgba(40,225,255,0.12)' },
  optTx: { color: C.txt, fontSize: 13 },
  picker: { maxHeight: 180, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 4, backgroundColor: 'rgba(7,10,18,0.24)' },
  primary: {
    backgroundColor: C.cyan,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  primaryTx: { color: '#061018', fontWeight: '900' },
  ghost: { borderWidth: 1, borderColor: C.line, padding: 10, borderRadius: 12, marginTop: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(7,10,18,0.35)' },
  ghostTx: { color: C.txt, fontSize: 13 },
  btnGhost: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: C.line, backgroundColor: 'rgba(7,10,18,0.35)' },
  btnGhostTxt: { color: C.mut, fontSize: 11 },
  btnOut: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, borderColor: C.rose, borderWidth: 1, backgroundColor: 'rgba(251,113,133,0.10)' },
  btnOutTxt: { color: C.rose, fontSize: 11 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: C.line, backgroundColor: 'rgba(15,23,54,0.45)' },
  chipOn: { borderColor: C.cyan, backgroundColor: 'rgba(40,225,255,0.14)' },
  chipTxt: { color: C.txt, fontSize: 12 },
  chipTxtOn: { fontWeight: '900' },
  chipSm: { padding: 4, borderRadius: 6, borderWidth: 1, borderColor: C.line, margin: 2 },
  banner: { backgroundColor: 'rgba(251,113,133,0.12)', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: 'rgba(251,113,133,0.3)', marginTop: 8 },
  bannerTx: { color: C.txt, fontSize: 12 },
  inlineUpgrade: { marginTop: 8, alignSelf: 'flex-start' },
  inlineUpgradeText: { color: C.cyan, fontSize: 12, fontWeight: '900' },
  item: { marginTop: 8, padding: 10, borderRadius: 12, backgroundColor: 'rgba(15,23,54,0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  danger: { color: C.rose, marginTop: 4, fontSize: 12 },
  link: { color: C.cyan, textDecorationLine: 'underline', fontSize: 12, marginTop: 2 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 16 },
  modalBox: { backgroundColor: C.card2, borderRadius: 18, padding: 16, maxHeight: '90%', borderWidth: 1, borderColor: C.line },
  mono: { color: C.txt, fontSize: 11, lineHeight: 16 },
  reveal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  toastW: { position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: C.card2, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: C.line },
  toastT: { color: C.txt, textAlign: 'center' },
});
