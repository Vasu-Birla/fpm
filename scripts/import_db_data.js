// scripts/import_db_data.js  (ESM)
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import sequelize from '../config/sequelize.js';
import '../models/index.js';
import { Op } from 'sequelize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgList(v) {
  if (!v) return null;
  return String(v)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function getPkField(model) {
  const pk = (model.primaryKeyAttributes && model.primaryKeyAttributes[0]) || null;
  if (pk) return pk;
  const attrs = Object.keys(model.rawAttributes || {});
  return attrs[0] || 'id';
}

function normalizeRow(model, row) {
  const attrs = model.rawAttributes || {};
  const out = {};
  for (const [field, meta] of Object.entries(attrs)) {
    let v = row[field];
    if (typeof v === 'undefined') continue;
    if (meta.type && meta.type.key === 'VIRTUAL') continue;

    const allowNull = meta.allowNull === true;

    // Dates
    if (meta.type && (meta.type.key === 'DATE' || meta.type.key === 'DATEONLY')) {
      if (v == null || v === '') v = allowNull ? null : new Date();
      else {
        const d = new Date(v);
        v = isNaN(d.getTime()) ? (allowNull ? null : new Date()) : d;
      }
    }

    // Booleans
    if (meta.type && meta.type.key === 'BOOLEAN') {
      if (typeof v === 'string') v = ['1', 'true', 'yes', 'y'].includes(v.trim().toLowerCase());
      else if (typeof v === 'number') v = v === 1;
      else v = !!v;
    }

    // Numbers
    if (meta.type && ['INTEGER', 'BIGINT', 'FLOAT', 'DOUBLE', 'DECIMAL', 'REAL'].includes(meta.type.key)) {
      if (v == null || v === '') v = allowNull ? null : 0;
      else if (typeof v === 'string') {
        const n = Number(v);
        v = Number.isNaN(n) ? (allowNull ? null : 0) : n;
      }
    }

    // JSON
    if (meta.type && (meta.type.key === 'JSON' || meta.type.key === 'JSONB')) {
      if (typeof v === 'string') {
        try { v = JSON.parse(v); } catch { /* keep as is */ }
      }
    }

    // ENUM
    if (meta.type && meta.type.key === 'ENUM') {
      const allowed = meta.type.values || [];
      if (v == null) {
        if (!allowNull && typeof meta.defaultValue !== 'undefined') {
          v = typeof meta.defaultValue === 'function' ? meta.defaultValue() : meta.defaultValue;
        }
      } else if (!allowed.includes(v)) {
        if (typeof meta.defaultValue !== 'undefined') {
          v = typeof meta.defaultValue === 'function' ? meta.defaultValue() : meta.defaultValue;
        } else {
          continue; // drop invalid enum; let DB defaults handle
        }
      }
    }

    // Strings/Text: stringify objects to avoid [object Object]
    if (meta.type && (meta.type.key === 'TEXT' || meta.type.key === 'STRING')) {
      if (typeof v === 'object' && v !== null) v = JSON.stringify(v);
    }

    // Default fallback if still null for non-null fields
    if (v == null && !allowNull && typeof meta.defaultValue !== 'undefined') {
      v = (typeof meta.defaultValue === 'function') ? meta.defaultValue() : meta.defaultValue;
    }

    out[field] = v;
  }
  return out;
}

async function safeBulkInsert(model, rows, { pageSize = 5000 } = {}) {
  if (!rows || !rows.length) return { inserted: 0, skipped: 0 };
  // normalize
  const normalized = rows.map(r => normalizeRow(model, r));

  // try bulkCreate
  try {
    let inserted = 0;
    for (let i = 0; i < normalized.length; i += pageSize) {
      const slice = normalized.slice(i, i + pageSize);
      await model.bulkCreate(slice, {
        ignoreDuplicates: true,
        hooks: false,
        validate: false,
        returning: false,
      });
      inserted += slice.length;
    }
    return { inserted, skipped: 0 };
  } catch (e) {
    console.warn(`⚠️ bulkCreate failed for ${model.name}: ${e.message}. Falling back to row-by-row...`);
  }

  // fallback per-row
  let inserted = 0, skipped = 0;
  for (const row of normalized) {
    try {
      await model.create(row, { hooks: false, validate: false });
      inserted++;
    } catch (err) {
      skipped++;
      console.warn(`   ↳ Skipped one row (${model.name}): ${err.message}`);
    }
  }
  return { inserted, skipped };
}

async function truncateTables(models) {
  for (const name of models) {
    const model = sequelize.models[name];
    if (!model) continue;
    console.log(`🧹 Truncating ${name} ...`);
    await model.truncate({ cascade: true });
  }
}

function topoSortModels(names) {
  // Try to put likely parent tables first by scanning FK references in attributes
  // If not detectable, return alphabetical as safe default (FK checks are disabled anyway).
  const graph = new Map(names.map(n => [n, new Set()]));
  for (const n of names) {
    const model = sequelize.models[n];
    for (const [field, meta] of Object.entries(model.rawAttributes || {})) {
      const ref = meta.references && meta.references.model;
      if (!ref) continue;
      const refName = typeof ref === 'string' ? ref : ref?.tableName || ref?.name;
      if (refName && names.includes(refName) && refName !== n) {
        graph.get(n).add(refName); // n depends on refName
      }
    }
  }
  const visited = new Set();
  const order = [];
  function dfs(node, stack = new Set()) {
    if (visited.has(node)) return;
    if (stack.has(node)) return; // cycle; ignore because FK checks off
    stack.add(node);
    for (const dep of graph.get(node) || []) dfs(dep, stack);
    stack.delete(node);
    visited.add(node);
    order.push(node);
  }
  for (const n of names) dfs(n);
  // order currently parents first -> good
  return order;
}

async function importDb({
  jsonPath = path.resolve(process.cwd(), 'config', 'db_seed.json'),
  includeTables = null,
  excludeTables = null,
  truncate = false,
  pageSize = 5000,
  allowProd = false,
} = {}) {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production' && !allowProd) {
    throw new Error('Refusing to import in production without --yes or IMPORT_ALLOW_PROD=1');
  }

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Seed file not found: ${jsonPath}`);
  }
  const payload = JSON.parse(await fsp.readFile(jsonPath, 'utf-8'));

  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  console.log('✅ Tables synced.');

  // collect model names present both in seed and in sequelize
  let names = Object.keys(payload).filter(n => sequelize.models[n]).sort();

  if (includeTables && includeTables.length) {
    const set = new Set(includeTables);
    names = names.filter(n => set.has(n));
  }
  if (excludeTables && excludeTables.length) {
    const set = new Set(excludeTables);
    names = names.filter(n => !set.has(n));
  }

  // optional truncate first
  if (truncate) {
    // do reverse topo for safer child->parent truncation
    const truncOrder = topoSortModels(names).reverse();
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    try {
      await truncateTables(truncOrder);
    } finally {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    }
  }

  const order = topoSortModels(names);
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0'); // MySQL
  try {
    for (const name of order) {
      const rows = payload[name] || [];
      if (!rows.length) {
        console.log(`ℹ️ ${name}: no rows`);
        continue;
      }
      console.log(`📥 ${name}: inserting ${rows.length} row(s) ...`);
      const { inserted, skipped } = await safeBulkInsert(sequelize.models[name], rows, { pageSize });
      console.log(`✅ ${name}: inserted=${inserted}, skipped=${skipped}`);
    }
  } finally {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  await sequelize.close().catch(() => {});
  console.log('🎉 Import complete.');
  return { tables: order };
}

// CLI support
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = Object.fromEntries(
    process.argv.slice(2).map(a => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? ''];
    })
  );

  const includeTables = parseArgList(args.tables);
  const excludeTables = parseArgList(args.exclude);
  const truncate = 'truncate' in args; // presence of flag
  const allowProd = args.yes === '' || args.yes === 'true' || process.env.IMPORT_ALLOW_PROD === '1';

  importDb({
    jsonPath: args.file || undefined,
    includeTables,
    excludeTables,
    truncate,
    pageSize: args.page ? Number(args.page) || 5000 : 5000,
    allowProd,
  })
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Import failed:', err);
      process.exit(1);
    });
}

export default importDb;
