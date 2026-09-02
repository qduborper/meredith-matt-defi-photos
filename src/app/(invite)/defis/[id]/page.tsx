import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ChallengeUploader } from "@/components/ChallengeUploader";
import { getChallengeForGuest } from "@/lib/challenges";
import { getCurrentGuest } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ChallengePage({ params }: PageProps<"/defis/[id]">) {
  const guest = await getCurrentGuest();
  if (!guest) redirect("/");

  const { id } = await params;
  const challenge = await getChallengeForGuest(id, guest.id);
  if (!challenge) notFound();

  return (
    <>
      <Link
        href="/defis"
        className="flex items-center gap-2 px-5 pt-2 text-[13px] font-semibold text-sapin"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Retour aux défis
      </Link>

      <div className="px-6 pt-3 text-center">
        {/* Taupe : réservé à la gamification, ici les points du défi. */}
        <span className="inline-block rounded-full bg-taupe px-3 py-[3px] text-[10.5px] font-bold text-sapin">
          {challenge.points} pts
        </span>
        <h1 className="mb-1.5 mt-2.5 font-title text-[28px] font-bold leading-[1.05] text-sapin">
          {challenge.title}
        </h1>
        <p className="text-[12.5px] font-normal leading-[1.45] text-ink-soft">
          {challenge.description}
        </p>
      </div>

      <ChallengeUploader
        challengeId={challenge.id}
        points={challenge.points}
        alreadyDone={challenge.done}
      />
    </>
  );
}
