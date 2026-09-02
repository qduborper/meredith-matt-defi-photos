"use client";

import { GUEST_TOKEN_KEY } from "./constants";

/**
 * Miroir client du token d'invité.
 *
 * Le cookie sert au rendu serveur, le localStorage à survivre à son expiration
 * et à rester lisible hors-ligne (file d'attente d'envois, phase 5). Les deux
 * sont écrits ensemble ; le localStorage fait autorité en cas de divergence,
 * car c'est lui qui dure le plus longtemps.
 */
export function readGuestToken(): string | null {
  try {
    return window.localStorage.getItem(GUEST_TOKEN_KEY);
  } catch {
    // Navigation privée ou stockage bloqué : on retombe sur le seul cookie.
    return null;
  }
}

export function writeGuestToken(token: string): void {
  try {
    window.localStorage.setItem(GUEST_TOKEN_KEY, token);
  } catch {
    // Sans localStorage l'invité reste identifié par le cookie, tant qu'il dure.
  }
}

export function clearGuestToken(): void {
  try {
    window.localStorage.removeItem(GUEST_TOKEN_KEY);
  } catch {
    // Rien à faire : le stockage était déjà indisponible.
  }
}
