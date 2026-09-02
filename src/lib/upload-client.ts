"use client";

import imageCompression from "browser-image-compression";

import { CLIENT_IMAGE } from "./constants";
import { readGuestToken } from "./guest-client";

export type UploadResult = {
  id: string;
  duplicate: boolean;
  pointsEarned: number;
  alreadyDone: boolean;
};

/** Erreur d'envoi, avec l'information « ça vaut le coup de réessayer ». */
export class UploadError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.retryable = retryable;
  }
}

/**
 * Compresse la photo sur le téléphone avant l'envoi.
 *
 * C'est la mesure la plus efficace contre le réseau de salle : une photo
 * d'iPhone fait 3 à 5 Mo, on descend autour de 300 ko. Le travail se fait dans
 * un worker, l'interface reste réactive.
 */
export async function compressPhoto(file: File): Promise<File> {
  try {
    return await imageCompression(file, {
      maxWidthOrHeight: CLIENT_IMAGE.maxWidthOrHeight,
      initialQuality: CLIENT_IMAGE.quality,
      useWebWorker: true,
      fileType: "image/jpeg",
      // Un HEIC de 12 Mpx sur un vieux téléphone peut prendre plusieurs secondes.
      maxIteration: 8,
    });
  } catch {
    // Format exotique ou mémoire insuffisante : on envoie l'original, le
    // serveur sait le redimensionner. Plus lent, mais ça passe.
    return file;
  }
}

/**
 * Envoie une photo avec suivi de progression.
 *
 * `XMLHttpRequest` plutôt que `fetch` : c'est le seul moyen d'obtenir la
 * progression de l'**upload** (`fetch` ne remonte que le téléchargement).
 * `clientUploadId` est généré par l'appelant et réutilisé à chaque essai, ce
 * qui rend la reprise sans risque de doublon.
 */
export function uploadPhoto({
  file,
  challengeId,
  clientUploadId,
  onProgress,
  signal,
}: {
  file: File;
  challengeId: string;
  clientUploadId: string;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("photo", file, "photo.jpg");
    form.append("challengeId", challengeId);
    form.append("clientUploadId", clientUploadId);

    const request = new XMLHttpRequest();
    request.open("POST", "/api/photos");

    const token = readGuestToken();
    if (token) request.setRequestHeader("x-guest-token", token);

    request.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      onProgress?.(Math.round((event.loaded / event.total) * 100));
    });

    request.addEventListener("load", () => {
      let payload: Record<string, unknown> | null = null;
      try {
        payload = JSON.parse(request.responseText);
      } catch {
        payload = null;
      }

      if (request.status >= 200 && request.status < 300) {
        onProgress?.(100);
        resolve(payload as unknown as UploadResult);
        return;
      }

      const message =
        (payload?.error as string | undefined) ?? "L'envoi a échoué. Réessayons.";
      // 4xx = la requête restera refusée telle quelle ; 5xx et coupures valent
      // une nouvelle tentative. 408 et 429 sont des exceptions temporaires.
      const retryable =
        request.status >= 500 || request.status === 408 || request.status === 429;
      reject(new UploadError(message, retryable));
    });

    request.addEventListener("error", () => {
      reject(new UploadError("Connexion perdue pendant l'envoi.", true));
    });
    request.addEventListener("timeout", () => {
      reject(new UploadError("Le réseau est trop lent pour l'instant.", true));
    });
    request.addEventListener("abort", () => {
      reject(new UploadError("Envoi annulé.", false));
    });

    // Généreux : sur un wifi de salle saturé, 2 minutes ne sont pas absurdes.
    request.timeout = 120_000;

    signal?.addEventListener("abort", () => request.abort(), { once: true });
    request.send(form);
  });
}

/** Attente entre deux tentatives : 2 s, 5 s, 10 s. */
export const RETRY_DELAYS_MS = [2_000, 5_000, 10_000];
