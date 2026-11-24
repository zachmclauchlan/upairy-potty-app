// Program tab: the Potty Up course. Where you are, today's lesson, the end-of-stage decision,
// and the map of the whole course.
import { Pressable, View } from 'react-native';
import { Screen, Header, Card, T, Sub, Badge, IconBox, SectionHead, Meter, Label, Btn } from '@/components/ui';
import Icon from '@/components/Icon';
import KidChip from '@/components/KidChip';
import { PantsPlanner, ProductCard, stepProducts } from '@/components/Shop';
import { GateCard, LessonCard } from '@/components/CourseBits';
import { C, outline, shadow } from '@/lib/theme';
import { S, useApp, addDays } from '@/lib/store';
import { M } from '@/lib/logic';
import { SITUATIONS, toneOf } from '@/lib/content';
import { emit } from '@/lib/bus';
import { tourRef } from '@/lib/tour';
import { COACH_NAME } from '@/lib/coach';
import { course, courseDay, daysToGo, inPrep, paused, pauseCourse, resumeCourse, stage, stageDay, today, todayLesson } from '@/lib/course';

const dateLabel = (d: number) => {
  const n = Math.round((d - today()) / 864e5);
  return n === 0 ? 'today' : n === 1 ? 'tomorrow' : new Date(d).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' });
};

function Hero() {
  const c = course(), st = stage(), stages = c.stages;
  if (inPrep()) {
    const n = daysToGo();
    return (
      <View style={[{ borderRadius: 20, padding: 20, backgroundColor: C.brand, marginBottom: 16 }, shadow]}>
        <Label color="rgba(255,255,255,.9)">Getting ready</Label>
        <T w="fun" size={30} color="#fff" style={{ marginTop: 4 }}>{`Day 1 is ${dateLabel(S.start)}`}</T>
        <T size={14} color="#fff">{n === 1 ? "One sleep to go. Today's lesson gets you set up." : `${n} days to go. A short lesson each day gets you set up.`}</T>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <Badge tone="white" icon="cal" label="Change date" onPress={() => emit('startdate')} />
          <Badge tone="white" icon="bolt" label="Start today" onPress={() => emit('startdate')} />
        </View>
      </View>
    );
  }
  if (paused()) return (
    <View style={[{ borderRadius: 20, padding: 20, backgroundColor: C.ink, marginBottom: 16 }, shadow]}>
      <Label color="rgba(255,255,255,.9)">Course paused</Label>
      <T w="fun" size={30} color="#fff" style={{ marginTop: 4 }}>{`Paused on Day ${courseDay()}`}</T>
      <T size={14} color="#fff">Paused days don't count. Pick up where you left off whenever you're ready.</T>
      <Btn kind="white" title="Resume the course" onPress={resumeCourse} style={{ marginTop: 16 }} />
    </View>
  );
  const sd = stageDay(), pct = Math.round(100 * (S.pIdx + Math.min(sd, st.len) / st.len) / stages.length);
  return (
    <View style={[{ borderRadius: 20, padding: 20, backgroundColor: C.brand, marginBottom: 16 }, shadow]}>
      <Label color="rgba(255,255,255,.9)">{`Day ${courseDay()} · Stage ${S.pIdx + 1} of ${stages.length}`}</Label>
      <T w="fun" size={30} color="#fff" style={{ marginTop: 4 }}>{st.t}</T>
      <T size={14} color="#fff">{sd > st.len ? `Day ${sd} of this stage (usually ${st.len}). Take the time you need.` : `Day ${sd} of ${st.len} in this stage · ${st.expect}`}</T>
      <Meter pct={pct} color="#fff" track="rgba(0,0,0,.22)" style={{ marginTop: 16 }} />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <Badge tone="white" icon="clock" label={st.iv ? `Offer every ${st.iv} min` : 'Routine sits'} />
        <Badge tone="white" icon="pause" label="Pause course" onPress={pauseCourse} />
      </View>
    </View>
  );
}

function Dot({ state, n }: { state: 'done' | 'now' | 'later'; n: number | string }) {
  return <View style={[{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: state === 'done' ? C.brandSoft : state === 'now' ? C.brand : C.surface }, outline, { borderWidth: 1.5 }]}>
    {state === 'done' ? <Icon name="check" size={14} color={C.ink} stroke={2.4} /> : <T w="s" size={13} color={state === 'now' ? '#fff' : C.ink2}>{String(n)}</T>}
  </View>;
}

function CourseMap() {
  const c = course(), prep = inPrep(), tl = todayLesson();
  return (
    <Card pad={4} style={{ paddingHorizontal: 16 }}>
      {/* getting ready */}
      <View style={{ paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Dot state={prep ? 'now' : 'done'} n="0" />
          <View style={{ flex: 1 }}><T w="s">Getting ready</T><Sub>{`${c.prep.length} short lesson${c.prep.length > 1 ? 's' : ''} before Day 1`}</Sub></View>
          {prep ? <Badge label="Now" /> : null}
        </View>
        {prep ? <View style={{ marginLeft: 40, marginTop: 4 }}>{c.prep.map((l, i) => <LessonRow key={i} t={l.t} sub={i === tl.index ? 'Today' : undefined} on={i === tl.index} done={i < tl.index} onPress={() => emit('lesson', { st: -1, i })} />)}</View> : null}
      </View>
      {c.stages.map((s, i) => {
        const state = prep || i > S.pIdx ? 'later' : i < S.pIdx ? 'done' : 'now';
        return (
          <View key={i} style={{ borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 12 }}>
            <Pressable onPress={() => emit('step', i)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Dot state={state} n={i + 1} />
              <View style={{ flex: 1 }}><T w="s">{s.t}</T><Sub>{s.d}{s.iv ? ` · every ${s.iv} min` : ''}</Sub></View>
              {state === 'now' ? <Badge label="Now" /> : <Icon name="chevR" size={18} color={C.ink3} />}
            </Pressable>
            {state === 'now' ? <View style={{ marginLeft: 40, marginTop: 4 }}>
              {s.lessons.map((l, k) => <LessonRow key={k} t={l.t} sub={k === tl.index ? 'Today' : `Day ${k + 1}`} on={k === tl.index} done={k < tl.index} onPress={() => emit('lesson', { st: i, i: k })} />)}
            </View> : null}
          </View>
        );
      })}
    </Card>
  );
}
function LessonRow({ t, sub, on, done, onPress }: { t: string; sub?: string; on?: boolean; done?: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
    <Icon name={done ? 'check' : 'book'} size={16} color={on || done ? C.brand : C.ink3} />
    <T size={14} w={on ? 's' : undefined} color={on ? C.ink : done ? C.ink2 : C.ink} style={{ flex: 1 }}>{t}</T>
    {sub ? <Sub style={{ fontSize: 12, color: on ? C.brandInk : C.ink3 }}>{sub}</Sub> : null}
  </Pressable>;
}

export default function Program() {
  useApp();
  const m = M();
  return (
    <Screen tour="program">
      <Header title={`${S.child.name}'s course`} eyebrow={m.name} right={<KidChip />} />
      <View ref={tourRef('course-hero')} collapsable={false}><Hero /></View>
      <GateCard />
      {!paused() ? <><SectionHead title={inPrep() ? "Today's prep" : "Today's lesson"} />
        <View ref={tourRef('course-lesson')} collapsable={false}><LessonCard /></View></> : null}
      <SectionHead title="Your course" right="Change method" onRight={() => emit('method')} />
      <CourseMap />
      <Sub style={{ marginBottom: 8 }}>{`Days move on by themselves from Day 1 (${new Date(S.start).toLocaleDateString([], { day: 'numeric', month: 'short' })}). At the end of each stage, the app checks ${S.child.name}'s logs and suggests moving on. You decide.`}</Sub>
      <Pressable onPress={() => emit('startdate')} hitSlop={8}><T w="s" size={14} color={C.brandInk}>Change the start date</T></Pressable>
      <SectionHead title="When it gets tricky" right={`Ask ${COACH_NAME}`} onRight={() => emit('tab', 'coach')} />
      <Card pad={4} style={{ paddingHorizontal: 16 }}>
        {SITUATIONS.map((x, i) => <Pressable key={x.k} onPress={() => emit('situation', i)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
          <IconBox name={x.ic} tone={toneOf(x.tone)} size={32} iconSize={16} /><T w="m" size={15} style={{ flex: 1 }}>{x.t}</T><Icon name="chevR" size={16} color={C.ink3} />
        </Pressable>)}
      </Card>
      <SectionHead title="What you'll need" right="Shop UpAiry" onRight={() => emit('shop')} />
      <PantsPlanner />
      {stepProducts().map(k => <ProductCard key={k} k={k} />)}
      <Sub style={{ textAlign: 'center', marginTop: 16 }}>{`Started ${new Date(addDays(S.start, 0)).toLocaleDateString()}. General guidance, not medical advice.`}</Sub>
    </Screen>
  );
}
