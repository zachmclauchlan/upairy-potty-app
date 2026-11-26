// Google Play images, made from the same raw captures as the App Store screenshots (../screenshots/raw):
//   screenshots/*.png   1080 x 1920 (Google allows at most 2:1, so these are shorter than the iPhone ones)
//   feature-graphic.png 1024 x 500, the banner at the top of the Play listing
//   node make.mjs
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = fileURLToPath(new URL('./', import.meta.url));
const RAW = pathToFileURL(HERE + '../screenshots/raw/').href;
const FONT = pathToFileURL(HERE + '../../app/node_modules/@expo-google-fonts/chewy/400Regular/Chewy_400Regular.ttf').href;

const SHOTS = [
  ['1-today', 'Know when to\noffer the potty', '#CFEAC4'],
  ['2-program', 'A day-by-day\nplan to follow', '#CFE3FF'],
  ['3-coach', 'Ask Lara anything,\nany time', '#FFD9B8'],
  ['4-kid', 'Stickers and rewards\nkids love', '#E2D6F7'],
  ['5-progress', 'Watch it click,\nday by day', '#CFEAC4'],
];

const shot = (img, title, bg) => `<!doctype html><meta charset="utf-8"><style>
  @font-face { font-family: Chewy; src: url('${FONT}'); }
  html, body { margin: 0; }
  body { width: 1080px; height: 1920px; background: ${bg}; overflow: hidden; position: relative; font-family: Chewy; }
  h1 { margin: 0; position: absolute; top: 84px; left: 0; right: 0; text-align: center; white-space: pre-line; font-weight: 400;
       font-size: 118px; line-height: 134px; color: #fff; -webkit-text-stroke: 21px #1F1B16; paint-order: stroke fill; text-shadow: 0 10px 0 #1F1B16; }
  .phone { position: absolute; left: 140px; top: 430px; width: 800px; box-sizing: border-box; border: 12px solid #1F1B16; border-bottom: 0;
           border-radius: 104px 104px 0 0; overflow: hidden; background: #F7F4EE; height: 1500px; }
  .phone img { display: block; width: 100%; margin-top: 46px; }
</style><h1>${title}</h1><div class="phone"><img src="${img}"></div>`;

const feature = `<!doctype html><meta charset="utf-8"><style>
  @font-face { font-family: Chewy; src: url('${FONT}'); }
  html, body { margin: 0; }
  body { width: 1024px; height: 500px; background: #CFEAC4; overflow: hidden; position: relative; font-family: Chewy; }
  .name { position: absolute; left: 70px; top: 96px; font-size: 150px; line-height: 150px; color: #fff; -webkit-text-stroke: 24px #1F1B16; paint-order: stroke fill; text-shadow: 0 11px 0 #1F1B16; }
  .tag { position: absolute; left: 76px; top: 316px; font-size: 54px; color: #1F1B16; }
  svg { position: absolute; right: 80px; top: 46px; width: 220px; height: 220px; transform: rotate(12deg); }
</style>
<div class="name">Potty Up</div><div class="tag">Potty training, one day at a time</div>
<svg viewBox="0 0 24 24"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z" fill="#fff" stroke="#1F1B16" stroke-width="1.4" stroke-linejoin="round"/></svg>`;

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--allow-file-access-from-files'] });
const p = await b.newPage();
const tmp = HERE + '_page.html';
const render = async (html, w, h, out) => {
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  fs.writeFileSync(tmp, html);
  await p.goto(pathToFileURL(tmp).href);
  await p.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 400));
  await p.screenshot({ path: out });
  console.log(out.split('/').pop());
};
for (const [name, title, bg] of SHOTS) await render(shot(RAW + name + '.png', title, bg), 1080, 1920, HERE + 'screenshots/' + name + '.png');
await render(feature, 1024, 500, HERE + 'feature-graphic.png');
fs.unlinkSync(tmp);
await b.close();
