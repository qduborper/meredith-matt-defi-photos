import { ChallengeRow } from "@/components/admin/ChallengeRow";
import { NewChallengeForm } from "@/components/admin/NewChallengeForm";
import { PHOTO_STATUS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminChallengesPage() {
  const challenges = await prisma.challenge.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      points: true,
      active: true,
      _count: { select: { photos: { where: { status: PHOTO_STATUS.VISIBLE } } } },
    },
  });

  const categories = [...new Set(challenges.map((challenge) => challenge.category))];

  return (
    <>
      <h1 className="font-title text-[28px] font-bold leading-none text-sapin">Défis</h1>
      <p className="mb-4 mt-0.5 text-[12.5px] font-normal text-ink-soft">
        Ajoutez, modifiez, réordonnez ou désactivez des défis — même pendant la soirée. Un défi
        désactivé disparaît de la liste des invités, mais les points déjà gagnés sont conservés.
      </p>

      <NewChallengeForm categories={categories} />

      <div className="overflow-hidden rounded-[16px] border border-hairline bg-surface">
        <div className="flex flex-wrap items-center gap-3 bg-[#f3efe3] px-4 py-3 text-[11px] font-bold text-ink-soft">
          <span className="min-w-[180px] flex-1">Défi</span>
          <span className="w-[150px] shrink-0">Catégorie</span>
          <span className="w-[46px] shrink-0">Points</span>
          <span className="shrink-0">Ordre · actif · actions</span>
        </div>

        <ul>
          {challenges.map((challenge, index) => (
            <ChallengeRow
              key={challenge.id}
              categories={categories}
              isFirst={index === 0}
              isLast={index === challenges.length - 1}
              challenge={{
                id: challenge.id,
                title: challenge.title,
                description: challenge.description,
                category: challenge.category,
                points: challenge.points,
                active: challenge.active,
                photoCount: challenge._count.photos,
              }}
            />
          ))}
        </ul>
      </div>

      <p className="mt-3 text-[12px] font-normal text-ink-soft">
        {challenges.length} défi{challenges.length > 1 ? "s" : ""} au total,{" "}
        {challenges.filter((challenge) => challenge.active).length} actif
        {challenges.filter((challenge) => challenge.active).length > 1 ? "s" : ""}.
      </p>
    </>
  );
}
