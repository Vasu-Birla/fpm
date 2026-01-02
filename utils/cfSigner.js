// utils/cfSigner.js
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
import fs from 'fs';
import path from 'path';

// Option A: load private key from file (recommended)
const CF_PRIVATE_KEY = fs.readFileSync(
  process.env.CF_PRIVATE_KEY_PATH || path.join(process.cwd(), 'cloudfront-private-key.pem'),
  'utf8'
);

// Option B (if you *must* keep it in env): const CF_PRIVATE_KEY = process.env.CF_PRIVATE_KEY.replace(/\\n/g, '\n');

export const signCfUrl = (key, { expiresInSeconds = 60 * 60 } = {}) => {
  if (!key) return null;
  const url = `https://${process.env.CLOUDFRONT_DOMAIN}/${encodeURI(key)}`;
  const dateLessThan = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  return getSignedUrl({
    url,
    keyPairId: process.env.CF_KEY_PAIR_ID,
    dateLessThan,
    privateKey: CF_PRIVATE_KEY,
  });
};
