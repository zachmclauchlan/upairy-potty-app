// Shared pieces of the course UI: today's lesson card and the end-of-stage decision card.
import { Pressable, View } from 'react-native';
import { T, Sub, Card, Btn, Label } from './ui';
import Icon from './Icon';
import { C } from '@/lib/theme';
import { S, update } from '@/lib/store';
import { gateAdvice, M } from '@/lib/logic';
import { emit } from '@/lib/bus';
import { course, gateDue, goBack, moveOn, oneMoreDay, stage, today, todayLesson, inPrep, repeatingTomorrow, repeatTomorrow, undoRepeat, paused } from '@/lib/course';

/** Today's checklist ticks are kept per method and day. */
const tickKey = () => `${S.method}-${today()}`;

export function LessonCard({ full = true }: { full?: boolean }) {
  const tl = todayLesson(), L = tl.lesson, done = S.steps[tickKey()] || [];
  const stIdx = tl.prep ? -1 : S.pIdx;
  const items = full ? L.todo : L.todo.slice(0, 3);
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <View style={{ paddingVertical: 3, paddingHorizontal: 9, borderRadius: 99, backgroundColor: C.brandSoft }}><T w="s" size={12} color={C.brandInk}>{tl.label}</T></View>
        <Sub style={{ fontSize: 12 }}>{tl.prep ? 'Getting ready' : stage().t}</Sub>
        <View style={{ flex: 1 }} />
        <Sub style={{ fontSize: 12 }}>{done.filter(i => i < L.todo.length).length}/{L.todo.length}</Sub>
      </View>
      <T w="b" size={19} style={{ marginTop: 2 }}>{L.t}</T>
      {full ? <T size={14} color={C.ink2} style={{ lineHeight: 21, marginTop: 6 }}>{L.why}</T> : null}
      <View style={{ marginTop: 10 }}>
        {items.map((s, j) => {
          const on = done.includes(j);
          return <Pressable key={j} onPress={() => update(st => { const l = st.steps[tickKey()] || []; st.steps[tickKey()] = on ? l.filter(x => x !== j) : [...l, j]; })} style={{ flexDirection: 'row', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.line }}>
            <View style={{ width: 22, height: 22, borderRadius: 7, borderWidth: 1.8, borderColor: on ? C.brand : '#CFCBC1', backgroundColor: on ? C.brand : 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>{on ? <Icon name="check" size={14} color="#fff" stroke={2.6} /> : null}</View>
            <T size={14} color={on ? C.ink3 : C.ink} style={{ flex: 1, textDecorationLine: on ? 'line-through' : 'none' }}>{s}</T>
          </Pressable>;
        })}
      </View>
      {full && L.say.length ? <View style={{ backgroundColor: C.sunk, borderRadius: 14, padding: 12, marginTop: 8 }}>
        <Label style={{ marginBottom: 4 }}>What to say</Label>
        <T size={14} style={{ lineHeight: 21 }}>{L.say[0]}</T>
      </View> : null}
      {full ? <Sub style={{ marginTop: 10 }}>{`Normal today: ${L.normal}`}</Sub> : null}
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
        <Pressable onPress={() => full ? emit('lesson', { st: stIdx, i: tl.index }) : emit('tab', 'program')} hitSlop={8}><T w="s" size={14} color={C.brand}>{full ? 'Read the full lesson' : "Open today's lesson"}</T></Pressable>
        {full && !tl.prep && !paused() ? <Pressable onPress={() => repeatingTomorrow() ? undoRepeat() : repeatTomorrow()} hitSlop={8}><T w="s" size={14} color={C.ink2}>{repeatingTomorrow() ? 'Undo: repeat tomorrow' : 'Repeat this day tomorrow'}</T></Pressable> : null}
      </View>
      {repeatingTomorrow() && full ? <Sub style={{ marginTop: 6, fontSize: 12 }}>Tomorrow will be this same day again.</Sub> : null}
    </Card>
  );
}

/** End of a stage: move on, one more day, or go back. */
export function GateCard({ compact = false }: { compact?: boolean }) {
  if (!gateDue()) return null;
  const g = gateAdvice();
  if (compact) return (
    <Pressable onPress={() => emit('tab', 'program')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: g.ready ? C.brandSoft : C.sunSoft, marginBottom: 12 }}>
      <Icon name="route" size={20} color={C.brandInk} />
      <View style={{ flex: 1 }}><T w="s" size={14}>{`Ready for "${g.next?.t}"?`}</T><T size={12} color={C.ink2}>End of this stage. Tap to decide.</T></View>
      <Icon name="chevR" size={18} color={C.ink2} />
    </Pressable>
  );
  return (
    <Card style={{ borderWidth: 1.5, borderColor: g.ready ? C.brand : C.line }}>
      <Label>{`End of "${stage().t}"`}</Label>
      <T w="b" size={18} style={{ marginTop: 4 }}>{g.ready ? `Ready for "${g.next?.t}"` : `Move on to "${g.next?.t}"?`}</T>
      <Sub style={{ marginTop: 4, marginBottom: 12 }}>{g.why}</Sub>
      <Btn title={g.ready ? 'Move on' : 'Move on anyway'} kind={g.ready ? undefined : 'ghost'} onPress={moveOn} />
      <Btn title="One more day on this stage" kind={g.ready ? 'ghost' : undefined} onPress={oneMoreDay} style={{ marginTop: 10 }} />
      {S.pIdx > 0 ? <Btn kind="text" title="Hard going? Go back a stage" onPress={goBack} /> : null}
    </Card>
  );
}

/** Small label for headers: where you are in the course. */
export function courseLabel() {
  if (inPrep()) return `Getting ready · ${M().name}`;
  return `${todayLesson().label} · ${stage().t}`;
}
export const stagesCount = () => course().stages.length;
