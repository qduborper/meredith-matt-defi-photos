"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/defis",
    label: "Défis",
    path: "M3 9 12 2l9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  },
  {
    href: "/galerie",
    label: "Galerie",
    path: "M3 3h18v18H3zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm12.5 5-5-5L5 21",
  },
  {
    href: "/classement",
    label: "Classement",
    path: "M8 21h8M12 17v4M6 4h12v5a6 6 0 0 1-12 0z",
  },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="sticky bottom-0 z-10 flex h-[54px] shrink-0 border-t border-hairline bg-surface"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 flex-col items-center justify-center gap-[3px] text-[10px] font-semibold ${
              active ? "text-sapin" : "text-placeholder"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-[19px]"
              aria-hidden="true"
            >
              <path d={tab.path} />
            </svg>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
