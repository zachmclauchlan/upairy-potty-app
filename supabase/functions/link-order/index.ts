// Link a parent's UpAiry order and switch on UpAiry Plus.
// Matches only orders placed with the parent's own verified sign-in email, so nobody can claim
// someone else's order with a receipt. Read-only on Shopify.
// Needs secrets: SHOPIFY_STORE_DOMAIN (e.g. upairy.myshopify.com), SHOPIFY_ADMIN_TOKEN (read_orders).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const PLUS_MONTHS = 6;            // how long an order includes UpAiry Plus (business decision)
const API_VERSION = '2026-07';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

async function shopify(query: string, variables: Record<string, unknown>) {
  const domain = Deno.env.get('SHOPIFY_STORE_DOMAIN'), token = Deno.env.get('SHOPIFY_ADMIN_TOKEN');
  if (!domain || !token) throw new Error('shopify_not_configured');
  const res = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error('shopify_http_' + res.status);
  const out = await res.json();
  if (out.errors) throw new Error('shopify_graphql');
  return out.data;
}

const ORDERS = `query($q: String!) { orders(first: 10, query: $q, sortKey: CREATED_AT, reverse: true) {
  nodes { name createdAt email cancelledAt displayFinancialStatus customer { id } } } }`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const { data: userData } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (!user?.email) return json({ error: 'not_signed_in' }, 401);
  const email = user.email.toLowerCase();

  let body: { order?: string } = {};
  try { body = await req.json(); } catch { /* empty body: match by email */ }
  const orderNo = String(body.order ?? '').replace(/[^0-9A-Za-z-]/g, '').slice(0, 20);

  try {
    // Search by the parent's email, or by order number (then require the email to match).
    const q = orderNo ? `name:#${orderNo}` : `email:${JSON.stringify(email)}`;
    const data = await shopify(ORDERS, { q });
    const order = (data?.orders?.nodes ?? []).find((o: any) =>
      !o.cancelledAt && String(o.email ?? '').toLowerCase() === email && o.displayFinancialStatus !== 'REFUNDED' && o.displayFinancialStatus !== 'VOIDED');
    if (!order) return json({ linked: false, reason: orderNo ? 'order_not_found_for_email' : 'no_orders_for_email' });

    const until = new Date(order.createdAt); until.setMonth(until.getMonth() + PLUS_MONTHS);
    const plusActive = until.getTime() > Date.now();
    const { error } = await admin.from('profiles').update({
      plan: plusActive ? 'plus' : 'free', plus_source: 'order', plus_until: until.toISOString(),
      order_name: order.name, shopify_customer_id: order.customer?.id ?? null, updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    if (error) return json({ error: 'save_failed' }, 500);
    return json({ linked: true, order: order.name, plan: plusActive ? 'plus' : 'free', plus_until: until.toISOString() });
  } catch (e) {
    const msg = (e as Error).message;
    console.error('link-order', msg);
    return json({ error: msg === 'shopify_not_configured' ? 'not_configured' : 'lookup_failed' }, msg === 'shopify_not_configured' ? 503 : 502);
  }
});
