import { redirect } from "next/navigation";

import { TabBar } from "@/components/TabBar";
import { getCurrentGuest } from "@/lib/session";

// Tous les écrans invité dépendent du cookie : rendu à la demande.
export const dynamic = "force-dynamic";

/**
 * Espace invité. L'identification est vérifiée ici une fois pour toutes :
 * sans cookie valide, retour à l'accueil.
 */
export default async function GuestLayout({ children }: LayoutProps<"/">) {
  const guest = await getCurrentGuest();
  if (!guest) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <div className="flex flex-1 flex-col overflow-x-hidden">{children}</div>
      <TabBar />
    </div>
  );
}
