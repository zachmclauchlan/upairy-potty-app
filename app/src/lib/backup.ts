// Cloud backup: copies the family's app data to their UpAiry account, so it follows them to a new phone.
// The phone stays the main copy. We upload a snapshot a little while after changes, and restore it when
// the parent signs in on a phone that doesn't have their data. Only the account owner can read it
// (row-level security), and it's deleted with the account.
import { supabase } from './backend';
import { S, fresh, onCommit, replaceState, commit, type State } from './store';

const WAIT_MS = 15000;               // upload 15 s after the last change
let timer: ReturnType<typeof setTimeout> | null = null;
let lastSent = '';

/** The parts of the app state worth backing up (not the sign-in, not the backup settings). */
function snapshot(): Omit<State, 'account' | 'backup'> {
  const { account: _a, backup: _b, ...rest } = S;
  return rest;
}

async function userId() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/** Upload now if anything changed since the last upload. */
export async function backupNow(): Promise<boolean> {
  if (!S.account || !S.backup.on || !S.onboarded) return false;
  const id = await userId();
  if (!id) return false;
  const body = JSON.stringify(snapshot());
  if (body === lastSent) return true;
  const { error } = await supabase.from('backups').upsert({ user_id: id, data: JSON.parse(body), updated_at: new Date().toISOString() });
  if (error) return false;
  lastSent = body;
  S.backup.at = Date.now();          // no commit(): this field alone shouldn't trigger another upload
  return true;
}

/** Start watching for changes. Call once when the app opens. */
export function startBackup() {
  return onCommit(() => {
    if (!S.account || !S.backup.on) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { backupNow().catch(() => {}); }, WAIT_MS);
  });
}

/** The backup saved on this account, if any. Throws if it couldn't be checked (e.g. offline). */
export async function fetchBackup(): Promise<{ data: Partial<State>; at: number } | null> {
  const id = await userId();
  if (!id) return null;
  const { data, error } = await supabase.from('backups').select('data, updated_at').eq('user_id', id).maybeSingle();
  if (error) throw error;
  return data ? { data: data.data as Partial<State>, at: new Date(data.updated_at).getTime() } : null;
}

/** If this phone holds another account's child data, that account's email. */
export function otherOwner(email: string): string | null {
  return S.onboarded && S.backup.owner && S.backup.owner !== email ? S.backup.owner : null;
}

/**
 * Right after sign-in: decide what this phone should show.
 * - The phone already holds this parent's data: keep it (it's the newest) and back it up.
 * - The phone holds another account's data: only replaced if the parent chose to (choice 'replace').
 * - Otherwise restore this account's backup, or keep what's here. Never wipes on a failed check.
 * Returns the date of a restored backup, if one was restored.
 */
export async function afterSignIn(email: string, account: NonNullable<State['account']>, choice: 'replace' | 'keep' = 'replace'): Promise<number | null> {
  const mine = S.backup.owner === email || (S.backup.owner === null && S.onboarded && !!S.account);
  const keep = () => { S.account = account; S.backup.owner = email; commit(); backupNow().catch(() => {}); return null; };
  if ((mine && S.onboarded) || choice === 'keep') return keep();
  let saved: Awaited<ReturnType<typeof fetchBackup>>;
  try { saved = await fetchBackup(); } catch { return keep(); }   // couldn't check: never wipe
  const f = fresh();
  if (saved?.data && (saved.data as State).onboarded) {
    const d = saved.data as State;
    replaceState({ ...f, ...d, rem: { ...f.rem, ...(d.rem || {}) }, child: { ...f.child, ...(d.child || {}) }, account, backup: { on: true, at: saved.at, owner: email } });
    lastSent = JSON.stringify(snapshot());
    return saved.at;
  }
  // Nothing saved for this account, and the parent chose not to keep the other account's data.
  if (otherOwner(email)) { replaceState({ ...f, account, backup: { ...f.backup, owner: email } }); return null; }
  return keep();
}

/** Turn backup off and delete the copy on the server. */
export async function turnOffBackup() {
  const id = await userId();
  if (id) await supabase.from('backups').delete().eq('user_id', id);
  S.backup.on = false; S.backup.at = 0; lastSent = ''; commit();
}

export async function turnOnBackup() {
  S.backup.on = true; commit();
  return backupNow();
}
