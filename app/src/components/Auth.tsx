// Sign in with the email from an upairy.com order plus its order number, last name or postcode. No password, no emailed code.
// The server checks the order belongs to that email (in Loop), then we check for an active Potty Up
// subscription on the same email. No "buy" button or link to the website here: App Store rules for apps that unlock web purchases.
// The Apple subscription option (AppleSub below) is switched off for now: see APPLE_ENABLED in lib/apple.ts.
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, Sub, Btn, Card, Input, Label, Link, Row, Tip, toast } from './ui';
import Icon from './Icon';
import Logo from './Logo';
import { C, outline, shadow } from '@/lib/theme';
import { signInWithOrder, checkMembership, signOut, type Membership } from '@/lib/backend';
import { afterSignIn, fetchBackup, otherOwner } from '@/lib/backup';
import { S } from '@/lib/store';
import { appleAvailable, loadOffer, startApple, restoreApple, type AppleOffer, type AppleAccount } from '@/lib/apple';

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

const TERMS = 'https://upairy.com/pages/potty-up-terms', PRIVACY = 'https://upairy.com/pages/potty-up-privacy';

/** iPhone only: subscribe through Apple, for parents with no upairy.com order. Sits with the questions, closed until tapped. */
function AppleSub({ onIn }: { onIn: (a: AppleAccount) => void }) {
  const [open, setOpen] = useState(false);
  const [offer, setOffer] = useState<AppleOffer | null | undefined>(undefined);   // undefined = still loading
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null); const [err, setErr] = useState('');
  useEffect(() => { if (open && offer === undefined) loadOffer().then(setOffer); }, [open, offer]);
  const run = (what: 'buy' | 'restore') => async () => {
    setBusy(what); setErr('');
    try {
      const a = what === 'buy' ? await startApple() : await restoreApple(true);
      if (a) onIn(a);
      else if (what === 'restore') setErr('There is no active Potty Up subscription on this Apple ID.');
    } catch (e) { setErr((e as Error).message); } finally { setBusy(null); }
  };
  const terms = offer ? (offer.trial ? `Free for ${offer.trial}, then ${offer.price} per ${offer.period}.` : `${offer.price} per ${offer.period}.`) : '';
  return (
    <View style={[{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, backgroundColor: C.surface }, outline]}>
      <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityState={{ expanded: open }} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <T w="s" size={15} style={{ flex: 1 }}>No order? Subscribe with Apple</T>
        <Icon name={open ? 'chevD' : 'chevR'} size={16} color={C.ink2} />
      </Pressable>
      {open ? <View style={{ marginTop: 8 }}>
        {offer === undefined ? <Sub>Loading…</Sub> : offer === null ? <Sub>{"The App Store isn't answering right now. Close this and try again in a minute."}</Sub> : <>
          <Sub style={{ lineHeight: 20 }}>{`Potty Up, billed through your Apple ID. ${terms} It renews automatically until you cancel, which you can do any time in your Apple ID settings.`}</Sub>
          <Btn small title={busy === 'buy' ? 'Opening…' : offer.trial ? 'Start free trial' : 'Subscribe'} onPress={run('buy')} disabled={!!busy} style={{ marginTop: 12 }} />
        </>}
        {err ? <Sub style={{ marginTop: 12, color: C.accInk }}>{err}</Sub> : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 14 }}>
          <Link label={busy === 'restore' ? 'Checking…' : 'Restore purchase'} onPress={busy ? undefined : run('restore')} color={C.brandInk} />
          <Link label="Terms" onPress={() => Linking.openURL(TERMS).catch(() => {})} />
          <Link label="Privacy" onPress={() => Linking.openURL(PRIVACY).catch(() => {})} />
        </View>
      </View> : null}
    </View>
  );
}

export default function Auth() {
  const ins = useSafeAreaInsets();
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState(''); const [order, setOrder] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [faq, setFaq] = useState<number | null>(null); const [help, setHelp] = useState(false);
  const [m, setM] = useState<Membership | null>(null);
  const [saved, setSaved] = useState<number | null>(null);
  const [other, setOther] = useState<string | null>(null);
  const [apple, setApple] = useState<AppleAccount | null>(null);   // signed in through an Apple subscription
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
  // Subscribed or restored through Apple: already signed in, so go straight to the "You're in" screen.
  const onApple = async (a: AppleAccount) => {
    setApple(a);
    const b = await fetchBackup().catch(() => null);
    setSaved(b && (b.data as any)?.onboarded ? b.at : null);
    setOther(otherOwner(a.id));
    setDone(true);
  };
  const finish = async (choice: 'replace' | 'keep' = 'replace') => {
    setBusy(true);
    const id = apple ? apple.id : email.trim().toLowerCase();
    const account = apple
      ? { id, plan: 'plus' as const, since: Date.now(), order: null, plusUntil: apple.plusUntil, apple: true }
      : { id, plan: m?.plan ?? 'free', since: Date.now(), order: order.trim(), plusUntil: null };
    const restored = await afterSignIn(id, account, choice).catch(() => null);
    if (restored) toast('Your data is back', 'Restored from ' + new Date(restored).toLocaleDateString());
  };

  let body;
  if (done) {
    body = <>
      <View style={[{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 32 }, shadow]}><Icon name="check" size={36} color={C.ink} stroke={2.4} /></View>
      <T w="fun" size={36} style={{ textAlign: 'center', marginTop: 20 }}>You're in</T>
      <Sub style={{ textAlign: 'center', marginTop: 8, marginBottom: 20, fontSize: 15 }}>{apple ? 'Your Apple subscription is active. Everything is ready to go.' : `Potty Up is linked to ${email.trim()}. Everything is ready to go.`}</Sub>
      <Card pad={4} style={{ paddingHorizontal: 16 }}>
        {['The full day-by-day program', 'Smart reminders and the AI coach', 'Potty songs, kid mode and rewards', '15% off at upairy.com']
          .map((x, i) => <Row key={x} first={i === 0} title={x} icon="check" />)}
      </Card>
      <View style={{ flex: 1, minHeight: 30 }} />
      {saved ? <Tip icon="check" tone="ok">{`We found your saved data from ${new Date(saved).toLocaleDateString()}. It will be restored to this phone.`}</Tip> : null}
      {other ? <Tip icon="info" tone="sun">{`This phone has ${S.child.name || 'a child'}'s logs from another account (${other.startsWith('apple-') ? 'an Apple subscription' : other}). ${saved ? 'Restoring your data will replace them.' : 'Starting fresh will remove them from this phone.'}${S.backup.on && S.backup.at ? '' : ' They are not backed up.'}`}</Tip> : null}
      <Btn title={busy ? 'Loading…' : other ? (saved ? 'Restore my data' : 'Start fresh') : saved ? 'Continue' : 'Set up your child'} onPress={() => finish('replace')} disabled={busy} />
      {other ? <Btn kind="text" title={`Keep ${S.child.name || 'these'} logs on this phone`} onPress={() => finish('keep')} disabled={busy} /> : null}
    </>;
  } else {
    body = <>
      <Logo width={96} />
      <T w="fun" size={44} color={C.brand} style={{ marginTop: 16 }}>Potty Up</T>
      <T w="fun" size={28} style={{ marginTop: 20 }}>Sign in</T>
      <Sub style={{ fontSize: 15, marginBottom: 20 }}>Use the email from your upairy.com order</Sub>
      <Input label="Email used on your order" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
      <Input label="Order number, postcode or last name" value={order} onChangeText={setOrder} placeholder="Order number, postcode or last name" autoCapitalize="words" autoCorrect={false} autoComplete="off" />
      <Sub style={{ marginTop: -8, marginBottom: 16 }}>Your order number looks like #1314664. Can't find it? Just type the postcode your order went to, or your last name.</Sub>
      {err ? <Tip icon="info" tone="sun">{err}</Tip> : null}
      <Btn title={busy ? 'Checking…' : 'Sign in'} onPress={onSignIn} disabled={busy || !validEmail || !validOrder} />
      <Sub style={{ textAlign: 'center', marginTop: 16 }}>You'll stay signed in on this phone</Sub>

      {/* Help me log in */}
      <Pressable onPress={() => { setHelp(!help); setFaq(null); }} accessibilityRole="button" accessibilityState={{ expanded: help }}
        style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 32, padding: 16, borderRadius: 20, backgroundColor: C.brandSoft }, shadow]}>
        <View style={[{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' }, outline]}><T w="fun" size={22}>?</T></View>
        <View style={{ flex: 1 }}>
          <T w="fun" size={20}>Help me log in</T>
          <Sub>{help ? 'Tap to hide' : '2 easy ways, no order number needed'}</Sub>
        </View>
        <Icon name={help ? 'chevD' : 'chevR'} size={18} color={C.ink} />
      </Pressable>
      {help ? <Card style={{ marginTop: 16, marginBottom: 4 }}>
        <T w="s" size={15}>No order number needed</T>
        <T size={14} style={{ lineHeight: 21, marginTop: 4 }}>Type the email you ordered with, then the postcode your order went to (or your last name), and tap Sign in.</T>
        <T w="s" size={15} style={{ marginTop: 16 }}>Or use your order number</T>
        <T size={14} style={{ lineHeight: 21, marginTop: 4 }}>It's in the confirmation email UpAiry sent when you ordered.</T>
        <Label style={{ marginTop: 16 }}>Search your email for</Label>
        <View style={{ marginTop: 6, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: C.sunk }}>
          <T w="s" size={17} selectable>{SEARCH}</T>
        </View>
        {['Search your email for those words, or tap your inbox below and we search it for you.', 'Open the email that says Order #… confirmed.', 'The order number is at the top. It starts with #.', 'Type it in the second box above, with the email that order went to, and tap Sign in.']
          .map((x, i) => <View key={i} style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.ink }}><T w="s" size={12}>{String(i + 1)}</T></View>
            <T size={14} style={{ flex: 1, lineHeight: 21 }}>{x}</T>
          </View>)}
        <Sub style={{ marginTop: 12 }}>The # is optional. Paste the whole line if that's easier, we only read the numbers.</Sub>
        <Label style={{ marginTop: 20 }}>Open your inbox</Label>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          {INBOXES.map(([n, url]) => <Pressable key={n} onPress={() => Linking.openURL(url).catch(() => {})} accessibilityRole="link"
            style={[{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 99, backgroundColor: C.surface }, outline]}>
            <T w="s" size={14}>{n}</T>
          </Pressable>)}
        </View>
        <Sub style={{ marginTop: 8, fontSize: 12 }}>These open your inbox in the browser. If the search box comes up empty, type the words in yourself.</Sub>
        <View style={{ marginTop: 12 }}>
          {STUCK.map(([q, a], i) => <View key={q}>
            <Row first={i === 0} title={q} onPress={() => setFaq(faq === i ? null : i)} right={<Icon name={faq === i ? 'chevD' : 'chevR'} size={18} color={C.ink3} />} />
            {faq === i ? <Sub style={{ paddingBottom: 14, marginTop: -4 }}>{a}</Sub> : null}
          </View>)}
        </View>
      </Card> : null}

      <View style={{ gap: 12, marginTop: 16 }}>
        {MORE.map(([q, a], i) => { const k = 10 + i, on = faq === k; return (
          <Pressable key={q} onPress={() => setFaq(on ? null : k)} accessibilityRole="button" accessibilityState={{ expanded: on }}
            style={[{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, backgroundColor: C.surface }, outline]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <T w="s" size={15} style={{ flex: 1 }}>{q}</T>
              <Icon name={on ? 'chevD' : 'chevR'} size={16} color={C.ink2} />
            </View>
            {on ? <Sub style={{ marginTop: 8, lineHeight: 20 }}>{a}</Sub> : null}
          </Pressable>); })}
        {appleAvailable() ? <AppleSub onIn={onApple} /> : null}
      </View>
      <Pressable onPress={() => Linking.openURL(CONTACT).catch(() => {})} accessibilityRole="link" style={{ marginTop: 24, alignItems: 'center' }}>
        <T w="s" size={14} color={C.brandInk} style={{ textAlign: 'center' }}>Can't sign in? Contact us and we'll find your order</T>
        <Sub style={{ marginTop: 4, fontSize: 12 }}>We usually reply within 1–2 business days</Sub>
      </Pressable>
    </>;
  }
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ flexGrow: 1, paddingTop: ins.top + 24, paddingHorizontal: 24, paddingBottom: ins.bottom + 24 }} keyboardShouldPersistTaps="handled">
      {body}
    </ScrollView>
  );
}
