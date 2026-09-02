"use client";

import { useEffect, useRef, useState } from "react";

type Slide = { id: string; url: string; thumbUrl: string; author: string; challenge: string };
type Rank = { rank: number; name: string; points: number };
type Feed = { photos: Slide[]; leaderboard: Rank[]; pollMs: number; slideMs: number };

/**
 * Diaporama projeté, en lecture seule.
 *
 * Deux boucles indépendantes :
 * - le **polling** rapatrie les nouvelles photos toutes les ~6 s ;
 * - le **défilement** change de photo toutes les ~7 s.
 *
 * Elles sont séparées à dessein : une requête réseau lente ne doit jamais figer
 * l'image projetée devant cent personnes. Si le serveur ne répond pas, le
 * diaporama continue de tourner sur les photos déjà chargées.
 */
export function Slideshow({ initial }: { initial: Feed }) {
  const [feed, setFeed] = useState(initial);
  const [index, setIndex] = useState(0);
  const [offline, setOffline] = useState(false);

  // Lu par la boucle de défilement sans la faire redémarrer à chaque photo reçue.
  const feedRef = useRef(feed);
  useEffect(() => {
    feedRef.current = feed;
  }, [feed]);

  useEffect(() => {
    let stopped = false;

    async function poll() {
      try {
        const response = await fetch("/api/slideshow", { cache: "no-store" });
        if (!response.ok) throw new Error(String(response.status));
        const next: Feed = await response.json();
        if (!stopped) {
          setFeed(next);
          setOffline(false);
        }
      } catch {
        // On garde les photos déjà en main : mieux vaut un diaporama un peu
        // daté qu'un écran noir au milieu de la soirée.
        if (!stopped) setOffline(true);
      }
    }

    const timer = setInterval(poll, initial.pollMs);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [initial.pollMs]);

  useEffect(() => {
    const timer = setInterval(() => {
      const count = feedRef.current.photos.length;
      if (count > 0) setIndex((current) => (current + 1) % count);
    }, initial.slideMs);
    return () => clearInterval(timer);
  }, [initial.slideMs]);

  const photos = feed.photos;
  // Une photo modérée entre deux sondages peut raccourcir la liste.
  const current = photos[index % Math.max(1, photos.length)];

  if (!current) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-[#0e2b2a] text-creme">
        <p className="font-title text-[52px] font-bold">La soirée commence</p>
        <p className="mt-3 text-[18px] font-normal opacity-80">
          Les premières photos s&apos;afficheront ici.
        </p>
      </div>
    );
  }

  const upcoming = photos.slice(index + 1, index + 5);

  return (
    <div className="relative h-dvh overflow-hidden bg-[#0e2b2a]">
      {/* Fond flouté : comble les bandes noires des photos verticales. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={`bg-${current.id}`}
        src={current.url}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 size-full scale-110 object-cover opacity-30 blur-2xl"
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={current.id}
        src={current.url}
        alt={`${current.challenge}, par ${current.author}`}
        className="absolute inset-0 size-full animate-[fade_.8s_ease] object-contain"
      />

      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[rgba(14,43,42,.75)] via-transparent to-[rgba(14,43,42,.45)]" />

      <div className="absolute left-[3vw] top-[3vh] flex items-center gap-3 text-creme">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/monogram.png" alt="" className="w-[5vw] min-w-[64px] drop-shadow-lg" />
        <span className="font-title text-[2vw] font-bold leading-none drop-shadow-lg">
          Mérédith &amp; Matthieu
        </span>
      </div>

      {feed.leaderboard.length > 0 ? (
        <aside className="absolute right-[2vw] top-[3vh] w-[14vw] min-w-[190px] rounded-[14px] bg-[rgba(14,43,42,.55)] px-3.5 py-3 text-creme backdrop-blur-sm">
          {/* Taupe : couleur de la gamification. */}
          <h2 className="mb-2 font-title text-[1.35vw] font-bold text-taupe">Classement</h2>
          <ol>
            {feed.leaderboard.map((row) => (
              <li key={row.name + row.rank} className="my-1 flex items-center gap-2 text-[1vw]">
                <span className="w-[1.2vw] min-w-[15px] font-bold text-taupe">{row.rank}</span>
                <span className="flex-1 truncate font-semibold">{row.name}</span>
                <span className="font-normal opacity-85">{row.points}</span>
              </li>
            ))}
          </ol>
        </aside>
      ) : null}

      <figcaption className="absolute bottom-[3vh] left-[3vw] max-w-[60%] text-creme">
        <p className="font-title text-[2.4vw] font-bold leading-none drop-shadow-lg">
          par {current.author}
        </p>
        <p className="mt-2 inline-block rounded-full bg-[rgba(14,43,42,.5)] px-3.5 py-1.5 text-[1.05vw] font-semibold backdrop-blur-sm">
          Défi · {current.challenge}
        </p>
      </figcaption>

      <div className="absolute bottom-[3vh] right-[2vw] flex gap-2">
        {upcoming.map((photo) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photo.id}
            src={photo.thumbUrl}
            alt=""
            aria-hidden="true"
            className="h-[5vh] w-[7vh] rounded-md border-2 border-creme/70 object-cover"
          />
        ))}
      </div>

      {offline ? (
        <p className="absolute bottom-[1vh] left-[3vw] text-[0.8vw] text-creme/50">
          Hors ligne — les photos déjà reçues continuent de défiler.
        </p>
      ) : null}
    </div>
  );
}
