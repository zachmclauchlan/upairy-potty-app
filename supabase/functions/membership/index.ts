// Does this parent have Potty Up?
// Potty Up is sold on upairy.com as a product in the cart, billed as a Loop subscription. We ask Loop's Admin API for the
// subscriptions on the parent's own verified sign-in email, and unlock the app when one is
// ACTIVE and contains the Potty Up product. Read-only on Loop and Shopify.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   LOOP_API_TOKEN          Loop → Settings → API tokens and webhooks (scope: Read subscription contracts)
//   MEMBERSHIP_PRODUCT_ID   Shopify product ID of the "Potty Up" app product (number or gid://shopify/Product/…)
//   SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_TOKEN   optional, only to show the parent's latest order
// A manual "gift" plan in the database (e.g. for Amazon buyers) is kept regardless.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const LOOP_API = 'https://api.loopsubscriptions.com/admin/2026-04';
const SHOPIFY_API_VERSION = '2026-07';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const numericId = (v: unknown) => String(v ?? '').split('/').pop() ?? '';

type LoopLine = { productShopifyId?: string | number; productTitle?: string; sellingPlanGroupName?: string; name?: string };
type LoopSub = { id: number; status: string; nextBillingDateEpoch?: number | null; isMarkedForCancellation?: boolean; lines?: LoopLine[] };

/** All Loop subscriptions for an email. A 404 means Loop has no such customer. */
async function loopSubscriptions(email: string): Promise<LoopSub[]> {
  const token = Deno.env.get('LOOP_API_TOKEN');
  if (!token) throw new Error('loop_not_configured');
  const res = await fetch(`${LOOP_API}/customer/${encodeURIComponent(email)}/subscription`, { headers: { 'X-Loop-Token': token, Accept: 'application/json' } });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error('loop_http_' + res.status);
  const out = await res.json();
  return Array.isArray(out?.data) ? out.data : [];
}

/** Does this subscription include the membership? Matches the product ID, or the name if no ID is set. */
function isMembership(sub: LoopSub) {
  const wanted = numericId(Deno.env.get('MEMBERSHIP_PRODUCT_ID'));
  return (sub.lines ?? []).some(l => wanted
    ? numericId(l.productShopifyId) === wanted
    : /potty ?up|upairy plus|membership/i.test(`${l.productTitle ?? ''} ${l.sellingPlanGroupName ?? ''} ${l.name ?? ''}`));
}

/** Optional: the parent's latest Shopify order, to show in the app. */
async function latestOrder(email: string): Promise<string | null> {
  const domain = Deno.env.get('SHOPIFY_STORE_DOMAIN'), token = Deno.env.get('SHOPIFY_ADMIN_TOKEN');
  if (!domain || !token) return null;
  const q = `query($q: String!) { orders(first: 1, query: $q, sortKey: CREATED_AT, reverse: true) { nodes { name email cancelledAt } } }`;
  const res = await fetch(`https://${domain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query: q, variables: { q: `email:${JSON.stringify(email)}` } }),
  }).catch(() => null);
  if (!res?.ok) return null;
  const o = (await res.json())?.data?.orders?.nodes?.[0];
  return o && !o.cancelledAt && String(o.email ?? '').toLowerCase() === email ? o.name : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const { data: userData } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (!user?.email) return json({ error: 'not_signed_in' }, 401);
  const email = user.email.toLowerCase();

  const { data: profile } = await admin.from('profiles').select('plan, plus_source, plus_until').eq('id', user.id).maybeSingle();
  const gift = profile?.plus_source === 'gift' && (!profile.plus_until || new Date(profile.plus_until).getTime() > Date.now());

  try {
    const subs = await loopSubscriptions(email);
    const active = subs.find(s => s.status === 'ACTIVE' && isMembership(s));
    const member = !!active;
    const order = await latestOrder(email);
    const nextBilling = active?.nextBillingDateEpoch ? new Date(active.nextBillingDateEpoch * 1000).toISOString() : null;
    const plan = member || gift ? 'plus' : 'free';
    const { error } = await admin.from('profiles').update({
      plan,
      plus_source: member ? 'membership' : gift ? 'gift' : null,
      plus_until: member ? null : gift ? profile?.plus_until ?? null : null,
      order_name: order,
      has_ordered: !!order || subs.length > 0,
      plan_checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    if (error) return json({ error: 'save_failed' }, 500);
    return json({ plan, member, gift, order, next_billing: nextBilling, cancelling: !!active?.isMarkedForCancellation });
  } catch (e) {
    const msg = (e as Error).message;
    console.error('membership', msg);
    // Loop unreachable or not set up yet: keep whatever plan they already have.
    return json({ plan: profile?.plan ?? 'free', member: profile?.plus_source === 'membership', gift, error: msg === 'loop_not_configured' ? 'not_configured' : 'lookup_failed' });
  }
});
