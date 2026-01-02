// utils/amberpay.js (ESM)
import axios from 'axios';
import { getBaseUrl, joinUrl } from './url.js';


import fs from 'node:fs';
import fsp from 'node:fs/promises';
import readline from 'node:readline';
import { Buffer } from 'node:buffer';

import * as url from 'url';
import * as path from 'path';

const envFile = `.env.${process.env.NODE_ENV || 'development'}`;



const AMB = {
  baseUrl: (process.env.AMBERPAY_BASE_URL || '').trim(),                              // https://staging-payment.myamberpay.com/gateway/v1
  Standard_checkout_URL: (process.env.Standard_checkout_URL || '').trim(),           // https://staging-payment.myamberpay.com/gateway/v1/standard-checkout
  clientId: (process.env.AMBERPAY_CLIENT_ID || '').trim(),                           // kwe_stage
  sigUrl: (process.env.AMBERPAY_SIGNATURE_URL || '').trim(),                         // https://staging-payment.myamberpay.com/gateway/v1/authgeneratesignature
  currency: (process.env.AMBERPAY_CURRENCY || 'JMD').trim(),
  apiKey: (process.env.AMBERPAY_API_KEY || '').trim(),                               // Bearer ...
  returnUrl: (process.env.AMBERPAY_RETURN_URL || '').trim(),                         // optional (dashboard may have it)
  callbackUrl: (process.env.AMBERPAY_CALLBACK_URL || '').trim(),                     // optional
  returnPath: (process.env.AMBERPAY_RETURN_PATH || '').trim(),
  callbackPath: (process.env.AMBERPAY_CALLBACK_PATH || '').trim(),
};


// Build full Return/Callback URLs from env or req base + path


function buildFixedCallbackUrl(req) {
  const base = req ? getBaseUrl(req) : '';
  // single handler for entire app:
  return joinUrl(base, '/api/v1/payment/amber/callback');
}





// 8-12 chars: yyyymmddHHMMSS + 2 random → slice 12
export function genTxnId() {
  const ts = new Date();
  const pad = n => String(n).padStart(2, '0');
  const id = `${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}${Math.floor(10+Math.random()*89)}`;
  return id.slice(0, 12);
}

const pickMsg = (d) =>
  d?.message || d?.Message || d?.error || d?.Error || d?.reason || d?.details || d?.Description ||
  (typeof d === 'string' ? d : '');

function normAmount(amount) {
  const n = typeof amount === 'string' ? Number(amount.replace(/[, ]/g, '')) : Number(amount);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`Invalid Amount: "${amount}"`);
  return n.toFixed(2);
}

/**
 * Generate Amber signature (staging/prod) using Bearer API key and JSON body.
 * - Standard (new card): DO NOT send SignType. (doc sample omits it)
 * - Tokenized: send CardToken and SignType = "CARD" (as per their example)
 */


// utils/amberpay.js (only the signer shown here)
export async function generateSignature({
  transactionId,
  amount,
  currency = AMB.currency,
  signType = null,    // null for standard; "Card" for tokenized
  cardToken = null,
}) {
  if (!AMB.clientId) throw new Error('Missing AMB clientId');
  if (!AMB.sigUrl)   throw new Error('Missing AMB sigUrl');
  if (!AMB.apiKey)   throw new Error('Missing AMB apiKey');

  const txn = String(transactionId || '').trim();
  if (txn.length < 8 || txn.length > 12) throw new Error(`TransactionId must be 8–12 chars (got ${txn.length}).`);

  const amt = (typeof amount === 'string' ? Number(amount.replace(/[, ]/g,'')) : Number(amount));
  if (!Number.isFinite(amt) || amt <= 0) throw new Error(`Invalid Amount: "${amount}"`);

  const body = {
    ClientId: AMB.clientId,
    TransactionId: txn,
    CurrencyCode: String(currency || '').toUpperCase(),
    Amount: amt.toFixed(2),
    ...(cardToken ? { CardToken: cardToken } : {}),
    ...(signType ? { SignType: signType } : {}),
  };

  const call = async (apiKey) => {
    const { data } = await axios.post(AMB.sigUrl, body, {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      timeout: 20000,
    });
    return data;
  };

  try {
    let key = (AMB.apiKey || '').trim().replace(/^Bearer\s+/i,'');
    let data;
    try {
      data = await call(key);
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 401 && /invalid api key/i.test(String(e.response?.data))) {
        const alt = key.endsWith('=') ? key.slice(0, -1) : key;
        if (alt !== key) data = await call(alt);
        else throw e;
      } else {
        throw e;
      }
    }

    const success = String(data?.Success ?? data?.success ?? '').toUpperCase();
    if (success !== 'Y' || !data?.Signature) {
      throw new Error(`Amber API rejected: ${data?.Message || data?.message || data?.error || JSON.stringify(data)}`);
    }
    return data.Signature;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const server = err.response?.data?.Message || err.response?.data?.message || err.response?.data?.error;
      throw new Error(`Amber signature generation failed: ${status ? `HTTP ${status}` : (err.code || 'network')}${server ? ` | ${server}` : ''}`);
    }
    throw new Error(`Amber signature generation failed: ${err?.message || String(err)}`);
  }
}




/** Build POST target + payload for Standard Checkout (form POST) */
export function buildStandardCheckoutParams({
  req,
  transactionId,
  amount,
  currency = AMB.currency,   // 🔹 now honored
  customerInvoice = 'Y',
  autoRedirect = 'Y',
  tokenize = 'Y',
  customer,
  customMessage,
}) {
  const url = AMB.Standard_checkout_URL;
  const base = req ? getBaseUrl(req) : null;
  const dynamicReturn = (base && AMB.returnPath) ? joinUrl(base, AMB.returnPath) : null;
  const callbackUrl = buildFixedCallbackUrl(req);

  const baseFields = {
    ClientId: AMB.clientId,
    TransactionId: String(transactionId).trim(),
    CurrencyCode: String(currency || AMB.currency).toUpperCase(), // 🔹 use caller’s currency
    '3DSFlag': 'Y',
    Amount: normAmount(amount),
    Signature: '',                 // caller fills after signing
    ReturnToMerchant: 'Y',
    AutoRedirect: autoRedirect,
    CustomerInvoice: customerInvoice,
    CardTokenize: tokenize,
    ...(dynamicReturn ? { ReturnUrl: dynamicReturn } : {}),
    CallbackUrl: callbackUrl,
    ...(customMessage ? { CustomMessage: customMessage } : {}),
  };

  const billing = preferredBilling({ customer, pm: null });
  return { url, fields: { ...pickNonEmpty(baseFields), ...billing } };
}




/** Build POST target + payload for Tokenized Checkout (form POST) */
export function buildTokenizedCheckoutParams({
  req,
  transactionId,
  amount,
  currency = AMB.currency,   // 🔹 now honored
  cardToken,
  customerInvoice = 'N',
  autoRedirect = 'Y',
  customer,
  pm,
  customMessage,
}) {
  const url = `${AMB.baseUrl}/tokenize-checkout`;
  const base = req ? getBaseUrl(req) : null;
  const dynamicReturn = (base && AMB.returnPath) ? joinUrl(base, AMB.returnPath) : null;
  const callbackUrl = buildFixedCallbackUrl(req);

  const baseFields = {
    ClientId: AMB.clientId,
    TransactionId: String(transactionId).trim(),
    CurrencyCode: String(currency || AMB.currency).toUpperCase(), // 🔹 use caller’s currency
    '3DSFlag': 'Y',
    SignType: 'Card',
    Amount: normAmount(amount),
    CardToken: String(cardToken || '').trim(),
    Signature: '',                 // caller fills after signing
    ReturnToMerchant: 'Y',
    AutoRedirect: autoRedirect,
    CustomerInvoice: customerInvoice,
    ...(dynamicReturn ? { ReturnUrl: dynamicReturn } : {}),
    CallbackUrl: callbackUrl,
    ...(customMessage ? { CustomMessage: customMessage } : {}),
  };

  const billing = preferredBilling({ customer, pm });
  return { url, fields: { ...pickNonEmpty(baseFields), ...billing } };
}



/** Render a self-submitting HTML form; body posts JSON? → No, Amber expects regular form POST.
 * Their /standard-checkout and /tokenize-checkout accept normal form fields too.
 */
export function renderAutoPostHtml({ action, fields }) {
  const esc = v => String(v ?? '').replace(/"/g,'&quot;');
  const inputs = Object.entries(fields).map(([k,v]) =>
    `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join('\n');
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Redirecting...</title></head>
<body onload="document.forms[0].submit()">
  <form method="post" action="${esc(action)}">
    ${inputs}
  </form>
  <p>Redirecting to secure payment...</p>
</body></html>`;
}




// utils/amberpay.js 
export async function refundAmber({ transactionId, amount, reason = 'Admin action' }) {
  const url = `${process.env.AMBERPAY_BASE_URL}/refund`;

  const signature = await generateSignature({ transactionId, amount /* currency default ok */ });
  const payload = {
    ClientId: process.env.AMBERPAY_CLIENT_ID,
    TransactionId: transactionId,
    CurrencyCode: process.env.AMBERPAY_CURRENCY || 'JMD',
    Amount: Number(amount).toFixed(2),
    RefundAmount: Number(amount).toFixed(2),
    Signature: signature,
    Reason: reason
  };

  try {
    const { data } = await axios.post(url, payload, { timeout: 20000 });
    const Success      = String(data?.Success ?? '').toUpperCase();
    const RefundStatus = String(data?.RefundStatus ?? '').toLowerCase();
    const refund_ref   = data?.RefundReference || data?.RefundRef || null;
    const ok = (Success === 'Y') && (RefundStatus === 'success' || RefundStatus === 'successful');

    return {
      ok,
      status: ok ? 'success' : (RefundStatus || 'failed'),
      message: (data?.Message || (ok ? 'Refund successful' : 'Refund failed at gateway')).toString(),
      refund_ref,
      raw: data
    };
  } catch (err) {
    const d = err?.response?.data;
    return {
      ok: false,
      status: 'error',
      message: (d?.Message || err?.message || 'Refund error').toString(),
      refund_ref: d?.RefundReference || d?.RefundRef || null,
      raw: d || { error: err?.message || String(err) }
    };
  }
}




export async function manual_refundAmber({ transactionId, amount, reason = 'Admin action' }) {
  if (!transactionId) throw new Error('refundAmber: transactionId required');

  const url = `${AMB.baseUrl}/refund`;
  const amtStr = normAmount(amount);

  const signature = await generateSignature({
    transactionId,
    amount: amtStr,
    currency: AMB.currency, // keep capture currency
  });

  const payload = {
    ClientId: AMB.clientId,
    TransactionId: String(transactionId),
    CurrencyCode: AMB.currency,
    Amount: amtStr,
    RefundAmount: amtStr,
    Signature: signature,
    Reason: String(reason || 'Admin action'),
  };

  try {
    const { data } = await axios.post(url, payload, {
      timeout: 20000, headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
    });

    const u = (x) => (x == null ? '' : String(x));
    const Success   = u(data?.Success || data?.success).toUpperCase();
    const statusRaw = u(data?.RefundStatus || data?.status || data?.refund_status).toLowerCase();
    const message   = u(data?.Message || data?.message || data?.error).trim();
    const refundRef = data?.RefundReference || data?.RefundRef || data?.RefundReferenceNo || data?.RefundID || null;

    const successy = /^(success|successful|refunded)$/i.test(statusRaw);
    const ok = (Success === 'Y') && (successy || (!statusRaw && !!refundRef));

    return {
      ok,
      status: ok ? 'success' : (statusRaw || (Success === 'N' ? 'failed' : 'error') || 'failed'),
      message: message || (ok ? 'Refund successful' : 'Refund failed at gateway'),
      refund_ref: refundRef || null,
      raw: data
    };
  } catch (err) {
    const d = err?.response?.data;
    return {
      ok: false,
      status: 'error',
      message: (d?.Message || d?.message || err?.message || 'Refund error').toString(),
      refund_ref: d?.RefundReference || d?.RefundRef || d?.RefundReferenceNo || null,
      raw: d || { error: err?.message || String(err) }
    };
  }
}






//============== Save Card Utils ================================

export function parseLast4(padded) {
  const s = String(padded || '');
  const m = s.match(/(\d{4})$/);
  return m ? m[1] : null;
}

export function parseExpiry(mmYY) {
  const s = String(mmYY || '').replace(/\D/g,''); // "1229"
  if (s.length !== 4) return { exp_month: null, exp_year: null };
  const exp_month = parseInt(s.slice(0,2), 10);
  const yy        = parseInt(s.slice(2,4), 10);
  if (!exp_month || exp_month < 1 || exp_month > 12) return { exp_month: null, exp_year: null };
  return { exp_month, exp_year: 2000 + yy };
}

export function inferBrandFromMasked(padded) {
  const first = String(padded || '').replace(/\D/g,'')[0];
  if (first === '4') return 'Visa';
  if (first === '5') return 'Mastercard';
  if (first === '3') return 'Amex';
  return null;
}


//=============== Save Card Utils ==============================



//========= Small AMber Helpers =================================== 






export function pickNonEmpty(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    out[k] = typeof v === 'string' ? v.trim() : v;
  }
  return out;
}




export const safeTrim = v => (typeof v === 'string' ? v.trim() : v);
export const iso2 = c => (String(c||'').trim().slice(0,2).toUpperCase() || null);


// Prefer PaymentMethod billing snapshot first (if present), else Customer fields
export function preferredBilling_working({ customer, pm }) {

    const firstName = (customer.first_name || '').trim();
  const lastName  = (customer.last_name  || '').trim();

  const pmBilling = pickNonEmpty(pm ? {
    BillToEmail:     pm.bill_to_email,
    BillToTelephone: pm.bill_to_phone,
    BillToAddress:   pm.bill_to_address,
    BillToCity:      pm.bill_to_city,
    BillToState:     pm.bill_to_state,
    BillToZipCode:   pm.bill_to_zip,
    BillToCountry:   iso2(pm.bill_to_country),
     BillToFirstName: pm.billing_name,       // if you store first name; otherwise omit  
    BillToZipPostCode: pm.bill_to_zip,

  } : {});

  const custBilling = pickNonEmpty(customer ? {
    BillToEmail:     customer.email,
    BillToTelephone: customer.full_contact || customer.contact,
    BillToAddress:   customer.customer_address,
   BillToFirstName: firstName || undefined,   // doc shows "BillToFirstName"
 
    BillToCity:      null,   // fill if truly known
    BillToState:     null,   // fill if truly known (US: required)
    BillToZipPostCode: customer.postal_code,   // doc uses ZipPostCode
    BillToCountry:   null,   // set only if sure; must be ISO-2 (e.g., JM)

  } : {});

  // PM wins over Customer where present
  return pickNonEmpty({ ...custBilling, ...pmBilling });
}



/* ----------------- BUILD BILLING SNAPSHOTS ----------------- */


export function buildBillingFromCustomer(customer) {
  if (!customer) return {};
  const firstName = (customer.first_name || '').trim();
  const lastName  = (customer.last_name  || '').trim();
  const zip       = (customer.postal_code || '').trim();

  const base = {
    BillToFirstName: firstName || undefined,
    BillToLastName:  lastName  || undefined,
    BillToEmail:     customer.email,
    BillToTelephone: customer.full_contact || customer.contact,
    BillToAddress:   customer.customer_address,
    BillToCity:      null,
    BillToState:     null,
    BillToCountry:   null,
    BillToZipPostCode: zip || undefined,
  };
  if (zip) base.BillToZipCode = zip;
  return pickNonEmpty(base);
}


export function buildBillingFromPM(pm) {
  if (!pm) return {};
  const zip = (pm.bill_to_zip || '').trim();
  const base = {
    BillToFirstName: pm.billing_name,
    BillToEmail:     pm.bill_to_email,
    BillToTelephone: pm.bill_to_phone,
    BillToAddress:   pm.bill_to_address,
    BillToCity:      pm.bill_to_city,
    BillToState:     pm.bill_to_state,
    BillToCountry:   iso2(pm.bill_to_country),
    BillToZipPostCode: zip || undefined,
  };
  if (zip) base.BillToZipCode = zip;
  return pickNonEmpty(base);
}

/* ------------- CUSTOMER WINS; PM ONLY FILLS BLANKS ------------- */

export function preferredBilling({ customer, pm }) {
  const cust = buildBillingFromCustomer(customer);
  const card = buildBillingFromPM(pm);
  const merged = { ...cust };
  for (const [k, v] of Object.entries(card)) {
    if (v == null) continue;
    const cur = merged[k];
    if (cur == null || (typeof cur === 'string' && cur.trim() === '')) merged[k] = v;
  }
  return pickNonEmpty(merged);
}

//=============End amber helpers ==============