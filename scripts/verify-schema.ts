import postgres from 'postgres';

/**
 * Verify the Neon production schema after applying the drizzle migration.
 * Reads the full table list + row counts + __drizzle_migrations journal over
 * BOTH the pooler (what the app uses) and the direct endpoint, and reports any
 * table from the migration that is missing.
 */

const EXPECTED = [
  'achievements', 'assignments', 'facilities', 'group_members', 'groups',
  'guild_quest_progress', 'guild_quests', 'notifications', 'user_achievements',
  'user_facilities', 'user_profiles', 'user_stats', 'users',
];

const POOLER_URL = process.env.DATABASE_URL!;
const DIRECT_URL = (process.env.DIRECT_URL || process.env.SCRIPTS_DIRECT_URL || POOLER_URL).replace('-pooler', '');

async function check(label: string, url: string): Promise<void> {
  const sql = postgres(url, { ssl: 'require', max: 1 });
  try {
    const rows = await sql`select tablename from pg_tables where schemaname = 'public' order by tablename`;
    const names = rows.map((r) => r.tablename);
    const missing = EXPECTED.filter((t) => !names.includes(t));
    const extra = names.filter((n) => !EXPECTED.includes(n));

    const counts: Record<string, number> = {};
    for (const t of EXPECTED) {
      const c = await sql`select count(*)::int as n from ${sql(t)}`;
      counts[t] = c[0].n;
    }

    const mig = await sql`select id, hash, created_at from __drizzle_migrations order by id`;

    console.log(`
[${label}]`);
    console.log('migration tables missing:', missing.length ? missing.join(', ') : '(none — all 13 present)');
    console.log('extra tables (scratch/probes):', extra.length ? extra.join(', ') : '(none)');
    console.log('row counts:', JSON.stringify(counts));
    console.log('__drizzle_migrations:', mig.length, mig.map((m) => `#${m.id} created_at=${m.created_at}`).join(', '));
  } catch (e: unknown) {
    console.log(`
[${label}] ERROR:`, e instanceof Error ? e.message : String(e));
  } finally {
    await sql.end();
  }
}

async function main(): Promise<void> {
  await check('POOLER (app)   ', POOLER_URL);
  await check('DIRECT (migrate)', DIRECT_URL);
}

main().catch((e: unknown) => {
  console.error('fatal:', e instanceof Error ? e.message : String(e));
  process.exit(1);
});
