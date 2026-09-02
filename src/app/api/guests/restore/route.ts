import { NextResponse } from "next/server";

import { GUEST_COOKIE, getGuestByToken, guestCookieOptions } from "@/lib/session";
import { displayFirstName } from "@/lib/validation";

/**
 * Restaure le cookie de session à partir du token conservé en localStorage.
 *
 * Sert au cas où le cookie a expiré (ou a été effacé par le navigateur) alors
 * que l'invité est déjà connu : on lui évite de ressaisir son prénom.
 * Contrairement à `POST /api/guests`, cette route ne crée jamais d'invité.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête illisible." }, { status: 400 });
  }

  const { token } = (body ?? {}) as Record<string, unknown>;
  const guest = typeof token === "string" ? await getGuestByToken(token) : null;

  if (!guest) {
    return NextResponse.json({ error: "Invité inconnu." }, { status: 404 });
  }

  const response = NextResponse.json({
    id: guest.id,
    firstName: guest.firstName,
    displayName: displayFirstName(guest.firstName),
  });
  response.cookies.set(GUEST_COOKIE, guest.token, guestCookieOptions());

  return response;
}
