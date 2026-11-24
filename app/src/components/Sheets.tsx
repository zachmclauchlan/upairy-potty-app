// All bottom sheets, opened from anywhere through the event bus.
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, Share, View } from 'react-native';
import { Sheet, SheetLink, T, Sub, Btn, Opt, Chip, Chips, Label, Card, Row, Toggle, Input, Tip, toast, confirmAsk } from './ui';
import Icon from './Icon';
import { QuizRows, MethodCard } from './Onboarding';
import { C, F } from '@/lib/theme';
import { S, update, commit, sod, MIN, uid, atHour, type Outcome, type What } from '@/lib/store';
import { ARTICLES, METHODS, MOODS, SITUATIONS, SONGS, TAGS, type MethodKey, type Mood } from '@/lib/content';
import { isEarlyCheckin, applyDecision, ciStreak, dayStats, decision, handoffText, hm, item, learned, M, NEED, quizScore, quizVerdict, RULES, startIndex } from '@/lib/logic';
import { addEvent, logPotty } from '@/lib/actions';
import { previewReminder, permission, reschedule } from '@/lib/notifications';
import { on, emit } from '@/lib/bus';

type Open = { k: string; arg?: any } | null;

export default function Sheets() {
  const [open, setOpen] = useState<Open>(null);
  useEffect(() => {
    const keys = ['log', 'checkin', 'timer', 'pause', 'reminders', 'handoff', 'article', 'situation', 'song', 'quiz', 'method', 'editkid', 'addreward', 'step', 'aiinfo'];
    const offs = keys.map(k => on(k, arg => {
      // a day that's already checked in (e.g. tapping an old reminder) shouldn't move the program again
      if (k === 'checkin' && S.checkins[arg ?? sod(Date.now())]) { toast('Already checked in', S.checkins[arg ?? sod(Date.now())]); return; }
      if (k === 'checkin' && isEarlyCheckin(arg ?? sod(Date.now()))) {
        confirmAsk('Check in early?', `The day isn't over yet, so tomorrow's plan would be based on part of today. Check-in opens at 4 pm.\n\nOnly check in now if you've finished logging for today.`, 'Check in now', () => setOpen({ k, arg }), 'Wait');
        return;
      }
      setOpen({ k, arg });
    }));
    return () => offs.forEach(o => o());
  }, []);
  const close = () => setOpen(null);
  const k = open?.k;
  return <>
    <LogSheet open={k === 'log'} close={close} />
    {k === 'checkin' ? <CheckinSheet day={open!.arg ?? sod(Date.now())} close={close} /> : null}
    <TimerSheet open={k === 'timer'} close={close} />
    <PauseSheet open={k === 'pause'} close={close} />
    <RemSheet open={k === 'reminders'} close={close} />
    <HandoffSheet open={k === 'handoff'} close={close} />
    {k === 'article' ? <ArticleSheet i={open!.arg} close={close} /> : null}
    {k === 'situation' ? <SituationSheet i={open!.arg} close={close} /> : null}
    {k === 'song' ? <SongSheet i={open!.arg} close={close} /> : null}
    <QuizSheet open={k === 'quiz'} close={close} />
    <MethodSheet open={k === 'method'} close={close} />
    <EditKidSheet open={k === 'editkid'} close={close} />
    <AddRewardSheet open={k === 'addreward'} close={close} />
    {k === 'step' ? <StepSheet i={open!.arg} close={close} /> : null}
    <Sheet open={k === 'aiinfo'} onClose={close} title="AI coach"><Tip icon="shield" tone="water"><T w="s" size={14} color={C.waterInk}>What the coach sees</T><T size={13} color={C.waterInk}>Age range, program step, and summary numbers like today's wins and the usual gap. Never your child's name, photos or notes. Your conversation stays in the app (and in your backup if it's on). It isn't kept on our servers.</T></Tip><Card pad={4} style={{ paddingHorizontal: 18 }}><Row first title="Built by UpAiry" sub="Trained on UpAiry's potty training method and guides. Nothing to set up." /><Row title="Status" sub="Live. Up to 20 questions a day. If it can't be reached, the built-in guides answer instead." /></Card><Sub style={{ textAlign: 'center' }}>General guidance, not medical advice.</Sub></Sheet>
  </>;
}

/* ---------- log potty ---------- */
function LogSheet({ open, close }: { open: boolean; close: () => void }) {
  const [o, setO] = useState<Outcome>('success'); const [w, setW] = useState<What>('wee'); const [by, setBy] = useState<'child' | 'prompt'>('prompt'); const [ago, setAgo] = useState(0);
  useEffect(() => { if (open) { setO('success'); setW('wee'); setBy('prompt'); setAgo(0); } }, [open]);
  const save = () => {
    const before = learned().gap.ok;
    const e = logPotty(o, w, by, ago); close();
    const after = learned();
    const undo = () => { S.events = S.events.filter(x => x.id !== e.id); commit(); };
    if (!before && after.gap.ok) toast(`Got ${S.child.name}'s rhythm: about every ${after.gap.v} min`, 'The timer now uses it', undo);
    else toast(o === 'success' ? 'Logged. Nice one!' : o === 'accident' ? "Accident logged. That's how they learn." : 'Logged: sat, nothing came', undefined, undo);
    if (o === 'success') setTimeout(() => emit('celebrate'), 300);
  };
  return (
    <Sheet open={open} onClose={close} title="Log potty" left={<SheetLink label="Cancel" onPress={close} />} right={<SheetLink label="Save" color={C.brand} onPress={save} />}>
      <Label style={{ marginBottom: 8 }}>What happened</Label>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
        <Opt label="On the potty" icon="check" on={o === 'success'} onPress={() => setO('success')} />
        <Opt label="Accident" icon="drop" warn on={o === 'accident'} onPress={() => setO('accident')} />
        <Opt label="Sat, nothing" icon="hour" on={o === 'tried'} onPress={() => setO('tried')} />
      </View>
      {o !== 'tried' ? <><Label style={{ marginBottom: 8 }}>What</Label>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
          <Opt label="Wee" icon="drop" on={w === 'wee'} onPress={() => setW('wee')} /><Opt label="Poo" icon="poo" on={w === 'poo'} onPress={() => setW('poo')} /><Opt label="Both" icon="plus" on={w === 'both'} onPress={() => setW('both')} />
        </View></> : null}
      {o === 'success' ? <><Label style={{ marginBottom: 8 }}>Who started it</Label><Chips style={{ marginBottom: 18 }}><Chip label="They told me" on={by === 'child'} onPress={() => setBy('child')} /><Chip label="I offered" on={by === 'prompt'} onPress={() => setBy('prompt')} /></Chips></> : null}
      <Label style={{ marginBottom: 8 }}>When</Label>
      <Chips style={{ marginBottom: 18 }}>{[0, 5, 15, 30].map(m => <Chip key={m} label={m ? `${m} min ago` : 'Now'} on={ago === m} onPress={() => setAgo(m)} />)}</Chips>
      <Btn title="Save" onPress={save} />
    </Sheet>
  );
}

/* ---------- evening check-in: numbers → feelings → tomorrow ---------- */
function CheckinSheet({ day, close }: { day: number; close: () => void }) {
  const prev = S.days[day];
  const [step, setStep] = useState(1); const [mood, setMood] = useState<Mood | null>(prev?.mood ?? null); const [tags, setTags] = useState<string[]>(prev?.tags ?? []); const [note, setNote] = useState(prev?.note ?? ''); const [added, setAdded] = useState(0);
  const isToday = day === sod(Date.now()); const st = dayStats(day); const nm = S.child.name;
  const dots = <View style={{ flexDirection: 'row', gap: 5, justifyContent: 'center', marginTop: -6, marginBottom: 14 }}>{[1, 2, 3].map(i => <View key={i} style={{ width: 22, height: 4, borderRadius: 9, backgroundColor: i <= step ? C.brand : C.line }} />)}</View>;
  const addMissed = (v: 'success' | 'accident' | 'poo') => { addEvent({ ts: isToday ? Date.now() - MIN : atHour(day, 17.5), type: 'potty', outcome: v === 'accident' ? 'accident' : 'success', what: v === 'poo' ? 'poo' : 'wee', by: 'prompt', late: true }); setAdded(a => a + 1); };
  const nums = (s = st) => <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
    {([[s.s, 'On potty', C.brand], [s.a, 'Accidents', C.acc], [step === 3 ? (s.rate == null ? '–' : s.rate + '%') : s.told, step === 3 ? 'Success' : 'Told you', C.ink]] as const).map(([v, l, c]) =>
      <View key={l} style={{ flex: 1, backgroundColor: C.surface, borderRadius: 18, padding: 12 }}><T w="s" size={22} color={c}>{String(v)}</T><T size={12} color={C.ink2}>{l}</T></View>)}
  </View>;
  const title = step === 3 ? 'Plan for tomorrow' : isToday ? 'How did today go?' : 'How did yesterday go?';
  const left = step > 1 ? <SheetLink label="Back" onPress={() => setStep(step - 1)} /> : undefined;
  const finish = (v: 'next' | 'stay' | 'back') => {
    const msg = applyDecision(v);
    S.checkins[day] = msg; S.days[day] = { mood, tags, note, decision: msg }; commit(); close();
    const sk = ciStreak(); toast(`${isToday ? 'Day logged' : 'Yesterday logged'}${sk > 1 ? ` · ${sk}-day streak` : ''}`, msg);
  };
  let body;
  if (step === 1) body = <>{dots}{nums()}
    <Card><T w="s" size={14}>Anything you didn't log?</T><Sub>Add it now so {nm}'s timing and progress stay accurate.</Sub>
      <Chips style={{ marginTop: 10 }}><Chip label="+ On the potty" onPress={() => addMissed('success')} /><Chip label="+ Accident" onPress={() => addMissed('accident')} /><Chip label="+ Poo on the potty" onPress={() => addMissed('poo')} /></Chips>
      {added ? <T size={13} color={C.brand} style={{ marginTop: 10 }}>Added {added} missed log{added > 1 ? 's' : ''}.</T> : null}
    </Card>
    <Btn title="Looks right" onPress={() => setStep(2)} /></>;
  else if (step === 2) body = <>{dots}
    <Label style={{ marginBottom: 8 }}>How did it feel?</Label>
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>{MOODS.map(([k, l, ic]) => <Opt key={k} label={l} icon={ic} on={mood === k} onPress={() => setMood(k)} />)}</View>
    <Label style={{ marginBottom: 8 }}>Any of these?</Label>
    <Chips style={{ marginBottom: 18 }}>{TAGS.map(t => <Chip key={t} label={t} on={tags.includes(t)} onPress={() => setTags(tags.includes(t) ? tags.filter(x => x !== t) : [...tags, t])} />)}</Chips>
    <Input label="Note for later (optional)" value={note} onChangeText={setNote} placeholder="e.g. Grandma's house, lots of juice" multiline style={{ height: 80, textAlignVertical: 'top' }} />
    <Btn title="Next" onPress={() => setStep(3)} /></>;
  else {
    const d = decision(day, mood);
    body = <>{dots}{nums(d.st)}
      <Card style={{ borderWidth: 1, borderColor: C.line, shadowOpacity: 0 }}>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><Icon name="route" size={15} color={C.ink2} /><Label>The program suggests</Label></View>
        <T w="s" size={16} style={{ marginTop: 6 }}>{d.rec === 'next' ? d.nextLbl : d.stayLbl}</T>
        <Sub style={{ marginTop: 2 }}>{d.why}</Sub>
      </Card>
      <Btn title={d.rec === 'next' ? d.nextLbl : d.stayLbl} onPress={() => finish(d.rec)} />
      {d.rec === 'next'
        ? <Btn kind="ghost" title={d.stayLbl} onPress={() => finish('stay')} style={{ marginTop: 10 }} />
        : <Btn kind="ghost" title={d.moreDays ? d.nextLbl : 'Move on anyway'} style={{ marginTop: 10 }} onPress={() => d.moreDays ? finish('next') : confirmAsk('Move on anyway?', `${nm} hasn't met this step's goal yet (${d.goal.toLowerCase()}). Moving on early often means more accidents in the next step.\n\nYou can always come back.`, 'Move on', () => finish('next'))} />}
      {d.back ? <Btn kind="text" title={`Hard day? Go back to ${d.back.t}`} onPress={() => finish('back')} /> : null}
      <Sub style={{ textAlign: 'center', marginTop: 8 }}>{nm}'s progress is never lost. You can change step any time in Program.</Sub></>;
  }
  return <Sheet open onClose={close} title={title} left={left} right={<SheetLink label="Later" onPress={close} />}>{body}</Sheet>;
}

/* ---------- timer, pause, reminders ---------- */
function TimerSheet({ open, close }: { open: boolean; close: () => void }) {
  const L = learned(); const nm = S.child.name;
  return (
    <Sheet open={open} onClose={close} title="Potty timing">
      <View style={{ flexDirection: 'row', gap: 8 }}><Opt label="Smart" icon="spark" on={S.mode === 'smart'} onPress={() => update(s => { s.mode = 'smart'; })} /><Opt label="Fixed" icon="clock" on={S.mode === 'fixed'} onPress={() => update(s => { s.mode = 'fixed'; })} /></View>
      <Sub style={{ marginTop: 12, marginBottom: 16 }}>{S.mode === 'smart' ? (L.gap.ok ? `Using ${nm}'s learned gap of ${L.gap.v} min, brought forward after drinks and waking up.` : `Using the program's timing (every ${item().iv || 60} min) while we learn ${nm}'s rhythm. ${Math.min(L.gap.n, NEED.gap)} of ${NEED.gap} gaps logged so far.`) : 'Same gap every time, whatever the logs say.'}</Sub>
      {S.mode === 'fixed' ? <><Label style={{ marginBottom: 8 }}>Every</Label><Chips style={{ marginBottom: 16 }}>{[15, 20, 30, 45, 60, 90].map(m => <Chip key={m} label={`${m} min`} on={S.interval === m} onPress={() => update(s => { s.interval = m; })} />)}</Chips></> : null}
      <Card pad={4} style={{ paddingHorizontal: 18 }}>
        <Row first title="Quiet hours" sub="No timer or reminders overnight" onPress={() => update(s => { s.quietOn = !s.quietOn; })} right={<Toggle on={S.quietOn} />} />
        {S.quietOn ? <>
          <View style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.line }}><T w="s" size={14}>From</T><Chips style={{ marginTop: 8 }}>{[18.5, 19, 19.5, 20, 20.5].map(h => <Chip key={h} label={hm(h)} on={S.quietStart === h} onPress={() => update(s => { s.quietStart = h; s.bedtime = h; })} />)}</Chips></View>
          <View style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.line }}><T w="s" size={14}>Until</T><Chips style={{ marginTop: 8 }}>{[6, 6.5, 7, 7.5, 8].map(h => <Chip key={h} label={hm(h)} on={S.quietEnd === h} onPress={() => update(s => { s.quietEnd = h; })} />)}</Chips></View>
        </> : null}
      </Card>
      <Tip icon="heart" tone="water"><T w="s" size={14} color={C.waterInk}>Missed a log? That's fine.</T><T size={13} color={C.waterInk}>If a try goes by without a log, the timer moves on to the next one instead of nagging. After two missed tries it stops reminding until you log again.</T></Tip>
      <Btn kind="ghost" icon="bolt" title="Preview a reminder" onPress={() => { close(); previewReminder(); }} />
    </Sheet>
  );
}
function PauseSheet({ open, close }: { open: boolean; close: () => void }) {
  const qs = atHour(sod(Date.now()), S.quietStart);
  const set = (min: number, label: string) => { update(s => { s.pausedUntil = Date.now() + min * MIN; s.pauseWhy = label; }); close(); toast('Timer paused', `${label}. Resumes at ${new Date(S.pausedUntil).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} or when you log.`); };
  return (
    <Sheet open={open} onClose={close} title="Pause the timer" right={<SheetLink label="Cancel" onPress={close} />}>
      <Sub style={{ marginBottom: 14 }}>No reminders while paused. Logging a wee, poo or wake-up restarts it straight away.</Sub>
      <Card pad={4} style={{ paddingHorizontal: 18 }}>
        <Row first title="Nap time" sub="Up to 2 hours, or until you log the wake-up" onPress={() => set(120, 'Nap time')} />
        <Row title="Out for an hour" sub="Remember a wee before you leave" onPress={() => set(60, 'Out for an hour')} />
        <Row title="Out for 2 hours" sub="Pack spare pants and a wet bag" onPress={() => set(120, 'Out for 2 hours')} />
        <Row title="Rest of today" sub={`Until quiet hours at ${hm(S.quietStart)}`} onPress={() => set(Math.max(30, Math.round((qs - Date.now()) / MIN)), 'Rest of today')} />
      </Card>
    </Sheet>
  );
}
function RemSheet({ open, close }: { open: boolean; close: () => void }) {
  const [granted, setGranted] = useState<boolean | null>(null);
  useEffect(() => { if (open) permission(false).then(setGranted).catch(() => setGranted(false)); }, [open]);
  const sw = (k: keyof typeof S.rem, t: string, s: string, first?: boolean) => <Row first={first} title={t} sub={s} onPress={() => update(st => { (st.rem as any)[k] = !st.rem[k]; })} right={<Toggle on={!!S.rem[k]} />} />;
  return (
    <Sheet open={open} onClose={close} title="Reminders">
      <Card pad={4} style={{ paddingHorizontal: 18 }}>
        {sw('on', 'Potty reminders', 'Before the likely window, from the timer', true)}
        {S.rem.on ? <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.line }}><View style={{ flex: 1 }}><T w="s" size={14}>Heads-up</T><T size={12} color={C.ink2}>How early to remind you</T></View><Chips>{[5, 10].map(m => <Chip key={m} label={`${m} min`} on={S.rem.lead === m} onPress={() => update(s => { s.rem.lead = m; })} />)}</Chips></View> : null}
        {sw('meals', 'After meals', 'A nudge 20 minutes after a logged meal')}
        {sw('bed', 'Bedtime wee', `Reminder before bed at ${hm(S.bedtime)}`)}
      </Card>
      <T w="s" size={15} style={{ marginTop: 6, marginBottom: 8 }}>Daily routine</T>
      <Card pad={4} style={{ paddingHorizontal: 18 }}>
        {sw('morning', 'Morning plan', "Today's step and a one-tap wake-up log", true)}
        {sw('evening', 'Evening check-in', "At 6:30 pm, if you haven't checked in yet")}
      </Card>
      <Pressable onPress={() => { close(); setTimeout(() => emit('timer'), 350); }}><Tip icon="moon" tone="water">{`Quiet hours ${S.quietOn ? hm(S.quietStart) + ' – ' + hm(S.quietEnd) : 'off'}. No timer or reminders overnight. Tap to change.`}</Tip></Pressable>
      {Platform.OS !== 'web' && granted === false ? <Btn icon="bell" title="Allow notifications" onPress={() => permission(true).then(ok => { setGranted(ok); if (ok) reschedule(); else Linking.openSettings().catch(() => {}); })} style={{ marginBottom: 10 }} /> : null}
      <Btn kind="ghost" icon="bolt" title="Preview a reminder" onPress={() => { close(); previewReminder(); }} />
    </Sheet>
  );
}

/* ---------- handover, guides ---------- */
function HandoffSheet({ open, close }: { open: boolean; close: () => void }) {
  const text = open ? handoffText() : '';
  return (
    <Sheet open={open} onClose={close} title="Share an update">
      <Sub style={{ marginTop: -6, marginBottom: 14 }}>For your partner, grandparents or daycare at drop-off.</Sub>
      <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.line, marginBottom: 14 }}><T size={14} style={{ lineHeight: 22 }}>{text}</T></View>
      <Btn icon="share" title="Share update" onPress={() => { Share.share({ message: text }).catch(() => {}); close(); }} />
    </Sheet>
  );
}
function ArticleSheet({ i, close }: { i: number; close: () => void }) {
  const a = ARTICLES[i];
  return <Sheet open onClose={close} title={a.t}>{a.body.split('\n\n').map((p, k) => <T key={k} size={15} style={{ lineHeight: 24, marginBottom: 14 }}>{p}</T>)}</Sheet>;
}
function SituationSheet({ i, close }: { i: number; close: () => void }) {
  const s = SITUATIONS[i];
  return (
    <Sheet open onClose={close} title={s.t}>
      <Label style={{ marginBottom: 6 }}>What to do</Label>
      {s.steps.map((x, k) => <View key={k} style={{ flexDirection: 'row', gap: 12, paddingVertical: 8 }}>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center' }}><T w="s" size={12} color={C.brandInk}>{k + 1}</T></View>
        <T size={14} style={{ flex: 1 }}>{x}</T></View>)}
      <Label style={{ marginTop: 14, marginBottom: 8 }}>What to say</Label>
      {s.say.map((x, k) => <View key={k} style={{ borderLeftWidth: 3, borderLeftColor: C.brand, backgroundColor: C.surface, padding: 12, borderTopRightRadius: 12, borderBottomRightRadius: 12, marginBottom: 8 }}><T size={14} style={{ fontStyle: 'italic' }}>{x}</T></View>)}
      <Btn kind="ghost" icon="chat" title="Ask the coach about this" style={{ marginTop: 8 }} onPress={() => { close(); emit('tab', 'coach'); setTimeout(() => emit('ask', `Help: ${s.t.toLowerCase()}. What should I try next?`), 300); }} />
    </Sheet>
  );
}

/* ---------- songs (lyrics now; Suno audio drops in later) ---------- */
export const lyr = (i: number) => SONGS[i].l.map(x => x.replace('{name}', S.child.name || 'you'));
function SongSheet({ i, close }: { i: number; close: () => void }) {
  const s = SONGS[i]; const [line, setLine] = useState(-1);
  useEffect(() => { if (line < 0) return; const t = setTimeout(() => setLine(l => l >= 3 ? -1 : l + 1), 3500); return () => clearTimeout(t); }, [line]);
  return (
    <Sheet open onClose={close} title={s.t}>
      <Sub style={{ textAlign: 'center', marginTop: -10 }}>{s.tag} · sing it together</Sub>
      <View style={{ marginVertical: 18 }}>{lyr(i).map((l, k) => <T key={k} w="fun" size={24} color={line === k || line < 0 ? C.ink : C.ink3} style={{ textAlign: 'center', lineHeight: 33 }}>{l}</T>)}</View>
      <Btn icon={line >= 0 ? 'pause' : 'music'} title={line >= 0 ? 'Stop' : 'Sing along'} onPress={() => setLine(line >= 0 ? -1 : 0)} />
      <Sub style={{ textAlign: 'center', marginTop: 8 }}>Song audio is coming soon. For now the lines light up so you can sing along.</Sub>
      <Btn kind="ghost" icon="hour" title="Use it for the sit timer" style={{ marginTop: 10 }} onPress={() => { update(st => { st.sitSong = i; }); close(); toast(`${s.t} set for the sit timer`); }} />
    </Sheet>
  );
}

/* ---------- settings sheets ---------- */
function QuizSheet({ open, close }: { open: boolean; close: () => void }) {
  const sc = quizScore();
  return (
    <Sheet open={open} onClose={close} title="Readiness check">
      {sc != null ? <Tip icon="check"><T w="s" size={14} color={C.brandInk}>{sc}% · {quizVerdict(sc)}</T><T size={13} color={C.brandInk}>{sc >= 70 ? 'Most readiness signs are there.' : sc >= 45 ? 'Some signs are there. A relaxed start or a few more weeks of getting ready both work.' : 'Give it a few weeks of potty-in-the-routine, then check again.'}</T></Tip> : null}
      <QuizRows quiz={S.quiz} set={(i, v) => update(s => { s.quiz = { ...s.quiz, [i]: v }; })} />
    </Sheet>
  );
}
function MethodSheet({ open, close }: { open: boolean; close: () => void }) {
  return (
    <Sheet open={open} onClose={close} title="Change method" right={<SheetLink label="Cancel" onPress={close} />}>
      <Sub style={{ marginTop: -6, marginBottom: 14 }}>Your logs and learned timing stay. The program restarts at the matching step.</Sub>
      {(Object.keys(METHODS) as MethodKey[]).map(k => <MethodCard key={k} k={k} on={S.method === k} onPress={() => { if (S.method === k) { close(); return; } confirmAsk('Switch method?', `You'll start ${METHODS[k].name} from its first step. Your logs and learned timing stay.`, 'Switch', () => { update(s => { s.method = k; s.pIdx = startIndex(s); s.pDay = 1; }); toast('Switched to ' + METHODS[k].name); close(); }); }} />)}
    </Sheet>
  );
}
function EditKidSheet({ open, close }: { open: boolean; close: () => void }) {
  const [n, setN] = useState(S.child.name); const [w, setW] = useState(S.child.words); const [age, setAge] = useState(S.child.age);
  useEffect(() => { if (open) { setN(S.child.name); setW(S.child.words); setAge(S.child.age); } }, [open]);
  const save = () => { update(s => { s.child = { name: n.trim() || s.child.name, words: w.trim(), age }; }); close(); toast('Saved'); };
  return (
    <Sheet open={open} onClose={close} title={`Edit ${S.child.name}`} left={<SheetLink label="Cancel" onPress={close} />} right={<SheetLink label="Save" color={C.brand} onPress={save} />}>
      <Input label="Name" value={n} onChangeText={setN} />
      <Label style={{ marginBottom: 8 }}>Age</Label>
      <Chips style={{ marginBottom: 16 }}>{['Under 2', '2 to 2½', '2½ to 3', '3+'].map(a => <Chip key={a} label={a} on={age === a} onPress={() => setAge(a)} />)}</Chips>
      <Input label="Words they use for wee and poo" value={w} onChangeText={setW} />
      <Btn title="Save" onPress={save} />
    </Sheet>
  );
}
function AddRewardSheet({ open, close }: { open: boolean; close: () => void }) {
  const [t, setT] = useState(''); const [cost, setCost] = useState(10);
  useEffect(() => { if (open) { setT(''); setCost(10); } }, [open]);
  const save = () => { if (!t.trim()) return; update(s => { s.rewards.push({ id: uid(), t: t.trim(), cost }); }); close(); };
  return (
    <Sheet open={open} onClose={close} title="New reward" left={<SheetLink label="Cancel" onPress={close} />} right={<SheetLink label="Save" color={C.brand} onPress={save} />}>
      <Input label="Reward" value={t} onChangeText={setT} placeholder="e.g. Pick the bedtime story" />
      <Label style={{ marginBottom: 8 }}>Stars needed</Label>
      <Chips style={{ marginBottom: 16 }}>{[5, 10, 15, 20, 30, 50].map(n => <Chip key={n} label={String(n)} on={cost === n} onPress={() => setCost(n)} />)}</Chips>
      <Sub style={{ marginBottom: 16 }}>Small, frequent rewards work better than one big prize. Time together counts as much as treats.</Sub>
      <Btn title="Save" onPress={save} disabled={!t.trim()} />
    </Sheet>
  );
}
function StepSheet({ i, close }: { i: number; close: () => void }) {
  const s = M().items[i];
  return (
    <Sheet open onClose={close} title={s.t}>
      <Sub style={{ textAlign: 'center', marginTop: -8, marginBottom: 14 }}>{s.d}{s.iv ? ' · offer every ' + s.iv + ' min' : ''}</Sub>
      <Card pad={4} style={{ paddingHorizontal: 18 }}>{s.steps.map((x, k) => <Row key={k} first={k === 0} title={x} />)}</Card>
      <Tip icon="info">{`${s.expect}\n${RULES[s.rule].t}.`}</Tip>
      {i < S.pIdx ? <Btn kind="ghost" title="Go back to this step" onPress={() => { update(st => { st.pIdx = i; st.pDay = 1; }); close(); toast('Now on: ' + item().t, 'You can move forward again from the check-in'); }} /> : null}
      {i > S.pIdx ? <>
        <Tip icon="info" tone="sun">{`You're on "${item().t}". This step opens when the evening check-in moves you on, usually after: ${RULES[item().rule].t.toLowerCase()}.`}</Tip>
        <Btn kind="text" title="Skip ahead anyway" onPress={() => confirmAsk('Skip ahead?', `${S.child.name} hasn't finished "${item().t}" yet. Skipping steps is the most common reason accidents come back.\n\nOnly skip if you're sure they're past it.`, 'Skip ahead', () => { update(st => { st.pIdx = i; st.pDay = 1; }); close(); toast('Now on: ' + item().t); })} />
      </> : null}
    </Sheet>
  );
}
export const _F = F;
