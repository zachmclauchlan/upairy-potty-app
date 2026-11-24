// Things the parent does, shared by screens and notification buttons.
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { S, commit, uid, MIN, type Ev, type Outcome, type What } from './store';

export function addEvent(e: Omit<Ev, 'id'>) {
  const ev: Ev = { id: uid(), ...e };
  S.events.push(ev);
  if ((ev.type === 'potty' || ev.type === 'wake') && S.pausedUntil > Date.now()) S.pausedUntil = 0; // any log ends a pause
  commit();
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  return ev;
}
export function removeEvent(id: string) { S.events = S.events.filter(e => e.id !== id); commit(); }
export function logPotty(outcome: Outcome, what: What | null, by: 'child' | 'prompt' = 'prompt', agoMin = 0) {
  return addEvent({ ts: Date.now() - agoMin * MIN, type: 'potty', outcome, what: outcome === 'tried' ? null : what, by: outcome === 'success' ? by : null });
}
export const logQuick = (type: 'drink' | 'meal' | 'wake') => addEvent({ ts: Date.now(), type });
