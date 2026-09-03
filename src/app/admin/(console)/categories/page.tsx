import Link from "next/link";

import { CategoryRow, type AdminCategory } from "@/components/admin/CategoryRow";
import { PHOTO_STATUS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const challenges = await prisma.challenge.findMany({
    orderBy: { order: "asc" },
    select: {
      category: true,
      active: true,
      _count: { select: { photos: { where: { status: PHOTO_STATUS.VISIBLE } } } },
    },
  });

  // Agrégées dans l'ordre d'affichage : une catégorie n'existe que par les
  // défis qui la portent, il n'y a pas de table dédiée.
  const categories: AdminCategory[] = [];
  for (const challenge of challenges) {
    const existing = categories.find((category) => category.name === challenge.category);
    const entry = existing ?? {
      name: challenge.category,
      challenges: 0,
      activeChallenges: 0,
      photos: 0,
    };
    entry.challenges += 1;
    if (challenge.active) entry.activeChallenges += 1;
    entry.photos += challenge._count.photos;
    if (!existing) categories.push(entry);
  }

  return (
    <>
      <h1 className="font-title text-[28px] font-bold leading-none text-sapin">Catégories</h1>
      <p className="mb-4 mt-0.5 text-[12.5px] font-normal text-ink-soft">
        L&apos;ordre ci-dessous est celui que voient les invités sur leur liste de défis.
      </p>

      {categories.length === 0 ? (
        <p className="mt-10 text-center text-[13px] font-normal text-ink-soft">
          Aucune catégorie : elles apparaissent dès qu&apos;un défi en porte une.
        </p>
      ) : (
        <div className="overflow-hidden rounded-[16px] border border-hairline bg-surface">
          <div className="flex flex-wrap items-center gap-3 bg-[#f3efe3] px-4 py-3 text-[11px] font-bold text-ink-soft">
            <span className="min-w-[160px] flex-1">Catégorie</span>
            <span className="w-[120px] shrink-0">Défis</span>
            <span className="w-[80px] shrink-0">Photos</span>
            <span className="shrink-0">Ordre · actions</span>
          </div>

          <ul>
            {categories.map((category, index) => (
              <CategoryRow
                key={category.name}
                category={category}
                others={categories
                  .filter((other) => other.name !== category.name)
                  .map((other) => other.name)}
                isFirst={index === 0}
                isLast={index === categories.length - 1}
              />
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 rounded-[16px] border border-hairline bg-surface p-4 text-[12.5px] font-normal leading-relaxed text-ink-soft">
        <p className="mb-2 font-bold text-sapin">Comment ça marche</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Une catégorie n&apos;existe que par les défis qui la portent. Pour en créer une,
            ajoutez un défi depuis <Link href="/admin/defis" className="text-sauge underline">Défis</Link>{" "}
            et choisissez « ＋ Nouvelle catégorie ».
          </li>
          <li>
            <strong>Renommer</strong> met à jour tous les défis concernés d&apos;un coup. Reprendre
            le nom d&apos;une catégorie existante <strong>fusionne</strong> les deux.
          </li>
          <li>
            Une catégorie disparaît d&apos;elle-même quand son dernier défi est supprimé ou déplacé
            ailleurs. Les points déjà gagnés par les invités ne bougent pas.
          </li>
        </ul>
      </div>
    </>
  );
}
