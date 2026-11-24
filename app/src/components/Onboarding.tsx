// First-run setup: child, where they are now, readiness, method, program, fresh or sample start.
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, Sub, Btn, Card, Input, Label, Chip, Chips, Badge, IconBox } from './ui';
import Icon from './Icon';
import { C } from '@/lib/theme';
import { S, update, sod } from '@/lib/store';
import { METHODS, QUIZ, WHERE, toneOf, type MethodKey } from '@/lib/content';
import { quizScore, quizVerdict, recommend, sampleWeek, startIndex } from '@/lib/logic';
import Logo from './Logo';
import { permission } from '@/lib/notifications';

const AGES = ['Under 2', '2 to 2½', '2½ to 3', '3+'];

export function QuizRows({ quiz, set }: { quiz: Record<number, number>; set: (i: number, v: number) => void }) {
  return <>{QUIZ.map((x, i) => (
    <View key={i} style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.line }}>
      <Label>{x.g}</Label>
      <T w="m" size={14} style={{ marginTop: 2, marginBottom: 8 }}>{x.q}</T>
      <Chips>{([[2, 'Yes, clearly'], [1, 'Sometimes'], [0, 'Not yet']] as const).map(([v, l]) => <Chip key={v} label={l} on={quiz[i] === v} onPress={() => set(i, v)} />)}</Chips>
    </View>))}</>;
}

export function MethodCard({ k, on, rec, onPress }: { k: MethodKey; on: boolean; rec?: boolean; onPress: () => void }) {
  const m = METHODS[k];
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start', padding: 16, borderRadius: 18, backgroundColor: on ? C.brandSoft : C.surface, borderWidth: 1.5, borderColor: on ? C.brand : C.line, marginBottom: 10 }}>
      <IconBox name={m.ic} tone={toneOf(m.tone)} size={40} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><T w="s" size={15}>{m.name}</T>{rec ? <Badge label="Suggested" /> : null}</View>
        <Sub style={{ marginTop: 2 }}>{m.blurb}</Sub>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}><Badge tone="grey" icon="clock" label={m.pace} /><Badge tone="grey" icon="home" label={m.need} /></View>
      </View>
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: on ? 6 : 1.8, borderColor: on ? C.brand : '#CFCBC1', marginTop: 2 }} />
    </Pressable>
  );
}

function H({ t, s }: { t: string; s?: string }) {
  return <><T w="b" size={28} style={{ lineHeight: 33, marginBottom: 8 }}>{t}</T>{s ? <Sub style={{ fontSize: 15, lineHeight: 21, marginBottom: 20 }}>{s}</Sub> : null}</>;
}

export default function Onboarding() {
  const ins = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(S.child.name); const [age, setAge] = useState(S.child.age); const [words, setWords] = useState(S.child.words);
  const [where, setWhere] = useState(S.where); const [quiz, setQuiz] = useState<Record<number, number>>({}); const [home3, setHome3] = useState<boolean | null>(null);
  const [method, setMethod] = useState<MethodKey | null>(null); const [sample, setSample] = useState(false);
  const draft = { ...S, where, quiz, home3, method: method ?? 'threeday' };
  const rec = recommend(draft as any);
  const nm = name || 'your child';
  const next = () => {
    if (step === 1 && !name.trim()) return;
    if (step === 2 && !where) return;
    if (step === 2 && where === 'day') { setMethod('night'); setStep(4); return; }
    if (step === 3 && !method) setMethod(rec);
    setStep(step + 1);
  };
  const finish = async () => {
    update(s => {
      s.child = { name: name.trim() || 'Your child', age, words: words.trim() };
      s.where = where; s.quiz = quiz; s.home3 = home3; s.method = method ?? rec;
      s.pIdx = startIndex(s); s.pDay = 1; s.start = sod(Date.now());
      if (sample) sampleWeek(s);
      s.onboarded = true;
    });
    await permission(true).catch(() => false); // ask for notifications once, right after setup
  };
  const bars = (n: number) => (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 22, alignItems: 'center' }}>
      <Pressable onPress={() => setStep(step === 4 && where === 'day' ? 2 : Math.max(0, step - 1))} hitSlop={10} style={{ marginRight: 4 }}><Icon name="chevL" size={22} color={C.ink2} /></Pressable>
      {[0, 1, 2, 3, 4, 5].map(i => <View key={i} style={{ flex: 1, height: 4, borderRadius: 9, backgroundColor: i <= n ? C.brand : C.line }} />)}
    </View>
  );

  let body; let cta = 'Continue'; let action = next; let ok = true;
  if (step === 0) {
    cta = 'Build my program';
    body = <>
      <Logo width={132} />
      <T w="b" size={28} style={{ lineHeight: 33, marginTop: 20, marginBottom: 8 }}>Potty training, planned around your child.</T>
      <Sub style={{ fontSize: 15, lineHeight: 21, marginBottom: 24 }}>Answer a few questions and we'll build a day-by-day program. The app learns your child's rhythm as you log.</Sub>
      {([['route', 'ok', 'A program that fits', '3-day intensive, bare bottom at home, or gentle. Chosen for your child and your week.'], ['spark', 'water', 'Timing that learns', "Starts with the program's timing, then learns how often your child really goes."], ['moon', 'sun', 'A 20-second evening check-in', 'See how the day went and decide together what tomorrow looks like.']] as const).map(([ic, tone, t, s]) =>
        <View key={t} style={{ flexDirection: 'row', gap: 14, marginBottom: 18 }}><IconBox name={ic} tone={tone} size={42} /><View style={{ flex: 1 }}><T w="s">{t}</T><Sub>{s}</Sub></View></View>)}
    </>;
  } else if (step === 1) {
    ok = !!name.trim();
    body = <>{bars(0)}<H t="Who are we training?" s="You can add more children later." />
      <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. Otto" autoCapitalize="words" />
      <Label style={{ marginBottom: 8, marginLeft: 2 }}>Age</Label>
      <Chips style={{ marginBottom: 16 }}>{AGES.map(a => <Chip key={a} label={a} on={age === a} onPress={() => setAge(a)} />)}</Chips>
      <Input label="Words they use for wee and poo" value={words} onChangeText={setWords} placeholder='e.g. "wee wee" and "poo"' />
      <Sub style={{ marginTop: -6 }}>Shared with grandparents and daycare so everyone says the same thing.</Sub>
    </>;
  } else if (step === 2) {
    ok = !!where;
    body = <>{bars(1)}<H t={`Where is ${nm} now?`} s="This sets where the program starts." />
      {WHERE.map(w => <Pressable key={w.v} onPress={() => setWhere(w.v)} style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16, borderRadius: 18, backgroundColor: where === w.v ? C.brandSoft : C.surface, borderWidth: 1.5, borderColor: where === w.v ? C.brand : C.line, marginBottom: 10 }}>
        <IconBox name={w.ic} tone="try" size={40} /><View style={{ flex: 1 }}><T w="s">{w.t}</T><Sub>{w.s}</Sub></View>
        <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: where === w.v ? 6 : 1.8, borderColor: where === w.v ? C.brand : '#CFCBC1' }} />
      </Pressable>)}
    </>;
  } else if (step === 3) {
    body = <>{bars(2)}<H t={`Is ${nm} ready?`} s="8 quick questions. Answer based on what you've noticed lately." />
      <QuizRows quiz={quiz} set={(i, v) => setQuiz({ ...quiz, [i]: v })} />
      <Label style={{ marginTop: 18, marginBottom: 8 }}>Can you spend 3 full days at home soon?</Label>
      <Chips><Chip label="Yes, e.g. a long weekend" on={home3 === true} onPress={() => setHome3(true)} /><Chip label="Not really" on={home3 === false} onPress={() => setHome3(false)} /></Chips>
    </>;
  } else if (step === 4) {
    const keys: MethodKey[] = where === 'day' ? ['night'] : ['threeday', 'barebottom', 'gentle'];
    const sc = quizScore(draft as any);
    body = <>{bars(3)}<H t="Choose a method" s={where === 'day' ? `${nm} is dry in the day, so we'll focus on nights.` : `Readiness ${sc ?? '–'}%: ${quizVerdict(sc ?? 50).toLowerCase()}. We suggest ${METHODS[rec].name.toLowerCase()}. You can switch any time.`} />
      {keys.map(k => <MethodCard key={k} k={k} rec={k === rec} on={(method ?? rec) === k} onPress={() => setMethod(k)} />)}
    </>;
  } else if (step === 5) {
    const mk = method ?? rec; const m = METHODS[mk]; const si = startIndex({ ...draft, method: mk } as any);
    cta = 'Looks good';
    body = <>{bars(4)}<H t={`${nm}'s program`} s={`${m.name} · ${m.pace}. Each evening's check-in decides if you stay on a step, move on, or step back.`} />
      <Card pad={4} style={{ paddingHorizontal: 18, borderWidth: 1, borderColor: C.line, shadowOpacity: 0 }}>
        {m.items.map((s, i) => <View key={i} style={{ flexDirection: 'row', gap: 14, paddingVertical: 13, borderTopWidth: i ? 1 : 0, borderTopColor: C.line, alignItems: 'center' }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: i < si ? C.brandSoft : i === si ? C.brand : C.sunk }}>{i < si ? <Icon name="check" size={15} color={C.brand} stroke={2.4} /> : <T w="s" size={13} color={i === si ? '#fff' : C.ink2}>{i + 1}</T>}</View>
          <View style={{ flex: 1 }}><T w="s">{s.t}</T><Sub>{s.d}{s.iv ? ' · every ' + s.iv + ' min' : ''}{i < si ? ' · skipped, already there' : ''}</Sub></View>
          {i === si ? <Badge label="Start" /> : null}
        </View>)}
      </Card>
    </>;
  } else {
    cta = 'Start'; action = finish;
    body = <>{bars(5)}<H t="How do you want to start?" s="The timer learns from your logs, so a fresh start begins with program timing and gets more personal each day." />
      {([[false, 'spark', `Start fresh with ${nm}`, 'Empty log. Begin today.', 'For real use'], [true, 'chart', 'Explore with a sample week', 'Fills in 7 days of example logs so you can see learned timing, insights and history.', '']] as const).map(([v, ic, t, s, b]) =>
        <Pressable key={String(v)} onPress={() => setSample(v)} style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start', padding: 16, borderRadius: 18, backgroundColor: sample === v ? C.brandSoft : C.surface, borderWidth: 1.5, borderColor: sample === v ? C.brand : C.line, marginBottom: 10 }}>
          <IconBox name={ic} tone={v ? 'water' : 'ok'} size={40} /><View style={{ flex: 1 }}><View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><T w="s">{t}</T>{b ? <Badge label={b} /> : null}</View><Sub>{s}</Sub></View>
        </Pressable>)}
      <Sub style={{ marginTop: 8 }}>Next, we'll ask to send you notifications. They're how potty reminders, the morning plan and the evening check-in reach you.</Sub>
    </>;
  }
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: ins.top + 16, paddingBottom: ins.bottom + 20, paddingHorizontal: 24 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{body}</ScrollView>
      <Btn title={cta} onPress={action} disabled={!ok} />
    </View>
  );
}
