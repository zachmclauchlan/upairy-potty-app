// Sign in with the email from an upairy.com order plus ONE of: the order number, the last name, or the
// postcode on it. No password, no emailed code. We look the parent up in Loop (which holds the orders
// and addresses behind every subscription, including Potty Up) and, if configured, Shopify.
// If the answer matches that email's details, we sign the parent in and return a session.
// Whether Potty Up is unlocked is decided afterwards by the `membership` function.
// Failed tries are limited per email (8 an hour), so order numbers, names and postcodes can't be guessed.
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

const SHOPIFY_API_VERSION = '2026-07';
/** Last names compare without case, accents, spaces or punctuation ("O'Brien" = "obrien"). */
const nameKey = (s: unknown) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
/** Postcodes compare without case or spaces ("sw1a 1aa" = "SW1A1AA", "6011" = "6011"). */
const zipKey = (s: unknown) => String(s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

interface Profile { orders: string[]; names: Set<string>; zips: Set<string> }

/** Everything we can match a sign-in against for this email: order numbers from Loop, and the
 *  last names and postcodes on the parent's Loop subscriptions, orders and Shopify customer profile. */
async function profileFor(email: string): Promise<Profile | null> {
  const h = { 'X-Loop-Token': Deno.env.get('LOOP_API_TOKEN') ?? '', Accept: 'application/json' };
  const s = await fetch(`${LOOP_API}/customer/${encodeURIComponent(email)}/subscription`, { headers: h });
  if (s.status === 404) return null;
  if (!s.ok) throw new Error('loop_http_' + s.status);
  const subs = (await s.json())?.data ?? [];
  const customerId = subs.find((x: any) => x.customer?.shopifyId)?.customer?.shopifyId;
  if (!customerId || String(subs[0]?.customer?.email ?? email).toLowerCase() !== email) return null;
  const p: Profile = { orders: [], names: new Set(), zips: new Set() };
  const take = (addr: any) => {
    if (!addr) return;
    const n = nameKey(addr.lastName), z = zipKey(addr.zip);
    if (n.length >= 2) p.names.add(n);
    if (z.length >= 3) p.zips.add(z);
  };
  for (const x of subs) { take(x.shippingAddress); take(x.billingAddress); take(x.customer); }
  const o = await fetch(`${LOOP_API}/customer/${customerId}/order/history`, { headers: h });
  if (!o.ok) throw new Error('loop_http_' + o.status);
  for (const x of (await o.json())?.data ?? []) {
    if (x.shopifyOrderNumber) p.orders.push(String(x.shopifyOrderNumber));
    take(x.shippingAddress); take(x.billingAddress);
  }
  await shopifyDetails(email, take).catch(e => console.error('shopify', (e as Error).message));
  return p;
}

/** Optional (needs SHOPIFY_STORE_DOMAIN + SHOPIFY_ADMIN_TOKEN): names and postcodes from the Shopify customer and recent orders. */
async function shopifyDetails(email: string, take: (addr: any) => void) {
  const domain = Deno.env.get('SHOPIFY_STORE_DOMAIN'), token = Deno.env.get('SHOPIFY_ADMIN_TOKEN');
  if (!domain || !token) return;
  const q = `query($q: String!) {
    customers(first: 1, query: $q) { nodes { email lastName defaultAddress { lastName zip } addressesV2(first: 10) { nodes { lastName zip } } } }
    orders(first: 10, query: $q, sortKey: CREATED_AT, reverse: true) { nodes { email shippingAddress { lastName zip } billingAddress { lastName zip } } }
  }`;
  const res = await fetch(`https://${domain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query: q, variables: { q: `email:${JSON.stringify(email)}` } }),
  });
  if (!res.ok) throw new Error('http_' + res.status);
  const d = (await res.json())?.data;
  for (const c of d?.customers?.nodes ?? []) {
    if (String(c.email ?? '').toLowerCase() !== email) continue;
    take(c); take(c.defaultAddress); for (const a of c.addressesV2?.nodes ?? []) take(a);
  }
  for (const o of d?.orders?.nodes ?? []) {
    if (String(o.email ?? '').toLowerCase() !== email) continue;
    take(o.shippingAddress); take(o.billingAddress);
  }
}

/** The second box can hold the order number, the last name, or the postcode. */
function answerMatches(p: Profile, answer: string): boolean {
  const digits = answer.replace(/\D/g, ''), name = nameKey(answer), zip = zipKey(answer);
  // Order number: "#1314664", "1314664" or Loop's shorter "314664"; or a pasted line containing it.
  if (digits.length >= 3 && p.orders.some(n => digits === n || (digits.endsWith(n) && digits.length - n.length <= 2))) return true;
  if (zip.length >= 3 && p.zips.has(zip)) return true;
  if (!/\d/.test(answer) && name.length >= 2 && p.names.has(name)) return true;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: { email?: string; order?: string };
  try { body = await req.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const email = String(body.email ?? '').trim().toLowerCase();
  const answer = String(body.order ?? '').trim().slice(0, 120);   // order number, last name or postcode
  const digits = answer.replace(/\D/g, '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || (digits.length < 3 && nameKey(answer).length < 2)) return json({ error: 'bad_input' }, 400);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await admin.from('signin_attempts').select('id', { count: 'exact', head: true }).eq('email', email).gte('at', since);
  if ((count ?? 0) >= MAX_FAILS) return json({ error: 'too_many_tries' }, 429);

  const { data: manual } = await admin.from('manual_access').select('access_code').eq('email', email).maybeSingle();
  const gift = !!manual && digits.length >= 3 && String(manual.access_code).replace(/\D/g, '') === digits;
  let ok = gift;
  if (!ok) try { const p = await profileFor(email); ok = !!p && answerMatches(p, answer); }
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
