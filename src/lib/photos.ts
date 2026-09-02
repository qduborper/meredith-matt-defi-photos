import "server-only";

import { PHOTO_STATUS, type PhotoStatus } from "./constants";
import { prisma } from "./prisma";

export type GalleryPhoto = {
  id: string;
  thumbPath: string;
  path: string;
  width: number;
  height: number;
  authorFirstName: string;
  challengeTitle: string;
  createdAt: Date;
  status: PhotoStatus;
};

export type Page<T> = {
  items: T[];
  page: number;
  pageCount: number;
  total: number;
};

/** 24 vignettes par page : deux colonnes, douze lignes — court à charger. */
export const GALLERY_PAGE_SIZE = 24;

/**
 * Photos de la galerie, de la plus récente à la plus ancienne.
 *
 * Paginé, et pas simplement tronqué : à ~100 invités et une dizaine de photos
 * chacun, une galerie d'un seul tenant ferait un millier de vignettes sur un
 * réseau de salle déjà médiocre.
 *
 * `guestId` restreint aux photos d'un invité (onglet « Les miennes »).
 * `statuses` sert à la modération, qui doit aussi voir les photos masquées.
 */
export async function getGalleryPhotos({
  page = 1,
  pageSize = GALLERY_PAGE_SIZE,
  guestId,
  challengeId,
  statuses = [PHOTO_STATUS.VISIBLE],
}: {
  page?: number;
  pageSize?: number;
  guestId?: string;
  challengeId?: string;
  statuses?: PhotoStatus[];
} = {}): Promise<Page<GalleryPhoto>> {
  const where = {
    status: { in: statuses },
    ...(guestId ? { guestId } : {}),
    ...(challengeId ? { challengeId } : {}),
  };

  const total = await prisma.photo.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  // Une page hors bornes (lien partagé, photo supprimée entre-temps) ramène
  // sur la dernière page existante plutôt que sur une grille vide.
  const current = Math.min(Math.max(1, page), pageCount);

  const photos = await prisma.photo.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (current - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      path: true,
      thumbPath: true,
      width: true,
      height: true,
      status: true,
      createdAt: true,
      guest: { select: { firstName: true } },
      challenge: { select: { title: true } },
    },
  });

  return {
    total,
    page: current,
    pageCount,
    items: photos.map((photo) => ({
      id: photo.id,
      path: photo.path,
      thumbPath: photo.thumbPath,
      width: photo.width,
      height: photo.height,
      status: photo.status as PhotoStatus,
      createdAt: photo.createdAt,
      authorFirstName: photo.guest.firstName,
      challengeTitle: photo.challenge.title,
    })),
  };
}

/** Dernières photos visibles, pour le diaporama projeté. */
export async function getLatestVisiblePhotos(limit: number) {
  const { items } = await getGalleryPhotos({ page: 1, pageSize: limit });
  return items;
}

/** URL publique d'un fichier stocké, servie par la route média. */
export function mediaUrl(relativePath: string): string {
  return `/api/media/${relativePath.split("/").map(encodeURIComponent).join("/")}`;
}
