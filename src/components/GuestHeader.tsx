import Image from "next/image";
import Link from "next/link";

/** En-tête des écrans internes : monogramme réduit + salutation. */
export function GuestHeader({ displayName, subtitle }: { displayName: string; subtitle: string }) {
  return (
    <header className="flex items-center gap-3 px-5 pt-2">
      <Link href="/?changer" aria-label="Modifier mon prénom" className="shrink-0">
        <Image
          src="/img/monogram.png"
          alt=""
          width={320}
          height={190}
          className="h-auto w-[58px]"
        />
      </Link>
      <div className="min-w-0">
        <p className="truncate font-title text-[24px] font-bold leading-none text-sapin">
          Bonjour {displayName}
        </p>
        <p className="mt-0.5 text-[11.5px] font-normal text-ink-soft">{subtitle}</p>
      </div>
    </header>
  );
}
