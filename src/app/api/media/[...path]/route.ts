import fs from "node:fs/promises";
import { NextResponse } from "next/server";

import { PHOTO_STATUS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { resolveInDataDir } from "@/lib/storage";

/**
 * Sert les photos et miniatures depuis le dossier de données, qui vit hors du
 * bundle Next et n'est donc pas exposé en statique.
 *
 * Deux garde-fous :
 * - le chemin demandé doit correspondre à une photo **connue en base** et non
 *   supprimée : deviner un UUID ne suffit pas à récupérer une photo masquée ;
 * - `resolveInDataDir` refuse tout chemin qui sortirait du dossier de données.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const relative = segments.join("/");

  const photo = await prisma.photo.findFirst({
    where: {
      OR: [{ path: relative }, { thumbPath: relative }],
      status: { not: PHOTO_STATUS.DELETED },
    },
    select: { id: true },
  });
  if (!photo) {
    return new NextResponse("Introuvable", { status: 404 });
  }

  const absolute = resolveInDataDir(relative);
  if (!absolute) {
    return new NextResponse("Chemin invalide", { status: 400 });
  }

  let file: Buffer;
  try {
    file = await fs.readFile(absolute);
  } catch {
    return new NextResponse("Introuvable", { status: 404 });
  }

  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": "image/jpeg",
      // Le contenu d'un chemin donné ne change jamais (nom = UUID), mais on
      // reste privé : ces photos ne doivent pas traîner dans un cache partagé.
      "Cache-Control": "private, max-age=31536000, immutable",
      "Content-Length": String(file.byteLength),
    },
  });
}
