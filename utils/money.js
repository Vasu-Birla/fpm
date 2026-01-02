// utils/money.js (ESM)

const CURRENCY_EXPONENT = Object.freeze({
  // 0-decimal currencies
  JPY: 0, KRW: 0, VND: 0,
  // 3-decimal (rare)
  KWD: 3, BHD: 3, JOD: 3, OMR: 3, TND: 3,
  // default: 2
});

/** Return the decimal exponent for a currency (e.g., 2 for USD/JMD, 0 for JPY) */
export function expFor(currency = 'USD') {
  const cur = String(currency || '').toUpperCase();
  return Number.isInteger(CURRENCY_EXPONENT[cur]) ? CURRENCY_EXPONENT[cur] : 2;
}

/** Convert a major-unit number/string to integer minor units (safe) */
export function toMinor(amount, currency = 'USD') {
  if (amount == null || amount === '') return 0;
  const exp = expFor(currency);
  const factor = 10 ** exp;

  // Accept number or string; avoid binary float errors by using string path where possible
  const str = typeof amount === 'number' ? amount.toFixed(exp) : String(amount);
  const normalized = str.replace(/,/g, '').trim();

  // Validate
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    throw new Error(`Invalid money amount: "${amount}"`);
  }

  // Split and pad decimals to exp
  const [intPart, decPart = ''] = normalized.split('.');
  const padded = (decPart + '0'.repeat(exp)).slice(0, exp);

  // Compose integer minor units
  const negative = normalized.startsWith('-') ? -1 : 1;
  const absInt = Math.abs(parseInt(intPart || '0', 10));
  const absDec = parseInt(padded || '0', 10);

  return negative * (absInt * factor + absDec);
}

/** Convert integer minor units to major units (Number) */
export function fromMinor(minor, currency = 'USD') {
  const exp = expFor(currency);
  const factor = 10 ** exp;
  return (Number(minor || 0) / factor);
}

/** Format either a minor or major amount using Intl.NumberFormat */
export function formatMoney({ minor, amount, currency = 'USD', locale = 'en' } = {}) {
  let major;
  if (typeof minor === 'number') {
    major = fromMinor(minor, currency);
  } else if (amount != null) {
    major = Number(amount);
  } else {
    major = 0;
  }
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(major);
}

/** Add two minor-unit amounts (integers) */
export function addMinor(a = 0, b = 0) {
  return (a|0) + (b|0);
}

/** Multiply a major amount by an integer qty and return minor units */
export function multiplyToMinor({ amount, qty = 1, currency = 'USD' }) {
  // (amount * qty) in major → to minor once
  const totalMajor = Number(amount || 0) * Number(qty || 0);
  return toMinor(totalMajor, currency);
}

/** Sum an array of minor-unit amounts */
export function sumMinor(arr = []) {
  let s = 0;
  for (const v of arr) s += (v|0);
  return s;
}

/** Round a major-unit amount to the currency exponent (returns Number major) */
export function roundMajor(amount, currency = 'USD') {
  const exp = expFor(currency);
  return Number(Number(amount || 0).toFixed(exp));
}
