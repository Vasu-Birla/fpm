import mysql from "mysql2/promise";
import crypto from "node:crypto";

// ===================== DB CONFIG =====================
// ✅ Put creds in env in real usage
// 🔐 DB config (your values)
const dbConfig = {
  host: '82.112.238.22',
  user: 'root',
  password: 'Kil@123456',
  database: '',
};
 
const SCHEMA = dbConfig.database;

// ===================== CLI =====================
const mode = (process.argv[2] || "").toLowerCase(); // apply | remove
const argv = process.argv.slice(3);

const DRY = argv.includes("--dry");
const CHECK_ORPHANS = argv.includes("--check-orphans");

// behavior flags
const STRICT = argv.includes("--strict");            // if set -> exit(1) when any FK fails
const ALLOW_SELF = argv.includes("--allow-self");    // default: skip self FK
const ALLOW_PK_COLS = argv.includes("--allow-pk");   // default: skip table PK cols

// ===================== SETTINGS =====================
const FK_PREFIX = "fk_key_";      // used for remove-mode filtering
const IDX_PREFIX = "idx_key_";    // index name we create on child table

const DEFAULT_ON_DELETE = (getArg("--on-delete") || "RESTRICT").toUpperCase();
const DEFAULT_ON_UPDATE = (getArg("--on-update") || "CASCADE").toUpperCase();

const SKIP_COLS = new Set([
  "created_by",
  "updated_by",
  "deleted_by",
  "added_by",
  "modified_by",
]);

function getArg(name) {
  const i = argv.indexOf(name);
  if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--")) return argv[i + 1];
  return null;
}

function normType(t) {
  return String(t || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function pluralizeGuess(base) {
  if (!base) return [];
  if (base.endsWith("y")) return [base, base.slice(0, -1) + "ies", base + "s"];
  if (base.endsWith("s")) return [base, base + "es"];
  return [base, base + "s", base + "es"];
}

function safeName(name, max = 64) {
  let n = String(name).replace(/[^a-zA-Z0-9_]/g, "_");
  if (n.length <= max) return n;

  const hash = crypto.createHash("sha1").update(n).digest("hex").slice(0, 10);
  n = n.slice(0, max - 11) + "_" + hash;
  return n;
}

function fkName(childTable, childCol, parentTable) {
  return safeName(`${FK_PREFIX}${childTable}_${childCol}_${parentTable}`);
}

function idxName(childCol) {
  return safeName(`${IDX_PREFIX}${childCol}`);
}

// ===================== INTROSPECTION =====================
async function fetchTables(conn) {
  const [rows] = await conn.query(
    `SELECT TABLE_NAME, ENGINE
       FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
        AND TABLE_TYPE='BASE TABLE'`,
    [SCHEMA]
  );
  return rows;
}

async function fetchColumns(conn) {
  const [rows] = await conn.query(
    `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?`,
    [SCHEMA]
  );
  return rows;
}

async function fetchExistingFKCols(conn) {
  const [rows] = await conn.query(
    `SELECT TABLE_NAME, COLUMN_NAME
       FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL`,
    [SCHEMA]
  );
  return new Set(rows.map(r => `${r.TABLE_NAME}.${r.COLUMN_NAME}`));
}

async function fetchPrimaryKeyCols(conn) {
  const [rows] = await conn.query(
    `SELECT TABLE_NAME, COLUMN_NAME
       FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ?
        AND CONSTRAINT_NAME = 'PRIMARY'`,
    [SCHEMA]
  );

  const map = new Map(); // table -> Set(cols)
  for (const r of rows) {
    if (!map.has(r.TABLE_NAME)) map.set(r.TABLE_NAME, new Set());
    map.get(r.TABLE_NAME).add(r.COLUMN_NAME);
  }
  return map;
}

async function hasIndexOnColumn(conn, table, col) {
  const [rows] = await conn.query(`SHOW INDEX FROM \`${table}\``);
  return rows.some(r => r.Column_name === col);
}

/**
 * Important: MySQL FK needs an index in parent where referenced col is the LEFTMOST column.
 * This avoids the "Missing index for constraint" trap.
 */
async function hasLeftmostIndex(conn, table, col) {
  const [rows] = await conn.query(`SHOW INDEX FROM \`${table}\``);
  return rows.some(r =>
    r.Column_name === col && Number(r.Seq_in_index) === 1
  );
}

async function countOrphans(conn, childTable, childCol, parentTable, parentCol) {
  const sql = `
    SELECT COUNT(*) AS c
      FROM \`${childTable}\` c
      LEFT JOIN \`${parentTable}\` p
        ON c.\`${childCol}\` = p.\`${parentCol}\`
     WHERE c.\`${childCol}\` IS NOT NULL
       AND p.\`${parentCol}\` IS NULL
  `;
  const [rows] = await conn.query(sql);
  return Number(rows?.[0]?.c || 0);
}

// ===================== APPLY MODE =====================
async function applyFKs(conn) {
  console.log(`Schema: ${SCHEMA}`);
  console.log(`Mode: APPLY   ${DRY ? "(DRY-RUN)" : "(EXECUTE)"}`);
  console.log(`Orphan check: ${CHECK_ORPHANS ? "ON" : "OFF"}`);
  console.log(`Skip self-FK : ${ALLOW_SELF ? "OFF" : "ON"}`);
  console.log(`Skip PK cols : ${ALLOW_PK_COLS ? "OFF" : "ON"}`);
  console.log("");

  const tables = await fetchTables(conn);
  const columns = await fetchColumns(conn);
  const existingFKCols = await fetchExistingFKCols(conn);
  const pkColsByTable = await fetchPrimaryKeyCols(conn);

  const tableNames = new Set(tables.map(t => t.TABLE_NAME));
  const tableEngine = new Map(tables.map(t => [t.TABLE_NAME, String(t.ENGINE || "")]));

  const colsByTable = new Map();
  const typeByTableCol = new Map();

  for (const c of columns) {
    if (!colsByTable.has(c.TABLE_NAME)) colsByTable.set(c.TABLE_NAME, []);
    colsByTable.get(c.TABLE_NAME).push(c);
    typeByTableCol.set(`${c.TABLE_NAME}.${c.COLUMN_NAME}`, c.COLUMN_TYPE);
  }

  let proposed = 0, applied = 0, skipped = 0, failed = 0;

  for (const childTable of tableNames) {
    if (String(tableEngine.get(childTable)).toLowerCase() !== "innodb") continue;

    const cols = colsByTable.get(childTable) || [];
    const pkSet = pkColsByTable.get(childTable) || new Set();

    for (const c of cols) {
      const childCol = c.COLUMN_NAME;

      if (!childCol.endsWith("_id")) continue;
      if (SKIP_COLS.has(childCol)) continue;
      if (existingFKCols.has(`${childTable}.${childCol}`)) continue;

      // ✅ Skip if this column is the table's PK (prevents blog.blog_id -> blog.blog_id)
      if (!ALLOW_PK_COLS && pkSet.has(childCol)) { skipped++; continue; }

      const base = childCol.slice(0, -3);

      const guesses = [
        ...pluralizeGuess(base),
        `tbl_${base}`,
        ...pluralizeGuess(`tbl_${base}`),
      ].filter(Boolean);

      const parentTable = guesses.find(g => tableNames.has(g));
      if (!parentTable) { skipped++; continue; }

      const parentCols = new Set((colsByTable.get(parentTable) || []).map(x => x.COLUMN_NAME));
      let parentCol = null;

      if (parentCols.has(childCol)) parentCol = childCol;
      else if (parentCols.has("id")) parentCol = "id";
      else if (parentCols.has(`${base}_id`)) parentCol = `${base}_id`;

      if (!parentCol) { skipped++; continue; }

      // ✅ Skip self-FK unless explicitly allowed
      if (!ALLOW_SELF && childTable === parentTable && childCol === parentCol) {
        skipped++;
        continue;
      }

      const childType = normType(typeByTableCol.get(`${childTable}.${childCol}`));
      const parentType = normType(typeByTableCol.get(`${parentTable}.${parentCol}`));
      if (!childType || !parentType || childType !== parentType) { skipped++; continue; }

      // Orphan check (optional)
      if (CHECK_ORPHANS) {
        const orphans = await countOrphans(conn, childTable, childCol, parentTable, parentCol);
        if (orphans > 0) {
          console.log(`SKIP (orphans=${orphans}): ${childTable}.${childCol} -> ${parentTable}.${parentCol}`);
          skipped++;
          continue;
        }
      }

      // Ensure child index exists
      const childHasIndex = await hasIndexOnColumn(conn, childTable, childCol);
      const addChildIndexSQL = childHasIndex
        ? null
        : `ALTER TABLE \`${childTable}\` ADD INDEX \`${idxName(childCol)}\` (\`${childCol}\`);`;

      // ✅ Ensure parent has an acceptable index (leftmost) to avoid "Missing index..."
      // (We only *propose* it; you said you’ll handle manually. But if you want auto-add, keep it enabled.)
      const parentHasLeftmost = await hasLeftmostIndex(conn, parentTable, parentCol);
      const addParentIndexSQL = parentHasLeftmost
        ? null
        : `ALTER TABLE \`${parentTable}\` ADD INDEX \`${idxName(parentCol)}\` (\`${parentCol}\`);`;

      const name = fkName(childTable, childCol, parentTable);
      const addFkSQL = `
        ALTER TABLE \`${childTable}\`
        ADD CONSTRAINT \`${name}\`
        FOREIGN KEY (\`${childCol}\`)
        REFERENCES \`${parentTable}\`(\`${parentCol}\`)
        ON DELETE ${DEFAULT_ON_DELETE}
        ON UPDATE ${DEFAULT_ON_UPDATE};
      `.trim();

      proposed++;
      console.log(`\nPROPOSE: ${childTable}.${childCol} -> ${parentTable}.${parentCol}`);
      if (addParentIndexSQL) console.log("  SQL:", addParentIndexSQL);
      if (addChildIndexSQL) console.log("  SQL:", addChildIndexSQL);
      console.log("  SQL:", addFkSQL);

      if (DRY) continue;

      // ✅ CRITICAL: never stop whole run; log and continue
      try {
        if (addParentIndexSQL) await conn.query(addParentIndexSQL);
        if (addChildIndexSQL) await conn.query(addChildIndexSQL);
        await conn.query(addFkSQL);

        applied++;
        console.log("  ✅ Applied");
      } catch (e) {
        failed++;
        console.log(`  ❌ Failed: ${e?.message || e}`);

        // continue no matter what, unless --strict
        if (STRICT) throw e;
      }
    }
  }

  console.log("\n==== SUMMARY ====");
  console.log("Proposed:", proposed);
  console.log("Applied :", applied);
  console.log("Failed  :", failed);
  console.log("Skipped :", skipped);

  // If not strict, we exit clean even with failures (your requirement)
  if (!STRICT && failed > 0) {
    console.log("\nNote: failures were logged, but script continued (non-strict mode).");
  }
}

// ===================== REMOVE MODE =====================
async function removeFKs(conn) {
  console.log(`Schema: ${SCHEMA}`);
  console.log(`Mode: REMOVE  ${DRY ? "(DRY-RUN)" : "(EXECUTE)"}`);
  console.log("");

  const [rows] = await conn.query(
    `SELECT rc.CONSTRAINT_NAME, rc.TABLE_NAME
       FROM information_schema.REFERENTIAL_CONSTRAINTS rc
      WHERE rc.CONSTRAINT_SCHEMA = ?
        AND rc.CONSTRAINT_NAME LIKE ?`,
    [SCHEMA, `${FK_PREFIX}%`]
  );

  if (!rows.length) {
    console.log("No FKs found to remove.");
    return;
  }

  let dropped = 0, failed = 0;

  for (const r of rows) {
    const constraint = r.CONSTRAINT_NAME;
    const table = r.TABLE_NAME;

    const sql = `ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${constraint}\`;`;
    console.log("SQL:", sql);

    if (DRY) continue;

    try {
      await conn.query(sql);
      dropped++;
    } catch (e) {
      failed++;
      console.log(`❌ Failed dropping ${table}.${constraint}: ${e?.message || e}`);
      if (STRICT) throw e;
    }
  }

  console.log("\n==== SUMMARY ====");
  console.log("Found  :", rows.length);
  console.log("Dropped:", dropped);
  console.log("Failed :", failed);
  console.log("Note   : indexes created by script are NOT dropped automatically (safe default).");
}

// ===================== MAIN =====================
async function main() {
  if (!["apply", "remove"].includes(mode)) {
    console.log("Usage:");
    console.log("  node _add_fks.js apply   [--dry] [--check-orphans] [--on-delete CASCADE|RESTRICT|SET NULL] [--on-update CASCADE|RESTRICT]");
    console.log("                     [--strict] [--allow-self] [--allow-pk]");
    console.log("  node _add_fks.js remove  [--dry] [--strict]");
    process.exit(1);
  }

  if (!SCHEMA) {
    console.error("❌ DB_NAME/database is empty. Set dbConfig.database or DB_NAME env var.");
    process.exit(1);
  }

  const conn = await mysql.createConnection(dbConfig);
  try {
    if (mode === "apply") await applyFKs(conn);
    else await removeFKs(conn);
  } finally {
    await conn.end().catch(() => {});
  }
}

main().catch(err => {
  console.error("❌ Fatal:", err?.message || err);
  process.exit(1);
});
