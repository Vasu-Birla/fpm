// utils/assetToken.js
import crypto from 'crypto';

const SECRET = process.env.ASSET_SIGNING_SECRET || 'change-me-please';

function b64url(bufOrStr) {
  return Buffer.from(bufOrStr)
    .toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function ub64url(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(str + '==='.slice((str.length + 3) % 4), 'base64');
}

/** Create opaque token with {key, exp, dl, name} */
export function signAssetPayload(payload) {
  const json = JSON.stringify(payload);
  const body = b64url(json);
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyAssetToken(token) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) throw new Error('BAD_TOKEN');

  const expect = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  const ok = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect));
  if (!ok) throw new Error('BAD_SIG');

  const payload = JSON.parse(ub64url(body).toString('utf8'));
  if (!payload?.exp || Date.now() > payload.exp) throw new Error('TOKEN_EXPIRED');

  return payload; // { key, exp, dl?, name? }
}
