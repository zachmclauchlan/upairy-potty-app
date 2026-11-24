// Sign in with the email and order number from an upairy.com order. No password, no emailed code.
// The server checks the order belongs to that email (in Loop), then we check for an active Potty Up
// subscription on the same email. No "buy" button or link here: App Store rules for apps that unlock web purchases.
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, Sub, Btn, Card, Input, Row, Tip, toast } from './ui';
import Icon from './Icon';
import Logo from './Logo';
import { C } from '@/lib/theme';
import { signInWithOrder, checkMembership, signOut, type Membership } from '@/lib/backend';
import { afterSignIn, fetchBackup, otherOwner } from '@/lib/backup';
import { S } from '@/lib/store';

const FAQ = [
  ['Where do I find my order number?', 'In your order confirmation email from UpAiry. It starts with # (for example #1314664). You can type it with or without the #.'],
  ['Which email do I use?', 'The email you used at checkout on upairy.com. It has to match the order.'],
  ["It says there's no active subscription", "Use the email and order number from your Potty Up order on upairy.com. If you just subscribed, give it a minute and try again. If your subscription has ended, restart it from your account on upairy.com."],
  ["Is my child's data shared?", "Never sold or shared for ads. Your child's logs live on this phone and, if backup is on, are saved privately to your account so they move to a new phone. You can turn backup off or delete everything in Settings."],
];

export default function Auth() {
  const ins = useSafeAreaInsets();
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState(''); const [order, setOrder] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [faq, setFaq] = useState<number | null>(null);
  const [m, setM] = useState<Membership | null>(null);
  const [saved, setSaved] = useState<number | null>(null);
  const [other, setOther] = useState<string | null>(null);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const validOrder = order.replace(/\D/g, '').length >= 3;

  const onSignIn = async () => {
    setBusy(true); setErr('');
    try {
      await signInWithOrder(email, order);
      const mem = await checkMembership().catch(() => ({ plan: 'free', member: false, error: 'lookup_failed' } as Membership));
      // Only people with an active Potty Up subscription (or gifted access) get in.
      if (mem.plan !== 'plus') {
        await signOut();
        setErr(mem.error === 'lookup_failed' || mem.error === 'not_configured'
          ? "We couldn't check your subscription just now. Please try again in a minute."
          : `There's no active Potty Up subscription on ${email.trim()}. Use the email and order number from your Potty Up order on upairy.com.`);
        return;
      }
      setM(mem);
      const b = await fetchBackup().catch(() => null);
      setSaved(b && (b.data as any)?.onboarded ? b.at : null);
      setOther(otherOwner(email.trim().toLowerCase()));
      setDone(true);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  const finish = async (choice: 'replace' | 'keep' = 'replace') => {
    setBusy(true);
    const id = email.trim().toLowerCase();
    const restored = await afterSignIn(id, { id, plan: m?.plan ?? 'free', since: Date.now(), order: order.trim(), plusUntil: null }, choice).catch(() => null);
    if (restored) toast('Your data is back', 'Restored from ' + new Date(restored).toLocaleDateString());
  };

  let body;
  if (done) {
    body = <>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 30 }}><Icon name="check" size={36} color={C.brand} stroke={2.4} /></View>
      <T w="b" size={28} style={{ textAlign: 'center', marginTop: 20 }}>You're in</T>
      <Sub style={{ textAlign: 'center', marginTop: 8, marginBottom: 20, fontSize: 15 }}>{`Potty Up is linked to ${email.trim()}. Everything is ready to go.`}</Sub>
      <Card pad={4} style={{ paddingHorizontal: 18 }}>
        {['The full day-by-day program', 'Smart reminders and the AI coach', 'Potty songs, kid mode and rewards', '15% off at upairy.com']
          .map((x, i) => <Row key={x} first={i === 0} title={x} icon="check" />)}
      </Card>
      <View style={{ flex: 1, minHeight: 30 }} />
      {saved ? <Tip icon="check" tone="ok">{`We found your saved data from ${new Date(saved).toLocaleDateString()}. It will be restored to this phone.`}</Tip> : null}
      {other ? <Tip icon="info" tone="sun">{`This phone has ${S.child.name || 'a child'}'s logs from another account (${other}). ${saved ? 'Restoring your data will replace them.' : 'Starting fresh will remove them from this phone.'}${S.backup.on && S.backup.at ? '' : ' They are not backed up.'}`}</Tip> : null}
      <Btn title={busy ? 'Loading…' : other ? (saved ? 'Restore my data' : 'Start fresh') : saved ? 'Continue' : 'Set up your child'} onPress={() => finish('replace')} disabled={busy} />
      {other ? <Btn kind="text" title={`Keep ${S.child.name || 'these'} logs on this phone`} onPress={() => finish('keep')} disabled={busy} /> : null}
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
