
import sequelize from "../config/sequelize.js";
import * as url from 'url';
import * as path from 'path';


import fs from 'node:fs';
import fsp from 'node:fs/promises';
import readline from 'node:readline';

import * as crypto from 'node:crypto';

import os from 'os';
import moment from 'moment-timezone';
import ejs from "ejs";

import { Op, col ,Sequelize, fn ,literal ,Transaction  } from 'sequelize';
import jwt from 'jsonwebtoken';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

//=========== Common Import ================

import puppeteer from 'puppeteer';
import { kilError  } from '../utils/kilError.js';

//------ import utils-----------


import {cookieOptions, sendTokenAdminBrowser } from "../utils/jwtToken.js";
import { violatesHistory, updatePasswordWithHistory, getModelsByType } from '../utils/passwordPolicy.js';
import { extractEmailsFromBuffer } from '../utils/excelcsvimporter.js'
import { flashSet ,flashPop } from '../utils/flash.js';
import { kilerrors ,fullErrorString } from '../utils/kilerrors.js';
import { Audit } from '../utils/auditLogger.js';

import { createOtp, verifyOtp } from '../utils/otpService.js';


import {  
  send_login_otp_email,
  send_password_change_email ,send_broadcast_email   } from "../utils/emailhelper.js";



//------ end import utils-----------



import ActiveSessionAdmin from '../models/ActiveSessionAdmin.js';
import LoginAttemptAdmin from '../models/LoginAttemptAdmin.js';



import { hashPassword, comparePassword , decrypt64 ,slugify, isAjax ,parsePracticeAreaIds} from "../helper/helper.js";





import {  Admin ,FAQ, TandC,PandP, 
  Slider, AdminSettings, Role ,Notification , AuditLog 
 ,AdminPasswordHistory ,Calendar, OtpCode,
 Plan,

 } from "../models/index.js";




import { addClientService ,updateClientService } from '../helper/commonService.js';

//import moment from 'moment'; // for relative time display like '5 minutes ago'



import { RecaptchaEnterpriseServiceClient } from "@google-cloud/recaptcha-enterprise";

const projectID = "flash-rock-455113-u5"; // Replace with your actual Google Cloud Project ID
const recaptchaClient = new RecaptchaEnterpriseServiceClient();


import { PutObjectCommand } from '@aws-sdk/client-s3'; // already done in your S3 file
import { s3 } from '../middleware/s3bucketuploader_V3.js';

import { pipeline } from 'stream';
import { promisify } from 'util';

import xlsx from 'xlsx';


import { rsaDecryptBase64 } from '../utils/rsa.js';

//======================== Global Funcitons =======================//




function getServerIp() {
  const ifaces = os.networkInterfaces();
  for (const iface of Object.values(ifaces)) {
    for (const details of iface) {
      if (details.family === 'IPv4' && !details.internal) {
        return details.address; // returns the first non-internal IPv4
      }
    }
  }
  return '127.0.0.1'; // fallback
}


function generateRandomReportId() {
  const randomPart = Math.floor(100000 + Math.random() * 900000); // 6-digit random
  const timestampPart = Date.now().toString().slice(-4); // last 4 digits of timestamp
  return parseInt(`${randomPart}${timestampPart}`);
}


function mask_value(str, maskChar = '*') {
  if (str == null) return '';
  str = String(str);
  const len = str.length;
  if (len === 0) return '';
  if (len === 1) return maskChar;
  if (len === 2) return str[0] + maskChar;
  if (len <= 4) return str[0] + maskChar.repeat(len - 2) + str[len - 1];
  // For emails, keep domain visible
  if (str.includes('@')) {
    const at = str.indexOf('@');
    if (at <= 2) return maskChar.repeat(at) + str.substring(at);
    return str[0] + maskChar.repeat(at - 2) + str[at - 1] + str.substring(at);
  }
  // For other strings: 2 start, 2 end
  return str.slice(0, 2) + maskChar.repeat(len - 4) + str.slice(-2);
}




const pump = promisify(pipeline);
const secureLogPath = path.join(process.cwd(), 'secure-logs', 'auditLogs.txt');



// (optional) actor helper

function deriveActor(req) {
  const admin = req.admin || {};
  return {
    actorType: admin.admin_type === 'superadmin' ? 'superadmin' : (admin.admin_type ? 'subadmin' : 'unknown'),
    actorId: admin.admin_id ?? null,
    actorEmail: admin.email || null,
  };
}


export function deriveActor1(req) {
  const admin = req.admin || {};
  const role = admin.role || null;

  let actorType = 'unknown';

  if (role) {
    const rn = (role.role_name || '').toLowerCase();
    actorType = role.is_system && (rn === 'superadmin' || rn === 'system' || rn === 'owner')
      ? 'superadmin'
      : 'subadmin';
  } else if (admin.admin_type) {
    // legacy fallback
    actorType = admin.admin_type === 'superadmin' ? 'superadmin' : 'subadmin';
  }

  return {
    actorType,
    actorId: admin.admin_id ?? null,
    actorEmail: admin.email || null,
    actorRoleId: role?.role_id ?? null,
    actorRoleName: role?.role_name ?? null,
  };
}

//======================== Global Functions =======================//


import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';





// controllers/superadmin.js
export const upload_asset_page = async (req, res) => {
  const output = flashPop(req, res, 'kwe_msg');
  try {
    res.render('superadmin/upload_asset', {
      output,
      // optional helpful defaults
      defaults: {
        folder: 'images/profiles',
        keyname: 'user.png',
      }
    });
  } catch (e) {
    return res.render('superadmin/error500', { output: `Internal Server Error: ${e.message}` });
  }
};

export const upload_asset_post = async (req, res) => {
  try {
    if (!req.file?.s3Key) {
      return res.status(400).json({ ok:false, message:'No file uploaded' });
    }
    // This PUT will overwrite same key if it already exists (S3 default behavior)
    return res.json({ ok:true, message:'Uploaded', key: req.file.s3Key });
  } catch (e) {
    return res.status(500).json({ ok:false, message:`Internal Server: ${e.message}` });
  }
};

//---- End Upload Assets ---





export const index = async (req, res) => {



   const output = flashPop(req, res, 'elaw_msg');
  try {
   

    res.render('superadmin/index', {output,
      total_clients: 0,
      total_candidates: 0,
      total_clients:0,
      pending_cases: 0,
      inprogress_cases: 0,
      flagged_cases: 0,
      cleared_cases: 0,

      chart_status_data: {
        Pending: 0,
        'In Progress': 0,
        Flagged: 0,
        Cleared: 0
      },
      screening_chart: {
        labels: ['Pending'],
        completed: 0,
        pending: 0
      }
    });

    

  } catch (error) {

    console.error('Dashboard Error:', error);
    const kilerror = kilError(error);
       return res.render('superadmin/error500', { output: `Internal Server: ${kilerror}` });


  }
};



//============= START  SUPERADMIN  LOGIN SECTON ====================



export const login = async (req, res) => {

  const output = flashPop(req, res, 'elaw_msg');
  try {
    return res.render('superadmin/login', { output });
  } catch (error) {
    console.log(error);
    return res.render('superadmin/error500', { output: `Internal Server: ${kilError(error)}` });
  }
};



const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes


export const loginPasswordPost = async (req, res) => {
  console.log('Starting login...', req.body)
  let t;
  try {
    let { email, password, timezone } = req.body || {};

    // For AES Encryption 
    // try { if (email)    email    = decrypt64(email);    } catch {}
    // try { if (password) password = decrypt64(password); } catch {}

      
        // 🔐 RSA-OAEP decrypt (async)
        try { if (email)    email    = await rsaDecryptBase64(email);    } catch {}
        try { if (password) password = await rsaDecryptBase64(password); } catch {}
    

    email = (email || '').trim();
    password = (password || '').trim();

    if (!email || !password) {
      const msg = 'Please enter email and password.';
      return isAjax(req) ? res.status(400).json({ success:false, message: msg })
                         : res.render('superadmin/login', { output: msg });
    }

    // Fetch admin (no lock here)
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      const msg = 'Invalid email or password.';
      return isAjax(req) ? res.status(401).json({ success:false, message: msg })
                         : res.render('superadmin/login', { output: msg });
    }

    if (String(admin.status).toLowerCase() !== 'active') {
      const msg = `Your Account is ${admin.status} and can not be logged-in.`;
      return isAjax(req) ? res.status(200).json({ success:false, message: msg })
                         : res.render('superadmin/login', { output: msg });
    }

    if (!admin.password) {
      const msg = 'Password login not set for this admin.';
      return isAjax(req) ? res.status(401).json({ success:false, message: msg })
                         : res.render('superadmin/login', { output: msg });
    }

    // ----- attempts/lockout with row locking
    t = await sequelize.transaction();
    try {
      // lock the attempts row
      let attempt = await LoginAttemptAdmin.findOne({
        where: { admin_id: admin.admin_id },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      // active lockout?
      if (attempt?.lockout_until && new Date(attempt.lockout_until) > new Date()) {
        const remainingMin = Math.ceil((new Date(attempt.lockout_until) - Date.now()) / 60000);
        await t.commit(); // nothing else to change
        await Audit.denied({
          actorType: admin.admin_type || 'admin',
          actorId: admin.admin_id,
          url: req.originalUrl,
          action: 'ADMIN_LOGIN_LOCKED',
          description: `Locked; ${remainingMin}m left for ${email}`
        });
        const msg = `Account locked. Try again after ${remainingMin} minute(s).`;
        return isAjax(req) ? res.status(200).json({ success:false, message: msg })
                           : res.render('superadmin/login', { output: msg });
      }

      // password check
      const ok = await comparePassword(password, admin.password);

      if (!ok) {
        const nextAttempts = (attempt ? attempt.attempts : 0) + 1;
        let lockout_until = null;

        if (nextAttempts >= MAX_ATTEMPTS) {
          lockout_until = new Date(Date.now() + LOCKOUT_DURATION_MS);
          await Audit.denied({
            actorType: admin.admin_type || 'admin',
            actorId: admin.admin_id,
            url: req.originalUrl,
            action: 'ADMIN_LOGIN_LOCKED',
            description: `Exceeded attempts for ${email} until ${lockout_until.toISOString()}`
          });
        }

        if (attempt) {
          await attempt.update(
            { attempts: nextAttempts, last_attempt: new Date(), lockout_until },
            { transaction: t }
          );
        } else {
          await LoginAttemptAdmin.create(
            { admin_id: admin.admin_id, attempts: nextAttempts, last_attempt: new Date(), lockout_until },
            { transaction: t }
          );
        }

        await t.commit();

        await Audit.denied({
          actorType: admin.admin_type || 'admin',
          actorId: admin.admin_id,
          url: req.originalUrl,
          action: 'ADMIN_LOGIN_PW_INVALID',
          description: `Invalid password for ${email}. Attempts=${nextAttempts}/${MAX_ATTEMPTS}`
        });

        const msg = lockout_until
          ? `Account locked. Try again after ${Math.ceil(LOCKOUT_DURATION_MS/60000)} minute(s).`
          : 'Invalid email or password.';
        return isAjax(req) ? res.status(401).json({ success:false, message: msg })
                           : res.render('superadmin/login', { output: msg });
      }

      // password OK → clear attempts
      if (attempt && (attempt.attempts > 0 || attempt.lockout_until)) {
        await attempt.update({ attempts: 0, lockout_until: null }, { transaction: t });
      }
      await t.commit();

    } catch (e) {
      try { if (!t.finished) await t.rollback(); } catch {}
      throw e;
    }

    // ----- two-step verification flow
    if (admin.two_step_verification === 'On') {
      const { otp_id, code } = await createOtp({
        req,
        purpose: 'login_2fa',
        actor_type: admin.admin_type || 'superadmin',
        customer_id: null,
        channel: 'email',
        email: admin.email,
        ttlMs: 10 * 60 * 1000,
        max_attempts: 5,
      });

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const name = `${admin.first_name||''} ${admin.last_name||''}`.trim() || 'Admin';
      await send_login_otp_email(name, admin.email, code, baseUrl);

      return res.status(200).json({
        success: true,
        two_step: true,
        otp_id,
        message: 'Enter the OTP sent to your email to complete login.'
      });
    }

    // ----- complete login (2SV OFF): clear sessions, update timezone in tx
    const t2 = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    try {
      await ActiveSessionAdmin.destroy({ where: { admin_id: admin.admin_id }, transaction: t2 });
      if (timezone && timezone !== admin.timezone) {
        admin.timezone = timezone;
        await admin.save({ transaction: t2 });
      }
      await t2.commit();
    } catch (e2) {
      try { if (!t2.finished) await t2.rollback(); } catch {}
      throw e2;
    }

    await Audit.success({
      actorType: admin.admin_type, actorId: admin.admin_id, url:req.originalUrl,
      action:'ADMIN_LOGIN_SUCCESS_PASSWORD', description:`Password login ok for ${email}`
    });

    return await sendTokenAdminBrowser(admin, 200, res, req);

  } catch (error) {
    console.log(error);
    await Audit.failed({ actorType:'admin', actorId:null, url:req.originalUrl, action:'ADMIN_LOGIN_PW_ERROR', description: kilError(error) });
    const msg = `Internal Server: ${kilError(error)}`;
    return isAjax(req) ? res.status(500).json({ success:false, message: msg })
                       : res.cookie('elaw_msg', msg).redirect('/superadmin/login');
  }
};

        // 2FA VERIFY for password login (email)     
      export const loginPassword2faVerifyPost = async (req, res) => {
        let t;
        try {
          let { email, otp, otp_id, timezone } = req.body || {};


          // For AES encryption 
          // try { if (email) email = decrypt64(email); } catch {}
          // try { if (otp)   otp   = decrypt64(otp);   } catch {}



          //  For  RSA encrytpion 
        try { if (email)    email    = await rsaDecryptBase64(email);    } catch {}
        try { if (otp) otp = await rsaDecryptBase64(otp); } catch {}

          email = (email || '').trim();
          otp   = (otp || '').trim();
          const id = Number(otp_id) || null;

          if (!email || !otp) {
            return res.status(400).json({ success:false, message:'Email and OTP required' });
          }

          const admin = await Admin.findOne({ where: { email } });
          if (!admin) return res.status(404).json({ success:false, message:'Account not found' });
          if (String(admin.status).toLowerCase() !== 'active') {
            return res.status(200).json({ success:false, message:`Your Account is ${admin.status} and can not be logged-in.` });
          }

          // resolve latest pending OTP
          let resolvedOtpId = id;
          if (!resolvedOtpId) {
            const row = await OtpCode.findOne({
              where:{
                purpose:'login_2fa',
                channel:'email',
                email,
                status:'pending',
                expire_at:{ [Op.gt]: new Date() },
              },
              order:[['id','DESC']]
            });
            if (!row) return res.status(400).json({ success:false, message:'OTP not found or expired' });
            resolvedOtpId = row.id;
          }

          const v = await verifyOtp({ req, otp_id: resolvedOtpId, code: otp, consumeOnSuccess:true });
          if (!v.ok) {
            let msg = 'OTP verification failed.';
            if (v.reason === 'EXPIRED') msg = 'OTP has expired.';
            else if (v.reason === 'LOCKED') msg = 'Too many attempts. Try again later.';
            else if (v.reason === 'INVALID') msg = 'Incorrect OTP.';
            await Audit.denied({
              actorType: admin.admin_type, actorId: admin.admin_id, url:req.originalUrl,
              action:'ADMIN_LOGIN_2FA_FAILED', description:`reason=${v.reason||'UNKNOWN'}`
            });
            return res.status(400).json({ success:false, message: msg });
          }

          // post-login mutations atomically
          t = await sequelize.transaction();
          try {
            await ActiveSessionAdmin.destroy({ where:{ admin_id: admin.admin_id }, transaction: t });
            if (timezone && timezone !== admin.timezone) {
              admin.timezone = timezone;
              await admin.save({ transaction: t });
            }
            await t.commit();
          } catch (e) {
            try { if (!t.finished) await t.rollback(); } catch {}
            throw e;
          }

          await Audit.success({
            actorType: admin.admin_type, actorId: admin.admin_id, url:req.originalUrl,
            action:'ADMIN_LOGIN_SUCCESS_PASSWORD_2FA', description:`2FA ok for ${email}`
          });

          return await sendTokenAdminBrowser(admin, 200, res, req);

        } catch (error) {
          console.log(error);
          await Audit.failed({ actorType:'admin', actorId:null, url:req.originalUrl, action:'ADMIN_LOGIN_PW_2FA_ERROR', description: kilError(error) });
          const msg = `Internal Server: ${kilError(error)}`;
          return res.status(500).json({ success:false, message: msg });
        }
      };

      // SEND LOGIN OTP (2FA resend) & FORGOT (reset_password)
      export const send_login_otp = async (req, res) => {
        const { email, country_code, contact, type = 'Admin', purpose = 'reset_password' } = req.body || {};
        const baseUrl = `${req.protocol}://${req.get('host')}`;

        let t;
        try {
          if (!['Admin','Customer'].includes(type)) {
            return res.status(400).json({ success:false, message:'Valid type required: Admin or Customer' });
          }
          if (!email && !(country_code && contact)) {
            return res.status(400).json({ success:false, message:'Email or (country_code + contact) is required' });
          }

          t = await sequelize.transaction();

          const whereUser = email ? { email } : { country_code, contact };
          const Model = (type === 'Admin') ? Admin : Customer;
          const user = await Model.findOne({ where: whereUser, transaction: t });

          if (!user) {
            await t.rollback();
            return res.status(200).json({ success:false, message:`${type} not found` });
          }

          if (String(user.status).toLowerCase() !== 'active') {
            await t.rollback();
            return res.status(200).json({ success:false, message:`Your Account is ${user.status} and can not be logged-in.` });
          }

          const actorType = (type === 'Admin') ? (user?.admin_type ?? 'admin') : (user?.customer_type ?? 'customer');
          const actorId   = (type === 'Admin') ? (user?.admin_id ?? null) : (user?.customer_id ?? null);
          const channel   = email ? 'email' : 'sms';

          // cooldown (30s)
          const recent = await OtpCode.findOne({
            where:{
              purpose,
              channel,
              status:'pending',
              expire_at:{ [Op.gt]: new Date() },
              ...(email ? { email } : { country_code, contact }),
              last_sent_at: { [Op.gt]: new Date(Date.now() - 30 * 1000) },
            },
            order:[['id','DESC']],
            transaction: t
          });
          if (recent) {
            await t.rollback();
            await Audit.warn({
              actorType, actorId, url:req.originalUrl,
              action:'OTP_RESEND_RATE_LIMIT',
              description:`Cooldown hit for ${channel}:${email || `${country_code}${contact}`}`
            });
            return res.status(429).json({ success:false, message:'Please wait a moment before requesting another OTP.' });
          }

          const { otp_id, code } = await createOtp({
            req,
            purpose,
            actor_type: actorType,
            customer_id: (type === 'Admin') ? null : user.customer_id ?? null,
            channel,
            email: email || null,
            country_code: channel === 'sms' ? country_code : null,
            contact: channel === 'sms' ? contact : null,
            ttlMs: 10 * 60 * 1000,
            max_attempts: 5,
            transaction: t
          });

          const name = `${user.first_name||''} ${user.last_name||''}`.trim() || (type==='Admin' ? 'Admin' : 'Customer');
          if (channel === 'email') {
            await send_login_otp_email(name, email, code, baseUrl);
          } else {
            // integrate SMS vendor if needed
            // await sendOTPSMS(`${country_code}${contact}`, code);
          }

          await t.commit();

          await Audit.success({
            actorType, actorId, url:req.originalUrl,
            action:'OTP_SENT',
            description:`OTP sent for purpose=${purpose} via ${channel}`,
            extra:{ otp_id, channel, destination: email || `${country_code}${contact}` }
          });

          return res.status(200).json({
            success: true,
            message: `OTP Sent Successfully ${code}`,
            otp_id
          });

        } catch (error) {
          console.log(error);
          try { if (t && !t.finished) await t.rollback(); } catch {}
          await Audit.failed({
            actorType:'unknown', actorId:null, url:req.originalUrl,
            action:'OTP_SEND_ERROR', description: kilError(error)
          });
          return res.status(500).json({ success:false, message:`Internal Server: ${kilError(error)}` });
        }
      };


            //FORGOT PASSWORD → RESET (Admin)
          export const resetPasswordPost = async (req, res) => {
            console.log('Starting reset --> ', req.body)
            let t;
            try {
              let { email, otp, otp_id, new_password, confirm_password, timezone } = req.body || {};


              //---- AES encryption ----------
              // try { if (email)            email            = decrypt64(email); } catch {}
              // try { if (otp)              otp              = decrypt64(otp); } catch {}
              // try { if (new_password)     new_password     = decrypt64(new_password); } catch {}
              // try { if (confirm_password) confirm_password = decrypt64(confirm_password); } catch {}



         // 🔐 RSA-OAEP decrypt (async)
        try { if (email)    email    = await rsaDecryptBase64(email);    } catch {}
        try { if (otp) otp = await rsaDecryptBase64(otp); } catch {}
        try { if (new_password)    new_password    = await rsaDecryptBase64(new_password);    } catch {}
        try { if (confirm_password) confirm_password = await rsaDecryptBase64(confirm_password); } catch {}





              email = (email || '').trim();
              otp   = (otp   || '').trim();
              new_password     = (new_password || '').trim();
              confirm_password = (confirm_password || '').trim();


                   console.log(' 222 --> ',email)

              if (!email || !otp || !new_password || !confirm_password) {
                const msg = 'Please fill email, OTP, new password and confirm password.';
                return isAjax(req) ? res.status(400).json({ success:false, message: msg })
                                  : res.render('superadmin/login', { output: msg });
              }
              if (new_password !== confirm_password) {
                const msg = 'Password and confirm password do not match.';
                return isAjax(req) ? res.status(400).json({ success:false, message: msg })
                                  : res.render('superadmin/login', { output: msg });
              }


                  console.log(' 3333 --> ',new_password)

              t = await sequelize.transaction();

              const admin = await Admin.findOne({ where:{ email }, transaction: t, lock: t.LOCK.UPDATE });


                console.log(' 44 admind --> ',admin)
              if (!admin) {

                 console.log(' 55 anot found ad dmind --> ')
                await t.rollback();
                const msg = 'Account not found.';
                await Audit.denied({ actorType:'admin', actorId:null, url:req.originalUrl, action:'ADMIN_RESET_PW_STAFF_NOT_FOUND', description:`email=${email}` });
                return isAjax(req) ? res.status(404).json({ success:false, message: msg })
                                  : res.render('superadmin/login', { output: msg });
              }
              if (String(admin.status).toLowerCase() !== 'active') {
                await t.rollback();
                const msg = `Your Account is ${admin.status} and cannot reset password.`;
                return isAjax(req) ? res.status(200).json({ success:false, message: msg })
                                  : res.render('superadmin/login', { output: msg });
              }

              // resolve latest pending OTP if not provided
              let resolvedOtpId = Number(otp_id) || null;
              if (!resolvedOtpId) {
                const row = await OtpCode.findOne({
                  where:{
                    purpose:'reset_password',
                    channel:'email',
                    email,
                    status:'pending',
                    expire_at:{ [Op.gt]: new Date() },
                  },
                  order:[['id','DESC']],
                  transaction:t
                });
                if (!row) {
                  await t.rollback();
                  const msg = 'OTP not found or expired. Please resend OTP.';
                  await Audit.denied({ actorType:'admin', actorId:null, url:req.originalUrl, action:'ADMIN_RESET_PW_NO_ACTIVE_OTP', description:`email=${email}` });
                  return isAjax(req) ? res.status(400).json({ success:false, message: msg })
                                    : res.render('superadmin/login', { output: msg });
                }
                resolvedOtpId = row.id;
              }


              console.log('666')

              // verify OTP (consume)
              const v = await verifyOtp({ req, otp_id: resolvedOtpId, code: otp, consumeOnSuccess: true, transaction: t });

                console.log('777')
              if (!v.ok) {
                await t.rollback();
                let msg = 'OTP verification failed.';
                if (v.reason === 'EXPIRED') msg = 'OTP has expired.';
                else if (v.reason === 'LOCKED') msg = 'Too many attempts. Try again later.';
                else if (v.reason === 'INVALID') msg = 'Incorrect OTP.';
                await Audit.denied({ actorType:'admin', actorId:null, url:req.originalUrl, action:'ADMIN_RESET_PW_OTP_FAILED', description:`reason=${v.reason||'UNKNOWN'}` });
                return isAjax(req) ? res.status(400).json({ success:false, message: msg })
                                  : res.render('superadmin/login', { output: msg });
              }


               
              // password history enforcement & update
              const reused = await violatesHistory({ type:'Admin', user: admin, newPlainPassword: new_password, transaction: t });
              if (reused) {
                await t.rollback();
                const msg = 'You cannot reuse your last 3 passwords.';
                return isAjax(req) ? res.status(400).json({ success:false, message: msg })
                                  : res.render('superadmin/login', { output: msg });
              }

                console.log('888')

              await updatePasswordWithHistory({ type:'Admin', user: admin, newPlainPassword: new_password, transaction: t });

                console.log('999')
              if (timezone && timezone !== admin.timezone) {
                admin.timezone = timezone;
                await admin.save({ transaction: t });
              }

              await t.commit();

              // notify (non-blocking)
              try {
                const baseUrl = `${req.protocol}://${req.get('host')}`;

                      
                await send_password_change_email(`${admin.first_name||''} ${admin.last_name||''}`.trim() || 'Admin', admin.email, baseUrl);
              } catch {}


               console.log('10140  succe sending ')

              await Audit.success({ actorType:'admin', actorId:admin.admin_id, url:req.originalUrl, action:'ADMIN_RESET_PW_SUCCESS', description:`Password reset ok for ${email}` });

              // auto-login after reset
              return await sendTokenAdminBrowser(admin, 200, res, req);

            } catch (error) {
              console.log(error);
              try { if (t && !t.finished) await t.rollback(); } catch {}
              await Audit.failed({ actorType:'admin', actorId:null, url:req.originalUrl, action:'ADMIN_RESET_PW_ERROR', description: kilError(error) });
              const msg = `Internal Server: ${kilError(error)}`;
              return isAjax(req) ? res.status(500).json({ success:false, message: msg })
                                : res.render('superadmin/login', { output: msg });
            }
          };


          export const check_session = async (req, res) => {
            let statusCode = 200;
            let responseData;
            try {
              const { email } = req.body || {};
              if (!email) {
                statusCode = 400;
                responseData = { message: 'Email is required' };
              } else {
                const admin = await Admin.findOne({ where: { email } });
                if (!admin) {
                  statusCode = 404;
                  responseData = { message: 'Admin not found' };
                } else {
                  const exists = !!(await ActiveSessionAdmin.count({ where: { admin_id: admin.admin_id } }));
                  responseData = { exists };
                }
              }
            } catch (error) {
              console.log(error);
              statusCode = 500;
              responseData = { message: `Internal Server: ${kilError(error)}` };
            } finally {
              return res.status(statusCode).json(responseData);
            }
          };


          export const logout = async (req, res) => {
            try {
              const admin_id = req.admin?.admin_id || 0;
              await ActiveSessionAdmin.destroy({ where: { admin_id } });
              req.admin = null;

              res.cookie('elaw_admin_token', '', {
                expires: new Date(Date.now()),
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Lax'
              });

              return res.cookie('elaw_msg', 'Logged out successfully !!').redirect('/superadmin/login');
            } catch (error) {
              console.log(error);
              return res.render('superadmin/error500', { output: `Internal Server: ${kilError(error)}` });
            }
          };





//=========== END SUPER ADMIN LOGIN SECTION ========================




//======================================= START SUPER ADMIN PROFILE ==========================================

export const profile = async (req, res) => {

    const output = flashPop(req, res, 'elaw_msg');
    try {
        res.render('superadmin/profile', { output: output })

    }
    catch (error) {
        console.log(error)
        return res.render('superadmin/error500', { output: 'Internal Server Error' })
    }

}


export const profilePost = async (req, res) => {
    console.log('profile post')
    const transaction = await sequelize.transaction()

    console.log('--> s3bucket files  ', req.files)

    


    const { first_name, last_name ,email ,country_code ,contact , } = req.body;
        const full_contact = `${country_code.trim()}${contact.trim()}`;
    const admin_id = req.admin.admin_id;
   // const image = req.file ? req.file.filename : '';  // multer uploads 
   // const image = req.file ? req.file.location : '';  // s3 bucket V2  


      const  image = req.file ? req.file.location : req.admin.image; // s3 bucket V3

    console.log(req.body)
    try {
        const admin = await Admin.findOne({ where: { admin_id } });

        if (!admin) {
            await transaction.rollback();
            res.cookie('elaw_msg', 'Admin not found');
            return res.redirect('/superadmin/profile');
        }
        admin.first_name = first_name;
        admin.last_name = last_name;

        
        admin.email = email;
          admin.country_code = country_code.trim()
         admin.contact = contact;
          admin.full_contact = full_contact;


         


        // Update image if uploaded
        if (image) {
            admin.image = image;
        }

        await admin.save({ transaction });

        await transaction.commit();





          
             await Audit.success({
      actorType: req.admin.admin_type === 'superadmin' ? 'Superadmin' : 'Subadmin',
      actorId: req.admin.admin_id,
       action: 'Update Profile',
      description: `Profile updated: ${first_name} ${last_name}${image ? ', with new profile image' : ''}`,
    });


         res.cookie('elaw_msg', 'Profile Information Updated Successfully !').redirect('/superadmin/profile')
        //res.redirect('/superadmin/profile')


    }
    catch (error) {
        console.log(error)
            const kilerror = kilError(error);


            
     await Audit.failed({ 
     actorType: req.admin.admin_type === 'superadmin' ? 'Superadmin' : 'Subadmin',
    actorId: req.admin.admin_id,
      url: req.originalUrl, 
       action: 'Update Profile', 
      description: String(error?.message || error) 
    });


          return res.render('superadmin/error500', { output: `Internal Server: ${kilerror}` });
    }

}




export const changePassword = async (req, res) => {
  let { opass, npass, cpass } = req.body;
  const existingPass = req.admin.password;
  const admin_id = req.admin.admin_id;
  const { actorType, actorId } = deriveActor(req);

  try {
    if (!opass || !npass || !cpass) {
      res.cookie('elaw_msg', 'All password fields are required');
      return res.redirect('/superadmin/profile');
    }

    console.log('Changing password  ---> ', req.body)


    //     opass = opass.trim();
    // npass = npass.trim();
    // cpass = cpass.trim();

    // If encrypted on frontend, decrypt:
    // opass = decrypt64(opass.trim());
    // npass = decrypt64(npass.trim());
    // cpass = decrypt64(cpass.trim());


    

         // 🔐 RSA-OAEP decrypt (async)
        try { if (opass)    opass    = await rsaDecryptBase64(opass);    } catch {}
        try { if (npass)    npass    = await rsaDecryptBase64(npass);    } catch {}
        try { if (cpass)    cpass    = await rsaDecryptBase64(cpass);    } catch {}



    // Validate old password
    if (!comparePassword(opass, existingPass)) {


          await Audit.denied({ 
         actorType ,
         actorId,      
         action: 'Change Password',
          description: 'Attempted password change failed due to incorrect old password',
          });

      res.cookie('elaw_msg', 'Old password is incorrect');
      return res.redirect('/superadmin/profile');
    }

    // Match check
    if (npass !== cpass) {
      res.cookie('elaw_msg', 'New password and confirm password do not match');
      return res.redirect('/superadmin/profile');
    }

    // History enforcement: includes current + last 3
    const reused = await violatesHistory({ type: 'Admin', user: req.admin, newPlainPassword: npass });
    if (reused) {
      res.cookie('elaw_msg', 'You cannot reuse your last 3 passwords.');
      return res.redirect('/superadmin/profile');
    }

    // Update password + add to history + nuke sessions + trim to 3
    await updatePasswordWithHistory({ type: 'Admin', user: req.admin, newPlainPassword: npass });

    // Email, cookie, logging
    const userTimeZone = req.admin.timezone || 'UTC';
    const formattedTime = moment().tz(userTimeZone).format('MMMM Do YYYY, h:mm A');
    await send_password_change_email(req.admin.first_name, req.admin.email, formattedTime);

    res.cookie('elaw_admin_token', '', {
      expires: new Date(0), httpOnly: true, sameSite: 'Lax', path: '/superadmin'
    });



       await Audit.success({
      actorType,
      actorId,
      action: 'Change Password',
      description: `Password changed successfully for admin ID ${admin_id}`,
    });

    return res.render('superadmin/login', { output: 'Password changed successfully' });
  } catch (error) {
    console.error('Error:', error);


        await Audit.failed({ actorType, 
      actorId, 
      url: req.originalUrl, 
      action: 'Change Password',
      description: String(error?.message || error) 
    });


    res.cookie('elaw_msg', `Failed to update password: ${error.message}`);
    return res.redirect('/superadmin/profile');
  }
};



export const on_off_multifactor = async (req, res) => {
  const { status, confirm_password } = req.body || {};
  const targetId = req?.admin?.admin_id; // <— **always** from server-side session
  const { actorType, actorId } = deriveActor(req);

  try {
    // 1) Basic input checks
    if (!status) {
      return res.status(400).json({ success:false, msg:'status is required' });
    }
    const allowed = new Set(['On','Off']);
    if (!allowed.has(status)) {
      return res.status(400).json({ success:false, msg:'Invalid status' });
    }

    // 2) Step-up re-authentication (password required)
    if (!confirm_password) {
      return res.status(401).json({ success:false, msg:'Current password confirmation required' });
    }
   // const plain = decrypt64(String(confirm_password).trim());

    const plain = await rsaDecryptBase64(String(confirm_password).trim());


    // Fetch fresh record to validate password
    const admin = await Admin.findOne({ where: { admin_id: targetId }});
    if (!admin) {
      return res.status(404).json({ success:false, msg:'Admin not found' });
    }
    const ok = comparePassword(plain, admin.password);
    if (!ok) {
      await Audit.denied({
        actorType, actorId,
        action: 'Toggle MFA',
        description: 'Password confirmation failed for MFA toggle'
      });
      return res.status(401).json({ success:false, msg:'Incorrect password' });
    }

    // 3) Update in a transaction
    const tx = await sequelize.transaction();
    try {
      const [count] = await Admin.update(
        { two_step_verification: status },
        { where: { admin_id: targetId }, transaction: tx }
      );
      if (!count) {
        await tx.rollback();
        return res.status(404).json({ success:false, msg:'Admin not found' });
      }
      await tx.commit();
    } catch (e) {
      await tx.rollback();
      throw e;
    }

    await Audit.success({
      actorType, actorId,
      action: 'Toggle MFA',
      description: `Two-step verification turned ${status} for self (admin_id=${targetId})`
    });

    return res.json({
      success: true,
      msg: `${status === 'On' ? 'Turning On' : 'Turning Off'} Multi-factor Auth.`,
    });

  } catch (error) {
    console.error('on_off_multifactor error:', error);
    await Audit.failed({
      actorType, actorId,
      url: req.originalUrl,
      action: 'Toggle MFA',
      description: String(error?.message || error)
    });
    return res.status(500).json({ success:false, msg:'Internal Server Error' });
  }
};



// superadmin controller
export const update_admin_pic = async (req, res) => {
  const admin_id = req.admin.admin_id;
  let tx;
  try {
    tx = await sequelize.transaction();

    // store just the key
    const imageKey = req.file?.s3Key || req.admin.image; // if column is `image`
    const [rows] = await Admin.update({ image: imageKey }, { where: { admin_id }, transaction: tx });

    await tx.commit();
    res.json({ msg: 'success' });
  } catch (e) {
    if (tx) await tx.rollback();
    console.error(e);
    res.status(500).send('Internal Server Error');
  }
};







export const update_admin_pic_working = async (req, res, next) => {
  const output = flashPop(req, res, 'elaw_msg');

  
const admin_id = req.admin.admin_id;

    console.log('--> s3bucket files  ', req.files)
      console.log('--> s3bucket files  ', req.file)



  // Start the transaction
  let transaction ;

  try {
    transaction = await sequelize.transaction();
    let image = req.admin.image; // Default to the current image

    // If a new file is uploaded, update the image

 
       image = req.file ? req.file.location : req.admin.image; // S3-compatible


    // Update the image using Sequelize
    const [affectedRows] = await Admin.update(
      { image: image }, // Set the new image
      { 
        where: { admin_id: req.admin.admin_id }, // Where condition
        transaction, // Pass the transaction object
      }
    );

       // store just the key
    const imageKey = req.file?.s3Key || req.admin.image; // if column is `image`
    const [rows] = await Admin.update({ image: imageKey }, { where: { admin_id }, transaction: tx });

    
    if (affectedRows > 0) {


      
      // ✅ Success log
      await logAction({
        actorType: req.admin.admin_type === 'superadmin' ? 'Superadmin' : 'Subadmin',
        actorId: admin_id,
        clientId: null,
        url: req.originalUrl,
        action: 'Update Admin Profile Picture',
        description: `Admin ${req.admin.full_name} updated their profile picture to "${image}"`,
        result: 'Success OK 200'
      });


      // Commit the transaction if the update is successful
      await transaction.commit();
      res.json({ msg: "success" });
    } else {
      // If no rows were updated, rollback the transaction and return an error message
      if (transaction) await transaction.rollback(); 
      res.status(400).send('No rows updated.');
    }

  } catch (error) {
    console.error('Error:', error);
    if (transaction) await transaction.rollback(); 
    res.status(500).send('Internal Server Error');
  }
};





//=========================== Admin Profile Section END ===================================










//============================= Role Management ===============================//


export const role_mgmt = async (req, res) => {
  const output = flashPop(req, res, 'elaw_msg');
  res.clearCookie('elaw_msg'); // Clear flash message after use

 

  try {
    //const roles = await Role.findAll({ order: [['role_id', 'DESC']] });
    const roles = await Role.findAll({
      where: {
        role_name: {
          [Op.notIn]: ['superadmin', 'subadmin']
        }
      },
      order: [['role_id', 'DESC']],
    });




    res.render('superadmin/role_mgmt', {
      output,
      roles,
    });




  } catch (error) {
    console.error(error);
    return res.render('superadmin/error500', { output: 'Internal Server Error' });
  }
};






//============================= END Role Management ===============================//




//==================== Terms & Conditions =============================

export const user_tandc = async (req, res) => {


    try {
        const terms = await TandC.findOne({ where: { tandc_type: 'User' } });
        res.render('superadmin/user_tandc', { output: '', terms: terms })

    }
    catch (error) {
        console.log(error)
        return res.render('superadmin/error500', { output: 'Internal Server Error' })
    }

}


export const user_tandcPost = async (req, res) => {


    const transaction = await sequelize.transaction()
    const { terms } = req.body;
    try {


        const existing = await TandC.findOne({ where: { tandc_type: 'User' } });

        if (existing) {

            await existing.update({ terms: terms }, { transaction });
        } else {
            // Insert if not found
            await TandC.create({ terms: terms, tandc_type: 'User' }, { transaction });
        }

        await transaction.commit()
        res.redirect('/superadmin/user_tandc')


    }
    catch (error) {

        console.log(error)
        await transaction.rollback()
        return res.render('superadmin/error500', { output: 'Internal Server Error' })

    }


}





//================================ Privacy & Policy ======================================//



export const user_pandp = async (req, res) => {


    try {
        const policy = await PandP.findOne({ where: { policy_type: 'User' } });
        res.render('superadmin/user_pandp', { output: '', policy: policy })

    }
    catch (error) {
        console.log(error)
        return res.render('superadmin/error500', { output: 'Internal Server Error' })
    }

}



export const user_pandpPost = async (req, res) => {


    const transaction = await sequelize.transaction()
    const { policy } = req.body;
    try {


        const existing = await PandP.findOne({ where: { policy_type: 'User' } });

        if (existing) {

            await existing.update({ policy: policy }, { transaction });
        } else {
            // Insert if not found
            await PandP.create({ policy: policy , policy_type: 'User' }, { transaction });
        }

        await transaction.commit()
        res.redirect('/superadmin/user_pandp')


    }
    catch (error) {

        console.log(error)
        await transaction.rollback()
        return res.render('superadmin/error500', { output: 'Internal Server Error' })

    }


}



//======================== END KILVISHCOMMON SUPERADMIN FUNTIONS ========================




//=============================== START Project Funtionalities ==============================


export const send_register_otp = async (req, res) => {
  
  let { email, country_code, contact, purpose = 'register' } = req.body || {};
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  // try { if (email)        email        = decrypt64(email); } catch {}
  // try { if (country_code) country_code = decrypt64(country_code); } catch {}
  // try { if (contact)      contact      = decrypt64(contact); } catch {}


        // 🔐 RSA-OAEP decrypt (async)
        try { if (email)    email    = await rsaDecryptBase64(email);    } catch {}
        try { if (country_code)    country_code    = await rsaDecryptBase64(country_code);    } catch {}
        try { if (contact)    contact    = await rsaDecryptBase64(contact);    } catch {}


  try {
    if (!email && !(country_code && contact)) {
      return res.status(400).json({ success:false, message:'Email or (country_code + contact) is required' });
    }

    // no “already registered” check here for superadmin use; we only validate at final submit
    const channel = email ? 'email' : 'sms';

    const recent = await OtpCode.findOne({
      where: {
        purpose,
        channel,
        status: 'pending',
        expire_at: { [Op.gt]: new Date() },
        ...(email ? { email } : { country_code, contact }),
        last_sent_at: { [Op.gt]: new Date(Date.now() - 30 * 1000) },
      },
      order: [['id','DESC']],
    });
    if (recent) {
      await Audit.warn({
        actorType:'Admin', actorId:req.admin?.admin_id || null, url:req.originalUrl,
        action:'OTP_RESEND_RATE_LIMIT',
        description:`Cooldown for ${channel}:${email || `${country_code}${contact}`}`,
      });
      return res.status(429).json({ success:false, message:'Please wait a moment before requesting another OTP.' });
    }

    const { otp_id, code } = await createOtp({
      req,
      purpose,
      actor_type: 'Admin',
      customer_id: null,
      channel,
      email: email || null,
      country_code: channel === 'sms' ? country_code : null,
      contact: channel === 'sms' ? contact : null,
      ttlMs: 10 * 60 * 1000,
      max_attempts: 5,
    });

    if (channel === 'email') {
      await send_login_otp_email('User', email, code, baseUrl);
    } else {
      // send SMS if you want
    }

    await Audit.success({
      actorType:'Admin', actorId:req.admin?.admin_id || null, url:req.originalUrl,
      action:'OTP_SENT_REGISTER', description:`OTP via ${channel}`, extra:{ otp_id }
    });

    return res.json({ success:true, message:`OTP Sent Successfully ${code}`, otp_id });

  } catch (error) {
    console.log(error)
    await Audit.failed({
      actorType:'Admin', actorId:req.admin?.admin_id || null, url:req.originalUrl,
      action:'OTP_SEND_REGISTER_ERROR', description: kilError(error),
    });
    return res.status(500).json({ success:false, message: `Internal Server Error -> ${kilError(error)}` });
  }
};

export const verify_register_otp = async (req, res) => {
  try {
    let { otp_id: rawOtpId, otp, email, country_code, contact, purpose = 'register' } = req.body || {};
    // try { if (email)        email        = decrypt64(email); } catch {}
    // try { if (country_code) country_code = decrypt64(country_code); } catch {}
    // try { if (contact)      contact      = decrypt64(contact); } catch {}




    
        // 🔐 RSA-OAEP decrypt (async)
        try { if (email)    email    = await rsaDecryptBase64(email);    } catch {}
        try { if (country_code)    country_code    = await rsaDecryptBase64(country_code);    } catch {}
        try { if (contact)    contact    = await rsaDecryptBase64(contact);    } catch {}

    const otp_code = (otp || '').trim();
    if (!otp_code) return res.status(400).json({ success:false, message:'otp is required' });

    const haveEmail = !!email;
    const havePhone = !!country_code && !!contact;
    if (!rawOtpId && !haveEmail && !havePhone) {
      return res.status(400).json({ success:false, message:'Provide otp_id OR destination (email or phone).' });
    }

    const channel = haveEmail ? 'email' : 'sms';
    let otp_id = Number(rawOtpId) || null;

    if (!otp_id) {
      const row = await OtpCode.findOne({
        where: {
          purpose,
          channel,
          status: 'pending',
          expire_at: { [Op.gt]: new Date() },
          ...(haveEmail ? { email } : { country_code, contact }),
        },
        order: [['id','DESC']],
      });
      if (!row) return res.status(400).json({ success:false, message:'No active OTP found for this destination.' });
      otp_id = row.id;
    }

    const v = await verifyOtp({ req, otp_id, code: otp_code, consumeOnSuccess: true });
    if (!v.ok) {
      const map = { EXPIRED:'OTP has expired.', LOCKED:'Too many attempts. OTP locked.', INVALID:'Incorrect OTP.', NOT_FOUND:'Invalid OTP.' };
      return res.status(400).json({ success:false, message: map[v.reason] || 'OTP verification failed.' });
    }

    await Audit.success({
      actorType:'Admin', actorId:req.admin?.admin_id || null, url:req.originalUrl,
      action:'OTP_VERIFIED_REGISTER', description:'Signup OTP verified', extra:{ otp_id }
    });

    return res.json({ success:true, message:'OTP verified successfully' });

  } catch (error) {
    await Audit.failed({
      actorType:'Admin', actorId:req.admin?.admin_id || null, url:req.originalUrl,
      action:'OTP_VERIFY_REGISTER_ERROR', description: kilError(error)
    });
    return res.status(500).json({ success:false, message:`Internal Server Error -> ${kilError(error)}` });
  }
};



//=========================== START  LAWYER SECTION ADD/EDIT/VIEWS/DELETE ================================




// ---------- Small helpers ----------
function toastOkJson(res, message, extra={}) {
  return res.json({ success: true, message, ...extra });
}
function toastFailJson(res, code, msg) {
  return res.status(code).json({ success: false, message: msg });
}






//===================== Reports Section ============================================





 export const render_report_html = async (req, res) => {


    const candidate_id = req.params.id;
    const person_id = req.params.person_id;     

     const output = flashPop(req, res, 'elaw_msg');

  try {
 
    const commonOptions = {
      include: [
        {
          model: ClientAccount,
          as: 'account',
          attributes: ['type', 'business_name', 'first_name', 'last_name', 'email', 'country_code', 'contact', 'profile_pic', 'address']
        },
        {
          model: Admin,
          as: 'report_updated_by',
          attributes: ['admin_id', 'first_name', 'last_name', 'email', 'image']
        },
        {
          model: ClientAccount,
          as: 'report_updated_by_client',
          attributes: ['client_account_id', 'first_name', 'last_name', 'business_name', 'email']
        },
        {
          model: ConfidentialReport,
          as: 'confidential_report',
          attributes: { exclude: [] }
        }
      ]
    };

    // Fetch the specific candidate
    const candidate = await FirmClient.findOne({
      where: { client_id: candidate_id },
      ...commonOptions
    });

    console.log('-- candidate--',candidate)
  
    if (!candidate) {
      return res.render('superadmin/error404', { output: 'Candidate not found' });
    }

   

    const base_url = req.protocol + '://' + req.get('host');

    console.log('-------------------------------')

    console.log('candidate',candidate)

     console.log('-------------------------------')


    const candidatePlain = candidate.get({ plain: true });
    const acct = candidatePlain?.account;
    if (acct) {
      candidatePlain.client_name = acct.type === 'Business'
        ? (acct.business_name || 'Client')
        : `${acct.first_name || ''} ${acct.last_name || ''}`.trim() || 'Client';
      candidatePlain.client_logo = acct.profile_pic || null;
      candidatePlain.client_address = acct.address || null;
      candidatePlain.email = acct.email || candidatePlain.email;
      candidatePlain.country_code = acct.country_code || candidatePlain.country_code;
      candidatePlain.contact = acct.contact || candidatePlain.contact;
    }

    res.render('superadmin/pdf_report', {
      output,
      base_url,
      candidate: candidatePlain,
    });
    

  } catch (error) {
    console.log(error);
    return res.render('superadmin/error500', { output: 'Internal Server Error' });
  }
};



export const generate_pdf_report = async (req, res) => {
  const { candidate_id ,person_id  } = req.body;

  try {
    const report = await ConfidentialReport.findOne({ where: { candidate_id } });
    if (!report) {
      return res.json({ success: false, error: 'Report not found' });
    }
const today = new Date().toISOString().split('T')[0];
        await report.update({ 
      pdf_generated_date: today
    });

    const reportId = report.report_id;



    //------ Store PDF file in INternal Server Storage ---------------
        // const reportsDir = path.join('public', 'reports');
        // const filePath = path.join(reportsDir, `${reportId}.pdf`);
        // await fspromise.mkdir(reportsDir, { recursive: true });

     //------ Store PDF file in INternal Server Storage ---------------

    // const browser = await puppeteer.launch({ headless: 'new' });
    //const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

    const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox'],       // no need to ignore certs now
});
  

    const page = await browser.newPage();



    //-------- Server IP ------------
       const httpPort = req.app.locals.httpPort; // set above
       const serverIp = getServerIp();  // for server IP        
      const reportUrl = `http://${serverIp}:${httpPort}/superadmin/render_report_html/${candidate_id}/${person_id}`;
    //-------- Server IP ------------


        //-------- For domain Name ------------
// const host = req.get('host'); 
// const protocol = req.protocol;  // for domain name 
// const reportUrl = `${protocol}://${host}/superadmin/render_report_html/${candidate_id}/${person_id}`;

//-------- For domain Name ------------



   // const reportUrl = `${req.protocol}://${req.get('host')}/superadmin/render_report_html/${candidate_id}`;
   // const reportUrl = `${req.protocol}://${req.get('host')}/superadmin/render_report_html/${candidate_id}/${person_id}`;

 

    await page.goto(reportUrl, { waitUntil: 'networkidle0' });

    //const pdfBuffer = await page.pdf({ format: 'A4' });

    const pdfBuffer = await page.pdf({
  format: 'A4',
  margin: {
    top: '0.5in',
    bottom: '0.5in',
    left: '0.5in',
    right: '0.5in'
  },
  printBackground: true
});


    await browser.close();

    

    await report.update({
      pdf_report_name: `${reportId}.pdf`,
      pdf_generated_date: today
    });

     // await fspromise.writeFile(filePath, pdfBuffer); //local storage 



     // S3 bucket 
     const pdfKey = `reports/${reportId}.pdf`;

        await s3.send(new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: pdfKey,
          Body: pdfBuffer,
          ContentType: 'application/pdf',
        }));


      const s3_PDFUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${pdfKey}`;

      const securleurl = `/secure/file/confidential_report/${reportId}/pdf_report_name`

           await report.update({
            pdf_report_name: s3_PDFUrl,
            pdf_generated_date: today
          });


      // 🔍 Optional: Fetch candidate info for better logging
    const candidate = await FirmClient.findOne({
      where: { client_id: candidate_id },
      include: [{
        model: ClientAccount,
        as: 'account',
        attributes: ['client_account_id', 'type', 'business_name', 'first_name', 'last_name']
      }]
    });
    const candidatePlain = candidate ? candidate.get({ plain: true }) : null;
    const acct = candidatePlain?.account || null;
    const candidateName = acct
      ? (acct.type === 'Business'
        ? (acct.business_name || 'Client')
        : `${acct.first_name || ''} ${acct.last_name || ''}`.trim() || 'Client')
      : 'Client';


      // ✅ Audit Log
    await logAction({
      actorType: req.admin?.admin_type === 'superadmin' ? 'Superadmin' : 'Subadmin',
      actorId: req.admin?.admin_id || null,
      clientId: candidatePlain?.client_id || null,
      report_id: report.report_id,
      url: req.originalUrl,
      action: 'Generate Confidential PDF Report',
      description: `PDF report generated for Candidate: ${candidateName} (ID: ${candidate_id}) with Report ID: ${reportId}`,
      result: 'Success OK 200'
    });


    res.json({ success: true, report_id: reportId , pdf_url: securleurl });
  } catch (err) {
    console.error('PDF Generation Error:', err);


       await logAction({
      actorType: req.admin?.admin_type === 'superadmin' ? 'Superadmin' : 'Subadmin',
      actorId: req.admin?.admin_id || null,
      clientId: null,     
      url: req.originalUrl,
      action: 'Generate Confidential PDF Report',
      description: `Failed to generate PDF for Candidate ID: ${candidate_id}`,
      result: `Failed - Error: ${err.message}`
    });


    res.json({ success: false, error: err.message });
  }
};





//=================== START CALENDAR SECTION =====================================


// GET page (render once; rest is axios)
export const elaw_calendar = async (req, res) => {
     const output = flashPop(req, res, 'elaw_msg');
  
   const { actorType, actorId } = deriveActor(req);
  try {
    const [calendar] = await Calendar.findOrCreate({
      where: { calendar_id: 1 }, // single default calendar
      defaults: { calendar_name: 'Default', timezone: 'America/Jamaica' }
    });

    return res.render('superadmin/elaw_calendar', {
      output,
      calendar, // pass current state to hydrate UI
    });
  } catch (error) {
    const msg = `Internal Server Error ${error?.message || error}`;
    console.log(error)

     await Audit.failed({ actorType, actorId, url: req.originalUrl, action: 'GET_elaw_CALENDAR', description: String(error?.message || error) });
    return res.render('superadmin/error500', { output: msg });
  }
};

// ---AXIOS : toggle one working day
export const calendar_toggleWorkingDay = async (req, res) => {
  const { actorType, actorId } = deriveActor(req);
  try {
    const { day, enabled } = req.body || {};
    const valid = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    if (!valid.includes(day)) {
      await Audit.warn({ actorType, actorId, url: req.originalUrl, action: 'CAL_TOGGLE_INVALID_DAY', description: `Bad day=${day}` });
      return res.status(422).json({ success: false, message: 'Invalid day' });
    }
    const calendar = await Calendar.findByPk(1);
    const wd = { ...(calendar.working_days || {}) };
    wd[day] = !!enabled;
    calendar.working_days = wd;
    await calendar.save();

    await Audit.success({ actorType, actorId, url: req.originalUrl, action: 'CAL_TOGGLE_DAY', description: `Set ${day}=${!!enabled}` });

    return res.json({ success: true, working_days: calendar.working_days });
  } catch (err) {
    await Audit.failed({ actorType, actorId, url: req.originalUrl, action: 'CAL_TOGGLE_ERROR', description: String(err?.message || err) });
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// --- AXIOS: add blackout date (holiday)
export const calendar_addHoliday = async (req, res) => {
  const { actorType, actorId } = deriveActor(req);
  try {
    const { blackout_date, description } = req.body || {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(blackout_date)) {
      await Audit.warn({ actorType, actorId, url: req.originalUrl, action: 'CAL_ADD_BAD_DATE', description: `Bad date=${blackout_date}` });
      return res.status(422).json({ success: false, message: 'Invalid date format (YYYY-MM-DD)' });
    }
    if (!description || !description.trim()) {
      return res.status(422).json({ success: false, message: 'Description is required' });
    }

    const calendar = await Calendar.findByPk(1);
    const holidays = Array.isArray(calendar.holidays) ? [...calendar.holidays] : [];

    // prevent duplicates on same date
    if (holidays.some(h => h.blackout_date === blackout_date)) {
      return res.status(409).json({ success: false, message: 'Holiday already exists for this date' });
    }

    const entry = { blackout_date, description: description.trim() };
    holidays.push(entry);
    calendar.holidays = holidays;
    await calendar.save();

    await Audit.success({ actorType, actorId, url: req.originalUrl, action: 'CAL_ADD_HOLIDAY', description: `Added ${blackout_date} - ${description}` });

    return res.status(201).json({ success: true, holiday: entry, holidays });
  } catch (err) {
    await Audit.failed({ actorType, actorId, url: req.originalUrl, action: 'CAL_ADD_HOLIDAY_ERROR', description: String(err?.message || err) });
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// --- AXIOS : delete blackout date by date string
export const calendar_deleteHoliday = async (req, res) => {
  const { actorType, actorId } = deriveActor(req);
  try {
    const date = req.params.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(422).json({ success: false, message: 'Invalid date' });
    }
    const calendar = await Calendar.findByPk(1);
    const holidays = Array.isArray(calendar.holidays) ? calendar.holidays : [];
    const before = holidays.length;
    const afterList = holidays.filter(h => h.blackout_date !== date);

    if (afterList.length === before) {
      return res.status(404).json({ success: false, message: 'Holiday not found' });
    }

    calendar.holidays = afterList;
    await calendar.save();

    await Audit.success({ actorType, actorId, url: req.originalUrl, action: 'CAL_DELETE_HOLIDAY', description: `Removed ${date}` });

    return res.json({ success: true });
  } catch (err) {
    await Audit.failed({ actorType, actorId, url: req.originalUrl, action: 'CAL_DELETE_HOLIDAY_ERROR', description: String(err?.message || err) });
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};



// --- (optional) events feed if not embedding at render-time
export const calendar_events = async (_req, res) => {
  const calendar = await Calendar.findByPk(1);
  const holidays = Array.isArray(calendar?.holidays) ? calendar.holidays : [];
  const events = holidays.map(h => ({
    title: 'Holiday',
    start: h.blackout_date,
    allDay: true,
    classNames: ['kwe-holiday-event'],
    extendedProps: { message: h.description }
  }));
  res.json(events);
};


//================================ END CALENDAR SECTION ======================================





// GET page: loads active lists + renders UI
export const broadcast = async (req, res) => {
  const output = flashPop(req, res, 'elaw_msg') || '';
  const { actorType, actorId } = deriveActor(req);
  try {
    const [individuals, businesses, last5] = await Promise.all([
      ClientAccount.findAll({
        where: { status: 'active', type: 'Individual' },
        order: [['first_name','ASC']],
        attributes: ['client_account_id','first_name','last_name','email']
      }),
      ClientAccount.findAll({
        where: { status: 'active', type: 'Business' },
        order: [['business_name','ASC']],
        attributes: ['client_account_id','business_name','email','first_name','last_name']
      }),
      Broadcast.findAll({ order: [['createdAt','DESC']], limit: 10 })
    ]);

    const mapInd = individuals.map(c => ({
      id: c.client_account_id,
      label: `${c.first_name} ${c.last_name} <${c.email}>`,
      email: c.email
    }));
    const mapBiz = businesses.map(c => ({
      id: c.client_account_id,
      label: `${c.business_name || (c.first_name+' '+c.last_name)} <${c.email}>`,
      email: c.email
    }));

    await Audit.success({
      actorType, actorId, url: req.originalUrl,
      action: 'BCAST_VIEW',
      description: 'Opened broadcast page',
      extra: { ind_count: mapInd.length, biz_count: mapBiz.length }
    });

    return res.render('superadmin/broadcast', { output, individuals: mapInd, businesses: mapBiz, recent: last5 });

  } catch (error) {
    await Audit.failed({
      actorType, actorId, url: req.originalUrl,
      action: 'BCAST_VIEW_ERROR',
      description: fullErrorString(error),
    });
    flashSet(res, 'elaw_msg', `Internal Server Error: ${fullErrorString(error)}`);
    return res.render('superadmin/error500', { output: `Internal Server: ${fullErrorString(error)}` });
  }
};




/** POST /superadmin/broadcast/preview — compile HTML */
export const broadcast_preview = async (req, res) => {
  const { actorType, actorId } = deriveActor(req);
  const urlPath = req.originalUrl;

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const logoUrl = `${baseUrl}/superadminassets/img/logo.jpg`;
  try {
    const { title='Broadcast', message='Preview message…', link='' } = req.body || {};
    const templatePath = path.join(__dirname, '../views/emails/broadcast_email.ejs');

    const html = await ejs.renderFile(templatePath, {
      title, message, link,
      recipientName: 'Client',
      logoUrl, company: 'KWL E-Service'
    });

    await Audit.success({ actorType, actorId, url: urlPath, action: 'BCAST_PREVIEW', description: 'Preview rendered' });
    return res.type('html').send(html);
  } catch (error) {
    await Audit.failed({ actorType, actorId, url: urlPath, action: 'BCAST_PREVIEW_ERROR', description: fullErrorString(error) });
    return res.status(500).send(`<pre>Preview failed:\n${fullErrorString(error)}</pre>`);
  }
};

/** POST /superadmin/broadcast/send — send emails */
export const broadcast_send = async (req, res) => {
  const { actorType, actorId, actorEmail } = deriveActor(req);
  const urlPath = req.originalUrl;

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const logoUrl = `${baseUrl}/superadminassets/img/logo.jpg`;

  try {
    const {
      title = '',
      message = '',
      link = '',
      individual_ids = [],    // array of numbers (client_id)
      business_ids = [],      // array of numbers (client_id)
      include_all_individual = false,
      include_all_business  = false,
    } = req.body || {};

    if (!title.trim() || !message.trim()) {
      await Audit.warn({ actorType, actorId, url: urlPath, action: 'BCAST_VALIDATION', description: 'Missing title or message' });
      return res.status(422).json({ success:false, message:'Title and Message are required.' });
    }

    const whereOr = [];
    if (include_all_individual) whereOr.push({ status: 'active', type: 'Individual' });
    if (include_all_business)   whereOr.push({ status: 'active', type: 'Business' });

    const ids = [...new Set([...(individual_ids || []), ...(business_ids || [])])];
    if (ids.length) whereOr.push({ client_account_id: { [Op.in]: ids } });

    if (!whereOr.length) {
      await Audit.warn({ actorType, actorId, url: urlPath, action: 'BCAST_NO_RECIPIENTS', description: 'No recipients specified' });
      return res.status(404).json({ success:false, message:'Select at least one audience or client.' });
    }

    const recipients = await ClientAccount.findAll({
      where: { [Op.or]: whereOr },
      attributes: ['client_account_id','type','first_name','last_name','business_name','email'],
      order: [['client_account_id','ASC']],
    });

    if (!recipients.length) {
      await Audit.warn({ actorType, actorId, url: urlPath, action: 'BCAST_EMPTY_RESULT', description: 'No matching recipients in DB' });
      return res.status(404).json({ success:false, message:'No recipients found for the selected criteria.' });
    }

    const audience_type =
      (include_all_individual && include_all_business) ? 'both' :
      (include_all_individual ? 'individual' :
      (include_all_business ? 'business' : 'custom'));

    const broadcast = await Broadcast.create({
      title, message, link,
      audience_type,
      recipients: audience_type === 'custom' ? ids : null,
      created_by_admin_id: actorId,
      created_by_email: actorEmail || null,
    });

    const results = [];
    const limit = 6; // concurrency

    const tasks = recipients.map(r => async () => {
      try {
        const displayName = r.type === 'Business'
          ? (r.business_name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Client')
          : `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Client';
        await send_broadcast_email({
          to: r.email,
          recipientName: displayName,
          title, message, link, logoUrl
        });
        results.push({ id: r.client_account_id, email: r.email, ok: true });
      } catch (e) {
        results.push({ id: r.client_account_id, email: r.email, ok: false, err: fullErrorString(e) });
      }
    });

    const runQueue = async (fns, n) => {
      const pool = new Array(Math.min(n, fns.length)).fill(0).map(async (_, i) => {
        for (let j=i; j<fns.length; j+=n) await fns[j]();
      });
      await Promise.all(pool);
    };

    await runQueue(tasks, limit);

    const sent   = results.filter(r => r.ok).length;
    const failed = results.length - sent;

    await broadcast.update({ sent_count: sent, fail_count: failed, last_sent_at: new Date() });

    if (failed) {
      await Audit.warn({
        actorType, actorId, url: urlPath,
        action: 'BCAST_SENT_WITH_ERRORS',
        description: `Broadcast ${broadcast.broadcast_id} sent with failures`,
        extra: { total: results.length, sent, failed }
      });
    } else {
      await Audit.success({
        actorType, actorId, url: urlPath,
        action: 'BCAST_SENT',
        description: `Broadcast ${broadcast.broadcast_id} sent successfully`,
        extra: { total: results.length, sent }
      });
    }

    return res.json({
      success: true,
      broadcast_id: broadcast.broadcast_id,
      total: results.length,
      sent,
      failed,
      failures: results.filter(r => !r.ok),
    });

  } catch (error) {
    await Audit.failed({
      actorType, actorId, url: urlPath,
      action: 'BCAST_ERROR',
      description: fullErrorString(error),
    });
    return res.status(500).json({ success:false, message:`Internal Server Error: ${fullErrorString(error)}` });
  }
};











//==================== END Staff Section ==========================================



