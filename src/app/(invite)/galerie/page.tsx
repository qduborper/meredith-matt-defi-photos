import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Pagination } from "@/components/Pagination";
import { getGalleryPhotos, mediaUrl } from "@/lib/photos";
import { getCurrentGuest } from "@/lib/session";
import { displayFirstName } from "@/lib/validation";

export const dynamic = "force-dynamic";

export default async function GalleryPage({ searchParams }: PageProps<"/galerie">) {
  const guest = await getCurrentGuest();
  if (!guest) redirect("/");

  const params = await searchParams;
  const mine = params.filtre === "moi";
  const page = Number(Array.isArray(params.page) ? params.page[0] : params.page) || 1;

  const photos = await getGalleryPhotos({
    page,
    guestId: mine ? guest.id : undefined,
  });

  const hrefFor = (target: number) =>
    `/galerie?${new URLSearchParams({
      ...(mine ? { filtre: "moi" } : {}),
      ...(target > 1 ? { page: String(target) } : {}),
    })}`;

  const tabClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-[12.5px] font-semibold ${
      active
        ? "bg-sapin text-creme"
        : "border-[1.5px] border-eau bg-surface text-sapin"
    }`;

  return (
    <>
      <header className="px-6 pb-0.5 pt-2 text-center">
        <h1 className="font-title text-[30px] font-bold text-sapin">Galerie</h1>
        <p className="mt-0.5 text-[12px] font-normal text-ink-soft">
          {photos.total === 0
            ? "L'album commun de la soirée"
            : `${photos.total} photo${photos.total > 1 ? "s" : ""}${mine ? " de vous" : " au total"}`}
        </p>
      </header>

      <div className="flex justify-center gap-2 px-5 pt-3.5">
        <Link href="/galerie" className={tabClass(!mine)} aria-current={!mine ? "page" : undefined}>
          Toutes
        </Link>
        <Link
          href="/galerie?filtre=moi"
          className={tabClass(mine)}
          aria-current={mine ? "page" : undefined}
        >
          Les miennes
        </Link>
      </div>

      {photos.items.length === 0 ? (
        <p className="mt-10 px-8 text-center text-[13px] font-normal leading-relaxed text-ink-soft">
          {mine ? (
            <>
              Vous n&apos;avez pas encore envoyé de photo.
              <br />
              Choisissez un défi et lancez-vous.
            </>
          ) : (
            <>
              L&apos;album est encore vide.
              <br />
              La première photo de la soirée vous attend.
            </>
          )}
        </p>
      ) : (
        <>
          <ul className="grid flex-1 grid-cols-2 content-start gap-2.5 px-5 pb-3 pt-3.5">
            {photos.items.map((photo) => (
              <li
                key={photo.id}
                className="relative aspect-3/4 overflow-hidden rounded-[14px] border border-hairline bg-eau"
              >
                {/*
                  `unoptimized` : sharp a déjà produit ces miniatures à la bonne
                  taille au moment de l'envoi. Les repasser par l'optimiseur de
                  Next ferait retravailler le VPS pour rien, à chaque affichage.
                */}
                <Image
                  src={mediaUrl(photo.thumbPath)}
                  alt={`${photo.challengeTitle}, par ${displayFirstName(photo.authorFirstName)}`}
                  fill
                  unoptimized
                  sizes="(max-width: 448px) 50vw, 224px"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-[rgba(14,43,42,.85)] to-transparent px-2.5 pb-2.5 pt-6 text-creme">
                  <p className="truncate text-[11px] font-bold leading-tight">
                    {displayFirstName(photo.authorFirstName)}
                  </p>
                  <p className="truncate text-[9.5px] font-normal opacity-90">
                    {photo.challengeTitle}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <Pagination
            page={photos.page}
            pageCount={photos.pageCount}
            hrefFor={hrefFor}
            className="px-5 pb-4"
          />
        </>
      )}
    </>
  );
}
