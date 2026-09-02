import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import fs from "node:fs";

import { PrismaClient } from "@/generated/prisma/client";
import { DATA_DIR, DB_FILE } from "./paths";

/**
 * Vérifie que le dossier de données est utilisable, et explique quoi faire
 * sinon.
 *
 * Sans ce contrôle, un dossier appartenant à root donne un laconique
 * `SQLITE_CANTOPEN: unable to open database file`, qui ne dit ni quel dossier
 * ni pourquoi. C'est la panne la plus probable d'une première installation sur
 * un VPS, où le dépôt est souvent cloné en sudo.
 */
function ensureDataDir() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (error) {
    throw new Error(
      `Impossible de créer le dossier de données ${DATA_DIR}.\n` +
        `  sudo mkdir -p ${DATA_DIR} && sudo chown -R "$USER" ${DATA_DIR}\n` +
        `Cause : ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  try {
    fs.accessSync(DATA_DIR, fs.constants.W_OK | fs.constants.X_OK);
  } catch {
    throw new Error(
      `Le dossier de données ${DATA_DIR} n'est pas accessible en écriture par l'utilisateur courant.\n` +
        `  sudo chown -R "$USER" ${DATA_DIR}`,
    );
  }
}

function createClient() {
  ensureDataDir();

  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: `file:${DB_FILE}` }),
  });
}

// En dev, Next recharge les modules à chaque édition : sans ce cache global on
// ouvrirait une nouvelle connexion SQLite à chaque HMR.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
