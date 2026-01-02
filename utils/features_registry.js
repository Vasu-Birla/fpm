// utils/features_registry.js (ESM)

// Registry of ALLOWED features with types, defaults, and hints.
// NOTE on "unlimited": for type === 'limit', a value of -1 means unlimited.
export const FEATURE_REGISTRY = Object.freeze({
  'staff.max_active': {
    solution: 'core',
    type: 'limit',           // limit | flag
    valueType: 'number',
    min: 0,
    default: 1,
    label: 'Staff seats (max active)',
    description: 'How many active staff accounts can a firm have?',
  },

  'cases.max_active': {
    solution: 'core',
    type: 'limit',
    valueType: 'number',
    min: 0,
    default: 10,
    label: 'Active cases (cap)',
    description: 'Maximum concurrent active cases.',
  },

  'documents.storage_gb': {
    solution: 'core',
    type: 'limit',
    valueType: 'number',
    min: 0,
    default: 2,
    label: 'Document storage (GB)',
    description: 'Storage quota in gigabytes.',
  },

  'client_portal.enabled': {
    solution: 'core',
    type: 'flag',
    valueType: 'boolean',
    default: false,
    label: 'Client portal',
    description: 'Enable client portal features.',
  },
});

// Coerce an incoming feature value to its correct type or return null if invalid.
export function coerceFeature(key, rawValue) {
  const def = FEATURE_REGISTRY[key];
  if (!def) return null;

  let val = rawValue;
  if (def.valueType === 'number') {
    // Support "unlimited" sentinel for limits: -1
    if (String(val).toLowerCase() === 'unlimited') val = -1;
    val = Number(val);
    if (!Number.isFinite(val)) return null;
    if (val !== -1 && typeof def.min === 'number' && val < def.min) val = def.min;
  } else if (def.valueType === 'boolean') {
    val = (String(val) === 'true' || val === true);
  } else {
    val = String(val ?? '');
  }
  return { key, value: val };
}

// Sanitize a whole features object for a given solution.
export function sanitizeFeatures(featuresObj, solutionKey) {
  const clean = {};
  for (const [k, v] of Object.entries(featuresObj || {})) {
    const def = FEATURE_REGISTRY[k];
    if (!def) throw new Error(`Unknown feature key: ${k}`);
    if (def.solution !== solutionKey) {
      throw new Error(`Feature ${k} does not belong to solution "${solutionKey}"`);
    }
    const coerced = coerceFeature(k, v);
    if (!coerced) throw new Error(`Invalid value for feature ${k}`);
    clean[coerced.key] = coerced.value;
  }
  return clean;
}

// Provide a safe version for the UI to render pickers (no internal-only fields).
export function registryForClient(solutionKey = null) {
  const rows = [];
  for (const [key, def] of Object.entries(FEATURE_REGISTRY)) {
    if (!solutionKey || def.solution === solutionKey) {
      rows.push({
        key,
        solution: def.solution,
        type: def.type,
        valueType: def.valueType,
        min: def.min ?? null,
        default: def.default,
        label: def.label || key,
        description: def.description || '',
      });
    }
  }
  return rows;
}
