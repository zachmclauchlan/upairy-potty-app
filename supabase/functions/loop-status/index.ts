// Health check for the Loop connection: is the token working, and does the Potty Up product
// have a Loop subscription plan? Returns only plan names and prices, which are public on the store anyway.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const LOOP_API = 'https://api.loopsubscriptions.com/admin/2026-04';
const POTTY_UP_VARIANT_ID = '68675707666653';
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body, null, 2), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

Deno.serve(async () => {
  const token = Deno.env.get('LOOP_API_TOKEN');
  if (!token) return json({ ok: false, problem: 'LOOP_API_TOKEN secret is not set' });
  const res = await fetch(`${LOOP_API}/productVariant/${POTTY_UP_VARIANT_ID}/sellingPlanGroup`, { headers: { 'X-Loop-Token': token, Accept: 'application/json' } });
  const body = await res.json().catch(() => null);
  if (!res.ok) return json({ ok: false, problem: `Loop said ${res.status}`, loop: body?.message ?? null });
  const groups = (body?.data ?? []).map((g: any) => ({
    group: g.name,
    plans: (g.sellingPlans ?? []).map((p: any) => ({ name: p.name, billing: p.billingPolicy, pricing: p.pricingPolicies })),
  }));
  return json({ ok: true, token: 'working', pottyUpPlans: groups, ready: groups.length > 0 });
});
