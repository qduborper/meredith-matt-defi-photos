import "server-only";

import { PHOTO_STATUS } from "./constants";
import { prisma } from "./prisma";

export type LeaderboardRow = {
  rank: number;
  guestId: string;
  firstName: string;
  points: number;
  challengesDone: number;
  photos: number;
};

/**
 * Classement calculé à la volée (cahier des charges §8.4).
 *
 * Règle : un défi rapporte ses points UNE seule fois, dès que l'invité a au
 * moins une photo `visible` dessus. Envoyer dix photos sur le même défi ne
 * rapporte donc rien de plus — c'est ce qui pousse à en varier les sujets.
 *
 * Le volume est modeste (~100 invités, ~1 000 photos) : un GROUP BY suffit
 * largement, inutile de maintenir un score dénormalisé.
 */
export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  // SQLite renvoie ses agrégats (SUM, COUNT) en BigInt : on les convertit
  // avant de les rendre, sinon la moindre arithmétique côté React explose.
  const rows = await prisma.$queryRaw<
    {
      guestId: string;
      firstName: string;
      points: bigint | number;
      challengesDone: bigint | number;
      photos: bigint | number;
    }[]
  >`
    SELECT
      g.id                          AS guestId,
      g.firstName                   AS firstName,
      COALESCE(SUM(done.points), 0) AS points,
      COUNT(done.challengeId)       AS challengesDone,
      COALESCE(SUM(done.n), 0)      AS photos
    FROM Guest g
    LEFT JOIN (
      -- Une ligne par couple (invité, défi) réussi : les points du défi n'y
      -- figurent donc qu'une fois, quel que soit le nombre de photos.
      SELECT p.guestId, p.challengeId, c.points AS points, COUNT(*) AS n
      FROM Photo p
      JOIN Challenge c ON c.id = p.challengeId
      WHERE p.status = ${PHOTO_STATUS.VISIBLE}
      GROUP BY p.guestId, p.challengeId, c.points
    ) AS done ON done.guestId = g.id
    GROUP BY g.id, g.firstName, g.createdAt
    ORDER BY points DESC, challengesDone DESC, g.createdAt ASC
  `;

  // Rangs ex aequo : deux invités à égalité partagent la même place, et la
  // suivante est décalée d'autant (1, 2, 2, 4).
  let lastPoints: number | null = null;
  let lastRank = 0;

  return rows.map((row, index) => {
    const points = Number(row.points);
    const rank = points === lastPoints ? lastRank : index + 1;
    lastPoints = points;
    lastRank = rank;

    return {
      rank,
      guestId: row.guestId,
      firstName: row.firstName,
      points,
      challengesDone: Number(row.challengesDone),
      photos: Number(row.photos),
    };
  });
}

/** Progression d'un invité : points, défis réalisés, place au classement. */
export async function getGuestProgress(guestId: string) {
  const [board, activeChallenges] = await Promise.all([
    getLeaderboard(),
    prisma.challenge.count({ where: { active: true } }),
  ]);

  const me = board.find((row) => row.guestId === guestId);

  return {
    points: me?.points ?? 0,
    challengesDone: me?.challengesDone ?? 0,
    photos: me?.photos ?? 0,
    rank: me?.rank ?? board.length + 1,
    participants: board.filter((row) => row.photos > 0).length,
    activeChallenges,
  };
}
