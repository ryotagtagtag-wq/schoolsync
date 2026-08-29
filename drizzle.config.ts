import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Migrations must run over the raw (direct) TCP endpoint for DDL to
    // persist on Neon. `DIRECT_URL` falls back to `DATABASE_URL` (pooler)
    // when unset so ad-hoc `drizzle-kit` reads still work.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL!,
  },
});
