// Sign in with an Apple subscription bought inside the iPhone app (no upairy.com order, no email).
// The app sends the signed receipt Apple gave it (a StoreKit 2 "signed transaction", a JWS). We:
//   1. check it really was signed by Apple (certificate chain up to Apple's root, then the signature),
//   2. check it is for this app's Potty Up subscription and has not ended or been refunded,
//   3. find the account that belongs to that subscription, or make one the first time,
//   4. mark it as Potty Up until the paid-up date, and return a session.
// The app calls this again whenever the paid-up date passes, with Apple's newest receipt, so renewals
// move the date on and a cancelled subscription simply runs out.
// No secrets needed: Apple's receipts are verified with Apple's public root certificate below.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as x509 from 'npm:@peculiar/x509@1.12.3';
import { compactVerify, importSPKI } from 'npm:jose@5.9.6';

const BUNDLE_ID = 'com.upairy.potty';
/** Product IDs in App Store Connect that unlock Potty Up. APPLE_PRODUCT_IDS (comma separated) overrides. */
const PRODUCT_IDS = (Deno.env.get('APPLE_PRODUCT_IDS') ?? 'com.upairy.potty.monthly').split(',').map(s => s.trim()).filter(Boolean);
/** Accounts made here have no real email. This address never receives mail. */
const EMAIL_DOMAIN = 'iap.upairy.com';

// Apple Root CA - G3, from https://www.apple.com/certificateauthority/ (SHA-256 63343abf…653e9179).
const APPLE_ROOT_G3 = 'MIICQzCCAcmgAwIBAgIILcX8iNLFS5UwCgYIKoZIzj0EAwMwZzEbMBkGA1UEAwwSQXBwbGUgUm9vdCBDQSAtIEczMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9uIEF1dGhvcml0eTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwHhcNMTQwNDMwMTgxOTA2WhcNMzkwNDMwMTgxOTA2WjBnMRswGQYDVQQDDBJBcHBsZSBSb290IENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzB2MBAGByqGSM49AgEGBSuBBAAiA2IABJjpLz1AcqTtkyJygRMc3RCV8cWjTnHcFBbZDuWmBSp3ZHtfTjjTuxxEtX/1H7YyYl3J6YRbTzBPEVoA/VhYDKX1DyxNB0cTddqXl5dvMVztK517IDvYuVTZXpmkOlEKMaNCMEAwHQYDVR0OBBYEFLuw3qFYM4iapIqZ3r6966/ayySrMA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMAoGCCqGSM49BAMDA2gAMGUCMQCD6cHEFl4aXTQY2e3v9GwOAEZLuN+yRhHFD/3meoyhpmvOwgPUnPWTxnS4at+qIxUCMG1mihDK1A3UT82NQz60imOlM27jbdoXt2QfyFMm+YhidDkLF1vLUagM6BgD56KyKA==';
// Markers Apple puts in its certificates: the intermediate (WWDR) and the leaf that signs App Store receipts.
const OID_INTERMEDIATE = '1.2.840.113635.100.6.2.1';
const OID_RECEIPT_SIGNER = '1.2.840.113635.100.6.11.1';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const b64ToBytes = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const bytesToB64 = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b)));

interface Receipt {
  bundleId?: string; productId?: string; type?: string; environment?: string;
  originalTransactionId?: string; transactionId?: string;
  expiresDate?: number; revocationDate?: number;
}

/** Check a receipt was signed by Apple and return what it says. Throws if anything doesn't hold. */
async function verifyReceipt(jws: string): Promise<Receipt> {
  const [head] = jws.split('.');
  const header = JSON.parse(new TextDecoder().decode(b64ToBytes(head)));
  if (header.alg !== 'ES256' || !Array.isArray(header.x5c) || header.x5c.length !== 3) throw new Error('bad_header');
  const [leaf, mid, top] = (header.x5c as string[]).map(c => new x509.X509Certificate(c));
  const root = new x509.X509Certificate(APPLE_ROOT_G3);
  // The chain must end at Apple's own root, each certificate must be signed by the next, and all must be in date.
  if (bytesToB64(top.rawData) !== bytesToB64(root.rawData)) throw new Error('not_apple_root');
  const now = new Date();
  for (const c of [leaf, mid, root]) if (now < c.notBefore || now > c.notAfter) throw new Error('cert_out_of_date');
  if (!(await mid.verify({ publicKey: await root.publicKey.export(), signatureOnly: true }))) throw new Error('bad_intermediate');
  if (!(await leaf.verify({ publicKey: await mid.publicKey.export(), signatureOnly: true }))) throw new Error('bad_leaf');
  if (!mid.getExtension(OID_INTERMEDIATE) || !leaf.getExtension(OID_RECEIPT_SIGNER)) throw new Error('wrong_cert_purpose');
  // Now the receipt itself, with the leaf certificate's key.
  const spki = `-----BEGIN PUBLIC KEY-----\n${bytesToB64(leaf.publicKey.rawData)}\n-----END PUBLIC KEY-----`;
  const { payload } = await compactVerify(jws, await importSPKI(spki, 'ES256'));
  return JSON.parse(new TextDecoder().decode(payload));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: { jws?: string };
  try { body = await req.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const jws = String(body.jws ?? '');
  if (jws.length < 100 || jws.length > 20000 || jws.split('.').length !== 3) return json({ error: 'bad_input' }, 400);

  let r: Receipt;
  try { r = await verifyReceipt(jws); }
  catch (e) { console.error('apple-signin verify', (e as Error).message); return json({ error: 'not_verified' }, 401); }

  const otid = String(r.originalTransactionId ?? '');
  if (r.bundleId !== BUNDLE_ID || !PRODUCT_IDS.includes(String(r.productId)) || !/^\d{6,30}$/.test(otid)) return json({ error: 'wrong_product' }, 401);
  if (r.revocationDate || !r.expiresDate || r.expiresDate <= Date.now()) return json({ error: 'expired' }, 401);
  const expires = new Date(r.expiresDate).toISOString();

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  // The account for this subscription: the one we made before, or a new one.
  const email = `apple-${otid}@${EMAIL_DOMAIN}`;
  const { data: known } = await admin.from('apple_subscriptions').select('user_id').eq('original_transaction_id', otid).maybeSingle();
  if (!known) {
    const created = await admin.auth.admin.createUser({ email, email_confirm: true });
    if (created.error && !/already/i.test(created.error.message)) { console.error('createUser', created.error.message); return json({ error: 'account_failed' }, 500); }
  }
  // Issue a session without sending any email (same way as order-signin).
  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  const hash = link.data?.properties?.hashed_token;
  if (!hash) { console.error('generateLink', link.error?.message); return json({ error: 'account_failed' }, 500); }
  const authClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await authClient.auth.verifyOtp({ type: 'magiclink', token_hash: hash });
  if (error || !data.session) { console.error('verifyOtp', error?.message); return json({ error: 'account_failed' }, 500); }
  const userId = data.session.user.id;

  const stamp = new Date().toISOString();
  const saved = await admin.from('apple_subscriptions').upsert({
    original_transaction_id: otid, user_id: userId, product_id: r.productId, environment: r.environment ?? null,
    expires_at: expires, updated_at: stamp,
  });
  const marked = await admin.from('profiles').update({ plan: 'plus', plus_source: 'apple', plus_until: expires, plan_checked_at: stamp, updated_at: stamp }).eq('id', userId);
  if (saved.error || marked.error) { console.error('save', saved.error?.message ?? marked.error?.message); return json({ error: 'save_failed' }, 500); }

  return json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token, email, expires });
});
