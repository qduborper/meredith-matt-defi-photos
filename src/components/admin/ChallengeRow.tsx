"use client";

import { useState, useTransition } from "react";

import {
  deleteChallenge,
  moveChallenge,
  toggleChallenge,
  updateChallenge,
} from "@/app/admin/actions";
import { POINTS } from "@/lib/constants";

export type AdminChallenge = {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  active: boolean;
  photoCount: number;
};

export function ChallengeRow({
  challenge,
  categories,
  isFirst,
  isLast,
}: {
  challenge: AdminChallenge;
  categories: string[];
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
              await updateChallenge(formData);
              setEditing(false);
            });
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <input type="hidden" name="id" value={challenge.id} />

          <label className="text-[12px] font-bold text-sapin sm:col-span-2">
            Titre
            <input
              name="title"
              defaultValue={challenge.title}
              required
              className="mt-1 w-full rounded-xl border-[1.5px] border-eau bg-surface px-3 py-2 text-[13px] font-normal text-ink"
            />
          </label>

          <label className="text-[12px] font-bold text-sapin sm:col-span-2">
            Description
            <textarea
              name="description"
              defaultValue={challenge.description}
              rows={2}
              className="mt-1 w-full rounded-xl border-[1.5px] border-eau bg-surface px-3 py-2 text-[13px] font-normal text-ink"
            />
          </label>

          <label className="text-[12px] font-bold text-sapin">
            Catégorie
            <input
              name="category"
              defaultValue={challenge.category}
              list="admin-categories"
              required
              className="mt-1 w-full rounded-xl border-[1.5px] border-eau bg-surface px-3 py-2 text-[13px] font-normal text-ink"
            />
          </label>

          <label className="text-[12px] font-bold text-sapin">
            Points
            <select
              name="points"
              defaultValue={challenge.points}
              className="mt-1 w-full rounded-xl border-[1.5px] border-eau bg-surface px-3 py-2 text-[13px] font-normal text-ink"
            >
              <option value={POINTS.FACILE}>{POINTS.FACILE} — facile</option>
              <option value={POINTS.INTERMEDIAIRE}>{POINTS.INTERMEDIAIRE} — intermédiaire</option>
              <option value={POINTS.CREATIF}>{POINTS.CREATIF} — créatif</option>
            </select>
          </label>

          <datalist id="admin-categories">
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
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl border-[1.5px] border-eau px-4 py-2 text-[13px] font-bold text-sapin"
            >
              Annuler
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-[#f0ead9] px-4 py-3.5 text-[12.5px] last:border-b-0">
      <span className="min-w-[180px] flex-1 font-bold text-ink">
        {challenge.title}
        {challenge.photoCount > 0 ? (
          <span className="ml-2 font-normal text-ink-soft">
            · {challenge.photoCount} photo{challenge.photoCount > 1 ? "s" : ""}
          </span>
        ) : null}
      </span>

      <span className="w-[150px] shrink-0">
        <span className="rounded-xl bg-eau px-2.5 py-0.5 text-[10.5px] font-bold text-sapin">
          {challenge.category}
        </span>
      </span>

      <span className="w-[46px] shrink-0 font-bold text-sauge">{challenge.points}</span>

      <span className="flex shrink-0 items-center gap-2.5">
        <button
          type="button"
          disabled={pending || isFirst}
          onClick={() => startTransition(() => moveChallenge(challenge.id, "up"))}
          aria-label={`Monter « ${challenge.title} »`}
          className="px-1 text-[15px] font-bold text-sauge disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          disabled={pending || isLast}
          onClick={() => startTransition(() => moveChallenge(challenge.id, "down"))}
          aria-label={`Descendre « ${challenge.title} »`}
          className="px-1 text-[15px] font-bold text-sauge disabled:opacity-30"
        >
          ↓
        </button>

        <button
          type="button"
          role="switch"
          aria-checked={challenge.active}
          aria-label={`${challenge.active ? "Désactiver" : "Activer"} « ${challenge.title} »`}
          disabled={pending}
          onClick={() => startTransition(() => toggleChallenge(challenge.id, !challenge.active))}
          className={`relative h-[22px] w-[38px] rounded-xl transition-colors ${
            challenge.active ? "bg-sapin" : "bg-[#cdd8d3]"
          }`}
        >
          <span
            className={`absolute top-0.5 size-[18px] rounded-full bg-white transition-[left] ${
              challenge.active ? "left-0.5" : "left-[18px]"
            }`}
          />
        </button>

        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[12px] font-bold text-sauge"
        >
          Modifier
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const warning =
              challenge.photoCount > 0
                ? `\n\nLes ${challenge.photoCount} photo(s) envoyées pour ce défi seront supprimées avec lui.`
                : "";
            if (
              window.confirm(`Supprimer définitivement « ${challenge.title} » ?${warning}`)
            ) {
              startTransition(() => deleteChallenge(challenge.id));
            }
          }}
          className="text-[12px] font-bold text-danger disabled:opacity-50"
        >
          Supprimer
        </button>
      </span>
    </li>
  );
}
