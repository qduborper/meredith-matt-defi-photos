import Image from "next/image";
import Link from "next/link";

import { PhotoActions } from "@/components/admin/PhotoActions";
import { Pagination } from "@/components/Pagination";
import { PHOTO_STATUS } from "@/lib/constants";
import { getGalleryPhotos, mediaUrl } from "@/lib/photos";
import { prisma } from "@/lib/prisma";
import { displayFirstName } from "@/lib/validation";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

export default async function AdminGalleryPage({ searchParams }: PageProps<"/admin/galerie">) {
  const params = await searchParams;
  const page = Number(Array.isArray(params.page) ? params.page[0] : params.page) || 1;
  const guestId = typeof params.invite === "string" ? params.invite : undefined;
  const challengeId = typeof params.defi === "string" ? params.defi : undefined;

  const [photos, guests, challenges] = await Promise.all([
    getGalleryPhotos({
      page,
      pageSize: PAGE_SIZE,
      guestId,
      challengeId,
      // La modération voit aussi les photos masquées, pour pouvoir les rétablir.
      statuses: [PHOTO_STATUS.VISIBLE, PHOTO_STATUS.HIDDEN],
    }),
    prisma.guest.findMany({ orderBy: { firstName: "asc" }, select: { id: true, firstName: true } }),
    prisma.challenge.findMany({ orderBy: { order: "asc" }, select: { id: true, title: true } }),
  ]);

  const hrefFor = (target: number) =>
    `/admin/galerie?${new URLSearchParams({
      ...(guestId ? { invite: guestId } : {}),
      ...(challengeId ? { defi: challengeId } : {}),
      ...(target > 1 ? { page: String(target) } : {}),
    })}`;

  const chip = (active: boolean) =>
    `rounded-full border-[1.5px] px-3.5 py-2 text-[12.5px] font-semibold ${
      active ? "border-sapin bg-sapin text-creme" : "border-eau bg-surface text-sapin"
    }`;

  return (
    <>
      <h1 className="font-title text-[28px] font-bold leading-none text-sapin">
        Galerie &amp; modération
      </h1>
      <p className="mb-4 mt-0.5 text-[12.5px] font-normal text-ink-soft">
        Les photos s&apos;affichent automatiquement. Masquez pour retirer de la galerie et du
        diaporama ; supprimez pour effacer le fichier.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href="/admin/galerie" className={chip(!guestId && !challengeId)}>
          Toutes ({photos.total})
        </Link>

        {/* Tri par personne et par défi, demandé au §6 du cahier. */}
        <form method="get" className="flex flex-wrap items-center gap-2">
          <select
            name="invite"
            defaultValue={guestId ?? ""}
            className="rounded-full border-[1.5px] border-eau bg-surface px-3.5 py-2 text-[12.5px] font-semibold text-sapin"
            aria-label="Filtrer par invité"
          >
            <option value="">Par personne…</option>
            {guests.map((guest) => (
              <option key={guest.id} value={guest.id}>
                {displayFirstName(guest.firstName)}
              </option>
            ))}
          </select>

          <select
            name="defi"
            defaultValue={challengeId ?? ""}
            className="max-w-[220px] rounded-full border-[1.5px] border-eau bg-surface px-3.5 py-2 text-[12.5px] font-semibold text-sapin"
            aria-label="Filtrer par défi"
          >
            <option value="">Par défi…</option>
            {challenges.map((challenge) => (
              <option key={challenge.id} value={challenge.id}>
                {challenge.title}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-full bg-sauge px-3.5 py-2 text-[12.5px] font-bold text-white"
          >
            Filtrer
          </button>
        </form>
      </div>

      {photos.items.length === 0 ? (
        <p className="mt-10 text-center text-[13px] font-normal text-ink-soft">
          Aucune photo ne correspond à ce filtre.
        </p>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
            {photos.items.map((photo) => {
              const author = displayFirstName(photo.authorFirstName);
              const hidden = photo.status === PHOTO_STATUS.HIDDEN;

              return (
                <li
                  key={photo.id}
                  className="relative aspect-3/4 overflow-hidden rounded-[14px] border border-hairline bg-eau"
                >
                  <Image
                    src={mediaUrl(photo.thumbPath)}
                    alt={`${photo.challengeTitle}, par ${author}`}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className={`object-cover ${hidden ? "brightness-75 grayscale-[.7]" : ""}`}
                  />

                  {hidden ? (
                    <span className="absolute left-2 top-2 rounded-[10px] bg-[rgba(14,43,42,.8)] px-2 py-[3px] text-[9.5px] font-bold text-creme">
                      Masquée
                    </span>
                  ) : null}

                  <PhotoActions photoId={photo.id} status={photo.status} author={author} />

                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-[rgba(14,43,42,.85)] to-transparent px-2.5 pb-2.5 pt-6 text-creme">
                    <p className="truncate text-[11px] font-bold leading-tight">{author}</p>
                    <p className="truncate text-[9.5px] font-normal opacity-90">
                      {photo.challengeTitle}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <Pagination
            page={photos.page}
            pageCount={photos.pageCount}
            hrefFor={hrefFor}
            className="pt-5"
          />
        </>
      )}
    </>
  );
}
