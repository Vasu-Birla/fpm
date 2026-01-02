// utils/subscription_receipt.service.js
import ejs from 'ejs';
import puppeteer from 'puppeteer';
import * as url from 'url';
import * as path from 'path';
import fs from 'node:fs';
import { uploadBufferToS3 } from './s3helpers.js';

import { getBrand, DEFAULT_LOGO_PATH, DEFAULT_LOGO_URL, toHumanDateTime, parseJsonSafe } from '../helper/helper.js';

import moment from 'moment-timezone';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

function currencyLabel(code) {
  const c = (code || 'JMD').toUpperCase();
  return c === 'JMD' ? 'J$' : c;
}
function money(n, code) {
  const label = currencyLabel(code);
  return `${label} ${Number(n || 0).toFixed(2)}`;
}

function pickTz(val) {
  const s = (typeof val === 'string') ? val.trim() : '';
  if (s && moment.tz.zone(s)) return s;
  if (process.env.APP_TZ && moment.tz.zone(process.env.APP_TZ)) return process.env.APP_TZ;
  return 'UTC';
}




export async function buildSubReceiptView({ order, plan, paymentRef, authCode, currency }) {

    const brand = getBrand();
  const logoDataUrl = brand?.embedLogo || brand?.logoUrl; // 👈 prefer embedded, else URL


  // meta may be a JSON string – normalize it
  const meta = parseJsonSafe(order?.meta, {});

  // inside buildSubReceiptView, keep your code, then after you compute firmName:
let firmName = meta?.firm_name || order?.firm_name || meta?.firm || null;
// 🔹 If firmName is still missing, look up from DB once.
if (!firmName && order?.firm_id) {
  try {
    const { LawFirm } = await import('../models/index.js');
    const firm = await LawFirm.findByPk(order.firm_id, { attributes: ['firm_name'] });
    firmName = firm?.firm_name || null;
  } catch {}
}

  // be generous about which timestamp to show
  const paidTs = order?.paid_at || order?.updated_at || order?.created_at || new Date();
  const paidAt = toHumanDateTime(paidTs) || toHumanDateTime(new Date());

  const receipt = {
    receiptNo: order?.apm_receipt_no || order?.payment_ref || order?.order_id,
    firmName, // ✅ will now be filled
    paidAt,
    paid_at: paidAt,
    dateTime: paidAt,

    paymentRef: paymentRef || order?.payment_ref || null,
    transactionId: order?.transaction_id || null,
    authCode: authCode || order?.auth_code || null,

    planId: plan?.plan_id || order?.plan_id,
    planName: plan?.name || plan?.plan_key || null,
    billingPeriod: (plan?.billing_period || 'monthly'),

    amountFmt: money(order?.total ?? order?.amount ?? 0, currency || order?.currency || 'JMD'),
    currencyLabel: currencyLabel((currency || order?.currency || 'JMD')),

    pdfKey: order?.receipt_pdf_url || null
  };

  return { org: brand, logoSrc: brand?.logoUrl, receipt };
}


export async function buildSubReceiptView_working({ order, plan, paymentRef, authCode, currency }) {
  const brand = getBrand();

  // logo for web/email (URL) + PDF (data URL)
  let logoDataUrl = brand?.logoUrl || DEFAULT_LOGO_URL;
  try {
    if (fs.existsSync(DEFAULT_LOGO_PATH)) {
      const buf = fs.readFileSync(DEFAULT_LOGO_PATH);
      const ext = DEFAULT_LOGO_PATH.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
      logoDataUrl = `data:image/${ext};base64,${buf.toString('base64')}`;
    }
  } catch {}

  // meta may be a JSON string – normalize it
  const meta = parseJsonSafe(order?.meta, {});
let firmName = meta?.firm_name || order?.firm_name || meta?.firm || null;

  
// ⬇️ fallback: resolve from DB using firm_id (minimal query)
if (!firmName && order?.firm_id) {
  try {
    const firm = await LawFirm.findByPk(order.firm_id, {
      attributes: ['display_name','name','legal_name','firm_name','short_name']
    });
    firmName = firm?.firm_name ||  null;
  } catch {}
}

  // be generous about which timestamp to show
  const paidTs = order?.paid_at || order?.updated_at || order?.created_at || new Date();
  const paidAt = toHumanDateTime(paidTs) || toHumanDateTime(new Date());

  console.log('Meta at build receipt --->>> ',meta)
  console.log('==============================================================')
    console.log('order at build receipt --->>> ',order)

  const receipt = {
    // IDs
    receiptNo: order?.apm_receipt_no || order?.payment_ref || order?.order_id,
    paymentRef: paymentRef || order?.payment_ref || null,
    transactionId: order?.transaction_id || null,
    authCode: authCode || order?.auth_code || null,

    // Firm
    firmName,

    // Plan
    planId: plan?.plan_id || order?.plan_id,
    planName: plan?.name || plan?.plan_key || null,
    billingPeriod: (plan?.billing_period || 'monthly'),

    // Money
    amountFmt: (() => {
      const code = (currency || order?.currency || 'JMD');
      const amt  = (order?.total ?? order?.amount ?? 0);
      const label = (code || 'JMD').toUpperCase() === 'JMD' ? 'J$' : (code || '').toUpperCase();
      return `${label} ${Number(amt).toFixed(2)}`;
    })(),
    currencyLabel: ((code) => (code || 'JMD').toUpperCase() === 'JMD' ? 'J$' : (code || '').toUpperCase())(currency || order?.currency || 'JMD'),

    // Time (provide multiple aliases so any EJS works)
    paidAt,                // camelCase
    paid_at: paidAt,       // snake_case alias
    dateTime: paidAt,      // legacy alias

    // PDF (if already uploaded)
    pdfKey: order?.receipt_pdf_url || null
  };

  console.log('receipt-------- >>>',receipt)

  return { org: brand, logoSrc: brand?.logoUrl, receipt };
}



export async function renderAndUploadSubReceiptPdf({ order, plan }) {
  const brand = getBrand();
  let logoDataUrl = brand?.logoUrl || DEFAULT_LOGO_URL;
  try {
    if (fs.existsSync(DEFAULT_LOGO_PATH)) {
      const buf = fs.readFileSync(DEFAULT_LOGO_PATH);
      const ext = DEFAULT_LOGO_PATH.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
      logoDataUrl = `data:image/${ext};base64,${buf.toString('base64')}`;
    }
  } catch {}

  const currency = (order?.currency || 'JMD').toUpperCase();
  const view = await buildSubReceiptView({
    order,
    plan,
    paymentRef: order?.payment_ref,
    authCode: order?.auth_code,
    currency
  });

  const templatePath = path.resolve(process.cwd(), 'views/receipts/subscription_receipt_pdf.ejs');
  const html = await ejs.renderFile(templatePath, {
    org: view.org,
    logoSrc: logoDataUrl,
    receipt: view.receipt
  });

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  let pdfBuffer;
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('screen');
    pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '14mm', right: '12mm', bottom: '16mm', left: '12mm' }
    });
  } finally {
    await browser.close();
  }

  const safe = String(view.receipt.receiptNo || `order_${order.order_id}`).replace(/[^\w.-]+/g, '_');
  const key = `receipts/sub_${order.order_id}_${safe}.pdf`;

  await uploadBufferToS3({ key, buffer: pdfBuffer, contentType: 'application/pdf' });
  return { key, buffer: pdfBuffer, view };  // return view so caller can render HTML/email
}
