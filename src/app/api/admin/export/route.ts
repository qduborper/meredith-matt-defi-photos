import { ZipArchive } from "archiver";
import { NextResponse } from "next/server";
import { Readable } from "node:stream";

import { isAdmin } from "@/lib/admin-session";
import { PHOTO_STATUS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { resolveInDataDir } from "@/lib/storage";
import { displayFirstName } from "@/lib/validation";

/** Rend un fragment utilisable comme nom de dossier dans une archive. */
function safeFolder(name: string): string {
  return (
    name
      .normalize("NFD")
      // Retire les accents (marques combinantes) après décomposition, pour que
      // « Chloé » et « Chloe » n'aboutissent pas à deux dossiers distincts
      // selon le système de fichiers qui ouvre l'archive.
      .replace(/\p{M}/gu, "")
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .trim()
      .slice(0, 40) || "sans-nom"
  );
}

/**
 * Export ZIP de toutes les photos, rangées par prénom (cahier des charges §6).
 *
 * L'archive est produite en **streaming** : avec ~500 Mo de photos, la
 * construire en mémoire ferait tomber le VPS. Les photos supprimées sont
 * exclues ; les masquées sont incluses dans un dossier à part, puisque le
 * masquage n'est qu'un retrait d'affichage.
 */
export async function GET() {
  if (!(await isAdmin())) {
    return new NextResponse("Accès refusé", { status: 403 });
  }

  const photos = await prisma.photo.findMany({
    where: { status: { not: PHOTO_STATUS.DELETED } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      path: true,
      status: true,
      createdAt: true,
      guest: { select: { firstName: true } },
      challenge: { select: { title: true } },
    },
  });

  // Niveau 1 : les JPEG sont déjà compressés, insister ne ferait que chauffer
  // le CPU du VPS pour quelques kilo-octets.
  const archive = new ZipArchive({ zlib: { level: 1 } });
  archive.on("warning", (error: Error) => console.warn("Export ZIP :", error));
  archive.on("error", (error: Error) => console.error("Export ZIP :", error));

  let index = 0;
  for (const photo of photos) {
    const absolute = resolveInDataDir(photo.path);
    if (!absolute) continue;

    index += 1;
    const folder = safeFolder(displayFirstName(photo.guest.firstName));
    const name = `${String(index).padStart(3, "0")}-${safeFolder(photo.challenge.title)}.jpg`;
    const prefix = photo.status === PHOTO_STATUS.HIDDEN ? "_masquees/" : "";

    archive.file(absolute, { name: `${prefix}${folder}/${name}` });
  }

  void archive.finalize();

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(Readable.toWeb(archive) as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="defi-photo-${stamp}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
