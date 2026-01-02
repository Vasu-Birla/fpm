import https from 'https';
import axios from 'axios';
import sequelize from "../config/sequelize.js";
import * as url from 'url';
import * as path from 'path';
// import fs from 'fs/promises';
import fsextra from "fs-extra";

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import readline from 'node:readline';
import * as crypto from 'node:crypto';

import os from 'os';
import moment from 'moment-timezone';
import ejs from "ejs";



const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
import dotenv from 'dotenv';
// dotenv.config(); // Load environment variables from config.env
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });


import { Op, col ,Sequelize , Transaction } from 'sequelize';
import jwt from 'jsonwebtoken';



import { sendTokenClientBrowser  } from "../utils/jwtToken.js";


import { hashPassword, comparePassword , decrypt64 ,slugify, isAjax ,parsePracticeAreaIds} from "../helper/helper.js";
import { violatesHistory, updatePasswordWithHistory, getModelsByType } from '../utils/passwordPolicy.js';

// Utils Import
import { flashSet ,flashPop } from '../utils/flash.js';
import { kilError  } from '../utils/kilError.js';
import { Audit } from '../utils/auditLogger.js';
import { createOtp, verifyOtp ,verifyOtp_strict } from '../utils/otpService.js';
import { rsaDecryptBase64 } from '../utils/rsa.js';

//====== Models Import start  =========== 


import { ClientAccount, FirmClient, ActiveSessionClient,
  Admin, TandC, PandP, 
OtpCode,
 } from "../models/index.js";


//========= Models Import End ============


import {  
  send_login_otp_email,
  send_registration_link_email,
  send_password_change_email,
  reset_pass_otp_email ,send_broadcast_email ,send_otp, send_intake_ticket_email  } from "../utils/emailhelper.js";



//==================== START Global Functions ==============================================

function deriveActor(req) {
  const client = req.client || {};

  return {
    actorType: client.type
      ? (client.type === 'Business' ? 'Business Client' : 'Individual Client')
      : 'Guest',
    actorId: client.client_account_id ?? null,
    actorEmail: client.email || null,
  };
}

async function loadClientMemberships(clientAccountId) {
  if (!clientAccountId) return [];
  return FirmClient.findAll({
    where: {
      client_account_id: clientAccountId,
      status: 'active',
      portal_enabled: true
    },
    include: [{
      model: LawFirm,
      as: 'firm',
      attributes: ['firm_id', 'firm_name', 'firm_logo']
    }],
    order: [['createdAt', 'DESC']]
  });
}




function toastOkJson(res, message, extra={}) {
  return res.json({ success: true, message, ...extra });
}
function toastFailJson(res, code, msg) {
  return res.status(code).json({ success: false, message: msg });
}

const SERVICE_ICON_POOL = [
  '/assets/images/Professional-Advice.svg',
  '/assets/images/Employment-Law.svg',
  '/assets/images/Competitive-Pricing.svg',
  '/assets/images/Education-Law.svg',
  '/assets/images/Top-Legal-Experts.svg',
  '/assets/images/Car-Accident-Law.svg',
  '/assets/images/Bankruptcy-Law.svg',
  '/assets/images/Global-Lawyer-2.svg'
];

function cleanServiceText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function serviceSummary(name, description) {
  const desc = cleanServiceText(description);
  if (desc) return desc.length > 160 ? `${desc.slice(0, 157)}...` : desc;
  const safeName = cleanServiceText(name) || 'this area';
  return `Focused legal support for ${safeName} matters.`;
}

function resolveServiceIcon(rawIcon, index) {
  const icon = cleanServiceText(rawIcon);
  if (icon) {
    if (icon.startsWith('http') || icon.startsWith('/')) return icon;
    if (icon.includes('.')) return `/assets/images/${icon}`;
  }
  return SERVICE_ICON_POOL[index % SERVICE_ICON_POOL.length];
}

function toTree(rows, aliasMap) {
  const id2node = new Map();
  rows.forEach(r => {
    const aliases = aliasMap?.get(r.practice_area_id) || r.aliases || [];
    id2node.set(r.practice_area_id, {
      ...r,
      aliases,
      children: [],
      children_count: 0
    });
  });
  const roots = [];
  rows.forEach(r => {
    const node = id2node.get(r.practice_area_id);
    if (r.parent_id && id2node.has(r.parent_id)) {
      id2node.get(r.parent_id).children.push(node);
      id2node.get(r.parent_id).children_count++;
    } else {
      roots.push(node);
    }
  });
  const sortRec = (nodes) => {
    nodes.sort((a, b) => (a.sort_order - b.sort_order) || a.name.localeCompare(b.name));
    nodes.forEach(n => n.children && sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

function decorateServiceTree(nodes) {
  const iconIndex = { value: 0 };
  const decorateNode = (node) => {
    node.description = cleanServiceText(node.description) || null;
    node.summary = serviceSummary(node.name, node.description);
    node.icon_url = resolveServiceIcon(node.icon, iconIndex.value);
    iconIndex.value += 1;
    if (node.children && node.children.length) {
      node.children.forEach(decorateNode);
    }
  };
  nodes.forEach(decorateNode);
}
//==================== END Global Functions =====================================================




export const home = async (req, res) => {

   const output = flashPop(req, res, 'elaw_msg');
  try {

      return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>E-Law Coming Soon</title>
        <style>
          body {
            font-family: Arial, Helvetica, sans-serif;
            background: #f9f9f9;
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            color: #333;
          }
          .container {
            text-align: center;
            padding: 40px;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            max-width: 600px;
            width: 90%;
          }
          h1 {
            font-size: 2.2rem;
            margin-bottom: 0.5rem;
            color: #1e3a8a; /* Indigo blue */
          }
          p.tagline {
            font-size: 1.1rem;
            color: #555;
            margin-bottom: 2rem;
          }
          .panels {
            text-align: left;
            margin-top: 20px;
          }
          .panel-link {
            display: block;
            padding: 12px 16px;
            margin: 10px 0;
            background: #f1f5f9;
            border-radius: 8px;
            text-decoration: none;
            color: #1e293b;
            font-weight: 600;
            transition: background 0.3s;
          }
          .panel-link:hover {
            background: #e0e7ff;
            color: #1e3a8a;
          }
          .status {
            font-size: 0.9rem;
            font-weight: 500;
            color: #dc2626; /* red for under development */
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>E-Law Is Coming Soon</h1>
          <p class="tagline">We’re building something powerful for the future of legal services.</p>

          <div class="panels">
            <a href="/superadmin" class="panel-link">
              Superadmin Panel <span class="status">— Under Development </span>
            </a>
       
            <a href="/firmstaff" class="panel-link">
              Firm Staff Panel (LawFirm + Staff) <span class="status">— Under Development </span>
            </a>
            <a href="/home" class="panel-link">
              Client Website (Landing Page) <span class="status">— Pending to Start </span>
            </a>
          </div>
        </div>
      </body>
      </html>
    `);
    //res.render('client/index', {  output   });

  } catch (error) {

    console.error('Home Page Error ', error);
       return res.render('client/error500', { output: `Internal Server: ${kilError(error)}` });
  }
};


export const website = async (req, res) => {

   const output = flashPop(req, res, 'elaw_msg');
  try { 
      const home_page = req.client ? 'client/guest_home' : 'client/guest_home';

    res.render(home_page,{  output   });    

  } catch (error) {

    console.error(' Error ', error);
       return res.render('errors/error500', { output: `Internal Server: ${kilError(error)}` });
  }
};





//======================== CLIENT LOGIN SECTION START ===============================

export const login = async (req, res) => {

   const output = flashPop(req, res, 'elaw_msg');
  try { 
 

    res.render('client/login',{  output   });    

  } catch (error) {

    console.error(' Error :', error);
       return res.render('errors/error500', { output: `Internal Server: ${kilError(error)}` });
  }
};




export const loginPost = async (req, res) => {
  const { actorType, actorId } = deriveActor(req);
  const t = await sequelize.transaction();
  try {
    let { email, otp, otp_id, timezone } = req.body || {};

    // decrypt if encrypted by client AES encryption
    // try { if (email) email = decrypt64(email); } catch {}
    // try { if (otp)   otp   = decrypt64(otp);   } catch {}


        // 🔐 RSA-OAEP decrypt (async)
        try { if (email)    email    = await rsaDecryptBase64(email);    } catch {}
        try { if (otp) otp = await rsaDecryptBase64(otp); } catch {}

    email = (email || '').trim();
    otp   = (otp   || '').trim();

    if (!email || !otp) {
      if (!t.finished) await t.rollback();
      await Audit.warn({ actorType, actorId, url:req.originalUrl, action:'LOGIN_MISSING_FIELDS', description:`Missing email/otp for ${email||'[empty]'}` });
      const msg = 'Please enter email and OTP';
      if (isAjax(req)) return res.status(400).json({ success:false, message: msg });
      return res.render('/login', { output: msg });
    }




    // lock user row
    const clientAccount = await ClientAccount.findOne({ where:{ email }, transaction:t, lock:t.LOCK.UPDATE });


    

    if (!clientAccount) {
      if (!t.finished) await t.rollback();
      await Audit.denied({ actorType, actorId, url:req.originalUrl, action:'LOGIN_INVALID_USER', description:`Email=${email}` });
      const msg = 'Invalid credentials';
      if (isAjax(req)) return res.status(401).json({ success:false, message: msg });
      return res.render('/login', { output: msg });
    }


    if (clientAccount.status !== 'active') {
      await t.rollback();
      return res.status(200).json({ success:false, message:`Your Account is ${clientAccount.status} and can not be logged-in.` });
    }

    // resolve otp_id if not provided
    let resolvedOtpId = Number(otp_id) || null;
    if (!resolvedOtpId) {
      const row = await OtpCode.findOne({
        where:{
          purpose:'login',
          channel:'email',
          email,
          status:'pending',
          expire_at:{ [Op.gt]: new Date() },
        },
        order:[['id','DESC']],
        transaction:t
      });
      if (!row) {
        if (!t.finished) await t.rollback();
        await Audit.denied({ actorType, actorId, url:req.originalUrl, action:'LOGIN_NO_ACTIVE_OTP', description:`No active OTP for ${email}` });
        const msg = 'OTP not found or expired. Please resend OTP.';
        if (isAjax(req)) return res.status(400).json({ success:false, message: msg });
        return res.render('/login', { output: msg });
      }
      resolvedOtpId = row.id;
    }

    // verify OTP
    const v = await verifyOtp({ req, otp_id: resolvedOtpId, code: otp, consumeOnSuccess:true });
    if (!v.ok) {
      if (!t.finished) await t.rollback();
      let msg = 'OTP verification failed.';
      if (v.reason === 'EXPIRED') msg = 'OTP has expired.';
      else if (v.reason === 'LOCKED') msg = 'Too many attempts. Try again later.';
      else if (v.reason === 'INVALID') msg = 'Incorrect OTP.';
      await Audit.denied({ actorType, actorId, url:req.originalUrl, action:'LOGIN_OTP_FAILED', description:`reason=${v.reason||'UNKNOWN'}` });
      if (isAjax(req)) return res.status(401).json({ success:false, message: msg });
      return res.render('/login', { output: msg });
    }

    // clear old sessions
    await ActiveSessionClient.destroy({ where:{ client_account_id: clientAccount.client_account_id }, transaction:t });

    // update timezone
    if (timezone && timezone !== clientAccount.timezone) {
      clientAccount.timezone = timezone;
      await clientAccount.save({ transaction:t });
    }

    await t.commit();

    await Audit.success({ actorType, actorId, url:req.originalUrl, action:'LOGIN_SUCCESS_OTP', description:`OTP login ok for ${email}` });

    const memberships = await loadClientMemberships(clientAccount.client_account_id);
    if (!memberships.length) {
      const msg = 'No active firm membership found for this account.';
      if (isAjax(req)) return res.status(403).json({ success:false, message: msg });
      return res.render('/login', { output: msg });
    }

    if (memberships.length === 1) {
      const m = memberships[0];
      return await sendTokenClientBrowser(clientAccount, 200, res, req, {
        activeFirmId: m.firm_id,
        firmClientId: m.client_id,
        redirect: '/home'
      });
    }

    return await sendTokenClientBrowser(clientAccount, 200, res, req, {
      needsFirmSelect: true,
      redirect: '/home'    //'/choose_firm'  if you forcefully want to choose firm
    });

  } catch (error) {
    try { if (!t.finished) await t.rollback(); } catch {}
    await Audit.failed({ actorType, actorId, url:req.originalUrl, action:'LOGIN_ERROR', description: kilError(error) });

    const msg = `Internal Server: ${kilError(error)}`;
    if (isAjax(req)) return res.status(500).json({ success:false, message: msg });
    return res.cookie('elaw_msg', msg).redirect('/login');
  }
}



/* =======================================================================================
   NEW: Password-based login (runs alongside your existing OTP flow)
*/

export const loginPasswordPost = async (req, res) => {
  const { actorType, actorId } = deriveActor(req);

  try {
    // 1) Decrypt inputs (unchanged)
    let { email, password, timezone } = req.body || {};


    // Client AES enc -decryption 
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
                         : res.render('/login', { output: msg });
    }

    // 2) READ-ONLY fetch (NO transaction, NO lock)
    const clientAccount = await ClientAccount.findOne({ where: { email } }); // <-- no t / no lock
    if (!clientAccount) {
      const msg = 'Invalid email or password.';
      return isAjax(req) ? res.status(401).json({ success:false, message: msg })
                         : res.render('/login', { output: msg });
    }
    if (clientAccount.status !== 'active') {
      const msg = `Your Account is ${clientAccount.status} and can not be logged-in.`;
      return isAjax(req) ? res.status(200).json({ success:false, message: msg })
                         : res.render('/login', { output: msg });
    }
    if (!clientAccount.password) {
      const msg = 'Password login not set for this account. Use OTP login or set a password.';
      return isAjax(req) ? res.status(401).json({ success:false, message: msg })
                         : res.render('/login', { output: msg });
    }

    const ok = await comparePassword(password, clientAccount.password);
    if (!ok) {
      const msg = 'Invalid email or password.';
      return isAjax(req) ? res.status(401).json({ success:false, message: msg })
                         : res.render('/login', { output: msg });
    }

    // 3) If 2SV is ON → create OTP *without* holding any other locks/tx
    if (clientAccount.two_step_verification === 'On') {
      // Optional: quick rate-limit check, same as /send_login_otp
      const { otp_id, code } = await createOtp({
        req,
        purpose: 'login_2fa',
        actor_type: clientAccount.type || 'Client',
        client_account_id: clientAccount.client_account_id,
        channel: 'email',
        email: clientAccount.email,
        ttlMs: 10 * 60 * 1000,
        max_attempts: 5,
        // NOTE: no transaction passed here
      });

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const name = `${clientAccount.first_name||''} ${clientAccount.last_name||''}`.trim() || 'Client';
   
            const purpose = 'login_2fa'
      const type = 'Client'  
       await send_otp(name, email, code, baseUrl , purpose , type);

      //send-otp-res
      return res.status(200).json({
        success: true,
        two_step: true,
        otp_id,
        message: `Enter the OTP sent to your email to complete login.`,
      });
    }

    // 4) If 2SV is OFF → now open a tx for mutations (clear sessions / timezone) and finish
   
    const t = await sequelize.transaction({
          isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED
        });
    try {
      await ActiveSessionClient.destroy({ where:{ client_account_id: clientAccount.client_account_id }, transaction: t });
      if (timezone && timezone !== clientAccount.timezone) {
        clientAccount.timezone = timezone;
        await clientAccount.save({ transaction: t });
      }
      await t.commit();

      await Audit.success({ actorType, actorId, url:req.originalUrl, action:'LOGIN_SUCCESS_PASSWORD', description:`Password login ok for ${email}` });
      const memberships = await loadClientMemberships(clientAccount.client_account_id);
      if (!memberships.length) {
        const msg = 'No active firm membership found for this account.';
        return isAjax(req) ? res.status(403).json({ success:false, message: msg })
                           : res.render('/login', { output: msg });
      }

      if (memberships.length === 1) {
        const m = memberships[0];
        return await sendTokenClientBrowser(clientAccount, 200, res, req, {
          activeFirmId: m.firm_id,
          firmClientId: m.client_id,
          redirect: '/home'
        });
      }

      return await sendTokenClientBrowser(clientAccount, 200, res, req, {
        needsFirmSelect: true,
        redirect: '/home'   //'/choose_firm'  if you forcefully want to choose firm
      });

    } catch (e) {
      try { if (!t.finished) await t.rollback(); } catch {}
      throw e;
    }

  } catch (error) {
    console.log('Error in Login ',error )
    await Audit.failed({ actorType, actorId, url:req.originalUrl, action:'LOGIN_PW_ERROR', description: kilError(error) });
    const msg = `Internal Server: ${kilError(error)}`;
    return isAjax(req) ? res.status(500).json({ success:false, message: msg })
                       : res.cookie('elaw_msg', msg).redirect('/login');
  }
};






export const loginPassword2faVerifyPost = async (req, res) => {
  const { actorType, actorId } = deriveActor(req);

  try {
    let { email, otp, otp_id, timezone } = req.body || {};

    

    
    // try { if (email) email = decrypt64(email); } catch {}
    // try { if (otp)   otp   = decrypt64(otp);   } catch {}

          // 🔐 RSA-OAEP decrypt (async)
        try { if (email)    email    = await rsaDecryptBase64(email);    } catch {}
        try { if (otp) otp = await rsaDecryptBase64(otp); } catch {}




    email    = (email || '').trim();
    otp      = (otp   || '').trim();
    const id = Number(otp_id) || null;

    if (!email || !otp) {
 
      return res.status(500).json({ success:false, message:'Email and OTP required' });
    }

       

    // Fetch user (no lock/tx)
    const clientAccount = await ClientAccount.findOne({ where:{ email } });
    if (!clientAccount) return res.status(404).json({ success:false, message:'Account not found' });
    if (clientAccount.status !== 'active') {
      return res.status(200).json({ success:false, message:`Your Account is ${clientAccount.status} and can not be logged-in.` });
    }

    // Resolve latest OTP if none
    let resolvedOtpId = id;
    if (!resolvedOtpId){
      const row = await OtpCode.findOne({
        where:{
          purpose:'login_2fa',
          channel:'email',
          email,
          status:'pending',
          expire_at:{ [Op.gt]: new Date() },
        },
        order:[['id','DESC']],
      });
      if (!row) return res.status(400).json({ success:false, message:'OTP not found or expired' });
      resolvedOtpId = row.id;
    }

    
    

    const v = await verifyOtp({ req, otp_id: resolvedOtpId, code: otp, consumeOnSuccess:true });
    if (!v.ok){
      
      let msg = 'OTP verification failed.';
      if (v.reason === 'EXPIRED') msg = 'OTP has expired.';
      else if (v.reason === 'LOCKED') msg = 'Too many attempts. Try again later.';
      else if (v.reason === 'INVALID') msg = 'Incorrect OTP.';
      await Audit.denied({ actorType, actorId, url:req.originalUrl, action:'LOGIN_2FA_FAILED', description:`reason=${v.reason||'UNKNOWN'}` });
     
           console.log(msg)
      return res.status(400).json({ success:false, message: msg });
    }

    // Now perform the “post-login” mutations atomically
    const t = await sequelize.transaction();
    try{
      await ActiveSessionClient.destroy({ where:{ client_account_id: clientAccount.client_account_id }, transaction: t });
      if (timezone && timezone !== clientAccount.timezone) {
        clientAccount.timezone = timezone;
        await clientAccount.save({ transaction: t });
      }
      await t.commit();
    } catch(e){
      try { if (!t.finished) await t.rollback(); } catch {}
      throw e;
    }

    await Audit.success({ actorType, actorId, url:req.originalUrl, action:'LOGIN_SUCCESS_PASSWORD_2FA', description:`2FA ok for ${email}` });
    const memberships = await loadClientMemberships(clientAccount.client_account_id);
    if (!memberships.length) {
      return res.status(403).json({ success:false, message:'No active firm membership found for this account.' });
    }

    if (memberships.length === 1) {
      const m = memberships[0];
      return await sendTokenClientBrowser(clientAccount, 200, res, req, {
        activeFirmId: m.firm_id,
        firmClientId: m.client_id,
        redirect: '/home'
      });
    }

    return await sendTokenClientBrowser(clientAccount, 200, res, req, {
      needsFirmSelect: true,
      redirect: '/home'   //'/choose_firm'  if you forcefully want to choose firm
    });

  } catch (error) {
    console.log(error)
    await Audit.failed({ actorType, actorId, url:req.originalUrl, action:'LOGIN_PW_2FA_ERROR', description: kilError(error) });
    const msg = `Internal Server: ${kilError(error)}`;
    return isAjax(req) ? res.status(500).json({ success:false, message: msg })
                       : res.cookie('elaw_msg', msg).redirect('/login');
  }
};





const DEV = (process.env.NODE_ENV !== 'production');

export const send_login_otp = async (req, res) => {
  const { email, country_code, contact, type = 'Client', purpose = 'login' } = req.body || {};
  const baseUrl = `${req.protocol}://${req.get('host')}`;


  let t;
  try {
    // 'Admin', 'Client'
    if (!['Client'].includes(type)) {
      return res.status(400).json({ success:false, message:'Valid type required: Admin or Client' });
    }
    if (!email && !(country_code && contact)) {
      return res.status(400).json({ success:false, message:'Email or (country_code + contact) is required' });
    }

    t = await sequelize.transaction();

    const whereUser = email ? { email } : { country_code, contact };
    const Model = (type === 'Admin') ? Admin : ClientAccount;
    const user = await Model.findOne({ where: whereUser, transaction: t });

    if (!user) {
      await t.rollback();
      return res.status(200).json({ success:false, message:`${type} not found` });
    }

     if (user.status !== 'active') {
      await t.rollback();
      return res.status(200).json({ success:false, message:`Your Account is ${user.status} and can not be logged-in.` });
    }

    const actorType = (type === 'Admin') ? (user?.admin_type ?? null) : (user?.type ?? null);
    const actorId   = (type === 'Admin') ? (user?.admin_id ?? null) : (user?.client_account_id ?? null);
    const channel   = email ? 'email' : 'sms';

    // cooldown: find recent pending without locking
    const recent = await OtpCode.findOne({
      where: {
        purpose,
        channel,
        status: 'pending',
        expire_at: { [Op.gt]: new Date() },
        ...(email ? { email } : { country_code, contact }),
        last_sent_at: { [Op.gt]: new Date(Date.now() - 30 * 1000) },  // Resend wait for 30 sec
      },
      order: [['id', 'DESC']],
      transaction: t,
      // DO NOT set lock here
    });

    if (recent) {
      await t.rollback();
      await Audit.warn({
        actorType, actorId, url: req.originalUrl,
        action: 'OTP_RESEND_RATE_LIMIT',
        description: `Cooldown hit for ${channel}:${email || `${country_code}${contact}`}`,
      });
      return res.status(429).json({ success:false, message:'Please wait a moment before requesting another OTP.' });
    }

    // create OTP within the same transaction
    const { otp_id, code } = await createOtp({
      req,
      purpose,
      actor_type: actorType,
      client_account_id: (type === 'Admin') ? null : user.client_account_id ?? null,
      channel,
      email: email || null,
      country_code: channel === 'sms' ? country_code : null,
      contact: channel === 'sms' ? contact : null,
      ttlMs: 10 * 60 * 1000,
      max_attempts: 5,
      transaction: t, // <<<<<< IMPORTANT
    });

    console.log('---... login otp ', code)

    // deliver
    const username = `${user.first_name || ''} ${user.last_name || ''}`.trim() || (type === 'Admin' ? 'Admin' : 'Client');
    if (channel === 'email') {


       //await send_otp(username, email, code, baseUrl , purpose , type);
    } else {
      // SMS: plug vendor here
      // await sendOTPSMS(`${country_code}${contact}`, code);
    }

    await t.commit();

    await Audit.success({
      actorType, actorId, url: req.originalUrl,
      action: 'OTP_SENT',
      description: `OTP sent for purpose=${purpose} via ${channel}`,
      extra: { otp_id, channel, destination: email || `${country_code}${contact}` },
    });

    //send-otp-res
    return res.status(200).json({
      success: true,
      message: `OTP sent successfully ${code}`,
      otp_id,
      ...(DEV ? { otp: code } : {}),
    });

  } catch (error) {
    try { if (t && !t.finished) await t.rollback(); } catch {}
    await Audit.failed({
      actorType: 'unknown', actorId: null, url: req.originalUrl,
      action: 'OTP_SEND_ERROR',
      description: kilError(error),
    });
    return res.status(500).json({ success:false, message:`Internal Server Error -> ${kilError(error)}` });
  }
};





export const verify_login_otp = async (req, res) => {
  try {
    const {
      otp_id: rawOtpId,
      otp_code,
      type = 'Client',
      email,
      country_code,
      contact,
      purpose = 'login',
    } = req.body || {};

    // 1) Basic input guards
    //!['Admin', 'Client'].
    if (![ 'Client'].includes(type)) {
      return res.status(400).json({ success:false, message:'Valid type required: Admin or Client' });
    }
    if (!otp_code) {
      return res.status(400).json({ success:false, message:'otp_code is required' });
    }

   
    const haveEmail = !!email;
    const havePhone = !!country_code && !!contact;
    if (!rawOtpId && !haveEmail && !havePhone) {
      return res.status(400).json({ success:false, message:'Provide otp_id OR destination (email or phone).' });
    }

    const channel = haveEmail ? 'email' : 'sms';
    let otp_id = Number(rawOtpId) || null;

    // 2) If no otp_id provided, pick the most recent pending OTP for this destination+purpose
    if (!otp_id) {
      const byDest = await OtpCode.findOne({
        where: {
          purpose,
          status: 'pending',
          channel,
          expire_at: { [Op.gt]: new Date() },
          ...(haveEmail ? { email } : { country_code, contact }),
        },
        order: [['id', 'DESC']],
      });
      if (!byDest) {
        return res.status(400).json({ success:false, message:'No active OTP found for this destination.' });
      }
      otp_id = byDest.id;
    }

    // 3) Extra safety: ensure the otp_id we’re verifying matches the destination & purpose
    const otpRow = await OtpCode.findByPk(otp_id);
    if (!otpRow) {
      return res.status(400).json({ success:false, message:'Invalid OTP.' });
    }
    // Purpose must match
    if (otpRow.purpose !== purpose) {
      return res.status(400).json({ success:false, message:'OTP purpose mismatch.' });
    }
    // Destination must match (if the client provided one)
    if (haveEmail && (otpRow.channel !== 'email' || otpRow.email !== email)) {
      return res.status(400).json({ success:false, message:'Destination mismatch for this OTP.' });
    }
    if (havePhone && (otpRow.channel !== 'sms' || otpRow.country_code !== country_code || otpRow.contact !== contact)) {
      return res.status(400).json({ success:false, message:'Destination mismatch for this OTP.' });
    }

    // 4) Verify via service (handles attempts/lock/expiry; marks verified on success)
    const result = await verifyOtp({ req, otp_id, code: otp_code, consumeOnSuccess: true });

    if (!result.ok) {
      switch (result.reason) {
        case 'NOT_FOUND':
          return res.status(400).json({ success:false, message:'Invalid OTP.' });
        case 'EXPIRED':
          return res.status(400).json({ success:false, message:'OTP has expired.' });
        case 'LOCKED':
          return res.status(423).json({ success:false, message:'Too many attempts. OTP locked.' });
        case 'INVALID':
          return res.status(401).json({
            success:false,
            message:'Incorrect OTP.',
            attempts_left: result.attempts_left ?? 0
          });
        default:
          return res.status(400).json({ success:false, message:'OTP verification failed.' });
      }
    }

    // 5) On success: optionally mark user verified (only for relevant purposes)
    const markVerifiedPurposes = new Set(['login', 'register', 'verify_email', 'verify_phone']);
    if (markVerifiedPurposes.has(purpose)) {
      const whereUser = haveEmail ? { email } : (havePhone ? { country_code, contact } : {});
      const Model = (type === 'Admin') ? Admin : ClientAccount;
      const user = await Model.findOne({ where: whereUser });

      if (!user) {
        return res.status(404).json({ success:false, message:`${type} not found` });
      }

           const actorType = (type === 'Admin') ? (user?.admin_type ?? null) : (user?.type ?? null);
            const actorId   = (type === 'Admin') ? (user?.admin_id ?? null) : (user?.client_account_id ?? null);

      // if (haveEmail) user.email_verified = 'Yes';
      // if (havePhone) user.contact_verified = 'Yes';
      // await user.save();

      await Audit.success({
        actorType: actorType,
        actorId: actorId,
        url: req.originalUrl,
        action: 'OTP_VERIFIED_OK',
        description: `OTP verified for purpose=${purpose}`,
        extra: { otp_id, destination: haveEmail ? email : `${country_code}${contact}` },
      });

      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        user_id: (type === 'Admin') ? user.admin_id : user.client_account_id,
        email_verified: user.email_verified,
        contact_verified: user.contact_verified,
      });
    }

    // For purposes that shouldn’t flip flags (e.g., reset_password), just return OK
    await Audit.success({
      actorType: actorType, actorId:actorId, url: req.originalUrl,
      action: 'OTP_VERIFIED_OK',
      description: `OTP verified for purpose=${purpose}`,
      extra: { otp_id },
    });

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
    });

  } catch (error) {
    console.log('Errro in verifying OTP --> ', error)
    await Audit.failed({
      actorType: 'unknown', actorId: null, url: req.originalUrl,
      action: 'OTP_VERIFY_ERROR',
      description: kilError(error),
    });
    return res.status(500).json({ success:false, message:`Internal Server Error -> ${kilError(error)}` });
  }
};



export const resetPasswordPost = async (req, res) => {
  const { actorType, actorId } = (function deriveActorForReset(req){
    return { actorType: 'Guest', actorId: null };
  })(req);

  const t = await sequelize.transaction();
  try {
    let { email, otp, otp_id, new_password, confirm_password, timezone } = req.body || {};


    //  For AES encryption ----
    // try { if (email) email = decrypt64(email); } catch {}
    // try { if (otp) otp = decrypt64(otp); } catch {}
    // try { if (new_password) new_password = decrypt64(new_password); } catch {}
    // try { if (confirm_password) confirm_password = decrypt64(confirm_password); } catch {}


           // 🔐 RSA-OAEP decrypt (async)
        try { if (email)    email    = await rsaDecryptBase64(email);    } catch {}
        try { if (otp) otp = await rsaDecryptBase64(otp); } catch {}
        try { if (new_password)    new_password    = await rsaDecryptBase64(new_password);    } catch {}
        try { if (confirm_password) confirm_password = await rsaDecryptBase64(confirm_password); } catch {}

    email = (email || '').trim();
    otp = (otp || '').trim();
    new_password = (new_password || '').trim();
    confirm_password = (confirm_password || '').trim();

    if (!email || !otp || !new_password || !confirm_password) {
      await t.rollback();
      const msg = 'Please fill email, OTP, new password and confirm password.';
      return isAjax(req) ? res.status(400).json({ success:false, message: msg })
                         : res.render('/login', { output: msg });
    }

    if (new_password !== confirm_password) {
      await t.rollback();
      const msg = 'Password and confirm password do not match.';
      return isAjax(req) ? res.status(400).json({ success:false, message: msg })
                         : res.render('/login', { output: msg });
    }

    // Lock user row in THIS transaction
    const clientAccount = await ClientAccount.findOne({ where:{ email }, transaction: t, lock: t.LOCK.UPDATE });
    if (!clientAccount) {
      await t.rollback();
      const msg = 'Account not found.';
      await Audit.denied({ actorType, actorId, url:req.originalUrl, action:'RESET_PW_USER_NOT_FOUND', description:`email=${email}` });
      return isAjax(req) ? res.status(404).json({ success:false, message: msg })
                         : res.render('/login', { output: msg });
    }

    if (clientAccount.status !== 'active') {
      await t.rollback();
      const msg = `Your Account is ${clientAccount.status} and cannot reset password.`;
      return isAjax(req) ? res.status(200).json({ success:false, message: msg })
                         : res.render('/login', { output: msg });
    }

    // Resolve latest pending OTP if not provided
    let resolvedOtpId = Number(otp_id) || null;
    if (!resolvedOtpId) {
      const row = await OtpCode.findOne({
        where: {
          purpose: 'reset_password',
          channel: 'email',
          email,
          status: 'pending',
          expire_at: { [Op.gt]: new Date() },
        },
        order: [['id','DESC']],
        transaction: t,
      });
      if (!row) {
        await t.rollback();
        const msg = 'OTP not found or expired. Please resend OTP.';
        await Audit.denied({ actorType, actorId, url:req.originalUrl, action:'RESET_PW_NO_ACTIVE_OTP', description:`email=${email}` });
        return isAjax(req) ? res.status(400).json({ success:false, message: msg })
                           : res.render('/login', { output: msg });
      }
      resolvedOtpId = row.id;
    }

    // Verify OTP (consume on success) in the SAME transaction
    const v = await verifyOtp({ req, otp_id: resolvedOtpId, code: otp, consumeOnSuccess: true, transaction: t });
    if (!v.ok) {
      await t.rollback();
      let msg = 'OTP verification failed.';
      if (v.reason === 'EXPIRED') msg = 'OTP has expired.';
      else if (v.reason === 'LOCKED') msg = 'Too many attempts. Try again later.';
      else if (v.reason === 'INVALID') msg = 'Incorrect OTP.';
      await Audit.denied({ actorType, actorId, url:req.originalUrl, action:'RESET_PW_OTP_FAILED', description:`reason=${v.reason||'UNKNOWN'}` });
      return isAjax(req) ? res.status(400).json({ success:false, message: msg })
                         : res.render('/login', { output: msg });
    }

    // Enforce history (same transaction)
    const reused = await violatesHistory({ type: 'Client', user: clientAccount, newPlainPassword: new_password, transaction: t });
    if (reused) {
      await t.rollback();
      const msg = 'You cannot reuse your last 3 passwords.';
      return isAjax(req) ? res.status(400).json({ success:false, message: msg })
                         : res.render('/login', { output: msg });
    }

    // Atomic update + history + session invalidation (same transaction)
    await updatePasswordWithHistory({ type: 'Client', user: clientAccount, newPlainPassword: new_password, transaction: t });

    // Optional: timezone in the same transaction
    if (timezone && timezone !== clientAccount.timezone) {
      clientAccount.timezone = timezone;
      await clientAccount.save({ transaction: t });
    }

    await t.commit();

    // Notify user (outside of transaction)
    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      await send_password_change_email(
        `${clientAccount.first_name||''} ${clientAccount.last_name||''}`.trim() || 'Client',
        clientAccount.email,
        baseUrl
      );
    } catch {}

    await Audit.success({ actorType, actorId, url:req.originalUrl, action:'RESET_PW_SUCCESS', description:`Password reset ok for ${email}` });

    // Auto-login (respects 2FA inside sendTokenClientBrowser)
    const memberships = await loadClientMemberships(clientAccount.client_account_id);
    if (!memberships.length) {
      const msg = 'No active firm membership found for this account.';
      return isAjax(req) ? res.status(403).json({ success:false, message: msg })
                         : res.render('/login', { output: msg });
    }

    if (memberships.length === 1) {
      const m = memberships[0];
      return await sendTokenClientBrowser(clientAccount, 200, res, req, {
        activeFirmId: m.firm_id,
        firmClientId: m.client_id,
        redirect: '/home'
      });
    }

    return await sendTokenClientBrowser(clientAccount, 200, res, req, {
      needsFirmSelect: true,
      redirect: '/home'   //'/choose_firm'  if you forcefully want to choose firm
    });

  } catch (error) {
    try { if (!t.finished) await t.rollback(); } catch {}
    await Audit.failed({ actorType:'Guest', actorId:null, url:req.originalUrl, action:'RESET_PW_ERROR', description: kilError(error) });
    const msg = `Internal Server: ${kilError(error)}`;
    return isAjax(req) ? res.status(500).json({ success:false, message: msg })
                       : res.render('/login', { output: msg });
  }
};




//===================== END CLIENT LOGIN SECTION ===========================================




export const logout = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const client_account_id = req?.client?.client_account_id || null;
      const { actorType, actorId } = deriveActor(req);



    // 2) Drop active session rows
    if (client_account_id) {
      await ActiveSessionClient.destroy({ where: { client_account_id }, transaction: t });
    }

    // 3) Clear cookie(s)
    res.cookie('elaw_client_token', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/',
    });

    // 4) Audit (optional)
    try {
      await Audit.success({
        actorType: actorType,
        actorId: actorId,
        url: req.originalUrl,
        action: 'CLIENT_LOGOUT',
        description: 'User logged out',
        clientId: client_account_id,
      }, { transaction: t });
    } catch {}

    await t.commit();

    // 5) Flash + redirect
    try { flashSet(res, 'elaw_msg', 'Logged out successfully !!'); } catch {}
    return res.redirect('/login');
  } catch (error) {
    try { await t.rollback(); } catch {}
    console.error('Logout error:', error);
    return res.render('errors/error500', { output: `Internal Server: ${kilError(error)}` });
  }
};


export const logout_inactive = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const client_account_id = req?.body?.client_account_id || null;
       const client = await ClientAccount.findOne({ where: { client_account_id: client_account_id } }) 
       req.client = client
      const { actorType, actorId } = deriveActor(req);


    // 2) Drop active session rows
    if (client_account_id) {
      await ActiveSessionClient.destroy({ where: { client_account_id }, transaction: t });
    }

    // 3) Clear cookie(s)
    res.cookie('elaw_client_token', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/',
    });

    // 4) Audit (optional)
    try {
      await Audit.success({
        actorType: actorType,
        actorId: actorId,
        url: req.originalUrl,
        action: 'CLIENT_LOGOUT',
        description: 'User logged out',
        clientId: client_account_id,
      }, { transaction: t });
    } catch {}

    await t.commit();

    // 5) Flash + redirect
    try { flashSet(res, 'elaw_msg', `Your Account has been ${client?.status} and can not be logged-in.`); } catch {}
    return res.redirect('/login');
  } catch (error) {
    try { await t.rollback(); } catch {}
    console.error('Logout error:', error);
    return res.render('errors/error500', { output: `Internal Server: ${kilError(error)}` });
  }
};

//=================== Profile Start ===============================

export const profile = async (req, res) => {

   const output = flashPop(req, res, 'elaw_msg');
   console.log('Output --->>> ', output)
  try { 

          var client_account_id = req.client.client_account_id || 0;
    
            const client = await ClientAccount.findOne({ where: { client_account_id: client_account_id } ,  raw: true, nest: true}) 
            if (client) {
              client.client_id = client.client_account_id;
            }
             res.render('client/profile',{  output , clientdata:client  });    

  } catch (error) {

    console.error(' Error :', error);
       return res.render('errors/error500', { output: `Internal Server: ${kilError(error)}` });
  }
};




export const profilePost11 = async (req, res) => {
  const t = await sequelize.transaction();
  const actor = deriveActor(req);

  try {


    let {
      type,
      business_name,
      first_name,
      last_name,
      email,
      country_code,
      contact,
      dob,
     
      parish,
      postal_zone,
      address,

    
    } = req.body || {};

     const client_account_id = req.client?.client_account_id;
    if (!client_account_id) {
      flashSet(res, 'elaw_msg', 'Login required');
      return res.redirect('/login');
    }

    const client = await ClientAccount.findOne({
      where: { client_account_id },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!client) {
      if (!t.finished) await t.rollback();
      return toastFailJson(res, 404, 'Client not found.');
    }

    type          = (type === 'Business') ? 'Business' : 'Individual';
    business_name = String(business_name || '').trim();
    first_name    = String(first_name    || '').trim();
    last_name     = String(last_name     || '').trim();
    email         = String(email         || '').trim().toLowerCase();
    country_code  = String(country_code  || '').trim();
    contact       = String(contact       || '').trim();
    dob           = dob ? String(dob).substring(0, 10) : null;
 
    parish        = String(parish        || '').trim() || null;
    postal_zone   = String(postal_zone   || '').trim() || null;
    address       = String(address       || '').trim() || null;




    const errors = [];
    if (!first_name) errors.push('First name is required.');
    if (!last_name)  errors.push('Last name is required.');
    if (type === 'Business' && !business_name) {
      errors.push('Business name is required for Business clients.');
    }

    if (errors.length) {
      if (!t.finished) await t.rollback();
      await Audit.denied?.({
        actorType: actor.actorType,
        actorId:   actor.actorId,
        action:    'CLIENT_UPDATE_VALIDATION_FAILED',
        description: errors.join(', ')
      });
      return toastFailJson(res, 400, errors[0]);
    }

    // Email uniqueness (exclude this client)
    if (email) {
      const dupEmail = await ClientAccount.findOne({
        where: {
          email,
          client_account_id: { [Op.ne]: client_account_id }
        },
        transaction: t,
        lock: t.LOCK.UPDATE
      });
      if (dupEmail) {
        if (!t.finished) await t.rollback();
        return toastFailJson(res, 409, 'Another client in your firm already uses this email.');
      }
    }

    // Phone uniqueness (exclude this client)
    const cleanPhone = (country_code + contact)
      .replace(/[\s-]/g, '')
      .replace(/^0+/, '');

    if (cleanPhone) {
      const dupPhone = await ClientAccount.count({
        where: {
          client_account_id: { [Op.ne]: client_account_id },
          full_contact: cleanPhone
        },
        transaction: t
      });
      if (dupPhone > 0) {
        if (!t.finished) await t.rollback();
        return toastFailJson(res, 409, 'Another client already uses this phone.');
      }
    }

    const profilePicKey = req.file?.s3Key || null;
    if (profilePicKey) {
      client.profile_pic = profilePicKey;
    }

    client.type          = type;
    client.business_name = business_name || null;
    client.first_name    = first_name;
    client.last_name     = last_name;
    client.email         = email || null;
    client.country_code  = country_code || null;
    client.contact       = contact || null;
    client.full_contact  = cleanPhone || '';
    client.address       = address;
    client.parish        = parish;
    client.postal_zone   = postal_zone;
    client.dob           = dob || null;
  

    await client.save({ transaction: t });
    await t.commit();

    await Audit.success?.({
      actorType: actor.actorType,
      actorId:   actor.actorId,
      action:    'CLIENT_UPDATED',
      description: `Client account #${client_account_id} updated `
    });

    return toastOkJson(res, 'Client updated successfully.');
  } catch (error) {
    console.log('CLIENT_UPDATE_ERROR:', error);
    try { if (!t.finished) await t.rollback(); } catch {}
    await Audit.failed?.({
      actorType: actor.actorType,
      actorId:   actor.actorId,
      action:    'CLIENT_UPDATE_ERROR',
      description: String(error?.message || error)
    });
    return toastFailJson(res, 500, `Internal Server: ${kilError(error)}`);
  }
};



export const profilePost = async (req, res) => {
  const t = await sequelize.transaction();
  const actor = deriveActor(req);

  try {


    let {
      type,
      business_name,
      first_name,
      last_name,
      email,
      country_code,
      contact,
      dob,
     
      parish,
      postal_zone,
      address,

    
    } = req.body || {};

     const client_account_id = req.client?.client_account_id;
    if (!client_account_id) {
      flashSet(res, 'elaw_msg', 'Login required');
      return res.redirect('/login');
    }

    const client = await ClientAccount.findOne({
      where: { client_account_id },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!client) {
      if (!t.finished) await t.rollback();
          return isAjax(req) ? toastFailJson(res, 404, 'Client not found.')
           : (flashSet(res, 'elaw_msg', 'Client not found.'), res.redirect('/profile'));
    }




    type          = (type === 'Business') ? 'Business' : 'Individual';
    business_name = String(business_name || '').trim();
    first_name    = String(first_name    || '').trim();
    last_name     = String(last_name     || '').trim();
    email         = String(email         || '').trim().toLowerCase();
    country_code  = String(country_code  || '').trim();
    contact       = String(contact       || '').trim();
    dob           = dob ? String(dob).substring(0, 10) : null;
 
    parish        = String(parish        || '').trim() || null;
    postal_zone   = String(postal_zone   || '').trim() || null;
    address       = String(address       || '').trim() || null;




    const errors = [];
    if (!first_name) errors.push('First name is required.');
    if (!last_name)  errors.push('Last name is required.');
    if (type === 'Business' && !business_name) {
      errors.push('Business name is required for Business clients.');
    }

    if (errors.length) {
      if (!t.finished) await t.rollback();
      await Audit.denied?.({
        actorType: actor.actorType,
        actorId:   actor.actorId,
        action:    'CLIENT_UPDATE_VALIDATION_FAILED',
        description: errors.join(', ')
      });

        return isAjax(req) ? toastFailJson(res, 400, errors[0])
           : (flashSet(res, 'elaw_msg', errors[0] ), res.redirect('/profile'));


    }

    // Email uniqueness (exclude this client)
    if (email) {
      const dupEmail = await ClientAccount.findOne({
        where: {
          email,
          client_account_id: { [Op.ne]: client_account_id }
        },
        transaction: t,
        lock: t.LOCK.UPDATE
      });
      if (dupEmail) {
        if (!t.finished) await t.rollback();     
            return isAjax(req) ? toastFailJson(res, 409, 'Another client in your firm already uses this email.')
           : (flashSet(res, 'elaw_msg', 'Another client in your firm already uses this email.' ), res.redirect('/profile'));
      }
    }

    // Phone uniqueness (exclude this client)
    const cleanPhone = (country_code + contact)
      .replace(/[\s-]/g, '')
      .replace(/^0+/, '');

    if (cleanPhone) {
      const dupPhone = await ClientAccount.count({
        where: {
          client_account_id: { [Op.ne]: client_account_id },
          full_contact: cleanPhone
        },
        transaction: t
      });
      if (dupPhone > 0) {
        if (!t.finished) await t.rollback();

            return isAjax(req) ? toastFailJson(res, 400, 'Another client already uses this phone.')
           : (flashSet(res, 'elaw_msg', 'Another client already uses this phone.' ), res.redirect('/profile'));
      }
    }

    const profilePicKey = req.file?.s3Key || null;
    if (profilePicKey) {
      client.profile_pic = profilePicKey;
    }

    client.type          = type;
    client.business_name = business_name || null;
    client.first_name    = first_name;
    client.last_name     = last_name;
    client.email         = email || null;
    client.country_code  = country_code || null;
    client.contact       = contact || null;
    client.full_contact  = cleanPhone || '';
    client.address       = address;
    client.parish        = parish;
    client.postal_zone   = postal_zone;
    client.dob           = dob || null;
  

    await client.save({ transaction: t });
    await t.commit();

    await Audit.success?.({
      actorType: actor.actorType,
      actorId:   actor.actorId,
      action:    'CLIENT_UPDATED',
      description: `Client account #${client_account_id} updated `
    });



      return isAjax(req) ? toastOkJson(res, 'Client updated successfully.')
           : (flashSet(res, 'elaw_msg', 'Client updated successfully.' ), res.redirect('/profile'));


  } catch (error) {
    console.log('CLIENT_UPDATE_ERROR:', error);
    try { if (!t.finished) await t.rollback(); } catch {}
    await Audit.failed?.({
      actorType: actor.actorType,
      actorId:   actor.actorId,
      action:    'CLIENT_UPDATE_ERROR',
      description: String(error?.message || error)
    });

      return isAjax(req) ? toastFailJson(res, 500,   `Internal Server: ${kilError(error)}`)
           : (flashSet(res, 'elaw_msg',  `Internal Server: ${kilError(error)}` ), res.redirect('/profile'));


  }
};


// Send OTP to the logged-in client's email for password change
export const sendPasswordChangeOtp = async (req, res) => {
  try {
    const client = req.client;
    if (!client || !client.email) {
      return res.status(401).json({ success:false, message:'Not authorized' });
    }

    const purpose = 'reset_password';
    const channel = 'email';
    const email   = client.email;

    const t = await sequelize.transaction();
    try {
      // cooldown 30s
      const recent = await OtpCode.findOne({
        where: {
          purpose,
          channel,
          status: 'pending',
          email,
          expire_at: { [Op.gt]: new Date() },
          last_sent_at: { [Op.gt]: new Date(Date.now() - 30 * 1000) },
        },
        order: [['id','DESC']],
        transaction: t,
      });
      if (recent) {
        await t.rollback();
        return res.status(429).json({ success:false, message:'Please wait before requesting another OTP.' });
      }

      const { otp_id, code } = await createOtp({
        req,
        purpose,
        actor_type: client.type || 'Client',
        client_account_id: client.client_account_id,
        channel,
        email,
        ttlMs: 10 * 60 * 1000,
        max_attempts: 5,
        transaction: t,
      });

      // send email
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const name    = `${client.first_name||''} ${client.last_name||''}`.trim() || 'Client';
   
      
      const type = 'Client'  
       await send_otp(name, email, code, baseUrl , 'change_password' , type);

      await t.commit();
      //send-otp-res
      return res.status(200).json({
        success:true,
        message:`OTP sent to your email`,
        otp_id,
        ...(process.env.NODE_ENV !== 'production' ? { otp: code } : {}),
      });
    } catch (e){
      console.log("error ",e)
      try { if (t && !t.finished) await t.rollback(); } catch {}
      return res.status(500).json({ success:false, message:`Internal Server Error -> ${kilError(e)}` });
    }
  } catch (err) {
    console.log(err)
    return res.status(500).json({ success:false, message:`Internal Server Error -> ${kilError(err)}` });
  }
};

// Change/Set password (OTP required; also checks current password if already set)
export const changePasswordPost = async (req, res) => {
  console.log('Setting Password first time ')

  console.log('req.bodyyy -->>> ,', req.body)

  const t = await sequelize.transaction();
  try {
    let { email, otp, otp_id, new_password, confirm_password, current_password, timezone } = req.body || {};


    // decrypt like login
    try { if (email)           email           = await rsaDecryptBase64(email); } catch {}
    try { if (otp)             otp             = await rsaDecryptBase64(otp);   } catch {}
    try { if (new_password)    new_password    = await rsaDecryptBase64(new_password); } catch {}
    try { if (confirm_password)confirm_password= await rsaDecryptBase64(confirm_password); } catch {}
    try { if (current_password)current_password= await rsaDecryptBase64(current_password); } catch {}

    
    email            = (email || '').trim();
    otp              = (otp   || '').trim();
    new_password     = (new_password || '').trim();
    confirm_password = (confirm_password || '').trim();
    current_password = (current_password || '').trim();

    const client = req.client;



    if (!client || !client.email || !email || client.email.toLowerCase() !== email.toLowerCase()) {
      await t.rollback();
      return res.status(401).json({ success:false, message:'Unauthorized or mismatched email' });
    }

    if (!new_password || !confirm_password) {
      await t.rollback();
      return res.status(400).json({ success:false, message:'Enter new password and confirm password' });
    }
    if (new_password !== confirm_password) {
      await t.rollback();
      return res.status(400).json({ success:false, message:'New password and confirm password do not match' });
    }

    // lock row
    const fresh = await ClientAccount.findOne({
      where: { client_account_id: client.client_account_id },
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    if (!fresh) {
      await t.rollback();
      return res.status(404).json({ success:false, message:'Account not found' });
    }
    if (fresh.status !== 'active') {
      await t.rollback();
      return res.status(200).json({ success:false, message:`Your Account is ${fresh.status} and cannot change password.` });
    }

    // If already has a password, require correct current password
    if (fresh.password) {
      if (!current_password) {
        await t.rollback();
        return res.status(400).json({ success:false, message:'Enter your current password' });
      }
      const ok = await comparePassword(current_password, fresh.password);
      if (!ok) {
        await t.rollback();
        return res.status(401).json({ success:false, message:'Current password is incorrect' });
      }
    }


    // Resolve/verify OTP for purpose reset_password
    const purpose = 'reset_password';
    let resolvedOtpId = Number(otp_id) || null;
    if (!resolvedOtpId) {
      const row = await OtpCode.findOne({
        where: {
          purpose,
          channel: 'email',
          email,
          status: 'pending',
          expire_at: { [Op.gt]: new Date() },
        },
        order: [['id','DESC']],
        transaction: t,
      });
      if (!row) {
        await t.rollback();
        return res.status(400).json({ success:false, message:'OTP not found or expired. Please resend OTP.' });
      }
      resolvedOtpId = row.id;
    }

    const v = await verifyOtp({ req, otp_id: resolvedOtpId, code: otp, consumeOnSuccess: true, transaction: t });
    if (!v.ok) {
      await t.rollback();
      let msg = 'OTP verification failed.';
      if (v.reason === 'EXPIRED') msg = 'OTP has expired.';
      else if (v.reason === 'LOCKED') msg = 'Too many attempts. Try again later.';
      else if (v.reason === 'INVALID') msg = 'Incorrect OTP.';
      return res.status(400).json({ success:false, message: msg });
    }

    // Enforce history within same transaction
    const reused = await violatesHistory({
      type: 'Client',
      user: fresh,
      newPlainPassword: new_password,
      transaction: t
    });
    if (reused) {
      await t.rollback();
      return res.status(400).json({ success:false, message:'You cannot reuse your last 3 passwords.' });
    }


 


    // Atomic update + history + session invalidation
    await updatePasswordWithHistory({
      type: 'Client',
      user: fresh,
      newPlainPassword: new_password,
      transaction: t
    });

    if (timezone && timezone !== fresh.timezone) {
      fresh.timezone = timezone;
      await fresh.save({ transaction: t });
    }

    await t.commit();

    // optional notify
    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const name = `${fresh.first_name||''} ${fresh.last_name||''}`.trim() || 'Client';
      await send_password_change_email(name, fresh.email, baseUrl);
    } catch {}

    return res.status(200).json({ success:true, message:'Password updated' });

  } catch (error) {
    console.log(error)
    try { /* t may already be finished */ } finally {}
    return res.status(500).json({ success:false, message:`Internal Server: ${kilError(error)}` });
  }
};

// Toggle Two-Step Verification (On/Off)
export const twoStepTogglePost = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const client = req.client;
    if (!client) {
      await t.rollback();
      return res.status(401).json({ success:false, message:'Not authorized' });
    }
    const { status } = req.body || {};
    const val = (status === 'On') ? 'On' : 'Off';

    const fresh = await ClientAccount.findOne({
      where: { client_account_id: client.client_account_id },
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    if (!fresh) {
      await t.rollback();
      return res.status(404).json({ success:false, message:'Account not found' });
    }

    fresh.two_step_verification = val;
    await fresh.save({ transaction: t });
    await t.commit();

    return res.status(200).json({ success:true, message:`Two-Step Verification ${val}` });
  } catch (e) {
    console.log(e)
    try { await t.rollback(); } catch {}
    return res.status(500).json({ success:false, message:`Internal Server: ${kilError(e)}` });
  }
};






//==================== Profile Section END ================================

export const dashboard = async (req, res) => {

   const output = flashPop(req, res, 'elaw_msg');
  try { 
 

    res.render('client/dashboard',{  output   });    

  } catch (error) {

    console.error(' Error :', error);
       return res.render('errors/error500', { output: `Internal Server: ${kilError(error)}` });
  }
};



//================ Intake Section ====================================

// ===================== SERVICES -> FIRMS -> INTAKE FLOW =====================

// Small helper
function safeTrim(v){ return String(v ?? '').trim(); }
function snippetText(v, max=160){
  const s = safeTrim(v).replace(/\s+/g,' ');
  if (!s) return '';
  return s.length > max ? s.slice(0, max-3) + '...' : s;
}
function firmLogoUrl(logoKey){
  if (!logoKey) return null;
  return '/secure/file_stream?s3key=' + encodeURIComponent(logoKey);
}







export const notifications = async (req, res) => {

   const output = flashPop(req, res, 'elaw_msg');
  try { 
 

    res.render('client/notifications',{  output   });    

  } catch (error) {

    console.error(' Error :', error);
       return res.render('errors/error500', { output: `Internal Server: ${kilError(error)}` });
  }
};






export const support = async (req, res) => {

   const output = flashPop(req, res, 'elaw_msg');
  try { 
 

    res.render('client/support',{  output   });    

  } catch (error) {

    console.error(' Error :', error);
       return res.render('errors/error500', { output: `Internal Server: ${kilError(error)}` });
  }
};












export const terms_conditions = async (req, res, next) => {
  try {
    const tandc = await TandC.findOne({
      where: { tandc_type: 'User' },
      order: [['id', 'DESC']],
    });

    if (!tandc) {
      return res.status(404).send('Terms & Conditions not found for User.');
    }


    // // Path to the EJS template
    // const templatePath = path.join(__dirname, "../views/", "kiltandc.ejs");
    // // Render the template with the terms data
    // const html = await ejs.renderFile(templatePath, { terms: tandc.terms });
    // res.send(html);

        //res.render('customer/terms_conditions', { terms: tandc.terms });

            // Sanitized HTML for display (safe to use with <%- %>)
    const termsSafe = sanitizeRich(tandc.terms || '');
    res.render('customer/terms_conditions', { terms:termsSafe });

    
    // const zoomedContent = `<div style="zoom: 150%;">${tandc.terms}</div>`;  // for plain html as it is 
    // res.send(zoomedContent);

  } catch (error) {
    console.error('Terms and Condition Page Error ', error);
       return res.render('customer/error500', { output: `Internal Server: ${kilError(error)}` });
  }
};



export const privacy_policy = async (req, res) => {
  try {

   
    const policy = await PandP.findOne({
      where: { policy_type: 'User' },
      order: [['id', 'DESC']],
    });

    if (!policy) {
      return res.status(404).send('User Privacy Policy not found.');
    }

    //  // Path to the EJS template
    // const templatePath = path.join(__dirname, "../views/", "kilpandp.ejs");

    // // Render the template with the terms data
    // const html = await ejs.renderFile(templatePath, { terms: policy.policy });
    // res.send(html);


      const policySafe = sanitizeRich(policy.policy || '');
    res.render('customer/privacy_policy', { policy: policySafe});


    // const zoomedContent = `<div style="zoom: 150%;">${policy.policy}</div>`;
    // res.send(zoomedContent);

  } catch (error) {
  
     console.error('Privacy & Policy Page Error ', error);
       return res.render('customer/error500', { output: `Internal Server: ${kilError(error)}` });

  }
};

