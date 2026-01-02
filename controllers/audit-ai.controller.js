// controllers/audit-ai.controller.js
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import readline from 'readline';
import crypto from 'crypto';
import moment from 'moment-timezone';

 

import { ClientAccount, Admin, AuditLog} from "../models/index.js";


import { flashSet ,flashPop } from '../utils/flash.js';


import { Op, col ,Sequelize } from 'sequelize';

const APP_TZ   = process.env.APP_TIMEZONE || 'Asia/Kolkata';
const LOG_DIR  = path.join(process.cwd(), 'secure-logs');
const SECRET   = process.env.AUDIT_HMAC_SECRET || '';

function dayBounds(dateYMD, tz=APP_TZ){
  const start = moment.tz(dateYMD, tz).startOf('day');
  const end   = start.clone().endOf('day');
  return { start: start.toDate(), end: end.toDate() };
}

function expandActorTypeFilter(actorType){
  const t = String(actorType || '').trim();
  if (!t || t === 'all') return null;

  const low = t.toLowerCase();
  const values = new Set([t, low]);

  // Backwards compatible UI labels / casing variations
  if (low === 'business customer' || low === 'business client') {
    values.add('Business Client');
    values.add('business client');
    values.add('Business Customer');
    values.add('business customer');
  }
  if (low === 'individual customer' || low === 'individual client') {
    values.add('Individual Client');
    values.add('individual client');
    values.add('Individual Customer');
    values.add('individual customer');
  }

  return [...values].filter(Boolean);
}

function resolveRange({ rangeKey, startYMD, endYMD } = {}){
  const key = String(rangeKey || 'last7').trim().toLowerCase();
  const now = moment().tz(APP_TZ);

  const isYMD = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));

  let start;
  let end;

  if (key === 'today') {
    start = now.clone().startOf('day');
    end = now.clone().endOf('day');
  } else if (key === 'yesterday') {
    start = now.clone().subtract(1, 'day').startOf('day');
    end = now.clone().subtract(1, 'day').endOf('day');
  } else if (key === 'last30') {
    start = now.clone().subtract(29, 'day').startOf('day');
    end = now.clone().endOf('day');
  } else if (key === 'last6m') {
    start = now.clone().subtract(6, 'month').startOf('day');
    end = now.clone().endOf('day');
  } else if (key === 'custom') {
    if (!isYMD(startYMD) || !isYMD(endYMD)) throw new Error('Bad date range');
    start = moment.tz(startYMD, 'YYYY-MM-DD', APP_TZ).startOf('day');
    end = moment.tz(endYMD, 'YYYY-MM-DD', APP_TZ).endOf('day');
  } else {
    // default last 7 days (inclusive)
    start = now.clone().subtract(6, 'day').startOf('day');
    end = now.clone().endOf('day');
  }

  const resolvedStartYMD = (key === 'custom') ? startYMD : start.format('YYYY-MM-DD');
  const resolvedEndYMD = (key === 'custom') ? endYMD : end.format('YYYY-MM-DD');
  if (moment(resolvedStartYMD).isAfter(moment(resolvedEndYMD))) throw new Error('Bad date range');

  const label = (resolvedStartYMD === resolvedEndYMD)
    ? resolvedStartYMD
    : `${resolvedStartYMD} to ${resolvedEndYMD}`;

  return {
    rangeKey: key,
    start,
    end,
    startYMD: resolvedStartYMD,
    endYMD: resolvedEndYMD,
    label
  };
}

function computeSig(payload){
  if (!SECRET) return undefined;
  const h = crypto.createHmac('sha256', SECRET);
  h.update(payload);
  return h.digest('hex');
}

/**
 * Build a validation map for a given yyyy-mm-dd:
 * event_id -> 'VALID' | 'UNSIGNED' | 'INVALID'
 */
async function buildDailyValidationMap(dateYMD){
  const map = new Map();
  const file = path.join(LOG_DIR, `audit-${dateYMD}.jsonl`);
  if (!fs.existsSync(file)) return map; // nothing → map stays empty

  const rl = readline.createInterface({
    input: fs.createReadStream(file, {encoding:'utf8'}),
    crlfDelay: Infinity
  });

  for await (const raw of rl){
    const line = raw.replace(/\r?\n$/, '');
    if (!line.trim()) continue;

    const idx = line.lastIndexOf('\tSIG=');
    const hasSig = idx !== -1;
    const payload = hasSig ? line.slice(0, idx) : line;
    const sig = hasSig ? line.slice(idx + 5) : undefined;

    // Try parse payload to grab event_id
    let eventId = null;
    try {
      const obj = JSON.parse(payload);
      eventId = obj?.event_id || null;
    } catch(_) { /* ignore */ }

    if (!eventId) continue;

    if (!SECRET || !hasSig || !sig){
      map.set(eventId, 'UNSIGNED');
      continue;
    }
    const expected = computeSig(payload);
    const ok = String(sig).toLowerCase() === String(expected).toLowerCase();
    map.set(eventId, ok ? 'VALID' : 'INVALID');
  }
  return map;
}

function toActorLabel(row, adminMap, clientMap){
  const t = String(row.actor_type || '').toLowerCase();
  if (t === 'superadmin' || t === 'subadmin'){
    const a = adminMap[row.actor_id];
    return a ? `${a.admin_type} (${a.first_name || a.username || a.admin_id})` : `Admin #${row.actor_id ?? ''}`;
  }
  if (t === 'client' || t === 'business client' || t === 'individual client' || t === 'business customer' || t === 'individual customer'){
    const c = clientMap[row.actor_id];
    return c ? `Client (${c.first_name || c.last_name || c.client_account_id})` : 'Client';
  }
  if (t === 'guest') return 'Guest';
  if (t === 'admin') return `Admin #${row.actor_id ?? ''}`;
  return `${row.actor_type} #${row.actor_id ?? ''}`;
}

const ADMIN_TYPES = ['superadmin','subadmin','admin']; // stored exactly like your ENUM
const CUSTOMER_TYPES = [
  'client',
  'Business Client', 'Individual Client',
  'business client', 'individual client',
  'Business Customer', 'Individual Customer',
  'business customer', 'individual customer'
];





/* ===>>  helper—find Admin/Client IDs that fuzzy match a name/email/username/contact */
async function findMatchingActorIds(q) {
  const like = { [Op.like]: `%${q}%` };

  // Search Admins by first_name, last_name, username, email
  const admins = await Admin.findAll({
    where: {
      [Op.or]: [
        { first_name: like },
        { last_name: like },
        { username: like },
        { email: like }
      ]
    },
    attributes: ['admin_id','first_name','last_name','username','email'],
    raw: true,
    limit: 1000
  });

  // Search Clients by first_name of client, business_name, first_name, last_name, email, contact/full_contact
  const clients = await ClientAccount.findAll({
    where: {
      [Op.or]: [
        { first_name: like },
        { business_name: like },
        { first_name: like },
        { last_name: like },
        { email: like },
        { contact: like },
        { full_contact: like }
      ]
    },
    attributes: ['client_account_id','first_name','last_name','email','contact','full_contact'],
    raw: true,
    limit: 1000
  });

  const adminIds = admins.map(a => a.admin_id);
  const clientIds = clients.map(c => c.client_account_id);

  return { adminIds, clientIds };
}



/* ===>>  REPLACED fetchLogs to add actor-name matching */
async function fetchLogs({ rangeKey, startYMD, endYMD, actorType, severity, q }) {
  const range = resolveRange({ rangeKey, startYMD, endYMD });

  const where = { timestamp: { [Op.between]: [range.start.toDate(), range.end.toDate()] } };

  const actorTypeValues = expandActorTypeFilter(actorType);
  if (actorTypeValues?.length === 1) where.actor_type = actorTypeValues[0];
  else if (actorTypeValues?.length) where.actor_type = { [Op.in]: actorTypeValues };

  if (severity && severity !== 'all') where.severity = severity;

  const orParts = [];

  // Text search (existing)
  if (q && q.trim()){
    const needle = q.trim();
    const like = { [Op.like]: `%${needle}%` };
    orParts.push(
      { action: like },
      { url: like },
      { description: like },
      { result: like },
      { event_id: like },
      { req_id: like },
      { ip: like },
    );

    // ===>> New: actor-name search (if query length >= 2 to prevent wild scans)
    if (needle.length >= 2) {
      const { adminIds, clientIds } = await findMatchingActorIds(needle);

      if (adminIds.length) {
        orParts.push({
          [Op.and]: [
            { actor_id: { [Op.in]: adminIds } },
            { actor_type: { [Op.in]: ADMIN_TYPES } }
          ]
        });
      }
      if (clientIds.length) {
        orParts.push({
          [Op.and]: [
            { actor_id: { [Op.in]: clientIds } },
            { actor_type: { [Op.in]: CUSTOMER_TYPES } }
          ]
        });
      }
    }
  }

  if (orParts.length) where[Op.or] = orParts;

  let rows = await AuditLog.findAll({ where, order: [['timestamp','DESC']], limit: 500, raw: true });

  // Fallback: if Date-range filtering returns nothing, try DB-side DATE(timestamp) matching.
  if (!rows.length) {
    const where2 = { ...where };
    delete where2.timestamp;
    where2[Op.and] = [
      Sequelize.where(
        Sequelize.fn('DATE', col('timestamp')),
        { [Op.between]: [range.startYMD, range.endYMD] }
      )
    ];
    rows = await AuditLog.findAll({ where: where2, order: [['timestamp','DESC']], limit: 500, raw: true });
  }

  // actor labels (same as before)
  const adminIds = [...new Set(rows
    .filter(r => ADMIN_TYPES.includes(String(r.actor_type||'').toLowerCase()))
    .map(r => r.actor_id).filter(Boolean))];

  const custIds  = [...new Set(rows
    .filter(r => {
      const t = String(r.actor_type || '');
      const low = t.toLowerCase();
      return CUSTOMER_TYPES.includes(t) || CUSTOMER_TYPES.includes(low);
    })
    .map(r => r.actor_id).filter(Boolean))];

  const [admins, clients] = await Promise.all([
    adminIds.length ? Admin.findAll({ where:{ admin_id: { [Op.in]: adminIds } }, attributes:['admin_id','admin_type','username','first_name'], raw:true }) : [],
    custIds.length  ? ClientAccount.findAll({ where:{ client_account_id:{ [Op.in]: custIds } }, attributes:['client_account_id','first_name','last_name'], raw:true }) : []
  ]);
  const adminMap    = Object.fromEntries(admins.map(a => [a.admin_id, a]));
  const clientMap = Object.fromEntries(clients.map(c => [c.client_account_id, c]));

  // validation maps (1 per local day present in the result set)
  const dayKeys = [...new Set(rows
    .map(r => r.timestamp ? moment(r.timestamp).tz(APP_TZ).format('YYYY-MM-DD') : null)
    .filter(Boolean))];
  const vmapByDay = new Map(await Promise.all(dayKeys.map(async d => [d, await buildDailyValidationMap(d)])));

  const list = rows.map(r => {
    const ts = r.timestamp ? moment(r.timestamp).tz(APP_TZ) : null;
    const dayKey = ts ? ts.format('YYYY-MM-DD') : null;
    const vmap = dayKey ? (vmapByDay.get(dayKey) || new Map()) : new Map();
    const status = vmap.get(r.event_id) || (SECRET ? 'UNSIGNED' : 'UNSIGNED');
    const sev = (r.severity || 'info').toLowerCase();

    return {
      ...r,
      ts_local: ts ? ts.format('MMM D, YYYY • hh:mm A z') : '—',
      actor_label: toActorLabel(r, adminMap, clientMap),
      validation_status: status,  // VALID | INVALID | UNSIGNED
      sev_class: ['info','warning','error','security'].includes(sev) ? sev : 'info'
    };
  });

  return { items: list, range };
}




// ---------- Views ----------
export const logs_page = async (req, res) => {
  try {
    // read persisted preference (fallback to Basic)
    const viewMode = (req.admin?.current_view_mode === 'Advance') ? 'Advance' : 'Basic';

    const actorType = 'all';
    const severity  = 'all';
    const q = '';
    const { items, range } = await fetchLogs({ rangeKey: 'last7', actorType, severity, q });

    res.render('superadmin/logs_dashboard', {
      rangeKey: range.rangeKey,
      startYMD: range.startYMD,
      endYMD: range.endYMD,
      rangeLabel: range.label,
      actorType,
      severity,
      q,
      items,
      viewMode,                                  // <— pass to EJS
      csrfToken: req.csrfToken ? req.csrfToken() : null
    });
  } catch (e) {
    console.error('logs_page error', e);
    return res.status(500).render('superadmin/error500', { output:`Internal Server: ${e.message}` });
  }
};
// ---------- AJAX fetch ----------
export const logs_fetch = async (req, res) => {
  try {
    let { rangeKey='last7', startYMD='', endYMD='', dateYMD, actorType='all', severity='all', q='' } = req.body || {};

    // Backward compatibility: accept old single-date payload
    if (dateYMD && !startYMD && !endYMD && (!rangeKey || rangeKey === 'last7')) {
      rangeKey = 'custom';
      startYMD = dateYMD;
      endYMD = dateYMD;
    }

    let items;
    let range;
    try {
      const out = await fetchLogs({ rangeKey, startYMD, endYMD, actorType, severity, q });
      items = out.items;
      range = out.range;
    } catch (err) {
      return res.status(400).json({ success:false, message: err?.message || 'Bad range' });
    }

    return res.json({ success:true, items, range });
  } catch (e) {
    console.error('logs_fetch error', e);
    return res.status(500).json({ success:false, message:e.message });
  }
};



// ---------- Export TXT ----------
export const logs_export = async (req, res) => {
  try {
    let { rangeKey='last7', startYMD='', endYMD='', dateYMD, actorType='all', severity='all', q='', mode } = req.body || {};

    // Backward compatibility: accept old single-date payload
    if (dateYMD && !startYMD && !endYMD && (!rangeKey || rangeKey === 'last7')) {
      rangeKey = 'custom';
      startYMD = dateYMD;
      endYMD = dateYMD;
    }

    let items;
    let range;
    try {
      const out = await fetchLogs({ rangeKey, startYMD, endYMD, actorType, severity, q });
      items = out.items;
      range = out.range;
    } catch (err) {
      return res.status(400).send('Bad date range');
    }

    // Resolve mode: request body overrides, else admin pref, else Basic
    if (!mode) {
      const admin = req.admin ? await Admin.findByPk(req.admin.admin_id) : null;
      mode = (admin?.current_view_mode === 'Advance') ? 'Advance' : 'Basic';
    }
    const isAdvance = (mode === 'Advance');

    let out = `KWE Audit Log Export\n` +
              `Range: ${range.label}\n` +
              `Filters: actor=${actorType}, severity=${severity}, query="${q}"\n` +
              `Mode: ${mode}\n` +
              `Count: ${items.length}\n\n`;

    for (const it of items) {
      out += `==================== EVENT START ====================\n`;
      out += `Time     : ${it.ts_local}\n`;
      out += `Actor    : ${it.actor_label}\n`;
      out += `Type     : ${it.actor_type}\n`;
      out += `Action   : ${it.action}\n`;
      out += `URL      : ${it.method || ''} ${it.url || ''}\n`;
      out += `Severity : ${it.severity || 'info'} | Result: ${it.result || ''} | Code: ${it.result_code ?? ''}\n`;

      // Advanced-only lines
      if (isAdvance) {
        out += `Event ID : ${it.event_id}\n`;
        out += `Req ID   : ${it.req_id || '-'}\n`;
        out += `Latency  : ${it.latency_ms ?? '-'} ms\n`;
        out += `IP/UA    : ${it.ip || '-'} | ${(it.ua||'').slice(0,160)}\n`;
        out += `HMAC     : ${it.hmac_sig ? 'present' : 'missing'} | Validation: ${it.validation_status}\n`;
      }

      out += `Description:\n${(it.description || '').trim()}\n`;
      out += `==================== EVENT END ======================\n\n`;
    }

    const rangePart = (range.startYMD === range.endYMD) ? range.startYMD : `${range.startYMD}_to_${range.endYMD}`;
    const fname = `kwe-audit-${rangePart}-${mode.toLowerCase()}.txt`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
    return res.send(out);
  } catch (e) {
    console.error('logs_export error', e);
    return res.status(500).send(`Internal Server: ${e.message}`);
  }
};


// ---------- Persist View Mode ----------
export const logs_set_view_mode = async (req, res) => {
  try {
    const { mode } = req.body || {};
    if (!['Basic','Advance'].includes(mode)) {
      return res.status(400).json({ success:false, message:'Invalid mode' });
    }
    if (!req.admin?.admin_id) {
      return res.status(401).json({ success:false, message:'Unauthorized' });
    }
    await Admin.update({ current_view_mode: mode }, { where: { admin_id: req.admin.admin_id } });
    return res.json({ success:true, mode });
  } catch (e) {
    console.error('logs_set_view_mode error', e);
    return res.status(500).json({ success:false, message:e.message });
  }
};
