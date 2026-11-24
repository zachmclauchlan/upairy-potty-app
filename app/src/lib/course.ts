// The course engine. Days move on by the calendar from the start date (Day 1); paused days and
// "repeat this day" don't count. Stages move on when the parent decides (the app suggests, from the logs).
//
// State it uses (store.ts):
//   start       local midnight of Day 1. Before it, the course is in "getting ready" (a countdown).
//   pIdx        current stage
//   stageStart  the day the current stage began
//   repeats     days that don't move the course on (from "repeat this day" and pauses)
//   coursePause the day a pause began, or null
//   gateSnooze  the day the parent chose "one more day" at the end of a stage
import { S, commit, sod, addDays, daysBetween } from './store';
import { COURSES, type Course, type Lesson, type Stage } from './courseContent';

export const today = () => sod(Date.now());
export const course = (): Course => COURSES[S.method];
export const stage = (): Stage => course().stages[Math.min(S.pIdx, course().stages.length - 1)];

/** Days between `from` (exclusive) and `to` (inclusive) that don't count: repeats and paused days. */
function skipped(from: number, to: number) {
  let n = S.repeats.filter(r => r > from && r <= to).length;
  if (S.coursePause != null) n += Math.max(0, daysBetween(Math.max(S.coursePause, addDays(from, 1)), to) + 1);
  return n;
}

export const inPrep = () => today() < S.start;
export const daysToGo = () => Math.max(0, daysBetween(today(), S.start));
export const paused = () => S.coursePause != null;
/** Day number of the whole course (Day 1 = start date). */
export const courseDay = () => inPrep() ? 0 : Math.max(1, daysBetween(S.start, today()) + 1 - skipped(S.start, today()));
/** Day number within the current stage. */
export const stageDay = () => inPrep() ? 0 : Math.max(1, daysBetween(S.stageStart, today()) + 1 - skipped(S.stageStart, today()));

export type TodayLesson = { lesson: Lesson; label: string; extra: boolean; prep: boolean; index: number };
/** What the parent reads and does today. */
export function todayLesson(): TodayLesson {
  const c = course();
  if (inPrep()) {
    const n = daysToGo(), i = Math.max(0, Math.min(c.prep.length - 1, c.prep.length - n));
    return { lesson: c.prep[i], label: n === 1 ? 'Day 1 is tomorrow' : `${n} days until Day 1`, extra: false, prep: true, index: i };
  }
  const st = stage(), d = stageDay(), L = st.lessons, i = Math.min(d - 1, L.length - 1);
  const extra = d > st.len;
  return { lesson: extra ? { ...L[L.length - 1], t: `Keep practising: ${L[L.length - 1].t.toLowerCase()}` } : L[i], label: `Day ${courseDay()}`, extra, prep: false, index: i };
}

/** End of a stage reached: time to decide (move on / one more day / go back). */
export const gateDue = () => !inPrep() && !paused() && stageDay() > stage().len && stage().rule !== 'done' && S.gateSnooze !== today() && S.pIdx < course().stages.length - 1;

/* ---------- actions (all followed by commit) ---------- */
export function setStart(day: number) {
  S.start = sod(day); S.stageStart = S.start; S.repeats = []; S.coursePause = null; S.gateSnooze = 0; commit();
}
export function moveOn() { S.pIdx = Math.min(S.pIdx + 1, course().stages.length - 1); S.stageStart = today(); S.gateSnooze = 0; commit(); }
export function goBack() { S.pIdx = Math.max(0, S.pIdx - 1); S.stageStart = today(); S.gateSnooze = 0; commit(); }
export function goToStage(i: number) { S.pIdx = Math.max(0, Math.min(i, course().stages.length - 1)); S.stageStart = today(); S.gateSnooze = 0; commit(); }
export function oneMoreDay() { S.gateSnooze = today(); commit(); }
/** Tomorrow repeats today's day (it doesn't move the course on). */
export function repeatTomorrow() { const t = addDays(today(), 1); if (!S.repeats.includes(t)) S.repeats.push(t); commit(); }
export const repeatingTomorrow = () => S.repeats.includes(addDays(today(), 1));
export function undoRepeat() { const t = addDays(today(), 1); S.repeats = S.repeats.filter(r => r !== t); commit(); }
/** Pause the course (illness, holiday). Paused days don't count. */
export function pauseCourse() { if (S.coursePause == null) { S.coursePause = today(); commit(); } }
export function resumeCourse() {
  if (S.coursePause == null) return;
  for (let d = S.coursePause; d < today(); d = addDays(d, 1)) if (!S.repeats.includes(d)) S.repeats.push(d);
  S.coursePause = null; commit();
}
