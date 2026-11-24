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
  mode: 'smart' | 'fixed'; interval: number;
  bedtime: number; quietOn: boolean; quietStart: number; quietEnd: number;
  pausedUntil: number; pauseWhy: string;
  rem: { on: boolean; lead: number; meals: boolean; bed: boolean; morning: boolean; evening: boolean };
  events: Ev[]; steps: Record<string, number[]>; checkins: Record<number, string>; days: Record<number, DayLog>;
  chat: { r: 'u' | 'a'; t: string; src?: string }[]; favs: number[]; spent: number; rewards: Reward[];
  pants: number; sitSong: number | null; sitMusic: boolean;
}

export const MIN = 6e4, HR = 36e5, DAY = 864e5;
export const sod = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const uid = () => Math.random().toString(36).slice(2, 10);

export function fresh(): State {
  return {
    v: 1, account: null, onboarded: false, toured: false,
    child: { name: '', age: '', words: '' }, where: null, home3: null, quiz: {},
    method: 'threeday', pIdx: 0, pDay: 1, start: sod(Date.now()), memberSince: Date.now(),
    mode: 'smart', interval: 45, bedtime: 19.5, quietOn: true, quietStart: 19.5, quietEnd: 6.5,
    pausedUntil: 0, pauseWhy: '',
    rem: { on: true, lead: 5, meals: true, bed: true, morning: true, evening: true },
    events: [], steps: {}, checkins: {}, days: {}, chat: [], favs: [], spent: 0,
    rewards: [{ id: 'r1', t: 'Pick the bedtime story', cost: 6 }, { id: 'r2', t: 'Ice cream after dinner', cost: 15 }, { id: 'r3', t: 'Trip to the park', cost: 25 }],
    pants: 0, sitSong: null, sitMusic: true,
  };
}

const KEY = 'upairy-potty-state';
function load(): State {
  const raw = readItem(KEY);
  if (raw) {
    try {
      const s = JSON.parse(raw);
      const f = fresh();
      return { ...f, ...s, rem: { ...f.rem, ...(s.rem || {}) }, child: { ...f.child, ...(s.child || {}) } };
    } catch { /* corrupted: start fresh */ }
  }
  return fresh();
}

export let S: State = load();
let version = 0;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

/** Call after changing S: saves (debounced) and re-renders. */
export function commit() {
  version++;
  listeners.forEach(l => l());
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => writeItem(KEY, JSON.stringify(S)), 150);
}
export function update(fn: (s: State) => void) { fn(S); commit(); }
export function resetAll() { removeItem(KEY); S = fresh(); commit(); }
export function replaceState(next: State) { S = next; commit(); }

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
/** Re-render this component whenever the app state changes. */
export function useApp() { useSyncExternalStore(subscribe, () => version, () => version); return S; }
