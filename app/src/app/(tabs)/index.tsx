import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Screen, Header, Card, T, Sub, Btn, IconBtn, Link, Seg, SectionHead, Tip, toast } from '@/components/ui';
import Icon, { IconName } from '@/components/Icon';
import KidChip from '@/components/KidChip';
import Timeline from '@/components/Timeline';
import Night from '@/components/Night';
import Sticker from '@/components/Sticker';
import { C, outline, shadow, TONES, Tone } from '@/lib/theme';
import { S, useApp, update, sod, DAY, addDays } from '@/lib/store';
import { dayStats, fmt, hm, isPotty, item, lastPoo, learned, NEED, onDay, timerState } from '@/lib/logic';
import { logQuick } from '@/lib/actions';
import { emit, on } from '@/lib/bus';
import { tourRef } from '@/lib/tour';
import { GateCard, LessonCard, courseLabel } from '@/components/CourseBits';

function useNow(ms = 5000) { const [n, setN] = useState(Date.now()); useEffect(() => { const t = setInterval(() => setN(Date.now()), ms); return () => clearInterval(t); }, [ms]); return n; }

/** The day as a line you move along: morning, through the day, evening. */
function Rhythm() {
  const now = Date.now(), today = sod(now), h = new Date().getHours();
  const woke = onDay(today, e => e.type === 'wake').length > 0, n = onDay(today, isPotty).length, ci = !!S.checkins[today];
  const yday = addDays(today, -1), missed = !S.checkins[yday] && onDay(yday, isPotty).length > 0 && h < 17;
  const phase = ci ? 3 : h >= 17 ? 2 : woke ? 1 : 0;
  const step = (i: number, done: boolean, t: string, s: string, act?: () => void) => {
    const isNow = phase === i;
    return (
      <Pressable key={t} onPress={act} disabled={!act} style={{ flex: 1, borderTopWidth: 4, borderTopColor: done || isNow ? C.brand : C.line, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <T w="s" size={13} color={done && !isNow ? C.ink2 : C.ink}>{t}</T>
          {done ? <Icon name="check" size={13} color={C.brand} stroke={2.6} /> : null}
        </View>
        <T size={12} color={C.ink2}>{s}</T>
      </Pressable>
    );
  };
  return <>
    {missed ? <Pressable onPress={() => emit('checkin', yday)} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, backgroundColor: C.brandSoft, marginBottom: 16 }, outline]}>
      <Icon name="moon" size={18} color={C.ink} />
      <View style={{ flex: 1 }}><T w="s" size={14}>Finish yesterday's check-in</T><T size={12} color={C.ink2}>20 seconds. It sets up today's plan</T></View>
      <Icon name="chevR" size={16} color={C.ink} />
    </Pressable> : null}
    <View ref={tourRef('day')} collapsable={false} style={{ flexDirection: 'row', gap: 4, marginBottom: 20 }}>
      {step(0, woke, 'Morning', woke ? 'Wake-up logged' : 'Log the wake-up', woke ? undefined : () => { logQuick('wake'); toast('Wake-up logged', `Today: ${item().t}. The timer has started`); })}
      {step(1, n >= 4, 'Through the day', n ? `${n} logged so far` : 'Offer, then log it', () => emit('log'))}
      {step(2, ci, 'Evening', ci ? 'Checked in' : '20-second check-in', ci ? undefined : () => emit('checkin', today))}
    </View>
  </>;
}

const TICKS = 45;
/** The gap between tries as a ruler. Green ticks are the minutes still to go; the bead is now. */
function Ruler({ gone }: { gone: number | null }) {
  return (
    <View style={{ height: 32, marginTop: 24 }}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        {[...Array(TICKS + 1)].map((_, k) => { const left = gone != null && gone < 1 && k / TICKS >= gone; return <View key={k} style={{ width: 3, height: k % 5 === 0 ? 22 : 12, borderRadius: 1.5, backgroundColor: left ? C.brand : C.ink, opacity: left ? 1 : 0.2 }} />; })}
      </View>
      {gone != null ? <View style={{ position: 'absolute', left: `${Math.max(0, Math.min(1, gone)) * 100}%`, top: 0, bottom: 0, width: 3, marginLeft: -1.5, borderRadius: 1.5, backgroundColor: C.ink }}>
        <View style={[{ position: 'absolute', top: -10, left: -5.5, width: 14, height: 14, borderRadius: 7, backgroundColor: gone >= 1 ? C.accSoft : C.hi }, outline]} />
      </View> : null}
    </View>
  );
}

function Timer() {
  const now = useNow();
  const p = timerState(now);
  let big = '', unit = '', sub = '', note: [IconName, string] = ['info', ''], gone: number | null = null, ends: [string, string, string] | null = null, due = false;
  if (!p) { big = item().iv ? 'Log a wake-up to start' : 'Routine sits today'; sub = item().iv ? '' : 'After waking, meals and before bath'; note = ['info', item().iv ? `${item().t}: offer every ${item().iv} min` : 'No timer needed at this step']; }
  else if (p.state === 'paused') { big = 'Paused'; sub = `until ${fmt(p.until)}`; note = ['pause', `${p.why || 'Paused'}. No reminders. Logging anything restarts the timer`]; }
  else if (p.state === 'quiet-soon') { big = 'Nearly bedtime'; sub = 'A last wee before bed'; note = ['moon', `Quiet hours start at ${hm(S.quietStart)}, so there are no more timed tries today. Tap Start timer to keep going tonight`]; }
  else if (p.state === 'quiet') { big = 'Quiet hours'; sub = `Timer is off until ${fmt(p.until)}`; note = ['moon', 'No reminders overnight. You can still log anything. Tap Start timer to turn it on tonight']; }
  else {
    const rem = p.due - now;
    note = [p.why[0] as IconName, p.why[1]];
    ends = [fmt(p.due - p.total), 'now', `${fmt(p.due)} next`];
    if (rem <= 0) { due = true; big = 'Offer now'; sub = Math.round(-rem / 60000) ? `due ${Math.round(-rem / 60000)} min ago` : 'right on time'; gone = 1; }
    else { big = String(Math.ceil(rem / 60000)); unit = 'min'; gone = 1 - rem / p.total; }
  }
  const paused = S.pausedUntil > Date.now();
  // Quiet hours (or just before them): the timer is off, so the button turns it on for tonight instead of offering a pause.
  const quiet = p?.state === 'quiet' || p?.state === 'quiet-soon';
  const awake = (S.quietSkip ?? 0) > now;   // the parent turned the timer on tonight
  const startTonight = () => { const until = p && 'until' in p ? p.until : 0; update(s => { s.quietSkip = until; s.pausedUntil = 0; }); toast('Timer on for tonight', `Quiet hours are back tomorrow at ${hm(S.quietStart)}`); };
  return <>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <T w="s" size={14}>Next potty try</T>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        {quiet ? <Link icon="sunrise" label="Start timer" onPress={startTonight} /> :
        <Link icon={paused ? 'sunrise' : 'pause'} label={paused ? 'Resume' : 'Pause'} onPress={() => { if (paused) { update(s => { s.pausedUntil = Date.now(); }); toast('Timer resumed', 'A try soon is a good idea'); } else emit('pause'); }} />}
        <Link after="chevD" label={S.mode === 'smart' ? (learned().gap.ok ? 'Learned timing' : 'Smart timing') : `Every ${S.interval} min`} onPress={() => emit('timer')} />
      </View>
    </View>
    {unit ? <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
      <T w="fun" size={96} style={{ lineHeight: 104, fontVariant: ['tabular-nums'] }}>{big}</T>
      <T w="fun" size={28}>{unit}</T>
    </View> : <View style={{ marginTop: 12 }}>
      <T w="fun" size={due ? 44 : 30} color={due ? C.acc : C.ink}>{big}</T>
      {sub ? <T size={14} color={C.ink2}>{sub}</T> : null}
    </View>}
    <Ruler gone={gone} />
    {ends ? <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
      <T size={12} color={C.ink3}>{ends[0]}</T>{!due ? <T size={12} color={C.ink3}>{ends[1]}</T> : null}<T w="s" size={12} color={C.brandInk}>{ends[2]}</T>
    </View> : null}
    {note[1] ? <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12 }}>
      <View style={{ marginTop: 2 }}><Icon name={note[0]} size={15} color={C.ink2} /></View><T size={13} color={C.ink2} style={{ flex: 1 }}>{note[1]}</T>
    </View> : null}
    {awake && !quiet ? <View style={{ marginTop: 12 }}><Link icon="moon" label="Timer is on tonight. Back to quiet hours" onPress={() => { update(s => { s.quietSkip = 0; }); toast('Quiet hours on'); }} /></View> : null}
  </>;
}

/** Today's potty successes as the stickers they earned, with the day's numbers beside them. */
function StickerStrip({ day }: { day: number }) {
  const st = dayStats(day);
  const wins = Math.max(0, S.events.filter(e => isPotty(e) && e.outcome === 'success').length - (S.stickerBase ?? 0));
  const SLOTS = 7, shown = Math.min(st.s, SLOTS);
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {[...Array(SLOTS)].map((_, k) => k < shown
          ? <View key={k} style={[{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' }, shadow]}><Sticker i={Math.max(0, wins - shown + k)} /></View>
          : <View key={k} style={{ width: 40, height: 40, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: C.line }} />)}
      </View>
      <View style={{ flexDirection: 'row', marginTop: 16 }}>
        {([[st.s, 'On potty'], [st.a, 'Accidents'], [st.told, 'Told you'], [st.rate == null ? '–' : st.rate + '%', 'Success']] as const).map(([v, l]) =>
          <View key={l} style={{ flex: 1 }}><T w="fun" size={28} style={{ fontVariant: ['tabular-nums'] }}>{String(v)}</T><T size={12} color={C.ink2}>{l}</T></View>)}
      </View>
    </View>
  );
}

function PlanCard() {
  const today = sod(Date.now()), ci = S.checkins[today];
  const late = new Date().getHours() >= 16;
  return (
    <>
      <GateCard compact />
      <LessonCard full={false} />
      <Pressable onPress={ci ? undefined : () => emit('checkin', today)} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, backgroundColor: !ci && late ? C.brandSoft : C.surface }, outline]}>
        <Icon name={ci ? 'check' : 'moon'} size={18} color={C.ink} />
        <View style={{ flex: 1 }}>
          <T w="s" size={14}>{ci ? "Today's check-in done" : 'Evening check-in (optional)'}</T>
          <T size={12} color={C.ink2}>{ci ? ci : late ? 'How did today go? 20 seconds' : 'Tonight: see how today went. The course moves on either way'}</T>
        </View>
        {!ci ? <Icon name="chevR" size={16} color={C.ink2} /> : null}
      </Pressable>
    </>
  );
}

const QUICK = [['drink', 'cup', 'water', 'Drink'], ['meal', 'meal', 'meal', 'Meal'], ['wake', 'sunrise', 'sun', 'Woke up'], ['sit', 'hour', 'ok', 'Sit timer']] as const;

export default function Today() {
  useApp();
  const today = sod(Date.now()), L = learned(), nm = S.child.name;
  const lp = lastPoo(); const pooDays = lp ? Math.floor((today - sod(lp.ts)) / DAY) : null;
  const todays = onDay(today).reverse();
  const learnN = Math.min(L.gap.n, NEED.gap);
  const [night, setNight] = useState(S.method === 'night');
  const scroll = useRef<any>(null);
  // the guided tour starts from the top of Today, in day view
  useEffect(() => on('tour-start', () => { setNight(false); scroll.current?.scrollTo?.({ y: 0, animated: false }); }), []);
  return (
    <Screen scrollRef={scroll} tour="index">
      <Header title={`${nm}'s day`} eyebrow={new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })} right={<View style={{ flexDirection: 'row', gap: 8 }}>
        <IconBtn name="share" label="Share an update" onPress={() => emit('handoff')} />
        <KidChip tour="kid" />
      </View>} />
      <Seg value={night} onChange={setNight} options={[[false, 'sun', 'Daytime'], [true, 'moon', 'Night']]} />
      {night ? <Night /> : <>
        <Rhythm />
        <View ref={tourRef('timer')} collapsable={false}>
          <Card>
            <Timer />
            {S.mode === 'smart' && !L.gap.ok ? <View style={{ marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.line }}>
              <T w="s" size={13}>Learning {nm}'s rhythm</T>
              <T size={13} color={C.ink2}>Log every wee and accident. After {NEED.gap} timed gaps the timer switches to {nm}'s own pattern</T>
              <View style={{ flexDirection: 'row', gap: 4, marginTop: 8 }}>{[...Array(NEED.gap)].map((_, i) => <View key={i} style={{ width: 16, height: 6, borderRadius: 3, backgroundColor: i < learnN ? C.brand : C.line }} />)}</View>
            </View> : null}
            <Btn title="Log potty" icon="plus" onPress={() => emit('log')} style={{ marginTop: 20 }} />
          </Card>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
            {QUICK.map(([k, ic, tone, l]) =>
              <Pressable key={k} onPress={() => { if (k === 'sit') emit('sit'); else { logQuick(k); toast({ drink: 'Drink logged', meal: 'Meal logged', wake: 'Wake-up logged' }[k]); } }} style={({ pressed }) => [{ flex: 1, height: 68, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 20, backgroundColor: TONES[tone as Tone].bg }, shadow, pressed && { transform: [{ translateY: 3 }], boxShadow: `0px 0px 0px ${C.ink}` }]}>
                <Icon name={ic} size={22} color={C.ink} /><T w="m" size={12}>{l}</T>
              </Pressable>)}
          </View>
        </View>
        <StickerStrip day={today} />
        {pooDays != null && pooDays >= 2 ? <View style={{ marginTop: 12 }}><Tip icon="poo" tone="poo"><T w="s" size={14}>No poo for {pooDays} days</T><Sub>Holding in poo is common when training. Offer water and fruit{L.poo.ok ? `, and a sit around ${fmt(sod(Date.now()) + (L.poo.v as number) * 3.6e6)} when ${nm} usually goes` : ', and a sit 20 minutes after meals'}.</Sub><Pressable onPress={() => emit('article', 0)}><T w="s" size={13} color={C.ink} style={{ marginTop: 6, textDecorationLine: 'underline' }}>What helps</T></Pressable></Tip></View> : null}
        <SectionHead title={courseLabel()} right="Course" onRight={() => emit('tab', 'program')} />
        <PlanCard />
        <SectionHead title="Timeline" right={`${todays.length} logged`} />
        <Card pad={4} style={{ paddingHorizontal: 16 }}>{todays.length ? <Timeline list={todays} del /> : <Sub style={{ textAlign: 'center', paddingVertical: 20 }}>Nothing logged yet today.{'\n'}Tap “Woke up” to start the timer.</Sub>}</Card>
      </>}
    </Screen>
  );
}
