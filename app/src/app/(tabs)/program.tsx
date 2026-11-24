import { Pressable, View } from 'react-native';
import { Screen, Header, Card, T, Sub, Badge, IconBox, SectionHead, Meter, Label } from '@/components/ui';
import Icon from '@/components/Icon';
import KidChip from '@/components/KidChip';
import { PantsPlanner, ProductCard, stepProducts } from '@/components/Shop';
import { C } from '@/lib/theme';
import { S, useApp } from '@/lib/store';
import { ciStreak, item, M, RULES } from '@/lib/logic';
import { emit } from '@/lib/bus';

export default function Program() {
  useApp();
  const m = M(), it = item(), items = m.items, r = RULES[it.rule];
  const pct = Math.round(100 * (S.pIdx + (S.pDay - 1) / it.len) / items.length);
  return (
    <Screen>
      <Header title={`${S.child.name}'s program`} eyebrow={m.name} right={<KidChip />} />
      <View style={{ borderRadius: 22, padding: 20, backgroundColor: C.brand, marginBottom: 12 }}>
        <Label color="rgba(255,255,255,.75)">Now · step {S.pIdx + 1} of {items.length}</Label>
        <T w="s" size={24} color="#fff" style={{ marginTop: 6, lineHeight: 30 }}>{it.t}</T>
        <T size={14} color="rgba(255,255,255,.9)">{it.expect}</T>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <Badge tone="white" icon="cal" label={it.len > 1 ? `Day ${S.pDay} of ${it.len}` : it.d} />
          <Badge tone="white" icon="clock" label={it.iv ? `Offer every ${it.iv} min` : 'Routine sits'} />
        </View>
        <Meter pct={pct} color="#fff" track="rgba(255,255,255,.2)" style={{ marginTop: 14 }} />
      </View>
      <SectionHead title="How each day works" right={`${ciStreak()}-day check-in streak`} />
      <Card pad={4} style={{ paddingHorizontal: 18 }}>
        {([['sunrise', 'sun', 'Morning · 1 minute', "Log the wake-up so the timer starts. Read today's steps on the Today tab."],
          ['drop', 'ok', 'Through the day · a few taps', 'When the reminder comes, offer the potty. Log what happened, right from the notification or in the app. Log drinks and naps too.'],
          ['moon', 'water', 'Evening · 20 seconds', "Check in: add anything you missed, say how it felt, and pick tomorrow's step. That's how the program moves forward."]] as const).map(([ic, tone, t, s], i) =>
          <View key={t} style={{ flexDirection: 'row', gap: 12, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}><IconBox name={ic} tone={tone} size={38} iconSize={18} /><View style={{ flex: 1 }}><T w="s" size={14}>{t}</T><T size={12} color={C.ink2}>{s}</T></View></View>)}
      </Card>
      <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <IconBox name="route" tone="ok" size={34} round iconSize={17} />
        <View style={{ flex: 1 }}><T w="s" size={14}>What moves you on</T><Sub>{r.t}. Each evening's check-in looks at the day and suggests staying, moving on, or stepping back. You always decide.</Sub></View>
      </Card>
      <SectionHead title="All steps" right="Change method" onRight={() => emit('method')} />
      <Card pad={4} style={{ paddingHorizontal: 18 }}>
        {items.map((s, i) => <Pressable key={i} onPress={() => emit('step', i)} style={{ flexDirection: 'row', gap: 14, paddingVertical: 14, borderTopWidth: i ? 1 : 0, borderTopColor: C.line, alignItems: 'center' }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: i < S.pIdx ? C.brandSoft : i === S.pIdx ? C.brand : C.sunk }}>{i < S.pIdx ? <Icon name="check" size={15} color={C.brand} stroke={2.4} /> : <T w="s" size={13} color={i === S.pIdx ? '#fff' : C.ink2}>{i + 1}</T>}</View>
          <View style={{ flex: 1 }}><T w="s">{s.t}</T><Sub>{s.d}{s.iv ? ' · every ' + s.iv + ' min' : ''}</Sub></View>
          {i === S.pIdx ? <Badge label="Now" /> : i > S.pIdx ? <Badge tone="grey" label="Later" /> : <Icon name="chevR" size={18} color={C.ink3} />}
        </Pressable>)}
      </Card>
      <SectionHead title="What you'll need" right="Shop UpAiry" onRight={() => emit('shop')} />
      <PantsPlanner />
      {stepProducts().map(k => <ProductCard key={k} k={k} />)}
    </Screen>
  );
}
