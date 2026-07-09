/* Generates AwaazPay launcher/splash assets from an inline SVG (navy tile +
 * gold soundbars — the brand mark, geometric so no fonts are needed).
 * Run:  node scripts/generate-icons.js
 */
const sharp = require('sharp');
const path = require('path');

const NAVY = '#1a2e6e';
const GOLD = '#f0b429';
const S = 1024;

// Five rising bars, centred. `scale` shrinks the mark for adaptive safe-zones.
function bars(color, scale) {
  const heights = [200, 340, 470, 300, 170];
  const bw = 78;
  const gap = 46;
  const total = heights.length * bw + (heights.length - 1) * gap;
  const startX = (S - total * scale) / 2;
  const cx = S / 2;
  let rects = '';
  heights.forEach((h, i) => {
    const w = bw * scale;
    const hh = h * scale;
    const x = startX + i * (bw + gap) * scale;
    const y = S / 2 - hh / 2;
    rects += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${hh.toFixed(1)}" rx="${(w / 2).toFixed(1)}" fill="${color}"/>`;
  });
  return rects;
}

function svg({ bg, barColor, scale, rounded }) {
  const bgEl = bg
    ? `<rect width="${S}" height="${S}" rx="${rounded ? 224 : 0}" fill="${bg}"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${bgEl}${bars(barColor, scale)}</svg>`;
}

const assets = path.join(__dirname, '..', 'assets');
const out = (name) => path.join(assets, name);

async function render(svgStr, file, size = S) {
  await sharp(Buffer.from(svgStr)).resize(size, size).png().toFile(out(file));
  console.log('  ✓', file);
}

(async () => {
  console.log('Generating AwaazPay icons…');
  // Full app icon: navy rounded tile + gold bars.
  await render(svg({ bg: NAVY, barColor: GOLD, scale: 1, rounded: true }), 'icon.png');
  // Adaptive: solid navy background + gold foreground (mark in safe zone).
  await render(svg({ bg: NAVY, barColor: NAVY, scale: 1, rounded: false }), 'android-icon-background.png');
  await render(svg({ bg: null, barColor: GOLD, scale: 0.62 }), 'android-icon-foreground.png');
  await render(svg({ bg: null, barColor: '#ffffff', scale: 0.62 }), 'android-icon-monochrome.png');
  // Splash mark (gold bars, transparent — bg colour set in app.json).
  await render(svg({ bg: null, barColor: GOLD, scale: 0.7 }), 'splash-icon.png');
  // Favicon.
  await render(svg({ bg: NAVY, barColor: GOLD, scale: 1, rounded: true }), 'favicon.png', 96);
  console.log('Done.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
