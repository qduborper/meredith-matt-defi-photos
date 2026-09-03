/**
 * Génère les supports imprimables : cartons de table et panneau d'entrée.
 *
 *   npx tsx scripts/print-materials.mts https://mm.dubprod.fr
 *
 * Produit dans `print/` :
 * - `cartons-table.pdf`  : 4 cartons carrés de 90 mm par page A4, avec repères
 *                          de découpe. Imprimez autant de pages que de tables.
 * - `panneau-entree.pdf` : une affiche A4 portrait pour l'entrée.
 * - les deux `.html` correspondants, si vous voulez retoucher avant impression.
 *
 * Le rendu passe par Chrome en mode headless : il embarque Avenir Next, la
 * police de la charte, présente nativement sur macOS. Un convertisseur qui ne
 * la trouverait pas retomberait sur un repli, et le rendu ne correspondrait
 * plus aux maquettes.
 */
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import QRCode from "qrcode";

const run = promisify(execFile);

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const url = process.argv[2] ?? "https://mm.dubprod.fr";
const shortUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

const ROOT = process.cwd();
const OUT = path.join(ROOT, "print");
await fs.mkdir(OUT, { recursive: true });

// Logo en base64 : le HTML reste autonome, déplaçable et imprimable ailleurs.
const logo = await fs.readFile(path.join(ROOT, "public/img/logo.png"));
const logoData = `data:image/png;base64,${logo.toString("base64")}`;

/**
 * QR en SVG inline plutôt qu'en PNG : un QR est du trait, il doit rester net
 * quelle que soit la résolution de l'imprimante.
 *
 * Niveau H (30 % de redondance) : un carton de table finit taché, corné ou à
 * moitié couvert par un verre.
 */
const qrSvg = (await QRCode.toString(url, {
  type: "svg",
  errorCorrectionLevel: "H",
  margin: 0,
  color: { dark: "#195352", light: "#F8F5E5" },
})).replace(/<\?xml.*?\?>/, "");

const WAVE = `<svg class="wave" viewBox="0 0 400 26" preserveAspectRatio="none">
  <path d="M0 14c26 0 26-7 52-7s26 7 52 7 26-7 52-7 26 7 52 7 26-7 52-7 26 7 52 7 26-7 52-7 26 7 52 7v12H0Z" fill="#C1D7D0" opacity=".55"/>
  <path d="M0 20c26 0 26-6 52-6s26 6 52 6 26-6 52-6 26 6 52 6 26-6 52-6 26 6 52 6 26-6 52-6 26 6 52 6v6H0Z" fill="#8BB2B5" opacity=".35"/>
</svg>`;

const BASE_CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  :root{--sapin:#195352;--sauge:#8BB2B5;--eau:#C1D7D0;--creme:#F8F5E5;--taupe:#D1C4B1;--ink:#173f3e}
  body{font-family:"Avenir Next","Nunito Sans",system-ui,sans-serif;color:var(--ink);
       -webkit-print-color-adjust:exact;print-color-adjust:exact}
  .card{position:relative;background:var(--creme);overflow:hidden;
        display:flex;flex-direction:column;align-items:center;text-align:center}
  .frame{position:absolute;inset:4mm;border:0.4mm solid var(--sauge);border-radius:6mm;pointer-events:none}
  .wave{position:absolute;left:0;right:0;bottom:0;width:100%;display:block}
  .logo{width:38%;height:auto}
  h1{color:var(--sapin);font-weight:700;letter-spacing:-0.01em;line-height:1.1}
  .lead{color:#445856;line-height:1.45}
  .qr-box{border:0.35mm dashed var(--sauge);border-radius:3mm;background:var(--creme);display:grid;place-items:center}
  .qr-box svg{display:block;width:100%;height:100%}
  .scan{color:var(--sapin);font-weight:700}
  /* Le repli si le QR ne passe pas : mauvaise lumière, écran fêlé, vieux
     téléphone. L'adresse est courte, elle se tape en cinq secondes. */
  .url{color:var(--sapin);font-weight:600;letter-spacing:0.02em}
  .wifi{width:100%;color:#445856}
  .wifi b{color:var(--sapin)}
  .line{display:inline-block;border-bottom:0.3mm solid var(--sauge)}
`;

/* ---------------------------------------------------------------- cartons */

const CARD_MM = 90;

const cardInner = `
  <div class="frame"></div>
  <img class="logo" src="${logoData}" alt="">
  <h1>La chasse aux souvenirs</h1>
  <p class="lead">Scannez, entrez votre prénom,<br>relevez nos défis photo.</p>
  <div class="qr-box">${qrSvg}</div>
  <p class="scan">Scannez-moi</p>
  <p class="url">${shortUrl}</p>
  <div class="wifi">
    <b>Wifi invité</b> &nbsp; Réseau <span class="line"></span> &nbsp; Code <span class="line"></span>
  </div>
  ${WAVE}
`;

const cardsHtml = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Cartons de table</title><style>
${BASE_CSS}
@page{size:A4;margin:0}
body{background:#fff}
.sheet{width:210mm;height:297mm;display:grid;grid-template-columns:1fr 1fr;
       grid-template-rows:1fr 1fr;justify-items:center;align-items:center;
       padding:8mm 10mm}
.slot{position:relative}
/* Le padding bas réserve la place de la ligne d'eau, qui est en position
   absolue : sans lui, le dernier bloc passerait dessous. */
.card{width:${CARD_MM}mm;height:${CARD_MM}mm;padding:5mm 8mm 10mm;justify-content:flex-start}
.card .logo{width:31%;margin-top:0.5mm}
.card h1{font-size:4.4mm;margin-top:1.8mm}
.card .lead{font-size:2.8mm;margin-top:1.2mm}
.card .qr-box{width:25mm;height:25mm;padding:1.3mm;margin-top:1.8mm}
.card .scan{font-size:2.7mm;margin-top:1.2mm}
.card .url{font-size:2.7mm;margin-top:0.4mm}
.card .wifi{font-size:2.3mm;margin-top:1.6mm}
.card .wifi .line{width:12mm}
.card .wave{height:4.5mm}
/* Repères de découpe, hors du carton pour ne pas marquer le support. */
.crop{position:absolute;width:3mm;height:3mm;border-color:#c9c9c9;border-style:solid;border-width:0}
.crop.tl{top:-3.5mm;left:-3.5mm;border-top-width:.2mm;border-left-width:.2mm}
.crop.tr{top:-3.5mm;right:-3.5mm;border-top-width:.2mm;border-right-width:.2mm}
.crop.bl{bottom:-3.5mm;left:-3.5mm;border-bottom-width:.2mm;border-left-width:.2mm}
.crop.br{bottom:-3.5mm;right:-3.5mm;border-bottom-width:.2mm;border-right-width:.2mm}
</style></head><body>
<div class="sheet">
  ${Array.from({ length: 4 })
    .map(
      () => `<div class="slot">
    <span class="crop tl"></span><span class="crop tr"></span>
    <span class="crop bl"></span><span class="crop br"></span>
    <div class="card">${cardInner}</div>
  </div>`,
    )
    .join("\n  ")}
</div>
</body></html>`;

/* ---------------------------------------------------------------- panneau */

const STEPS = [
  "Scannez le QR code",
  "Entrez votre prénom",
  "Relevez les défis avec vos photos",
];

const signHtml = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Panneau d'entrée</title><style>
${BASE_CSS}
@page{size:A4;margin:0}
/* Le padding bas réserve la place de la ligne d'eau, en position absolue. */
.card{width:210mm;height:297mm;padding:14mm 22mm 16mm}
.card .frame{inset:8mm;border-radius:8mm}
.card .logo{width:36%;margin-top:1mm}
.card h1{font-size:11mm;margin-top:6mm}
.card .lead{font-size:4.1mm;margin-top:3.5mm}
.steps{margin-top:7mm;text-align:left;align-self:center}
.step{display:flex;align-items:center;gap:4.5mm;margin:3.4mm 0}
.step i{flex:0 0 8mm;width:8mm;height:8mm;border-radius:50%;background:var(--sapin);color:var(--creme);
        display:grid;place-items:center;font-style:normal;font-weight:700;font-size:4mm}
.step span{font-size:4.6mm;font-weight:600;color:var(--ink)}
.card .qr-box{width:54mm;height:54mm;padding:2.6mm;margin-top:7mm}
.card .scan{font-size:4mm;margin-top:3mm}
.card .url{font-size:4.4mm;margin-top:1.2mm}
.card .wifi{font-size:3.6mm;margin-top:6mm;background:#EFEFE2;border-radius:4mm;padding:3.5mm 6mm}
.card .wifi .row{display:flex;justify-content:center;gap:3mm;margin-top:1.8mm}
.card .wifi .line{width:38mm}
.foot{font-size:3.4mm;color:#526664;margin-top:5mm}
.card .wave{height:8mm}
</style></head><body>
<div class="card">
  <div class="frame"></div>
  <img class="logo" src="${logoData}" alt="">
  <h1>Jouez avec nous ce soir</h1>
  <p class="lead">Un petit jeu photo pour capturer le mariage<br>à travers vos regards. Aucune appli à installer.</p>

  <div class="steps">
    ${STEPS.map((step, index) => `<div class="step"><i>${index + 1}</i><span>${step}</span></div>`).join("\n    ")}
  </div>

  <div class="qr-box">${qrSvg}</div>
  <p class="scan">Scannez-moi pour commencer</p>
  <p class="url">${shortUrl}</p>

  <div class="wifi">
    <b>Wifi invité</b>
    <div class="row"><span>Réseau</span><span class="line"></span></div>
    <div class="row"><span>Mot de passe</span><span class="line"></span></div>
  </div>

  <p class="foot">Vos photos rejoignent notre album commun et le diaporama de la soirée.</p>
  ${WAVE}
</div>
</body></html>`;

/* ------------------------------------------------------------------ rendu */

async function render(name: string, html: string) {
  const htmlPath = path.join(OUT, `${name}.html`);
  const pdfPath = path.join(OUT, `${name}.pdf`);
  await fs.writeFile(htmlPath, html);

  await run(CHROME, [
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    `--print-to-pdf=${pdfPath}`,
    `file://${htmlPath}`,
  ]);

  const { size } = await fs.stat(pdfPath);
  console.log(`${name}.pdf`.padEnd(22), `${(size / 1024).toFixed(0)} ko`);
}

await render("cartons-table", cardsHtml);
await render("panneau-entree", signHtml);

console.log(`\nSupports générés dans print/ pour ${url}`);
