// utils/otpService.js
import bcrypt from 'bcryptjs';
import OtpCode from '../models/OtpCode.js';
import { Audit } from '../utils/auditLogger.js';

const SALT_ROUNDS = 8;
const DEFAULT_TTL_MS = 10 * 60 * 1000;

function getCtx(req){
  return {
    req_id: req?.reqId || null,
    ip:     req?.headers?.['x-forwarded-for']?.split(',')[0] || req?.socket?.remoteAddress || null,
    ua:     req?.headers?.['user-agent'] || null,
  };
}


export const hashOtp = function (Otp) {    

    const salt = bcrypt.genSaltSync(); 
    return bcrypt.hashSync(Otp, salt); 
}

export const compareOtp = function (raw,hash) {    
 
    return bcrypt.compareSync(raw, hash)
}


export function generateNumericOtp(len = 6) {
  return Math.floor(Math.random() * 10 ** len).toString().padStart(len, '0');
}

export async function createOtp({
  req,
  purpose = 'login',
  actor_type = 'client',
  client_account_id = null,
  channel = 'email',
  email = null,
  country_code = null,
  contact = null,
  ttlMs = DEFAULT_TTL_MS,
  max_attempts = 5,
  transaction = null,          // <-- NEW
}) {
  const code = generateNumericOtp(6);
  const otp_hash = await hashOtp(code)
  const now = new Date();
  const expire_at = new Date(now.getTime() + ttlMs);
  const { req_id, ip, ua } = getCtx(req);

  const row = await OtpCode.create({
    purpose, actor_type, client_account_id,
    channel, email, country_code, contact,
    otp_hash,
    status: 'pending',
    attempts: 0,
    max_attempts,
    resend_count: 0,
    last_sent_at: now,
    created_at: now,
    expire_at,
    req_id, ip, ua,
  }, { transaction });          // <-- use the SAME tx if provided

  await Audit.success({
    actorType: actor_type, actorId: client_account_id, url: req?.originalUrl,
    action: 'OTP_CREATED',
    description: `OTP created for purpose=${purpose} via ${channel}`,
    extra: { otp_id: row.id, email, contact },
  });

  return { otp_id: row.id, code };
}

export async function verifyOtp({ req, otp_id, code, consumeOnSuccess = true, transaction = null }) {
  const row = await OtpCode.findByPk(otp_id, { transaction });
  if (!row) return { ok: false, reason: 'NOT_FOUND' };

  const now = new Date();
  if (now > new Date(row.expire_at)) {
    await row.update({ status: 'expired' }, { transaction });
    return { ok: false, reason: 'EXPIRED' };
  }

  if (row.attempts >= row.max_attempts) {
    await row.update({ status: 'revoked', last_attempt_at: now }, { transaction });
    return { ok: false, reason: 'LOCKED' };
  }

 

  const match =await compareOtp(String(code || ''),row.otp_hash)
  if (!match) {
    await row.update({ attempts: row.attempts + 1, last_attempt_at: now }, { transaction });
    return { ok: false, reason: 'INVALID', attempts_left: Math.max(0, row.max_attempts - (row.attempts + 1)) };
  }

  if (consumeOnSuccess) {
    await row.update({ status: 'verified', last_attempt_at: now }, { transaction });
  }

  await Audit.success({
    actorType: row.actor_type, actorId: row.client_account_id, url: req?.originalUrl,
    action: 'OTP_VERIFIED',
    description: `OTP verified for purpose=${row.purpose}`,
    extra: { otp_id: row.id, channel: row.channel },
  });

  return { ok: true, otp: row };
}



// more strict 
export async function verifyOtp_strict({
  req,
  otp_id,
  code,
  consumeOnSuccess = true,
  transaction = null,
  expected = {}   // <-- NEW: { purpose, channel, email, country_code, contact }
}) {
  const row = await OtpCode.findByPk(otp_id, { transaction });
  if (!row) return { ok: false, reason: 'NOT_FOUND' };

  const now = new Date();
  if (now > new Date(row.expire_at)) {
    await row.update({ status: 'expired' }, { transaction });
    return { ok: false, reason: 'EXPIRED' };
  }
  if (row.attempts >= row.max_attempts) {
    await row.update({ status: 'revoked', last_attempt_at: now }, { transaction });
    return { ok: false, reason: 'LOCKED' };
  }

  // --- NEW: hard binding ---
  if (expected.purpose && row.purpose !== expected.purpose) {
    return { ok: false, reason: 'MISMATCH_PURPOSE' };
  }
  if (expected.channel && row.channel !== expected.channel) {
    return { ok: false, reason: 'MISMATCH_CHANNEL' };
  }
  if (row.channel === 'email') {
    const a = (row.email || '').trim().toLowerCase();
    const b = (expected.email || '').trim().toLowerCase();
    if (!b || a !== b) return { ok:false, reason:'MISMATCH_DEST' };
  } else if (row.channel === 'sms') {
    const ccA = (row.country_code || '').replace(/\s+/g,'');
    const ccB = (expected.country_code || '').replace(/\s+/g,'');
    const pA  = (row.contact || '').replace(/\D+/g,'');
    const pB  = (expected.contact || '').replace(/\D+/g,'');
    if (!ccB || !pB || ccA !== ccB || pA !== pB) return { ok:false, reason:'MISMATCH_DEST' };
  }
  // -------------------------

  const match = await compareOtp(String(code || ''), row.otp_hash);
  if (!match) {
    await row.update({ attempts: row.attempts + 1, last_attempt_at: now }, { transaction });
    return { ok: false, reason: 'INVALID', attempts_left: Math.max(0, row.max_attempts - (row.attempts + 1)) };
  }

  if (consumeOnSuccess) {
    await row.update({ status: 'verified', last_attempt_at: now }, { transaction });
  }

  await Audit.success({
    actorType: row.actor_type, actorId: row.client_account_id, url: req?.originalUrl,
    action: 'OTP_VERIFIED',
    description: `OTP verified for purpose=${row.purpose}`,
    extra: { otp_id: row.id, channel: row.channel },
  });

  return { ok: true, otp: row };
}

