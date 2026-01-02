// scripts/seed_plans_lean.js
import sequelize from '../config/sequelize.js';
import Plan from '../models/Plan.js';
import LawFirm from '../models/LawFirm.js';
import { toMinor } from '../utils/money.js';
import { sanitizeFeatures } from '../utils/features_registry.js';
import { ensureDefaultSubscription } from '../utils/subscription_defaults.js';

const CUR = process.env.currency || 'JMD';

// Human-readable plan list.
// For "unlimited" numeric limits, use -1.
const PLANS = [
  {
    solution_key: 'core',
    plan_key: 'free',
    name: 'Free',
    billing_period: 'monthly',
    amount_major: 0,
    features_json: {
      'staff.max_active': 2,
      'cases.max_active': 10,
      'documents.storage_gb': 2,
      'client_portal.enabled': false,
    },
    is_active: true,
  },
  {
    solution_key: 'core',
    plan_key: 'pro',
    name: 'Pro (Unlimited)',
    billing_period: 'monthly',
    amount_major: 99.0,
    features_json: {
      'staff.max_active': -1,          // unlimited
      'cases.max_active': -1,          // unlimited
      'documents.storage_gb': 1024,    // 1 TB
      'client_portal.enabled': true,
    },
    is_active: true,
  },
];

export async function seedPlansLean(log = console.log) {
  const t = await sequelize.transaction();
  try {
    // 1) Seed / Update plans
    for (const p of PLANS) {
      const price_currency = CUR;
      const price_minor = toMinor(p.amount_major, price_currency);

      // Validate features against registry (and coerce types)
      const sanitized = sanitizeFeatures(p.features_json, p.solution_key);

      // Try normal find
      let row = await Plan.findOne({
        where: { solution_key: p.solution_key, plan_key: p.plan_key },
        transaction: t,
      });

      // Restore if soft-deleted
      if (!row) {
        const trashed = await Plan.findOne({
          where: { solution_key: p.solution_key, plan_key: p.plan_key },
          paranoid: false, transaction: t,
        });
        if (trashed) {
          await trashed.restore({ transaction: t });
          row = trashed;
        }
      }

      if (!row) {
        await Plan.create({
          solution_key: p.solution_key,
          plan_key: p.plan_key,
          name: p.name,
          billing_period: p.billing_period,
          price_currency,
          price_minor,
          features_json: sanitized,
          is_active: p.is_active,
          metadata: null,
        }, { transaction: t });
        log(`🟢 Plan created: ${p.solution_key}/${p.plan_key}`);
      } else {
        await row.update({
          name: p.name,
          billing_period: p.billing_period,
          price_currency,
          price_minor,
          features_json: sanitized,
          is_active: p.is_active,
        }, { transaction: t });
        log(`🟡 Plan updated: ${p.solution_key}/${p.plan_key}`);
      }
    }

    // 2) Backfill: Any existing firm WITHOUT ANY subscription → set Core/Free
    //    We do this outside of a giant single UPDATE to keep logic reusable
    //    through ensureDefaultSubscription (which handles upsert semantics).



    
    const firms = await LawFirm.findAll({
      attributes: ['firm_id', 'firm_name'],
      transaction: t,
    });

    // let assigned = 0;
    // for (const firm of firms) {
    //   try {
    //     // ensureDefaultSubscription will no-op if already present
    //     await ensureDefaultSubscription({
    //       firm_id: firm.firm_id,
    //       solution_key: 'core',
    //       plan_key: 'free',
    //       transaction: t,
    //     });
    //     assigned++;
    //   } catch (e) {
    //     // If this throws only when a subscription already exists, you can ignore.
    //     // Otherwise, surface the error detail for debugging but don't break the whole seed.
    //     log(`⚠️  Could not ensure Core/Free for firm #${firm.firm_id} (${firm.firm_name}): ${e.message || e}`);
    //   }
    // }
    // log(`✅ Default Core/Free ensured for ${assigned} firm(s).`);

    await t.commit();
    log('✅ Plans seeding + backfill completed.');
    return { ok: true };
  } catch (e) {
    await t.rollback();
    log(`❌ Plans seeding failed: ${e.message || e}`);
    return { ok: false, error: e.message || String(e) };
  }
}

export default seedPlansLean;
