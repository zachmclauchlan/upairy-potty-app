// Usage numbers and error reports, sent to UpAiry's own database. No outside tracker, nothing about the child.
// - touch(): "this account opened the app today" (and whether setup is finished), at most every few hours.
// - reportError(): a screen crashed or something failed unexpectedly, so we hear about it before parents write in.
// Both are best-effort: they never throw and never get in the parent's way.
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './backend';
import { readItem, writeItem } from './storage';
import { S } from './store';

const VERSION = String(Constants.expoConfig?.version ?? '');
const TOUCH_KEY = 'potty-up-touched';
const TOUCH_EVERY = 4 * 3600 * 1000;

/** Tell the server this account is in use. Pass force right after setup finishes so that is recorded straight away. */
export function touch(force = false) {
  try {
    if (!S.account || S.account.guest) return;
    const last = Number(readItem(TOUCH_KEY) || 0);
    if (!force && Date.now() - last < TOUCH_EVERY) return;
    writeItem(TOUCH_KEY, String(Date.now()));
    Promise.resolve(supabase.rpc('touch_activity', { p_onboarded: !!S.onboarded, p_platform: Platform.OS, p_version: VERSION })).catch(() => {});
  } catch { /* never in the way */ }
}

const sent = new Set<string>();
/** Report an error once per app session (the same message twice tells us nothing new), five at most. */
export function reportError(err: unknown, place: string, fatal = false) {
  try {
    const e = err as { message?: unknown; stack?: unknown } | null;
    const message = String(e?.message ?? err ?? '').slice(0, 500);
    if (!message || sent.has(message) || sent.size >= 5) return;
    sent.add(message);
    Promise.resolve(supabase.rpc('report_error', {
      p_message: message, p_stack: e?.stack ? String(e.stack).slice(0, 4000) : null,
      p_place: place, p_platform: Platform.OS, p_version: VERSION, p_fatal: fatal,
    })).catch(() => {});
  } catch { /* never in the way */ }
}

let watching = false;
/** Catch errors nothing else handled. Call once when the app starts. */
export function watchErrors() {
  if (watching) return;
  watching = true;
  try {
    if (Platform.OS === 'web') {
      const w = globalThis as any;
      w.addEventListener?.('error', (ev: any) => reportError(ev?.error ?? ev?.message, 'window'));
      w.addEventListener?.('unhandledrejection', (ev: any) => reportError(ev?.reason, 'promise'));
    } else {
      const EU = (globalThis as any).ErrorUtils;
      const prev = EU?.getGlobalHandler?.();
      EU?.setGlobalHandler?.((error: unknown, isFatal?: boolean) => { reportError(error, 'global', !!isFatal); prev?.(error, isFatal); });
    }
  } catch { /* never in the way */ }
}
