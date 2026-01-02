// utils/flash.js
const isProd = process.env.NODE_ENV === 'production';

const BASE = {
  path: '/',                // always set a consistent path
  sameSite: 'lax',
  httpOnly: true,           // safer; JS can't read/modify (that's okay)
  secure: isProd,
};

/** Set a short-lived flash cookie */
export function flashSet(res, name, value, maxAgeMs = 15000, extra = {}) {
  res.cookie(name, value, { ...BASE, maxAge: maxAgeMs, ...extra });
}

/** Read + clear the flash cookie in one go */
export function flashPop(req, res, name) {
  const val = req.cookies?.[name] || '';
  // clear at common paths (handles earlier inconsistencies)
  res.clearCookie(name, { path: '/' });
  res.clearCookie(name, { path: '/superadmin' });
  return val;
}

/** Clear arbitrary cookie names you used elsewhere */
export function nukeCookies(req, res, names = []) {
  for (const n of names) {
    res.clearCookie(n, { path: '/' });
    res.clearCookie(n, { path: '/superadmin' });
  }
}
