import { NextResponse } from "next/server";

import { SLIDESHOW } from "@/lib/constants";
import { getLatestVisiblePhotos, mediaUrl } from "@/lib/photos";
import { getLeaderboard } from "@/lib/scoring";
import { displayFirstName } from "@/lib/validation";

/** Nombre de photos gardées en rotation sur l'écran projeté. */
const SLIDES = 40;

/**
 * Alimente le diaporama, interrogé en polling (cahier des charges §8.2).
 *
 * Le polling est un choix assumé face aux websockets : sur le wifi d'une salle
 * de réception, une socket qui tombe demande une logique de reconnexion, là où
 * une requête ratée est simplement rejouée six secondes plus tard.
 */
export async function GET() {
  const [photos, board] = await Promise.all([getLatestVisiblePhotos(SLIDES), getLeaderboard()]);

  return NextResponse.json(
    {
      pollMs: SLIDESHOW.pollMs,
      slideMs: SLIDESHOW.slideMs,
      photos: photos.map((photo) => ({
        id: photo.id,
        url: mediaUrl(photo.path),
        thumbUrl: mediaUrl(photo.thumbPath),
        author: displayFirstName(photo.authorFirstName),
        challenge: photo.challengeTitle,
      })),
      leaderboard: board
        .filter((row) => row.photos > 0)
        .slice(0, 3)
        .map((row) => ({
          rank: row.rank,
          name: displayFirstName(row.firstName),
          points: row.points,
        })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
