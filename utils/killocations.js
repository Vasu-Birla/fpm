// utils/killocations.js
import sequelize from '../config/sequelize.js';
import Location from '../models/Location.js';
import { Op } from 'sequelize';

/** Check if tbl_locations exists (MySQL) */
async function locationsTableExists() {
  const [rows] = await sequelize.query("SHOW TABLES LIKE 'tbl_locations'");
  return Array.isArray(rows) && rows.length > 0;
}

/** Build & assign app.locals.* */
function hydrateLocals(app, { countries = [], countryStates = {} }) {
  app.locals.countries = countries;
  app.locals.countryStates = countryStates;
  app.locals.states = countryStates['Jamaica'] || []; // your specific need
  app.locals.lastLocationCacheAt = new Date().toISOString();
}

/** Load countries + country→states[] (skip 'N/A'), sorted + deduped */
export async function loadLocationCache(app) {
  const hasTable = await locationsTableExists();

  if (!hasTable) {
    hydrateLocals(app, { countries: [], countryStates: {} });
    console.warn('⚠ Table tbl_locations does not exist — skipping location cache load.');
    return { countries: [], countryStates: {} };
  }

  // 1) countries (distinct + sorted)
  const countryRows = await Location.findAll({
    attributes: [[sequelize.fn('DISTINCT', sequelize.col('country')), 'country']],
    raw: true,
  });
  const countries = countryRows
    .map(r => (r.country || '').trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  // 2) states for all countries (skip 'N/A')
  
const stateRows = await Location.findAll({
  attributes: ['country', 'state'],
  where: {
    [Op.and]: [
      { state: { [Op.not]: null } },   // exclude NULL
      { state: { [Op.ne]: 'N/A' } }    // exclude "N/A"
    ]
  },
  raw: true,
});

  // 3) build country → states[] map, unique + sorted
  const countryStates = {};
  for (const c of countries) countryStates[c] = [];
  for (const { country, state } of stateRows) {
    if (!country || !state) continue;
    const c = country.trim();
    const s = state.trim();
    if (!c || !s) continue;
    (countryStates[c] ??= []).push(s);
  }
  for (const c of Object.keys(countryStates)) {
    countryStates[c] = [...new Set(countryStates[c])].sort((a, b) => a.localeCompare(b));
  }

  hydrateLocals(app, { countries, countryStates });
  return { countries, countryStates };
}








/** Optional: attach tiny API backed by the in-memory cache */
export function attachLocationApi(app) {
  app.get('/api/locations/countries', (_req, res) => {
    res.json({ countries: app.locals.countries || [] });
  });

  app.get('/api/locations/states', (req, res) => {
    const country = String(req.query.country || '').trim();
    const list = (app.locals.countryStates && app.locals.countryStates[country]) || [];
    res.json({ states: list });
  });
}

/** Optional: auto-refresh cache every N ms (e.g., after seeding jobs) */
// export function scheduleLocationCacheAutoRefresh(app, intervalMs = 10 * 60 * 1000) {
//   return setInterval(() => {
//     loadLocationCache(app).catch(err => console.error('location cache refresh failed:', err));
//   }, intervalMs);
// }

/** Optional: admin-only route to reload on demand */
export function attachManualReloadRoute(app, path = '/superadmin/reload-locations', guard = (_req, _res, next) => next()) {
  app.post(path, guard, async (_req, res) => {
    try {
      await loadLocationCache(app);
      res.json({ ok: true, reloadedAt: app.locals.lastLocationCacheAt });
    } catch (e) {
      console.error(e);
      res.status(500).json({ ok: false, error: 'reload failed' });
    }
  });
}
