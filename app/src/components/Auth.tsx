// Sign in with the email and order number from an upairy.com order. No password, no emailed code.
// The server checks the order belongs to that email (in Loop), then we check for an active Potty Up
// subscription on the same email. No "buy" button or link here: App Store rules for apps that unlock web purchases.
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, Sub, Btn, Card, Input, Row, Tip } from './ui';
import Icon from './Icon';
import Logo from './Logo';
import { C } from '@/lib/theme';
import { update } from '@/lib/store';
import { signInWithOrder, checkMembership, type Membership } from '@/lib/backend';

const FAQ = [
  ['Where do I find my order number?', 'In your order confirmation email from UpAiry. It starts with # (for example #1314664). You can type it with or without the #.'],
  ['Which email do I use?', 'The email you used at checkout on upairy.com. It has to match the order.'],
  ['I bought Potty Up but it says free', 'Sign in with the email and order number from your Potty Up order. Then tap "Check my purchase" in Settings.'],
  ["Is my child's data shared?", "No. Your child's logs stay on this phone. Your account only holds your email and whether you have Potty Up."],
];

export default function Auth() {
  const ins = useSafeAreaInsets();
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState(''); const [order, setOrder] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [faq, setFaq] = useState<number | null>(null);
  const [m, setM] = useState<Membership | null>(null);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const validOrder = order.replace(/\D/g, '').length >= 3;

  const onSignIn = async () => {
    setBusy(true); setErr('');
    try {
      await signInWithOrder(email, order);
      setM(await checkMembership().catch(() => ({ plan: 'free', member: false } as Membership)));
      setDone(true);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  const finish = () => update(s => { s.account = { id: email.trim().toLowerCase(), plan: m?.plan ?? 'free', since: Date.now(), order: order.trim(), plusUntil: null }; s.memberSince = Date.now(); });

  let body;
  if (done) {
    const plus = m?.plan === 'plus';
    body = <>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 30 }}><Icon name="check" size={36} color={C.brand} stroke={2.4} /></View>
      <T w="b" size={28} style={{ textAlign: 'center', marginTop: 20 }}>{plus ? 'Potty Up is unlocked' : "You're signed in"}</T>
      <Sub style={{ textAlign: 'center', marginTop: 8, marginBottom: 20, fontSize: 15 }}>{plus
        ? `Linked to ${email.trim()}. Everything is ready to go.`
        : `Signed in as ${email.trim()}. You're on the free version. If you have Potty Up, it's linked to the email you used to buy it.`}</Sub>
      <Card pad={4} style={{ paddingHorizontal: 18 }}>
        {(plus ? ['The full day-by-day program', 'Smart reminders and the AI coach', 'Potty songs, kid mode and rewards', 'Free UpAiry gear as you go'] : ['Logging, timer and history', 'Readiness check and built-in guides', 'Your data stays on this phone'])
          .map((x, i) => <Row key={x} first={i === 0} title={x} icon="check" />)}
      </Card>
      <View style={{ flex: 1, minHeight: 30 }} />
      <Btn title="Set up your child" onPress={finish} />
    </>;
  } else {
    body = <>
      <Logo width={96} />
      <T w="b" size={34} color={C.brand} style={{ marginTop: 18 }}>Potty Up</T>
      <T w="b" size={28} style={{ marginTop: 18, marginBottom: 8 }}>Sign in</T>
      <Sub style={{ fontSize: 15, marginBottom: 20 }}>Use the email and order number from your upairy.com order.</Sub>
      <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
      <Input label="Order number" value={order} onChangeText={setOrder} placeholder="#1314664" keyboardType="numbers-and-punctuation" autoCapitalize="none" autoCorrect={false} />
      {err ? <Tip icon="info" tone="sun">{err}</Tip> : null}
      <Btn title={busy ? 'Checking…' : 'Sign in'} onPress={onSignIn} disabled={busy || !validEmail || !validOrder} />
      <Sub style={{ textAlign: 'center', marginTop: 12 }}>Your order number is in your order confirmation email.</Sub>
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
