// utils/auditLogger.js (hardened)
// ESM
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';
import AuditLog from '../models/AuditLog.js';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));


import dotenv from 'dotenv';
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
const envPath = path.resolve(__dirname, '..', envFile);
dotenv.config({ path: envPath });

/**
 * Key improvements
 * - JSONL logs with daily rotation: secure-logs/audit-YYYY-MM-DD.jsonl
 * - Single write stream to avoid interleaving, with graceful shutdown
 * - Request-scoped context via AsyncLocalStorage (reqId, ip, ua, url, method)
 * - Redaction of secrets (passwords, tokens, cookies)
 * - HMAC signature per entry (AUDIT_HMAC_SECRET)
 * - Size & retention controls, background cleanup
 * - Typed event fields: severity, result_code, latency_ms
 */

const LOG_DIR = path.join(process.cwd(), 'secure-logs');
const RETAIN_DAYS = parseInt(process.env.AUDIT_LOG_RETAIN_DAYS || '30', 10);
const HMAC_SECRET = process.env.AUDIT_HMAC_SECRET || '';

const als = new AsyncLocalStorage();
let stream = null;
let currentDateStr = null; // yyyy-mm-dd for rotation

function dateStr(d = new Date()) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

async function ensureDir() {
  await fsp.mkdir(LOG_DIR, { recursive: true });
}

function openStreamIfNeeded() {
  const today = dateStr();
  if (stream && currentDateStr === today) return;

  // rotate (close old)
  if (stream) {
    try { stream.end(); } catch {}
    stream = null;
  }

  currentDateStr = today;
  const filePath = path.join(LOG_DIR, `audit-${today}.jsonl`);
  stream = fs.createWriteStream(filePath, { flags: 'a', mode: 0o600 });
}

async function rotateByRetention() {
  try {
    const files = await fsp.readdir(LOG_DIR);
    const cutoff = Date.now() - RETAIN_DAYS * 86400000;
    await Promise.all(
      files.filter(f => f.startsWith('audit-') && f.endsWith('.jsonl')).map(async f => {
        const full = path.join(LOG_DIR, f);
        const stat = await fsp.stat(full).catch(() => null);
        if (!stat) return;
        if (stat.mtimeMs < cutoff) {
          await fsp.unlink(full).catch(() => {});
        }
      })
    );
  } catch {}
}

function redact_very_strict(value) {
  if (value == null) return value;
  const s = String(value);
  // Basic patterns
  const patterns = [
    /(bearer\s+)[a-z0-9\-_.=:+/]+/gi,
    /(token|otp|password|secret|authorization|cookie)=([^;&\s]+)/gi,
    /"(token|otp|password|secret)"\s*:\s*"[^"]+"/gi,
    /[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi // mask emails partially
  ];
  let out = s;
  for (const p of patterns) out = out.replace(p, (m, p1) => (p1 ? `${p1}[REDACTED]` : '[REDACTED]'));
  // mask long hex
  out = out.replace(/[a-f0-9]{24,}/gi, '[HEX_REDACTED]');
  return out;
}

// partial strict  Masking things
function redact(value) {
  if (value == null) return value;
  let out = String(value);

  // 1) Bearer/JWT etc.
  out = out.replace(/(bearer\s+)[a-z0-9\-_.=:+/]+/gi, '$1[REDACTED]');

  // 2) token=..., otp=..., password=..., secret=..., authorization=..., cookie=...
  out = out.replace(/(token|otp|password|secret|authorization|cookie)=([^;&\s]+)/gi, '$1=[REDACTED]');

  // 3) JSON style "password": "...."
  out = out.replace(/"(token|otp|password|secret)"\s*:\s*"[^"]+"/gi, '"$1":"[REDACTED]"');

  // 4) Emails → partial mask, and also eat optional glued numeric prefix like "21user@example.com"
  //    - keep 2 chars from user part, keep full domain
  //    - preserve left boundary (start or non-word) so spacing stays nice
  out = out.replace(/(^|[^\w])(?:\d{1,4})?([\w.+-]+)@([\w.-]+\.[a-z]{2,})/gi, (_, boundary, user, domain) => {
    const maskedUser = user.length <= 2 ? user[0] + '*' : user.slice(0, 2) + '***';
    return `${boundary}${maskedUser}@${domain}`;
  });

  // 5) Long hex blobs (ids/tokens)
  out = out.replace(/[a-f0-9]{24,}/gi, '[HEX_REDACTED]');

  return out;
}

function hashSig(payload) {
  if (!HMAC_SECRET) return undefined;
  const h = crypto.createHmac('sha256', HMAC_SECRET);
  h.update(payload);
  return h.digest('hex');
}

function nowIso() { return new Date().toISOString(); }

export function auditContextMiddleware(req, _res, next) {
  const ctx = {
    reqId: crypto.randomUUID(),
    startHr: process.hrtime.bigint(),
    ip: (req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '').toString(),
    ua: req.headers['user-agent'] || '',
    url: req.originalUrl || req.url,
    method: req.method,
  };
  als.run(ctx, next);
}

function getCtx() { return als.getStore() || {}; }

export async function logAction({
  actorType,
  actorId,
  clientId,
  candidateId = null,
  report_id = null,
  url,
  action,
  description,
  severity = 'info', // info | warning | error | security
  result = 'OK',
  result_code = 200,
  extra = {}, // any additional fields (object)
}) {

  console.log('🔴 Audit logging started:');
  console.log('---- action -->> ',action)
    console.log('---- clientId -->> ',clientId)
      console.log('---- description -->> ',description)
        console.log('---- actorType -->> ',actorType)



  try {
    await ensureDir();
    openStreamIfNeeded();

    const ctx = getCtx();
    const endHr = process.hrtime.bigint();
    const latency_ms = ctx.startHr ? Number(endHr - ctx.startHr) / 1e6 : undefined;

    const entry = {
      ts: nowIso(),
      event_id: crypto.randomUUID(),
      req_id: ctx.reqId,
      url: url || ctx.url,
      method: ctx.method,
      ip: ctx.ip,
      ua: ctx.ua,
      actor_type: actorType,
      actor_id: actorId,
      client_id: clientId ?? null,
      candidate_id: candidateId ?? null,
      report_id: report_id ?? null,
      action,
      description: redact(description),
      severity,
      result,
      result_code,
      latency_ms,
      extra,
    };

    const payload = JSON.stringify(entry);
    const sig = hashSig(payload);
    const line = sig ? `${payload}\tSIG=${sig}\n` : `${payload}\n`;

    // Write to file (non-blocking)
    stream.write(line);

    // Insert into DB (fire-and-forget)
 
    // Insert into DB (fire-and-forget)
if (AuditLog?.create) {
  AuditLog.create({
    // ✅ keep ENUM lowercase to match your model
    actor_type: String(actorType || '').toLowerCase(),
    actor_id: actorId ?? null,
    client_id: clientId ?? null,
    candidate_id: candidateId ?? null,
    report_id: report_id ?? null,

    action,
    description: redact(description),
    url: url || ctx.url,

    // ✅ store both severity and result_code separately
    result: `${severity}:${result}`,
    severity,             // e.g., 'info' | 'warning' | 'error' | 'security'
    result_code,          // e.g., 200, 403, 500

    // ✅ request context
    req_id: ctx.reqId || null,
    event_id: entry.event_id,
    method: ctx.method || null,
    ip: ctx.ip || null,
    ua: ctx.ua || null,
    latency_ms: latency_ms ?? null,

    // ✅ tamper-evidence (optional; only if you added this column)
    hmac_sig: sig || null,

    timestamp: new Date(),
  }).catch(() => {});
}

  } catch (err) {
    // Last-resort stderr so app flow never breaks
    console.error('🔴 Audit logging failed:', err?.message || err);
  }
}

// Call once during app bootstrap
export async function initAuditLogging(app) {
  await ensureDir();
  rotateByRetention();
  openStreamIfNeeded();

  // Request context
  app.use(auditContextMiddleware);

  // Keep stream rotated by date
  setInterval(() => {
    try { openStreamIfNeeded(); } catch {}
  }, 60_000).unref();

  // Daily retention cleanup
  setInterval(() => rotateByRetention(), 12 * 60 * 60 * 1000).unref();

  // Graceful shutdown
  const shutdown = () => { try { stream?.end(); } catch {} };
  process.on('beforeExit', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// Optional: quick helper for common outcomes
export const Audit = {
  success: (base) => logAction({ ...base, severity: 'info', result: 'OK', result_code: 200 }),
  denied:  (base) => logAction({ ...base, severity: 'security', result: 'DENIED', result_code: 403 }),
  failed:  (base) => logAction({ ...base, severity: 'error', result: 'FAILED', result_code: 500 }),
  warn:    (base) => logAction({ ...base, severity: 'warning', result: 'WARN', result_code: 299 }),
};

