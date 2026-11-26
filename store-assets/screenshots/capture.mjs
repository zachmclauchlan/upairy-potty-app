// Captures the app's screens for the store listing, from the local web preview (http://localhost:8081),
// filled with the sample week for a child called Mia. Run with the dev server running:
//   node capture.mjs        (needs puppeteer-core and Chrome)
// Then compose.mjs turns the raw captures into the finished store screenshots.
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
const OUT = fileURLToPath(new URL('./raw/', import.meta.url));
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage();
await p.setViewport({ width: 430, height: 932 - 59, deviceScaleFactor: 3 });   // 59pt is left for the phone's status bar, drawn in compose
await p.evaluateOnNewDocument(() => {
  // Pretend it is 10:20 on a weekday morning, so Today shows the timer counting down.
  const real = Date, t = new real(); t.setHours(10, 20, 0, 0);
  const shift = t.getTime() - real.now();
  class Fake extends real { constructor(...a) { if (a.length) super(...a); else super(real.now() + shift); } static now() { return real.now() + shift; } }
  globalThis.Date = Fake;
  localStorage.setItem('potty-dev-preview', '1');
  if (!localStorage.getItem('upairy-potty-state')) localStorage.setItem('upairy-potty-state', JSON.stringify({
    v: 1, courseV: 1, account: { id: 'demo@example.com', plan: 'plus', since: Date.now() }, onboarded: true, toured: true, aiOk: true,
    child: { name: 'Mia', age: '2 to 2½', words: '' }, backup: { on: false, at: 0, owner: null }, rem: { on: false },
    chat: [
      { r: 'u', t: 'She sits happily but nothing comes, then has an accident ten minutes later. What should I do?' },
      { r: 'a', src: 'Lara', t: "That pattern is really common in the first week, and it's a good sign: she's holding on, which is a skill.\n\nTry these today:\n• Offer the potty again 5 to 10 minutes after a sit with nothing.\n• Keep sits short and relaxed, a song's length is plenty.\n• Give a drink with each meal so the timing gets easier to read.\n\nHer logs show the gap between wees is getting longer, so you're on the right track." },
    ],
  }));
});
const open = async (path, wait = 1500) => { await p.goto('http://localhost:8081' + path, { waitUntil: 'networkidle2', timeout: 120000 }); await p.evaluate(() => document.fonts.ready); await new Promise(r => setTimeout(r, wait)); };
await open('/');
await p.evaluate(() => globalThis.__pottyDemo());
for (const [name, path] of [['1-today', '/'], ['2-program', '/program'], ['3-coach', '/coach'], ['4-kid', '/kid'], ['5-progress', '/progress']]) {
  await open(path);
  await p.screenshot({ path: OUT + name + '.png' });
  console.log(name);
}
await b.close();
