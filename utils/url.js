// utils/url.js
export function getBaseUrl(req) {
  // Prefer proxy headers if you're behind Cloudflare/ELB/NGINX
  const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
  const host  = (req.headers['x-forwarded-host']  || req.get('host') || '').split(',')[0].trim();

  // If a port is present on host, keep it; otherwise fine.
  return `${proto}://${host}`;
}

export function joinUrl(base, path) {
  if (!base) return path || '';
  if (!path) return base;
  return `${base.replace(/\/+$/,'')}/${path.replace(/^\/+/,'')}`;
}




// utils/url.js (ESM)
export function getBaseUrl_advance(req, opts = {}) {
  const fallback = opts.defaultBase || process.env.APP_BASE_URL || '';

  try {
    // Prefer proxy headers (set trust proxy in Express: app.set('trust proxy', true))
    const hdr = (name) => (req?.headers?.[name] || '').toString();
    const first = (v) => (v || '').split(',')[0].trim();

    let proto = first(hdr('x-forwarded-proto')) || req?.protocol || '';
    let host  = first(hdr('x-forwarded-host'))  || hdr('host') || '';

    // Cloudflare / some proxies pass separate port
    const xfPort = first(hdr('x-forwarded-port'));

    // Normalize
    proto = (proto || '').toLowerCase();
    if (!proto) proto = host.startsWith('localhost') ? 'http' : 'https';

    // If host missing entirely, fall back to env
    if (!host) return (fallback || '').replace(/\/+$/,'');

    // If an explicit port is forwarded and not already on host, append it (unless default 80/443)
    if (xfPort && !host.includes(':')) {
      const p = Number(xfPort);
      const isDefault = (proto === 'http' && p === 80) || (proto === 'https' && p === 443);
      if (!isDefault && Number.isFinite(p)) host = `${host}:${p}`;
    }

    // Clean trailing slashes
    return `${proto}://${host}`.replace(/\/+$/,'');
  } catch {
    return (fallback || '').replace(/\/+$/,'');
  }
}

/**
 * Make an absolute URL using getBaseUrl; safe if you pass a path ("/foo").
 * Example: absoluteUrl(req, '/secure/file_stream?s3key=...').
 */
export function absoluteUrl(req, pathname = '/', opts = {}) {
  const base = getBaseUrl(req, opts);
  // ensure exactly one slash between base and path
  const p = String(pathname || '/');
  if (!base) return p; // fall back to relative if no base is available
  return `${base}${p.startsWith('/') ? '' : '/'}${p}`;
}

