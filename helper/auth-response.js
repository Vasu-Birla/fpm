// auth-utils.js
export function wantsJson(req) {
  // Strong signals first:
  if ((req.headers['x-client'] || '').toLowerCase() === 'mobile') return true;
  if ((req.headers['x-requested-with'] || '').toLowerCase() === 'xmlhttprequest') return true; // Axios/SPA
  // Fallback to Accept:
  return req.accepts(['json', 'html']) === 'json';
}

export function sendWebBootstrap(res, token, redirect = '/') {
  return res
    .status(200)
    .set('Content-Type', 'text/html; charset=utf-8')
    .set('Cache-Control', 'no-store')
    .send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Redirecting…</title></head>
<body>
<script>
try { localStorage.setItem('kwe_jwt', ${JSON.stringify(token)}); } catch (e) {}
location.replace(${JSON.stringify(redirect)});
</script>
Redirecting…
</body></html>`);
}
