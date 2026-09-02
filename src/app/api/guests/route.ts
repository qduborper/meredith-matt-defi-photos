import crypto from "node:crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { GUEST_COOKIE, getGuestByToken, guestCookieOptions } from "@/lib/session";
import { cleanFirstName, displayFirstName } from "@/lib/validation";

/**
 * Identification d'un invité.
 *
 * Deux cas :
 * - `token` fourni et connu : on retrouve l'invité (retour sur le site, ou
 *   cookie expiré alors que le localStorage a survécu) et on rafraîchit le
 *   cookie. Le prénom est mis à jour s'il a changé.
 * - sinon : création. Le token est généré **côté serveur** — le client ne
 *   choisit pas son identifiant.
 *
 * Aucun mot de passe : le token EST l'identité. C'est assumé (§4 du cahier),
 * l'enjeu se limite à des points dans un jeu.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête illisible." }, { status: 400 });
  }

  const { firstName: rawName, token: rawToken } = (body ?? {}) as Record<string, unknown>;

  const firstName = cleanFirstName(rawName);
  if (!firstName) {
    return NextResponse.json(
      { error: "Merci d'indiquer un prénom." },
      { status: 400 },
    );
  }

  const existing = typeof rawToken === "string" ? await getGuestByToken(rawToken) : null;

  const guest = existing
    ? await prisma.guest.update({
        where: { id: existing.id },
        data: { firstName },
        select: { id: true, firstName: true, token: true },
      })
    : await prisma.guest.create({
        data: { firstName, token: crypto.randomUUID() },
        select: { id: true, firstName: true, token: true },
      });

  const response = NextResponse.json({
    id: guest.id,
    firstName: guest.firstName,
    displayName: displayFirstName(guest.firstName),
    token: guest.token,
  });
  response.cookies.set(GUEST_COOKIE, guest.token, guestCookieOptions());

  return response;
}
