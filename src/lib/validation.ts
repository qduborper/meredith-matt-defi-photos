export const FIRST_NAME_MAX = 24;

/**
 * Caractères de contrôle ASCII + DEL, qui casseraient l'affichage projeté.
 * Construit via `RegExp` : le motif reste lisible en toutes lettres dans le
 * source, plutôt que des octets invisibles collés dans un littéral.
 */
const CONTROL_CHARS = new RegExp("[\\u0000-\\u001F\\u007F]", "g");

/**
 * Nettoie un prénom saisi librement.
 *
 * On reste volontairement permissif (accents, traits d'union, apostrophes,
 * espaces composés) : le prénom est décoratif, il finit projeté sur un écran.
 * On coupe seulement ce qui casserait l'affichage — sauts de ligne et autres
 * caractères de contrôle — et on borne la longueur.
 */
export function cleanFirstName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;

  const cleaned = raw
    .replace(CONTROL_CHARS, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, FIRST_NAME_MAX);

  if (cleaned.length < 1) return null;
  // Au moins une lettre : évite les prénoms « ... » ou « 123 ».
  if (!/\p{L}/u.test(cleaned)) return null;

  return cleaned;
}

/** Met une majuscule initiale sans écraser les prénoms composés (Jean-Luc, Léa). */
export function displayFirstName(name: string): string {
  // Traitement mot à mot, séparateurs conservés (espace, trait d'union, apostrophe).
  return name.replace(/\p{L}[\p{L}\p{M}]*/gu, (word) => {
    // « MARIE » projeté en grand sur un écran, ça crie : on rabaisse la casse
    // des mots entièrement capitalisés. Les casses mixtes (McLéa) sont
    // respectées telles quelles.
    const base =
      word.length > 1 && word === word.toLocaleUpperCase("fr") ? word.toLocaleLowerCase("fr") : word;

    return base[0].toLocaleUpperCase("fr") + base.slice(1);
  });
}

/** Initiales pour les pastilles du classement. */
export function initials(name: string): string {
  const parts = name.split(/[\s'’-]+/u).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("fr") ?? "")
    .join("");
}
