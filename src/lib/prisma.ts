import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import fs from "node:fs";

import { PrismaClient } from "@/generated/prisma/client";
import { DATA_DIR, DB_FILE } from "./paths";

function createClient() {
  // Le dossier de données vit hors du bundle : il peut ne pas exister au
  // premier démarrage sur un VPS fraîchement provisionné.
  fs.mkdirSync(DATA_DIR, { recursive: true });

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
