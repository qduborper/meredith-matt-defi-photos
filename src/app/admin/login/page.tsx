import Image from "next/image";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/LoginForm";
import { isAdmin } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAdmin()) {
    redirect("/admin");
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-10">
      <Image
        src="/img/monogram.png"
        alt=""
        width={320}
        height={190}
        className="mx-auto h-auto w-[120px]"
      />
      <h1 className="mt-6 text-center font-title text-[32px] font-bold text-sapin">
        Console du témoin
      </h1>
      <p className="mt-1 text-center text-[12.5px] font-normal text-ink-soft">
        Réservée aux mariés et à leurs témoins.
      </p>

      <LoginForm />
    </main>
  );
}
