// First screen: match the parent to their UpAiry order so their subscription unlocks.
// QA MODE: any input is accepted. Production calls UpAiry's account service (Shopify order lookup).
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { T, Sub, Btn, Card, Input, Label, Row, toast } from './ui';
import Icon from './Icon';
import { C, F } from '@/lib/theme';
import Logo from './Logo';
import { update } from '@/lib/store';

const SIGNUP_URL = 'https://upairy.com/account/register';
type Mode = 'email' | 'order' | 'code' | 'password' | 'create' | 'found';
const FAQ = [
  ['Where do I find my order number?', "It's in the order confirmation email from UpAiry, and on your packing slip."],
  ['I bought from a shop or Amazon', "Create a free account, then email us your receipt and we'll add UpAiry Plus."],
  ["The email doesn't find my order", "Try the order number instead, or the email you used at checkout if it's different."],
  ["Is my child's data shared?", "No. Your child's logs stay on this phone. Your account only holds your email and order."],
];

export default function Auth() {
  const ins = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('email');
  const [email, setEmail] = useState(''); const [order, setOrder] = useState(''); const [last, setLast] = useState(''); const [zip, setZip] = useState('');
  const [code, setCode] = useState(''); const [pw, setPw] = useState(''); const [sent, setSent] = useState(false);
  const [faq, setFaq] = useState<number | null>(null);
  const [found, setFound] = useState<{ id: string; plan: 'plus' | 'free' } | null>(null);

  const find = () => { setFound({ id: email || (order ? 'Order ' + (order.startsWith('#') ? order : '#' + order) : '') || 'your order', plan: 'plus' }); setMode('found'); };
  const back = <Pressable onPress={() => { setMode('email'); setSent(false); }} hitSlop={12} style={{ marginLeft: -6, marginBottom: 4 }}><Icon name="chevL" size={24} color={C.ink2} /></Pressable>;

  let body;
  if (mode === 'found' && found) {
    const perks = found.plan === 'plus' ? ['The full day-by-day program', 'Smart reminders and the AI coach', 'Potty songs, kid mode and rewards', 'Free UpAiry gear as you go'] : ['Logging, timer and history', 'Readiness check', 'Built-in guides'];
    body = <>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 30 }}><Icon name="check" size={36} color={C.brand} stroke={2.4} /></View>
      <T w="b" size={28} style={{ textAlign: 'center', marginTop: 20, lineHeight: 33 }}>{found.plan === 'plus' ? 'Order found' : 'Account ready'}</T>
      <Sub style={{ textAlign: 'center', marginTop: 8, marginBottom: 20, fontSize: 15, lineHeight: 21 }}>{found.plan === 'plus' ? `UpAiry Plus is included with your order, linked to ${found.id}.` : `Signed in as ${found.id}. You can link an order later in Settings to unlock UpAiry Plus.`}</Sub>
      <Card pad={4} style={{ paddingHorizontal: 18 }}>{perks.map((x, i) => <Row key={x} first={i === 0} title={x} icon="check" />)}</Card>
      <View style={{ flex: 1, minHeight: 30 }} />
      <Btn title="Set up your child" onPress={() => update(s => { s.account = { id: found.id, plan: found.plan, since: Date.now() }; s.memberSince = Date.now(); })} />
    </>;
  } else if (mode === 'code') {
    body = <>
      {back}<T w="b" size={28} style={{ lineHeight: 33, marginBottom: 8 }}>Email me a code</T>
      <Sub style={{ fontSize: 15, marginBottom: 20 }}>We'll send a 6-digit code to the email you used to order.</Sub>
      <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      {sent ? <Input label="6-digit code" value={code} onChangeText={setCode} placeholder="123456" keyboardType="number-pad" autoComplete="one-time-code" /> : null}
      <Btn title={sent ? 'Sign in' : 'Send code'} onPress={() => { if (sent) find(); else { setSent(true); toast('Code sent', email ? 'Check ' + email : 'Check your inbox'); } }} />
      {sent ? <Btn kind="text" title="Send a new code" onPress={() => toast('New code sent')} /> : null}
    </>;
  } else if (mode === 'password') {
    body = <>
      {back}<T w="b" size={28} style={{ lineHeight: 33, marginBottom: 8 }}>Sign in</T>
      <Sub style={{ fontSize: 15, marginBottom: 20 }}>Use the email and password for your UpAiry account.</Sub>
      <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <Input label="Password" value={pw} onChangeText={setPw} placeholder="Password" secureTextEntry autoComplete="password" />
      <Btn title="Sign in" onPress={find} />
      <Btn kind="text" title="Forgot password? Email me a code" onPress={() => setMode('code')} />
    </>;
  } else if (mode === 'create') {
    body = <>
      {back}<T w="b" size={28} style={{ lineHeight: 33, marginBottom: 8 }}>Create a free account</T>
      <Sub style={{ fontSize: 15, marginBottom: 20 }}>Haven't ordered from UpAiry yet? Make a free account on upairy.com, then come back here.</Sub>
      <Btn title="Open upairy.com" onPress={() => WebBrowser.openBrowserAsync(SIGNUP_URL)} />
      <Btn kind="ghost" title="I've created my account" style={{ marginTop: 10 }} onPress={() => { setFound({ id: email || 'your new account', plan: 'free' }); setMode('found'); }} />
    </>;
  } else {
    const byOrder = mode === 'order';
    body = <>
      <Logo width={132} />
      <T w="b" size={28} style={{ marginTop: 18, marginBottom: 8, lineHeight: 33 }}>Find your UpAiry order</T>
      <Sub style={{ fontSize: 15, lineHeight: 21, marginBottom: 20 }}>Bought UpAiry training pants? Find your order to unlock UpAiry Plus, included with your purchase.</Sub>
      <View style={{ flexDirection: 'row', backgroundColor: C.sunk, borderRadius: 12, padding: 3, marginBottom: 16 }}>
        {(['email', 'order'] as const).map(m => <Pressable key={m} onPress={() => setMode(m)} style={{ flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: mode === m ? C.surface : 'transparent', alignItems: 'center' }}><T w="s" size={13} color={mode === m ? C.ink : C.ink2}>{m === 'email' ? 'Order email' : 'Order number'}</T></Pressable>)}
      </View>
      {byOrder ? <>
        <Input label="Order number" value={order} onChangeText={setOrder} placeholder="e.g. #1234" autoCapitalize="none" />
        <Input label="Last name" value={last} onChangeText={setLast} placeholder="As on the order" autoComplete="family-name" />
        <Input label="ZIP / postcode" value={zip} onChangeText={setZip} placeholder="e.g. 1010" autoComplete="postal-code" />
      </> : <Input label="Email used for your order" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />}
      <Btn title="Find my order" onPress={find} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22, marginBottom: 10 }}><View style={{ flex: 1, height: 1, backgroundColor: C.line }} /><Label color={C.ink3}>Other ways in</Label><View style={{ flex: 1, height: 1, backgroundColor: C.line }} /></View>
      <Card pad={2} style={{ paddingHorizontal: 18 }}>
        <Row first icon="share" title="Email me a code" sub="No password needed" onPress={() => setMode('code')} />
        <Row icon="key" title="I have a password" sub="Sign in to your UpAiry account" onPress={() => setMode('password')} />
        <Row icon="plus" title="Create a free account" sub="No order yet? Start free" onPress={() => setMode('create')} />
      </Card>
      <T w="s" size={15} style={{ marginTop: 14, marginBottom: 8, marginLeft: 2 }}>Questions</T>
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
export const _fonts = F;
