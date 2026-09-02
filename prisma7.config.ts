import "dotenv/config";
import { defineConfig } from "prisma/config";
import { DATABASE_URL } from "./src/lib/paths";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Chemin absolu vers <DATA_DIR>/app.db — même logique que le runtime.
    url: DATABASE_URL,
  },
});
