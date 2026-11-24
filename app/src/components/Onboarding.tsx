// First-run setup as a short quiz, one question per screen (in the style of Kidology's potty quiz):
// age → what that means → name → where they are now → readiness signs → what makes it harder →
// readiness score → temperament → time at home → who's helping → "Building your plan" →
// the plan summary → method → Day 1.
// Answers set the method, the start stage and the readiness score, and go to Lara as context.
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, Sub, Btn, Card, Input, Label, Chip, Chips, Badge, IconBox } from './ui';
import Icon, { type IconName } from './Icon';
import { C } from '@/lib/theme';
import type { Tone } from '@/lib/theme';
import { S, update, sod, addDays } from '@/lib/store';
import { METHODS, QUIZ, WHERE, toneOf, type MethodKey } from '@/lib/content';
import { quizScore, recommend, startIndex } from '@/lib/logic';
import Logo from './Logo';
import { permission } from '@/lib/notifications';
import { reviewsFor, type Review } from '@/lib/reviews';

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

// ---- quiz content ----
const AGES: { v: string; t: string; ic: IconName; tone: Tone }[] = [
  { v: 'Under 2', t: 'Under 2', ic: 'leaf', tone: 'ok' },
  { v: '2 to 2½', t: '2 to 2½', ic: 'sun', tone: 'sun' },
  { v: '2½ to 3', t: '2½ to 3', ic: 'star', tone: 'water' },
  { v: '3+', t: '3 and up', ic: 'smile', tone: 'acc' },
];
const AGE_INFO: Record<string, { what: string; ifs: [string, string][]; mistake: string }> = {
  'Under 2': { what: 'Most children show readiness signs between 18 months and 3. Under 2 is a great time to get familiar, with no pressure to finish.', ifs: [['Start with', 'a potty in the bathroom, books, and sitting on it in clothes.'], ['Watch for', 'staying dry longer and noticing wet nappies.']], mistake: 'Pushing before they are ready. It usually takes longer overall.' },
  '2 to 2½': { what: 'Many children start showing readiness around now. Short, positive practice works best, and a calm start beats a fast one.', ifs: [['If it stalls', 'it is usually the routine, not your child.'], ['If accidents keep coming', 'try more regular sits and fewer distractions.']], mistake: 'Going back and forth between nappies and pants each day.' },
  '2½ to 3': { what: 'Most children are in their readiness window now, and many get the hang of it within a couple of weeks once they start. Steady beats quick.', ifs: [['If it stalls', 'look for gaps in the routine or mixed messages.'], ['If accidents keep coming', 'it is often a busy, distracted moment or a rushed start.']], mistake: 'Switching methods every few days.' },
  '3+': { what: 'By 3, most children have the body control. If it is not happening yet, the hold-up is usually interest or confidence, and a clear routine helps with both.', ifs: [['If they refuse', 'step back, keep it boring, and let them lead a little.'], ['If poos are the problem', 'that is common and very fixable. Check for constipation first.']], mistake: 'Turning it into a battle. Calm and boring wins.' },
};
const SIGNS = QUIZ.map(x => x.q); // the 8 readiness signs, picked as a list
const HARDER: { v: string; t: string }[] = [
  { v: 'constipation', t: 'Constipation or painful poos' },
  { v: 'fear', t: 'Scared of the potty or toilet' },
  { v: 'sensory', t: 'Sensory sensitivities' },
  { v: 'nd', t: 'Autism, ADHD or a developmental delay' },
  { v: 'change', t: 'A big change (new baby, move, new daycare)' },
  { v: 'regressed', t: 'Was trained, then went backwards' },
];
const TEMPER: { v: string; t: string; s: string; ic: IconName }[] = [
  { v: 'easygoing', t: 'Easygoing', s: 'Goes with the flow', ic: 'smile' },
  { v: 'cautious', t: 'Cautious', s: 'Likes to watch first, slow to warm up', ic: 'shield' },
  { v: 'strong-willed', t: 'Strong-willed', s: 'Wants to do it their way', ic: 'bolt' },
  { v: 'sensitive', t: 'Sensitive', s: 'Big feelings, upset by change', ic: 'heart' },
  { v: 'varies', t: 'It varies', s: 'Depends on the day', ic: 'replay' },
];
const TEAM: { v: string; t: string }[] = [
  { v: 'partner', t: 'My partner' }, { v: 'grandparents', t: 'Grandparents' }, { v: 'daycare', t: 'Daycare or a nanny' }, { v: 'solo', t: 'Just me' },
];
const LOADING = ['Readiness', 'Personality', 'Choosing a method', 'Building the course'];

// steps
type Step = 'age' | 'ageinfo' | 'name' | 'where' | 'signs' | 'harder' | 'score' | 'temper' | 'home3' | 'team' | 'build' | 'summary' | 'method' | 'course';
const QUESTIONS: Step[] = ['where', 'signs', 'harder', 'temper', 'home3', 'team']; // numbered "1/6"

/** Default days until Day 1: intensive methods get a day to prepare. */
const defaultStart = (m: MethodKey) => m === 'threeday' || m === 'barebottom' ? 1 : 0;

function Head({ eyebrow, t, s }: { eyebrow?: string; t: string; s?: string }) {
  return <>
    {eyebrow ? <Label color={C.brand} style={{ marginBottom: 6 }}>{eyebrow}</Label> : null}
    <T w="b" size={28} style={{ lineHeight: 33, marginBottom: 8 }}>{t}</T>
    {s ? <Sub style={{ fontSize: 15, lineHeight: 21, marginBottom: 20 }}>{s}</Sub> : null}
  </>;
}

/** A big tappable answer. multi = a checkbox, otherwise a radio. */
function Answer({ t, s, ic, on, multi, onPress }: { t: string; s?: string; ic?: IconName; on: boolean; multi?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole={multi ? 'checkbox' : 'radio'} accessibilityState={{ checked: on }}
      style={{ flexDirection: 'row', gap: 14, alignItems: 'center', paddingVertical: 15, paddingHorizontal: 16, borderRadius: 18, backgroundColor: on ? C.brandSoft : C.surface, borderWidth: 1.5, borderColor: on ? C.brand : C.line, marginBottom: 10 }}>
      {ic ? <IconBox name={ic} tone="try" size={38} /> : null}
      <View style={{ flex: 1 }}><T w="s" size={15}>{t}</T>{s ? <Sub>{s}</Sub> : null}</View>
      {multi
        ? <View style={{ width: 24, height: 24, borderRadius: 7, borderWidth: on ? 0 : 1.8, borderColor: '#CFCBC1', backgroundColor: on ? C.brand : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{on ? <Icon name="check" size={15} color="#fff" stroke={2.6} /> : null}</View>
        : <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: on ? 6 : 1.8, borderColor: on ? C.brand : '#CFCBC1' }} />}
    </Pressable>
  );
}

/** "Building your plan": a ring fills while four steps tick off, with a tip underneath. */
function Building({ name, reviews, onReady }: { name: string; reviews: Review[]; onReady: () => void }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPct(p => Math.min(100, p + 1)), 70); // about 7 seconds
    return () => clearInterval(t);
  }, []);
  const done = pct >= 100;
  useEffect(() => { if (done) onReady(); }, [done]); // eslint-disable-line react-hooks/exhaustive-deps
  const R = 56, Cc = 2 * Math.PI * R;
  const rv = reviews[Math.min(reviews.length - 1, Math.floor(pct / 34))]; // three reviews while it builds
  return <>
    <View style={{ alignItems: 'center', marginTop: 8 }}>
      <View style={{ width: 140, height: 140 }}>
        <Svg width={140} height={140} viewBox="0 0 140 140" style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={70} cy={70} r={R} stroke={C.sunk} strokeWidth={10} fill="none" />
          <Circle cx={70} cy={70} r={R} stroke={C.brand} strokeWidth={10} fill="none" strokeLinecap="round" strokeDasharray={`${Cc}`} strokeDashoffset={Cc * (1 - pct / 100)} />
        </Svg>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <T w="b" size={34} style={{ lineHeight: 38 }}>{`${pct}%`}</T>
          <Label style={{ fontSize: 10 }}>{done ? 'READY' : 'BUILDING'}</Label>
        </View>
      </View>
      <T w="b" size={26} style={{ marginTop: 18, textAlign: 'center' }}>{done ? `${name}'s plan is ready` : `Building ${name}'s plan`}</T>
      <Sub style={{ fontSize: 15, textAlign: 'center', marginTop: 6, marginBottom: 18 }}>Choosing the method, pace and lessons that suit your child.</Sub>
    </View>
    {LOADING.map((l, i) => {
      const from = i * 25, state = pct >= from + 25 ? 'done' : pct >= from ? 'now' : 'later';
      return <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 16, borderRadius: 16, marginBottom: 8, backgroundColor: state === 'later' ? 'transparent' : C.surface, borderWidth: 1, borderColor: state === 'later' ? C.line : 'transparent' }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: state === 'done' ? C.brand : 'transparent', borderWidth: state === 'done' ? 0 : 2, borderColor: state === 'now' ? C.brand : C.line }}>
          {state === 'done' ? <Icon name="check" size={13} color="#fff" stroke={2.8} /> : null}
        </View>
        <T w={state === 'later' ? undefined : 's'} size={15} color={state === 'later' ? C.ink3 : C.ink} style={{ flex: 1 }}>{l}</T>
        {state !== 'later' ? <T w="s" size={12} color={state === 'done' ? C.ink3 : C.brand}>{state === 'done' ? 'Done' : 'Now'}</T> : null}
      </View>;
    })}
    {rv ? <Card style={{ marginTop: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center' }}><T w="b" size={15} color={C.brand}>{rv.n[0]}</T></View>
        <View style={{ flex: 1 }}><T w="s" size={14}>{`${rv.n}, ${rv.age}`}</T><Sub style={{ fontSize: 12 }}>{`${rv.loc} · ${rv.when}`}</Sub></View>
        <View style={{ flexDirection: 'row', gap: 1 }}>{[0, 1, 2, 3, 4].map(i => <Icon key={i} name="star" size={12} color={C.brand} fill={C.brand} />)}</View>
      </View>
      <T size={14} style={{ lineHeight: 21, marginTop: 10 }}>{`“${rv.t}”`}</T>
    </Card> : null}
    {done ? null : <Sub style={{ textAlign: 'center', marginTop: 14 }}>This takes a few seconds</Sub>}
  </>;
}

export default function Onboarding() {
  const ins = useSafeAreaInsets();
  const [hist, setHist] = useState<Step[]>(['age']);
  const step = hist[hist.length - 1];
  const [name, setName] = useState(S.child.name); const [age, setAge] = useState(S.child.age); const [words, setWords] = useState(S.child.words);
  const [where, setWhere] = useState(S.where); const [signs, setSigns] = useState<number[]>([]); const [none, setNone] = useState(false);
  const [harder, setHarder] = useState<string[]>([]); const [temper, setTemper] = useState<string | null>(null);
  const [home3, setHome3] = useState<boolean | null>(null); const [team, setTeam] = useState<string[]>([]);
  const [method, setMethod] = useState<MethodKey | null>(null);
  const [startIn, setStartIn] = useState<number | null>(null); // days from today until Day 1
  const [built, setBuilt] = useState(false);
  const night = where === 'day';
  const quiz: Record<number, number> = Object.fromEntries(QUIZ.map((_, i) => [i, signs.includes(i) ? 2 : 0]));
  const draft = { ...S, where, quiz, home3, method: method ?? 'threeday' };
  const rec = recommend(draft as any);
  const nm = name.trim() || 'your child', Nm = name.trim() || 'Your child';

  const go = (s: Step) => setHist([...hist, s]);
  const back = () => { if (hist.length > 1) { setHist(hist.slice(0, -1)); setBuilt(false); } };
  // The age cards move on by themselves; a double tap must not skip a screen.
  const pickThen = (fn: () => void, s: Step) => { fn(); setTimeout(() => setHist(h => h[h.length - 1] === s ? h : [...h, s]), 220); };
  const toggle = (list: string[], v: string) => list.includes(v) ? list.filter(x => x !== v) : [...list, v];
  const after: Partial<Record<Step, Step>> = { age: 'ageinfo', ageinfo: 'name', name: 'where', where: night ? 'temper' : 'signs', signs: 'harder', harder: 'score', score: 'temper', temper: night ? 'team' : 'home3', home3: 'team', team: 'build', build: 'summary', summary: 'method', method: 'course' };

  const finish = async () => {
    update(s => {
      s.child = { name: name.trim() || 'Your child', age, words: words.trim() };
      s.where = where; s.quiz = quiz; s.home3 = night ? null : home3; s.method = method ?? rec;
      s.profile = { temperament: temper, harder, team };
      s.pIdx = startIndex(s); s.pDay = 1;
      const d1 = addDays(sod(Date.now()), startIn ?? defaultStart(s.method));
      s.start = d1; s.stageStart = d1; s.repeats = []; s.coursePause = null; s.gateSnooze = 0; s.courseV = 1;
      s.onboarded = true;
    });
    await permission(true).catch(() => false); // ask for notifications once, right after setup
  };

  const qn = QUESTIONS.filter(q => !(night && (q === 'signs' || q === 'harder' || q === 'home3')));
  const qi = qn.indexOf(step);
  const sectionOf: Record<Step, number> = { age: 0, ageinfo: 0, name: 0, where: 1, signs: 1, harder: 1, score: 1, temper: 2, home3: 2, team: 2, build: 3, summary: 3, method: 4, course: 4 };
  const top = (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 32 }}>
        {hist.length > 1 ? <Pressable onPress={back} hitSlop={12} accessibilityLabel="Back" style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' }}><Icon name="chevL" size={18} color={C.ink2} /></Pressable> : <View style={{ width: 32 }} />}
        <View style={{ flex: 1, alignItems: 'center' }}><T w="b" size={16} color={C.brand}>Potty Up</T></View>
        <View style={{ width: 32, alignItems: 'flex-end' }}>{qi >= 0 ? <T w="s" size={12} color={C.ink3}>{`${qi + 1}/${qn.length}`}</T> : null}</View>
      </View>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
        {[0, 1, 2, 3, 4].map(i => <View key={i} style={{ flex: 1, height: 4, borderRadius: 9, backgroundColor: i <= sectionOf[step] ? C.brand : C.line }} />)}
      </View>
    </View>
  );

  let body; let cta: string | null = 'Continue'; let action = () => { const n = after[step]; if (n) go(n); }; let ok = true;
  if (step === 'age') {
    cta = null;
    body = <>
      <View style={{ alignItems: 'center' }}><Logo width={110} /></View>
      <T w="b" size={28} style={{ lineHeight: 33, marginTop: 18, textAlign: 'center' }}>Let's build your child's potty plan</T>
      <Sub style={{ fontSize: 15, lineHeight: 21, marginTop: 8, marginBottom: 22, textAlign: 'center' }}>A 2-minute quiz. We'll pick the method, pace and daily lessons that suit your child.</Sub>
      <Label style={{ textAlign: 'center', marginBottom: 12 }}>HOW OLD IS YOUR CHILD?</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {AGES.map(a => <Pressable key={a.v} onPress={() => pickThen(() => setAge(a.v), 'ageinfo')} accessibilityRole="radio" accessibilityState={{ checked: age === a.v }}
          style={{ width: '47%', flexGrow: 1, aspectRatio: 1.05, borderRadius: 22, padding: 16, justifyContent: 'space-between', backgroundColor: age === a.v ? C.brandSoft : C.surface, borderWidth: 1.5, borderColor: age === a.v ? C.brand : C.line }}>
          <IconBox name={a.ic} tone={a.tone} size={54} iconSize={26} round />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <T w="b" size={18}>{a.t}</T>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }}><Icon name="chevR" size={16} color="#fff" /></View>
          </View>
        </Pressable>)}
      </View>
    </>;
  } else if (step === 'ageinfo') {
    const info = AGE_INFO[age] ?? AGE_INFO['2½ to 3'];
    body = <>{top}
      <Card>
        <Badge label={`For parents of ${age === '3+' ? '3 year olds and up' : age === 'Under 2' ? 'under 2s' : age + ' year olds'}`} />
        <T w="b" size={24} style={{ marginTop: 12, lineHeight: 29 }}>What this means for your child</T>
        <T size={15} style={{ marginTop: 8, lineHeight: 22 }}>{info.what}</T>
        {info.ifs.map(([a, b]) => <View key={a} style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={13} color={C.brand} stroke={2.6} /></View>
          <T size={14} style={{ flex: 1, lineHeight: 21 }}><T w="s" size={14}>{a}</T>{`: ${b}`}</T>
        </View>)}
      </Card>
      <View style={{ marginTop: 12, padding: 16, borderRadius: 18, backgroundColor: C.surface, borderLeftWidth: 4, borderLeftColor: C.brand }}>
        <Label>THE #1 MISTAKE</Label>
        <T w="b" size={18} style={{ marginTop: 6, lineHeight: 24 }}>{info.mistake}</T>
      </View>
    </>;
  } else if (step === 'name') {
    ok = !!name.trim();
    body = <>{top}<Head t="What's your child's name?" s="So the app, the songs and the coach can talk about them by name. You can add more children later." />
      <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. Otto" autoCapitalize="words" />
      <Input label="Words they use for wee and poo (optional)" value={words} onChangeText={setWords} placeholder='e.g. "wee wee" and "poo"' />
      <Sub style={{ marginTop: -6 }}>Shared with grandparents and daycare so everyone says the same thing.</Sub>
    </>;
  } else if (step === 'where') {
    ok = !!where;
    body = <>{top}<Head t={`Where is ${nm} now?`} s="Choose what's closest. This sets where the course starts." />
      {WHERE.map(w => <Answer key={w.v} t={w.t} s={w.s} ic={w.ic} on={where === w.v} onPress={() => { setWhere(w.v); if (w.v === 'day') setMethod('night'); else if (method === 'night') setMethod(null); }} />)}
    </>;
  } else if (step === 'signs') {
    ok = signs.length > 0 || none;
    body = <>{top}<Head t={`Let's check if ${nm} is ready`} s="Tap the ones you've noticed lately. Pick as many as apply." />
      {SIGNS.map((q, i) => <Answer key={q} multi t={q} on={signs.includes(i)} onPress={() => { setNone(false); setSigns(signs.includes(i) ? signs.filter(x => x !== i) : [...signs, i]); }} />)}
      <Answer multi t="None of these yet" on={none} onPress={() => { setNone(!none); setSigns([]); }} />
      <Sub style={{ textAlign: 'center', marginTop: 4 }}>{`${signs.length} of ${SIGNS.length} signs`}</Sub>
    </>;
  } else if (step === 'harder') {
    body = <>{top}<Head t="Anything making this harder?" s="Pick any that apply. We'll build them into the plan, and Lara will know too." />
      {HARDER.map(h => <Answer key={h.v} multi t={h.t} on={harder.includes(h.v)} onPress={() => setHarder(toggle(harder, h.v))} />)}
      <Answer multi t="None of these" on={false} onPress={() => { setHarder([]); go('score'); }} />
    </>;
  } else if (step === 'score') {
    const n = signs.length, sc = quizScore(draft as any) ?? 0;
    const [title, msg] = sc >= 70 ? ['Lots of readiness signs', `${Nm} looks ready to start. Most children with this many signs pick it up quickly.`]
      : sc >= 45 ? ['Getting close', `${Nm} is showing some signs. A gentle, steady start now builds the habit.`]
      : ['Early days', `Not many signs yet, and that's fine. We'll start with getting familiar and build up from there, with no pressure.`];
    const named = HARDER.filter(h => harder.includes(h.v)).map(h => h.t.toLowerCase());
    body = <>{top}
      <Card>
        <Label>{`${nm.toUpperCase()}'S READINESS`}</Label>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 8 }}>
          <T w="b" size={52} style={{ lineHeight: 56 }}>{String(n)}</T><T w="s" size={20} color={C.ink3} style={{ marginBottom: 8 }}>{`/ ${SIGNS.length} signs`}</T>
        </View>
        <View style={{ flexDirection: 'row', gap: 4, marginTop: 8 }}>{SIGNS.map((_, i) => <View key={i} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: i < n ? C.brand : C.sunk }} />)}</View>
        <T w="b" size={20} style={{ marginTop: 16 }}>{title}</T>
        <T size={15} style={{ marginTop: 6, lineHeight: 22 }}>{msg}</T>
      </Card>
      {named.length ? <Card style={{ marginTop: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <IconBox name="shield" tone="ok" size={38} />
          <View style={{ flex: 1 }}><T w="b" size={16}>We've got you covered</T>
            <T size={14} style={{ marginTop: 4, lineHeight: 21 }}>{`${named.length > 1 ? 'Each of these' : 'This'} is something lots of families work through: ${named.join(', ')}. ${Nm}'s lessons and Lara's advice will take it into account.`}</T></View>
        </View>
      </Card> : null}
    </>;
  } else if (step === 'temper') {
    ok = !!temper;
    body = <>{top}<Head t={`What's ${nm} like?`} s="Choose the one that sounds most like them." />
      {TEMPER.map(x => <Answer key={x.v} t={x.t} s={x.s} ic={x.ic} on={temper === x.v} onPress={() => setTemper(x.v)} />)}
    </>;
  } else if (step === 'home3') {
    ok = home3 !== null;
    body = <>{top}<Head t="Can you spend 3 full days at home soon?" s="Like a long weekend. It opens up the fastest method, but it's not needed." />
      <Answer t="Yes, we can" s="e.g. a long weekend or days off" ic="home" on={home3 === true} onPress={() => setHome3(true)} />
      <Answer t="Not really" s="Work, daycare or a busy week" ic="car" on={home3 === false} onPress={() => setHome3(false)} />
    </>;
  } else if (step === 'team') {
    ok = team.length > 0;
    body = <>{top}<Head t="Who's helping with training?" s="Pick as many as apply. We'll help you get everyone saying the same thing." />
      {TEAM.map(x => <Answer key={x.v} multi t={x.t} on={team.includes(x.v)} onPress={() => setTeam(x.v === 'solo' ? (team.includes('solo') ? [] : ['solo']) : toggle(team.filter(v => v !== 'solo'), x.v))} />)}
    </>;
  } else if (step === 'build') {
    cta = built ? 'See my plan' : null;
    body = <>{top}<Building key="build" name={Nm} reviews={reviewsFor({ age, where, harder, temper, team, method: method ?? rec })} onReady={() => setBuilt(true)} /></>;
  } else if (step === 'summary') {
    const mk = method ?? rec, m = METHODS[mk];
    const named = HARDER.filter(h => harder.includes(h.v));
    const teamT = team.includes('solo') ? 'Just you' : TEAM.filter(x => team.includes(x.v)).map(x => x.t.replace('My partner', 'You and your partner')).join(', ') || 'You';
    const rows: [string, string][] = [
      ['YOUR CHILD', `${Nm}, ${AGES.find(a => a.v === age)?.t.toLowerCase() ?? 'age not set'}${temper ? ', ' + temper.replace('-', ' ') : ''}`],
      ['STARTING POINT', WHERE.find(w => w.v === where)?.t ?? 'Not set'],
      ...(night ? [] : [['READINESS', `${signs.length} of ${SIGNS.length} signs`] as [string, string]]),
      ['SUGGESTED METHOD', m.name],
      ['EXPECTED TIMELINE', m.pace],
      ['TRAINING TEAM', teamT],
    ];
    cta = 'Continue';
    body = <>{top}
      <Card>
        <Label color={C.brand}>YOUR PLAN IS READY</Label>
        <T w="b" size={26} style={{ marginTop: 6, lineHeight: 31 }}>{`${Nm}'s potty plan`}</T>
        <Sub style={{ marginTop: 4, marginBottom: 6 }}>Based on your answers, here's what we found.</Sub>
        {rows.map(([k, v]) => <View key={k} style={{ paddingVertical: 11, borderTopWidth: 1, borderTopColor: C.line }}>
          <Label style={{ fontSize: 10 }}>{k}</Label><T w="s" size={16} style={{ marginTop: 3 }}>{v}</T>
        </View>)}
        {named.length ? <View style={{ paddingTop: 11, borderTopWidth: 1, borderTopColor: C.line }}>
          <Label style={{ fontSize: 10 }}>BUILT IN FOR YOU</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>{named.map(h => <Badge key={h.v} label={h.t} />)}</View>
        </View> : null}
      </Card>
    </>;
  } else if (step === 'method') {
    const keys: MethodKey[] = night ? ['night'] : ['threeday', 'barebottom', 'gentle'];
    body = <>{top}<Head t={night ? "We'll focus on nights" : 'Your method'} s={night ? `${Nm} is dry in the day, so the course works on nights.` : `We suggest ${METHODS[rec].name.toLowerCase()} for ${nm}. You can pick another, and switch any time.`} />
      {keys.map(k => <MethodCard key={k} k={k} rec={k === rec} on={(method ?? rec) === k} onPress={() => setMethod(k)} />)}
    </>;
  } else {
    const mk = method ?? rec; const m = METHODS[mk]; const si = startIndex({ ...draft, method: mk } as any);
    cta = 'Start'; action = finish;
    const sIn = startIn ?? defaultStart(mk);
    const dayChip = (k: number) => k === 0 ? 'Today' : k === 1 ? 'Tomorrow' : new Date(addDays(sod(Date.now()), k)).toLocaleDateString([], { weekday: 'short', day: 'numeric' });
    body = <>{top}<Head t={`${Nm}'s course`} s={`${m.name} · ${m.pace}. Days move on by themselves from Day 1. At the end of each stage, the app looks at your logs and suggests moving on. You decide.`} />
      <Label style={{ marginBottom: 8 }}>When is Day 1?</Label>
      <Chips style={{ marginBottom: 6 }}>{[0, 1, 2, 3, 4, 5, 6].map(k => <Chip key={k} label={dayChip(k)} on={sIn === k} onPress={() => setStartIn(k)} />)}</Chips>
      <Sub style={{ marginBottom: 16 }}>{sIn === 0 ? 'Starting today.' : `You'll get ${sIn === 1 ? 'a day' : sIn + ' days'} of short "getting ready" lessons first.`}{mk === 'threeday' ? ' Pick 3 days you can be at home.' : ''}</Sub>
      <Card pad={4} style={{ paddingHorizontal: 18, borderWidth: 1, borderColor: C.line, shadowOpacity: 0 }}>
        {m.items.map((s, i) => <View key={i} style={{ flexDirection: 'row', gap: 14, paddingVertical: 13, borderTopWidth: i ? 1 : 0, borderTopColor: C.line, alignItems: 'center' }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: i < si ? C.brandSoft : i === si ? C.brand : C.sunk }}>{i < si ? <Icon name="check" size={15} color={C.brand} stroke={2.4} /> : <T w="s" size={13} color={i === si ? '#fff' : C.ink2}>{i + 1}</T>}</View>
          <View style={{ flex: 1 }}><T w="s">{s.t}</T><Sub>{s.d}{s.iv ? ' · every ' + s.iv + ' min' : ''}{i < si ? ' · skipped, already there' : ''}</Sub></View>
          {i === si ? <Badge label="Start" /> : null}
        </View>)}
      </Card>
      <Sub style={{ marginTop: 14 }}>Next, we'll ask to send you notifications. They're how potty reminders, the morning plan and the evening check-in reach you.</Sub>
    </>;
  }
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: ins.top + 12, paddingBottom: ins.bottom + 20, paddingHorizontal: 22 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{body}</ScrollView>
      {cta ? <Btn title={cta} onPress={action} disabled={!ok} /> : null}
    </View>
  );
}
