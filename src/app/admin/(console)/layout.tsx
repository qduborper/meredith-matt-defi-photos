import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/AdminNav";
import { isAdmin } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

/** Console du témoin. Toute la protection tient dans ce garde unique. */
export default async function AdminConsoleLayout({ children }: LayoutProps<"/admin">) {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AdminNav />
      <main className="min-w-0 flex-1 bg-[#faf8f0] px-5 py-6 md:px-7">{children}</main>
    </div>
  );
}
