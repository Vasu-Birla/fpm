// helpers/firmAdmin.js
import FirmRole from '../models/FirmRole.js';
import FirmUser from '../models/FirmUser.js';
import bcrypt from 'bcryptjs';

/** Get the FirmAdmin role for a firm */
export async function getFirmAdminRole(firm_id, transaction) {
  return await FirmRole.findOne({
    where: { firm_id, name: 'FirmAdmin' },
    transaction
  });
}

/** Get the current FirmAdmin user (or null) */
export async function getFirmAdminUser(firm_id, transaction) {
  const role = await getFirmAdminRole(firm_id, transaction);
  if (!role) return null;
  return await FirmUser.findOne({
    where: { firm_id, firm_role_id: role.firm_role_id },
    transaction
  });
}

/** Ensure a FirmAdmin user exists. If missing, create an invited one. */
export async function ensureFirmAdminUser({ firm_id, email, country_code, contact, first_name='Firm', last_name='Admin', transaction }) {
  const role = await getFirmAdminRole(firm_id, transaction);
  if (!role) throw new Error('FirmAdmin role missing');

  let admin = await FirmUser.findOne({ where: { firm_id, firm_role_id: role.firm_role_id }, transaction });

  if (!admin) {
    const temp = Math.random().toString(36).slice(2, 10) + 'A!';
    const hash = await bcrypt.hash(temp, 10);
    admin = await FirmUser.create({
      firm_id,
      firm_role_id: role.firm_role_id,
      email: (email || '').trim().toLowerCase(),
      country_code: country_code || '+1',
      contact: contact || null,
      first_name,
      last_name,
      password: hash,
      status: email ? 'Invited' : 'Inactive',
      two_step_verification: 'Off',
      timezone: 'Asia/Kolkata'
    }, { transaction });
  }
  return admin;
}
