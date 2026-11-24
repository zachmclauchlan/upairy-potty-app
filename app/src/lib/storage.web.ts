// Web (testing in a browser): plain localStorage.
export function readItem(key: string): string | null {
  try { return globalThis.localStorage?.getItem(key) ?? null; } catch { return null; }
}
export function writeItem(key: string, value: string) {
  try { globalThis.localStorage?.setItem(key, value); } catch { /* ignore */ }
}
export function removeItem(key: string) {
  try { globalThis.localStorage?.removeItem(key); } catch { /* ignore */ }
}
