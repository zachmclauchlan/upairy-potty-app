// Potty Up as an Apple subscription, for parents who find the app on the App Store and have no
// upairy.com order. iPhone only. The price, billing period and free trial all come from the App Store,
// so they are set in App Store Connect, not here.
//
// How it works: Apple hands the phone a signed receipt for the subscription. We send it to our server
// (the `apple-signin` function), which checks Apple's signature, makes or finds the account that
// belongs to that subscription, and signs the parent in. No email or password. "Restore purchase"
// does the same with the receipt Apple already holds for that Apple ID.
import { Platform } from 'react-native';
import { supabase, SIGNIN_KEY } from './backend';
import { writeItem } from './storage';

/** The subscription's Product ID in App Store Connect. */
export const APPLE_SKU = 'com.upairy.potty.monthly';
export const APPLE_MANAGE_URL = 'https://apps.apple.com/account/subscriptions';

type Iap = typeof import('expo-iap');
let lib: Iap | null | undefined;
/** The purchase library, or null where it doesn't exist (Android, web, and app builds made before it was added). */
function iap(): Iap | null {
  if (lib !== undefined) return lib;
  if (Platform.OS !== 'ios') return (lib = null);
  // Loaded on demand: importing it at the top would crash builds that don't contain the native part.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  try { lib = require('expo-iap') as Iap; } catch { lib = null; }
  return lib;
}
/** Local design preview only (web dev server with the `potty-dev-apple` flag set): shows the Apple option with a sample offer. Never true in a real build. */
const devPreview = () => __DEV__ && Platform.OS === 'web' && !!(globalThis as any).localStorage?.getItem('potty-dev-apple');
export const appleAvailable = () => !!iap() || devPreview();

let connected: Promise<unknown> | null = null;
async function connect(): Promise<Iap> {
  const m = iap();
  if (!m) throw Object.assign(new Error('Apple subscriptions are not available on this device.'), { code: 'unavailable' });
  connected ??= m.initConnection().catch(e => { connected = null; throw e; });
  await connected;
  return m;
}

export type AppleOffer = {
  /** e.g. "$14.99", in the parent's own currency */
  price: string;
  /** e.g. "month" or "3 months" */
  period: string;
  /** Free trial length in words, e.g. "3 days", when this Apple ID can still have one. */
  trial: string | null;
};

const span = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;

/** What the App Store is offering right now: price, period and free trial. Null if it can't be loaded. */
export async function loadOffer(): Promise<AppleOffer | null> {
  if (devPreview()) return { price: '$14.99', period: 'month', trial: '3 days' };
  try {
    const m = await connect();
    const found = await m.fetchProducts({ skus: [APPLE_SKU], type: 'subs' });
    const p = (found ?? []).find((x: any) => x?.id === APPLE_SKU) as any;
    if (!p) return null;
    const n = Number(p.subscriptionPeriodNumberIOS) || 1;
    const unit = p.subscriptionPeriodUnitIOS && p.subscriptionPeriodUnitIOS !== 'empty' ? p.subscriptionPeriodUnitIOS : 'month';
    let trial: string | null = null;
    const intro = (p.subscriptionOffers ?? []).find((o: any) => o?.type === 'introductory' && o?.paymentMode === 'free-trial');
    if (intro?.period?.value) trial = span(intro.period.value * (intro.periodCount || 1), intro.period.unit);
    else if (p.introductoryPricePaymentModeIOS === 'free-trial' && p.introductoryPriceSubscriptionPeriodIOS && p.introductoryPriceSubscriptionPeriodIOS !== 'empty')
      trial = span(Number(p.introductoryPriceNumberOfPeriodsIOS) || 1, p.introductoryPriceSubscriptionPeriodIOS);
    // Apple gives one free trial per Apple ID. Don't promise one to someone who has had theirs.
    if (trial && p.subscriptionGroupIdIOS) {
      const ok = await m.isEligibleForIntroOfferIOS(p.subscriptionGroupIdIOS).catch(() => true);
      if (!ok) trial = null;
    }
    return { price: p.displayPrice, period: n === 1 ? unit : span(n, unit), trial };
  } catch { return null; }
}

export type AppleAccount = { id: string; plusUntil: string | null };

/** Send Apple's signed receipt to our server and sign in as the account that owns the subscription. */
async function signInWithReceipt(jws: string): Promise<AppleAccount> {
  const fail = (code: string, msg: string) => Object.assign(new Error(msg), { code });
  const { data, error } = await supabase.functions.invoke('apple-signin', { body: { jws } });
  if (error) {
    const body = await (error as any).context?.json?.().catch(() => null);
    const code = body?.error ?? (String((error as any).message ?? '').toLowerCase().includes('fetch') ? 'network' : 'failed');
    throw fail(code, code === 'network' ? "Can't connect. Check your internet connection."
      : code === 'expired' ? 'That subscription has ended. Start it again to use Potty Up.'
      : "We couldn't confirm your subscription just now. Tap Restore purchase to try again.");
  }
  if (!data?.access_token) throw fail('failed', "We couldn't confirm your subscription just now. Tap Restore purchase to try again.");
  const { error: e2 } = await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
  if (e2) throw fail('failed', "We couldn't sign you in just now. Tap Restore purchase to try again.");
  // Remember that this phone signs in through Apple, so the app can quietly sign back in (see ensureSession).
  writeItem(SIGNIN_KEY, JSON.stringify({ apple: true }));
  return { id: data.email, plusUntil: data.expires ?? null };
}

/** The newest Potty Up receipt Apple holds for this Apple ID, if the subscription is active. */
async function activeReceipt(m: Iap) {
  const all = await m.getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });
  return (all ?? [])
    .filter((x: any) => x?.productId === APPLE_SKU && x?.purchaseToken)
    .sort((a: any, b: any) => (b.expirationDateIOS ?? 0) - (a.expirationDateIOS ?? 0))[0] as any;
}

/** Open Apple's payment sheet. Returns null if the parent closed it without subscribing. */
export async function startApple(): Promise<AppleAccount | null> {
  const m = await connect();
  let bought: any;
  try {
    const out = await m.requestPurchase({ request: { apple: { sku: APPLE_SKU } }, type: 'subs' });
    bought = Array.isArray(out) ? out[0] : out;
  } catch (e) {
    if (m.isUserCancelledError(e)) return null;
    // It may have failed because this Apple ID is already subscribed: if Apple holds a receipt, sign in with that.
    bought = await activeReceipt(m).catch(() => null);
    if (!bought) throw new Error("The purchase didn't go through. You have not been charged.");
  }
  if (!bought?.purchaseToken) bought = await activeReceipt(m).catch(() => null);
  // Nothing yet: usually "Ask to Buy", where a family organiser has to approve first.
  if (!bought?.purchaseToken) throw Object.assign(new Error('Your purchase is waiting for approval. Once it is approved, tap Restore purchase.'), { code: 'pending' });
  const acct = await signInWithReceipt(bought.purchaseToken);
  await m.finishTransaction({ purchase: bought, isConsumable: false }).catch(() => {});
  return acct;
}

/**
 * Sign in with the subscription already on this Apple ID (new phone, reinstall, signed out).
 * Returns null when Apple has no active Potty Up subscription for it. `ask` makes Apple refresh its
 * records first, which can show an Apple ID password prompt, so it is only used when the parent taps.
 */
export async function restoreApple(ask = false): Promise<AppleAccount | null> {
  const m = await connect();
  if (ask) await m.restorePurchases().catch(() => {});
  const found = await activeReceipt(m);
  if (!found) return null;
  const acct = await signInWithReceipt(found.purchaseToken);
  await m.finishTransaction({ purchase: found, isConsumable: false }).catch(() => {});
  return acct;
}
