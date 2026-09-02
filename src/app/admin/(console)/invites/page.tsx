import Link from "next/link";

import { getGuestsWithProgress } from "@/lib/admin-stats";
import { displayFirstName } from "@/lib/validation";

export const dynamic = "force-dynamic";

export default async function AdminGuestsPage() {
  const { guests, activeChallenges } = await getGuestsWithProgress();

  return (
    <>
      <h1 className="font-title text-[28px] font-bold leading-none text-sapin">Invités</h1>
      <p className="mb-4 mt-0.5 text-[12.5px] font-normal text-ink-soft">
        Prénoms enregistrés et progression de chacun. Cliquez sur un prénom pour ne voir que ses
        photos.
      </p>

      {guests.length === 0 ? (
        <p className="mt-10 text-center text-[13px] font-normal text-ink-soft">
          Personne ne s&apos;est encore identifié.
        </p>
      ) : (
        <div className="overflow-hidden rounded-[16px] border border-hairline bg-surface">
          <div className="flex items-center gap-3 bg-[#f3efe3] px-4 py-3 text-[11px] font-bold text-ink-soft">
            <span className="flex-1">Prénom</span>
            <span className="w-[110px] shrink-0">Défis réalisés</span>
            <span className="w-[70px] shrink-0">Points</span>
            <span className="w-[60px] shrink-0 text-right">Photos</span>
          </div>

          <ul>
            {guests.map((guest) => (
              <li
                key={guest.id}
                className="flex items-center gap-3 border-b border-[#f0ead9] px-4 py-3.5 text-[12.5px] last:border-b-0"
              >
                <Link
                  href={`/admin/galerie?invite=${guest.id}`}
                  className="flex-1 truncate font-bold text-ink underline decoration-eau underline-offset-4"
                >
                  {displayFirstName(guest.firstName)}
                </Link>
                <span className="w-[110px] shrink-0 text-ink-soft">
                  {guest.challengesDone} / {activeChallenges}
                </span>
                <span className="w-[70px] shrink-0 font-bold text-sauge">{guest.points}</span>
                <span className="w-[60px] shrink-0 text-right text-ink-soft">{guest.photos}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-3 text-[12px] font-normal text-ink-soft">
        {guests.length} invité{guests.length > 1 ? "s" : ""} identifié
        {guests.length > 1 ? "s" : ""},{" "}
        {guests.filter((guest) => guest.photos > 0).length} ayant envoyé au moins une photo.
      </p>
    </>
  );
}
