// Health check for the Loop connection: is the token working, and which Loop plan is attached to the
// Potty Up product? Returns only plan names, prices and product titles, which are public on the store anyway.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const LOOP_API = 'https://api.loopsubscriptions.com/admin/2026-04';
const POTTY_UP_PRODUCT_ID = '15531787157725';
const POTTY_UP_VARIANT_ID = '68675707666653';
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body, null, 2), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

Deno.serve(async () => {
  const token = Deno.env.get('LOOP_API_TOKEN');
  if (!token) return json({ ok: false, problem: 'LOOP_API_TOKEN secret is not set' });
  const get = async (path: string) => {
    const r = await fetch(LOOP_API + path, { headers: { 'X-Loop-Token': token, Accept: 'application/json' } });
    return { status: r.status, body: await r.json().catch(() => null) };
  };
  const all = await get('/sellingPlanGroup');
  if (all.status !== 200) return json({ ok: false, problem: `Loop said ${all.status}`, loop: all.body?.message ?? null });
  const groups = [];
  for (const g of all.body?.data ?? []) {
    const v = await get(`/sellingPlanGroup/${g.id}/productVariant?pageNo=1&pageSize=50`);
    const products = [...new Set((v.body?.data ?? []).map((x: any) => `${x.productTitle} (${x.productShopifyId})`))];
    groups.push({
      id: g.id, group: g.name, summary: g.summary, products,
      pottyUp: (v.body?.data ?? []).some((x: any) => String(x.productShopifyId) === POTTY_UP_PRODUCT_ID),
      plans: (g.sellingPlans ?? []).map((p: any) => ({ name: p.name, billing: p.billingPolicy, pricing: p.pricingPolicies })),
    });
  }
  const variant = await get(`/productVariant/${POTTY_UP_VARIANT_ID}/sellingPlanGroup`);
  const ready = groups.some(g => g.pottyUp) || (variant.body?.data ?? []).length > 0;
  return json({ ok: true, token: 'working', ready, pottyUpVariantLookup: (variant.body?.data ?? []).map((g: any) => g.name), groups });
});
