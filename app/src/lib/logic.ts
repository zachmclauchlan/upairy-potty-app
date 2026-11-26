// Everything the app works out from the logs: stats, learned timing, the timer, program rules.
import { S, MIN, HR, DAY, sod, uid, addDays, atHour, daysBetween, type Ev, type State } from './store';
import { METHODS, SITUATIONS, QUIZ, type RuleKey, type Step } from './content';
import { inPrep, todayLesson, daysToGo, stage, stageDay, courseDay, course } from './course';

/* ---------- formatting ---------- */
export const fmt = (t: number) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
export const dayName = (t: number, o: Intl.DateTimeFormatOptions = { weekday: 'short' }) => new Date(t).toLocaleDateString([], o);
export function dur(ms: number) { const m = Math.round(ms / MIN); if (m < 60) return m + ' min'; return Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : ''); }
export const hm = (h: number) => fmt(atHour(sod(Date.now()), h));
const median = (a: number[]) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const k = Math.floor(s.length / 2); return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
export function greet() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }

/* ---------- events ---------- */
export const evs = () => S.events.slice().sort((a, b) => a.ts - b.ts);
export const onDay = (d: number, f: (e: Ev) => boolean = () => true) => evs().filter(e => sod(e.ts) === d && f(e));
export const isPotty = (e: Ev) => e.type === 'potty';
export const isWee = (e: Ev) => isPotty(e) && (e.outcome === 'success' || e.outcome === 'accident');
export function dayStats(d: number) {
  const p = onDay(d, isPotty);
  const s = p.filter(e => e.outcome === 'success').length, a = p.filter(e => e.outcome === 'accident').length;
  return { s, a, t: p.filter(e => e.outcome === 'tried').length, told: p.filter(e => e.by === 'child').length, rate: s + a ? Math.round(100 * s / (s + a)) : null };
}
export type DayStats = ReturnType<typeof dayStats>;
export const dryNights7 = () => S.events.filter(e => e.type === 'night' && e.outcome === 'dry' && e.ts > addDays(sod(Date.now()), -6)).length;
export const lastPoo = () => [...evs()].reverse().find(e => isPotty(e) && (e.what === 'poo' || e.what === 'both'));

/* ---------- program ---------- */
export const M = () => METHODS[S.method];
/** Today's stage. Before Day 1 it's a "getting ready" stage with no timer. */
export const item = (): Step => {
  if (inPrep()) { const l = todayLesson().lesson, n = daysToGo(); return { t: 'Getting ready', d: n === 1 ? 'Day 1 is tomorrow' : `${n} days until Day 1`, len: course().prep.length, iv: null, rule: 'always', steps: l.todo, expect: l.normal }; }
  return stage();
};
/** At the end of a stage: does the log say they're ready to move on? (Today or yesterday met the goal.) */
export function gateAdvice() {
  const st = stage(), r = RULES[st.rule], next = course().stages[S.pIdx + 1];
  const t = dayStats(sod(Date.now())), y = dayStats(addDays(sod(Date.now()), -1));
  const ready = r.ok(t) || r.ok(y);
  const nm = S.child.name || 'Your child';
  const why = ready
    ? `${nm} met this stage's goal (${r.t.toLowerCase()}). Ready for "${next?.t}"?`
    : `This stage usually takes ${st.d.toLowerCase()}. The goal (${r.t.toLowerCase()}) isn't met yet, so one more day often helps. You can still move on.`;
  return { ready, why, next, goal: r.t };
}
export const RULES: Record<RuleKey, { t: string; ok: (s: DayStats) => boolean }> = {
  always: { t: 'Moves on after one day', ok: () => true },
  catch3: { t: 'At least 3 wees on the potty in a day', ok: s => s.s >= 3 },
  catch2: { t: '2 or more wees on the potty in a day', ok: s => s.s >= 2 },
  rate50: { t: 'Half or more of wees on the potty', ok: s => s.rate != null && s.rate >= 50 && s.s >= 3 },
  rate60: { t: '60% of wees on the potty', ok: s => s.rate != null && s.rate >= 60 && s.s >= 3 },
  rate70x: { t: '70% of wees on the potty', ok: s => s.rate != null && s.rate >= 70 && s.s >= 3 },
  rate75: { t: '75% of wees on the potty', ok: s => s.rate != null && s.rate >= 75 && s.s >= 3 },
  rate80: { t: '80% on the potty and telling you first', ok: s => s.rate != null && s.rate >= 80 && s.told >= 2 },
  night4: { t: '4 or more dry mornings in a week', ok: () => dryNights7() >= 4 },
  night5: { t: '5 or more dry nights in a week', ok: () => dryNights7() >= 5 },
  done: { t: 'Last step. Keep going until it feels normal.', ok: () => false },
};
export function startIndex(st: State = S) { if (st.method === 'night') return 0; if (st.where === 'some' && METHODS[st.method].items[0].iv == null) return 1; return 0; }
export function quizScore(st: State = S) { const v = Object.values(st.quiz); if (v.length < QUIZ.length) return null; return Math.round(100 * v.reduce((a, b) => a + b, 0) / (QUIZ.length * 2)); }
export const quizVerdict = (sc: number) => sc >= 70 ? 'Ready to start' : sc >= 45 ? 'Getting close' : 'Not quite yet';
export function recommend(st: State = S) {
  if (st.where === 'day') return 'night' as const;
  const sc = quizScore(st) ?? 50;
  if (sc >= 70 && st.home3) return 'threeday' as const;
  if (sc >= 45) return 'barebottom' as const;
  return 'gentle' as const;
}
export function ciStreak() { let n = 0, d = sod(Date.now()); if (!S.checkins[d]) d = addDays(d, -1); while (S.checkins[d]) { n++; d = addDays(d, -1); } return n; }

/** What the evening check-in suggests for tomorrow. Days move on by themselves; this only covers
 *  the end of a stage (move on?) and hard days (repeat or go back). */
export type Plan = 'next' | 'carry' | 'repeat' | 'back';
export function decision(day: number, mood: string | null) {
  const st = dayStats(day), cur = stage(), stages = course().stages;
  const next = stages[S.pIdx + 1], prev = S.pIdx > 0 ? stages[S.pIdx - 1] : null;
  const stageEnds = !inPrep() && cur.rule !== 'done' && !!next && stageDay() >= cur.len;
  const nothing = st.s + st.a === 0 && !['always', 'night4', 'night5'].includes(cur.rule);
  let rec: Plan, why: string;
  if (inPrep()) { rec = 'carry'; why = daysToGo() <= 1 ? "Tomorrow is Day 1. Get a good night's sleep!" : `${daysToGo() - 1} more days of getting ready.`; }
  else if (stageEnds) {
    const g = gateAdvice();
    rec = g.ready && mood !== 'tough' ? 'next' : 'repeat';
    why = mood === 'tough' && g.ready ? 'The numbers look good, but you said it was a tough day. One more day on this stage is a good idea.' : g.why;
  }
  else if (nothing) { rec = 'repeat'; why = "Nothing was logged today, so there's nothing to judge. Repeating today tomorrow keeps you on track."; }
  else if (mood === 'tough') { rec = 'repeat'; why = 'Tough days happen. Repeating today tomorrow gives you both a calmer go at it.'; }
  else { rec = 'carry'; why = `Day ${courseDay()} done. Tomorrow carries on with the next lesson.`; }
  const label: Record<Plan, string> = {
    next: next ? `Move on to "${next.t}"` : 'Keep going',
    carry: inPrep() ? 'Sounds good' : `Carry on to Day ${courseDay() + 1}`,
    repeat: stageEnds ? `One more day of "${cur.t}"` : 'Repeat today tomorrow',
    back: prev ? `Go back to "${prev.t}"` : '',
  };
  return { st, rec, why, label, stageEnds, prev, next, goal: RULES[cur.rule].t };
}
/** Apply the check-in choice. Changes start tomorrow. */
export function applyDecision(v: Plan) {
  const tmw = addDays(sod(Date.now()), 1);
  if (v === 'next') { S.pIdx = Math.min(S.pIdx + 1, course().stages.length - 1); S.stageStart = tmw; S.gateSnooze = 0; return `Tomorrow: ${stage().t}`; }
  if (v === 'back') { S.pIdx = Math.max(0, S.pIdx - 1); S.stageStart = tmw; S.gateSnooze = 0; return `Tomorrow: back to ${stage().t}`; }
  if (v === 'repeat') { if (!S.repeats.includes(tmw)) S.repeats.push(tmw); S.gateSnooze = tmw; return `Tomorrow repeats Day ${courseDay()}`; }
  return inPrep() ? 'Getting ready' : `Tomorrow: Day ${courseDay() + 1}`;
}

/** Open the evening check-in, asking first if the day isn't over yet. */
export const CHECKIN_FROM = 16;
export function isEarlyCheckin(day: number) { return day === sod(Date.now()) && new Date().getHours() < CHECKIN_FROM; }

/* ---------- learning: measured only from this child's own logs ---------- */
export const NEED = { gap: 6, drink: 3, wake: 3, poo: 3 };
export function learned() {
  const from = addDays(sod(Date.now()), -5); const all = evs().filter(e => e.ts >= from);
  const w = all.filter(isWee); const gaps: number[] = [], am: number[] = [], pm: number[] = [];
  for (let i = 1; i < w.length; i++) {
    if (sod(w[i].ts) !== sod(w[i - 1].ts)) continue;
    if (all.some(e => e.type === 'wake' && e.ts > w[i - 1].ts && e.ts < w[i].ts)) continue;
    const g = (w[i].ts - w[i - 1].ts) / MIN; if (g > 180) continue;
    gaps.push(g); (new Date(w[i - 1].ts).getHours() < 12 ? am : pm).push(g);
  }
  const lag = (type: Ev['type']) => { const out: number[] = []; all.filter(e => e.type === type).forEach(e => { const n = w.find(x => x.ts > e.ts && x.ts - e.ts < 2 * HR); if (n) out.push((n.ts - e.ts) / MIN); }); return out; };
  const dl = lag('drink'), wl = lag('wake');
  const poos = S.events.filter(e => isPotty(e) && (e.what === 'poo' || e.what === 'both')).map(e => { const d = new Date(e.ts); return d.getHours() + d.getMinutes() / 60; });
  const r = (v: number | null) => v == null ? null : Math.round(v);
  return {
    gap: { n: gaps.length, v: r(median(gaps)), ok: gaps.length >= NEED.gap, am: am.length >= 3 ? r(median(am)) : null, pm: pm.length >= 3 ? r(median(pm)) : null },
    drink: { n: dl.length, v: r(median(dl)), ok: dl.length >= NEED.drink },
    wake: { n: wl.length, v: r(median(wl)), ok: wl.length >= NEED.wake },
    poo: { n: poos.length, v: median(poos), ok: poos.length >= NEED.poo },
  };
}

/* ---------- quiet hours and the forgiving timer ---------- */
export function quietNow(t = Date.now()) { if (!S.quietOn || t < (S.quietSkip ?? 0)) return false; const d = new Date(t), h = d.getHours() + d.getMinutes() / 60, a = S.quietStart, b = S.quietEnd; return a > b ? (h >= a || h < b) : (h >= a && h < b); }
export function quietEndTs(tomorrow = false) { const now = Date.now(); let t = atHour(sod(now), S.quietEnd); if (tomorrow || t <= now) t = atHour(addDays(sod(now), 1), S.quietEnd); return t; }

export type TimerState =
  | { state: 'quiet'; until: number }
  | { state: 'quiet-soon'; until: number }
  | { state: 'paused'; until: number; why: string }
  | { state: 'run'; due: number; gap: number; why: [string, string]; total: number; missed: number; learnedGap: boolean };

export function timerState(now = Date.now()): TimerState | null {
  const today = sod(now), L = learned(), it = item();
  const def = S.mode === 'fixed' ? S.interval : (it.iv || 60);
  let gap = def, src = 'program';
  if (S.mode === 'smart' && L.gap.ok) { gap = Math.max(15, Math.min(120, (new Date(now).getHours() < 12 ? L.gap.am : L.gap.pm) || L.gap.v || def)); src = 'learned'; }
  if (src === 'learned' && it.iv) gap = Math.min(gap, Math.round(it.iv * 1.6)); // never stretch far past what the step allows
  if (quietNow(now)) return { state: 'quiet', until: quietEndTs() };
  if (S.pausedUntil > now) return { state: 'paused', until: S.pausedUntil, why: S.pauseWhy };
  const t = onDay(today); const lastWee = [...t].reverse().find(isWee); const lastWake = [...t].reverse().find(e => e.type === 'wake');
  const qEnd = S.quietOn ? atHour(today, S.quietEnd) : null;
  let anchor: { type: string; ts: number } | undefined = [lastWee, lastWake].filter(Boolean).sort((a, b) => b!.ts - a!.ts)[0] as Ev | undefined;
  if (S.pausedUntil && S.pausedUntil <= now && S.pausedUntil > today && (!anchor || anchor.ts < S.pausedUntil)) anchor = { type: 'resume', ts: S.pausedUntil };
  if (!anchor && qEnd && now > qEnd) anchor = { type: 'start', ts: qEnd }; // no wake-up logged: start from the end of quiet hours
  if (!anchor) return null;
  const nm = S.child.name || 'your child';
  let due: number, why: [string, string];
  if (anchor.type === 'wake') { const w = L.wake.ok ? L.wake.v! : 15; due = anchor.ts + w * MIN; why = ['sunrise', L.wake.ok ? `${nm} usually wees ${w} min after waking` : `Woke at ${fmt(anchor.ts)}. Offer soon after waking`]; }
  else if (anchor.type === 'start') { due = anchor.ts + 30 * MIN; why = ['sunrise', `Started at ${fmt(anchor.ts)}. Log the wake-up for better timing`]; }
  else if (anchor.type === 'resume') { due = anchor.ts + Math.min(gap, 30) * MIN; why = ['clock', 'Back from a pause. A try soon is a good idea']; }
  else { due = anchor.ts + gap * MIN; why = ['clock', src === 'learned' ? `Learned: ${nm} usually goes every ${gap} min` : S.mode === 'fixed' ? `Every ${gap} min, as you set it` : `${it.t} timing: every ${gap} min`]; }
  const drink = [...t].reverse().find(e => e.type === 'drink' && e.ts > anchor!.ts);
  if (drink) { const lagM = L.drink.ok ? L.drink.v! : 35; if (drink.ts + lagM * MIN < due) { due = drink.ts + lagM * MIN; why = ['cup', L.drink.ok ? `Drink at ${fmt(drink.ts)}. ${nm} usually wees ${lagM} min after a drink` : `Drink at ${fmt(drink.ts)}. Wee often follows in 30–40 min`]; } }
  // forgiving: a missed or unlogged try rolls on to the next one instead of sitting on "overdue"
  const GRACE = 15 * MIN; let missed = 0, total = Math.max(due - anchor.ts, MIN);
  if (now > due + GRACE) {
    missed = Math.ceil((now - due - GRACE) / (gap * MIN)); due += missed * gap * MIN; total = gap * MIN;
    why = ['replay', now - anchor.ts > 3 * HR ? `Nothing logged for a while, that's okay. Next try around ${fmt(due)}` : `Missed one or didn't log it? No problem. Next try around ${fmt(due)}`];
  }
  if (S.quietOn && due >= atHour(today, S.quietStart) && due >= (S.quietSkip ?? 0)) return { state: 'quiet-soon', until: quietEndTs(true) };
  return { state: 'run', due, gap, why, total, missed, learnedGap: src === 'learned' };
}
export function predict() { const p = timerState(); return p && p.state === 'run' ? p : null; }

/* ---------- stars, stickers ---------- */
export function starsEarned() { let n = 0; S.events.forEach(e => { if (isPotty(e)) { if (e.outcome === 'success') n += 2; else if (e.outcome === 'tried') n += 1; } else if (e.type === 'night' && e.outcome === 'dry') n += 3; }); return n; }
export const starsNow = () => Math.max(0, starsEarned() - S.spent);
export const memberDays = () => Math.max(0, Math.floor((Date.now() - S.memberSince) / DAY));

/* ---------- evMeta for timelines ---------- */
export function evMeta(e: Ev): { ic: string; tone: 'ok' | 'acc' | 'try' | 'water' | 'sun' | 'poo' | 'meal'; t: string; s?: string } {
  if (e.type === 'potty') {
    const w = ({ wee: 'Wee', poo: 'Poo', both: 'Wee and poo' } as Record<string, string>)[e.what || ''] || '';
    const isP = e.what === 'poo' || e.what === 'both';
    if (e.outcome === 'success') return { ic: isP ? 'poo' : 'drop', tone: isP ? 'poo' : 'ok', t: w + ' on the potty', s: e.by === 'child' ? 'Told you first' : 'You offered' };
    if (e.outcome === 'accident') return { ic: e.what === 'poo' ? 'poo' : 'drop', tone: 'acc', t: w + ' accident', s: 'No worries, logged' };
    return { ic: 'hour', tone: 'try', t: 'Sat, nothing came', s: 'Still counts as practice' };
  }
  if (e.type === 'drink') return { ic: 'cup', tone: 'water', t: 'Drink' };
  if (e.type === 'meal') return { ic: 'meal', tone: 'meal', t: 'Meal' };
  if (e.type === 'wake') return { ic: 'sunrise', tone: 'sun', t: 'Woke up' };
  return { ic: 'moon', tone: e.outcome === 'dry' ? 'ok' : 'acc', t: e.outcome === 'dry' ? 'Dry night' : 'Wet night' };
}

/* ---------- handover text ---------- */
export function handoffText() {
  const today = sod(Date.now()), st = dayStats(today), p = predict();
  const lw = [...onDay(today, isWee)].pop(); const lp = lastPoo();
  return `${S.child.name}: potty update, ${dayName(Date.now())} ${fmt(Date.now())}

Last wee: ${lw ? fmt(lw.ts) + (lw.outcome === 'success' ? ' on the potty' : ' (accident)') : 'none yet today'}
Next try: ${p ? 'around ' + fmt(p.due) : 'soon after waking'}, then about every ${p ? p.gap : item().iv || 60} min
Today: ${st.s} on the potty, ${st.a} accident${st.a === 1 ? '' : 's'}
Last poo: ${lp ? dayName(lp.ts, { weekday: 'long' }) + ' ' + fmt(lp.ts) : 'not logged'}

Program: ${M().name}, ${item().t}
Words: ${S.child.words || 'wee and poo'}
Offer after meals and drinks, and before going out. After accidents, keep it calm: "wee goes in the potty".`;
}

/* ---------- coach ---------- */
export function aiContext() {
  const today = sod(Date.now()), st = dayStats(today), L = learned(), it = item();
  const days = [...Array(7)].map((_, i) => dayStats(addDays(today, -(6 - i)))); const lp = lastPoo();
  return [`Child: age ${S.child.age || 'unknown'}. (Name withheld for privacy; call them "your child".)`,
    `Method: ${M().name}. ${inPrep() ? `Getting ready, ${daysToGo()} day(s) until Day 1` : `Course day ${courseDay()}. Current stage: ${it.t} (${it.d}), day ${stageDay()} of ${it.len}`}. Today's lesson: ${todayLesson().lesson.t}. Stage goal: ${RULES[it.rule].t}.`,
    `Today so far: ${st.s} on the potty, ${st.a} accidents, ${st.t} sits with nothing, told the parent first ${st.told} times.`,
    `Last 7 days success rate by day (oldest first): ${days.map(d => d.rate == null ? 'no logs' : d.rate + '%').join(', ')}.`,
    `Learned timing: ${L.gap.ok ? `usual gap between wees ${L.gap.v} min` : 'not enough data yet'}; ${L.drink.ok ? `wee about ${L.drink.v} min after drinks` : 'drink timing not learned'}.`,
    `Last poo: ${lp ? daysBetween(lp.ts, today) + ' day(s) ago' : 'not logged'}. Dry nights this week: ${dryNights7()}.`,
    ...(S.profile ? [`From the parent's setup quiz: temperament ${S.profile.temperament ?? 'not given'}; things making it harder: ${S.profile.harder.join(', ') || 'none'}; helping with training: ${S.profile.team.join(', ') || 'not given'}.`] : [])].join('\n');
}
export function localAnswer(q: string) {
  const s = q.toLowerCase(); let best: typeof SITUATIONS[number] | null = null, score = 0;
  SITUATIONS.forEach(x => { const n = x.kw.filter(k => s.includes(k)).length; if (n > score) { score = n; best = x; } });
  const b = best as typeof SITUATIONS[number] | null;
  if (!b) return { t: `Here's what helps most often:\n• Offer the potty after waking, meals and drinks.\n• Keep reactions to accidents calm and boring.\n• Praise when ${S.child.name || 'they'} tell you first.\n\nTap a "Right now" card above for step-by-step help.`, src: 'Built-in guide' };
  return { t: b.steps.map(x => '• ' + x).join('\n') + '\n\nTry saying: ' + b.say[0], src: 'Built-in guide: ' + b.t };
}

/* ---------- sample week, for demos and testing ---------- */
export function sampleWeek(st: State) {
  let r = 11; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const now = Date.now(), today = sod(now), start = addDays(today, -6); const ev: Ev[] = [];
  const push = (ts: number, o: Omit<Ev, 'id' | 'ts'>) => { if (ts < now) ev.push({ id: uid(), ts, ...o }); };
  for (let d = 0; d < 7; d++) {
    const base = addDays(start, d), p = d / 6;
    const wake = base + (6.8 + rnd() * .4) * HR; push(wake, { type: 'wake' });
    [7.4, 12.1, 17.5].forEach(h => { push(base + (h + rnd() * .2) * HR, { type: 'meal' }); push(base + (h + .1) * HR, { type: 'drink' }); });
    [9.9, 15.3].forEach(h => push(base + (h + rnd() * .3) * HR, { type: 'drink' }));
    const nap = [12.75, 14.4]; push(base + nap[1] * HR, { type: 'wake' });
    const pooAt = (d === 0 || d === 2 || d === 4) ? 2 : -1;
    let t = wake + 12 * MIN, i = 0;
    while (t < base + 18.8 * HR) {
      const h = (t - base) / HR;
      if (h > nap[0] && h < nap[1]) { t = base + nap[1] * HR + 8 * MIN; continue; }
      const x = rnd(), accP = .46 - p * .36, tryP = .2 - p * .1;
      let outcome: 'success' | 'accident' | 'tried' = x < accP ? 'accident' : x < accP + tryP ? 'tried' : 'success';
      if (i === pooAt && outcome === 'tried') outcome = 'success';
      push(t, { type: 'potty', outcome, what: outcome === 'tried' ? null : (i === pooAt ? 'poo' : 'wee'), by: outcome === 'success' && rnd() < .04 + p * .5 ? 'child' : 'prompt' });
      t += (24 + p * 34 + rnd() * 16) * MIN; i++;
    }
  }
  (['wet', 'wet', 'dry', 'wet', 'dry', 'dry'] as const).forEach((o, k) => push(atHour(addDays(start, k + 1), 6.6), { type: 'night', outcome: o }));
  st.events = ev; st.start = start; st.memberSince = now - 18 * DAY; st.pants = 6; st.sample = true;
  // sample: Day 1 was 6 days ago, now on the second stage
  st.stageStart = addDays(start, 2); st.repeats = []; st.coursePause = null; st.gateSnooze = 0; st.courseV = 1;
  st.pIdx = Math.min(1, METHODS[st.method].items.length - 1);
  for (let d = 0; d < 6; d++) st.checkins[addDays(start, d)] = d === 1 ? 'Moved on to the next stage' : 'Carried on';
}
