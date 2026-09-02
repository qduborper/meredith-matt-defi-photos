/**
 * Prépare les déclinaisons du logo à partir de `logo2.png` (fond blanc opaque).
 *
 * 1. Rend transparent le blanc du fond — par flood fill depuis les bords, pour
 *    ne pas trouer les blancs internes (reflets du lac, contour du monogramme).
 * 2. Rogne les marges mortes.
 * 3. Découpe le monogramme seul (M + lac, sans les prénoms) pour les en-têtes.
 *
 * Script ponctuel : `node scripts/prepare-logo.mjs <source.png>`.
 * Les fichiers produits sont versionnés, il n'a pas à tourner au build.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = process.argv[2] ?? path.join(ROOT, "public/img/logo.png");
const IMG_DIR = path.join(ROOT, "public/img");

/** Seuil au-delà duquel un pixel est considéré comme du fond blanc. */
const WHITE = 244;

async function cutout(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;

  const isWhite = (i) => data[i] > WHITE && data[i + 1] > WHITE && data[i + 2] > WHITE;
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x += 1) {
    stack.push(x, (h - 1) * w + x);
  }
  for (let y = 0; y < h; y += 1) {
    stack.push(y * w, y * w + w - 1);
  }

  while (stack.length > 0) {
    const p = stack.pop();
    if (seen[p]) continue;
    const i = p * c;
    if (!isWhite(i)) continue;
    seen[p] = 1;
    data[i + 3] = 0;
    const x = p % w;
    const y = Math.floor(p / w);
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }

  return { data, w, h, c };
}

/** Boîte englobante des pixels non transparents, dans une bande verticale. */
function contentBox({ data, w, h, c }, fromRatio = 0, toRatio = 1) {
  const y0 = Math.floor(h * fromRatio);
  const y1 = Math.ceil(h * toRatio);
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;

  for (let y = y0; y < y1; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (data[(y * w + x) * c + 3] < 8) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return { minX, minY, maxX, maxY };
}

function extractBox({ minX, minY, maxX, maxY }, w, h, pad = 6) {
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  return {
    left,
    top,
    width: Math.min(w - left, maxX - left + pad),
    height: Math.min(h - top, maxY - top + pad),
  };
}

const cut = await cutout(SOURCE);
const raw = { raw: { width: cut.w, height: cut.h, channels: cut.c } };

// Logo complet : monogramme + prénoms + lieu et date.
const full = extractBox(contentBox(cut), cut.w, cut.h);
await sharp(cut.data, raw).extract(full).png().toFile(path.join(IMG_DIR, "logo.png"));

// Monogramme seul : le paysage et le « M » occupent le tiers supérieur.
// On borne la recherche à 62 % de la hauteur, avant la ligne des prénoms.
const mono = extractBox(contentBox(cut, 0, 0.62), cut.w, cut.h);
await sharp(cut.data, raw)
  .extract(mono)
  .resize({ width: 320, withoutEnlargement: true })
  .png()
  .toFile(path.join(IMG_DIR, "monogram.png"));

console.log("logo.png     ", full);
console.log("monogram.png ", mono);
