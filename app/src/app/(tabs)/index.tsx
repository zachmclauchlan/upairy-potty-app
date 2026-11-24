import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Screen, Header, Card, T, Sub, Btn, Badge, IconBox, SectionHead, Tip, toast } from '@/components/ui';
import Icon, { IconName } from '@/components/Icon';
import KidChip from '@/components/KidChip';
import Timeline from '@/components/Timeline';
import Night from '@/components/Night';
import { C, shadow } from '@/lib/theme';
import { S, useApp, update, sod, DAY, addDays } from '@/lib/store';
import { dayStats, fmt, greet, hm, isPotty, item, lastPoo, learned, NEED, onDay, timerState } from '@/lib/logic';
import { logQuick } from '@/lib/actions';
import { emit, on } from '@/lib/bus';
import { tourRef } from '@/lib/tour';
import { GateCard, LessonCard, courseLabel } from '@/components/CourseBits';

function useNow(ms = 5000) { const [n, setN] = useState(Date.now()); useEffect(() => { const t = setInterval(() => setN(Date.now()), ms); return () => clearInterval(t); }, [ms]); return n; }

function Rhythm() {
  const now = Date.now(), today = sod(now), h = new Date().getHours();
  const woke = onDay(today, e => e.type === 'wake').length > 0, n = onDay(today, isPotty).length, ci = !!S.checkins[today];
  const yday = addDays(today, -1), missed = !S.checkins[yday] && onDay(yday, isPotty).length > 0 && h < 17;
  const phase = ci ? 3 : h >= 17 ? 2 : woke ? 1 : 0;
  const cell = (done: boolean, isNow: boolean, ic: IconName, tone: any, t: string, s: string, act?: () => void) => (
    <Pressable onPress={act} disabled={!act} style={[{ flex: 1, backgroundColor: C.surface, borderRadius: 16, padding: 10, gap: 6, borderWidth: 2, borderColor: isNow ? C.brand : 'transparent' }, shadow]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <IconBox name={ic} tone={tone} size={28} round iconSize={15} />
        <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.6, borderColor: done ? C.brand : '#CFCBC1', backgroundColor: done ? C.brand : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{done ? <Icon name="check" size={11} color="#fff" stroke={3} /> : null}</View>
      </View>
      <T w="s" size={12.5} style={{ lineHeight: 16 }}>{t}</T>
      <T size={11} color={C.ink2} style={{ lineHeight: 14 }}>{s}</T>
    </Pressable>
  );
  return <>
    {missed ? <Pressable onPress={() => emit('checkin', yday)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: C.brandSoft, marginBottom: 12 }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Icon name="moon" size={18} color={C.brand} /></View>
      <View style={{ flex: 1 }}><T w="s" size={14} color={C.brandInk}>Finish yesterday's check-in</T><T size={12} color={C.ink2}>20 seconds. It sets up today's plan.</T></View>
      <Icon name="chevR" size={18} color={C.brandInk} />
    </Pressable> : null}
    <View ref={tourRef('day')} collapsable={false} style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
      {cell(woke, phase === 0, 'sunrise', 'sun', 'Morning', "Log the wake-up, read today's plan", woke ? undefined : () => { logQuick('wake'); toast('Good morning!', `Today: ${item().t}. The timer has started.`); })}
      {cell(n >= 4, phase === 1, 'drop', 'ok', 'Through the day', n ? `${n} logged so far` : 'Offer when the timer says, log it', () => emit('log'))}
      {cell(ci, phase === 2, 'moon', 'water', 'Evening', ci ? 'Checked in. Tomorrow is set' : '20-second check-in', ci ? undefined : () => emit('checkin', today))}
    </View>
  </>;
}

function Ring() {
  const now = useNow();
  const p = timerState(now);
  const Rr = 96, Cc = 2 * Math.PI * Rr;
  let big = '–', unit = '', note: [IconName, string] = ['info', ''], frac = 0, color = C.brand, small = false;
  if (!p) { big = item().iv ? 'Log a wake-up to start' : 'Routine sits today'; small = true; unit = item().iv ? '' : 'After waking, meals and before bath'; note = ['info', item().iv ? `${item().t}: offer every ${item().iv} min` : 'No timer needed at this step']; }
  else if (p.state === 'paused') { big = 'Paused'; small = true; unit = `until ${fmt(p.until)}`; note = ['pause', `${p.why || 'Paused'}. No reminders. Logging anything restarts the timer.`]; }
  else if (p.state === 'quiet-soon') { big = 'Nearly bedtime'; small = true; unit = 'A last wee before bed'; note = ['moon', `Quiet hours start at ${hm(S.quietStart)}. No more timed tries today.`]; }
  else if (p.state === 'quiet') { big = 'Quiet hours'; small = true; unit = `Timer starts again at ${fmt(p.until)}`; note = ['moon', 'No reminders overnight. You can still log anything.']; }
  else {
    const rem = p.due - now;
    note = [p.why[0] as IconName, p.why[1]];
    if (rem <= 0) { big = 'Offer now'; small = true; unit = Math.round(-rem / 60000) ? `due ${Math.round(-rem / 60000)} min ago` : 'right on time'; color = C.acc; frac = 1; }
    else { big = String(Math.ceil(rem / 60000)); unit = `min · around ${fmt(p.due)}`; frac = rem / p.total; }
  }
  return <>
    <View style={{ width: 216, height: 216, alignSelf: 'center', marginVertical: 4 }}>
      <Svg width={216} height={216} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={108} cy={108} r={Rr} stroke={C.sunk} strokeWidth={12} fill="none" />
        <Circle cx={108} cy={108} r={Rr} stroke={color} strokeWidth={12} fill="none" strokeLinecap="round" strokeDasharray={`${Cc}`} strokeDashoffset={Cc * (1 - frac)} />
      </Svg>
      <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 } as any}>
        <T w="s" size={small ? (big === 'Offer now' ? 36 : 21) : 60} color={big === 'Offer now' ? C.acc : C.ink} style={{ textAlign: 'center', letterSpacing: small ? -0.3 : -2, lineHeight: small ? (big === 'Offer now' ? 42 : 27) : 64 }}>{big}</T>
        {unit ? <T size={13} color={C.ink2} style={{ textAlign: 'center', marginTop: 4 }}>{unit}</T> : null}
      </View>
    </View>
    <View style={{ flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 6, backgroundColor: C.sunk, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14, marginTop: 4, maxWidth: '100%' }}>
      <Icon name={note[0]} size={15} color={C.ink2} /><T size={13} color={C.ink2} style={{ flexShrink: 1 }}>{note[1]}</T>
    </View>
  </>;
}

function PlanCard() {
  const today = sod(Date.now()), ci = S.checkins[today];
  const late = new Date().getHours() >= 16;
  return (
    <>
      <GateCard compact />
      <LessonCard full={false} />
      <Pressable onPress={ci ? undefined : () => emit('checkin', today)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: -2, marginBottom: 12, padding: 12, borderRadius: 14, backgroundColor: !ci && late ? C.brandSoft : C.sunk }}>
        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: ci ? C.brandSoft : late ? '#fff' : C.surface, alignItems: 'center', justifyContent: 'center' }}><Icon name={ci ? 'check' : 'moon'} size={17} color={C.brand} /></View>
        <View style={{ flex: 1 }}>
          <T w="s" size={14}>{ci ? "Today's check-in done" : 'Evening check-in (optional)'}</T>
          <T size={12} color={C.ink2}>{ci ? ci : late ? 'How did today go? 20 seconds.' : 'Tonight: see how today went. The course moves on either way.'}</T>
        </View>
        {!ci ? <Icon name="chevR" size={18} color={C.ink2} /> : null}
      </Pressable>
    </>
  );
}

export default function Today() {
  useApp();
  const today = sod(Date.now()), st = dayStats(today), L = learned(), nm = S.child.name;
  const lp = lastPoo(); const pooDays = lp ? Math.floor((today - sod(lp.ts)) / DAY) : null;
  const todays = onDay(today).reverse();
  const learnN = Math.min(L.gap.n, NEED.gap);
  const [night, setNight] = useState(S.method === 'night');
  const scroll = useRef<any>(null);
  // the guided tour starts from the top of Today, in day view
  useEffect(() => on('tour-start', () => { setNight(false); scroll.current?.scrollTo?.({ y: 0, animated: false }); }), []);
  return (
    <Screen scrollRef={scroll}>
      <Header title={`${nm}'s day`} eyebrow={greet()} right={<View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable onPress={() => emit('handoff')} accessibilityLabel="Share an update" style={[{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' }, shadow]}><Icon name="share" size={19} color={C.ink} /></Pressable>
        <KidChip tour="kid" />
      </View>} />
      <DayNightSwitch night={night} set={setNight} />
      {night ? <Night /> : <>
        <Rhythm />
        <View ref={tourRef('timer')} collapsable={false}><Card style={{ paddingTop: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <T w="s" size={12} color={C.ink2} style={{ letterSpacing: 0.3 }}>NEXT POTTY TRY</T>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Badge tone="grey" icon={S.pausedUntil > Date.now() ? 'sunrise' : 'pause'} label={S.pausedUntil > Date.now() ? 'Resume' : 'Pause'} onPress={() => { if (S.pausedUntil > Date.now()) { update(s => { s.pausedUntil = Date.now(); }); toast('Timer resumed', 'A try soon is a good idea'); } else emit('pause'); }} />
              <Badge tone="grey" icon="chevD" label={S.mode === 'smart' ? (L.gap.ok ? 'Learned timing' : 'Smart timing') : `Every ${S.interval} min`} onPress={() => emit('timer')} />
            </View>
          </View>
          <Ring />
          {S.mode === 'smart' && !L.gap.ok ? <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: C.waterSoft }}>
            <Icon name="spark" color={C.water} />
            <View style={{ flex: 1 }}>
              <T w="s" size={13} color={C.waterInk}>Learning {nm}'s rhythm</T>
              <T size={12.5} color="#28507F">Log every wee and accident. After {NEED.gap} timed gaps the timer switches to {nm}'s own pattern.</T>
              <View style={{ flexDirection: 'row', gap: 3, marginTop: 6 }}>{[...Array(NEED.gap)].map((_, i) => <View key={i} style={{ width: 14, height: 5, borderRadius: 9, backgroundColor: i < learnN ? C.water : 'rgba(58,120,201,.2)' }} />)}</View>
            </View>
          </View> : null}
          <Btn title="Log potty" icon="plus" onPress={() => emit('log')} style={{ marginTop: 16 }} />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            {([['drink', 'cup', 'water', 'Drink'], ['meal', 'meal', 'meal', 'Meal'], ['wake', 'sunrise', 'sun', 'Woke up'], ['sit', 'hour', 'ok', 'Sit timer']] as const).map(([k, ic, tone, l]) =>
              <Pressable key={k} onPress={() => { if (k === 'sit') emit('sit'); else { logQuick(k); toast({ drink: 'Drink logged', meal: 'Meal logged', wake: 'Wake-up logged' }[k]); } }} style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 11, borderRadius: 14, backgroundColor: C.sunk, transform: [{ scale: pressed ? 0.96 : 1 }] })}>
                <IconBox name={ic} tone={tone} size={34} round iconSize={17} /><T w="s" size={12}>{l}</T>
              </Pressable>)}
          </View>
        </Card></View>
        <View style={[{ flexDirection: 'row', backgroundColor: C.surface, borderRadius: 22, paddingVertical: 14 }, shadow]}>
          {([[st.s, 'On potty', C.brand], [st.a, 'Accidents', C.acc], [st.told, 'Told you', C.ink], [st.rate == null ? '–' : st.rate + '%', 'Success', C.ink]] as const).map(([v, l, c], i) =>
            <View key={l} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i ? 1 : 0, borderLeftColor: C.line }}><T w="s" size={22} color={c}>{String(v)}</T><T w="m" size={11} color={C.ink2}>{l}</T></View>)}
        </View>
        {pooDays != null && pooDays >= 2 ? <View style={{ marginTop: 12 }}><Tip icon="poo" tone="poo"><T w="s" size={14}>No poo for {pooDays} days</T><Sub>Holding in poo is common when training. Offer water and fruit{L.poo.ok ? `, and a sit around ${fmt(sod(Date.now()) + (L.poo.v as number) * 3.6e6)} when ${nm} usually goes` : ', and a sit 20 minutes after meals'}.</Sub><Pressable onPress={() => emit('article', 0)}><T w="s" size={13} color={C.poo} style={{ marginTop: 6 }}>What helps</T></Pressable></Tip></View> : null}
        <SectionHead title={courseLabel()} right="Course" onRight={() => emit('tab', 'program')} />
        <PlanCard />
        <SectionHead title="Timeline" right={`${todays.length} logged`} />
        <Card pad={6} style={{ paddingHorizontal: 18 }}>{todays.length ? <Timeline list={todays} del /> : <Sub style={{ textAlign: 'center', paddingVertical: 20 }}>Nothing logged yet today.{'\n'}Tap “Woke up” to start the timer.</Sub>}</Card>
      </>}
    </Screen>
  );
}

function DayNightSwitch({ night, set }: { night: boolean; set: (v: boolean) => void }) {
  return <View style={{ flexDirection: 'row', backgroundColor: C.sunk, borderRadius: 12, padding: 3, marginBottom: 14 }}>
    {([[false, 'sun', 'Daytime'], [true, 'moon', 'Night']] as const).map(([v, ic, l]) =>
      <Pressable key={l} onPress={() => set(v)} style={{ flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 7, borderRadius: 10, backgroundColor: night === v ? C.surface : 'transparent' }}>
        <Icon name={ic} size={16} color={night === v ? C.ink : C.ink2} /><T w="s" size={13} color={night === v ? C.ink : C.ink2}>{l}</T>
      </Pressable>)}
  </View>;
}
