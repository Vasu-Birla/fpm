// controllers/otpController.js
import { Op } from 'sequelize';
import sequelize from '../config/sequelize.js';
import { decrypt64 } from '../helper/helper.js';
import { createOtp, verifyOtp } from '../utils/otpService.js'; // your core OTP utils
import { send_login_otp_email } from '../utils/emailhelper.js';
import { Audit } from '../utils/auditLogger.js';

import { kilError  } from '../utils/kilError.js';

const DEV = process.env.NODE_ENV !== 'production';

import { rsaDecryptBase64 } from '../utils/rsa.js';

export const send_register_otp = async (req, res) => {
  let { email, country_code, contact, purpose = 'register' } = req.body || {};
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  let t;


       // 🔐 RSA-OAEP decrypt (async)
              try { if (email)    email    = await rsaDecryptBase64(email);    } catch {}
              try { if (country_code) country_code = await rsaDecryptBase64(country_code); } catch {}
               try { if (contact)    contact    = await rsaDecryptBase64(contact);    } catch {}


  try {
    if (!email && !(country_code && contact)) {
      return res.status(400).json({ success:false, message:'Email or (country_code + contact) is required' });
    }

    t = await sequelize.transaction();

    // Reject if already registered (FirmStaff OR Customer—adjust as you prefer)
    if (email) {
      const exists = await FirmStaff.findOne({ where: { email }, transaction:t });
      if (exists) { await t.rollback(); return res.status(409).json({ success:false, message:'Email already registered' }); }
    } else {
      const exists = await FirmStaff.findOne({ where: { country_code, contact }, transaction:t });
      if (exists) { await t.rollback(); return res.status(409).json({ success:false, message:'Phone already registered' }); }
    }

    const channel = email ? 'email' : 'sms';

    // 30s resend cooldown
    const recent = await createOtp.findRecentPending?.({
      purpose, channel, email, country_code, contact, cooldownMs: 30_000, transaction: t
    }); // if you don’t have this utility, inline the same query you used in KWE

    if (recent) {
      await t.rollback();
      await Audit.warn({ actorType:'Guest', actorId:null, url:req.originalUrl, action:'OTP_RESEND_RATE_LIMIT',
        description:`Cooldown hit for ${channel}:${email || `${country_code}${contact}`}` });
      return res.status(429).json({ success:false, message:'Please wait a moment before requesting another OTP.' });
    }

    // Create OTP
    const { otp_id, code } = await createOtp({
      req, purpose, actor_type:'Guest', client_account_id: null,
      channel, email: email || null,
      country_code: channel === 'sms' ? country_code : null,
      contact:      channel === 'sms' ? contact      : null,
      ttlMs: 10 * 60 * 1000, max_attempts: 5, transaction: t
    });

    // Deliver
    if (channel === 'email') {
      await send_login_otp_email('User', email, code, baseUrl);
    } else {
      // await sendOTPSMS(`${country_code}${contact}`, code);
    }

    await t.commit();

    await Audit.success({
      actorType:'Guest', actorId:null, url:req.originalUrl,
      action:'OTP_SENT_REGISTER', description:`Signup OTP sent via ${channel}`,
      extra:{ otp_id, channel, destination: email || `${country_code}${contact}` }
    });

    res.json({ success:true, message:`OTP sent successfully${DEV ? ` (${code})` : ''}`, otp_id, ...(DEV ? { otp: code } : {}) });

  } catch (error) {
    try { if (t && !t.finished) await t.rollback(); } catch {}
    await Audit.failed({ actorType:'Guest', actorId:null, url:req.originalUrl,
      action:'OTP_SEND_REGISTER_ERROR', description: kilError(error) });
    res.status(500).json({ success:false, message:`Internal Server Error -> ${kilError(error)}` });
  }
};

export const verify_register_otp = async (req, res) => {
  try {
    const { otp_id: rawOtpId, otp, email, country_code, contact, purpose='register' } = req.body || {};
    const code = otp;
    if (!code) return res.status(400).json({ success:false, message:'otp_code is required' });
    const haveEmail = !!email;
    const havePhone = !!country_code && !!contact;
    if (!rawOtpId && !haveEmail && !havePhone) {
      return res.status(400).json({ success:false, message:'Provide otp_id OR destination (email or phone).' });
    }

    const channel = haveEmail ? 'email' : 'sms';
    let otp_id = Number(rawOtpId) || null;

    if (!otp_id) {
      // find most recent pending by destination
      const row = await createOtp.findLatestPendingForDestination?.({ purpose, channel, email, country_code, contact });
      if (!row) return res.status(400).json({ success:false, message:'No active OTP found for this destination.' });
      otp_id = row.id;
    }

    const v = await verifyOtp({ req, otp_id, code, consumeOnSuccess: true });
    if (!v.ok) {
      const map = { EXPIRED:'OTP has expired.', LOCKED:'Too many attempts. OTP locked.', INVALID:'Incorrect OTP.', NOT_FOUND:'Invalid OTP.' };
      return res.status(400).json({ success:false, message: map[v.reason] || 'OTP verification failed.' });
    }

    await Audit.success({ actorType:'Guest', actorId:null, url:req.originalUrl,
      action:'OTP_VERIFIED_REGISTER', description:'Signup OTP verified', extra:{ otp_id } });

    res.json({ success:true, message:'OTP verified successfully' });
  } catch (error) {
    await Audit.failed({ actorType:'Guest', actorId:null, url:req.originalUrl,
      action:'OTP_VERIFY_REGISTER_ERROR', description: kilError(error) });
    res.status(500).json({ success:false, message:`Internal Server Error -> ${kilError(error)}` });
  }
};
