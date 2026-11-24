// Tiny event bus so notifications and deep actions can open sheets anywhere in the app.
type Fn = (arg?: any) => void;
const subs = new Map<string, Set<Fn>>();
export function on(name: string, fn: Fn) { if (!subs.has(name)) subs.set(name, new Set()); subs.get(name)!.add(fn); return () => { subs.get(name)!.delete(fn); }; }
export function emit(name: string, arg?: any) { subs.get(name)?.forEach(f => f(arg)); }
