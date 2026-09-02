import path from "node:path";

/**
 * Racine du stockage persistant, volontairement hors du bundle Next.js :
 * les photos et la base survivent ainsi à un `next build` et à un redéploiement.
 *
 * En dev : <projet>/data. Sur le VPS : DATA_DIR=/var/lib/defi-photo.
 *
 * `turbopackIgnore` : ce chemin est résolu à l'exécution, à partir de
 * l'environnement du serveur. Il n'y a rien à tracer au build — c'est
 * précisément le but, ces fichiers ne doivent pas entrer dans le bundle.
 */
export const DATA_DIR = path.resolve(
  /* turbopackIgnore: true */ process.env.DATA_DIR ?? path.join(process.cwd(), "data"),
);

/** Photos originales compressées côté téléphone puis réécrites par sharp. */
export const PHOTOS_DIR = path.join(DATA_DIR, "photos");

/** Miniatures générées par sharp pour la galerie et le diaporama. */
export const THUMBS_DIR = path.join(DATA_DIR, "thumbs");

/** Fichier SQLite. */
export const DB_FILE = path.join(DATA_DIR, "app.db");

/** URL de connexion Prisma, toujours absolue pour éviter toute ambiguïté. */
export const DATABASE_URL = process.env.DATABASE_URL ?? `file:${DB_FILE}`;
