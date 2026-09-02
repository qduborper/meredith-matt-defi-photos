"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { readGuestToken, writeGuestToken } from "@/lib/guest-client";
import { FIRST_NAME_MAX } from "@/lib/validation";

/**
 * Accueil : consentement RGPD + saisie du prénom.
 *
 * Au montage, si le cookie a expiré mais que le localStorage a gardé un token,
 * on rejoue l'identification en silence pour éviter de redemander le prénom
 * à quelqu'un qui a déjà joué (cahier des charges §5.3).
 */
export function WelcomeForm({ knownFirstName }: { knownFirstName: string | null }) {
  const router = useRouter();
  const nameId = useId();
  const consentId = useId();
  const errorId = useId();

  const [firstName, setFirstName] = useState(knownFirstName ?? "");
  const [consent, setConsent] = useState(Boolean(knownFirstName));
  const [status, setStatus] = useState<"idle" | "restoring" | "submitting">(
    knownFirstName ? "idle" : "restoring",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (knownFirstName) return;

    let cancelled = false;
    void (async () => {
      const token = readGuestToken();

      if (token) {
        try {
          const response = await fetch("/api/guests/restore", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ token }),
          });
          if (!cancelled && response.ok) {
            router.replace("/defis");
            return;
          }
        } catch {
          // Hors-ligne au chargement : on laisse l'invité saisir son prénom.
        }
      }

      if (!cancelled) setStatus("idle");
    })();

    return () => {
      cancelled = true;
    };
  }, [knownFirstName, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus("submitting");

    try {
      const response = await fetch("/api/guests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ firstName, token: readGuestToken() }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.error ?? "Impossible de vous inscrire. Réessayez.");
        setStatus("idle");
        return;
      }

      writeGuestToken(payload.token);
      router.replace("/defis");
    } catch {
      setError("Pas de réseau. Rapprochez-vous du wifi et réessayez.");
      setStatus("idle");
    }
  }

  if (status === "restoring") {
    return (
      <p className="mt-8 text-center text-sm font-normal text-ink-soft" role="status">
        Un instant, on vous retrouve…
      </p>
    );
  }

  const canSubmit = consent && firstName.trim().length > 0 && status !== "submitting";

  return (
    <form onSubmit={handleSubmit} className="mt-5 flex w-full flex-1 flex-col">
      <div className="text-left">
        <label htmlFor={nameId} className="ml-1 text-[12.5px] font-bold text-sapin">
          Votre prénom
        </label>
        <input
          id={nameId}
          name="firstName"
          type="text"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          maxLength={FIRST_NAME_MAX}
          autoComplete="given-name"
          autoCapitalize="words"
          enterKeyHint="go"
          required
          placeholder="Ex. Léa"
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          className="mt-1.5 w-full rounded-field border-[1.5px] border-eau bg-surface px-4 py-3 text-[15px] text-ink placeholder:text-placeholder"
        />
      </div>

      <div className="mt-4 flex items-start gap-2.5 text-left">
        <input
          id={consentId}
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-sapin"
        />
        <label htmlFor={consentId} className="text-[12px] font-normal leading-[1.5] text-ink-soft">
          J&apos;accepte que mes photos servent au mariage. Elles ne seront pas diffusées
          publiquement et seront supprimées trois semaines après l&apos;événement.
        </label>
      </div>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-[12px] font-semibold text-danger"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-auto w-full rounded-panel bg-sapin px-4 py-4 text-[15.5px] font-bold text-creme shadow-[0_8px_18px_-6px_rgba(19,83,82,.55)] transition-opacity disabled:opacity-45"
      >
        {status === "submitting" ? "Un instant…" : "Commencer"}
      </button>

      <p className="mt-3 text-[11px] font-normal leading-[1.45] text-ink-faint">
        Aucun compte, aucune installation. Vos photos restent privées à l&apos;événement.
      </p>
    </form>
  );
}
