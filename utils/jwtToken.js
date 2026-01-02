// jwt_token.js
import jwt from 'jsonwebtoken';
import path from 'path';
import dotenv from 'dotenv';
import sequelize from '../config/sequelize.js';
import { Audit } from '../utils/auditLogger.js';

import ActiveSessionAdmin from '../models/ActiveSessionAdmin.js';
import ActiveSessionClient from '../models/ActiveSessionClient.js';

import { kilError  } from '../utils/kilError.js';

import { isAjax } from "../helper/helper.js";


const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// ----- core token creators -----
export function getJWTToken(id, extra = {}) {
  const payload = { id, ...extra };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
}

export function cookieOptions(pathPrefix) {
  return {
    expires: new Date(Date.now() + Number(process.env.COOKIE_EXPIRE) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // sameSite: 'Strict',
    // path: pathPrefix,
    sameSite: 'Lax',             // <- good default
    path: '/',                   // <- share across /client and /api
  };
}

// ------------ tiny helpers (avoid duplication) ------------
async function persistSession({ model, idField, idValue, token, transaction }) {
  await model.destroy({ where: { [idField]: idValue }, transaction });
  await model.create({
    [idField]: idValue,
    token,
    expires_at: new Date(Date.now() + Number(process.env.COOKIE_EXPIRE) * 24 * 60 * 60 * 1000),
  }, { transaction });
}

// ==========================================================
// ============== ADMIN — BROWSER (cookie+redirect) =========
// ==========================================================

export const sendTokenAdminBrowser = async (admin, statusCode = 200, res, req) => {
  const ajax = isAjax(req); // xhr / Accept: application/json
  const t = await sequelize.transaction();

  try {
    // Issue token
    const token = getJWTToken(admin.admin_id, { typ: 'admin' });

    console.log("TOKENNNNNNNNNN ", token)

    // Persist session atomically
    await persistSession({
      model: ActiveSessionAdmin,
      idField: 'admin_id',
      idValue: admin.admin_id,
      token,
      transaction: t,
    });

    // Commit DB work before sending any response
    await t.commit();

    // Audit
    try {
      await Audit.success({
        actorType: admin.admin_type || 'admin',
        actorId: admin.admin_id,
        url: (req?.originalUrl || ''),
        action: 'ADMIN_LOGIN_SUCCESS',
        description: `Successful login for ${admin.email}`,
      });
    } catch {}

    // Set cookie
    res.cookie('elaw_admin_token', token, cookieOptions('/superadmin'));

    if (ajax) {
      // ✅ AJAX: the client will redirect
      return res.status(statusCode).json({
        success: true,
        redirect: '/superadmin',
      });
    }

    // Non-AJAX fallback
    return res.status(statusCode).redirect('/superadmin');

  } catch (error) {
    try { if (!t.finished) await t.rollback(); } catch {}
    console.log(error);
    try {
      await Audit.failed({
        actorType: 'admin',
        actorId: null,
        url: (req?.originalUrl || ''),
        action: 'ADMIN_LOGIN_TOKEN_ERROR',
        description: kilError(error),
      });
    } catch {}
    return res.status(500).json({ success:false, message: `Internal Server: ${kilError(error)}` });
  }
};



// ==========================================================
// ============ Client — BROWSER (cookie+redirect) ========
// ==========================================================

export const sendTokenClientBrowser = async (clientAccount, statusCode = 200, res, req, opts = {}) => {
  const ajax = isAjax(req); // xhr / Accept: application/json
  const t = await sequelize.transaction();

  try {
    const activeFirmId = opts.activeFirmId ?? null;
    const firmClientId = opts.firmClientId ?? null;
    const token = getJWTToken(clientAccount.client_account_id, {
      typ: 'client',
      active_firm_id: activeFirmId,
      firm_client_id: firmClientId
    });
    await persistSession({
      model: ActiveSessionClient,
      idField: 'client_account_id',
      idValue: clientAccount.client_account_id,
      token,
      transaction: t,
    });

    // Commit DB work before sending any response
    await t.commit();



    res.cookie('elaw_client_token', token, cookieOptions('/'));

    const redirectTo = opts.redirect || (activeFirmId ? '/home' : '/choose_firm');

    if (ajax) {
      return res.status(statusCode).json({
        success: true,
        redirect: redirectTo,
        ...(opts.needsFirmSelect ? { needs_firm_select: true } : {})
      });
    }

    return res.status(statusCode).redirect(redirectTo);

  } catch (error) {
    try { if (!t.finished) await t.rollback(); } catch {}
    console.error('ClientBrowser sendToken error:', error);

    if (ajax) {
      return res.status(500).json({
        success: false,
        message: `Internal Server: ${kilError(error)}`,
      });
    }
    return res.status(500).send(`Internal Server: ${kilError(error)}`);
  }
};










