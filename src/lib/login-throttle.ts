import "server-only";

import { headers } from "next/headers";

/**
 * Limitation des tentatives de connexion admin.
 *
 * La console est protégée par un mot de passe unique et son adresse sera
 * publique pendant environ un mois : sans frein, rien n'empêche de tester des
 * milliers de mots de passe. On applique donc un délai croissant par adresse IP.
 *
 * Compteur en mémoire du processus, volontairement : l'application tourne en
 * un seul process sur un VPS, et un redémarrage remet les compteurs à zéro —
 * acceptable ici, l'attaquant n'a pas la main sur les redémarrages. Si l'app
 * passait un jour en plusieurs instances, il faudrait déplacer ça en base.
 *
 * La logique est séparée de la lecture des en-têtes pour rester testable sans
 * contexte de requête : voir les fonctions `…For(key, now)`.
 */
type Attempt = { count: number; blockedUntil: number; lastSeen: number };

const attempts = new Map<string, Attempt>();

/** Au-delà, chaque échec supplémentaire allonge le blocage. */
const FREE_ATTEMPTS = 5;
const BASE_DELAY_MS = 15_000;
const MAX_DELAY_MS = 15 * 60 * 1000;
/** Un client inactif est oublié au bout d'une heure. */
const FORGET_AFTER_MS = 60 * 60 * 1000;

/**
 * Oublie les clients inactifs. Le tri se fait sur `lastSeen`, pas sur
 * `blockedUntil` : une tentative isolée laisse `blockedUntil` à zéro, et
 * purger là-dessus effacerait le compteur avant qu'il n'atteigne le seuil.
 */
function sweep(now: number) {
  for (const [key, attempt] of attempts) {
    if (now - attempt.lastSeen > FORGET_AFTER_MS) attempts.delete(key);
  }
}

/** Secondes d'attente restantes pour ce client, ou 0 s'il peut réessayer. */
export function secondsBeforeRetryFor(key: string, now: number): number {
  sweep(now);
  const attempt = attempts.get(key);
  if (!attempt || attempt.blockedUntil <= now) return 0;
  return Math.ceil((attempt.blockedUntil - now) / 1000);
}

export function recordFailureFor(key: string, now: number): void {
  const attempt = attempts.get(key) ?? { count: 0, blockedUntil: 0, lastSeen: now };

  attempt.count += 1;
  attempt.lastSeen = now;

  if (attempt.count > FREE_ATTEMPTS) {
    const over = attempt.count - FREE_ATTEMPTS;
    attempt.blockedUntil = now + Math.min(BASE_DELAY_MS * 2 ** (over - 1), MAX_DELAY_MS);
  }

  attempts.set(key, attempt);
}

/** Une connexion réussie efface l'ardoise. */
export function recordSuccessFor(key: string): void {
  attempts.delete(key);
}

async function clientKey(): Promise<string> {
  const list = await headers();
  // Derrière Caddy, l'adresse réelle arrive dans X-Forwarded-For ; on prend le
  // premier maillon, le seul que le proxy garantit.
  const forwarded = list.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || list.get("x-real-ip") || "inconnu";
}

export async function secondsBeforeRetry(): Promise<number> {
  return secondsBeforeRetryFor(await clientKey(), Date.now());
}

export async function recordFailure(): Promise<void> {
  recordFailureFor(await clientKey(), Date.now());
}

export async function recordSuccess(): Promise<void> {
  recordSuccessFor(await clientKey());
}
