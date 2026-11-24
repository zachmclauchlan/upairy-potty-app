// Permanently delete the signed-in parent's UpAiry account (Apple requires this in-app).
// Profile, perk claims and coach usage are removed by cascade. Child data was never on the server.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const { data } = await admin.auth.getUser(token);
  if (!data?.user) return json({ error: 'not_signed_in' }, 401);
  const { error } = await admin.auth.admin.deleteUser(data.user.id);
  if (error) return json({ error: 'delete_failed' }, 500);
  return json({ deleted: true });
});
