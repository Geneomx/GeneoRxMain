const puppeteer = require('./node_modules/puppeteer');
const path = require('path');

// Android phone screenshots (390x844 @3x = 1170x2532)
const ANDROID = [
  { s: 1, out: 'phone-screen-1.png', w: 390, h: 844, dpr: 3 },
  { s: 2, out: 'phone-screen-2.png', w: 390, h: 844, dpr: 3 },
  { s: 3, out: 'phone-screen-3.png', w: 390, h: 844, dpr: 3 },
  { s: 4, out: 'phone-screen-4.png', w: 390, h: 844, dpr: 3 },
];

// iPhone 6.9" screenshots (440x956 @3x = 1320x2868) — required for App Store
const IOS_69 = [
  { s: 1, out: 'ios-69-screen-1.png', w: 440, h: 956, dpr: 3 },
  { s: 2, out: 'ios-69-screen-2.png', w: 440, h: 956, dpr: 3 },
  { s: 3, out: 'ios-69-screen-3.png', w: 440, h: 956, dpr: 3 },
  { s: 4, out: 'ios-69-screen-4.png', w: 440, h: 956, dpr: 3 },
];

// iPhone 6.5" screenshots (414x896 @3x = 1242x2688) — required for App Store
const IOS_65 = [
  { s: 1, out: 'ios-65-screen-1.png', w: 414, h: 896, dpr: 3 },
  { s: 2, out: 'ios-65-screen-2.png', w: 414, h: 896, dpr: 3 },
  { s: 3, out: 'ios-65-screen-3.png', w: 414, h: 896, dpr: 3 },
  { s: 4, out: 'ios-65-screen-4.png', w: 414, h: 896, dpr: 3 },
];

const ALL = [...ANDROID, ...IOS_69, ...IOS_65];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const htmlPath = 'file:///' + path.join(__dirname, 'screenshots.html').replace(/\\/g, '/');

  for (const { s, out, w, h, dpr } of ALL) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr });
    await page.goto(`${htmlPath}?s=${s}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    const outPath = path.join(__dirname, out);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`✅ Saved ${out}`);
    await page.close();
  }

  await browser.close();
  console.log('Done! All screenshots generated.');
})();
