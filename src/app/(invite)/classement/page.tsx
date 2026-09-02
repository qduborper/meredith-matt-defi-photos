import { redirect } from "next/navigation";

import { getLeaderboard } from "@/lib/scoring";
import { getCurrentGuest } from "@/lib/session";
import { displayFirstName, initials } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Hauteur et couleur de marche pour les trois premières places. */
const PODIUM_STYLE = [
  { stand: "h-[74px] bg-sapin text-creme", medal: "size-[60px] bg-taupe text-sapin text-[20px]" },
  { stand: "h-[56px] bg-sauge text-creme", medal: "size-[52px] bg-sauge text-white text-[18px]" },
  { stand: "h-[42px] bg-eau text-sapin", medal: "size-[52px] bg-eau text-sapin text-[18px]" },
];

export default async function LeaderboardPage() {
  const guest = await getCurrentGuest();
  if (!guest) redirect("/");

  const board = await getLeaderboard();
  // Seuls les invités ayant envoyé au moins une photo apparaissent : afficher
  // une centaine de zéros n'apprendrait rien à personne.
  const ranked = board.filter((row) => row.photos > 0);

  // Ordre visuel du podium : 2e, 1er, 3e, comme dans la maquette.
  const podium = [ranked[1], ranked[0], ranked[2]];
  const rest = ranked.slice(3);
  const me = ranked.find((row) => row.guestId === guest.id);

  return (
    <>
      <header className="px-6 pb-0.5 pt-2 text-center">
        <h1 className="font-title text-[30px] font-bold text-sapin">Classement</h1>
        <p className="mt-0.5 text-[12px] font-normal text-ink-soft">
          Les photographes les plus en forme de la soirée
        </p>
      </header>

      {ranked.length === 0 ? (
        <p className="mt-12 px-8 text-center text-[13px] font-normal leading-relaxed text-ink-soft">
          Personne n&apos;a encore envoyé de photo.
          <br />À vous d&apos;ouvrir le bal.
        </p>
      ) : (
        <>
          <ol className="flex items-end justify-center gap-2.5 px-6 pb-1 pt-5">
            {podium.map((row, index) => {
              // index 0 = 2e place, 1 = 1re, 2 = 3e.
              const position = [2, 1, 3][index];
              const style = PODIUM_STYLE[position - 1];
              if (!row) return <li key={position} className="w-[74px]" aria-hidden="true" />;

              return (
                <li
                  key={row.guestId}
                  value={position}
                  className="flex w-[74px] flex-col items-center gap-[7px]"
                >
                  <span
                    aria-hidden="true"
                    className={`flex items-center justify-center rounded-full border-[3px] border-taupe font-bold ${style.medal}`}
                  >
                    {initials(row.firstName)}
                  </span>
                  <span className="text-center text-[11.5px] font-bold text-ink">
                    {displayFirstName(row.firstName)}
                  </span>
                  <span className="text-[10.5px] font-normal text-ink-soft">{row.points} pts</span>
                  <span
                    aria-hidden="true"
                    className={`flex w-full justify-center rounded-t-[14px] pt-2 font-title text-[22px] font-bold ${style.stand}`}
                  >
                    {position}
                  </span>
                </li>
              );
            })}
          </ol>

          <ol className="flex-1 px-5 pb-2.5 pt-3.5">
            {rest.map((row) => {
              const isMe = row.guestId === guest.id;
              return (
                <li
                  key={row.guestId}
                  className={`mb-2 flex items-center gap-3 rounded-[14px] border px-3 py-2.5 ${
                    isMe
                      ? "border-sapin bg-sapin text-creme"
                      : "border-hairline bg-surface text-ink"
                  }`}
                >
                  <span
                    className={`w-[22px] text-center text-[13px] font-bold ${
                      isMe ? "text-taupe" : "text-sauge"
                    }`}
                  >
                    {row.rank}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex size-[30px] items-center justify-center rounded-full text-[12px] font-bold ${
                      isMe ? "bg-taupe text-sapin" : "bg-eau text-sapin"
                    }`}
                  >
                    {initials(row.firstName)}
                  </span>
                  <span className="flex-1 truncate text-[13px] font-semibold">
                    {isMe
                      ? `Vous (${displayFirstName(row.firstName)})`
                      : displayFirstName(row.firstName)}
                  </span>
                  <span className="text-[12.5px] font-bold">{row.points} pts</span>
                </li>
              );
            })}
          </ol>

          {/* L'invité doit toujours voir sa place, même s'il n'a pas encore joué. */}
          {!me ? (
            <p className="px-6 pb-4 text-center text-[12px] font-normal text-ink-soft">
              Vous n&apos;êtes pas encore au classement : relevez un défi pour y entrer.
            </p>
          ) : null}
        </>
      )}
    </>
  );
}
