

import * as url from 'url';
import * as path from 'path';

import https from 'https';
import axios from 'axios';

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import readline from 'node:readline';
import { Buffer } from 'node:buffer';

import ejs from 'ejs';
const __dirname = url.fileURLToPath(new URL('.',import.meta.url));
import dotenv from 'dotenv';


import nodemailer from 'nodemailer'
import sequelize from "../config/sequelize.js";
import bcrypt from 'bcryptjs';

import CryptoJS from 'crypto-js';
import crypto from 'node:crypto';

import moment from 'moment-timezone';



import { Calendar ,
 } from "../models/index.js";



// const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
// dotenv.config({ path: path.resolve(process.cwd(), envFile) });



//------------------ hash password and comapare again  ------------------
export const hashPassword = function (password) {    

    const salt = bcrypt.genSaltSync(); 
    return bcrypt.hashSync(password, salt); 
}

export const comparePassword = function (raw,hash) {    
 
    return bcrypt.compareSync(raw, hash)
}

//------------------ Hash Password end ...............................

export function encrypt(text) {
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'kilvishSecureKey12345678901234si';
    
    // Check if the key length is valid
    if (Buffer.from(ENCRYPTION_KEY).length !== 32) {
        throw new Error('Encryption key must be 32 bytes long.');
    }

    const IV_LENGTH = 16; // For AES, this is always 16
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Returning IV and encrypted text
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}
  
  
  // Decrypt Function
 export function decrypt(text) {
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'kilvishSecureKey12345678901234si';
    const IV_LENGTH = 16; // For AES, this is always 16

    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }




export function encrypt64(plainText) {
    // AES Encryption
    const encrypted = CryptoJS.AES.encrypt(plainText, process.env.ENCRYPTION_SECRET_KEY).toString();
    
    return encrypted; // Returns the encrypted string
  }
  
 
 
export function decrypt64(encryptedText) {

// AES Decryption
const bytes = CryptoJS.AES.decrypt(encryptedText, process.env.ENCRYPTION_SECRET_KEY);
const decrypted = bytes.toString(CryptoJS.enc.Utf8);

  return decrypted;  // Returns the decrypted string
}



export function maskName(s=''){ if(!s) return ''; const a=s.trim(); if(a.length<=2) return a[0]+'*'; return a.slice(0,2)+'****'+a.slice(-2); }
export function maskRef(s=''){ const str=String(s||''); if(str.length<=3) return '***'; return str.slice(0,2)+'****'+str.slice(-2); }





   // Optional: light utility – treat axios calls as AJAX
export const isAjax = (req) =>
  req.xhr ||
  (req.headers['x-requested-with'] === 'XMLHttpRequest') ||
  (req.headers.accept && req.headers.accept.includes('application/json'));





export function safeJson(data) {
  // JSON → then escape characters that can break out of <script> or break JS parsing
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')   // prevents </script> close-tag
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')   // defense-in-depth for HTML entities
    .replace(/\u2028/g, '\\u2028') // JS line separator
    .replace(/\u2029/g, '\\u2029'); // JS paragraph separator
}

export function parseJsonSafe(v, fallback = null) {
  try {
    if (v && typeof v === 'string') return JSON.parse(v);
    if (v && typeof v === 'object') return v;
    return fallback;
  } catch { return fallback; }
}




//================== Brand ========================

export const DEFAULT_LOGO_PATH   = path.resolve(process.cwd(), 'public/superadminassets/img/logo.png');
export const DEFAULT_LOGO_PUBLIC = '/superadminassets/img/logo.png';         // served by express static
export const DEFAULT_LOGO_URL    = 'https://82.112.238.22:3037/superadminassets/img/logo.png';
export const ORG_NAME            = process.env.ORG_NAME || 'Elaw Service';

let EMBED_LOGO = null;     // null = not attempted; '' = not available; 'data:image/...'
let PUBLIC_URL = DEFAULT_LOGO_URL;
let LOGO_MIME  = 'image/png';

(function initBrandOnce(){
  try {
    if (fs.existsSync(DEFAULT_LOGO_PATH)) {
      PUBLIC_URL = DEFAULT_LOGO_PUBLIC;
      const buf = fs.readFileSync(DEFAULT_LOGO_PATH);
      const ext = DEFAULT_LOGO_PATH.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
      LOGO_MIME  = ext === 'png' ? 'image/png' : 'image/jpeg';
      EMBED_LOGO = `data:image/${ext};base64,${buf.toString('base64')}`;  // for web/PDF
    } else {
      EMBED_LOGO = '';  // will fall back to DEFAULT_LOGO_URL
      PUBLIC_URL = DEFAULT_LOGO_URL;
    }
  } catch {
    EMBED_LOGO = '';
    PUBLIC_URL = DEFAULT_LOGO_URL;
  }
})();

/** Generic brand for web/PDF use. */
export function getBrand() {
  return {
    name: ORG_NAME,
    logoUrl: PUBLIC_URL,           // web-accessible URL
    embedLogo: EMBED_LOGO || null, // data-URL for PDF where possible
  };
}

/**
 * Build email-safe brand context:
 * - Uses a CID image when the local file exists (best for Gmail/Outlook).
 * - Falls back to data-URL (embedLogo) or absolute URL if file missing.
 *
 * Returns: { org, logoSrc, attachments }
 *  - org:      { name, logoUrl, embedLogo }
 *  - logoSrc:  'cid:brandlogo' | data-URL | absolute URL
 *  - attachments: [ { filename, path, cid, contentType, contentDisposition:'inline' } ] or []
 */
export function getBrandEmailContext() {
  const org = getBrand();
  const attachments = [];

  if (fs.existsSync(DEFAULT_LOGO_PATH)) {
    attachments.push({
      filename: path.basename(DEFAULT_LOGO_PATH),
      path: DEFAULT_LOGO_PATH,
      cid: 'brandlogo',                    // <img src="cid:brandlogo">
      contentType: LOGO_MIME,
      contentDisposition: 'inline',        // reduce “extra attachment” view
    });
    return { org, logoSrc: 'cid:brandlogo', attachments };
  }

  // No local file? Fall back in order: data-URL -> absolute URL
  if (org.embedLogo) return { org, logoSrc: org.embedLogo, attachments };
  return { org, logoSrc: DEFAULT_LOGO_URL, attachments };
}

//================== Brand ========================


export function getHttpsAgent() {
  // In production, enforce proper cert validation
  if (process.env.NODE_ENV === 'production') {
    return new https.Agent({ rejectUnauthorized: true });
  }

  // In dev/uat, allow self-signed certs
  return new https.Agent({ rejectUnauthorized: false });
}


export function mergeOrderMeta(currentMeta, patch) {
  let meta = {};
  try { meta = currentMeta && typeof currentMeta === 'object' ? currentMeta : {}; }
  catch { meta = {}; }
  return { ...meta, ...patch };
}



export const safeTrim = v => (typeof v === 'string' ? v.trim() : v);
export const iso2 = c => (String(c||'').trim().slice(0,2).toUpperCase() || null);


// ===== Flexible date normalization (any → "YYYY-MM-DD") =====
/**
 * Try our known formats first (strict), then fall back to moment's parser (non-strict).
 * Returns "YYYY-MM-DD" or null if invalid.
 * tz is used for interpretation of ambiguous non-ISO inputs (e.g., "03/04/2025").
 */




// ===== DEBUG SWITCHES =====
const DBG_TZ = true;
const dlog = (...args) => { if (DBG_TZ) console.log('[TZDBG]', ...args); };

const DEFAULT_TZ = (process.env.APP_TZ || 'UTC').trim();

// Accept only valid IANA tz strings; fallback to DEFAULT_TZ → 'UTC'
function safeTz(tz) {
  const orig = tz;
  const s = (typeof tz === 'string') ? tz.trim() : '';
  if (s && moment.tz.zone(s)) {
    dlog('safeTz OK:', { in: orig, picked: s });
    return s;
  }
  if (moment.tz.zone(DEFAULT_TZ)) {
    dlog('safeTz FALLBACK_DEFAULT:', { in: orig, picked: DEFAULT_TZ });
    return DEFAULT_TZ;
  }
  dlog('safeTz FALLBACK_UTC:', { in: orig, picked: 'UTC' });
  return 'UTC';
}



export function toISODateFlexible(input, tz = 'America/Jamaica') {
  dlog('toISODateFlexible: start', { rawInput: input, rawTz: tz, typeOfTz: typeof tz });
  tz = safeTz(tz);

  if (input == null || input === '') {
    dlog('toISODateFlexible: null/empty → null');
    return null;
  }

  // ✅ Fast-paths for Date / moment
  if (input instanceof Date) {
    try {
      const m = moment(input).tz(tz);
      const out = m.isValid() ? m.format('YYYY-MM-DD') : null;
      dlog('toISODateFlexible: Date instance', { tz, out });
      return out;
    } catch (e) {
      console.log('toISODateFlexible: Date instance ERROR', { tz, e: String(e) });
      return null;
    }
  }
  if (moment.isMoment?.(input)) {
    try {
      const m = input.clone().tz(tz);
      const out = m.isValid() ? m.format('YYYY-MM-DD') : null;
      dlog('toISODateFlexible: moment instance', { tz, out });
      return out;
    } catch (e) {
      console.log('toISODateFlexible: moment instance ERROR', { tz, e: String(e) });
      return null;
    }
  }

  const s = String(input).trim();

  // Already ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    dlog('toISODateFlexible: already ISO', { s, tz });
    return s;
  }

  // Pure 8 digits → assume YYYYMMDD
  if (/^\d{8}$/.test(s)) {
    const out = `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
    dlog('toISODateFlexible: compact YYYYMMDD', { s, out, tz });
    return out;
  }

  // Epoch seconds/ms
  if (/^\d{10,13}$/.test(s)) {
    const num = Number(s);
    const ms = s.length === 13 ? num : num * 1000;
    try {
      const m = moment(ms).tz(tz); // ← safer than moment.tz(ms, tz)
      const out = m.isValid() ? m.format('YYYY-MM-DD') : null;
      dlog('toISODateFlexible: epoch', { s, ms, tz, out });
      return out;
    } catch (e) {
      console.log('toISODateFlexible: epoch ERROR', { s, ms, tz, e: String(e) });
      return null;
    }
  }

  // Strict known formats (order matters)
  const STRICT_FORMATS = [
    // ISO-ish
    'YYYY-MM-DD','YYYY/MM/DD',
    // Day-first
    'DD-MM-YYYY','DD/MM/YYYY','D-M-YYYY','D/M/YYYY',
    // Month-first
    'MM-DD-YYYY','MM/DD/YYYY','M-D-YYYY','M/D-YYYY',
    // Compact & textual
    'YYYYMMDD',
    'D MMM YYYY','DD MMM YYYY','D-MMM-YYYY','DD-MMM-YYYY',
    'YYYY-MMM-D','YYYY-MMM-DD'
  ];

  try {
    // Strict parse with formats and tz
    let m = moment.tz(s, STRICT_FORMATS, tz, true);
    if (m.isValid()) {
      const out = m.format('YYYY-MM-DD');
      dlog('toISODateFlexible: strict OK', { s, tz, out });
      return out;
    }

    // Loose parse fallbacks
    m = moment.parseZone(s);
    if (!m.isValid()) m = moment(s).tz(tz); // ← avoid moment.tz(s, tz) edge case
    const out = m.isValid() ? m.format('YYYY-MM-DD') : null;
    dlog('toISODateFlexible: loose parse', { s, tz, out });
    return out;
  } catch (e) {
    console.log('toISODateFlexible: parse ERROR', { s, tz, e: String(e) });
    return null;
  }
}


export function toYYYYMMDDFlexible(input, tz = 'America/Jamaica') {
  dlog('toYYYYMMDDFlexible: start', { input, tz, typeOfTz: typeof tz });
  tz = safeTz(tz);
  const iso = toISODateFlexible(input, tz);
  const out = iso ? iso.replace(/-/g, '') : null;
  dlog('toYYYYMMDDFlexible: out', { iso, out, tz });
  return out;
}

export function toYYYYMMDD(input, tz = 'America/Jamaica') {
  dlog('toYYYYMMDD (alias): start', { input, tz, typeOfTz: typeof tz });
  tz = safeTz(tz);
  return toYYYYMMDDFlexible(input, tz);
}

export function toHumanDateTime(input, tz = 'America/Jamaica') {
  dlog('toHumanDateTime: start', { input, tz, typeOfTz: typeof tz });
  tz = safeTz(tz);
  if (!input) {
    dlog('toHumanDateTime: no input → null');
    return null;
  }

  const iso = toISODateFlexible(input, tz);
  if (!iso) {
    dlog('toHumanDateTime: iso null → null', { input, tz });
    return null;
  }

  try {
    const m = moment.tz(input, tz);
    if (!m.isValid()) {
      dlog('toHumanDateTime: invalid moment → return ISO only', { input, tz, iso });
      return iso;
    }
    const out = m.format('YYYY-MM-DD hh:mm A');
    dlog('toHumanDateTime: OK', { input, tz, out });
    return out;
  } catch (e) {
    console.log('toHumanDateTime: ERROR', { input, tz, e: String(e) });
    return iso;
  }
}



//======= Calender Gate ==============


// Get YYYY-MM-DD for "today" in a given IANA timezone
function tzTodayISO(tz = 'UTC') {
  // en-CA => YYYY-MM-DD
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const y = parts.find(p => p.type === 'year')?.value;
  const m = parts.find(p => p.type === 'month')?.value;
  const d = parts.find(p => p.type === 'day')?.value;
  return `${y}-${m}-${d}`;
}

function dayNameFromISO(ymd) {
  // Using local server clock for day-of-week name is fine since you store ymd (no time)
  const wd = new Date(ymd + 'T00:00:00').getDay(); // 0..6
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][wd];
}

/**
 * Server-side gate for a single date.
 * Returns:
 *  { ok: true,  reason:'OK',          message:'Allowed', timezone, today }
 *  { ok: false, reason:'PAST',        message:'Cannot select a past date. Earliest available is 2025-09-10', timezone, today }
 *  { ok: false, reason:'BLACKOUT',    message:'Closed: New Year’s Day (2025-01-01)', holiday:{...}, timezone, today }
 *  { ok: false, reason:'CLOSED_DAY',  message:'Selected date (Sunday) is closed per calendar', day_name:'Sunday', timezone, today }
 */
export async function isDateAllowedServer(ymd) {
  const cal = await Calendar.findOne({ order: [['calendar_id','ASC']] });
  if (!cal) {
    return { ok: true, reason: 'OK', message: 'Allowed', timezone: 'UTC', today: tzTodayISO('UTC') };
  }

  const tz = cal.timezone || 'America/Jamaica';
  const todayTZ = tzTodayISO(tz);
  const dayName = dayNameFromISO(ymd);

  const wd = cal.working_days || {};
  const isWorking = !!wd[dayName]; // admin controls any day open/closed

  const holidays = Array.isArray(cal.holidays) ? cal.holidays : [];
  const extraOpen = Array.isArray(cal.extra_open_days) ? cal.extra_open_days : [];

  const holiday = holidays.find(h => h?.blackout_date === ymd);

  // 1) Explicit holiday/blackout wins (even if working_days says open)
  if (holiday) {
    const desc = String(holiday.description || 'Holiday / Blackout').trim();
    return {
      ok: false,
      reason: 'BLACKOUT',
      message: `Closed: ${desc} (${holiday.blackout_date})`,
      holiday,
      timezone: tz,
      today: todayTZ
    };
  }

  // 2) Calendar working days (but allow admin overrides in extra_open_days)
  const isOverrideOpen = extraOpen.includes(ymd);
  if (!isWorking && !isOverrideOpen) {
    return {
      ok: false,
      reason: 'CLOSED_DAY',
      message: `Selected date (${dayName}) is closed per calendar.`,
      day_name: dayName,
      timezone: tz,
      today: todayTZ
    };
  }

  // 3) Past date (in calendar timezone)
  if (ymd < todayTZ) {
    return {
      ok: false,
      reason: 'PAST',
      message: `Cannot select a past date. Earliest available is ${todayTZ}.`,
      timezone: tz,
      today: todayTZ
    };
  }

  // Allowed
  return { ok: true, reason: 'OK', message: 'Allowed', timezone: tz, today: todayTZ };
}



export const slugify = (s = '') =>
  s.toString()
   .trim()
   .toLowerCase()
   .normalize('NFKD')
   .replace(/[\u0300-\u036f]/g, '')     // remove diacritics
   .replace(/[^a-z0-9]+/g, '-')         // non-alnum -> hyphen
   .replace(/^-+|-+$/g, '')             // trim hyphens
   .substring(0, 180);                  // keep room for uniqueness if needed




export function parsePracticeAreaIds(raw){
  try {
    if (Array.isArray(raw)) return raw.map(Number).filter(Boolean);
    if (typeof raw === 'string') {
      // allow JSON array or comma list
      if (raw.trim().startsWith('[')) {
        return JSON.parse(raw).map(Number).filter(Boolean);
      }
      return raw.split(',').map(s => Number(s.trim())).filter(Boolean);
    }
    return [];
  } catch {
    return [];
  }
}


