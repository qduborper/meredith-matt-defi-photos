import type { Metadata } from "next";

import { Slideshow } from "@/components/Slideshow";
import { SLIDESHOW } from "@/lib/constants";
import { getLatestVisiblePhotos, mediaUrl } from "@/lib/photos";
import { getLeaderboard } from "@/lib/scoring";
import { displayFirstName } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Diaporama · Mérédith & Matthieu",
  robots: { index: false, follow: false },
};

/**
 * Écran projeté sur place. Lecture seule, sans identification : la page est
 * ouverte par les mariés sur l'ordinateur relié au vidéoprojecteur, et
 * n'affiche que des photos déjà publiques pour tous les invités.
 *
 * Le premier rendu vient du serveur, pour que la projection démarre sur une
 * image et non sur un écran vide en attendant le premier sondage.
 */
export default async function ScreenPage() {
  const [photos, board] = await Promise.all([getLatestVisiblePhotos(40), getLeaderboard()]);

  return (
    <Slideshow
      initial={{
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
      }}
    />
  );
}
