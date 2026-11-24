// App state: one object, saved on the device after every change.
import { useSyncExternalStore } from 'react';
import { readItem, writeItem, removeItem } from './storage';
import type { MethodKey, Mood, Where } from './content';

export type Outcome = 'success' | 'accident' | 'tried';
export type What = 'wee' | 'poo' | 'both';
export interface Ev {
  id: string; ts: number;
  type: 'potty' | 'drink' | 'meal' | 'wake' | 'night';
  outcome?: Outcome | 'dry' | 'wet'; what?: What | null; by?: 'child' | 'prompt' | null; late?: boolean;
}
export interface DayLog { mood: Mood | null; tags: string[]; note: string; decision: string }
export interface Reward { id: string; t: string; cost: number }
export interface State {
  v: 1;
  account: { id: string; plan: 'plus' | 'free'; since: number; plusUntil?: string | null; order?: string | null } | null;
  onboarded: boolean; toured: boolean;
  child: { name: string; age: string; words: string };
  where: Where | null; home3: boolean | null; quiz: Record<number, number>;
  method: MethodKey; pIdx: number; pDay: number; start: number; memberSince: number;
  /** course engine (see course.ts) */
  stageStart: number; repeats: number[]; coursePause: number | null; gateSnooze: number; courseV: number;
  mode: 'smart' | 'fixed'; interval: number;
  bedtime: number; quietOn: boolean; quietStart: number; quietEnd: number;
  pausedUntil: number; pauseWhy: string;
  rem: { on: boolean; lead: number; meals: boolean; bed: boolean; morning: boolean; evening: boolean };
  events: Ev[]; steps: Record<string, number[]>; checkins: Record<number, string>; days: Record<number, DayLog>;
  chat: { r: 'u' | 'a'; t: string; src?: string }[]; favs: number[]; spent: number; rewards: Reward[];
  pants: number; sitSong: number | null; sitMusic: boolean;
  /** Cloud backup to the parent's account. owner = the email this data belongs to. */
  backup: { on: boolean; at: number; owner: string | null };
  /** true while the demo "sample week" logs are loaded */
  sample?: boolean;
}

export const MIN = 6e4, HR = 36e5, DAY = 864e5;
export const sod = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
/** Local midnight n calendar days from a day. Safe across daylight-saving changes (a day isn't always 24 h). */
export const addDays = (day: number, n: number) => { const d = new Date(day); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d.getTime(); };
/** A local clock time on a day, e.g. atHour(today, 18.5) = 6:30 pm, correct on daylight-saving days. */
export const atHour = (day: number, h: number) => { const d = new Date(day); d.setHours(0, 0, 0, 0); d.setMinutes(Math.round(h * 60)); return d.getTime(); };
/** Whole calendar days between two days (rounds away the odd daylight-saving hour). */
export const daysBetween = (a: number, b: number) => Math.round((sod(b) - sod(a)) / DAY);
export const uid = () => Math.random().toString(36).slice(2, 10);

export function fresh(): State {
  return {
    v: 1, account: null, onboarded: false, toured: false,
    child: { name: '', age: '', words: '' }, where: null, home3: null, quiz: {},
    method: 'threeday', pIdx: 0, pDay: 1, start: sod(Date.now()), memberSince: Date.now(),
    stageStart: sod(Date.now()), repeats: [], coursePause: null, gateSnooze: 0, courseV: 1,
    mode: 'smart', interval: 45, bedtime: 19.5, quietOn: true, quietStart: 19.5, quietEnd: 6.5,
    pausedUntil: 0, pauseWhy: '',
    rem: { on: true, lead: 5, meals: true, bed: true, morning: true, evening: true },
    events: [], steps: {}, checkins: {}, days: {}, chat: [], favs: [], spent: 0,
    rewards: [{ id: 'r1', t: 'Pick the bedtime story', cost: 6 }, { id: 'r2', t: 'Ice cream after dinner', cost: 15 }, { id: 'r3', t: 'Trip to the park', cost: 25 }],
    pants: 0, sitSong: null, sitMusic: true,
    backup: { on: true, at: 0, owner: null },
  };
}

const KEY = 'upairy-potty-state';
function load(): State {
  const raw = readItem(KEY);
  if (raw) {
    try {
      const s = JSON.parse(raw);
      const f = fresh();
      const st: State = { ...f, ...s, rem: { ...f.rem, ...(s.rem || {}) }, child: { ...f.child, ...(s.child || {}) }, backup: { ...f.backup, ...(s.backup || {}) } };
      return migrateCourse(st, s);
    } catch { /* corrupted: start fresh */ }
  }
  return fresh();
}

/** Older versions put a "Get ready" step first and only moved on at check-in. Carry people over. */
function migrateCourse(st: State, raw: any): State {
  if (raw.courseV === 1) return st;
  if ((st.method === 'threeday' || st.method === 'barebottom') && raw.pIdx != null) st.pIdx = Math.max(0, raw.pIdx - 1);
  st.stageStart = sod(Date.now()); st.repeats = []; st.coursePause = null; st.gateSnooze = 0; st.courseV = 1;
  // never got past the old "Get ready" step, or no start yet: Day 1 is today
  const neverStarted = (st.method === 'threeday' || st.method === 'barebottom') && (raw.pIdx ?? 0) === 0;
  if (!raw.start || raw.start > sod(Date.now()) || neverStarted) st.start = sod(Date.now());
  return st;
}

export let S: State = load();
let version = 0;
const listeners = new Set<() => void>();
const commitHooks = new Set<() => void>();
/** Run fn after every change (used by cloud backup). */
export function onCommit(fn: () => void) { commitHooks.add(fn); return () => { commitHooks.delete(fn); }; }
let saveTimer: ReturnType<typeof setTimeout> | null = null;

/** Call after changing S: saves (debounced) and re-renders. */
export function commit() {
  version++;
  listeners.forEach(l => l());
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => writeItem(KEY, JSON.stringify(S)), 150);
  commitHooks.forEach(h => h());
}
export function update(fn: (s: State) => void) { fn(S); commit(); }
export function resetAll() { removeItem(KEY); S = fresh(); commit(); }
export function replaceState(next: State) { S = next; commit(); }

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
/** Re-render this component whenever the app state changes. */
export function useApp() { useSyncExternalStore(subscribe, () => version, () => version); return S; }
