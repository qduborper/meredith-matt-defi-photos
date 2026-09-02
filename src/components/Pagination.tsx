import Link from "next/link";

/**
 * Pagination précédent/suivant.
 *
 * Volontairement pas de « voir plus » qui accumule : sur un réseau instable,
 * un lien classique se recharge et se partage, là où un chargement progressif
 * laisse l'invité devant une liste à moitié remplie sans moyen de la relancer.
 */
export function Pagination({
  page,
  pageCount,
  hrefFor,
  className = "",
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
  className?: string;
}) {
  if (pageCount <= 1) return null;

  const linkClass =
    "rounded-full border-[1.5px] border-eau bg-surface px-4 py-2 text-[12.5px] font-bold text-sapin";
  const disabledClass =
    "rounded-full border-[1.5px] border-eau/60 px-4 py-2 text-[12.5px] font-bold text-placeholder";

  return (
    <nav aria-label="Pages de la galerie" className={`flex items-center justify-center gap-3 ${className}`}>
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={linkClass}>
          Précédent
        </Link>
      ) : (
        <span aria-hidden="true" className={disabledClass}>
          Précédent
        </span>
      )}

      <span aria-current="page" className="text-[12.5px] font-semibold text-ink-soft">
        Page {page} / {pageCount}
      </span>

      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} rel="next" className={linkClass}>
          Suivant
        </Link>
      ) : (
        <span aria-hidden="true" className={disabledClass}>
          Suivant
        </span>
      )}
    </nav>
  );
}
