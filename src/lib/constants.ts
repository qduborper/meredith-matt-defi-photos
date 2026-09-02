/** Statuts de modération d'une photo. SQLite n'ayant pas d'enum, on les fige ici. */
export const PHOTO_STATUS = {
  /** Visible dans la galerie, le diaporama et comptée au classement. */
  VISIBLE: "visible",
  /** Retirée de la galerie et du diaporama, mais conservée sur le disque. */
  HIDDEN: "hidden",
  /** Supprimée par l'admin : ni affichée, ni comptée, fichiers effacés. */
  DELETED: "deleted",
} as const;

export type PhotoStatus = (typeof PHOTO_STATUS)[keyof typeof PHOTO_STATUS];

export const PHOTO_STATUS_LABEL: Record<PhotoStatus, string> = {
  [PHOTO_STATUS.VISIBLE]: "Visible",
  [PHOTO_STATUS.HIDDEN]: "Masquée",
  [PHOTO_STATUS.DELETED]: "Supprimée",
};

/** Barème de points du cahier des charges (§13). */
export const POINTS = { FACILE: 10, INTERMEDIAIRE: 20, CREATIF: 30 } as const;

/**
 * Catégories de départ. `category` reste une String libre côté base : l'admin
 * peut en créer d'autres pendant la soirée sans migration.
 */
export const CATEGORIES = [
  "Portraits & rencontres",
  "Moments & ambiance",
  "Créatifs & fun",
  "Détails",
  "Défis de groupe",
] as const;

/** Compression côté téléphone avant envoi (cahier des charges §8.2). */
export const CLIENT_IMAGE = {
  maxWidthOrHeight: 1600,
  quality: 0.7,
  /** Garde-fou serveur : au-delà, l'upload est refusé. */
  maxUploadBytes: 12 * 1024 * 1024,
} as const;

/** Miniatures générées par sharp. */
export const THUMB = { maxWidthOrHeight: 480, quality: 72 } as const;

/** Rafraîchissement du diaporama : polling plutôt que websocket (§8.2). */
export const SLIDESHOW = { pollMs: 6000, slideMs: 7000 } as const;

/** Clé du token invité dans le localStorage. */
export const GUEST_TOKEN_KEY = "defi-photo:guest-token";

export const EVENT = {
  brideAndGroom: "Mérédith & Matthieu",
  place: "Aix-les-Bains",
  dateLabel: "5 septembre 2026",
} as const;
