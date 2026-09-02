"use client";

import { useRef, useState, useTransition } from "react";

import { createChallenge } from "@/app/admin/actions";
import { POINTS } from "@/lib/constants";

/** Ajout d'un défi, utilisable en pleine soirée (cahier des charges §6). */
export function NewChallengeForm({ categories }: { categories: string[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-3.5 inline-flex items-center gap-2 rounded-xl bg-taupe px-4 py-2.5 text-[13px] font-bold text-sapin"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          className="size-[15px]"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Ajouter un défi
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          await createChallenge(formData);
          formRef.current?.reset();
          setOpen(false);
        });
      }}
      className="mb-4 grid gap-3 rounded-[16px] border border-hairline bg-surface p-4 sm:grid-cols-2"
    >
      <label className="text-[12px] font-bold text-sapin sm:col-span-2">
        Titre
        <input
          name="title"
          required
          autoFocus
          placeholder="Ex. Une photo avec le chien des mariés"
          className="mt-1 w-full rounded-xl border-[1.5px] border-eau px-3 py-2 text-[13px] font-normal text-ink"
        />
      </label>

      <label className="text-[12px] font-bold text-sapin sm:col-span-2">
        Description
        <textarea
          name="description"
          rows={2}
          placeholder="Une phrase pour donner envie."
          className="mt-1 w-full rounded-xl border-[1.5px] border-eau px-3 py-2 text-[13px] font-normal text-ink"
        />
      </label>

      <label className="text-[12px] font-bold text-sapin">
        Catégorie
        <input
          name="category"
          required
          list="new-challenge-categories"
          defaultValue={categories[0] ?? ""}
          className="mt-1 w-full rounded-xl border-[1.5px] border-eau px-3 py-2 text-[13px] font-normal text-ink"
        />
      </label>

      <label className="text-[12px] font-bold text-sapin">
        Points
        <select
          name="points"
          defaultValue={POINTS.INTERMEDIAIRE}
          className="mt-1 w-full rounded-xl border-[1.5px] border-eau px-3 py-2 text-[13px] font-normal text-ink"
        >
          <option value={POINTS.FACILE}>{POINTS.FACILE} — facile</option>
          <option value={POINTS.INTERMEDIAIRE}>{POINTS.INTERMEDIAIRE} — intermédiaire</option>
          <option value={POINTS.CREATIF}>{POINTS.CREATIF} — créatif</option>
        </select>
      </label>

      <datalist id="new-challenge-categories">
        {categories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>

      <div className="flex gap-2 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-sapin px-4 py-2 text-[13px] font-bold text-creme disabled:opacity-50"
        >
          {pending ? "Ajout…" : "Ajouter"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border-[1.5px] border-eau px-4 py-2 text-[13px] font-bold text-sapin"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
