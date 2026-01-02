// verifyAuditLogs.js
// ESM. Usage:
//   node verifyAuditLogs.js /path/to/secure-logs/audit-2025-08-18.jsonl
// Env:
//   AUDIT_HMAC_SECRET=<your secret>
//   (optional) VERIFY_MAX_REPORT=500   // limit detailed lines in report

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));


import dotenv from 'dotenv';


// emulate __dirname in ESM

// go up one folder (from /utils to project root)
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
const envPath = path.resolve(__dirname, '..', envFile);
dotenv.config({ path: envPath });


const argvPath = process.argv[2];
if (!argvPath) {
  console.error('❌ Please provide a path to an audit JSONL file.');
  console.error('   Example: node verifyAuditLogs.js secure-logs/audit-2025-08-18.jsonl');
  process.exit(2);
}


const AUDIT_FILE = path.resolve(argvPath);
const SECRET = process.env.AUDIT_HMAC_SECRET || '';
const MAX_REPORT = parseInt(process.env.VERIFY_MAX_REPORT || '500', 10);

const dateMatch = path.basename(AUDIT_FILE).match(/audit-(\d{4}-\d{2}-\d{2})\.jsonl$/);
const dateStr = dateMatch?.[1] || new Date().toISOString().slice(0, 10);
const REPORT_FILE = path.join(path.dirname(AUDIT_FILE), `verify-failed-audit-${dateStr}.txt`);

function computeSig(payload) {
  if (!SECRET) return undefined;
  const h = crypto.createHmac('sha256', SECRET);
  h.update(payload);
  return h.digest('hex');
}

function trimSnippet(str, n = 200) {
  if (str.length <= n) return str;
  return str.slice(0, n) + '…';
}

async function verify() {
  if (!fs.existsSync(AUDIT_FILE)) {
    console.error(`❌ File not found: ${AUDIT_FILE}`);
    process.exit(2);
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(AUDIT_FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let total = 0;
  let valid = 0;
  let invalid = 0;
  let unsigned = 0;
  const problems = []; // { line, type: 'INVALID'|'UNSIGNED'|'JSON_ERROR', found, expected, ts, action, snippet }

  for await (const raw of rl) {
    const lineNo = ++total;
    const line = raw.replace(/\r?\n$/, '');
    if (!line.trim()) continue;

    const idx = line.lastIndexOf('\tSIG=');
    const hasSig = idx !== -1;
    const payload = hasSig ? line.slice(0, idx) : line;
    const sig = hasSig ? line.slice(idx + 5) : undefined; // after '\tSIG='

    // If no secret configured, we cannot verify — count as unsigned
    if (!SECRET) {
      unsigned++;
      problems.push({ line: lineNo, type: 'UNSIGNED', found: null, expected: null, ts: null, action: null, snippet: trimSnippet(payload) });
      continue;
    }

    if (!hasSig || !sig) {
      unsigned++;
      // Attempt to parse for ts/action context
      let ts = null, action = null;
      try { const obj = JSON.parse(payload); ts = obj.ts || null; action = obj.action || null; } catch {}
      problems.push({ line: lineNo, type: 'UNSIGNED', found: null, expected: null, ts, action, snippet: trimSnippet(payload) });
      continue;
    }

    const expected = computeSig(payload);
    if (sig.toLowerCase() === String(expected).toLowerCase()) {
      valid++;
    } else {
      invalid++;
      let ts = null, action = null;
      try { const obj = JSON.parse(payload); ts = obj.ts || null; action = obj.action || null; } catch {}
      problems.push({ line: lineNo, type: 'INVALID', found: sig, expected, ts, action, snippet: trimSnippet(payload) });
    }
  }

  // Summary to console
  const summary = [
    `File: ${path.basename(AUDIT_FILE)}`,
    `Total lines:   ${total}`,
    `Valid (HMAC):  ${valid}`,
    `Unsigned:      ${unsigned}`,
    `Invalid:       ${invalid}`,
  ].join('\n');

  console.log(summary);

  // Create report if anything is wrong (invalid or unsigned)
  if (invalid > 0 || unsigned > 0) {
    let report = `Audit Verification Report\n` +
      `================================\n` +
      `${summary}\n\n` +
      `Details (first ${Math.min(MAX_REPORT, problems.length)} shown):\n`;

    for (const p of problems.slice(0, MAX_REPORT)) {
      report += `\n---\n`;
      report += `Line: ${p.line}\n`;
      report += `Type: ${p.type}\n`;
      if (p.ts) report += `ts:   ${p.ts}\n`;
      if (p.action) report += `act:  ${p.action}\n`;
      if (p.type === 'INVALID') {
        report += `found SIG:    ${p.found}\n`;
        report += `expected SIG: ${p.expected}\n`;
      }
      report += `payload: ${p.snippet}\n`;
    }

    report += `\nNote: If AUDIT_HMAC_SECRET was not set, all lines are marked UNSIGNED. Set the secret and rerun.\n`;

    await fsp.writeFile(REPORT_FILE, report, 'utf8');
    console.error(`\n❗Issues detected. Report written to: ${REPORT_FILE}`);
    // non-zero exit for CI automation
    process.exit(1);
  } else {
    // Clean up old report if exists for the same date (optional)
    try { await fsp.unlink(REPORT_FILE); } catch {}
    process.exit(0);
  }
}

verify().catch(err => {
  console.error('Verification failed:', err?.message || err);
  process.exit(2);
});
