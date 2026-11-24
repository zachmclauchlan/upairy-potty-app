// Sign in with email + a 6-digit code (UpAiry's own accounts, via Supabase).
// After sign-in we check for an active UpAiry membership (a Loop subscription on that email).
// No "buy membership" button or link here: App Store rules for apps that unlock web purchases.
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, Sub, Btn, Card, Input, Row, Tip, toast } from './ui';
import Icon from './Icon';
import Logo from './Logo';
import { C } from '@/lib/theme';
import { update } from '@/lib/store';
import { sendCode, verifyCode, checkMembership, type Membership } from '@/lib/backend';

type Step = 'email' | 'code' | 'done';
const FAQ = [
  ['Why a code instead of a password?', 'Nothing to remember or reset. We email you a 6-digit code each time you sign in on a new phone.'],
  ["I didn't get the code", 'Check your spam or promotions folder, make sure the email is spelled right, then tap "Send a new code".'],
  ["I'm a member but it says free", 'Sign in with the same email you used at checkout on upairy.com. Membership is linked to that email.'],
  ["Is my child's data shared?", "No. Your child's logs stay on this phone. Your account only holds your email and membership."],
];

export default function Auth() {
  const ins = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(''); const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [faq, setFaq] = useState<number | null>(null);
  const [m, setM] = useState<Membership | null>(null);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const run = async (fn: () => Promise<void>) => { setBusy(true); setErr(''); try { await fn(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); } };
  const onSend = () => run(async () => { await sendCode(email); setCode(''); setStep('code'); toast('Code sent', 'Check ' + email.trim()); });
  const onVerify = () => run(async () => {
    await verifyCode(email, code);
    setM(await checkMembership().catch(() => ({ plan: 'free', member: false } as Membership)));
    setStep('done');
  });
  const finish = () => update(s => { s.account = { id: email.trim().toLowerCase(), plan: m?.plan ?? 'free', since: Date.now(), order: m?.order ?? null, plusUntil: null }; s.memberSince = Date.now(); });
  const back = <Pressable onPress={() => { setStep('email'); setErr(''); }} hitSlop={12} style={{ marginLeft: -6, marginBottom: 4 }}><Icon name="chevL" size={24} color={C.ink2} /></Pressable>;
  const H = (t: string, s: string) => <><T w="b" size={28} style={{ marginTop: 18, marginBottom: 8 }}>{t}</T><Sub style={{ fontSize: 15, marginBottom: 20 }}>{s}</Sub></>;

  let body;
  if (step === 'done') {
    const plus = m?.plan === 'plus';
    body = <>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 30 }}><Icon name="check" size={36} color={C.brand} stroke={2.4} /></View>
      <T w="b" size={28} style={{ textAlign: 'center', marginTop: 20 }}>{plus ? 'UpAiry Plus is active' : "You're signed in"}</T>
      <Sub style={{ textAlign: 'center', marginTop: 8, marginBottom: 20, fontSize: 15 }}>{plus
        ? `Your membership on ${email.trim()} is linked.`
        : `Signed in as ${email.trim()}. ${m?.error === 'not_configured' ? 'Membership checking is still being set up.' : "We didn't find an UpAiry membership on this email. If you have one, sign in with the email you used at checkout."}`}</Sub>
      <Card pad={4} style={{ paddingHorizontal: 18 }}>
        {(plus ? ['The full day-by-day program', 'Smart reminders and the AI coach', 'Potty songs, kid mode and rewards', 'Member perks from UpAiry'] : ['Logging, timer and history', 'Readiness check and built-in guides', 'Your data stays on this phone'])
          .map((x, i) => <Row key={x} first={i === 0} title={x} icon="check" />)}
      </Card>
      <View style={{ flex: 1, minHeight: 30 }} />
      <Btn title="Set up your child" onPress={finish} />
    </>;
  } else if (step === 'code') {
    body = <>
      {back}
      {H('Check your email', `We sent a 6-digit code to ${email.trim()}. It expires in an hour.`)}
      <Input label="6-digit code" value={code} onChangeText={t => setCode(t.replace(/\D/g, '').slice(0, 6))} placeholder="123456" keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={6} autoFocus />
      {err ? <Tip icon="info" tone="sun">{err}</Tip> : null}
      <Btn title={busy ? 'Checking…' : 'Sign in'} onPress={onVerify} disabled={busy || code.length < 6} />
      <Btn kind="text" title="Send a new code" onPress={onSend} disabled={busy} />
    </>;
  } else {
    body = <>
      <Logo width={132} />
      {H('Sign in to UpAiry', "Enter your email and we'll send you a code. Members: use the email you checked out with on upairy.com.")}
      <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
      {err ? <Tip icon="info" tone="sun">{err}</Tip> : null}
      <Btn title={busy ? 'Sending…' : 'Email me a code'} onPress={onSend} disabled={busy || !validEmail} />
      <Sub style={{ textAlign: 'center', marginTop: 12 }}>New here? The same button creates your free account.</Sub>
      <T w="s" size={15} style={{ marginTop: 26, marginBottom: 8, marginLeft: 2 }}>Questions</T>
      <Card pad={2} style={{ paddingHorizontal: 18 }}>
        {FAQ.map(([q, a], i) => <View key={q}>
          <Row first={i === 0} title={q} onPress={() => setFaq(faq === i ? null : i)} right={<Icon name={faq === i ? 'chevD' : 'chevR'} size={18} color={C.ink3} />} />
          {faq === i ? <Sub style={{ paddingBottom: 14, marginTop: -4 }}>{a}</Sub> : null}
        </View>)}
      </Card>
    </>;
  }
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ flexGrow: 1, paddingTop: ins.top + 24, paddingHorizontal: 24, paddingBottom: ins.bottom + 24 }} keyboardShouldPersistTaps="handled">
      {body}
    </ScrollView>
  );
}
