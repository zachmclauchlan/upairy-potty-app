// Log buttons on the lock-screen timer (widgets/PottyTimer). Each is a link that opens the app:
//   upairypotty://?log=wee&k=<the countdown it belongs to>
// The app logs it the moment it opens, the same way the reminder buttons do.
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { S, update } from './store';
import { logPotty } from './actions';
import { emit } from './bus';
import { toast } from '@/components/ui';

function handle(url: string | null | undefined) {
  if (!url || !S.account || !S.onboarded) return;
  const q = url.indexOf('?');
  if (q < 0) return;
  let what: string | null, k: string | null;
  try { const p = new URLSearchParams(url.slice(q + 1).split('#')[0]); what = p.get('log'); k = p.get('k'); } catch { return; }
  if (!what || !k) return;
  // One tap, one log: the app can be handed the same link again (for example when it restarts).
  const key = `${k}:${what}`;
  if (S.lastQuick === key) return;
  const nm = S.child.name || 'Logged';
  if (what === 'wee') { logPotty('success', 'wee'); toast(`${nm}: wee on the potty`, 'Logged from your lock screen'); emit('celebrate'); }
  else if (what === 'poo') { logPotty('success', 'poo'); toast(`${nm}: poo on the potty`, 'Logged from your lock screen'); emit('celebrate'); }
  else if (what === 'nothing') { logPotty('tried', null); toast('Logged: sat, nothing came', 'Practice still counts'); }
  else if (what === 'accident') { logPotty('accident', 'wee'); toast('Accident logged', "No worries. That's how they learn."); }
  else return;
  update(s => { s.lastQuick = key; });
}

/** Start listening for lock-screen button taps, including the one that opened the app. Returns a stop function. */
export function watchQuickLinks() {
  if (Platform.OS === 'web') return () => {};
  Linking.getInitialURL().then(handle).catch(() => {});
  const sub = Linking.addEventListener('url', ({ url }) => handle(url));
  return () => sub.remove();
}
