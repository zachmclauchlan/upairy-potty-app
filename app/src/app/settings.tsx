import { useEffect, useRef } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, Sub, Card, Row, Btn, Badge, SectionHead, toast } from '@/components/ui';
import Icon from '@/components/Icon';
import { Designs, ProductCard, openShop } from '@/components/Shop';
import { C, shadow } from '@/lib/theme';
import { S, useApp, update, resetAll, sod } from '@/lib/store';
import Constants from 'expo-constants';
import { cancelAll } from '@/lib/notifications';
import { item, M, quizScore } from '@/lib/logic';
import { emit } from '@/lib/bus';
import Logo from '@/components/Logo';
import { deleteAccount, refreshPlan, signOut as serverSignOut } from '@/lib/backend';
import { backupNow, turnOffBackup, turnOnBackup } from '@/lib/backup';

function confirm(title: string, msg: string, ok: () => void, okLabel = 'Delete') {
  if (Platform.OS === 'web') { if (globalThis.confirm?.(`${title}\n\n${msg}`)) ok(); return; }
  Alert.alert(title, msg, [{ text: 'Cancel', style: 'cancel' }, { text: okLabel, style: 'destructive', onPress: ok }]);
}

export default function Settings() {
  useApp();
  const ins = useSafeAreaInsets();
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const scroll = useRef<any>(null); const shopY = useRef(0);
  useEffect(() => { if (focus === 'shop') setTimeout(() => scroll.current?.scrollTo({ y: shopY.current - 20, animated: true }), 350); }, [focus]);
  const free = S.account?.plan === 'free';
  const close = () => router.back();
  const open = (k: string) => { close(); setTimeout(() => emit(k), 350); };
  const signOut = async () => { await backupNow().catch(() => false); close(); cancelAll(); serverSignOut(); update(s => { s.account = null; }); toast('Signed out'); };
  const clearSample = () => confirm('Clear the sample week?', 'This removes the example logs and check-ins so you can start fresh. Your child, method and settings stay.', () => { update(s => { s.events = []; s.checkins = {}; s.days = {}; s.steps = {}; s.pIdx = 0; s.pDay = 1; s.start = sod(Date.now()); s.spent = 0; s.sample = false; }); toast('Sample data cleared', 'Ready for real logs'); }, 'Clear');
  const version = `${Constants.expoConfig?.version ?? '1.0.0'}`;
  const ago = (t: number) => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : new Date(t).toLocaleDateString(); };
  const toggleBackup = () => S.backup.on
    ? confirm('Turn off backup?', "This deletes the copy saved on your account. Your data stays on this phone, but it won't move to a new phone.", async () => { await turnOffBackup().catch(() => {}); toast('Backup off', 'Saved copy deleted'); }, 'Turn off')
    : turnOnBackup().then(ok => toast(ok ? 'Backup on' : 'Backup on, will save when online', ok ? 'Saved to your account' : undefined)).catch(() => {});
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
          <T size={14} color="rgba(255,255,255,.9)" style={{ marginTop: 8, marginBottom: 14 }}>You're on the free version. The full Potty Up adds the day-by-day program, smart reminders, the AI coach, songs, kid mode and rewards. Bought it on upairy.com? Make sure you signed in with the email you used at checkout.</T>
          <Btn kind="white" title="Check my purchase" onPress={async () => { const p = await refreshPlan(true).catch(() => null); toast(p?.plan === 'plus' ? 'Potty Up is unlocked' : 'No Potty Up purchase on ' + (S.account?.id ?? 'this email'), p?.plan === 'plus' ? 'Everything is ready' : 'Use the email from your upairy.com checkout'); }} />
        </> : <>
          <T size={14} color="rgba(255,255,255,.9)" style={{ marginTop: 8, marginBottom: 14 }}>The full program, smart reminders, the AI coach, songs, kid mode and rewards.</T>
          <T size={13} color="rgba(255,255,255,.85)">15% off everything at upairy.com while you have Potty Up.</T>
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
        <Row first icon="share" title="Share an update" sub="Text-ready summary for daycare or grandparents" onPress={() => open('handoff')} />
      </Card>
      <SectionHead title="App" />
      <Card pad={4} style={{ paddingHorizontal: 18 }}>
        <Row first icon="replay" tone="sun" title="How the app works" sub="Replay the intro" onPress={() => open('intro')} />
        {S.sample ? <Row icon="trash" tone="sun" title="Clear the sample week" sub="Remove the example logs and start fresh" onPress={clearSample} /> : null}
        <Row icon="chat" tone="water" title="Lara, your AI coach" sub="On · 20 questions a day" onPress={() => open('aiinfo')} />
        <Row icon="shield" tone="water" title="Back up to my account" sub={S.backup.on ? `On · saved ${S.backup.at ? ago(S.backup.at) : 'soon'} · restores on a new phone` : 'Off · data is only on this phone'} onPress={toggleBackup} right={<T w="s" size={13} color={S.backup.on ? C.brand : C.ink3}>{S.backup.on ? 'On' : 'Off'}</T>} />
        <Row icon="download" title="Export my data" sub="Save a copy as a file. No ads, no tracking." onPress={() => Share.share({ message: JSON.stringify({ exported: new Date().toISOString(), child: S.child, method: S.method, events: S.events, checkins: S.checkins, days: S.days }, null, 2) }).catch(() => {})} right={<Icon name="download" size={18} color={C.ink3} />} />
        <Row icon="trash" tone="try" title="Delete my account and data" sub="Deletes your account, its backup, and everything on this phone" danger onPress={() => confirm('Delete your account?', 'This permanently deletes your account and its backup, and removes all logs and settings from this phone. It cannot be undone.', async () => { try { await deleteAccount(); close(); cancelAll(); resetAll(); toast('Account deleted'); } catch (e) { toast((e as Error).message); } })} />
      </Card>
      <SectionHead title="Help" />
      <Card pad={4} style={{ paddingHorizontal: 18 }}>
        <Row first icon="chat" title="Help and contact" sub="Sign-in, reminders, subscription, deleting your account" onPress={() => openShop('https://upairy.com/pages/potty-up-support')} />
        <Row icon="shield" title="Privacy policy" onPress={() => openShop('https://upairy.com/pages/potty-up-privacy')} />
        <Row icon="book" title="Terms of use" onPress={() => openShop('https://upairy.com/pages/potty-up-terms')} />
      </Card>
      <View style={{ alignItems: 'center', marginTop: 24, gap: 6 }}><Logo width={84} color="black" style={{ opacity: 0.35 }} /><Sub>Potty Up by UpAiry · version {version}</Sub><Sub style={{ fontSize: 12 }}>General guidance, not medical advice.</Sub></View>
    </ScrollView>
  );
}
