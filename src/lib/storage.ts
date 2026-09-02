import "server-only";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata, type Sharp } from "sharp";

import { CLIENT_IMAGE, THUMB } from "./constants";
import { DATA_DIR, PHOTOS_DIR, THUMBS_DIR } from "./paths";

export type StoredPhoto = {
  /** Chemin relatif à DATA_DIR — c'est lui qui est écrit en base. */
  path: string;
  thumbPath: string;
  width: number;
  height: number;
  bytes: number;
};

export class InvalidImageError extends Error {}

/**
 * Écrit une photo reçue d'un téléphone.
 *
 * Le client compresse déjà (≈1600 px, qualité 0,7), mais on repasse par sharp
 * côté serveur pour trois raisons : garantir que le fichier est bien une image
 * décodable, retirer les métadonnées EXIF (géolocalisation des invités), et
 * appliquer la rotation EXIF pour que les portraits ne s'affichent pas couchés.
 */
export async function storePhoto(input: Buffer): Promise<StoredPhoto> {
  if (input.byteLength > CLIENT_IMAGE.maxUploadBytes) {
    throw new InvalidImageError("Image trop volumineuse.");
  }

  let pipeline: Sharp;
  let metadata: Metadata;
  try {
    pipeline = sharp(input, { failOn: "error" });
    metadata = await pipeline.metadata();
  } catch {
    throw new InvalidImageError("Fichier illisible : ce n'est pas une image.");
  }

  if (!metadata.width || !metadata.height) {
    throw new InvalidImageError("Image sans dimensions exploitables.");
  }

  await fs.mkdir(PHOTOS_DIR, { recursive: true });
  await fs.mkdir(THUMBS_DIR, { recursive: true });

  const id = crypto.randomUUID();
  const relPath = path.join("photos", `${id}.jpg`);
  const relThumb = path.join("thumbs", `${id}.jpg`);

  const full = await pipeline
    .rotate() // applique l'orientation EXIF puis la supprime
    .resize({
      width: CLIENT_IMAGE.maxWidthOrHeight,
      height: CLIENT_IMAGE.maxWidthOrHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  await fs.writeFile(path.join(DATA_DIR, relPath), full.data);

  const thumb = await sharp(full.data)
    .resize({
      width: THUMB.maxWidthOrHeight,
      height: THUMB.maxWidthOrHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: THUMB.quality, mozjpeg: true })
    .toBuffer();

  await fs.writeFile(path.join(DATA_DIR, relThumb), thumb);

  return {
    path: relPath,
    thumbPath: relThumb,
    width: full.info.width,
    height: full.info.height,
    bytes: full.data.byteLength,
  };
}

/**
 * Résout un chemin stocké en base vers un chemin disque absolu.
 * Renvoie null si le chemin sort de DATA_DIR (protection contre `../`).
 */
export function resolveInDataDir(relative: string): string | null {
  const absolute = path.resolve(DATA_DIR, relative);
  const root = DATA_DIR.endsWith(path.sep) ? DATA_DIR : DATA_DIR + path.sep;
  return absolute.startsWith(root) ? absolute : null;
}

/** Efface les fichiers d'une photo supprimée. Silencieux s'ils ont déjà disparu. */
export async function deletePhotoFiles(relPaths: string[]): Promise<void> {
  await Promise.all(
    relPaths.map(async (relative) => {
      const absolute = resolveInDataDir(relative);
      if (!absolute) return;
      await fs.rm(absolute, { force: true });
    }),
  );
}
