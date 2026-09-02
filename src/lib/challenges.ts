import "server-only";

import { PHOTO_STATUS } from "./constants";
import { prisma } from "./prisma";

export type ChallengeForGuest = {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  exampleImage: string | null;
  /** L'invité a au moins une photo visible sur ce défi. */
  done: boolean;
  /** Nombre de ses photos visibles — un défi peut être rejoué. */
  photoCount: number;
};

export type CategoryGroup = { category: string; challenges: ChallengeForGuest[] };

/**
 * Défis actifs, groupés par catégorie, avec l'état de l'invité.
 *
 * Les catégories sont ordonnées par le plus petit `order` de leurs défis :
 * réordonner un défi depuis l'admin suffit à déplacer sa catégorie, sans champ
 * d'ordre séparé à maintenir.
 */
export async function getChallengesForGuest(guestId: string | null): Promise<CategoryGroup[]> {
  const [challenges, myPhotos] = await Promise.all([
    prisma.challenge.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        points: true,
        exampleImage: true,
      },
    }),
    guestId
      ? prisma.photo.groupBy({
          by: ["challengeId"],
          where: { guestId, status: PHOTO_STATUS.VISIBLE },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ]);

  const counts = new Map(myPhotos.map((row) => [row.challengeId, row._count._all]));

  const groups: CategoryGroup[] = [];
  for (const challenge of challenges) {
    const photoCount = counts.get(challenge.id) ?? 0;
    const entry: ChallengeForGuest = {
      ...challenge,
      done: photoCount > 0,
      photoCount,
    };

    const group = groups.find((candidate) => candidate.category === challenge.category);
    if (group) {
      group.challenges.push(entry);
    } else {
      groups.push({ category: challenge.category, challenges: [entry] });
    }
  }

  return groups;
}

/** Un défi actif et l'état de l'invité dessus, pour l'écran de réalisation. */
export async function getChallengeForGuest(
  challengeId: string,
  guestId: string | null,
): Promise<ChallengeForGuest | null> {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      points: true,
      exampleImage: true,
      active: true,
    },
  });
  if (!challenge || !challenge.active) return null;

  const photoCount = guestId
    ? await prisma.photo.count({
        where: { guestId, challengeId, status: PHOTO_STATUS.VISIBLE },
      })
    : 0;

  return {
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    category: challenge.category,
    points: challenge.points,
    exampleImage: challenge.exampleImage,
    done: photoCount > 0,
    photoCount,
  };
}
