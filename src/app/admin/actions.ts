"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  checkPassword,
  closeAdminSession,
  openAdminSession,
  requireAdmin,
} from "@/lib/admin-session";
import { PHOTO_STATUS, type PhotoStatus } from "@/lib/constants";
import { recordFailure, recordSuccess, secondsBeforeRetry } from "@/lib/login-throttle";
import { prisma } from "@/lib/prisma";
import { deletePhotoFiles } from "@/lib/storage";

/** Rafraîchit toutes les vues qui dépendent des photos ou des défis. */
function revalidateEverything() {
  for (const path of [
    "/admin",
    "/admin/galerie",
    "/admin/defis",
    "/admin/categories",
    "/admin/invites",
  ]) {
    revalidatePath(path);
  }
  // Côté invité et écran : la modération doit se voir immédiatement.
  revalidatePath("/defis");
  revalidatePath("/galerie");
  revalidatePath("/classement");
  revalidatePath("/ecran");
}

export async function login(_previous: string | null, formData: FormData): Promise<string | null> {
  const wait = await secondsBeforeRetry();
  if (wait > 0) {
    return `Trop de tentatives. Réessayez dans ${wait} seconde${wait > 1 ? "s" : ""}.`;
  }

  const password = formData.get("password");
  if (typeof password !== "string" || !checkPassword(password)) {
    await recordFailure();
    return "Mot de passe incorrect.";
  }

  await recordSuccess();
  await openAdminSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await closeAdminSession();
  redirect("/admin/login");
}

/** Masque, réaffiche ou supprime une photo (cahier des charges §6). */
export async function setPhotoStatus(photoId: string, status: PhotoStatus): Promise<void> {
  await requireAdmin();

  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    select: { path: true, thumbPath: true },
  });
  if (!photo) return;

  await prisma.photo.update({ where: { id: photoId }, data: { status } });

  // « Masquée » conserve le fichier — c'est toute la différence avec
  // « supprimée », qui l'efface pour de bon (§6 : le masquage est réversible).
  if (status === PHOTO_STATUS.DELETED) {
    await deletePhotoFiles([photo.path, photo.thumbPath]);
  }

  revalidateEverything();
}

export async function createChallenge(formData: FormData): Promise<void> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  if (!title || !category) return;

  // Nouveau défi en fin de liste, avec le même pas de 10 que le seed.
  const last = await prisma.challenge.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.challenge.create({
    data: {
      title,
      category,
      description: String(formData.get("description") ?? "").trim(),
      points: Number(formData.get("points")) || 10,
      active: true,
      order: (last?.order ?? 0) + 10,
    },
  });

  revalidateEverything();
}

export async function updateChallenge(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  if (!id || !title || !category) return;

  await prisma.challenge.update({
    where: { id },
    data: {
      title,
      category,
      description: String(formData.get("description") ?? "").trim(),
      points: Number(formData.get("points")) || 10,
    },
  });

  revalidateEverything();
}

export async function toggleChallenge(id: string, active: boolean): Promise<void> {
  await requireAdmin();
  await prisma.challenge.update({ where: { id }, data: { active } });
  revalidateEverything();
}

/**
 * Déplace un défi d'un cran. On échange les `order` des deux voisins plutôt
 * que de renuméroter toute la liste : deux écritures, et le reste de la liste
 * n'est pas touché.
 */
export async function moveChallenge(id: string, direction: "up" | "down"): Promise<void> {
  await requireAdmin();

  const current = await prisma.challenge.findUnique({
    where: { id },
    select: { id: true, order: true },
  });
  if (!current) return;

  const neighbour = await prisma.challenge.findFirst({
    where: direction === "up" ? { order: { lt: current.order } } : { order: { gt: current.order } },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
    select: { id: true, order: true },
  });
  if (!neighbour) return;

  await prisma.$transaction([
    prisma.challenge.update({ where: { id: current.id }, data: { order: neighbour.order } }),
    prisma.challenge.update({ where: { id: neighbour.id }, data: { order: current.order } }),
  ]);

  revalidateEverything();
}

/**
 * Renomme une catégorie sur tous ses défis.
 *
 * Il n'y a pas de table Catégorie : une catégorie n'existe que par les défis
 * qui la portent. Renommer, c'est donc une mise à jour groupée — et renommer
 * vers un nom existant revient à fusionner les deux, ce qui est le
 * comportement attendu.
 */
export async function renameCategory(formData: FormData): Promise<void> {
  await requireAdmin();

  const from = String(formData.get("from") ?? "").trim();
  const to = String(formData.get("to") ?? "").trim();
  if (!from || !to || from === to) return;

  await prisma.challenge.updateMany({ where: { category: from }, data: { category: to } });
  revalidateEverything();
}

/**
 * Déplace une catégorie entière d'un cran dans l'ordre d'affichage.
 *
 * Les catégories sont classées par le plus petit `order` de leurs défis. Pour
 * en permuter deux, on échange leurs plages d'`order` en bloc, en conservant
 * l'ordre interne de chaque catégorie.
 */
export async function moveCategory(category: string, direction: "up" | "down"): Promise<void> {
  await requireAdmin();

  const challenges = await prisma.challenge.findMany({
    orderBy: { order: "asc" },
    select: { id: true, category: true, order: true },
  });

  // Catégories dans leur ordre d'affichage, sans doublon.
  const order: string[] = [];
  for (const challenge of challenges) {
    if (!order.includes(challenge.category)) order.push(challenge.category);
  }

  const index = order.indexOf(category);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= order.length) return;

  [order[index], order[target]] = [order[target], order[index]];

  // Renumérotation complète : c'est le seul moyen simple de garantir que les
  // plages restent disjointes après permutation. 22 défis, une transaction.
  const renumbered = order.flatMap((name) =>
    challenges.filter((challenge) => challenge.category === name),
  );

  await prisma.$transaction(
    renumbered.map((challenge, position) =>
      prisma.challenge.update({
        where: { id: challenge.id },
        data: { order: (position + 1) * 10 },
      }),
    ),
  );

  revalidateEverything();
}

/** Supprime un défi et, en cascade, les photos qui lui étaient rattachées. */
export async function deleteChallenge(id: string): Promise<void> {
  await requireAdmin();

  const photos = await prisma.photo.findMany({
    where: { challengeId: id },
    select: { path: true, thumbPath: true },
  });

  await prisma.challenge.delete({ where: { id } });
  await deletePhotoFiles(photos.flatMap((photo) => [photo.path, photo.thumbPath]));

  revalidateEverything();
}
