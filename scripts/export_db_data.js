// scripts/export_db_data.js  (ESM)
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import sequelize from '../config/sequelize.js';

import { Op, fn, col, where, literal } from 'sequelize';
import '../models/index.js'; // ensure all models are registered

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
  // prefer first PK, else first attribute
  const pk = (model.primaryKeyAttributes && model.primaryKeyAttributes[0]) || null;
  if (pk) return pk;
  const attrs = Object.keys(model.rawAttributes || {});
  return attrs[0] || 'id';
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}


// replace your current pager() with this

async function* pager(model, where = {}, pageSize = 5000) {
  const pk = getPkField(model);
  let last = null;

  // Is keyset pagination safe? (single PK and comparable type)
  const attr = model.rawAttributes?.[pk];
  const typeKey = attr?.type?.key;
  const comparable = ['INTEGER', 'BIGINT', 'DATE', 'DATEONLY', 'STRING'].includes(typeKey);

  if (pk && comparable) {
    // Keyset pagination
    while (true) {
      const cond = last != null ? { [pk]: { [Op.gt]: last } } : {};
      const rows = await model.findAll({
        where: { ...where, ...cond },
        order: [[pk, 'ASC']],
        limit: pageSize,
        raw: true,
      });
      if (!rows.length) break;
      yield rows;
      last = rows[rows.length - 1][pk];
    }
    return;
  }

  // Fallback: offset pagination
  let offset = 0;
  while (true) {
    const rows = await model.findAll({ where, offset, limit: pageSize, raw: true, order: pk ? [[pk, 'ASC']] : undefined });
    if (!rows.length) break;
    yield rows;
    offset += rows.length;
  }
}


async function exportDb({
  outDir = path.resolve(process.cwd(), 'config'),
  filename = 'db_seed.json',
  includeTables = null,   // array of names to include
  excludeTables = null,   // array of names to exclude
  pageSize = 5000,
} = {}) {
  await sequelize.authenticate();

  const allModels = sequelize.models || {};
  let names = Object.keys(allModels).sort();

  if (includeTables && includeTables.length) {
    const set = new Set(includeTables);
    names = names.filter(n => set.has(n));
  }
  if (excludeTables && excludeTables.length) {
    const set = new Set(excludeTables);
    names = names.filter(n => !set.has(n));
  }

  const out = {};
  for (const name of names) {
    const model = allModels[name];
    console.log(`📤 Exporting ${name} ...`);
    out[name] = [];
    for await (const rows of pager(model, {}, pageSize)) {
      out[name].push(...rows);
      process.stdout.write(`   ↳ ${out[name].length} rows\r`);
    }
    process.stdout.write('\n');
  }

  await ensureDir(outDir);
  const target = path.join(outDir, filename);
  const timestamped = path.join(
    outDir,
    `${path.parse(filename).name}.${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  );

  const json = JSON.stringify(out, null, 2);
  await fsp.writeFile(target, json, 'utf-8');
  //await fsp.writeFile(timestamped, json, 'utf-8');  // export file with Timestamped 

  console.log(`✅ Export complete:
  - ${target} `);
  await sequelize.close().catch(() => {});
  return { target, timestamped, tables: names };
}

// CLI support
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = Object.fromEntries(
    process.argv.slice(2).map(a => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? ''];
    })
  );
  exportDb({
    outDir: args.out || undefined,
    filename: args.name || undefined,
    includeTables: parseArgList(args.tables),
    excludeTables: parseArgList(args.exclude),
    pageSize: args.page ? Number(args.page) || 5000 : 5000,
  })
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Export failed:', err);
      process.exit(1);
    });
}

export default exportDb;
