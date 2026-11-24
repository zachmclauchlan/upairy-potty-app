// Guided tour targets: screens tag the parts of the app the tour points at (tourRef('timer')), and the
// tour measures where they are on screen to draw the spotlight around them.
export type Rect = { x: number; y: number; w: number; h: number };

const refs = new Map<string, any>();

/** Attach to a View: <View ref={tourRef('timer')} collapsable={false}>. */
export function tourRef(key: string) {
  return (el: any) => { if (el) refs.set(key, el); else refs.delete(key); };
}

/** Where a tagged element is on screen right now, or null if it isn't showing. */
export function measureTarget(key: string): Promise<Rect | null> {
  return new Promise(resolve => {
    const el = refs.get(key);
    if (!el?.measureInWindow) return resolve(null);
    let done = false;
    const t = setTimeout(() => { if (!done) { done = true; resolve(null); } }, 600);
    el.measureInWindow((x: number, y: number, w: number, h: number) => {
      if (done) return; done = true; clearTimeout(t);
      resolve(w > 0 && h > 0 ? { x, y, w, h } : null);
    });
  });
}
