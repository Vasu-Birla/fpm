// config/rsaKeys.js (ESM)
import fs from 'node:fs';
import path from 'node:path';
import * as url from 'node:url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
// project root = one level up from config/
const ROOT_DIR   = path.resolve(__dirname, '..');

function resolvePath(p) {
  if (!p) return null;
  return path.isAbsolute(p) ? p : path.join(ROOT_DIR, p);
}

function readFileOrNull(p) {
  try {
    if (p && fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf8');
    }
  } catch (e) {
    console.error('RSA key read error for', p, e.message);
  }
  return null;
}

// Helper to try multiple candidate paths in order
function firstExistingKey(paths) {
  for (const p of paths) {
    const content = readFileOrNull(p);
    if (content) return content;
  }
  return null;
}

// 🔐 PRIVATE KEY – server-only
export function getRsaPrivateKey() {
  // 1) Full PEM in env (with \n escaped)
  if (process.env.RSA_PRIVATE_KEY && process.env.RSA_PRIVATE_KEY.trim()) {
    return process.env.RSA_PRIVATE_KEY.replace(/\\n/g, '\n');
  }

  // 2) Candidate paths: env path (if set) → static default
  const candidates = [];

  if (process.env.RSA_PRIVATE_KEY_PATH) {
    const envPath = resolvePath(process.env.RSA_PRIVATE_KEY_PATH);
    if (envPath) candidates.push(envPath);
  }

  // Static fallback path under project root
  const defaultPath = path.join(ROOT_DIR, 'ssl', 'rsa', 'rsa_private.pem');
  candidates.push(defaultPath);

  const key = firstExistingKey(candidates);
  if (!key) {
    throw new Error(
      `RSA private key not found. Tried paths: ${
        candidates.length ? candidates.join(', ') : '(none)'
      }`
    );
  }
  return key;
}

// 🌍 PUBLIC KEY – can be exposed to frontend
export function getRsaPublicKey() {
  if (process.env.RSA_PUBLIC_KEY && process.env.RSA_PUBLIC_KEY.trim()) {
    return process.env.RSA_PUBLIC_KEY.replace(/\\n/g, '\n');
  }

  const candidates = [];

  if (process.env.RSA_PUBLIC_KEY_PATH) {
    const envPath = resolvePath(process.env.RSA_PUBLIC_KEY_PATH);
    if (envPath) candidates.push(envPath);
  }

  const defaultPath = path.join(ROOT_DIR, 'ssl', 'rsa', 'rsa_public.pem');
  candidates.push(defaultPath);

  const key = firstExistingKey(candidates);
  if (!key) {
    throw new Error(
      `RSA public key not found. Tried paths: ${
        candidates.length ? candidates.join(', ') : '(none)'
      }`
    );
  }
  return key;
}
