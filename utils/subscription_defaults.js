// utils/subscription_defaults.js
import { Op } from 'sequelize';
import Plan from '../models/Plan.js';
import FirmSubscription from '../models/FirmSubscription.js';

function nextMonth(date = new Date()) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  return d;
}

/**
 * Ensure the firm has an active subscription for the given solution_key.
 * Idempotent: will update to point at the intended plan if needed.
 */
export async function ensureDefaultSubscription({
  firm_id,
  solution_key = 'core',
  plan_key = 'free',
  transaction,
}) {
  // 1) get the reference plan (must exist via seed)
  const plan = await Plan.findOne({
    where: { solution_key, plan_key, is_active: true },
    transaction,
  });
  if (!plan) {
    throw new Error(`Default plan not found: ${solution_key}/${plan_key}. Seed plans first.`);
  }

  // 2) upsert the firm subscription (one per solution)
  const [sub, created] = await FirmSubscription.findOrCreate({
    where: { firm_id, solution_key },
    defaults: {
      firm_id,
      solution_key,
      plan_id: plan.plan_id,
      status: 'active',
      starts_at: new Date(),
      renews_at: plan.billing_period === 'yearly' ? null : nextMonth(),
      addons_json: [],
      overrides_json: {},
    },
    transaction,
  });

  // 3) if existed but pointing to a different plan, align it (or if canceled, re-activate)
  if (!created) {
    const needsPlan = sub.plan_id !== plan.plan_id;
    const needsStatus = sub.status !== 'active' && sub.status !== 'trialing' && sub.status !== 'past_due' && sub.status !== 'paused';
    if (needsPlan || needsStatus) {
      await sub.update({
        plan_id: plan.plan_id,
        status: needsStatus ? 'active' : sub.status,
      }, { transaction });
    }
  }

  return { ok: true, subscription: created ? 'created' : 'ensured', plan };
}
