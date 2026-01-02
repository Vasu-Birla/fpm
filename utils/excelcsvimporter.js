// utils/excelcsvimporter.js (ESM)
import xlsx from 'xlsx';
  import fs from 'fs';

const EMAIL_HEADERS = [
  'email', 'e-mail', 'email id', 'email_id', 'mail',
  'email address', 'emailaddress', 'work email', 'official email'
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export function extractEmailsFromBuffer(buffer) {
  const wb = xlsx.read(buffer, { type: 'buffer' });
  if (!wb.SheetNames?.length) return { emails: [] };

  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return { emails: [] };

  // 1) Try header-based (row 1)
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
  let emails = [];

  if (rows.length) {
    const header = rows[0].map(h => String(h || '').trim().toLowerCase());
    let idx = -1;
    for (const h of EMAIL_HEADERS) {
      idx = header.indexOf(h);
      if (idx !== -1) break;
    }
    if (idx !== -1) {
      for (let i = 1; i < rows.length; i++) {
        const val = rows[i]?.[idx];
        const e = String(val ?? '').trim();
        if (e) emails.push(e);
      }
    } else {
      // 2) Object-mode: look for email-like key
      const objs = xlsx.utils.sheet_to_json(ws, { defval: '' });
      if (objs.length) {
        const keys = Object.keys(objs[0] || {});
        let emailKey =
          keys.find(k => EMAIL_HEADERS.includes(k.toLowerCase())) ||
          keys.find(k => /email/i.test(k));
        if (emailKey) {
          emails = objs.map(r => String(r[emailKey] || '').trim()).filter(Boolean);
        } else {
          // 3) Last resort: scan all cells for email pattern
          for (const row of rows) {
            for (const cell of row) {
              const s = String(cell || '').trim();
              if (EMAIL_RE.test(s)) emails.push(s);
            }
          }
        }
      }
    }
  }

  // Dedup + validate (case-insensitive)
  const uniq = Array.from(new Set(emails.map(e => e.toLowerCase())))
    .filter(e => EMAIL_RE.test(e));

  return { emails: uniq };
}
