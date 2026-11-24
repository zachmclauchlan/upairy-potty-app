// Sign in with the email and order number from an upairy.com order. No password, no emailed code.
// We look the order up in Loop (which holds the orders behind every subscription, including Potty Up).
// If the order number belongs to that email, we sign the parent in and return a session.
// Whether Potty Up is unlocked is decided afterwards by the `membership` function.
// Failed tries are limited per email, so order numbers can't be guessed.
// People on the manual_access list (team, testers, gifts) use an access number instead and get Potty Up as a gift.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const LOOP_API = 'https://api.loopsubscriptions.com/admin/2026-04';
const MAX_FAILS = 8;            // per email per hour
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

/** Does this order number belong to this email in Loop? Accepts "#1314664", "1314664" or Loop's "314664". */
async function orderMatches(email: string, digits: string): Promise<boolean> {
  const h = { 'X-Loop-Token': Deno.env.get('LOOP_API_TOKEN') ?? '', Accept: 'application/json' };
  const s = await fetch(`${LOOP_API}/customer/${encodeURIComponent(email)}/subscription`, { headers: h });
  if (s.status === 404) return false;
  if (!s.ok) throw new Error('loop_http_' + s.status);
  const subs = (await s.json())?.data ?? [];
  const customerId = subs.find((x: any) => x.customer?.shopifyId)?.customer?.shopifyId;
  if (!customerId || String(subs[0]?.customer?.email ?? email).toLowerCase() !== email) return false;
  const o = await fetch(`${LOOP_API}/customer/${customerId}/order/history`, { headers: h });
  if (!o.ok) throw new Error('loop_http_' + o.status);
  const orders = (await o.json())?.data ?? [];
  return orders.some((x: any) => {
    const n = String(x.shopifyOrderNumber ?? '');
    return !!n && (digits === n || (digits.endsWith(n) && digits.length - n.length <= 2));
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: { email?: string; order?: string };
  try { body = await req.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const email = String(body.email ?? '').trim().toLowerCase();
  const digits = String(body.order ?? '').replace(/\D/g, '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || digits.length < 3) return json({ error: 'bad_input' }, 400);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await admin.from('signin_attempts').select('id', { count: 'exact', head: true }).eq('email', email).gte('at', since);
  if ((count ?? 0) >= MAX_FAILS) return json({ error: 'too_many_tries' }, 429);

  const { data: manual } = await admin.from('manual_access').select('access_code').eq('email', email).maybeSingle();
  const gift = !!manual && String(manual.access_code).replace(/\D/g, '') === digits;
  let ok = gift;
  if (!ok) try { ok = await orderMatches(email, digits); }
  catch (e) { console.error('order-signin', (e as Error).message); return json({ error: 'lookup_failed' }, 502); }
  if (!ok) { await admin.from('signin_attempts').insert({ email }); return json({ error: 'no_match' }, 401); }

  // Make sure the parent has an account, then issue a session without sending any email.
  const created = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (created.error && !/already/i.test(created.error.message)) { console.error('createUser', created.error.message); return json({ error: 'account_failed' }, 500); }
  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  const hash = link.data?.properties?.hashed_token;
  if (!hash) { console.error('generateLink', link.error?.message); return json({ error: 'account_failed' }, 500); }
  // A separate client for this step: verifyOtp switches a client to acting as the user, which would
  // make the admin writes below run under the parent's own (read-only) permissions.
  const authClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await authClient.auth.verifyOtp({ type: 'magiclink', token_hash: hash });
  if (error || !data.session) { console.error('verifyOtp', error?.message); return json({ error: 'account_failed' }, 500); }
  await admin.from('signin_attempts').delete().eq('email', email);
  if (gift) await admin.from('profiles').update({ plan: 'plus', plus_source: 'gift', plus_until: null, updated_at: new Date().toISOString() }).eq('id', data.session.user.id);
  return json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
});
