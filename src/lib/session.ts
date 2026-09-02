import "server-only";

import { cookies } from "next/headers";

import { prisma } from "./prisma";

/**
 * Le token de l'invité est stocké à deux endroits volontairement :
 *
 * - un cookie, lisible par les Server Components — c'est lui qui permet de
 *   rendre la liste des défis déjà personnalisée, sans écran de chargement ;
 * - le localStorage, qui survit à l'expiration du cookie et reste accessible
 *   au service worker pour la file d'attente hors-ligne (phase 5).
 *
 * Le cookie n'est donc pas httpOnly : ce n'est pas un secret d'authentification
 * mais un identifiant de participation à un jeu, sans donnée sensible derrière.
 */
export const GUEST_COOKIE = "guest_token";
export const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 60; // 60 jours

export type Guest = { id: string; firstName: string; token: string };

/** Invité courant d'après le cookie, ou null s'il ne s'est pas encore identifié. */
export async function getCurrentGuest(): Promise<Guest | null> {
  const token = (await cookies()).get(GUEST_COOKIE)?.value;
  if (!token) return null;

  return prisma.guest.findUnique({
    where: { token },
    select: { id: true, firstName: true, token: true },
  });
}

/** Invité désigné par l'en-tête `x-guest-token`, pour les appels d'API. */
export async function getGuestByToken(token: string | null): Promise<Guest | null> {
  if (!token) return null;

  return prisma.guest.findUnique({
    where: { token },
    select: { id: true, firstName: true, token: true },
  });
}

/** Attributs du cookie de session invité, partagés entre les routes qui le posent. */
export function guestCookieOptions() {
  return {
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE,
  };
}
