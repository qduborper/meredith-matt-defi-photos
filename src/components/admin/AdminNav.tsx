"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { logout } from "@/app/admin/actions";

const LINKS = [
  {
    href: "/admin",
    label: "Tableau de bord",
    path: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
  },
  {
    href: "/admin/galerie",
    label: "Galerie & modération",
    path: "M3 3h18v18H3zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm12.5 5-5-5L5 21",
  },
  {
    href: "/admin/defis",
    label: "Défis",
    path: "M9 11l3 3 8-8M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9",
  },
  {
    href: "/admin/categories",
    label: "Catégories",
    path: "M4 5h16M4 12h16M4 19h16M2 5h.01M2 12h.01M2 19h.01",
  },
  {
    href: "/admin/invites",
    label: "Invités",
    // La tête est tracée en arc : le composant ne rend qu'un seul <path>.
    path: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sections de la console"
      className="flex shrink-0 flex-col gap-1 bg-sapin p-3 text-creme md:w-[210px] md:p-4"
    >
      <div className="flex items-center gap-2.5 px-2 pb-3 pt-1">
        {/*
          Le monogramme est un dessin sombre (montagnes sapin) : posé tel quel
          sur le bandeau sapin, il disparaît. Une pastille crème lui rend le
          fond clair pour lequel il a été dessiné, sans le recolorer.
        */}
        <span className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-creme">
          <Image
            src="/img/monogram.png"
            alt=""
            width={320}
            height={190}
            className="h-auto w-[34px]"
          />
        </span>
        <span className="font-title text-[16px] font-bold leading-none">
          Défi Photo
          <br />
          Admin
        </span>
      </div>

      <ul className="flex flex-wrap gap-1 md:flex-col">
        {LINKS.map((link) => {
          const active =
            link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <li key={link.href} className="min-w-0 flex-1 md:flex-none">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-[11px] px-3 py-2.5 text-[13.5px] font-semibold ${
                  active ? "bg-creme text-sapin" : "text-[#cfe0dc] hover:bg-white/10"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-[17px] shrink-0"
                  aria-hidden="true"
                >
                  <path d={link.path} />
                </svg>
                <span className="truncate">{link.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <form action={logout} className="mt-auto pt-4">
        <button
          type="submit"
          className="w-full rounded-[11px] border border-white/25 px-3 py-2 text-[12px] font-semibold text-[#cfe0dc] hover:bg-white/10"
        >
          Se déconnecter
        </button>
      </form>
    </nav>
  );
}
