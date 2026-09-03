"use client";

import { useId, useState } from "react";

const NEW = "__nouvelle__";

/**
 * Choix de la catégorie d'un défi.
 *
 * Liste native plutôt que `datalist` : ce dernier filtre ses suggestions sur
 * ce que contient déjà le champ, si bien qu'un défi existant n'en proposait
 * qu'une — la sienne. Un `select` montre toujours tout.
 *
 * La dernière option ouvre un champ libre, pour créer une catégorie sans
 * quitter le formulaire.
 */
export function CategoryField({
  categories,
  defaultValue,
  name = "category",
}: {
  categories: string[];
  defaultValue?: string;
  name?: string;
}) {
  const selectId = useId();
  const inputId = useId();

  // Une catégorie retirée entre-temps ne doit pas disparaître silencieusement
  // du formulaire : on la réinjecte dans la liste.
  const options =
    defaultValue && !categories.includes(defaultValue)
      ? [defaultValue, ...categories]
      : categories;

  const [choice, setChoice] = useState(defaultValue ?? options[0] ?? NEW);
  const creating = choice === NEW;

  return (
    <div>
      <label htmlFor={selectId} className="text-[12px] font-bold text-sapin">
        Catégorie
      </label>
      <select
        id={selectId}
        // Le champ transmis au serveur est le `input` caché quand on crée une
        // catégorie ; sinon c'est ce select qui porte le nom attendu.
        name={creating ? undefined : name}
        value={choice}
        onChange={(event) => setChoice(event.target.value)}
        className="mt-1 w-full rounded-xl border-[1.5px] border-eau bg-surface px-3 py-2 text-[13px] font-normal text-ink"
      >
        {options.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
        <option value={NEW}>＋ Nouvelle catégorie…</option>
      </select>

      {creating ? (
        <>
          <label htmlFor={inputId} className="sr-only">
            Nom de la nouvelle catégorie
          </label>
          <input
            id={inputId}
            name={name}
            required
            autoFocus
            placeholder="Nom de la nouvelle catégorie"
            className="mt-2 w-full rounded-xl border-[1.5px] border-sauge bg-surface px-3 py-2 text-[13px] font-normal text-ink"
          />
        </>
      ) : null}
    </div>
  );
}
