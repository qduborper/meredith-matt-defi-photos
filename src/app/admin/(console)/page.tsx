import { getDashboardStats } from "@/lib/admin-stats";

export const dynamic = "force-dynamic";

function StatCard({ value, suffix, label }: { value: string; suffix?: string; label: string }) {
  return (
    <div className="rounded-[16px] border border-hairline bg-surface p-4">
      <p className="text-[28px] font-bold leading-none text-sapin">
        {value}
        {suffix ? <span className="text-[14px] font-semibold text-sauge">{suffix}</span> : null}
      </p>
      <p className="mt-1.5 text-[12px] font-semibold text-ink-soft">{label}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();
  const maxCount = Math.max(1, ...stats.topChallenges.map((challenge) => challenge.count));

  return (
    <>
      <h1 className="font-title text-[28px] font-bold leading-none text-sapin">Tableau de bord</h1>
      <p className="mb-5 mt-0.5 text-[12.5px] font-normal text-ink-soft">
        Vue d&apos;ensemble de la soirée, en direct.
      </p>

      <div className="mb-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard value={String(stats.photos)} label="photos visibles" />
        <StatCard
          value={String(stats.participants)}
          suffix={` / ${stats.guests}`}
          label="invités participants"
        />
        <StatCard
          value={stats.averageChallengesPerParticipant.toLocaleString("fr-FR")}
          label="défis relevés en moyenne"
        />
        <StatCard value={String(stats.hidden)} label="photos masquées" />
      </div>

      <section className="mb-4 rounded-[16px] border border-hairline bg-surface p-4.5">
        <h2 className="mb-3.5 text-[14px] font-bold text-sapin">Défis les plus réalisés</h2>
        {stats.topChallenges.length === 0 ? (
          <p className="text-[12.5px] font-normal text-ink-soft">Aucune photo pour l&apos;instant.</p>
        ) : (
          <ul>
            {stats.topChallenges.map((challenge) => (
              <li key={challenge.title} className="my-2 flex items-center gap-3 text-[12.5px]">
                <span className="w-[190px] shrink-0 truncate font-semibold text-ink">
                  {challenge.title}
                </span>
                <span className="h-3 flex-1 overflow-hidden rounded-lg bg-eau">
                  <span
                    className="block h-full rounded-lg bg-sapin"
                    style={{ width: `${Math.round((challenge.count / maxCount) * 100)}%` }}
                  />
                </span>
                <span className="w-[34px] shrink-0 text-right font-bold text-sauge">
                  {challenge.count}
                </span>
              </li>
            ))}
          </ul>
        )}

        {stats.quietChallenges.length > 0 ? (
          <p className="mt-4 border-t border-hairline pt-3 text-[12px] font-normal text-ink-soft">
            Les moins relevés :{" "}
            {stats.quietChallenges
              .map((challenge) => `${challenge.title} (${challenge.count})`)
              .join(" · ")}
          </p>
        ) : null}

        {/*
          Téléchargement direct plutôt que Server Action : le ZIP est un flux
          de plusieurs centaines de Mo, il doit partir en streaming.
        */}
        <a
          href="/api/admin/export"
          download
          className="mt-4 inline-flex items-center gap-2.5 rounded-[13px] bg-sapin px-4.5 py-3 text-[13.5px] font-bold text-creme"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-[17px]"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Télécharger toutes les photos (ZIP)
        </a>
      </section>
    </>
  );
}
