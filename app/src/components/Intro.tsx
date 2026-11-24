// Guided tour: shown once after setup, replayable from Settings. It sits over the live app: it dims
// everything except one spotlight, and on "tap" steps the parent taps the real thing (a tab) to move on,
// so they actually walk through Today, Program, Lara, the Kid zone and Progress.
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, View, useWindowDimensions } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, Sub, Btn, IconBox } from './ui';
import type { IconName } from './Icon';
import { C, shadow, Tone } from '@/lib/theme';
import { S, update } from '@/lib/store';
import { emit } from '@/lib/bus';
import { measureTarget, scrollerFor, type Rect } from '@/lib/tour';
import { COACH_NAME } from '@/lib/coach';

type Screen = 'index' | 'program' | 'coach' | 'kid' | 'progress';
const PATH: Record<Screen, string> = { index: '/', program: '/program', coach: '/coach', kid: '/kid', progress: '/progress' };
const TAB: Record<Screen, number> = { index: 0, program: 1, coach: 2, kid: 3, progress: 4 };
type Step = {
  on: Screen;                       // the screen this step happens on
  target?: string;                  // tagged element to spotlight (tourRef)
  tap?: Screen;                     // the parent taps this tab to continue
  icon: IconName; tone: Tone; title: string; body: string; demo?: 'notif';
};

const steps = (): Step[] => {
  const nm = S.child.name || 'your child';
  return [
    { on: 'index', icon: 'spark', tone: 'ok', title: 'Welcome to Potty Up', body: `Let's walk through the app together. You'll tap around the real thing, and it takes about a minute.` },
    { on: 'index', target: 'day', icon: 'sunrise', tone: 'sun', title: 'Your day in three steps', body: 'Morning: log the wake-up. Through the day: offer the potty and log it. Evening: an optional check-in.' },
    { on: 'index', target: 'timer', icon: 'clock', tone: 'water', title: 'The potty timer', body: `It counts down to the next try and learns ${nm}'s rhythm from your logs. Tap Log potty after every try. Pause it for naps and outings.` },
    { on: 'index', icon: 'bell', tone: 'sun', title: 'Reminders you can log from', body: `A few minutes before ${nm} is likely to need to go, you'll get a nudge. Tap a button on it to log in one tap.`, demo: 'notif' },
    { on: 'index', tap: 'program', icon: 'route', tone: 'ok', title: 'Now tap Program', body: "That's where your day-by-day course lives." },
    { on: 'program', target: 'course-hero', icon: 'route', tone: 'ok', title: 'Your course', body: 'Where you are, day by day. Days move on by themselves, and you can pause for illness or holidays.' },
    { on: 'program', target: 'course-lesson', icon: 'book', tone: 'sun', title: "Today's lesson", body: 'What to do, what to say, and what is normal today. Tick things off as you go. At the end of each stage the app suggests when to move on, and you decide.' },
    { on: 'program', tap: 'coach', icon: 'chat', tone: 'water', title: `Now tap Coach to meet ${COACH_NAME}`, body: 'Your potty coach, any time of day or night.' },
    { on: 'coach', target: 'lara-chat', icon: 'chat', tone: 'water', title: `This is ${COACH_NAME}`, body: `Tap a topic or type your own question. ${COACH_NAME} knows ${nm}'s course and recent logs, and gives real steps and the words to use.` },
    { on: 'coach', tap: 'kid', icon: 'star', tone: 'sun', title: 'Now tap Kid zone', body: `The fun part, for ${nm}.` },
    { on: 'kid', target: 'kid-stars', icon: 'star', tone: 'sun', title: 'Stars', body: `${nm} earns 2 stars for a wee or poo on the potty, 1 for trying, and 3 for a dry night. "Hand the phone to ${nm}" opens kid mode. "Reset stars" starts fresh.` },
    { on: 'kid', target: 'kid-stickers', icon: 'smile', tone: 'sun', title: 'Sticker chart', body: 'A new sticker for every success on the potty. Show it off together at the end of the day.' },
    { on: 'kid', target: 'kid-rewards', icon: 'gift', tone: 'sun', title: 'Rewards you choose', body: `Tap "Add reward" to add your own, like picking the bedtime story or a trip to the park. ${nm} spends stars to unlock them.` },
    { on: 'kid', tap: 'progress', icon: 'chart', tone: 'ok', title: 'Last one: tap Progress', body: 'See how far you have come.' },
    { on: 'progress', target: 'progress-toggle', icon: 'chart', tone: 'ok', title: 'Insights and history', body: `Insights shows what the app has learned about ${nm}. History has every day you've logged.` },
    { on: 'progress', target: 'chip-progress', icon: 'users', tone: 'ok', title: `Tap ${nm}'s name any time`, body: 'Settings, reminders, quiet hours, backup and the UpAiry shop live there. You can replay this tour from Settings too.' },
  ];
};

export default function Intro({ open, onDone }: { open: boolean; onDone: () => void }) {
  const win = useWindowDimensions(); const ins = useSafeAreaInsets(); const path = usePathname();
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const all = steps(); const s = all[Math.min(i, all.length - 1)]; const last = i === all.length - 1;
  const tabH = 66 + Math.max(ins.bottom, 8);
  const here = path === '' ? '/' : path;
  const iRef = useRef(i); iRef.current = i;

  // start on Today, scrolled to the top
  useEffect(() => { if (open) { setI(0); router.navigate('/'); setTimeout(() => emit('tour-start'), 50); } }, [open]);

  // be on the right screen for this step (e.g. after Back)
  useEffect(() => {
    if (open && here !== PATH[s.on]) router.navigate(PATH[s.on] as any);
  }, [open, i]); // eslint-disable-line react-hooks/exhaustive-deps

  // "tap" steps: move on as soon as the parent opens the tab they were asked to
  useEffect(() => {
    if (open && s.tap && here === PATH[s.tap]) { const k = iRef.current; setTimeout(() => setI(k + 1), 250); }
  }, [open, here, i]); // eslint-disable-line react-hooks/exhaustive-deps

  // find the spotlight, scrolling it into view if needed
  useEffect(() => {
    if (!open) return;
    let live = true; setRect(null);
    if (s.tap) {
      const w = win.width / 5;
      setRect({ x: w * TAB[s.tap], y: win.height - tabH, w, h: tabH - Math.max(ins.bottom, 8) + 4 });
      return;
    }
    if (!s.target) return;
    const top = ins.top + 70, bottom = win.height - tabH - 16;
    (async () => {
      await new Promise(r => setTimeout(r, 320));
      let r = await measureTarget(s.target!);
      const sc = scrollerFor(s.on);
      if (r && sc && (r.y < top || r.y + Math.min(r.h, bottom - top) > bottom)) {
        sc.scrollTo(sc.y() + r.y - top);
        await new Promise(res => setTimeout(res, 450));
        r = await measureTarget(s.target!);
      }
      if (live) setRect(r);
    })();
    return () => { live = false; };
  }, [open, i, win.width, win.height]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = () => { update(st => { st.toured = true; }); setI(0); onDone(); router.navigate('/'); };
  if (!open) return null;

  const pad = 8;
  const clampBottom = s.tap ? win.height : win.height - tabH;
  const hole = rect ? {
    x: Math.max(4, rect.x - pad), y: Math.max(ins.top + 44, rect.y - pad),
    w: Math.min(win.width - 8, rect.w + pad * 2), h: Math.max(20, Math.min(rect.h + pad * 2 - Math.max(0, ins.top + 44 - (rect.y - pad)), clampBottom - Math.max(ins.top + 44, rect.y - pad) - 4)),
  } : null;
  const below = hole ? hole.y + hole.h / 2 < win.height / 2 : false;
  const dim = 'rgba(18,24,18,0.66)';

  const bubble = (
    <View style={[{ backgroundColor: C.surface, borderRadius: 20, padding: 20, marginHorizontal: 16 }, shadow]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <IconBox name={s.icon} tone={s.tone} />
        <T w="fun" size={22} style={{ flex: 1 }}>{s.title}</T>
      </View>
      <Sub style={{ fontSize: 15 }}>{s.body}</Sub>
      {s.demo === 'notif' ? <View style={{ backgroundColor: C.sunk, borderRadius: 16, padding: 12, marginTop: 12 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' }}><T w="fun" size={16} color="#fff">U</T></View>
          <View style={{ flex: 1 }}><T w="s" size={13}>{S.child.name || 'Your child'} may need to go soon</T><Sub style={{ fontSize: 12 }}>Good time to offer the potty, around 10:40 AM.</Sub></View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
          {['Wee on the potty', 'Nothing came', 'Accident'].map(b => <View key={b} style={{ flex: 1, backgroundColor: C.surface, borderRadius: 10, paddingVertical: 7, alignItems: 'center' }}><T w="m" size={12} color={C.water}>{b}</T></View>)}
        </View>
      </View> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 4, flex: 1, flexWrap: 'wrap' }}>{all.map((_, k) => <View key={k} style={{ width: k === i ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: k === i ? C.brand : C.line }} />)}</View>
        {i > 0 ? <Pressable onPress={() => setI(all[i - 1].tap ? i - 2 : i - 1)} hitSlop={10}><T w="s" size={14} color={C.ink2}>Back</T></Pressable> : null}
        {s.tap
          ? <View style={{ justifyContent: 'center', paddingHorizontal: 16, minHeight: 44, borderRadius: 22, backgroundColor: C.brandSoft, borderWidth: 2, borderColor: C.ink }}><T w="s" size={14}>Tap it below</T></View>
          : <Btn small title={last ? "Let's go" : 'Next'} onPress={() => last ? finish() : setI(i + 1)} style={{ paddingHorizontal: 24 }} />}
      </View>
    </View>
  );

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 1000, elevation: 1000 }}>
      {hole ? <>
        {/* four dim panels around the spotlight; taps inside the spotlight reach the app underneath */}
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: hole.y, backgroundColor: dim }} />
        <View style={{ position: 'absolute', left: 0, right: 0, top: hole.y + hole.h, bottom: 0, backgroundColor: dim }} />
        <View style={{ position: 'absolute', left: 0, width: hole.x, top: hole.y, height: hole.h, backgroundColor: dim }} />
        <View style={{ position: 'absolute', left: hole.x + hole.w, right: 0, top: hole.y, height: hole.h, backgroundColor: dim }} />
        <View pointerEvents="none" style={{ position: 'absolute', left: hole.x, top: hole.y, width: hole.w, height: hole.h, borderRadius: 18, borderWidth: 2.5, borderColor: '#fff' }} />
        <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: below ? hole.y + hole.h + 12 : undefined, bottom: below ? undefined : win.height - hole.y + 12 }}>{bubble}</View>
      </> : <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: dim, justifyContent: 'center' }}>{bubble}</View>}
      <Pressable onPress={finish} hitSlop={12} style={{ position: 'absolute', top: ins.top + (Platform.OS === 'android' ? 12 : 8), left: 18, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.18)' }}>
        <T w="s" size={13} color="#fff">Skip tour</T>
      </Pressable>
    </View>
  );
}
