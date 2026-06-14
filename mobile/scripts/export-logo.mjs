/**
 * Renders GeneoRx logo from original SVG artwork (public/logo-icon.svg + logo-full.svg).
 * Run: node mobile/scripts/export-logo.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const publicDir = path.join(root, 'public');
const iconSvgPath = path.join(publicDir, 'logo-icon.svg');
const fullSvgPath = path.join(publicDir, 'logo-full.svg');
const assets = path.join(__dirname, '../assets');
const storeAssets = path.join(__dirname, '../store-assets');

const ICON_BG = { r: 0, g: 0, b: 0, alpha: 1 };
const SPLASH_BG = { r: 7, g: 10, b: 18, alpha: 1 };

const iconSvg = fs.readFileSync(iconSvgPath);
const fullSvg = fs.readFileSync(fullSvgPath);

async function iconMarkBuffer(size) {
  return sharp(iconSvg)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function fullLogoBuffer(width) {
  return sharp(fullSvg)
    .resize(width, null, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function dnaWatermarkBuffer(size) {
  const svg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 480 600" fill="none">
      <g opacity="0.16" stroke-linecap="round">
        <path d="M80 40C340 220 340 380 80 560" stroke="#4AA8FF" stroke-width="34"/>
        <path d="M400 40C140 220 140 380 400 560" stroke="#EAF2FA" stroke-width="34"/>
        <path d="M140 140H340" stroke="#4AA8FF" stroke-width="26"/>
        <path d="M100 300H380" stroke="#EAF2FA" stroke-width="26"/>
        <path d="M140 460H340" stroke="#4AA8FF" stroke-width="26"/>
      </g>
    </svg>
  `);

  return sharp(svg).png().toBuffer();
}

async function appIcon(size, out, markScale = 0.92) {
  const markSize = Math.round(size * markScale);
  const mark = await iconMarkBuffer(markSize);
  await sharp({ create: { width: size, height: size, channels: 4, background: ICON_BG } })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toFile(out);
}

async function adaptiveForeground(size, out, markScale = 0.8) {
  const markSize = Math.round(size * markScale);
  const mark = await iconMarkBuffer(markSize);
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toFile(out);
}

async function splashPng(out) {
  const mark = await fullLogoBuffer(700);
  const dna = await dnaWatermarkBuffer(520);
  await sharp({ create: { width: 1284, height: 2778, channels: 4, background: SPLASH_BG } })
    .composite([
      { input: dna, gravity: 'center' },
      { input: mark, gravity: 'center' },
    ])
    .png()
    .toFile(out);
}

await iconMarkBuffer(512).then((b) => sharp(b).toFile(path.join(publicDir, 'logo-mark.png')));
await fullLogoBuffer(600).then((b) => sharp(b).toFile(path.join(publicDir, 'logo-preview-full.png')));
await appIcon(512, path.join(publicDir, 'logo-preview-icon.png'));

await fullLogoBuffer(820).then((b) => sharp(b).toFile(path.join(assets, 'logo.png')));
await appIcon(1024, path.join(assets, 'icon.png'));
await appIcon(192, path.join(assets, 'favicon.png'));
await fullLogoBuffer(1024).then((b) => sharp(b).toFile(path.join(publicDir, 'logo.png')));
await adaptiveForeground(1024, path.join(assets, 'adaptive-icon.png'));
await splashPng(path.join(assets, 'splash.png'));

await appIcon(512, path.join(storeAssets, 'app-icon-512x512.png'));
await appIcon(1024, path.join(storeAssets, 'ios-app-icon-1024.png'));

fs.copyFileSync(iconSvgPath, path.join(publicDir, 'logo.svg'));

console.log('Exported original SVG logo artwork');
console.log('  Edit: public/logo-icon.svg  public/logo-full.svg');
