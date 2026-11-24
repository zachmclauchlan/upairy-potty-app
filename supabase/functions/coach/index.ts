// AI coach: answers a parent's potty training question with Claude.
// Needs the secret ANTHROPIC_API_KEY (Supabase → Edge Functions → Secrets).
// The app sends only the question, recent chat, and an anonymous summary of the child's data.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk@1.13.0';
import { COACH_SKILL } from './skill.ts';

// The UpAiry Potty Playbook (coach-playbook/*.md) lives in the coach_content table, so it can be
// updated without redeploying. Kept in memory for 10 minutes.
let playbook = { text: '', at: 0 };
async function loadPlaybook(admin: ReturnType<typeof createClient>) {
  if (playbook.text && Date.now() - playbook.at < 600_000) return playbook.text;
  const { data } = await admin.from('coach_content').select('body').eq('id', 'playbook').maybeSingle();
  if (data?.body) playbook = { text: data.body as string, at: Date.now() };
  return playbook.text;
}

const DAILY_LIMIT = 20;            // questions per parent per day
const MODEL = 'claude-opus-5-5';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const clip = (s: unknown, n: number) => String(s ?? '').slice(0, n);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // Who is asking? Only signed-in parents can use the coach.
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const { data: userData } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (!user) return json({ error: 'not_signed_in' }, 401);

  let body: { question?: string; history?: { role: string; text: string }[]; context?: string; tz?: string };
  try { body = await req.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const question = clip(body.question, 1000).trim();
  if (!question) return json({ error: 'empty_question' }, 400);

  // The coach is part of Potty Up (a Loop subscription, or gifted access).
  const { data: profile } = await admin.from('profiles').select('plan').eq('id', user.id).maybeSingle();
  if (profile?.plan !== 'plus') return json({ error: 'not_plus' }, 403);

  // Daily limit keeps costs predictable. The day is the parent's local day; a failed answer is refunded.
  const tz = clip(body.tz, 64) || 'UTC';
  const refund = () => admin.rpc('refund_coach_usage', { p_user: user.id, p_tz: tz });
  const { data: used, error: usageErr } = await admin.rpc('bump_coach_usage', { p_user: user.id, p_tz: tz });
  if (usageErr) return json({ error: 'usage_failed' }, 500);
  if ((used as number) > DAILY_LIMIT) return json({ error: 'daily_limit', limit: DAILY_LIMIT }, 429);

  // Rebuild the recent conversation (alternating user/assistant, starting with the user).
  const history = (Array.isArray(body.history) ? body.history : []).slice(-12)
    .map(m => ({ role: m.role === 'assistant' ? 'assistant' as const : 'user' as const, content: clip(m.text, 2000) }))
    .filter(m => m.content);
  while (history.length && history[0].role !== 'user') history.shift();
  const messages: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const m of [...history, { role: 'user' as const, content: question }]) {
    const last = messages[messages.length - 1];
    if (last && last.role === m.role) last.content += '\n\n' + m.content; else messages.push({ ...m });
  }

  const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
  try {
    const res = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      // The skill + playbook never change between requests, so they're cached (1 hour). The child's data comes after.
      system: [
        { type: 'text', text: COACH_SKILL + '\n\n# UpAiry Potty Playbook\n\n' + (await loadPlaybook(admin)), cache_control: { type: 'ephemeral', ttl: '1h' } },
        { type: 'text', text: 'Current data about this child (anonymous):\n' + clip(body.context, 3000) },
      ],
      messages,
    } as any);
    if (res.stop_reason === 'refusal') {
      return json({ reply: "Sorry, I can't help with that one. For anything about your child's health, please check with your doctor or nurse.", remaining: Math.max(0, DAILY_LIMIT - (used as number)) });
    }
    console.log('coach usage', JSON.stringify(res.usage));
    const reply = res.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('').trim();
    return json({ reply, remaining: Math.max(0, DAILY_LIMIT - (used as number)) });
  } catch (e) {
    const status = (e as any)?.status;
    console.error('coach error', status, (e as Error)?.message);
    await refund();
    return json({ error: status === 429 ? 'busy' : 'coach_failed' }, status === 429 ? 503 : 502);
  }
});
