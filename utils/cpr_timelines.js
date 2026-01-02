// utils/cpr_timelines.js
import moment from 'moment-timezone';
import { getCPRTimelinesCatalogue } from '../scripts/cpr_jm_timelines.js';

export function computeDueDate({ base_date, offset_value, offset_unit, direction }) {
  if (!base_date) return null;
  const m = moment(base_date, 'YYYY-MM-DD', true);
  if (!m.isValid()) return null;
  const value = Number(offset_value || 0);
  const unit = offset_unit || 'days';

  let out = m.clone();
  if (direction === 'before') {
    out = out.subtract(value, unit);
  } else if (direction === 'after') {
    out = out.add(value, unit);
  }
  // 'on' keeps base date
  return out.format('YYYY-MM-DD');
}

export function computeCPRStatus({ due_date, completed_at, warning_days_before = 7 }) {
  if (completed_at) return 'completed';
  if (!due_date) return 'not_set';

  const d = moment(due_date, 'YYYY-MM-DD', true);
  if (!d.isValid()) return 'not_set';

  const today = moment().startOf('day');
  if (d.isBefore(today, 'day')) return 'overdue';

  const warn = today.clone().add(Number(warning_days_before), 'days');
  if (d.isSameOrBefore(warn, 'day')) return 'due';

  return 'upcoming';
}

export function listBaseDateKeys(catalogue) {
  const keys = new Set();
  for (const ev of catalogue?.events || []) {
    if (ev.baseKey) keys.add(ev.baseKey);
  }
  return Array.from(keys);
}

/**
 * Build computed CPR deadlines from baseDates map.
 * baseDates: { [baseKey]: 'YYYY-MM-DD' }
 */
export function buildCaseCPRDeadlines({
  baseDates = {},
  jurisdiction = 'JM',
  warning_days_before = 7,
}) {
  const catalogue = getCPRTimelinesCatalogue(jurisdiction);
  if (!catalogue) return [];

  const out = [];
  for (const ev of catalogue.events || []) {
    const base_date = ev.baseKey ? baseDates[ev.baseKey] || null : null;

    const due_date =
      ev.isComputed && base_date
        ? computeDueDate({
            base_date,
            offset_value: ev.offsetValue,
            offset_unit: ev.offsetUnit,
            direction: ev.direction,
          })
        : null;

    const status = computeCPRStatus({
      due_date,
      completed_at: null,
      warning_days_before,
    });

    out.push({
      jurisdiction,
      event_key: ev.eventKey,
      event_label: ev.title,
      rule_reference: ev.ruleRef || null,
      description: ev.description || null,
      base_date_key: ev.baseKey || null,
      base_date,
      direction: ev.direction,
      offset_value: ev.offsetValue,
      offset_unit: ev.offsetUnit,
      due_date,
      is_computed: !!ev.isComputed,
      status,
    });
  }

  return out;
}

