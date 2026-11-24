import { View } from 'react-native';
import { Card, T, Sub, Opt, IconBox, SectionHead, Tip, Chip, Label } from './ui';
import { C } from '@/lib/theme';
import { S, sod, MIN, addDays, atHour } from '@/lib/store';
import { dryNights7, dur, evs, fmt, onDay } from '@/lib/logic';
import { addEvent, removeEvent } from '@/lib/actions';
import { emit } from '@/lib/bus';

export default function Night() {
  const today = sod(Date.now()); const nights = evs().filter(e => e.type === 'night');
  const lastN = nights.find(e => sod(e.ts) === today);
  const strip = [...Array(14)].map((_, i) => { const d = addDays(today, -(13 - i)); const n = nights.find(e => sod(e.ts) === d); return n ? n.outcome : null; });
  const dry7 = dryNights7(); let streak = 0; for (const n of [...nights].reverse()) { if (n.outcome === 'dry') streak++; else break; }
  const lastDrink = [...onDay(today, e => e.type === 'drink')].pop(); const bed = atHour(today, S.bedtime);
  const gapBed = lastDrink ? (bed - lastDrink.ts) / MIN : null;
  const logNight = (o: 'dry' | 'wet') => { addEvent({ ts: Math.min(Date.now(), atHour(today, 6.6)), type: 'night', outcome: o }); if (o === 'dry') emit('celebrate'); };
  return <>
    <Card>
      <Label>Last night</Label>
      {lastN ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 }}>
        <IconBox name={lastN.outcome === 'dry' ? 'moon' : 'drop'} tone={lastN.outcome === 'dry' ? 'ok' : 'acc'} size={48} />
        <View style={{ flex: 1 }}><T w="s" size={18}>{lastN.outcome === 'dry' ? 'Woke up dry' : 'Wet night'}</T><Sub>{lastN.outcome === 'dry' ? `${streak} dry in a row` : 'Totally normal at this stage'}</Sub></View>
        <Chip label="Change" onPress={() => removeEvent(lastN.id)} />
      </View> : <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}><Opt label="Woke up dry" icon="moon" onPress={() => logNight('dry')} /><Opt label="Wet night" icon="drop" onPress={() => logNight('wet')} /></View>}
    </Card>
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Label>Last 14 nights</Label><Sub>{dry7} of 7 dry this week</Sub></View>
      <View style={{ flexDirection: 'row', gap: 4, marginTop: 14 }}>{strip.map((o, i) => <View key={i} style={{ flex: 1, height: 38, borderRadius: 7, backgroundColor: o === 'dry' ? '#7C8CF0' : o === 'wet' ? '#D8C9E8' : C.sunk }} />)}</View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}><T size={10} color={C.ink3}>2 weeks ago</T><T size={10} color={C.ink3}>Last night</T></View>
    </Card>
    <SectionHead title="Tonight" right={`Bedtime ${fmt(bed)}`} />
    <Card pad={6} style={{ paddingHorizontal: 18 }}>
      {([['cup', 'water', lastDrink ? 'Last drink ' + fmt(lastDrink.ts) : 'No drinks logged today', gapBed == null ? 'Aim for the last drink an hour before bed' : gapBed >= 60 ? dur(gapBed * MIN) + ' before bed. Good.' : gapBed > 0 ? 'Only ' + dur(gapBed * MIN) + ' before bed. Try a little earlier.' : 'Logged after bedtime'],
        ['drop', 'ok', 'Double wee', 'One before bath, one right before sleep'],
        ['bed', 'sun', 'Bed mat and spare sheets ready', 'Makes a 2 am change take two minutes']] as const).map(([ic, tone, t, s], i) =>
        <View key={t} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
          <IconBox name={ic} tone={tone} size={38} iconSize={18} /><View style={{ flex: 1 }}><T w="s" size={14}>{t}</T><T size={12} color={C.ink2}>{s}</T></View>
        </View>)}
    </Card>
    <Tip>{dry7 >= 4 ? `${dry7} dry mornings this week. That's a good sign ${S.child.name} is ready to go nappy-free at night.` : 'Night dryness is mostly physical. It depends on a hormone that develops on its own schedule, so there is nothing to push. Log mornings and wait for 4 or more dry a week.'}</Tip>
  </>;
}
