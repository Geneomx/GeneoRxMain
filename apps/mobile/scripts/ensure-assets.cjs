const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(dir, { recursive: true });
// 1x1 transparent PNG (valid file for Expo to resolve paths)
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2UcAAAAASUVORK5CYII=',
  'base64',
);
const icon = path.join(dir, 'icon.png');
const splash = path.join(dir, 'splash.png');
if (!fs.existsSync(icon)) {
  fs.writeFileSync(icon, png);
}
if (!fs.existsSync(splash)) {
  fs.writeFileSync(splash, png);
}
