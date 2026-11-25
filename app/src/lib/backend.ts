// Connection to UpAiry's back end (Supabase): sign-in with email + order number, Potty Up check, AI coach.
// The URL and publishable key are meant to be public (they ship inside every app); access is
// controlled by row-level security and the server functions. Secret keys live only on the server.
import { createClient } from '@supabase/supabase-js';
import { readItem, writeItem, removeItem } from './storage';
import { S, commit } from './store';
import { restoreApple } from './apple';

export const SUPABASE_URL = 'https://dkbvdewzbfkirkfdngms.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ydtFpRZTypBqKroh_D_W4Q_bMoWyBWV';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    // keep the sign-in on the device, in the same storage as the rest of the app
    storage: {
      getItem: async (k: string) => readItem(k),
      setItem: async (k: string, v: string) => writeItem(k, v),
      removeItem: async (k: string) => removeItem(k),
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Plan = { plan: 'plus' | 'free'; plusUntil: string | null; order: string | null };

/** Sign in with the email and order number from an upairy.com order. No password, no emailed code. */
export async function signInWithOrder(email: string, order: string) {
  const fail = (code: string) => Object.assign(new Error(friendly(code)), { code });
  const { data, error } = await supabase.functions.invoke('order-signin', { body: { email: email.trim().toLowerCase(), order: order.trim() } });
  if (error) {
    const body = await (error as any).context?.json?.().catch(() => null);
    throw fail(body?.error ?? (String((error as any).message ?? '').toLowerCase().includes('fetch') ? 'network' : 'failed'));
  }
  if (!data?.access_token) throw fail('failed');
  const { error: e2 } = await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
  if (e2) throw fail('failed');
  // Remember the sign-in details on this phone only, so the app can quietly sign back in and the
  // parent never has to type them again (see ensureSession).
  writeItem(SIGNIN_KEY, JSON.stringify({ email: email.trim().toLowerCase(), order: order.trim() }));
}

export const SIGNIN_KEY = 'potty-up-signin';

/**
 * Keep the parent signed in, always. Called on launch and whenever the app comes back to the foreground.
 * - A saved sign-in is refreshed automatically by Supabase.
 * - If it's gone (expired, revoked, reinstalled storage), quietly sign in again with the saved email and order,
 *   or with the Apple subscription on this phone's Apple ID.
 * - No internet: stay in the app. Only a definite "that order doesn't match" signs the parent out.
 */
export async function ensureSession(): Promise<'ok' | 'offline' | 'signed-out'> {
  const st = await sessionState();
  if (st !== 'none') return st;
  const saved = (() => { try { return JSON.parse(readItem(SIGNIN_KEY) || 'null'); } catch { return null; } })();
  if (saved?.apple) {
    try { return (await restoreApple()) ? 'ok' : 'signed-out'; }
    catch (e) { return (e as any).code === 'expired' ? 'signed-out' : 'offline'; }
  }
  if (!saved?.email || !saved?.order) return 'signed-out';
  try { await signInWithOrder(saved.email, saved.order); return 'ok'; }
  catch (e) { return (e as any).code === 'no_match' ? 'signed-out' : 'offline'; }
}

export type Membership = { plan: 'plus' | 'free'; member: boolean; gift?: boolean; order?: string | null; next_billing?: string | null; cancelling?: boolean; error?: string };

/** Ask the server whether this parent has Potty Up (an active Loop subscription on their email). */
export async function checkMembership(): Promise<Membership> {
  const { data, error } = await supabase.functions.invoke('membership', { body: {} });
  if (error) {
    const body = await (error as any).context?.json?.().catch(() => null);
    return { plan: S.account?.plan ?? 'free', member: false, error: body?.error ?? 'lookup_failed' };
  }
  return data;
}

const RECHECK_MS = 6 * 3600 * 1000; // ask Loop again at most every 6 hours, so cancellations take effect
/** Read the parent's plan from the server and copy it into the app. Rechecks the membership when stale. */
export async function refreshPlan(force = false): Promise<Plan | null> {
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session) return null;
  const read = () => supabase.from('profiles').select('plan, plus_until, order_name, email, plan_checked_at').eq('id', sess.session!.user.id).maybeSingle();
  let { data } = await read();
  if (!data) return null;
  const lapsed = !!data.plus_until && new Date(data.plus_until).getTime() <= Date.now();
  if (S.account?.apple) {
    // An Apple subscription renews on Apple's side: when the paid-up date has passed (or it's been a while),
    // hand the server Apple's newest receipt so it can move the date on.
    if (force || lapsed || !data.plan_checked_at || Date.now() - new Date(data.plan_checked_at).getTime() > RECHECK_MS) {
      await restoreApple().catch(() => null);
      data = (await read()).data ?? data;
    }
  } else if (force || !data.plan_checked_at || Date.now() - new Date(data.plan_checked_at).getTime() > RECHECK_MS) {
    await checkMembership().catch(() => null);
    data = (await read()).data ?? data;
  }
  const active = data.plan === 'plus' && (!data.plus_until || new Date(data.plus_until).getTime() > Date.now());
  const plan: Plan = { plan: active ? 'plus' : 'free', plusUntil: data.plus_until, order: data.order_name };
  if (S.account) { S.account = { ...S.account, id: data.email ?? S.account.id, plan: plan.plan, plusUntil: plan.plusUntil, order: plan.order }; commit(); }
  return plan;
}

export async function isSignedIn() { const { data } = await supabase.auth.getSession(); return !!data.session; }

/**
 * On launch: 'ok' = signed in, 'none' = no sign-in on this phone (send to the sign-in screen),
 * 'offline' = a sign-in is saved but couldn't be refreshed (no internet). Keep the parent in the app.
 * Supabase deletes the saved sign-in when the server rejects it, so a saved one after a failed refresh means a network problem.
 */
export async function sessionState(): Promise<'ok' | 'none' | 'offline'> {
  const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
  if (data.session) return 'ok';
  return readItem(`sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`) ? 'offline' : 'none';
}
export async function signOut() { removeItem(SIGNIN_KEY); await supabase.auth.signOut().catch(() => {}); }

/** Permanently delete the UpAiry account on the server. */
export async function deleteAccount() {
  const { error } = await supabase.functions.invoke('delete-account', { body: {} });
  if (error) throw new Error('Could not delete the account. Check your connection and try again.');
  await signOut();
}

/** Ask the AI coach. Returns the reply, or a reason it couldn't answer. */
/** The phone's timezone, e.g. "Pacific/Auckland", so the coach's daily limit resets at local midnight. */
const localTz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'UTC'; } };

export async function askCoachServer(question: string, history: { role: 'user' | 'assistant'; text: string }[], context: string): Promise<{ reply?: string; remaining?: number; error?: string }> {
  const { data, error } = await supabase.functions.invoke('coach', { body: { question, history, context, tz: localTz() } });
  if (error) {
    const body = await (error as any).context?.json?.().catch(() => null);
    return { error: body?.error ?? 'coach_failed' };
  }
  return data;
}

function friendly(code: string) {
  if (code === 'no_match') return "We couldn't match that to this email. Use the email from your upairy.com order, then its order number, the last name on it, or its postcode.";
  if (code === 'too_many_tries') return 'Too many tries. Please wait an hour, or contact us at upairy.com.';
  if (code === 'bad_input') return 'Enter your email, then your order number, last name or postcode.';
  if (code === 'network') return "Can't connect. Check your internet connection.";
  return "We couldn't sign you in just now. Try again in a minute.";
}
