/**
 * Génère le QR code d'accès à l'app.
 *
 *   npx tsx scripts/qr-code.mts https://mm.dubprod.fr
 *
 * Produit trois fichiers dans `qr/` :
 * - `qr-noir.svg`  : noir sur blanc, le plus sûr à scanner — à privilégier
 *                    pour l'impression sur les cartons de table ;
 * - `qr-charte.svg`: sapin sur crème, aux couleurs du mariage ;
 * - `qr-noir.png`  : version bitmap, pour glisser dans un outil de mise en page.
 *
 * Correction d'erreur en niveau H (30 % de redondance) : un QR imprimé sur un
 * carton de table finit taché, corné ou à moitié couvert par un verre.
 */
import fs from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";

const url = process.argv[2];
if (!url) {
  console.error("Usage : npx tsx scripts/qr-code.mts https://mm.dubprod.fr");
  process.exit(1);
}

try {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") {
    console.warn(
      `Attention : ${url} n'est pas en HTTPS. L'accès à l'appareil photo sera refusé par les navigateurs.`,
    );
  }
} catch {
  console.error(`« ${url} » n'est pas une URL valide.`);
  process.exit(1);
}

const OUT = path.join(process.cwd(), "qr");
await fs.mkdir(OUT, { recursive: true });

const common = { errorCorrectionLevel: "H" as const, margin: 2 };

/*
  Le fond est blanc partout, jamais transparent : posé sur du papier de
  couleur, un QR aux modules clairs transparents laisse la teinte du papier
  remonter, et le contraste peut tomber sous ce qu'un lecteur accepte.
  Un aplat blanc rend le résultat indépendant du support.
*/
const variants = [
  { file: "qr-noir.svg", dark: "#000000", light: "#ffffff" },
  // Sapin sur blanc : 8,6:1, bien au-delà de ce que demandent les lecteurs,
  // tout en restant dans la charte.
  { file: "qr-sapin.svg", dark: "#195352", light: "#ffffff" },
];

for (const variant of variants) {
  const svg = await QRCode.toString(url, {
    ...common,
    type: "svg",
    width: 1024,
    color: { dark: variant.dark, light: variant.light },
  });
  await fs.writeFile(path.join(OUT, variant.file), svg);
  console.log(`${variant.file.padEnd(16)} ${variant.dark} sur ${variant.light}`);
}

await QRCode.toFile(path.join(OUT, "qr-noir.png"), url, {
  ...common,
  width: 2048, // large : un QR imprimé en petit reste net
  color: { dark: "#000000", light: "#ffffff" },
});
console.log(`qr-noir.png      2048 px`);

console.log(`\nQR codes générés dans qr/ pour ${url}`);
