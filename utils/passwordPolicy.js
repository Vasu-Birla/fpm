// utils/passwordPolicy.js

import sequelize from "../config/sequelize.js";

import { Op } from 'sequelize';
import {
  Admin, ClientAccount,
  AdminPasswordHistory, ClientPasswordHistory,
  ActiveSessionAdmin, ActiveSessionClient,
} from '../models/index.js';
// If you don't re-export these from models/index.js, import them directly.

import { comparePassword, hashPassword } from '../helper/helper.js';


/**
 * Normalizes incoming type to one of: 'Admin' | 'Client' | 'FirmStaff'
 */
function normalizeType(type) {
  const t = String(type || '').trim().toLowerCase();
  if (t === 'admin') return 'Admin';
  if (t === 'client') return 'Client';
  if (t === 'firmstaff' || t === 'staff' || t === 'firm_staff') return 'FirmStaff';
  throw new Error(`Unsupported user type: ${type}`);
}


/**
 * Pick models based on user type
 * @param {'Admin'|'Client'|'FirmStaff'|string} type
 */
export function getModelsByType(type) {
  switch (normalizeType(type)) {
    case 'Admin':
      return {
        UserModel:    Admin,
        HistoryModel: AdminPasswordHistory,
        SessionModel: ActiveSessionAdmin,
        idField:      'admin_id',
      };
    case 'Client':
      return {
        UserModel:    ClientAccount,
        HistoryModel: ClientPasswordHistory,
        SessionModel: ActiveSessionClient,
        idField:      'client_account_id',
      };
    case 'FirmStaff':
      return {
        UserModel:    FirmStaff,
        HistoryModel: FirmStaffPasswordHistory,
        SessionModel: ActiveSessionFirmStaff,
        idField:      'staff_id',
      };
  }
}
/**
 * Check last-3 password reuse (including current)
 * @param {object} opts
 *  - type: 'Admin' | 'Client'
 *  - user: instance of model
 *  - newPlainPassword: string
 *  - transaction?: Sequelize.Transaction (optional but recommended to avoid lock races)
 */
export async function violatesHistory({ type, user, newPlainPassword, transaction = null }) {
  const { HistoryModel, idField } = getModelsByType(type);

  // 1) Same as current?
  if (user.password) {
    const sameAsCurrent = await comparePassword(newPlainPassword, user.password);
    if (sameAsCurrent) return true;
  }

  // 2) Any of last 3?
  const lastPasswords = await HistoryModel.findAll({
    where: { [idField]: user[idField] },
    order: [['changed_at', 'DESC']],
    limit: 3,
    transaction,
  });

  for (const row of lastPasswords) {
    const reused = await comparePassword(newPlainPassword, row.password);
    if (reused) return true;
  }
  return false;
}

/**
 * Atomically update password + insert into history + invalidate sessions + trim to last 3.
 * Reuses provided transaction if present; otherwise starts/commits its own.
 *
 * @param {object} opts
 *  - type: 'Admin' | 'Client'
 *  - user: instance (already loaded; you may have locked it with FOR UPDATE)
 *  - newPlainPassword: string
 *  - transaction?: Sequelize.Transaction
 */
export async function updatePasswordWithHistory({ type, user, newPlainPassword, transaction = null }) {
  const { HistoryModel, SessionModel, idField } = getModelsByType(type);
  const ownTx = !transaction;
  const tx = transaction || await sequelize.transaction();

  try {
    const hashed = await hashPassword(newPlainPassword); // MUST await

    // Update user password
    await user.update({ password: hashed }, { transaction: tx });

    // Insert history row
    await HistoryModel.create({ [idField]: user[idField], password: hashed }, { transaction: tx });

    // Invalidate all active sessions
    await SessionModel.destroy({ where: { [idField]: user[idField] }, transaction: tx });

    // Keep only last 3 history records
    const lastThree = await HistoryModel.findAll({
      where: { [idField]: user[idField] },
      order: [['changed_at', 'DESC']],
      limit: 3,
      attributes: ['id'],
      transaction: tx,
    });
    await HistoryModel.destroy({
      where: {
        [idField]: user[idField],
        id: { [Op.notIn]: lastThree.map(r => r.id) }
      },
      transaction: tx,
    });

    if (ownTx) await tx.commit();
  } catch (e) {
    if (ownTx) await tx.rollback();
    throw e;
  }
}
