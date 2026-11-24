// Sign in with email + a 6-digit code (UpAiry's own accounts, via Supabase).
// After sign-in we look for an UpAiry order under that verified email to switch on UpAiry Plus.
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, Sub, Btn, Card, Input, Row, Tip, toast } from './ui';
import Icon from './Icon';
import Logo from './Logo';
import { C } from '@/lib/theme';
import { update } from '@/lib/store';
import { sendCode, verifyCode, linkOrder } from '@/lib/backend';

type Step = 'email' | 'code' | 'order' | 'done';
const FAQ = [
  ["Why a code instead of a password?", "Nothing to remember or reset. We email you a 6-digit code each time you sign in on a new phone."],
  ["I didn't get the code", "Check your spam or promotions folder, make sure the email is spelled right, then tap \"Send a new code\"."],
  ['Where do I find my order number?', "It's in your order confirmation email from UpAiry, and on your packing slip."],
  ['I bought from a shop or Amazon', 'You can still use the app with a free account. Email us your receipt and we\'ll add UpAiry Plus.'],
  ["Is my child's data shared?", "No. Your child's logs stay on this phone. Your account only holds your email and order."],
];

export default function Auth() {
  const ins = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(''); const [code, setCode] = useState(''); const [order, setOrder] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [faq, setFaq] = useState<number | null>(null);
  const [result, setResult] = useState<{ plan: 'plus' | 'free'; order?: string; until?: string } | null>(null);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const run = async (fn: () => Promise<void>) => { setBusy(true); setErr(''); try { await fn(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); } };
  const onSend = () => run(async () => { await sendCode(email); setCode(''); setStep('code'); toast('Code sent', 'Check ' + email.trim()); });
  const onVerify = () => run(async () => {
    await verifyCode(email, code);
    const r = await linkOrder().catch(() => ({ linked: false } as any));
    if (r.linked) { setResult({ plan: (r.plan as 'plus' | 'free') ?? 'plus', order: r.order, until: r.plus_until }); setStep('done'); }
    else setStep('order');
  });
  const onOrder = () => run(async () => {
    const r = await linkOrder(order.trim());
    if (r.linked) { setResult({ plan: (r.plan as 'plus' | 'free') ?? 'plus', order: r.order, until: r.plus_until }); setStep('done'); }
    else throw new Error(r.error === 'not_configured' ? "Order linking is still being set up. Continue for now and it'll link automatically later." : "We couldn't find that order under " + email.trim() + '. Check the number, or continue for now.');
  });
  const finish = (plan: 'plus' | 'free', o?: string, until?: string) => update(s => { s.account = { id: email.trim().toLowerCase(), plan, since: Date.now(), order: o ?? null, plusUntil: until ?? null }; s.memberSince = Date.now(); });
  const back = <Pressable onPress={() => { setStep('email'); setErr(''); }} hitSlop={12} style={{ marginLeft: -6, marginBottom: 4 }}><Icon name="chevL" size={24} color={C.ink2} /></Pressable>;
  const H = (t: string, s: string) => <><T w="b" size={28} style={{ marginTop: 18, marginBottom: 8 }}>{t}</T><Sub style={{ fontSize: 15, marginBottom: 20 }}>{s}</Sub></>;

  let body;
  if (step === 'done' && result) {
    const date = result.until ? new Date(result.until).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' }) : null;
    body = <>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 30 }}><Icon name="check" size={36} color={C.brand} stroke={2.4} /></View>
      <T w="b" size={28} style={{ textAlign: 'center', marginTop: 20 }}>Order found</T>
      <Sub style={{ textAlign: 'center', marginTop: 8, marginBottom: 20, fontSize: 15 }}>{`Order ${result.order} is linked. UpAiry Plus is included${date ? ' until ' + date : ''}.`}</Sub>
      <Card pad={4} style={{ paddingHorizontal: 18 }}>{['The full day-by-day program', 'Smart reminders and the AI coach', 'Potty songs, kid mode and rewards', 'Free UpAiry gear as you go'].map((x, i) => <Row key={x} first={i === 0} title={x} icon="check" />)}</Card>
      <View style={{ flex: 1, minHeight: 30 }} />
      <Btn title="Set up your child" onPress={() => finish(result.plan, result.order, result.until)} />
    </>;
  } else if (step === 'order') {
    body = <>
      <Logo width={120} />
      {H('Signed in', `We couldn't find an UpAiry order under ${email.trim()}. If you ordered with a different email or want to use your order number, enter it below.`)}
      <Input label="Order number" value={order} onChangeText={setOrder} placeholder="e.g. 1234" autoCapitalize="none" />
      {err ? <Tip icon="info" tone="sun">{err}</Tip> : null}
      <Btn title={busy ? 'Checking…' : 'Link my order'} onPress={onOrder} disabled={busy || !order.trim()} />
      <Btn kind="text" title="Continue without an order" onPress={() => finish('free')} />
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
      {H('Sign in to UpAiry', "Enter your email and we'll send you a code. Use the email you ordered with and UpAiry Plus switches on automatically.")}
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
