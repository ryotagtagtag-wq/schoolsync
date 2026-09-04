import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import postgres from 'postgres';

/**
 * Durable, idempotent drizzle migration runner for Neon (production `neondb`).
 *
 * WHY THIS EXISTS
 *   The app's migration scripts used @neondatabase/serverless `neon()` (HTTP
 *   driver). We confirmed empirically that the `neon()` driver does NOT persist
 *   DDL — CREATE TABLE reports success but is never committed to durable Neon
 *   storage, so `run-migration2.ts` printed "✓ Executed" while leaving the DB
 *   unchanged. Only a real TCP connection (postgres.js) persists DDL reliably.
 *
 * WHAT THIS DOES
 *   - Connects over real TCP to the DIRECT Neon endpoint (SCRIPTS_DIRECT_URL /
 *     DIRECT_URL, falling back to DATABASE_URL). DDL must target the direct
 *     endpoint so it persists and is visible to the pooler (what the app uses).
 *   - Applies EVERY migration in drizzle/meta/_journal.json in order.
 *   - Is idempotent: CREATE TYPE/CREATE TABLE get IF NOT EXISTS, and
 *     constraint/index statements tolerate "already exists", so running against
 *     a DB that already has some objects is safe and never clobbers data.
 *   - Records each applied migration in `__drizzle_migrations` (drizzle format:
 *     id serial, hash text, created_at bigint), so `drizzle-kit migrate` sees it
 *     as already applied and won't double-apply.
 */

const MIGRATIONS_DIR = new URL('../drizzle/', import.meta.url).pathname;
const POOLER_URL = process.env.DATABASE_URL!;
const DIRECT_URL = (process.env.DIRECT_URL || process.env.SCRIPTS_DIRECT_URL || POOLER_URL).replace('-pooler', '');

const ALREADY_EXISTS = /already exists|duplicate (key |)name|duplicate_object|duplicate_table|duplicate_type/;

function maskUrl(u: string): string {
  const m = u.match(/^(postgres(?:ql)?):\/\/([^:]+):[^@]*@([^/]+)(\/[^?]*)/);
  return m ? `${m[1]}://${m[2]}:***@${m[3]}${m[4]}` : '(masked)';
}

/**
 * Inject IF NOT EXISTS into CREATE TABLE so re-running against a DB that
 * already has the table is safe. CREATE TYPE is left untouched (Postgres has
 * no IF NOT EXISTS for types) — an already-existing type raises `duplicate_
 * object`, which the ALREADY_EXISTS catch below tolerates.
 */
function makeIdempotent(stmt: string): string {
  return stmt.replace(/^CREATE TABLE\s+("?[^ (]+?"?)/im, 'CREATE TABLE IF NOT EXISTS $1');
}

async function main() {
  const direct = postgres(DIRECT_URL, { ssl: 'require', max: 1 });
  console.log('connection:', maskUrl(DIRECT_URL), '(direct TCP)');

  // Ensure the drizzle migrations table exists (drizzle format).
  await direct`CREATE TABLE IF NOT EXISTS __drizzle_migrations (
    id serial PRIMARY KEY,
    hash text NOT NULL,
    created_at bigint
  )`;

  const journal = JSON.parse(readFileSync(`${MIGRATIONS_DIR}meta/_journal.json`, 'utf8'));
  const applied: string[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];

  for (const entry of journal.entries) {
    const tag = entry.tag;
    const rawSql = readFileSync(`${MIGRATIONS_DIR}${tag}.sql`, 'utf8');
    const splat = rawSql.split('--> statement-breakpoint');
    // ignore trailing empty chunk
    const statements = splat.map((s) => s.trim()).filter(Boolean);
    const hash = createHash('sha256').update(rawSql).digest('hex');
    const when = entry.when;

    // Skip if this migration (by created_at/hash) is already recorded.
    const existing = await direct`select id from __drizzle_migrations where hash = ${hash}`;
    if (existing.length > 0) {
      applied.push(`${tag} (already recorded)`);
      continue;
    }

    console.log(`\n== applying ${tag} (${statements.length} statements) ==`);
    for (const stmt of statements) {
      const idem = makeIdempotent(stmt);
      try {
        await direct.unsafe(idem);
        console.log('  ✓', summarize(stmt));
      } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : String(e);
        if (ALREADY_EXISTS.test(errMsg)) {
          skipped.push(`${tag}: ${summarize(stmt)}`);
          console.log('  ⊘ already exists:', summarize(stmt));
        } else {
          failed.push(`${tag}: ${summarize(stmt)}\\n   -> ${errMsg}`);
          console.error('  ✗', summarize(stmt));
          console.error('    ', errMsg);
          await direct.end();
          process.exitCode = 1;
          return;
        }
      }
    }

    // Record the migration once fully handled (nothing fatal).
    await direct`insert into __drizzle_migrations ("hash", "created_at") values (${hash}, ${when})`;
    applied.push(tag);
    console.log(`  recorded ${tag} in __drizzle_migrations`);
  }

  await direct.end();

  console.log('\n===== SUMMARY =====');
  console.log('applied:', applied.join(', ') || '(none)');
  console.log('skipped (already existed):', skipped.length);
  for (const s of skipped) console.log('   ⊘', s);
  if (failed.length) {
    console.log('FAILED:');
    for (const f of failed) console.log('   ✗', f);
  }
}

function summarize(stmt: string): string {
  const one = stmt.replace(/\s+/g, ' ').trim();
  return one.length > 70 ? one.slice(0, 67) + '...' : one;
}

main().catch((e: unknown) => {
  console.error('fatal:', e instanceof Error ? e.message : String(e));
  process.exit(1);
});
