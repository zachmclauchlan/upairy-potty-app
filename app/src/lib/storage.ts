// Native: key-value storage backed by SQLite, kept on the device only.
import Storage from 'expo-sqlite/kv-store';

export function readItem(key: string): string | null {
  try { return Storage.getItemSync(key); } catch { return null; }
}
export function writeItem(key: string, value: string) {
  try { Storage.setItemSync(key, value); } catch { /* storage full or unavailable: keep running in memory */ }
}
export function removeItem(key: string) {
  try { Storage.removeItemSync(key); } catch { /* ignore */ }
}
