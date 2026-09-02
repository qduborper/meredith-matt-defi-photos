import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 12; // une soirée, large

/**
 * Authentification admin volontairement minimale (cahier des charges §6) :
 * un mot de passe unique en variable d'environnement, une session signée.
 * Pas de comptes, pas de rôles — l'événement dure un soir et l'admin est
 * une personne de confiance.
 *
 * Le cookie contient `expiration.signature`. La signature est un HMAC du
 * couple (expiration, mot de passe courant) : changer ADMIN_PASSWORD invalide
 * donc toutes les sessions ouvertes, ce qui est le comportement attendu.
 */
function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value) {
    throw new Error("ADMIN_SESSION_SECRET manquant : la console admin ne peut pas démarrer.");
  }
  return value;
}

function adminPassword(): string {
  const value = process.env.ADMIN_PASSWORD;
  if (!value) {
    throw new Error("ADMIN_PASSWORD manquant : la console admin ne peut pas démarrer.");
  }
  return value;
}

function sign(expiresAt: number): string {
  return crypto
    .createHmac("sha256", secret())
    .update(`${expiresAt}.${adminPassword()}`)
    .digest("base64url");
}

/** Compare le mot de passe saisi, en temps constant. */
export function checkPassword(candidate: string): boolean {
  const expected = Buffer.from(adminPassword());
  const given = Buffer.from(candidate);
  // `timingSafeEqual` exige des longueurs égales : on compare d'abord un
  // condensé, ce qui uniformise la taille sans révéler la longueur réelle.
  const a = crypto.createHash("sha256").update(expected).digest();
  const b = crypto.createHash("sha256").update(given).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function openAdminSession(): Promise<void> {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const store = await cookies();
  store.set(COOKIE, `${expiresAt}.${sign(expiresAt)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function closeAdminSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** Vrai si la requête courante porte une session admin valide. */
export async function isAdmin(): Promise<boolean> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;

  const [expiresRaw, signature] = raw.split(".");
  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now() || !signature) return false;

  const expected = Buffer.from(sign(expiresAt));
  const given = Buffer.from(signature);
  if (expected.length !== given.length) return false;

  return crypto.timingSafeEqual(expected, given);
}

/** À appeler en tête de chaque action admin. Lève si la session est absente. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error("Accès refusé.");
  }
}
