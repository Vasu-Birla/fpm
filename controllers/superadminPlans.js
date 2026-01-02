// controllers/superadminPlans.js
import sequelize from '../config/sequelize.js';
import { Op } from 'sequelize';
import Plan from '../models/Plan.js';
import { registryForClient, sanitizeFeatures } from '../utils/features_registry.js';
import { formatMoney, toMinor } from '../utils/money.js';

export async function plans_page(req, res) {
  const output = (req.flash && req.flash('elaw_msg')) ? req.flash('elaw_msg') : null;
  res.render('superadmin/plans', { output });
}

export async function features_registry_json(req, res) {
  try {
    const solution = 'core';
    const rows = registryForClient(solution);
    res.json({ success: true, rows });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to load registry.' });
  }
}

export async function plans_json(req, res) {
  try {
    const rows = await Plan.findAll({
      where: { deleted_at: null },
      order: [['solution_key', 'ASC'], ['plan_key', 'ASC']],
      raw: true,
    });
    res.json({ success: true, rows });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to load plans.' });
  }
}

export async function add_plan(req, res) {
  const t = await sequelize.transaction();
  try {
    const {
      solution_key = 'core',
      plan_key,
      name,
      billing_period = 'monthly',
      price_currency,
      price_amount,           // major
      features_json = {},
      is_active = 1,
    } = req.body || {};

    if (!plan_key || !name) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Plan key and name are required.' });
    }

    // sanitize + coerce features
    const sanitized = sanitizeFeatures(features_json, solution_key);

    const exists = await Plan.findOne({
      where: { solution_key, plan_key },
      transaction: t, lock: t.LOCK.UPDATE,
    });
    if (exists) {
      await t.rollback();
      return res.status(409).json({ success: false, message: 'Plan already exists.' });
    }

    const price_minor = toMinor(price_amount || 0, price_currency);
    await Plan.create({
      solution_key, plan_key, name, billing_period,
      price_currency, price_minor,
      features_json: sanitized,
      is_active: Number(is_active) ? 1 : 0,
    }, { transaction: t });

    await t.commit();
    res.json({ success: true, message: 'Plan created.' });
  } catch (e) {
    try { if (t && !t.finished) await t.rollback(); } catch {}
    res.status(500).json({ success: false, message: `Failed to create. ${e.message || e}` });
  }
}


export async function toggle_plan_active(req, res) {
  try {
    const { id } = req.body || {};
    const row = await Plan.findByPk(id);
    if (!row) return res.status(404).json({ success: false, message: 'Plan not found.' });
    await row.update({ is_active: row.is_active ? 0 : 1 });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Toggle failed.' });
  }
}



const RESERVED = Object.freeze([
  { solution_key: 'core', plan_key: 'free' }
]);

function isReserved(row) {
  return RESERVED.some(r => r.solution_key === row.solution_key && r.plan_key === row.plan_key);
}

// --- update_plan: prevent changing a reserved key or changing key during edit
export async function update_plan(req, res) {
  const t = await sequelize.transaction();
  try {
    const {
      plan_id,
      solution_key = 'core',
      plan_key,
      name,
      billing_period = 'monthly',
      price_currency,
      price_amount,
      features_json = {},
      is_active = 1,
    } = req.body || {};

    if (!plan_id) { await t.rollback(); return res.status(400).json({ success: false, message: 'Missing plan_id.' }); }
    if (!plan_key || !name) {
      await t.rollback(); return res.status(400).json({ success: false, message: 'Plan key and name are required.' });
    }

    const row = await Plan.findByPk(plan_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!row) { await t.rollback(); return res.status(404).json({ success: false, message: 'Plan not found.' }); }

    // If this row is reserved (core/free), forbid changing its key
    if (isReserved(row) && (row.plan_key !== plan_key || row.solution_key !== solution_key)) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Reserved plan key cannot be changed.' });
    }

    // keep unique (solution_key, plan_key)
    const dup = await Plan.findOne({
      where: {
        solution_key,
        plan_key,
        plan_id: { [Op.ne]: plan_id },
      },
      transaction: t,
    });
    if (dup) {
      await t.rollback(); return res.status(409).json({ success: false, message: 'Another plan with same key exists.' });
    }

    const sanitized = sanitizeFeatures(features_json, solution_key);
    const price_minor = toMinor(price_amount || 0, price_currency);

    await row.update({
      solution_key, plan_key, name, billing_period,
      price_currency, price_minor,
      features_json: sanitized,
      is_active: Number(is_active) ? 1 : 0,
    }, { transaction: t });

    await t.commit();
    res.json({ success: true, message: 'Plan updated.' });
  } catch (e) {
    try { if (t && !t.finished) await t.rollback(); } catch {}
    res.status(500).json({ success: false, message: `Failed to update. ${e.message || e}` });
  }
}

// --- delete_plan: forbid deleting core/free
export async function delete_plan(req, res) {
  try {
    const { id } = req.body || {};
    const row = await Plan.findByPk(id);
    if (!row) return res.status(404).json({ success: false, message: 'Plan not found.' });

    if (isReserved(row)) {
      return res.status(400).json({ success: false, message: 'The base Free plan cannot be deleted.' });
    }

    await row.destroy(); // paranoid
    res.json({ success: true, message: 'Deleted.' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Delete failed.' });
  }
}