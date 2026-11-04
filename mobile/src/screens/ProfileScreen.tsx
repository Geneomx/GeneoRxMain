import { FeedbackModal } from '@/components/FeedbackModal';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { TopBar } from '@/components/TopBar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProfile } from '@/store/ProfileContext';
import { useAuth } from '@/auth/AuthContext';
import { useWizard } from '@/store/WizardContext';
import { useReminderSettings } from '@/hooks/useReminderSettings';
import { AmbientBackground } from '@/components/AmbientBackground';
import { SaveState } from '@/components/SaveState';
import { Input } from '@/components/Input';
import { DropdownSelect } from '@/components/DropdownSelect';
import { Button } from '@/components/Button';
import { EditorSheet, ListRow, SectionHeading, refined } from '@/components/RefinedUI';
import { Section, FinePrint } from '@/screens/wizard/ui';
import { useToast } from '@/components/Toast';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useTranslation } from '@/hooks/useTranslation';
import { colors } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/ProfileStack';
import { isValidOptionalAge, normalizeOptionalAge } from '@/wizard/account';

export const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>>();
  const route = useRoute<RouteProp<ProfileStackParamList, 'ProfileMain'>>();
  const { data, loading, refresh } = useProfile();
  const { signOut, user, isGuest } = useAuth();
  const { state, savePayload } = useWizard();
  const { page, scrollBottom } = useResponsiveLayout();
  const reminder = useReminderSettings();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [editor, setEditor] = useState<'personal' | 'health' | 'privacy' | null>(null);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [pregnant, setPregnant] = useState(false);
  const [kidneyDisease, setKidneyDisease] = useState(false);
  const [anticoagulants, setAnticoagulants] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (route.params?.edit) { setEditor(route.params.edit); navigation.setParams({ edit: undefined }); } }, [route.params?.edit, navigation]);
  useEffect(() => {
    if (editor) return;
    setAge(state.profile.age); setGender(state.profile.gender); setPhone(state.profile.phone);
    setPregnant(state.profile.pregnant); setKidneyDisease(state.profile.kidneyDisease); setAnticoagulants(state.profile.anticoagulants);
  }, [state.profile, editor]);
  const saveDetails = async () => {
    if (!isValidOptionalAge(age)) { Alert.alert(t('mobile.alert.error'), t('parity.age_error')); return; }
    if (phone.length > 30) { Alert.alert(t('mobile.alert.error'), t('parity.phone_error')); return; }
    setSaving(true);
    try { const outcome = await savePayload({ profile: { age: normalizeOptionalAge(age), gender, phone, pregnant, kidneyDisease, anticoagulants } }); setEditor(null); toast.show(t('tracking.saved.' + outcome)); }
    catch (error) { toast.show(error instanceof Error ? error.message : t('mobile.alert.try_again'), 'error'); }
    finally { setSaving(false); }
  };
  const setAiConsent = async (aiConsent: boolean) => {
    setSaving(true);
    try { const outcome = await savePayload({ account: { aiConsent } }); toast.show(t('tracking.saved.' + outcome)); }
    catch (error) { toast.show(error instanceof Error ? error.message : t('mobile.alert.try_again'), 'error'); }
    finally { setSaving(false); }
  };
  const setConsent = async (consent: boolean) => {
    setSaving(true);
    try { const outcome = await savePayload({ account: { consent } }); toast.show(t('tracking.saved.' + outcome)); }
    catch (error) { toast.show(error instanceof Error ? error.message : t('mobile.alert.try_again'), 'error'); }
    finally { setSaving(false); }
  };
  const name = data?.user?.name || user?.name || t('common.guest');
  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}><AmbientBackground /><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 20, paddingBottom: scrollBottom }} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}><View style={[page, { gap: 20 }]}>
    <TopBar />
    <Text accessibilityRole="header" style={styles.title}>{t('refined.account_title')}</Text>
    <SaveState />
    <View style={styles.identity}><View style={styles.avatar} accessible={false}><Text style={{ fontSize: 26, fontWeight: '700', color: colors.onPine }}>{name.trim().slice(0, 1).toUpperCase()}</Text></View><View style={{ flex: 1, gap: 5 }}><Text style={{ color: colors.text, fontSize: 21, lineHeight: 28, fontWeight: '500' }}>{name}</Text><Text style={refined.meta}>{isGuest ? t('mobile.profile.guest_mode') : user?.email}</Text></View></View>
    <View style={refined.listGroup}>
      <ListRow icon="account" title={t('refined.personal_title')} onPress={() => setEditor('personal')} />
      <ListRow icon="heart" title={t('parity.health')} onPress={() => setEditor('health')} />
      <ListRow icon="plan" title={t('mobile.profile.settings')} onPress={() => navigation.navigate('Settings')} />
      <ListRow icon="file" title={t('clean.tracking_privacy')} onPress={() => setEditor('privacy')} />
      <ListRow icon="spark" title={t('ai.feedback')} onPress={() => setFeedbackOpen(true)} last />
    </View>
    <FeedbackModal visible={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    <Button title={t('mobile.profile.sign_out')} variant="ghost" onPress={() => { void signOut(); }} />
  </View></ScrollView>
    <EditorSheet visible={editor !== null} title={t(editor === 'privacy' ? 'clean.tracking_privacy' : editor === 'health' ? 'parity.health' : 'refined.personal_title')} onClose={() => { if (!saving) setEditor(null); }} footer={editor === 'privacy' ? undefined : <Button title={t('tracking.save_details')} loading={saving} onPress={() => { void saveDetails(); }} />}>
      {editor === 'privacy' ? <><Toggle label={t('parity.consent')} detail={t('parity.consent_sub')} value={state.account.consent} disabled={saving} onChange={v => { void setConsent(v); }} /><Toggle label={t('ai.consent_label')} detail={t('ai.consent_sub')} value={state.account.aiConsent} disabled={saving} onChange={v => { void setAiConsent(v); }} /></> : editor === 'personal' ? <><Input label={t('account.age')} value={age} onChangeText={setAge} keyboardType="number-pad" maxLength={3} /><DropdownSelect label={t('account.gender')} value={gender} onChange={setGender} options={['Female','Male','Non-binary','Prefer not to say'].map((v,i) => ({ value: v, label: t(['gender.female','gender.male','gender.non_binary','gender.prefer_not'][i]) }))} /><Input label={t('mobile.profile.phone_optional')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={30} /></> : <><Toggle label={t('account.pregnant')} detail={t('mobile.profile.pregnant_desc')} value={pregnant} onChange={setPregnant} /><Toggle label={t('account.chip.kidney')} detail={t('mobile.profile.kidney_desc')} value={kidneyDisease} onChange={setKidneyDisease} /><Toggle label={t('account.chip.anticoag')} detail={t('mobile.profile.anticoag_desc')} value={anticoagulants} onChange={setAnticoagulants} /></>}
    </EditorSheet>
  </SafeAreaView>;
};
const Toggle: React.FC<{ label: string; detail?: string; value: boolean; disabled?: boolean; onChange: (v: boolean) => void }> = ({ label, detail, value, disabled, onChange }) => <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 10 }}><View style={{ flex: 1, gap: 4 }}><Text style={refined.rowTitle}>{label}</Text>{detail ? <Text style={refined.meta}>{detail}</Text> : null}</View><Switch accessibilityLabel={label} value={value} disabled={disabled} onValueChange={onChange} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={value ? colors.onPrimary : '#FFFFFF'} /></View>;
const styles = StyleSheet.create({safe:{ flex:1,backgroundColor:colors.background }, title:{flex:1,fontSize:33,lineHeight:39,fontWeight:'700',letterSpacing:-.8,color:colors.pine},identity:{flexDirection:'row',alignItems:'center',gap:14,paddingVertical:20},avatar:{width:64,height:64,borderRadius:32,alignItems:'center',justifyContent:'center',backgroundColor:colors.pine,borderWidth:3,borderColor:colors.coralSoft}});
