// Ask a happy parent for an App Store / Google Play rating, once, at a good moment: a potty success,
// after they've used the app for a while and it's working. The phone's own rating box is used, and the
// store decides whether it actually appears (it limits how often).
import { Platform } from 'react-native';
import { S, update, daysBetween } from './store';

const MIN_DAYS = 5;        // days since they first set the app up
const MIN_WINS = 10;       // potty successes logged

type Lib = typeof import('expo-store-review');
function lib(): Lib | null {
  if (Platform.OS === 'web') return null;
  // Loaded on demand: importing it at the top would crash app builds made before it was added.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  try { return require('expo-store-review') as Lib; } catch { return null; }
}

/** Call after a potty success is logged. Does nothing unless the moment is right. */
export async function maybeAskForRating() {
  try {
    if (S.rateAsked || S.sample || !S.onboarded) return;
    if (daysBetween(S.memberSince, Date.now()) < MIN_DAYS) return;
    if (S.events.filter(e => e.type === 'potty' && e.outcome === 'success').length < MIN_WINS) return;
    const m = lib();
    if (!m || !(await m.isAvailableAsync())) return;
    update(s => { s.rateAsked = Date.now(); });
    await m.requestReview();
  } catch { /* never in the way */ }
}
