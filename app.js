// app.js (ESM)
import './loadEnv.js';
import http from 'http';
import https from 'https';

import express from 'express';
import * as url from 'url';
import * as path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

import cookie from 'cookie-parser';
import csurf from 'csurf';
import helmet from 'helmet';

import sequelize from './config/sequelize.js'; // keep if you use it elsewhere
import { resolveTz } from './middleware/resolveTz.js';

import SuperAdminRouter from './routes/superadminRoute.js';
import secureRoutes from './routes/secureRoutes.js';
import apiRouter from './routes/apiRoute.js';
import IndexRouter from './routes/indexRoute.js';

import { initAuditLogging } from './utils/auditLogger.js';
import { loadLocationCache } from './utils/killocations.js';
import { safeJson } from './helper/helper.js';

import { initSockets } from './sockets/index.js';

// Optional (you imported but didn’t use)
// import { validateRedirectUrl } from './middleware/validateRedirect.js';

import { getRsaPublicKey } from './config/rsaKeys.js';

// ===================== ENV LOAD (.env.NODE_ENV) =====================
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// ===================== OPTIONAL: CRON GUARD =====================
// If this project has cronTrigger.js, keep it. If not, remove.
const cronStatus = String(process.env.CRON_STATUS || 'OFF').toUpperCase();
if (cronStatus === 'ON') {
  console.log('[CRON] CRON_STATUS=ON → enabling cronTrigger.js');
  import('./utils/cronTrigger.js')
    .then(() => console.log('[CRON] cronTrigger.js loaded, schedules active.'))
    .catch(err => console.error('[CRON] Failed to load cronTrigger.js:', err?.message || err));
} else {
  console.log('[CRON] CRON_STATUS=' + cronStatus + ' → cron jobs are DISABLED.');
}

// ===================== RSA KEY LOAD (ONCE) =====================
let RSA_PUBLIC_KEY = '';
try {
  RSA_PUBLIC_KEY = getRsaPublicKey();
} catch (e) {
  console.error('❌ RSA public key load error:', e.message);
  RSA_PUBLIC_KEY = '';
}

// ===================== APP INIT =====================
const app = express();
await initAuditLogging(app);

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

// ===================== BASIC GLOBAL MIDDLEWARE =====================
app.use(cookie());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ===================== HELMET / CSP PLACEHOLDER =====================
// Paste your final CSP block here like your first app.js.
// For now, keep helmet enabled with defaults.
// app.use(
//   helmet({
//     contentSecurityPolicy: false,
//     frameguard: { action: 'sameorigin' }
//     // contentSecurityPolicy: { directives: { ... } }
//   })
// );

// ===================== CSRF =====================
// Multipart routes where csurf must be skipped (file uploads)
const multipartCsrfRoutes = [
  '/superadmin/upload_asset'
];

// Apply CSRF protection only to non-API routes and non-multipart POSTs
app.use((req, res, next) => {
  if (
    req.path.startsWith('/api') ||
    (req.method === 'POST' && multipartCsrfRoutes.includes(req.path))
  ) {
    return next();
  }
  csurf({ cookie: true })(req, res, next);
});

// Always define csrfToken variable for EJS
app.use((req, res, next) => {
  res.locals.csrfToken = '';
  if (!req.path.startsWith('/api') && typeof req.csrfToken === 'function') {
    try { res.locals.csrfToken = req.csrfToken(); } catch {}
  }
  next();
});

// static AFTER CSRF so that GET pages generate token first
app.use(express.static(path.join(__dirname, 'public')));

// ===================== TITLE HELPER =====================
function getTitleFromUrl(u) {
  if (!u || typeof u !== 'string') return 'Dashboard';
  u = u.split('?')[0].replace(/\/+$/, '');
  const parts = u.split('/').filter(Boolean);
  if (!parts.length) return 'Dashboard';

  const filtered = parts.filter(p =>
    p &&
    isNaN(p) &&
    !['api', 'superadmin', 'client', 'customer', 'user', 'sscl', 'admin', 'public', 'v1', 'v2', 'v3'].includes(p.toLowerCase())
  );

  if (!filtered.length) return 'Dashboard';

  const slug = filtered.slice(-2).join(' ');
  const title = slug
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, l => l.toUpperCase());

  return title || 'Dashboard';
}

// ===================== TRUST PROXY / FORCE HTTPS (ENV) =====================
if (String(process.env.TRUST_PROXY || 'OFF').toUpperCase() === 'ON') {
  console.log('Trust Proxy ON');
  app.set('trust proxy', true);
}

if (String(process.env.FORCE_HTTPS || 'OFF').toUpperCase() === 'ON') {
    console.log('FORCE_HTTPS ON');
  app.use((req, res, next) => {
    const proto = (req.headers['x-forwarded-proto'] || '').toString().toLowerCase();
    const isSecure = req.secure || proto === 'https';
    if (!isSecure) {
      return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
    }
    next();
  });
}

// ===================== GLOBAL CONSTANT LOCALS (SAFE) =====================
// ✅ Only constants here. No per-request data.
app.locals.host = process.env.Host || '';
app.locals.RECAPTCHA_ENTERPRISE_SITE_KEY = process.env.RECAPTCHA_ENTERPRISE_SITE_KEY || '';
app.locals.RSA_PUBLIC_KEY = RSA_PUBLIC_KEY;

// ⚠️ WARNING: If ENCRYPTION_SECRET_KEY is truly secret, DO NOT expose to EJS.
app.locals.encrypt_key = process.env.ENCRYPTION_SECRET_KEY || '';

app.locals.currency = process.env.currency || '';
app.locals.currency_symbol = process.env.currency_symbol || 'J$';

// helper for EJS
app.locals.json = safeJson;

// Load location cache ONCE
await loadLocationCache(app);

// ===================== PER-REQUEST LOCALS (SAFE) =====================
app.use((req, res, next) => {
  try {
    // per request
    res.locals.host = app.locals.host;
    res.locals.currentUrl = req.originalUrl;
    res.locals.pageTitle = getTitleFromUrl(req.path || req.originalUrl);
    res.locals.showModal = true;

    // auth defaults (avoid bleed)
    res.locals.dashboard_type = 'Guest';
    res.locals.is_client = false;
    res.locals.loggeduser = null;
    res.locals.permissions = null;
    res.locals.perms = null;

    res.locals.admin = null;
    res.locals.client = null;

    req.dashboard_type = 'Guest';

    // constants copied to res.locals for templates
    res.locals.encrypt_key = app.locals.encrypt_key; // ⚠️ remove if secret
    res.locals.RECAPTCHA_ENTERPRISE_SITE_KEY = app.locals.RECAPTCHA_ENTERPRISE_SITE_KEY;
    res.locals.RSA_PUBLIC_KEY = app.locals.RSA_PUBLIC_KEY;

    // currency
    res.locals.currency = app.locals.currency;
    res.locals.currency_symbol = app.locals.currency_symbol;
    req.currency = res.locals.currency;
    req.currency_symbol = res.locals.currency_symbol;

    // location cache
    res.locals.countries = app.locals.countries;
    res.locals.countryStates = app.locals.countryStates;

    // helper
    res.locals.json = app.locals.json;

    // base_url
    const baseUrl = req.protocol + '://' + req.get('host');
    req.base_url = baseUrl;
    res.locals.base_url = baseUrl;

    res.locals.output = '';

    // strong cache control for sensitive pages
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    return next();
  } catch (err) {
    console.error('Locals middleware error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ===================== TZ =====================
app.use(resolveTz);

// Optional redirect url validation
// app.use(validateRedirectUrl);

// ===================== EJS INCLUDE SHADOW GUARD =====================
app.use((req, res, next) => {
  const origRender = res.render.bind(res);
  res.render = (view, options, callback) => {
    if (options && Object.prototype.hasOwnProperty.call(options, 'include') && typeof options.include !== 'function') {
      delete options.include;
    }
    if (res.locals && Object.prototype.hasOwnProperty.call(res.locals, 'include') && typeof res.locals.include !== 'function') {
      delete res.locals.include;
    }
    if (req.app?.locals && Object.prototype.hasOwnProperty.call(req.app.locals, 'include') && typeof req.app.locals.include !== 'function') {
      delete req.app.locals.include;
    }
    return origRender(view, options, callback);
  };
  next();
});

// ===================== ROUTES =====================
app.use('/secure', secureRoutes);
app.use('/superadmin', SuperAdminRouter);
app.use('/', IndexRouter);
app.use('/api', apiRouter);

// ===================== VIEW ENGINE =====================
app.set('view engine', 'ejs');
app.set('views', [
  path.join(__dirname, './views'),
  path.join(__dirname, './views/superadmin'),
  path.join(__dirname, './views/client'),
  path.join(__dirname, './views/lawyer')
]);

// ===================== SERVER START (SSL ENV-AWARE) =====================
const port = Number(process.env.PORT || 3042);

// ✅ Turn on node SSL only when explicitly enabled (like your good app.js)
const USE_NODE_SSL = String(process.env.USE_NODE_SSL || 'OFF').toUpperCase() === 'ON';

function getEnv() {
  const v = String(process.env.NODE_ENV || 'development').toLowerCase();
  if (v === 'production' || v === 'prod') return 'prod';
  if (v === 'uat' || v === 'staging' || v === 'test') return 'uat';
  return 'dev';
}

function resolveSslDirs() {
  const base = path.join(__dirname, 'ssl');
  const env = getEnv();
  if (env === 'prod') return { env, primary: path.join(base, 'prod'), fallback: base };
  if (env === 'uat') return { env, primary: path.join(base, 'uat'), fallback: base };
  return { env, primary: base, fallback: null };
}

function tryRead(p) {
  try { if (p && fs.existsSync(p)) return fs.readFileSync(p); } catch (e) {
    console.error(`⚠️ Failed reading ${p}:`, e.message);
  }
  return null;
}

function firstExistingPathMulti(dirs, names) {
  for (const d of dirs.filter(Boolean)) {
    for (const name of names) {
      if (!name) continue;
      const full = path.join(d, name);
      if (fs.existsSync(full)) return full;
    }
  }
  return null;
}

function loadSSLOptionsEnvAware() {
  const { env, primary, fallback } = resolveSslDirs();
  const searchDirs = fallback ? [primary, fallback] : [primary];

  const CANDIDATES = {
    dev: {
      key: ['key.pem', 'server.key', 'kwljmsystems.key'],
      cert: ['cert.pem', 'server.crt', 'server.pem', 'kwljmsystems.crt', 'kwljmsystems.pem'],
      ca: ['ca-chain.crt', 'chain.pem', 'ca-cert-chain.pem', 'fullchain.pem'],
      cert_fallback: ['domain.crt', 'fullchain.pem', 'kwljmsystems.pem']
    },
    uat: {
      key: ['kwlazgatetestv2.key'],
      cert: ['kwlazgatetestv2.pem'],
      ca: ['ca-cert-chain.pem'],
      cert_fallback: []
    },
    prod: {
      key: ['kwljmsystems.key', 'server.key', 'key.pem'],
      cert: ['kwljmsystems.crt', 'server.crt', 'server.pem', 'cert.pem'],
      ca: ['ca-chain.crt', 'fullchain.pem', 'ca-cert-chain.pem', 'chain.pem'],
      cert_fallback: ['kwljmsystems.pem', 'fullchain.pem', 'domain.crt']
    }
  };

  const set = CANDIDATES[env] || CANDIDATES.dev;

  const keyNameOverride = process.env.SSL_KEY || null;
  const certNameOverride = process.env.SSL_CERT || null;
  const caNameOverride = process.env.SSL_CA || null;
  const certFallbackOverride = process.env.SSL_CERT_FALLBACK || null;

  const keyPath = keyNameOverride
    ? path.join(primary, keyNameOverride)
    : firstExistingPathMulti(searchDirs, set.key);

  let certPath = certNameOverride
    ? path.join(primary, certNameOverride)
    : firstExistingPathMulti(searchDirs, set.cert);

  if (!certPath) {
    const fbList = certFallbackOverride ? [certFallbackOverride] : set.cert_fallback;
    certPath = firstExistingPathMulti(searchDirs, fbList);
  }

  const caPath = caNameOverride
    ? path.join(primary, caNameOverride)
    : firstExistingPathMulti(searchDirs, set.ca);

  const key = tryRead(keyPath);
  const cert = tryRead(certPath);
  const ca = tryRead(caPath);

  if (!key || !cert) {
    console.warn(
`⚠️ SSL disabled for env="${env}". Missing required files.
Searched in:
 - ${searchDirs.join(' , ')}

Required (key + cert):
 - key : ${keyPath || '(not found)'}
 - cert: ${certPath || '(not found)'}
Optional chain:
 - ca  : ${caPath || '(not found)'}
`
    );
    return null;
  }

  console.log(`🔑 SSL enabled for NODE_ENV="${env}".`);
  console.log(`   • key : ${keyPath}`);
  console.log(`   • cert: ${certPath}`);
  if (ca) console.log(`   • ca  : ${caPath}`);

  const httpsOptions = { key, cert };
  if (ca) httpsOptions.ca = ca;
  return httpsOptions;
}

const sslOptions = USE_NODE_SSL ? loadSSLOptionsEnvAware() : null;

if (sslOptions) {
  const httpsServer = https.createServer(sslOptions, app);

  // ✅ attach sockets once
  initSockets(httpsServer);

  httpsServer.listen(port, () => {
    app.locals.httpsPort = httpsServer.address().port;
    console.log(`🔐 HTTPS Server running at https://127.0.0.1:${app.locals.httpsPort}`);
  });
} else {
  const httpServer = http.createServer(app);

  // ✅ attach sockets once
  initSockets(httpServer);

  httpServer.listen(port, () => {
    app.locals.httpPort = httpServer.address().port;
    console.log(`🌐 HTTP Server running at http://127.0.0.1:${app.locals.httpPort}`);
  });
}
