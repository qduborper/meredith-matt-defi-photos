/**
 * Purge des données personnelles (cahier des charges §9).
 *
 * Supprime les photos, les invités et l'historique. Les défis sont conservés :
 * ce ne sont pas des données personnelles, et ils pourraient resservir.
 *
 *   npx tsx scripts/purge.mts              # aperçu, ne supprime rien
 *   npx tsx scripts/purge.mts --confirmer  # supprime pour de bon
 *
 * À lancer environ trois semaines après le mariage, une fois que les mariés ont
 * récupéré l'export ZIP. Volontairement pas automatisé par une tâche planifiée :
 * une suppression irréversible qui part toute seule est une mauvaise idée si
 * personne n'a vérifié que l'export est bien en main.
 */
import fs from "node:fs/promises";

import { PHOTOS_DIR, THUMBS_DIR } from "../src/lib/paths";
import { prisma } from "../src/lib/prisma";

const confirmed = process.argv.includes("--confirmer");

async function countFiles(dir: string): Promise<number> {
  try {
    return (await fs.readdir(dir)).length;
  } catch {
    return 0;
  }
}

const [photos, guests, challenges, photoFiles, thumbFiles] = await Promise.all([
  prisma.photo.count(),
  prisma.guest.count(),
  prisma.challenge.count(),
  countFiles(PHOTOS_DIR),
  countFiles(THUMBS_DIR),
]);

console.log("À supprimer :");
console.log(`  ${guests} invité(s) — prénoms et jetons`);
console.log(`  ${photos} photo(s) en base`);
console.log(`  ${photoFiles} fichier(s) dans photos/ et ${thumbFiles} dans thumbs/`);
console.log(`\nÀ conserver :`);
console.log(`  ${challenges} défi(s) — aucune donnée personnelle`);

if (!confirmed) {
  console.log(`\nAperçu seulement. Relancez avec --confirmer pour supprimer.`);
  await prisma.$disconnect();
  process.exit(0);
}

// Les photos partent en cascade avec les invités (onDelete: Cascade), mais on
// efface d'abord les fichiers : si le script s'interrompt, mieux vaut des
// lignes orphelines en base que des photos abandonnées sur le disque.
for (const dir of [PHOTOS_DIR, THUMBS_DIR]) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

const removedPhotos = await prisma.photo.deleteMany({});
const removedGuests = await prisma.guest.deleteMany({});

console.log(`\nSupprimé : ${removedGuests.count} invité(s), ${removedPhotos.count} photo(s).`);
console.log("Les fichiers de photos et de miniatures ont été effacés du disque.");

await prisma.$disconnect();
