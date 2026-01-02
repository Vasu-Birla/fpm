// utils/rsa.js (ESM) – RSA-OAEP decrypt using WebCrypto
import crypto from 'node:crypto';
import { getRsaPrivateKey } from '../config/rsaKeys.js';

const { subtle } = crypto.webcrypto;

// Convert PEM -> raw key bytes
function pemToBuffer(pem) {
  if (!pem) throw new Error('Empty PEM');
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '');
  return Buffer.from(b64, 'base64');
}

let privateKeyPromise = null;

async function getPrivateKey() {
  if (!privateKeyPromise) {
    privateKeyPromise = (async () => {
      const pem = getRsaPrivateKey();          // from config/rsaKeys.js
      const keyData = pemToBuffer(pem);
      return await subtle.importKey(
        'pkcs8',                               // openssl genpkey produces PKCS8
        keyData,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['decrypt']
      );
    })().catch(err => {
      console.error('❌ RSA private key import error:', err.message);
      privateKeyPromise = null;
      throw err;
    });
  }
  return privateKeyPromise;
}

/**
 * Decrypt base64 ciphertext produced by browser RSA-OAEP.
 */
export async function rsaDecryptBase64(cipherBase64) {
  if (!cipherBase64) return '';
  try {
    const key = await getPrivateKey();
    const cipherBytes = Buffer.from(cipherBase64, 'base64');

    const plainBuffer = await subtle.decrypt(
      { name: 'RSA-OAEP' },
      key,
      cipherBytes
    );

    return Buffer.from(plainBuffer).toString('utf8');
  } catch (e) {
    console.error('RSA-OAEP decrypt error:', e.message);
    return '';
  }
}
