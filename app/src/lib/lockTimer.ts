// Keeps the lock-screen timer (widgets/PottyTimer) in step with the app's timer. iPhone only.
// - While the timer is counting down to a try, the lock screen shows it.
// - Paused, quiet hours, no timer at this step, signed out, or switched off in Potty timing: it is removed.
// iOS only lets an app START one while the app is open; after that it runs on its own. So it is synced
// whenever the app is opened or anything changes. If a try goes by with no log, it sits at 0:00 until the
// app is next opened (the reminder notification still fires on time).
import { Platform } from 'react-native';
import { S } from './store';
import { fmt, timerState } from './logic';
import type { PottyTimerProps } from '@/widgets/PottyTimer';

type Factory = typeof import('@/widgets/PottyTimer').default;
let lib: Factory | null | undefined;
/** The lock-screen timer, or null where it doesn't exist (Android, web, and app builds made before it was added). */
function activity(): Factory | null {
  if (lib !== undefined) return lib;
  if (Platform.OS !== 'ios') return (lib = null);
  // Loaded on demand: importing it at the top would crash builds that don't contain the native part.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  try { lib = require('@/widgets/PottyTimer').default as Factory; } catch { lib = null; }
  return lib;
}
export const lockTimerAvailable = () => !!activity();

let last = '';
/** Show, update or remove the lock-screen timer to match the app's timer right now. Safe to call often. */
export function syncLockTimer() {
  const a = activity();
  if (!a) return;
  try {
    const now = Date.now();
    const p = S.account && S.onboarded && S.lockTimer !== false ? timerState(now) : null;
    // Show it from the start of a countdown until a quarter of an hour after it runs out.
    const show = p?.state === 'run' && now < p.due + 15 * 60000 ? p : null;
    const live = a.getInstances();
    if (!show) {
      last = '';
      live.forEach(x => { x.end('immediate').catch(() => {}); });
      return;
    }
    const props: PottyTimerProps = { title: `${S.child.name || 'Your child'}'s next potty try`, at: `at ${fmt(show.due)}`, start: show.due - show.total, due: show.due };
    const key = JSON.stringify(props);
    if (key === last && live.length === 1) return;   // nothing changed
    last = key;
    const stale = new Date(show.due + 15 * 60000);
    if (live.length) {
      live[0].update(props, stale).catch(() => {});
      live.slice(1).forEach(x => { x.end('immediate').catch(() => {}); });
    } else {
      a.start(props, 'upairypotty://', stale);
    }
  } catch { /* never in the way */ }
}
