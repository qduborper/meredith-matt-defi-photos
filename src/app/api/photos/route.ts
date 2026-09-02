import { NextResponse } from "next/server";

import { CLIENT_IMAGE, PHOTO_STATUS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getGuestByToken } from "@/lib/session";
import { InvalidImageError, storePhoto } from "@/lib/storage";

/**
 * Réception d'une photo.
 *
 * L'upload arrive en `multipart/form-data` plutôt qu'en JSON base64 : c'est
 * 33 % d'octets en moins sur un réseau de salle déjà médiocre, et `XMLHttpRequest`
 * peut suivre la progression de l'envoi (barre de progression de l'écran 3).
 *
 * L'idempotence repose sur `clientUploadId`, généré par le téléphone AVANT le
 * premier essai : si la réponse se perd et que le client rejoue l'envoi, on lui
 * rend la photo déjà enregistrée au lieu d'en créer une seconde.
 */
export async function POST(request: Request) {
  const guest = await getGuestByToken(request.headers.get("x-guest-token"));
  if (!guest) {
    return NextResponse.json(
      { error: "Session expirée. Reprenez depuis l'accueil." },
      { status: 401 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Envoi incomplet." }, { status: 400 });
  }

  const challengeId = form.get("challengeId");
  const clientUploadId = form.get("clientUploadId");
  const file = form.get("photo");

  if (typeof challengeId !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "Envoi incomplet." }, { status: 400 });
  }
  if (typeof clientUploadId !== "string" || clientUploadId.length < 8) {
    return NextResponse.json({ error: "Identifiant d'envoi manquant." }, { status: 400 });
  }

  // Rejeu d'un envoi déjà abouti : on répond comme au premier coup.
  const alreadyStored = await prisma.photo.findUnique({
    where: { clientUploadId },
    select: { id: true, challengeId: true, guestId: true },
  });
  if (alreadyStored) {
    if (alreadyStored.guestId !== guest.id) {
      return NextResponse.json({ error: "Envoi non reconnu." }, { status: 409 });
    }
    return NextResponse.json({ id: alreadyStored.id, duplicate: true }, { status: 200 });
  }

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { id: true, points: true, active: true, title: true },
  });
  if (!challenge) {
    return NextResponse.json({ error: "Ce défi n'existe plus." }, { status: 404 });
  }
  if (!challenge.active) {
    return NextResponse.json(
      { error: "Ce défi vient d'être retiré du jeu." },
      { status: 409 },
    );
  }

  if (file.size > CLIENT_IMAGE.maxUploadBytes) {
    return NextResponse.json(
      { error: "Photo trop lourde, même après compression." },
      { status: 413 },
    );
  }

  // Le défi rapporte-t-il des points, ou l'invité l'avait-il déjà relevé ?
  // Calculé avant l'insertion pour l'afficher dans l'écran de confirmation.
  const alreadyDone = await prisma.photo.findFirst({
    where: { guestId: guest.id, challengeId: challenge.id, status: PHOTO_STATUS.VISIBLE },
    select: { id: true },
  });

  let stored;
  try {
    stored = await storePhoto(Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    if (error instanceof InvalidImageError) {
      return NextResponse.json({ error: error.message }, { status: 415 });
    }
    console.error("Échec d'enregistrement d'une photo", error);
    return NextResponse.json(
      { error: "Impossible d'enregistrer la photo. Réessayez." },
      { status: 500 },
    );
  }

  const photo = await prisma.photo.create({
    data: {
      guestId: guest.id,
      challengeId: challenge.id,
      clientUploadId,
      status: PHOTO_STATUS.VISIBLE,
      ...stored,
    },
    select: { id: true },
  });

  return NextResponse.json(
    {
      id: photo.id,
      duplicate: false,
      challengeTitle: challenge.title,
      pointsEarned: alreadyDone ? 0 : challenge.points,
      alreadyDone: Boolean(alreadyDone),
    },
    { status: 201 },
  );
}
