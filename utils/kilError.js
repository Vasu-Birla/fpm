// utils/formatSequelizeError.js (ESM)
import {
  BaseError as SequelizeBaseError,
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
  DatabaseError,
  ConnectionError,
  TimeoutError
} from 'sequelize';

/**
 * kilError(error, options)
 * - Returns a single string, ready to show in toasts/logs/JSON.
 *
 * Options:
 *   full: boolean        -> if true, returns raw stack/message (replaces fullErrorString)
 *   verbose: boolean     -> if true, append minimal tech details helpful for devs
 */
export function kilError(error, { full = false, verbose = false } = {}) {
  // 1) Drop-in replacement for fullErrorString
  if (full) return String(error?.stack || error?.message || error);

  // 2) Null/primitive guard
  if (!error || typeof error !== 'object') return String(error ?? 'Unknown error');

  // 3) Sequelize family
  if (error instanceof UniqueConstraintError) {
    const msg = error.errors?.map(e => `'${e.value}' already exists for ${e.path}`).join(', ') || 'Duplicate value';
    return withMeta(`Duplicate value: ${msg}`, meta({ error, verbose }));
  }

  if (error instanceof ValidationError) {
    const msg = error.errors?.map(e => `${e.path}: ${e.message}`).join(', ') || error.message || 'Validation failed';
    return withMeta(`Validation failed: ${msg}`, meta({ error, verbose }));
  }

  if (error instanceof ForeignKeyConstraintError) {
    // error.index is often the offending FK index name
    const idx = error.index || 'unknown_foreign_key';
    return withMeta(`Foreign key constraint error on '${idx}'`, meta({ error, verbose }));
  }

  if (error instanceof TimeoutError) {
    return withMeta('Database timeout while executing query', meta({ error, verbose }));
  }

  if (error instanceof ConnectionError) {
    return withMeta('Database connection error', meta({ error, verbose }));
  }

  if (error instanceof DatabaseError) {
    // Generic DB error (syntax, unknown column, etc.)
    const sqlMsg = error.parent?.sqlMessage || error.parent?.message || error.message;
    return withMeta(`SQL Error: ${sqlMsg}`, meta({ error, verbose, include: ['code', 'errno', 'sqlState'] }));
  }

  if (error instanceof SequelizeBaseError) {
    // Any other Sequelize-specific error
    const msg = error.message || 'Sequelize error';
    return withMeta(msg, meta({ error, verbose }));
  }

  // 4) MySQL / driver-level (when not wrapped by Sequelize)
  //    Common shapes: { code, errno, sqlMessage, sqlState }
  if (error?.sqlMessage || error?.sqlState || error?.errno) {
    const code = error.code ? ` [${error.code}]` : '';
    return withMeta(`SQL Error${code}: ${error.sqlMessage || error.message || 'Unknown SQL error'}`,
      meta({ error, verbose, include: ['code', 'errno', 'sqlState'] })
    );
  }

  // 5) Axios HTTP errors
  if (error?.isAxiosError) {
    const res = error.response;
    const req = error.config || {};
    const method = (req.method || 'GET').toUpperCase();
    const url = req.url || req.baseURL || 'unknown-url';
    const status = res?.status;
    const statusText = res?.statusText;
    const payloadMsg =
      res?.data?.message ||
      res?.data?.error ||
      (typeof res?.data === 'string' ? res.data : null);

    let msg;
    if (status) {
      msg = `[HTTP ${status}${statusText ? ' ' + statusText : ''}] ${method} ${url}`;
      if (payloadMsg) msg += ` — ${payloadMsg}`;
    } else {
      msg = `Network error calling ${method} ${url}: ${error.message || 'Request failed'}`;
    }
    return withMeta(msg, meta({ error, verbose, include: ['code'] }));
  }

  // 6) Fetch/Undici-style network errors (Node >=18)
  //    Often present as error.cause with codes like ECONNREFUSED, ETIMEDOUT, SELF_SIGNED_CERT_IN_CHAIN, etc.
  const causeCode = error?.cause?.code || error?.code;
  if (causeCode) {
    const base = networkCodeToHuman(causeCode) || 'Network error';
    return withMeta(`${base}: ${error.message || causeCode}`, meta({ error, verbose, include: ['code'] }));
  }

  // 7) Common JS runtime errors
  if (error instanceof ReferenceError) return withMeta(`Reference Error: ${error.message}`, meta({ error, verbose }));
  if (error instanceof TypeError)      return withMeta(`Type Error: ${error.message}`, meta({ error, verbose }));
  if (error instanceof SyntaxError)    return withMeta(`Syntax Error: ${error.message}`, meta({ error, verbose }));

  // 8) Anything else; prefer message, fall back to stack, then stringify
  return String(error?.message || error?.stack || error);
}

/* -------------------------- helpers -------------------------- */

function withMeta(main, m) {
  if (!m) return main;
  // Keep one line; compact dev-oriented meta at the end.
  return `${main}${m}`;
}

function meta({ error, verbose, include = [] }) {
  if (!verbose) return '';
  const bits = [];

  // include-selectable known fields
  for (const key of include) {
    if (error?.[key] != null) bits.push(`${key}=${String(error[key])}`);
    if (error?.parent?.[key] != null) bits.push(`parent.${key}=${String(error.parent[key])}`);
  }

  // add minimal type for quick grep
  const type = error?.name || error?.constructor?.name;
  if (type) bits.unshift(`type=${type}`);

  // Append a trimmed stack tail (first line is message; we don’t need it again)
  const stack = (error.stack || '').split('\n').slice(1, 4).map(s => s.trim()).join(' | ');
  if (stack) bits.push(`stack=${stack}`);

  return bits.length ? `  [${bits.join(' ; ')}]` : '';
}

function networkCodeToHuman(code) {
  switch (String(code).toUpperCase()) {
    case 'ECONNREFUSED': return 'Connection refused';
    case 'ECONNRESET':   return 'Connection reset';
    case 'ETIMEDOUT':    return 'Connection timed out';
    case 'EAI_AGAIN':    return 'DNS resolution timed out';
    case 'ENOTFOUND':    return 'Host not found';
    case 'SELF_SIGNED_CERT_IN_CHAIN':
    case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
      return 'TLS certificate validation failed';
    default: return null;
  }
}

export function fullErrorString(err){ return String(err?.stack || err?.message || err); }