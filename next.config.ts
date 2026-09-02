import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Modules natifs : ils doivent rester en require() côté serveur et ne jamais
  // passer par le bundler.
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3", "sharp"],

  // Pas de sortie `standalone` : le build tourne directement sur le VPS.
  // La sortie autonome n'embarque ni la CLI Prisma (migrations) ni `tsx`
  // (script de purge), et ses modules natifs — better-sqlite3, sharp — sont
  // compilés pour l'architecture de la machine de build. Construire sur place
  // évite ces trois pièges d'un coup.

  // Garde-fou : le traçage des fichiers suit `path.join(process.cwd(), "data")`
  // et voudrait embarquer le dossier de données — base SQLite et photos des
  // invités comprises. C'est exactement ce que DATA_DIR doit éviter.
  outputFileTracingExcludes: {
    "/*": ["data/**/*"],
  },

  experimental: {
    serverActions: {
      // Les photos arrivent par une route API dédiée, pas par Server Action ;
      // cette limite couvre les formulaires admin (image d'exemple d'un défi).
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
