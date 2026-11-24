import { useEffect, useRef } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, Sub, Card, Row, Btn, Badge, Meter, SectionHead, toast } from '@/components/ui';
import Icon from '@/components/Icon';
import { Designs, ProductCard, openShop } from '@/components/Shop';
import { C, shadow } from '@/lib/theme';
import { S, useApp, update, resetAll } from '@/lib/store';
import { item, M, memberDays, quizScore } from '@/lib/logic';
import { emit } from '@/lib/bus';
import Logo from '@/components/Logo';
import { deleteAccount, refreshPlan, signOut as serverSignOut } from '@/lib/backend';

function confirm(title: string, msg: string, ok: () => void) {
  if (Platform.OS === 'web') { if (globalThis.confirm?.(`${title}\n\n${msg}`)) ok(); return; }
  Alert.alert(title, msg, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: ok }]);
}

export default function Settings() {
  useApp();
  const ins = useSafeAreaInsets();
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const scroll = useRef<any>(null); const shopY = useRef(0);
  useEffect(() => { if (focus === 'shop') setTimeout(() => scroll.current?.scrollTo({ y: shopY.current - 20, animated: true }), 350); }, [focus]);
  const d = memberDays(), free = S.account?.plan === 'free';
  const close = () => router.back();
  const open = (k: string) => { close(); setTimeout(() => emit(k), 350); };
  const signOut = () => { close(); serverSignOut(); update(s => { s.account = null; }); toast('Signed out'); };
  return (
    <ScrollView ref={scroll} style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingTop: Platform.OS === 'ios' ? 24 : ins.top + 16, paddingHorizontal: 20, paddingBottom: ins.bottom + 40 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <View><T w="m" size={13} color={C.ink2}>{S.child.name}'s app</T><T w="b" size={30} style={{ lineHeight: 34 }}>Settings</T></View>
        <Pressable onPress={close} accessibilityLabel="Close" style={[{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' }, shadow]}><Icon name="x" size={20} color={C.ink} /></Pressable>
      </View>
      <Card style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <T w="b" size={22} color={C.brandInk} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.brandSoft, textAlign: 'center', lineHeight: 56, overflow: 'hidden' }}>{(S.child.name[0] || '?').toUpperCase()}</T>
        <View style={{ flex: 1 }}><T w="s" size={18}>{S.child.name}</T><Sub>{S.child.age || 'Age not set'} · {M().name} · {item().t}</Sub></View>
        <Pressable onPress={() => open('editkid')} style={{ paddingVertical: 7, paddingHorizontal: 12, borderRadius: 10, backgroundColor: C.sunk }}><T w="s" size={13}>Edit</T></Pressable>
      </Card>
      <View style={{ borderRadius: 22, padding: 18, backgroundColor: C.brand, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View><T w="b" size={24} color="#fff">Potty Up</T><View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><T size={12} color="rgba(255,255,255,.8)">by</T><Logo width={56} color="white" /></View></View>
          {!free ? <Badge tone="white" label="Unlocked" /> : null}
        </View>
        {free ? <>
          <T size={14} color="rgba(255,255,255,.9)" style={{ marginTop: 8, marginBottom: 14 }}>You're on the free version. The full Potty Up adds the day-by-day program, smart reminders, the AI coach, songs and free UpAiry gear. Bought it on upairy.com? Make sure you signed in with the email you used at checkout.</T>
          <Btn kind="white" title="Check my purchase" onPress={async () => { const p = await refreshPlan(true).catch(() => null); toast(p?.plan === 'plus' ? 'Potty Up is unlocked' : 'No Potty Up purchase on ' + (S.account?.id ?? 'this email'), p?.plan === 'plus' ? 'Everything is ready' : 'Use the email from your upairy.com checkout'); }} />
        </> : <>
          <T size={14} color="rgba(255,255,255,.9)" style={{ marginTop: 8, marginBottom: 14 }}>The full program, smart reminders, the AI coach, songs, and real UpAiry gear as you go.</T>
          {([[30, 'Free 5-pack of training pants'], [60, 'Free waterproof bed mat']] as const).map(([n, t]) => <View key={t} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><T w="s" size={13} color="#fff">{t}</T><T size={13} color="#fff">{d >= n ? 'Unlocked' : `Day ${d} of ${n}`}</T></View>
            <Meter pct={d / n * 100} color="#fff" track="rgba(255,255,255,.2)" style={{ marginTop: 6 }} />
          </View>)}
          <T size={13} color="rgba(255,255,255,.85)">Plus 15% off everything at upairy.com while you have Potty Up.</T>
          <T size={13} color="rgba(255,255,255,.85)" style={{ marginTop: 10 }}>Manage or cancel Potty Up from your account on upairy.com.</T>
        </>}
      </View>
      <Card pad={4} style={{ paddingHorizontal: 18 }}>
        <Row first icon="users" tone="water" title={S.account?.id ?? 'Not signed in'} sub={free ? 'Free version' : 'Potty Up unlocked'} right={<Pressable onPress={signOut} style={{ paddingVertical: 7, paddingHorizontal: 12, borderRadius: 10, backgroundColor: C.sunk }}><T w="s" size={13}>Sign out</T></Pressable>} />
      </Card>
      <View onLayout={e => { shopY.current = e.nativeEvent.layout.y; }}><SectionHead title="Shop UpAiry" right="upairy.com" onRight={() => openShop('https://upairy.com')} /></View>
      <Designs />
      {['pants10', 'daykit', 'nightkit', 'bedmat', 'wetbag', 'soap'].map(k => <ProductCard key={k} k={k} />)}
      <SectionHead title="Training" />
      <Card pad={4} style={{ paddingHorizontal: 18 }}>
        <Row first icon="route" title="Method" sub={M().name} onPress={() => open('method')} />
        <Row icon="check" title="Readiness check" sub={quizScore() != null ? quizScore() + '% ready · retake any time' : '8 quick questions'} onPress={() => open('quiz')} />
        <Row icon="clock" tone="water" title="Potty timing and quiet hours" sub={S.mode === 'smart' ? 'Smart: program timing, then learned' : 'Every ' + S.interval + ' min'} onPress={() => open('timer')} />
        <Row icon="bell" tone="sun" title="Reminders" sub={S.rem.on ? `On · ${S.rem.lead} min heads-up` : 'Off'} onPress={() => open('reminders')} />
      </Card>
      <SectionHead title="Family" />
      <Card pad={4} style={{ paddingHorizontal: 18 }}>
        <Row first icon="plus" tone="try" title="Add a child" sub="Each child gets their own program" onPress={() => toast('Multiple children: coming soon', 'On the roadmap')} />
        <Row icon="users" tone="water" title="Invite a caregiver" sub="Partner or grandparent can log too" onPress={() => toast('Caregiver sharing: coming soon', 'On the roadmap')} />
        <Row icon="share" title="Share an update" sub="Text-ready summary for daycare or grandparents" onPress={() => open('handoff')} />
      </Card>
      <SectionHead title="App" />
      <Card pad={4} style={{ paddingHorizontal: 18 }}>
        <Row first icon="replay" tone="sun" title="How the app works" sub="Replay the intro" onPress={() => open('intro')} />
        <Row icon="chat" tone="water" title="AI coach" sub="On · 20 questions a day" onPress={() => open('aiinfo')} />
        <Row icon="shield" title="Your data" sub="Stored only on this phone. No ads, no tracking." onPress={() => Share.share({ message: JSON.stringify({ exported: new Date().toISOString(), child: S.child, method: S.method, events: S.events, checkins: S.checkins, days: S.days }, null, 2) }).catch(() => {})} right={<Icon name="download" size={18} color={C.ink3} />} />
        <Row icon="trash" tone="try" title="Delete my account and data" sub="Deletes your UpAiry account and everything on this phone" danger onPress={() => confirm('Delete your account?', 'This permanently deletes your UpAiry account and removes all logs and settings from this phone. It cannot be undone.', async () => { try { await deleteAccount(); close(); resetAll(); toast('Account deleted'); } catch (e) { toast((e as Error).message); } })} />
      </Card>
      <View style={{ alignItems: 'center', marginTop: 24, gap: 6 }}><Logo width={84} color="black" style={{ opacity: 0.35 }} /><Sub>Potty Up by UpAiry · version 1.0.0</Sub></View>
    </ScrollView>
  );
}
