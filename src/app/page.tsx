import Image from "next/image";
import { redirect } from "next/navigation";

import { WelcomeForm } from "@/components/WelcomeForm";
import { WaterLine } from "@/components/WaterLine";
import { getCurrentGuest } from "@/lib/session";
import { displayFirstName } from "@/lib/validation";

// L'accueil dépend du cookie de l'invité : jamais de mise en cache.
export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ changer?: string }>;
}) {
  const guest = await getCurrentGuest();
  const { changer } = await searchParams;

  // Invité déjà identifié : on l'envoie directement à ses défis, sauf s'il
  // revient volontairement corriger son prénom.
  if (guest && changer === undefined) {
    redirect("/defis");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-6 pt-2">
      {/*
        Le logo est détouré : sa marge blanche d'origine a disparu avec le fond.
        On la restitue en marges CSS (≈43 px de chaque côté à cette échelle),
        sinon le titre vient coller la date — et la charte §11.1 demande une
        marge de respiration autour du logo.
      */}
      <Image
        src="/img/logo.png"
        alt="Mérédith & Matthieu — Aix-les-Bains, 5 septembre 2026"
        width={839}
        height={675}
        priority
        className="mx-auto mt-8 h-auto w-[210px]"
      />

      <h1 className="mt-11 text-center font-title text-[29px] font-bold leading-[1.05] text-sapin">
        La chasse aux souvenirs commence
      </h1>
      <p className="mt-2.5 text-center text-[13px] font-normal leading-[1.5] text-ink-soft">
        Relevez les défis photo de la soirée avec votre téléphone. Chaque cliché nourrit notre album
        commun.
      </p>

      <WaterLine className="mt-5 opacity-70" />

      <WelcomeForm knownFirstName={guest ? displayFirstName(guest.firstName) : null} />
    </main>
  );
}
