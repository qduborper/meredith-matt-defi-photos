import Link from "next/link";
import { redirect } from "next/navigation";

import { GuestHeader } from "@/components/GuestHeader";
import { getChallengesForGuest } from "@/lib/challenges";
import { getGuestProgress } from "@/lib/scoring";
import { getCurrentGuest } from "@/lib/session";
import { displayFirstName } from "@/lib/validation";

export const dynamic = "force-dynamic";

function remainingLabel(remaining: number): string {
  if (remaining === 0) return "Tous les défis sont relevés. Chapeau.";
  if (remaining === 1) return "Il reste 1 défi à relever ce soir";
  return `Il reste ${remaining} défis à relever ce soir`;
}

export default async function ChallengesPage() {
  const guest = await getCurrentGuest();
  if (!guest) redirect("/");

  const [groups, progress] = await Promise.all([
    getChallengesForGuest(guest.id),
    getGuestProgress(guest.id),
  ]);

  const remaining = Math.max(0, progress.activeChallenges - progress.challengesDone);
  const ratio =
    progress.activeChallenges > 0 ? progress.challengesDone / progress.activeChallenges : 0;

  return (
    <>
      <GuestHeader
        displayName={displayFirstName(guest.firstName)}
        subtitle={remainingLabel(remaining)}
      />

      <section
        aria-label="Votre progression"
        className="mx-5 mt-3.5 rounded-panel bg-sapin px-4 py-3.5 text-creme"
      >
        <div className="flex items-baseline justify-between">
          <p className="text-[22px] font-bold">
            {progress.challengesDone}
            <span className="text-[12px] font-normal opacity-80">
              {" "}
              / {progress.activeChallenges} défis
            </span>
          </p>
          {/* Taupe : couleur réservée à la gamification. */}
          <p className="rounded-full bg-taupe px-2.5 py-1 text-[12px] font-bold text-sapin">
            {progress.points} pts
          </p>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={progress.activeChallenges}
          aria-valuenow={progress.challengesDone}
          aria-label="Défis relevés"
          className="mt-3 h-[7px] overflow-hidden rounded-md bg-white/20"
        >
          <div
            className="h-full rounded-md bg-eau transition-[width] duration-500"
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>
      </section>

      <div className="flex-1 px-5 pb-4 pt-4">
        {groups.length === 0 ? (
          <p className="mt-10 text-center text-[13px] font-normal leading-relaxed text-ink-soft">
            Aucun défi n&apos;est ouvert pour le moment.
            <br />
            Revenez dans un instant, la soirée ne fait que commencer.
          </p>
        ) : (
          groups.map((group) => (
            <section key={group.category} className="mb-4 last:mb-0">
              <h2 className="mb-2.5 mt-4 font-title text-[21px] font-bold text-sapin first:mt-0.5">
                {group.category}
              </h2>

              <ul>
                {group.challenges.map((challenge) => (
                  <li key={challenge.id} className="mb-2.5">
                    <Link
                      href={`/defis/${challenge.id}`}
                      className="flex items-center gap-3 rounded-card border border-hairline bg-surface px-3.5 py-3"
                    >
                      <span className="flex-1">
                        <span
                          className={`block text-[13.5px] font-bold leading-tight ${
                            challenge.done ? "text-ink-soft" : "text-ink"
                          }`}
                        >
                          {challenge.title}
                        </span>
                        <span className="mt-1 inline-block rounded-full bg-eau px-2.5 py-0.5 text-[10.5px] font-bold text-sapin">
                          {challenge.points} pts{challenge.done ? " · fait" : ""}
                        </span>
                      </span>

                      <span
                        aria-hidden="true"
                        className={`flex size-[30px] shrink-0 items-center justify-center rounded-full ${
                          challenge.done ? "bg-sauge" : "border-[1.5px] border-eau bg-creme"
                        }`}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={challenge.done ? "#fff" : "var(--color-sauge)"}
                          strokeWidth={challenge.done ? 3 : 2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="size-[15px]"
                        >
                          <path d={challenge.done ? "M20 6 9 17l-5-5" : "m9 18 6-6-6-6"} />
                        </svg>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </>
  );
}
