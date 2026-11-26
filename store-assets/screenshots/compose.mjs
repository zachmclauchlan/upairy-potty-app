// Turns the raw captures (raw/*.png, from capture.mjs) into finished App Store screenshots:
// a headline in the app's lettering over a pastel background, with the screen in a phone outline.
// Output: 1290 x 2796 px PNGs (the size App Store Connect asks for under "iPhone 6.9-inch display").
//   node compose.mjs
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = fileURLToPath(new URL('./', import.meta.url));
const FONT = pathToFileURL(HERE + '../../app/node_modules/@expo-google-fonts/chewy/400Regular/Chewy_400Regular.ttf').href;

const SHOTS = [
  ['1-today', 'Know when to\noffer the potty', '#CFEAC4'],
  ['2-program', 'A day-by-day\nplan to follow', '#CFE3FF'],
  ['3-coach', 'Ask Lara anything,\nany time', '#FFD9B8'],
  ['4-kid', 'Stickers and rewards\nkids love', '#E2D6F7'],
  ['5-progress', 'Watch it click,\nday by day', '#CFEAC4'],
];

const page = (img, title, bg) => `<!doctype html><meta charset="utf-8"><style>
  @font-face { font-family: Chewy; src: url('${FONT}'); }
  html, body { margin: 0; }
  body { width: 1290px; height: 2796px; background: ${bg}; overflow: hidden; position: relative; font-family: Chewy; }
  h1 { margin: 0; position: absolute; top: 120px; left: 0; right: 0; text-align: center; white-space: pre-line;
       font-weight: 400; font-size: 148px; line-height: 168px; color: #fff;
       -webkit-text-stroke: 26px #1F1B16; paint-order: stroke fill; text-shadow: 0 12px 0 #1F1B16; }
  .phone { position: absolute; left: 150px; top: 580px; width: 990px; box-sizing: border-box; border: 14px solid #1F1B16; border-radius: 130px;
           overflow: hidden; background: #F7F4EE; box-shadow: 0 22px 0 #1F1B16; }
  .bar { height: 132px; display: flex; align-items: flex-end; justify-content: space-between; padding: 0 86px 22px; box-sizing: border-box;
         font: 600 44px -apple-system, 'Segoe UI', sans-serif; color: #1F1B16; }
  .bar svg { height: 34px; }
  .phone img { display: block; width: 100%; }
</style>
<h1>${title}</h1>
<div class="phone">
  <div class="bar"><span>9:41</span>
    <svg viewBox="0 0 150 34" fill="#1F1B16"><rect x="0" y="20" width="8" height="12" rx="2"/><rect x="12" y="14" width="8" height="18" rx="2"/><rect x="24" y="8" width="8" height="24" rx="2"/><rect x="36" y="2" width="8" height="30" rx="2"/>
      <path d="M72 9c7 0 13 3 18 8l-4 4c-4-4-9-6-14-6s-10 2-14 6l-4-4c5-5 11-8 18-8zm0 11c4 0 7 2 10 4l-10 10-10-10c3-2 6-4 10-4z"/>
      <rect x="104" y="6" width="38" height="22" rx="6" fill="none" stroke="#1F1B16" stroke-width="2.5"/><rect x="108" y="10" width="30" height="14" rx="3"/><rect x="144" y="13" width="4" height="8" rx="2"/></svg>
  </div>
  <img src="${img}">
</div>`;

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--allow-file-access-from-files'] });
const p = await b.newPage();
await p.setViewport({ width: 1290, height: 2796, deviceScaleFactor: 1 });
for (const [name, title, bg] of SHOTS) {
  const html = HERE + '_page.html';
  fs.writeFileSync(html, page(pathToFileURL(HERE + 'raw/' + name + '.png').href, title, bg));
  await p.goto(pathToFileURL(html).href);
  await p.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 400));
  await p.screenshot({ path: HERE + name + '.png' });
  console.log(name);
}
fs.unlinkSync(HERE + '_page.html');
await b.close();
