// middleware/kilGate.js  (ESM)

const STATIC_EXT = /\.(?:pdf|gif|png|jpg|jpeg|css|js|ico|svg|woff|woff2|ttf|otf|eot|map|html|txt)$/i;
const ALLOWED_PREFIXES = ['/', '/superadmin', '/secure']; // for redirect allow-list

/* ================== Redirect guard (global) ================== */
function sameOriginAbsolute(u, req) {
  try {
    const url = new URL(u);
    const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'http').split(',')[0].trim();
    const host  = req.get('host');
    return (url.protocol.replace(/:$/,'') === proto) && (url.host === host);
  } catch { return false; }
}
function isSafeRelative(u) {
  if (typeof u !== 'string' || !u) return false;
  if (!u.startsWith('/')) return false;
  if (u.startsWith('//')) return false;
  return ALLOWED_PREFIXES.some(p => u === p || u.startsWith(p + '/'));
}
function sanitizeRedirect(candidate, req) {
  if (!candidate || typeof candidate !== 'string') return '/';
  let hash = '';
  const i = candidate.indexOf('#');
  if (i >= 0) { hash = candidate.slice(i); candidate = candidate.slice(0, i); }
  if (/^\w+:\/\//i.test(candidate)) return sameOriginAbsolute(candidate, req) ? candidate + hash : '/';
  if (candidate.startsWith('//')) return '/';
  return isSafeRelative(candidate) ? candidate + hash : '/';
}
export function validateRedirectAuto(req, res, next) {
  try {
    if (STATIC_EXT.test(req.path)) return next();

    if (req.query && typeof req.query.redirect === 'string') {
      req.query.redirect = sanitizeRedirect(req.query.redirect, req);
      res.locals.redirect = req.query.redirect;
    }
    if (req.body && typeof req.body.redirect === 'string') {
      req.body.redirect = sanitizeRedirect(req.body.redirect, req);
      res.locals.redirect = req.body.redirect;
    }

    if (!res.__kwe_redirect_patched) {
      const orig = res.redirect.bind(res);
      res.redirect = (...args) => {
        let status = 302, target;
        if (args.length === 1) target = args[0];
        else if (typeof args[0] === 'number') { status = args[0]; target = args[1]; }
        else target = args[0];
        const safe = sanitizeRedirect(String(target || '/'), req);
        return orig(status, safe);
      };
      res.__kwe_redirect_patched = true;
    }
    next();
  } catch { next(); }
}

/* ================== Cloak helpers ================== */
function patternToRegex(pat) {
  if (pat instanceof RegExp) return pat;
  if (typeof pat !== 'string') return null;
  const escaped = pat
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\\:([^/]+)/g, '[^/]+');
  return new RegExp('^' + escaped + '$', 'i');
}
function matchesAny(pathname, patterns = []) {
  for (const p of patterns) {
    const rx = patternToRegex(p);
    if (rx && rx.test(pathname)) return true;
  }
  return false;
}



export function cloakPrefix404(authorizeFn, { allow = [], exclude = [] } = {}) {
  if (typeof authorizeFn !== 'function') {
    throw new Error('authorizeFn must be a function (req)=>boolean/promise');
  }

  const toRegex = (p) => {
    if (p instanceof RegExp) return p;
    if (typeof p !== 'string') return null;
    const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\:([^/]+)/g, '[^/]+');
    return new RegExp('^' + escaped + '$', 'i');
  };

  const allowRx = (allow || []).map(toRegex).filter(Boolean);
  const excludeRx = (exclude || []).map(toRegex).filter(Boolean);

  return async (req, res, next) => {
    try {
      const fullPath = (req.baseUrl || '') + (req.path || '');
      // Exclusions first (skip cloak entirely)
      if (excludeRx.some(rx => rx.test(fullPath))) return next();
      // Legacy allow (also skips cloak)
      if (allowRx.some(rx => rx.test(fullPath))) return next();

      const ok = await Promise.resolve(authorizeFn(req));
      if (ok) return next();

      return res.status(404).render('error/error404', {
        pageTitle: 'Page Not Found',
        originalUrl: req.originalUrl || ''
      });
    } catch (e) {
      return next(e);
    }
  };
}






/* ================== Final handlers ================== */
export function notFound(req, res) {
  if (req.path && req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'Not found', path: req.originalUrl || '' });
  }
  res.status(404).render('error/error404', {
    pageTitle: 'Page Not Found',
    originalUrl: req.originalUrl || ''
  });
}
export function errorHandler(err, req, res, _next) {
  console.error('Unhandled Error:', err);
  const status = err?.status || 500;
  if (req.path && req.path.startsWith('/api')) {
    return res.status(status).json({
      success: false,
      message: status === 404 ? 'Not found' : 'Server Error',
      path: req.originalUrl || '',
      errorId: Date.now().toString(36)
    });
  }
  res.status(status).render('error/error500', {
    pageTitle: status === 404 ? 'Page Not Found' : 'Server Error',
    originalUrl: req.originalUrl || '',
    errorId: Date.now().toString(36)
  });
}

/* ================== One-call setup API ================== */
/**
 * Minimal wiring:
 * gatekeeper.outside(app, {
 *   cloak: [
 *     { prefix: '/superadmin',
 *       authorize: (req)=> !!(req.admin && req.admin.admin_id),
 *       allow: ['/superadmin/candidate_registration/:token']
 *     }
 *   ]
 * });
 * // ... mount routers ...
 * gatekeeper.inside(app); // adds global 404 + error handlers
 */
export function outside(app, { cloak = [], redirectGuard = true } = {}) {
  if (redirectGuard) app.use(validateRedirectAuto);
  for (const c of cloak) {
    if (!c || !c.prefix || !c.authorize) continue;
    app.use(c.prefix, cloakPrefix404(c.authorize, { allow: c.allow || [] }));
  }
}
export function inside(app) {
  app.use(notFound);
  app.use(errorHandler);
}





//==========================  STAFF & Role related KilGate =============================


// === Permission guard for /client routes ===
const ALLOWLIST = new Set([
  '/superadmin',               // dashboard
  '/superadmin/profile',       // profile
  '/superadmin/logout',        // logout
  '/superadmin/login',         // login pages (though most aren't behind isAuthenticatedClient)
  '/superadmin/check_session', // session ping
]);

const forbidden403 = (res, { routeKey, client }) => {
  res.status(403).send(`
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>403 · Access Denied</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    :root{--bg:#0b132b;--card:#1c2541;--acc:#3a506b;--ok:#5bc0be;--warn:#ffb703;--text:#e8f1f2;}
    *{box-sizing:border-box} body{margin:0;background:linear-gradient(135deg,var(--bg),#111726);font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Helvetica,Arial,sans-serif;color:var(--text);}
    .wrap{min-height:100dvh;display:grid;place-items:center;padding:24px;}
    .card{width:min(720px,92vw);background:linear-gradient(180deg,var(--card),#162033);border:1px solid #243252;border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,.35);padding:28px 26px;}
    h1{margin:0 0 6px;font-size:28px;letter-spacing:.2px}
    .muted{opacity:.85;font-size:14px;margin:0 0 18px}
    .badge{display:inline-block;padding:4px 10px;border-radius:999px;background:#2a3755;border:1px solid #334463;font-size:12px}
    .row{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px}
    .btn{appearance:none;border:0;border-radius:12px;padding:10px 14px;background:var(--ok);color:#062b2e;font-weight:700;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px}
    .btn.secondary{background:transparent;color:var(--text);border:1px solid #334463}
    code{background:#0f1a2e;border:1px solid #243252;padding:3px 6px;border-radius:8px}
    .grid{display:grid;grid-template-columns:1fr;gap:8px}
    .kv{display:flex;justify-content:space-between;gap:10px;background:#0f1a2e;border:1px solid #243252;border-radius:12px;padding:10px 12px}
    .kv .k{opacity:.75}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <span class="badge">HTTP 403</span>
      <h1>Access denied</h1>
      <p class="muted">You don’t have permission to access this section. If you believe this is an error, contact your administrator.</p>
      <div class="grid">
        <div class="kv"><div class="k">Route</div><div><code>${routeKey}</code></div></div>
        <div class="kv"><div class="k">Client</div><div><code>${client?.client_name || client?.email || client?.client_id || 'unknown'}</code></div></div>
      </div>
      <div class="row">
        <a class="btn" href="/client">← Back to Dashboard</a>
        <a class="btn secondary" href="javascript:history.back()">Go Back</a>
      </div>
    </div>
  </div>
</body>
</html>`);
};

export const enforceClientPerm = (routeKey) => {
  if (!routeKey.startsWith('/client')) {
    throw new Error(`enforceClientPerm expects a '/client/...' routeKey; got '${routeKey}'`);
  }
  return (req, res, next) => {
    try {
      // If not authenticated yet, let isAuthenticatedClient run first.
      if (!req.client) return next();

      // System role: allow everything
      const isSystem = !!res.app.locals.isSystemRole;
      if (isSystem) return next();

      // Allowlist (dashboard/profile/logout/login/etc.)
      if (ALLOWLIST.has(routeKey)) return next();

      // Pull permissions attached in your isAuthenticatedClient middleware
      const perms = req.client.permissions || {};
    //   if (perms.full === true) return next();

    console.log('=========================',perms[routeKey])

      const allowed = !!perms[routeKey];
      if (!allowed) return forbidden403(res, { routeKey, client: req.client });
      return next();
    } catch (e) {
      console.error('[enforceClientPerm]', e);
      return forbidden403(res, { routeKey, client: req.client });
    }
  };
};




//========================= END KILGATE ==================================