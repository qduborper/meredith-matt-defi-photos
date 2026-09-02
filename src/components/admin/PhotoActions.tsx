"use client";

import { useTransition } from "react";

import { setPhotoStatus } from "@/app/admin/actions";
import { PHOTO_STATUS, type PhotoStatus } from "@/lib/constants";

const ICONS = {
  hide: "M17.94 17.94A10 10 0 0 1 12 20C5 20 1 12 1 12a18 18 0 0 1 5.06-5.94M9.9 4.24A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.16 3.19M1 1l22 22",
  show: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  remove: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
} as const;

export function PhotoActions({
  photoId,
  status,
  author,
}: {
  photoId: string;
  status: PhotoStatus;
  author: string;
}) {
  const [pending, startTransition] = useTransition();
  const hidden = status === PHOTO_STATUS.HIDDEN;

  function apply(next: PhotoStatus) {
    // La suppression efface les fichiers : irréversible, donc on confirme.
    if (next === PHOTO_STATUS.DELETED) {
      const ok = window.confirm(
        `Supprimer définitivement cette photo de ${author} ?\n\nLe fichier sera effacé du serveur. Pour un simple retrait de la galerie, utilisez « Masquer ».`,
      );
      if (!ok) return;
    }
    startTransition(() => setPhotoStatus(photoId, next));
  }

  return (
    <div className="absolute right-2 top-2 flex gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => apply(hidden ? PHOTO_STATUS.VISIBLE : PHOTO_STATUS.HIDDEN)}
        title={hidden ? "Réafficher" : "Masquer"}
        aria-label={hidden ? `Réafficher la photo de ${author}` : `Masquer la photo de ${author}`}
        className="flex size-[26px] items-center justify-center rounded-lg bg-white/90 disabled:opacity-50"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-sapin)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-3.5"
          aria-hidden="true"
        >
          <path d={hidden ? ICONS.show : ICONS.hide} />
        </svg>
      </button>

      <button
        type="button"
        disabled={pending}
        onClick={() => apply(PHOTO_STATUS.DELETED)}
        title="Supprimer"
        aria-label={`Supprimer la photo de ${author}`}
        className="flex size-[26px] items-center justify-center rounded-lg bg-white/90 disabled:opacity-50"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-danger)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-3.5"
          aria-hidden="true"
        >
          <path d={ICONS.remove} />
        </svg>
      </button>
    </div>
  );
}
