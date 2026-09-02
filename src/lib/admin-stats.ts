import "server-only";

import { PHOTO_STATUS } from "./constants";
import { prisma } from "./prisma";

export type DashboardStats = {
  photos: number;
  hidden: number;
  guests: number;
  participants: number;
  activeChallenges: number;
  averageChallengesPerParticipant: number;
  topChallenges: { title: string; count: number }[];
  quietChallenges: { title: string; count: number }[];
};

/** Chiffres du tableau de bord (cahier des charges §6). */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [photos, hidden, guests, activeChallenges, perChallenge, participantRows] =
    await Promise.all([
      prisma.photo.count({ where: { status: PHOTO_STATUS.VISIBLE } }),
      prisma.photo.count({ where: { status: PHOTO_STATUS.HIDDEN } }),
      prisma.guest.count(),
      prisma.challenge.count({ where: { active: true } }),
      prisma.photo.groupBy({
        by: ["challengeId"],
        where: { status: PHOTO_STATUS.VISIBLE },
        _count: { _all: true },
      }),
      prisma.photo.groupBy({
        by: ["guestId"],
        where: { status: PHOTO_STATUS.VISIBLE },
        _count: { _all: true },
      }),
    ]);

  const challenges = await prisma.challenge.findMany({
    select: { id: true, title: true, active: true },
    orderBy: { order: "asc" },
  });

  const counts = new Map(perChallenge.map((row) => [row.challengeId, row._count._all]));
  // Les défis sans aucune photo n'apparaissent pas dans le groupBy : on les
  // réintroduit à zéro, sinon le classement des « moins réalisés » les rate.
  const ranked = challenges
    .filter((challenge) => challenge.active)
    .map((challenge) => ({ title: challenge.title, count: counts.get(challenge.id) ?? 0 }))
    .sort((a, b) => b.count - a.count);

  // Défis distincts réalisés, moyenne calculée sur les seuls participants.
  const distinctPairs = await prisma.photo.findMany({
    where: { status: PHOTO_STATUS.VISIBLE },
    select: { guestId: true, challengeId: true },
    distinct: ["guestId", "challengeId"],
  });

  const participants = participantRows.length;

  return {
    photos,
    hidden,
    guests,
    participants,
    activeChallenges,
    averageChallengesPerParticipant:
      participants > 0 ? Math.round((distinctPairs.length / participants) * 10) / 10 : 0,
    topChallenges: ranked.slice(0, 5),
    quietChallenges: ranked.slice(-3).reverse(),
  };
}

/** Liste des invités avec leur progression, pour l'onglet « Invités ». */
export async function getGuestsWithProgress() {
  const [guests, activeChallenges] = await Promise.all([
    prisma.guest.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        firstName: true,
        createdAt: true,
        photos: {
          where: { status: PHOTO_STATUS.VISIBLE },
          select: { challengeId: true, challenge: { select: { points: true } } },
        },
      },
    }),
    prisma.challenge.count({ where: { active: true } }),
  ]);

  return {
    activeChallenges,
    guests: guests
      .map((guest) => {
        const doneChallenges = new Map(
          guest.photos.map((photo) => [photo.challengeId, photo.challenge.points]),
        );
        return {
          id: guest.id,
          firstName: guest.firstName,
          createdAt: guest.createdAt,
          photos: guest.photos.length,
          challengesDone: doneChallenges.size,
          points: [...doneChallenges.values()].reduce((total, points) => total + points, 0),
        };
      })
      .sort((a, b) => b.points - a.points),
  };
}
