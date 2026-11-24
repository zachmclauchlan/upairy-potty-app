// Guided tour: shown once after setup, replayable from Settings. Instead of separate slides, it dims the
// real app and spotlights each part with a speech bubble, so parents learn where things actually are.
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, Sub, Btn, IconBox } from './ui';
import type { IconName } from './Icon';
import { C, shadow, Tone } from '@/lib/theme';
import { S, update } from '@/lib/store';
import { emit } from '@/lib/bus';
import { measureTarget, type Rect } from '@/lib/tour';
import { COACH_NAME } from '@/lib/coach';

type Target = string | { tab: number } | null;
type Step = { target: Target; icon: IconName; tone: Tone; title: string; body: string; demo?: 'notif' };

const steps = (): Step[] => {
  const nm = S.child.name || 'your child';
  return [
    { target: null, icon: 'spark', tone: 'ok', title: `Welcome to Potty Up`, body: `A quick look around. It takes 30 seconds, and you can replay it any time from ${nm}'s settings.` },
    { target: 'day', icon: 'sunrise', tone: 'sun', title: 'Your day in three steps', body: 'Morning: log the wake-up. Through the day: offer the potty and log it. Evening: a 20-second check-in that plans tomorrow.' },
    { target: 'timer', icon: 'clock', tone: 'water', title: 'The potty timer', body: `It counts down to the next try and learns ${nm}'s rhythm from your logs. Tap Log potty after every try, and Pause for naps or outings.` },
    { target: null, icon: 'bell', tone: 'sun', title: 'Reminders you can log from', body: `A few minutes before ${nm} is likely to need to go, you'll get a nudge. Tap a button on it to log in one tap.`, demo: 'notif' },
    { target: { tab: 1 }, icon: 'route', tone: 'ok', title: 'Program', body: 'Your method, step by step. Each step has a goal, and the evening check-in moves you on, repeats, or steps back.' },
    { target: { tab: 2 }, icon: 'chat', tone: 'water', title: `${COACH_NAME}, your potty coach`, body: `Stuck on poo, accidents or daycare? Ask ${COACH_NAME} anything, any time. ${COACH_NAME} knows ${nm}'s program and recent logs.` },
    { target: { tab: 3 }, icon: 'star', tone: 'sun', title: 'Kid zone', body: 'Stars, stickers, rewards you choose, potty songs and kid mode, for the little one.' },
    { target: { tab: 4 }, icon: 'chart', tone: 'ok', title: 'Progress', body: `What the app has learned about ${nm}, and every day you've logged.` },
    { target: 'kid', icon: 'users', tone: 'ok', title: `Tap ${nm}'s name`, body: 'Settings, reminders, quiet hours, backup and the UpAiry shop live here.' },
  ];
};

export default function Intro({ open, onDone }: { open: boolean; onDone: () => void }) {
  const win = useWindowDimensions(); const ins = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const all = steps(); const s = all[i]; const last = i === all.length - 1;
  const tabH = 66 + Math.max(ins.bottom, 8);

  // when the tour opens, go to Today, scrolled to the top
  useEffect(() => { if (open) { setI(0); router.navigate('/'); setTimeout(() => emit('tour-start'), 50); } }, [open]);

  // find the spotlight for this step
  useEffect(() => {
    if (!open) return;
    let live = true; setRect(null);
    const t = s.target;
    if (t && typeof t === 'object') {
      const w = win.width / 5;
      setRect({ x: w * t.tab, y: win.height - tabH, w, h: tabH - Math.max(ins.bottom, 8) + 4 });
    } else if (typeof t === 'string') {
      setTimeout(() => measureTarget(t).then(r => { if (live) setRect(r); }), 280);
    }
    return () => { live = false; };
  }, [open, i, win.width, win.height]);

  const finish = () => { update(st => { st.toured = true; }); setI(0); onDone(); };
  if (!open) return null;

  // spotlight hole (padded, kept on screen) and where the bubble goes
  const pad = 8;
  const hole = rect ? {
    x: Math.max(4, rect.x - pad), y: Math.max(ins.top, rect.y - pad),
    w: Math.min(win.width - 8, rect.w + pad * 2), h: Math.min(rect.h + pad * 2, (typeof s.target === 'string' ? win.height - tabH : win.height) - Math.max(ins.top, rect.y - pad) - 4),
  } : null;
  const below = hole ? hole.y + hole.h / 2 < win.height / 2 : false;
  const bubbleTop = hole ? (below ? hole.y + hole.h + 12 : undefined) : undefined;
  const bubbleBottom = hole && !below ? win.height - hole.y + 12 : undefined;
  const dim = 'rgba(18,24,18,0.66)';

  const bubble = (
    <View style={[{ backgroundColor: C.surface, borderRadius: 22, padding: 18, marginHorizontal: 16 }, shadow]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <IconBox name={s.icon} tone={s.tone} size={38} />
        <T w="b" size={18} style={{ flex: 1 }}>{s.title}</T>
      </View>
      <Sub style={{ fontSize: 14.5 }}>{s.body}</Sub>
      {s.demo === 'notif' ? <View style={{ backgroundColor: C.sunk, borderRadius: 16, padding: 12, marginTop: 12 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' }}><T w="fun" size={16} color="#fff">U</T></View>
          <View style={{ flex: 1 }}><T w="s" size={13}>{S.child.name || 'Your child'} may need to go soon</T><Sub style={{ fontSize: 12 }}>Good time to offer the potty, around 10:40 AM.</Sub></View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
          {['Wee on the potty', 'Nothing came', 'Accident'].map(b => <View key={b} style={{ flex: 1, backgroundColor: C.surface, borderRadius: 10, paddingVertical: 7, alignItems: 'center' }}><T w="m" size={11.5} color={C.water}>{b}</T></View>)}
        </View>
      </View> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 4, flex: 1 }}>{all.map((_, k) => <View key={k} style={{ width: k === i ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: k === i ? C.brand : C.line }} />)}</View>
        {i > 0 ? <Pressable onPress={() => setI(i - 1)} hitSlop={10}><T w="s" size={14} color={C.ink2}>Back</T></Pressable> : null}
        <Btn title={last ? "Let's go" : 'Next'} onPress={() => last ? finish() : setI(i + 1)} style={{ paddingHorizontal: 22, minHeight: 44 }} />
      </View>
    </View>
  );

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={finish}>
      <View style={{ flex: 1 }}>
        {hole ? <>
          {/* four dim panels around the spotlight */}
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: hole.y, backgroundColor: dim }} />
          <View style={{ position: 'absolute', left: 0, right: 0, top: hole.y + hole.h, bottom: 0, backgroundColor: dim }} />
          <View style={{ position: 'absolute', left: 0, width: hole.x, top: hole.y, height: hole.h, backgroundColor: dim }} />
          <View style={{ position: 'absolute', left: hole.x + hole.w, right: 0, top: hole.y, height: hole.h, backgroundColor: dim }} />
          <View pointerEvents="none" style={{ position: 'absolute', left: hole.x, top: hole.y, width: hole.w, height: hole.h, borderRadius: 18, borderWidth: 2.5, borderColor: '#fff' }} />
          <View style={{ position: 'absolute', left: 0, right: 0, top: bubbleTop, bottom: bubbleBottom }}>{bubble}</View>
        </> : <View style={{ flex: 1, backgroundColor: dim, justifyContent: 'center' }}>{bubble}</View>}
        <Pressable onPress={finish} hitSlop={12} style={{ position: 'absolute', top: ins.top + (Platform.OS === 'android' ? 12 : 8), left: 18, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.18)' }}>
          <T w="s" size={13} color="#fff">Skip tour</T>
        </Pressable>
      </View>
    </Modal>
  );
}
