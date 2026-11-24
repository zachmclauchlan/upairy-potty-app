// Sign in with the email from an upairy.com order plus its order number, last name or postcode. No password, no emailed code.
// The server checks the order belongs to that email (in Loop), then we check for an active Potty Up
// subscription on the same email. No "buy" button or link here: App Store rules for apps that unlock web purchases.
import { useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, Sub, Btn, Card, Input, Label, Row, Tip, toast } from './ui';
import Icon from './Icon';
import Logo from './Logo';
import { C } from '@/lib/theme';
import { signInWithOrder, checkMembership, signOut, type Membership } from '@/lib/backend';
import { afterSignIn, fetchBackup, otherOwner } from '@/lib/backup';
import { S } from '@/lib/store';

// "Help me log in": walks a parent to their order number, the way The Faith Made's sign-in help does.
const SEARCH = 'UpAiry order';
const INBOXES: [string, string][] = [
  ['Gmail', `https://mail.google.com/mail/#search/${encodeURIComponent(SEARCH).replace(/%20/g, '+')}+in%3Aanywhere`],
  ['Outlook', `https://outlook.live.com/mail/0/?search=${encodeURIComponent(SEARCH)}`],
  ['Yahoo', `https://mail.yahoo.com/d/search/keyword=${encodeURIComponent(SEARCH)}`],
];
const CONTACT = 'https://upairy.com/pages/contact';
const STUCK = [
  ["It says it can't match my order", "It's nearly always the email. It has to be the exact email the order confirmation was sent to, which may not be the one you use every day. If you paid with PayPal or Apple Pay, or someone else paid, try that email instead. For the second box, the postcode or last name has to be the one on that order."],
  ['Nothing turns up when I search', 'Check your spam and promotions folders first, that is where it usually hides. Then try one word at a time: UpAiry, then order. If Potty Up was a gift, the confirmation went to whoever paid.'],
  ["It says there's no active subscription", "Use the email and order number from your Potty Up order on upairy.com, not an order for pants only. If you just subscribed, give it a minute and try again. If your subscription has ended, restart it from your account on upairy.com."],
];
const MORE = [
  ['Someone else bought it, or I used a different email', "Use the email the order confirmation went to (the person who paid), with that order number, or the last name or postcode on it. They can sign in on your phone for you. Or contact us from the email you'd like to use and we'll move Potty Up onto it."],
  ['New here? How to get Potty Up', "Potty Up comes with an UpAiry Potty Up subscription from upairy.com. Once you've ordered, come back here and sign in with the email and order number from your order. That's it."],
  ["Is my child's data shared?", "Never sold or shared for ads. Your child's logs live on this phone and, if backup is on, are saved privately to your account so they move to a new phone. You can turn backup off or delete everything in Settings."],
];

export default function Auth() {
  const ins = useSafeAreaInsets();
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState(''); const [order, setOrder] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [faq, setFaq] = useState<number | null>(null); const [help, setHelp] = useState(false);
  const [m, setM] = useState<Membership | null>(null);
  const [saved, setSaved] = useState<number | null>(null);
  const [other, setOther] = useState<string | null>(null);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const validOrder = order.replace(/\D/g, '').length >= 3 || order.replace(/[^\p{L}]/gu, '').length >= 2; // order number, postcode or last name

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
      <Sub style={{ fontSize: 15, marginBottom: 20 }}>Use the email from your upairy.com order.</Sub>
      <Input label="Email used on your order" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
      <Input label="Order number, postcode or last name" value={order} onChangeText={setOrder} placeholder="Order number, postcode or last name" autoCapitalize="words" autoCorrect={false} autoComplete="off" />
      <Sub style={{ marginTop: -6, marginBottom: 14 }}>Your order number looks like #1314664. Can't find it? Just type the postcode your order went to, or your last name.</Sub>
      {err ? <Tip icon="info" tone="sun">{err}</Tip> : null}
      <Btn title={busy ? 'Checking…' : 'Sign in'} onPress={onSignIn} disabled={busy || !validEmail || !validOrder} />
      <Sub style={{ textAlign: 'center', marginTop: 12 }}>You'll stay signed in on this phone.</Sub>

      {/* Help me log in */}
      <Pressable onPress={() => { setHelp(!help); setFaq(null); }} accessibilityRole="button" accessibilityState={{ expanded: help }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 28, padding: 16, borderRadius: 18, backgroundColor: C.brandSoft }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' }}><T w="b" size={20} color="#fff">?</T></View>
        <View style={{ flex: 1 }}>
          <T w="b" size={17}>Help me log in</T>
          <Sub>{help ? 'Tap to hide' : '2 easy ways, no order number needed'}</Sub>
        </View>
        <Icon name={help ? 'chevD' : 'chevR'} size={20} color={C.brand} />
      </Pressable>
      {help ? <Card style={{ marginTop: 10 }}>
        <T w="s" size={15}>No order number needed</T>
        <T size={14} style={{ lineHeight: 21, marginTop: 4 }}>Type the email you ordered with, then the postcode your order went to (or your last name), and tap Sign in.</T>
        <T w="s" size={15} style={{ marginTop: 16 }}>Or use your order number</T>
        <T size={14} style={{ lineHeight: 21, marginTop: 4 }}>It's in the confirmation email UpAiry sent when you ordered.</T>
        <Label style={{ marginTop: 16 }}>SEARCH YOUR EMAIL FOR</Label>
        <View style={{ marginTop: 6, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: C.sunk }}>
          <T w="s" size={18} selectable>{SEARCH}</T>
        </View>
        {['Search your email for those words, or tap your inbox below and we search it for you.', 'Open the email that says Order #… confirmed.', 'The order number is at the top. It starts with #.', 'Type it in the second box above, with the email that order went to, and tap Sign in.']
          .map((x, i) => <View key={i} style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}><T w="s" size={12} color={C.brand}>{String(i + 1)}</T></View>
            <T size={14} style={{ flex: 1, lineHeight: 21 }}>{x}</T>
          </View>)}
        <Sub style={{ marginTop: 12 }}>The # is optional. Paste the whole line if that's easier, we only read the numbers.</Sub>
        <Label style={{ marginTop: 18 }}>OPEN YOUR INBOX</Label>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          {INBOXES.map(([n, url]) => <Pressable key={n} onPress={() => Linking.openURL(url).catch(() => {})} accessibilityRole="link"
            style={{ flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface }}>
            <T w="s" size={14}>{n}</T>
          </Pressable>)}
        </View>
        <Sub style={{ marginTop: 8, fontSize: 12 }}>These open your inbox in the browser. If the search box comes up empty, type the words in yourself.</Sub>
        <View style={{ marginTop: 10 }}>
          {STUCK.map(([q, a], i) => <View key={q}>
            <Row first={i === 0} title={q} onPress={() => setFaq(faq === i ? null : i)} right={<Icon name={faq === i ? 'chevD' : 'chevR'} size={18} color={C.ink3} />} />
            {faq === i ? <Sub style={{ paddingBottom: 14, marginTop: -4 }}>{a}</Sub> : null}
          </View>)}
        </View>
      </Card> : null}

      <View style={{ gap: 10, marginTop: 12 }}>
        {MORE.map(([q, a], i) => { const k = 10 + i, on = faq === k; return (
          <Pressable key={q} onPress={() => setFaq(on ? null : k)} accessibilityRole="button" accessibilityState={{ expanded: on }}
            style={{ paddingVertical: 16, paddingHorizontal: 18, borderRadius: 16, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <T w="s" size={15} style={{ flex: 1 }}>{q}</T>
              <Icon name={on ? 'chevD' : 'chevR'} size={18} color={C.ink3} />
            </View>
            {on ? <Sub style={{ marginTop: 10, lineHeight: 20 }}>{a}</Sub> : null}
          </Pressable>); })}
      </View>
      <Pressable onPress={() => Linking.openURL(CONTACT).catch(() => {})} accessibilityRole="link" style={{ marginTop: 22, alignItems: 'center' }}>
        <T w="s" size={14} color={C.brand} style={{ textAlign: 'center' }}>Can't sign in? Contact us and we'll find your order</T>
        <Sub style={{ marginTop: 4, fontSize: 12 }}>We usually reply within 1–2 business days.</Sub>
      </Pressable>
    </>;
  }
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ flexGrow: 1, paddingTop: ins.top + 24, paddingHorizontal: 24, paddingBottom: ins.bottom + 24 }} keyboardShouldPersistTaps="handled">
      {body}
    </ScrollView>
  );
}
