"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  RETRY_DELAYS_MS,
  UploadError,
  compressPhoto,
  uploadPhoto,
  type UploadResult,
} from "@/lib/upload-client";

type Phase =
  | { kind: "idle" }
  | { kind: "preparing" }
  | { kind: "sending"; percent: number; attempt: number }
  | { kind: "waiting"; seconds: number; attempt: number; message: string }
  | { kind: "failed"; message: string; retryable: boolean }
  | { kind: "done"; result: UploadResult };

const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;

/**
 * Écran de réalisation d'un défi : capture ou galerie, aperçu, envoi avec
 * progression et reprise automatique.
 *
 * Les deux modes de prise de vue sont deux `<input type="file">` : le premier
 * avec `capture`, qui ouvre l'appareil photo, le second sans, qui ouvre la
 * pellicule — pour que l'invité garde ses propres filtres (§5.5 du cahier).
 */
export function ChallengeUploader({
  challengeId,
  points,
  alreadyDone,
}: {
  challengeId: string;
  points: number;
  alreadyDone: boolean;
}) {
  const router = useRouter();
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  // La photo compressée et son identifiant d'envoi survivent aux tentatives :
  // rejouer avec le même identifiant est ce qui garantit l'absence de doublon.
  const pending = useRef<{ file: File; uploadId: string } | null>(null);
  const aborter = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      aborter.current?.abort();
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const send = useCallback(async () => {
    const job = pending.current;
    if (!job) return;

    // Boucle plutôt que rappel récursif : le même `clientUploadId` est rejoué
    // à chaque tour, ce qui rend les tentatives sûres côté serveur.
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      aborter.current = new AbortController();
      setPhase({ kind: "sending", percent: 0, attempt });

      try {
        const result = await uploadPhoto({
          file: job.file,
          challengeId,
          clientUploadId: job.uploadId,
          signal: aborter.current.signal,
          onProgress: (percent) => setPhase({ kind: "sending", percent, attempt }),
        });

        setPhase({ kind: "done", result });
        // Rafraîchit la progression et le classement rendus côté serveur.
        router.refresh();
        return;
      } catch (error) {
        const uploadError =
          error instanceof UploadError
            ? error
            : new UploadError("Envoi impossible pour le moment.", true);

        if (!uploadError.retryable || attempt === MAX_ATTEMPTS) {
          setPhase({
            kind: "failed",
            message: uploadError.message,
            retryable: uploadError.retryable,
          });
          return;
        }

        // Compte à rebours visible : l'invité voit que ça repart tout seul,
        // plutôt qu'un écran figé qui donne envie de tout recommencer.
        const delay = RETRY_DELAYS_MS[attempt - 1] ?? 10_000;
        for (let left = Math.round(delay / 1000); left > 0; left -= 1) {
          setPhase({ kind: "waiting", seconds: left, attempt, message: uploadError.message });
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
  }, [challengeId, router]);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    // Vide le champ pour permettre de resélectionner le même fichier ensuite.
    input.value = "";
    if (!file) return;

    aborter.current?.abort();
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setPhase({ kind: "preparing" });

    const compressed = await compressPhoto(file);
    pending.current = { file: compressed, uploadId: crypto.randomUUID() };
    void send();
  }

  function retryNow() {
    void send();
  }

  function reset() {
    aborter.current?.abort();
    pending.current = null;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setPhase({ kind: "idle" });
  }

  if (phase.kind === "done") {
    const earned = phase.result.pointsEarned ?? 0;
    return (
      <div className="px-6 pt-4 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-sauge">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-8"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>

        <p role="status" className="mt-4 font-title text-[28px] font-bold text-sapin">
          Photo envoyée !
        </p>

        {earned > 0 ? (
          <p className="mx-auto mt-2 inline-block rounded-full bg-taupe px-4 py-1.5 text-[14px] font-bold text-sapin">
            + {earned} pts
          </p>
        ) : (
          <p className="mt-2 text-[12.5px] font-normal leading-relaxed text-ink-soft">
            Défi déjà validé : cette photo rejoint l&apos;album, sans points supplémentaires.
          </p>
        )}

        <div className="mt-7 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => router.push("/defis")}
            className="w-full rounded-panel bg-sapin px-4 py-3.5 text-[15px] font-bold text-creme"
          >
            Revenir aux défis
          </button>
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-panel border-[1.5px] border-eau bg-surface px-4 py-3.5 text-[15px] font-bold text-sapin"
          >
            Envoyer une autre photo
          </button>
        </div>
      </div>
    );
  }

  const busy = phase.kind === "preparing" || phase.kind === "sending" || phase.kind === "waiting";

  return (
    <div>
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="sr-only"
        tabIndex={-1}
      />
      <input
        ref={galleryInput}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="sr-only"
        tabIndex={-1}
      />

      {preview ? (
        <figure className="relative mx-6 mt-4 h-[150px] overflow-hidden rounded-[20px] bg-eau">
          {/* Aperçu local : jamais passé par le serveur, donc <img> et non next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Aperçu de votre photo" className="size-full object-cover" />

          {phase.kind === "preparing" ? (
            <figcaption className="absolute inset-x-0 bottom-0 bg-[rgba(14,43,42,.72)] px-3.5 py-2.5 text-[11px] font-semibold text-creme">
              Préparation de la photo…
            </figcaption>
          ) : null}

          {phase.kind === "sending" ? (
            <figcaption className="absolute inset-x-0 bottom-0 bg-[rgba(14,43,42,.72)] px-3.5 py-2.5 text-creme">
              <div className="mb-1.5 flex justify-between text-[11px] font-semibold">
                <span>
                  Envoi en cours…
                  {phase.attempt > 1 ? ` (essai ${phase.attempt}/${MAX_ATTEMPTS})` : ""}
                </span>
                <span>{phase.percent} %</span>
              </div>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={phase.percent}
                aria-label="Progression de l'envoi"
                className="h-[7px] overflow-hidden rounded-md bg-white/25"
              >
                <div
                  className="h-full rounded-md bg-eau transition-[width] duration-200"
                  style={{ width: `${phase.percent}%` }}
                />
              </div>
            </figcaption>
          ) : null}

          {phase.kind === "waiting" ? (
            <figcaption
              role="status"
              className="absolute inset-x-0 bottom-0 bg-[rgba(14,43,42,.82)] px-3.5 py-2.5 text-[11px] font-semibold text-creme"
            >
              {phase.message} Nouvel essai dans {phase.seconds} s…
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      {phase.kind === "failed" ? (
        <div role="alert" className="mx-6 mt-4 rounded-panel bg-danger/10 px-4 py-3">
          <p className="text-[12.5px] font-semibold text-danger">{phase.message}</p>
          <p className="mt-1 text-[11.5px] font-normal leading-relaxed text-ink-soft">
            Votre photo est toujours là. Réessayez quand le réseau revient : rien ne sera envoyé en
            double.
          </p>
          <div className="mt-3 flex gap-2.5">
            <button
              type="button"
              onClick={retryNow}
              className="flex-1 rounded-xl bg-sapin px-3 py-2.5 text-[13px] font-bold text-creme"
            >
              Réessayer
            </button>
            <button
              type="button"
              onClick={reset}
              className="flex-1 rounded-xl border-[1.5px] border-eau bg-surface px-3 py-2.5 text-[13px] font-bold text-sapin"
            >
              Choisir une autre photo
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex gap-3 px-6 pt-4">
        <button
          type="button"
          disabled={busy}
          onClick={() => cameraInput.current?.click()}
          className="flex flex-1 flex-col items-center gap-[7px] rounded-panel bg-sapin px-2 py-4 text-[12.5px] font-bold text-creme disabled:opacity-45"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-6"
            aria-hidden="true"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          Prendre une photo
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => galleryInput.current?.click()}
          className="flex flex-1 flex-col items-center gap-[7px] rounded-panel border-[1.5px] border-eau bg-surface px-2 py-4 text-[12.5px] font-bold text-sapin disabled:opacity-45"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-6"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
          Choisir dans ma galerie
        </button>
      </div>

      {/*
        La maquette mettait ici « utilisez vos propres filtres », qui justifiait
        le bouton galerie. Sous les deux boutons, ça embrouille : la plupart des
        invités prennent simplement une photo. On ne garde que l'enjeu.
      */}
      <p className="px-6 pt-3 text-center text-[11.5px] font-normal leading-[1.45] text-ink-faint">
        {alreadyDone
          ? `Défi déjà validé : une nouvelle photo enrichit l'album, sans rapporter de points.`
          : `${points} pts à la clé.`}
      </p>
    </div>
  );
}
