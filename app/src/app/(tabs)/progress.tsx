import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Screen, Header, Card, T, Sub, IconBox, IconBtn, Label, Seg, Tip } from '@/components/ui';
import { IconName } from '@/components/Icon';
import KidChip from '@/components/KidChip';
import Timeline from '@/components/Timeline';
import { C, Tone } from '@/lib/theme';
import { S, useApp, sod, addDays, atHour } from '@/lib/store';
import { MOODS } from '@/lib/content';
import { dayName, dayStats, fmt, isPotty, learned, NEED, onDay } from '@/lib/logic';
import { emit } from '@/lib/bus';
import { tourRef } from '@/lib/tour';

export default function Progress() {
  useApp();
  const [view, setView] = useState<'ins' | 'hist'>('ins');
  return (
    <Screen tour="progress">
      <Header title={view === 'ins' ? 'Insights' : 'History'} eyebrow={view === 'ins' ? 'Last 7 days' : 'Every day, logged'} right={<KidChip tour="chip-progress" />} />
      <View ref={tourRef('progress-toggle')} collapsable={false}><Seg value={view} onChange={setView} options={[['ins', 'chart', 'Insights'], ['hist', 'cal', 'History']]} /></View>
      {view === 'ins' ? <Insights /> : <History />}
    </Screen>
  );
}

function Insights() {
  const today = sod(Date.now()), L = learned(), nm = S.child.name;
  if (!S.events.some(isPotty)) return <Card><Sub style={{ textAlign: 'center', paddingVertical: 16, fontSize: 14 }}>Nothing to show yet.{'\n'}Insights fill in as you log. A day of logging is enough to see {nm}'s first patterns.</Sub></Card>;
  const days = [...Array(7)].map((_, i) => { const d = addDays(today, -(6 - i)); return { d, ...dayStats(d) }; });
  const active = days.filter(x => x.rate != null);
  const tot = days.reduce((a, x) => ({ s: a.s + x.s, told: a.told + x.told, a: a.a + x.a }), { s: 0, told: 0, a: 0 });
  const rate = tot.s + tot.a ? Math.round(100 * tot.s / (tot.s + tot.a)) : null;
  const first = active[0]?.rate ?? 0, last = active[active.length - 1]?.rate ?? 0;
  const toldPct = tot.s ? Math.round(100 * tot.told / tot.s) : null;
  const hrs = [...Array(13)].map((_, i) => S.events.filter(e => isPotty(e) && e.outcome === 'accident' && e.ts > addDays(today, -13) && new Date(e.ts).getHours() === 7 + i).length);
  const hmax = Math.max(1, ...hrs); const peak = 7 + hrs.indexOf(Math.max(...hrs)); const ph = (h: number) => (h % 12 || 12) + (h < 12 ? ' am' : ' pm');
  const row = (ic: IconName, tone: Tone, t: string, ok: boolean, val: string, unit: string, n: number, need: number, note: string, i: number) => (
    <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
      <IconBox name={ic} tone={tone} />
      <View style={{ flex: 1 }}>
        <T w="s" size={14}>{t}</T>
        {ok ? <T size={12} color={C.ink2}>{note}</T> : <>
          <T size={12} color={C.ink2}>Still learning · {Math.min(n, need)} of {need} logs</T>
          <View style={{ flexDirection: 'row', gap: 2, marginTop: 5 }}>{[...Array(need)].map((_, k) => <View key={k} style={{ width: 16, height: 4, borderRadius: 9, backgroundColor: k < n ? C.brand : C.line }} />)}</View>
        </>}
      </View>
      <View style={{ alignItems: 'flex-end' }}><T w="fun" size={20}>{ok ? val : '–'}</T>{ok ? <T size={12} color={C.ink3}>{unit}</T> : null}</View>
    </View>
  );
  const metric = (l: string, v: string, d: string, up?: boolean) => <View style={{ flex: 1 }}><T w="fun" size={32} style={{ fontVariant: ['tabular-nums'] }}>{v}</T><T w="s" size={13}>{l}</T><T size={12} color={up === undefined ? C.ink2 : up ? C.brandInk : C.acc}>{d}</T></View>;
  return <>
    <Card>
      <Label>What we've learned about {nm}</Label>
      <Sub style={{ marginBottom: 4 }}>The timer uses these once there's enough data</Sub>
      {row('clock', 'ok', 'Time between wees', L.gap.ok, L.gap.v + ' min', 'typical', L.gap.n, NEED.gap, L.gap.am && L.gap.pm ? `${L.gap.am} min mornings, ${L.gap.pm} min afternoons` : `From ${L.gap.n} gaps`, 0)}
      {row('cup', 'water', 'Wee after a drink', L.drink.ok, L.drink.v + ' min', 'later', L.drink.n, NEED.drink, `From ${L.drink.n} drinks`, 1)}
      {row('sunrise', 'sun', 'Wee after waking', L.wake.ok, L.wake.v + ' min', 'later', L.wake.n, NEED.wake, `From ${L.wake.n} wake-ups`, 2)}
      {row('poo', 'poo', 'Usual poo time', L.poo.ok, L.poo.ok ? fmt(atHour(today, L.poo.v as number)) : '', 'roughly', L.poo.n, NEED.poo, `From ${L.poo.n} poos`, 3)}
    </Card>
    <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 16 }}>
      {metric('Success rate', rate != null ? rate + '%' : '–', active.length > 1 ? `${first}% → ${last}% this week` : 'First day', last >= first)}
      {metric('Told you first', toldPct != null ? toldPct + '%' : '–', 'of successes')}
    </View>
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
      {metric('Accidents a day', (tot.a / Math.max(1, active.length)).toFixed(1), 'average')}
      {metric('Days logged', String(active.length), 'this week')}
    </View>
    <Card>
      <Label>Success rate by day</Label>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 120, marginTop: 14 }}>
        {days.map((x, i) => <View key={x.d} style={{ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <T size={11} color={C.ink2}>{x.rate == null ? '' : String(x.rate)}</T>
          <View style={{ width: '100%', height: `${x.rate == null ? 2 : Math.max(4, x.rate) * 0.75}%`, borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: i === 6 ? C.brand : C.surface, borderWidth: 1.5, borderColor: C.ink }} />
          <T size={11} color={C.ink3}>{dayName(x.d, { weekday: 'narrow' })}</T>
        </View>)}
      </View>
    </Card>
    {hrs.some(Boolean) ? <>
      <Card>
        <Label>When accidents happen</Label><Sub>Last 2 weeks, by hour</Sub>
        <View style={{ flexDirection: 'row', gap: 3, marginTop: 14 }}>{hrs.map((n, i) => <View key={i} style={{ flex: 1, height: 32, borderRadius: 6, backgroundColor: n ? `rgba(181,71,31,${0.2 + 0.8 * n / hmax})` : C.sunk }} />)}</View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}><T size={11} color={C.ink3}>7 am</T><T size={11} color={C.ink3}>1 pm</T><T size={11} color={C.ink3}>7 pm</T></View>
      </Card>
      <Tip><T w="s" size={14}>Most accidents happen around {ph(peak)}</T><T size={14}>Offer the potty 15 minutes before then, even if the timer hasn't run out.</T></Tip>
    </> : null}
  </>;
}

function History() {
  const today = sod(Date.now());
  const [sel, setSel] = useState(today); const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const y = month.getFullYear(), mo = month.getMonth(); const off = (new Date(y, mo, 1).getDay() + 6) % 7, days = new Date(y, mo + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(off).fill(null), ...[...Array(days)].map((_, i) => new Date(y, mo, i + 1).getTime())];
  const st = dayStats(sel); const list = onDay(sel).reverse().filter(e => e.type !== 'night'); const night = onDay(sel, e => e.type === 'night')[0];
  const ci = S.checkins[sel]; const dl = S.days[sel]; const md = MOODS.find(m => m[0] === dl?.mood);
  const shift = (d: number) => setMonth(m => new Date(m.getFullYear(), m.getMonth() + d, 1));
  return <>
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <IconBtn name="chevL" label="Previous month" size={36} onPress={() => shift(-1)} />
        <T w="fun" size={20}>{month.toLocaleDateString([], { month: 'long', year: 'numeric' })}</T>
        <IconBtn name="chevR" label="Next month" size={36} onPress={() => shift(1)} />
      </View>
      <View style={{ flexDirection: 'row' }}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <T key={i} w="m" size={11} color={C.ink3} style={{ flex: 1, textAlign: 'center' }}>{d}</T>)}</View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((t, i) => { if (t == null) return <View key={i} style={{ width: `${100 / 7}%` }} />;
          const s = dayStats(t), fut = t > today, on = t === sel;
          return <Pressable key={i} disabled={fut} onPress={() => setSel(t)} style={{ width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 6, borderRadius: 12, backgroundColor: on ? C.hi : 'transparent', borderWidth: 2, borderColor: on ? C.ink : 'transparent', gap: 2 }}>
            <T w="s" size={15} color={fut ? C.ink3 : C.ink}>{new Date(t).getDate()}</T>
            <T size={10} color={C.ink2} style={{ height: 15, lineHeight: 15 }}>{s.rate == null ? '' : s.rate + '%'}</T>
            <View style={{ flexDirection: 'row', gap: 2, height: 5 }}>{[...Array(Math.min(s.s, 4))].map((_, k) => <View key={'s' + k} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: C.brand }} />)}{[...Array(Math.min(s.a, 2))].map((_, k) => <View key={'a' + k} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: C.acc }} />)}</View>
          </Pressable>; })}
      </View>
    </Card>
    <T w="fun" size={22} style={{ marginTop: 8, marginBottom: 8 }}>{dayName(sel, { weekday: 'long', day: 'numeric', month: 'long' })}</T>
    <View style={{ flexDirection: 'row', marginBottom: 16 }}>
      {([[st.s, 'On potty'], [st.a, 'Accidents'], [st.told, 'Told you']] as const).map(([v, l]) => <View key={l} style={{ flex: 1 }}><T w="fun" size={28} style={{ fontVariant: ['tabular-nums'] }}>{String(v)}</T><T size={12} color={C.ink2}>{l}</T></View>)}
    </View>
    {night ? <Tip icon="moon" tone={night.outcome === 'dry' ? 'ok' : 'sun'}>{night.outcome === 'dry' ? 'Dry night' : 'Wet night'}</Tip> : null}
    {ci ? <Card style={{ flexDirection: 'row', gap: 12 }}>
      <IconBox name={(md?.[2] as IconName) ?? 'route'} tone="try" size={36} />
      <View style={{ flex: 1 }}><T w="s" size={14}>{md ? md[1] : 'Check-in'}</T><Sub>{ci}</Sub>{dl?.tags?.length ? <Sub>{dl.tags.join(' · ')}</Sub> : null}{dl?.note ? <Sub>"{dl.note}"</Sub> : null}</View>
    </Card> : sel === addDays(today, -1) && list.length ? <Pressable onPress={() => emit('checkin', sel)}><Tip icon="moon">No check-in this day. Tap to fill it in now.</Tip></Pressable> : null}
    <Card pad={4} style={{ paddingHorizontal: 16 }}>{list.length ? <Timeline list={list} del={sel === today} /> : <Sub style={{ textAlign: 'center', paddingVertical: 20 }}>Nothing logged this day.</Sub>}</Card>
  </>;
}
