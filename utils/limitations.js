// utils/limitations.js
import FirmLimitationConfig from '../models/FirmLimitationConfig.js';
import CaseClaim from '../models/CaseClaim.js';
import { getLimitationCatalogue } from '../scripts/limitation_jm_data.js';
import moment from 'moment-timezone';

/**
 * Simple humaniser for trigger keys: date_cause_of_action_accrued
 * => "Date Cause Of Action Accrued"
 */
function humanizeTriggerEvent(triggerEvent) {
  if (!triggerEvent) return '';
  return String(triggerEvent)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Build a firm + practice-area aware limitation view:
 * - pulls global catalogue (LIMITATION_JM)
 * - merges FirmLimitationConfig rows
 * - filters to enabled + (optionally) matching practice_area_id
 */
export async function buildFirmLimitationView({
  firm_id,
  jurisdiction = 'JM',
  practice_area_id = null,
  includeDisabled = false,
}) {
  const catalogue = getLimitationCatalogue(jurisdiction);
  if (!catalogue) {
    return {
      jurisdiction,
      name: null,
      generalNotes: [],
      categories: [],
    };
  }

  const configs = await FirmLimitationConfig.findAll({
    where: { firm_id, jurisdiction },
  });

  const cfgByKey = new Map();
  for (const row of configs) {
    const plain = row.get({ plain: true });
    cfgByKey.set(plain.claim_key, plain); // unique per firm/jurisdiction/claim_key
  }

  const outCategories = [];

  for (const cat of catalogue.categories || []) {
    const claimsView = [];

    for (const claim of cat.claims || []) {
      const cfg = cfgByKey.get(claim.claimKey) || null;

      const enabled = cfg ? cfg.enabled : true; // default: visible

      if (!includeDisabled && !enabled) continue;

      // PA filter
      if (practice_area_id) {
        const cfgPaId = cfg?.practice_area_id || null;
        if (cfgPaId && Number(cfgPaId) !== Number(practice_area_id)) {
          continue;
        }
      }

      const triggerEventLabel = humanizeTriggerEvent(claim.triggerEvent);

      claimsView.push({
        // global fields
        categoryKey: cat.categoryKey,
        categoryLabel: cat.categoryLabel,
        accrualRule: cat.accrualRule,
        claimKey: claim.claimKey,
        title: claim.title,
        description: claim.description,
        timeLimitYears: claim.timeLimitYears,
        timeLimitText: claim.timeLimitText,
        triggerEvent: claim.triggerEvent,
        triggerEventLabel,
        statutoryReference: claim.statutoryReference,
        specialNotes: claim.specialNotes,

        // firm overrides
        enabled,
        custom_label: cfg?.custom_label || null,
        color_tag: cfg?.color_tag || null,
        warning_days_before: cfg?.warning_days_before || null,
        practice_area_id: cfg?.practice_area_id || null,
        internal_notes: cfg?.internal_notes || null,
      });
    }

    if (claimsView.length) {
      outCategories.push({
        categoryKey: cat.categoryKey,
        categoryLabel: cat.categoryLabel,
        accrualRule: cat.accrualRule,
        claims: claimsView,
      });
    }
  }

  return {
    jurisdiction: catalogue.jurisdiction,
    name: catalogue.name,
    generalNotes: catalogue.generalNotes || [],
    categories: outCategories,
  };
}

/**
 * Find the global meta for a claim_key.
 */
export function findClaimMeta(jurisdiction = 'JM', claim_key) {
  const catalogue = getLimitationCatalogue(jurisdiction);
  if (!catalogue || !catalogue.categories) return null;

  for (const cat of catalogue.categories) {
    for (const claim of (cat.claims || [])) {
      if (claim.claimKey === claim_key) {
        return {
          ...claim,
          categoryKey: cat.categoryKey,
          categoryLabel: cat.categoryLabel,
          accrualRule: cat.accrualRule,
        };
      }
    }
  }
  return null;
}

/**
 * Compute deadline for case-level claim from trigger_date + timeLimitYears.
 * For weird/null timeLimitYears we just keep deadline = trigger_date.
 */
export function computeDeadlineForClaim({ trigger_date, claimMeta }) {
  if (!trigger_date || !claimMeta) return { deadline: trigger_date, status: 'open' };

  const m = moment(trigger_date, 'YYYY-MM-DD', true);
  if (!m.isValid()) return { deadline: trigger_date, status: 'open' };

  const years = Number(claimMeta.timeLimitYears);
  let deadlineMoment = m.clone();

  if (!Number.isNaN(years) && years > 0) {
    deadlineMoment = m.clone().add(years, 'years');
  }

  const deadlineStr = deadlineMoment.format('YYYY-MM-DD');

  // basic status only for now (open/expired)
  const today = moment().startOf('day');
  let status = 'open';
  if (deadlineMoment.isBefore(today, 'day')) {
    status = 'expired';
  }

  return { deadline: deadlineStr, status };
}

/**
 * Build a view model for all CaseClaims on a specific case.
 */
export async function buildCaseClaimsView({
  firm_id,
  case_id,
  jurisdiction = 'JM',
}) {
  const where = { firm_id, case_id };
  // If jurisdiction is null/undefined/'ALL', fetch all jurisdictions for the case
  if (jurisdiction && jurisdiction !== 'ALL') {
    where.jurisdiction = jurisdiction;
  }

  const rows = await CaseClaim.findAll({
    where,
    order: [
      ['is_primary', 'DESC'],
      ['limitation_deadline', 'ASC'],
    ],
  });

  // Cache catalogues per jurisdiction so we can resolve meta even when multiple jurisdictions exist
  const catalogueCache = new Map();
  function getCatalogue(j) {
    if (!catalogueCache.has(j)) {
      catalogueCache.set(j, getLimitationCatalogue(j));
    }
    return catalogueCache.get(j);
  }

  return rows.map(r => {
    const plain = r.get({ plain: true });
    const cat   = getCatalogue(plain.jurisdiction || jurisdiction);
    let meta = null;
    if (cat?.categories) {
      for (const catItem of cat.categories) {
        for (const claim of (catItem.claims || [])) {
          if (claim.claimKey === plain.claim_key) {
            meta = {
              ...claim,
              categoryKey: catItem.categoryKey,
              categoryLabel: catItem.categoryLabel,
              accrualRule: catItem.accrualRule,
              triggerEventLabel: humanizeTriggerEvent(claim.triggerEvent),
            };
            break;
          }
        }
        if (meta) break;
      }
    }
    return {
      ...plain,
      meta,
    };
  });
}
