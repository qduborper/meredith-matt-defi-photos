"use client";

import { useState, useTransition } from "react";

import { moveCategory, renameCategory } from "@/app/admin/actions";

export type AdminCategory = {
  name: string;
  challenges: number;
  activeChallenges: number;
  photos: number;
};

export function CategoryRow({
  category,
  others,
  isFirst,
  isLast,
}: {
  category: AdminCategory;
  others: string[];
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <li className="border-b border-[#f0ead9] p-4 last:border-b-0">
        <form
          action={(formData) => {
            startTransition(async () => {
              await renameCategory(formData);
              setEditing(false);
            });
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="from" value={category.name} />

          <label className="flex-1 text-[12px] font-bold text-sapin">
            Nouveau nom
            <input
              name="to"
              defaultValue={category.name}
              required
              autoFocus
              className="mt-1 w-full rounded-xl border-[1.5px] border-eau bg-surface px-3 py-2 text-[13px] font-normal text-ink"
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-sapin px-4 py-2 text-[13px] font-bold text-creme disabled:opacity-50"
          >
            Renommer
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-xl border-[1.5px] border-eau px-4 py-2 text-[13px] font-bold text-sapin"
          >
            Annuler
          </button>

          {others.length > 0 ? (
            <p className="w-full text-[11.5px] font-normal text-ink-soft">
              Reprendre un nom existant ({others.join(", ")}) fusionne les deux catégories.
            </p>
          ) : null}
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-[#f0ead9] px-4 py-3.5 text-[12.5px] last:border-b-0">
      <span className="min-w-[160px] flex-1 font-bold text-ink">{category.name}</span>

      <span className="w-[120px] shrink-0 text-ink-soft">
        {category.challenges} défi{category.challenges > 1 ? "s" : ""}
        {category.activeChallenges < category.challenges
          ? ` (${category.activeChallenges} actif${category.activeChallenges > 1 ? "s" : ""})`
          : ""}
      </span>

      <span className="w-[80px] shrink-0 font-bold text-sauge">
        {category.photos} photo{category.photos > 1 ? "s" : ""}
      </span>

      <span className="flex shrink-0 items-center gap-2.5">
        <button
          type="button"
          disabled={pending || isFirst}
          onClick={() => startTransition(() => moveCategory(category.name, "up"))}
          aria-label={`Monter la catégorie « ${category.name} »`}
          className="px-1 text-[15px] font-bold text-sauge disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          disabled={pending || isLast}
          onClick={() => startTransition(() => moveCategory(category.name, "down"))}
          aria-label={`Descendre la catégorie « ${category.name} »`}
          className="px-1 text-[15px] font-bold text-sauge disabled:opacity-30"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[12px] font-bold text-sauge"
        >
          Renommer
        </button>
      </span>
    </li>
  );
}
