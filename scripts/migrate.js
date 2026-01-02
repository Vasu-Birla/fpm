// scripts/migrate.js
// Usage:
//   node scripts/migrate.js up
//   node scripts/migrate.js down 20251103-add-admin-timestamps.js
//
// Notes:
// - ESM-friendly dynamic imports
// - Simple, safe, and idempotent
// - Stores applied migrations in `tbl_migrations`

import fs from 'node:fs';
import path from 'node:path';
import url, { pathToFileURL } from 'node:url';
import sequelize from '../config/sequelize.js'; // your Sequelize instance

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

async function ensureMetaTable() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS tbl_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      run_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

async function getAppliedSet() {
  const [rows] = await sequelize.query(`SELECT filename FROM tbl_migrations`);
  return new Set(rows.map(r => r.filename));
}

function listMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.js'))
    .sort(); // apply in filename order
}



export async function runStatus() {
  await ensureMetaTable();
  const applied = await getAppliedSet();
  const files = listMigrationFiles();

  const appliedList = files.filter(f => applied.has(f));
  const pendingList = files.filter(f => !applied.has(f));

  console.log('--- Migration Status ---');
  console.log(`Applied (${appliedList.length}):`);
  appliedList.forEach(f => console.log(`  ✓ ${f}`));

  console.log(`\nPending (${pendingList.length}):`);
  pendingList.forEach(f => console.log(`  • ${f}`));

  // Exit non-zero if anything pending — useful in CI gates (optional)
  // process.exit(pendingList.length ? 2 : 0);
}



export async function runUpAll() {
  await ensureMetaTable();
  const applied = await getAppliedSet();
  const files = listMigrationFiles();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`SKIP: ${file} (already applied)`);
      continue;
    }

    const full = path.join(MIGRATIONS_DIR, file);
    console.log(`APPLY: ${file}`);

    // Transaction recommended for safety; if migration contains multiple statements
    const tx = await sequelize.transaction();
    try {
      const mod = await import(url.pathToFileURL(full).href);
      if (!mod?.default?.up || typeof mod.default.up !== 'function') {
        throw new Error(`Migration ${file} has no export default.up()`);
      }

      await mod.default.up({ sequelize });

      // Record success
      await sequelize.query(
        `INSERT INTO tbl_migrations (filename, run_at) VALUES (?, NOW())`,
        { replacements: [file], transaction: tx }
      );

      await tx.commit();
      console.log(`DONE:  ${file}`);
    } catch (err) {
      await tx.rollback();
      console.error(`FAIL:  ${file}`);
      console.error(err);
      process.exit(1);
    }
  }

  console.log('All pending migrations applied.');
}


export async function runDownOne(targetFile) {
  if (!targetFile) {
    console.error('Usage: node scripts/migrate.js down <filename.js>');
    process.exit(1);
  }

  await ensureMetaTable();
  const applied = await getAppliedSet();

  if (!applied.has(targetFile)) {
    console.log(`Migration not marked as applied: ${targetFile}`);
    return;
  }

  const full = path.join(MIGRATIONS_DIR, targetFile);
  if (!fs.existsSync(full)) {
    console.error(`Migration file not found: ${targetFile}`);
    process.exit(1);
  }

  console.log(`ROLLBACK: ${targetFile}`);
  const tx = await sequelize.transaction();
  try {
    const mod = await import(url.pathToFileURL(full).href);
    if (!mod?.default?.down || typeof mod.default.down !== 'function') {
      throw new Error(`Migration ${targetFile} has no export default.down()`);
    }

    await mod.default.down({ sequelize });

    // Remove record
    await sequelize.query(
      `DELETE FROM tbl_migrations WHERE filename = ?`,
      { replacements: [targetFile], transaction: tx }
    );

    await tx.commit();
    console.log(`REVERTED: ${targetFile}`);
  } catch (err) {
    await tx.rollback();
    console.error(`FAILED TO REVERT: ${targetFile}`);
    console.error(err);
    process.exit(1);
  }
}


const cmd = process.argv[2] || 'up';
// if (cmd === 'up') {
//   runUpAll().then(() => process.exit(0));
// } else if (cmd === 'down') {
//   runDownOne(process.argv[3]).then(() => process.exit(0));
// } else if (cmd === 'status') {
//   runStatus().then(() => process.exit(0));
// } else {
//   console.log('Usage:');
//   console.log('  node scripts/migrate.js up');
//   console.log('  node scripts/migrate.js down <filename.js>');
//   console.log('  node scripts/migrate.js status');
//   process.exit(0);
// }


// ---- CLI entry: ONLY when this file is the entrypoint ----
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cmd = process.argv[2];     // <-- NO default!
  (async () => {
    if (cmd === 'up')         await runUpAll();
    else if (cmd === 'down')  await runDownOne(process.argv[3]);
    else if (cmd === 'status')await runStatus();
    else {
      console.log('Usage:\n  node scripts/migrate.js up\n  node scripts/migrate.js down <file>\n  node scripts/migrate.js status');
    }
    process.exit(0);
  })().catch(e => { console.error(e); process.exit(1); });
}