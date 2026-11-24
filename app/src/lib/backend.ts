// Connection to UpAiry's back end (Supabase): email-code sign-in, plan, order linking, AI coach.
// The URL and publishable key are meant to be public (they ship inside every app); access is
// controlled by row-level security and the server functions. Secret keys live only on the server.
import { createClient } from '@supabase/supabase-js';
import { readItem, writeItem, removeItem } from './storage';
import { S, commit } from './store';

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

/** Step 1: email the parent a 6-digit code. Creates the account on first use. */
export async function sendCode(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true } });
  if (error) throw new Error(friendly(error, 'send'));
}

/** Step 2: check the code. On success the parent is signed in. */
export async function verifyCode(email: string, code: string) {
  const { data, error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
  if (error || !data.session) throw new Error(error ? friendly(error, 'verify') : 'That code didn\'t work. Try again or send a new one.');
  return data.session.user.email ?? email;
}

export type Membership = { plan: 'plus' | 'free'; member: boolean; gift?: boolean; order?: string | null; next_billing?: string | null; cancelling?: boolean; error?: string };

/** Ask the server whether this parent has an active UpAiry membership (a Loop subscription on their email). */
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
  if (force || !data.plan_checked_at || Date.now() - new Date(data.plan_checked_at).getTime() > RECHECK_MS) {
    await checkMembership().catch(() => null);
    data = (await read()).data ?? data;
  }
  const active = data.plan === 'plus' && (!data.plus_until || new Date(data.plus_until).getTime() > Date.now());
  const plan: Plan = { plan: active ? 'plus' : 'free', plusUntil: data.plus_until, order: data.order_name };
  if (S.account) { S.account = { ...S.account, id: data.email ?? S.account.id, plan: plan.plan, plusUntil: plan.plusUntil, order: plan.order }; commit(); }
  return plan;
}

export async function isSignedIn() { const { data } = await supabase.auth.getSession(); return !!data.session; }
export async function signOut() { await supabase.auth.signOut().catch(() => {}); }

/** Permanently delete the UpAiry account on the server. */
export async function deleteAccount() {
  const { error } = await supabase.functions.invoke('delete-account', { body: {} });
  if (error) throw new Error('Could not delete the account. Check your connection and try again.');
  await signOut();
}

/** Ask the AI coach. Returns the reply, or a reason it couldn't answer. */
export async function askCoachServer(question: string, history: { role: 'user' | 'assistant'; text: string }[], context: string): Promise<{ reply?: string; remaining?: number; error?: string }> {
  const { data, error } = await supabase.functions.invoke('coach', { body: { question, history, context } });
  if (error) {
    const body = await (error as any).context?.json?.().catch(() => null);
    return { error: body?.error ?? 'coach_failed' };
  }
  return data;
}

function friendly(err: { message?: string; code?: string; status?: number }, step: 'send' | 'verify') {
  const code = String(err.code ?? ''), m = String(err.message ?? '').toLowerCase();
  if (code === 'email_address_invalid') return "That email address doesn't look right. Check it and try again.";
  if (code === 'email_address_not_authorized') return "We can't send to that address yet. Email sign-in is still being set up.";
  if (code.startsWith('over_') || m.includes('rate') || m.includes('seconds')) return 'Please wait a minute before asking for another code.';
  if (step === 'verify' && (code === 'otp_expired' || m.includes('expired') || m.includes('invalid'))) return "That code didn't work or has expired. Check it, or send a new one.";
  if (err.status === 0 || m.includes('fetch') || m.includes('network')) return "Can't reach UpAiry. Check your internet connection.";
  return step === 'send' ? "We couldn't send a code just now. Try again in a minute." : "We couldn't sign you in just now. Try again.";
}
