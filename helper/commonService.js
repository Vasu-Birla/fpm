//   services/services.js


import sequelize from "../config/sequelize.js";
import * as url from 'url';
import * as path from 'path';
// import fs from 'fs/promises';
import fsextra from "fs-extra";

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import readline from 'node:readline';

import os from 'os';
import moment from 'moment-timezone';
import ejs from "ejs";
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

import * as crypto from 'node:crypto';


  import { extractEmailsFromBuffer } from '../utils/excelcsvimporter.js'

import { ClientAccount } from "../models/index.js";





import { Op, col ,Sequelize } from 'sequelize';

//=========================================================================================




// tiny util: extension from URL or path
function extFromMaybeUrl(str) {
  try {
    const pathname = new URL(str).pathname;
    return path.extname(pathname).toLowerCase();
  } catch {
    return path.extname(str || '').toLowerCase();
  }
}

function normalizeContact(raw) {
  return String(raw || '').replace(/[\s\-]/g, '').replace(/^0+/, '');
}

function requiredChecks(payload) {
  const {
    trn_number, first_name, last_name, type, email,
    country_code, contact, parish, postal_code,
  } = payload;

  const missing = [];
  if (!trn_number)   missing.push('TRN Number');
  if (!first_name)   missing.push('First Name');
  if (!last_name)    missing.push('Last Name');
  if (!type)        missing.push('Client Type');
  if (!email)        missing.push('Email');
  if (!country_code) missing.push('Country Code');
  if (!contact)      missing.push('Contact Number');
  if (!parish)       missing.push('Parish Name');
  if (!postal_code)  missing.push('Postal Code');
  return missing;
}

/**
 * addClientService
 * @param {Object} args
 * @param {Object} args.body - raw input body (from form or api)
 * @param {Object|null} args.file - optional uploaded file object (expects .location for S3)
 * @param {String} args.url - current route url for audit
 * @param {String} args.actorType - 'superadmin' | 'subadmin' | 'api' | 'unknown'
 * @param {Number|null} args.actorId
 * @returns {Promise<{ok:true, client:any} | {ok:false, code:number, message:string, errorType:string, details?:any}>}
 */
export async function addClientService({ body, file, url, actorType, actorId }) {

 
  const t = await sequelize.transaction();
  try {

    // extract + normalize
    const {
      first_name,
      last_name,
      client_type,
      type: rawType,
      trn_number,
      business_name,
      email,
      country_code,
      dob = null,
      gender = 'Male',
      parish,
      postal_code,
      postal_zone,
      client_address,
      address: addressRaw,
      language,
    } = body || {};

    const type = (rawType || client_type || '').toString().toLowerCase().includes('business')
      ? 'Business'
      : 'Individual';
    const address = addressRaw || client_address || null;

    const contact = normalizeContact((body || {}).contact);
    const full_contact = `${(country_code || '').trim()}${(contact || '').trim()}`;
    const profile_pic_raw = file?.location || 'client.jpg';

    // required check
    const missing = requiredChecks({ trn_number, first_name, last_name, type, email, country_code, contact, parish, postal_code });
    if (missing.length) {
      await t.rollback();

      const message = `Missing required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`;
      await Audit.warn({
        actorType, actorId, url,
        action: 'CLIENT_CREATE_VALIDATION_FAIL',
        description: `Validation error. ${message}`,
        extra: { missingFields: missing },
      });
      return { ok: false, code: 422, message, errorType: 'VALIDATION', details: { missing } };
    }

    // image type check
    const imageExt = extFromMaybeUrl(profile_pic_raw);
    const allowed = ['.jpg', '.jpeg', '.png', '.jfif'];
    if (!allowed.includes(imageExt)) {
      await t.rollback();

      const message = 'Profile pic must be JPG, PNG, or JFIF';
      await Audit.warn({
        actorType, actorId, url,
        action: 'CLIENT_CREATE_BAD_IMAGE_TYPE',
        description: `Rejected image type ${imageExt || '[none]'} for email=${email}`,
        extra: { profile_pic_raw },
      });
      return { ok: false, code: 415, message, errorType: 'BAD_IMAGE' };
    }

    // duplicate email
    const existingEmail = await ClientAccount.findOne({
      where: { email },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (existingEmail) {
      await t.rollback();

      await Audit.warn({
        actorType, actorId, url,
        clientId: existingEmail.client_account_id ?? null,
        action: 'CLIENT_CREATE_DUP_EMAIL',
        description: `Duplicate email=${email}`,
      });
      return { ok: false, code: 409, message: 'Email already exists', errorType: 'DUP_EMAIL' };
    }

    // duplicate mobile
    const existingMobile = await ClientAccount.findOne({
      where: { full_contact: full_contact.trim() },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (existingMobile) {
      await t.rollback();

      await Audit.warn({
        actorType, actorId, url,
        clientId: existingMobile.client_account_id ?? null,
        action: 'CLIENT_CREATE_DUP_CONTACT',
        description: `Duplicate contact=${country_code}${contact}`,
      });
      return { ok: false, code: 409, message: 'Contact already exists', errorType: 'DUP_CONTACT' };
    }

    // create
    const created = await ClientAccount.create({
      type,
      trn_number,
      first_name,
      last_name,
      business_name,
      email,
      country_code,
      contact,
      full_contact: full_contact.trim(),
      address,
      parish,
      postal_zone: postal_zone || null,
      postal_code: postal_code || null,
      profile_pic: profile_pic_raw,
      dob,
      gender,
      language: language || undefined,
    }, { transaction: t });

    await t.commit();

    await Audit.success({
      actorType, actorId, url,
      clientId: created.client_account_id,
      action: 'CLIENT_CREATED',
      description: `Client ${created.client_account_id} (${first_name} ${last_name}) created successfully`,
      extra: { email, full_contact, type, parish, postal_code },
    });

    return { ok: true, client: created };
  } catch (err) {
    console.log('Error in Creating Client --->> ',err)
    try { if (!t.finished) await t.rollback(); } catch {}
    await Audit.failed({
      actorType, actorId, url,
      action: 'CLIENT_CREATE_ERROR',
      description: String(err?.message || err),
    });
    return { ok: false, code: 500, message: String(err?.message || err), errorType: 'INTERNAL' };
  }
}





export async function updateClientService({
  body,
  file,
  url,
  actorType = 'unknown',
  actorId = null,
}) {
  const t = await sequelize.transaction();
  try {
    const {
      client_account_id,
      client_id,           // legacy alias for account id
      first_name,
      last_name,
      client_type,
      type: rawType,
      trn_number,
      business_name,
      email,
      country_code,
      dob = null,
      gender = 'Male',
      parish,
      postal_zone,
      postal_code,
      client_address,
      address: addressRaw,
      language,
      profile_pic_url,       // optional direct URL
    } = body || {};

    const accountId = client_account_id || client_id;
    const type = (rawType || client_type || '').toString().toLowerCase().includes('business')
      ? 'Business'
      : 'Individual';
    const address = addressRaw || client_address || null;

    if (!accountId) {
      await t.rollback();
      const message = 'Missing required field: client_account_id';
      await Audit.warn({
        actorType, actorId, url,
        action: 'CLIENT_UPDATE_VALIDATION_FAIL',
        description: `Validation error. ${message}`,
        extra: { missingFields: ['client_account_id'] },
      });
      return { ok: false, code: 422, message, errorType: 'VALIDATION', details: { missing: ['client_account_id'] } };
    }

    // Find target client first (so we can fall back to current profile_pic)
    const client = await ClientAccount.findOne({
      where: { client_account_id: accountId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!client) {
      await t.rollback();
      await Audit.warn({
        actorType, actorId, url,
        action: 'CLIENT_NOT_FOUND',
        description: `Client ${accountId} not found for update`,
      });
      return { ok: false, code: 404, message: 'Client not found', errorType: 'NOT_FOUND' };
    }

    // Normalize contact and precompute full_contact
    const contact = normalizeContact((body || {}).contact);
    const full_contact = `${(country_code || '').trim()}${(contact || '').trim()}`;

    // Required-field check (same as create)
    const missing = requiredChecks({
      trn_number, first_name, last_name, type, email,
      country_code, contact, parish, postal_code,
    });
    if (missing.length) {
      await t.rollback();
      const message = `Missing required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`;
      await Audit.warn({
        actorType, actorId, url,
        action: 'CLIENT_UPDATE_VALIDATION_FAIL',
        description: `Validation error. ${message}`,
        extra: { missingFields: missing, client_id },
      });
      return { ok: false, code: 422, message, errorType: 'VALIDATION', details: { missing } };
    }

    // Decide which profile picture to persist: new file -> profile_pic_url -> existing
    const profile_pic_raw = file?.location || profile_pic_url || client.profile_pic || 'client.jpg';

    // If a new picture was provided (file or profile_pic_url), validate its extension
    if (file?.location || profile_pic_url) {
      const imageExt = extFromMaybeUrl(profile_pic_raw);
      const allowed = ['.jpg', '.jpeg', '.png', '.jfif'];
      if (!allowed.includes(imageExt)) {
        await t.rollback();
        await Audit.warn({
          actorType, actorId, url,
          clientId: client.client_account_id,
          action: 'CLIENT_UPDATE_BAD_IMAGE_TYPE',
          description: `Rejected image type ${imageExt || '[none]'} for email=${email}`,
          extra: { profile_pic_raw },
        });
        return { ok: false, code: 415, message: 'Profile pic must be JPG, PNG, or JFIF', errorType: 'BAD_IMAGE' };
      }
    }

    // Duplicate email (exclude self)
    if (email) {
      const dupEmail = await ClientAccount.findOne({
        where: { email, client_account_id: { [Op.ne]: accountId } },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (dupEmail) {
        await t.rollback();
        await Audit.warn({
          actorType, actorId, url,
          clientId: dupEmail.client_account_id ?? null,
          action: 'CLIENT_UPDATE_DUP_EMAIL',
          description: `Duplicate email=${email} for update of client ${accountId}`,
        });
        return { ok: false, code: 409, message: 'Email already exists', errorType: 'DUP_EMAIL' };
      }
    }

    // Duplicate mobile (exclude self)
    if (country_code && contact) {
      const dupMobile = await ClientAccount.findOne({
        where: {
          full_contact: full_contact.trim(),
          client_account_id: { [Op.ne]: accountId },
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (dupMobile) {
        await t.rollback();
        await Audit.warn({
          actorType, actorId, url,
          clientId: dupMobile.client_account_id ?? null,
          action: 'CLIENT_UPDATE_DUP_CONTACT',
          description: `Duplicate contact=${country_code}${contact} for update of client ${accountId}`,
        });
        return { ok: false, code: 409, message: 'Contact already exists', errorType: 'DUP_CONTACT' };
      }
    }

    // Capture "before" to compute changed fields
    const before = client.toJSON();

    // Apply updates
    client.first_name = first_name;
    client.last_name = last_name;
    client.type = type;
    client.business_name = business_name;
    client.trn_number = trn_number;
    client.email = email;
    client.country_code = country_code;
    client.contact = contact;
    client.full_contact = full_contact.trim();
    client.address = address;
    client.parish = parish;
    client.postal_zone = postal_zone || null;
    client.postal_code = postal_code;
    client.dob = dob;
    client.gender = gender;
    if (language) client.language = language;
    client.profile_pic = profile_pic_raw;

    await client.save({ transaction: t });
    await t.commit();

    // Compute changed fields (simple diff of key fields)
    const watched = [
      'first_name','last_name','type','business_name','trn_number','email',
      'country_code','contact','full_contact','address',
      'parish','postal_zone','postal_code','dob','gender','profile_pic'
    ];
    const changed = watched.filter(k => String(before[k] ?? '') !== String(client[k] ?? ''));

    await Audit.success({
      actorType, actorId, url,
      clientId: client.client_account_id,
      action: 'CLIENT_UPDATED',
      description: `Client ${client.client_account_id} (${client.first_name} ${client.last_name}) updated successfully`,
      extra: { changed },
    });

    return { ok: true, client };
  } catch (err) {
    console.log('error in updating client --> ',err)
    try { if (!t.finished) await t.rollback(); } catch {}
    await Audit.failed({
      actorType, actorId, url,
      action: 'CLIENT_UPDATE_ERROR',
      description: String(err?.message || err),
    });
    return { ok: false, code: 500, message: String(err?.message || err), errorType: 'INTERNAL' };
  }
}
