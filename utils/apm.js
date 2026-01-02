// utils/apm.js (ESM)
import axios from 'axios';
import fs from 'fs';
import path from 'path';

function aggregateForReceipt(order, items) {
  // Build semicolon-separated bilref & storageto lists (dedup preserve order)
  const bilrefs = [];
  const storages = [];
  for (const it of items) {
    if (it.bilref && !bilrefs.includes(String(it.bilref))) bilrefs.push(String(it.bilref));
    if (it.storageto && !storages.includes(String(it.storageto))) storages.push(String(it.storageto));
  }
  return {
    blreference: bilrefs.join(';'),
    storageto: storages.join(';')
  };
}

export async function generateApmReceipt({ order, items, amber }) {
  // amber = { auth_code, payment_ref }
  const { blreference, storageto } = aggregateForReceipt(order, items);

  const apmURL = process.env.APM_RECEIPT_API_BASE;
  const total = Number(order.total || 0).toFixed(2);

  // Typical receipt request payload (based on your spec)
  const params = {
    blreference,
    storageto,
    amount: total,
    paytype: 'creditcard',
    cashierid: 'mpay',
    authcode: amber?.auth_code || '',
    payref: amber?.payment_ref || '',
  };

  const { data } = await axios.get(apmURL, { params, timeout: 20000, httpsAgent: new (require('https').Agent)({ rejectUnauthorized:false }) });
  // Expect something like: { success:true, receipt_no:"...", pdf:"<base64>" } or a direct PDF URL.
  if (!data || data.success === false) {
    const msg = data?.message || 'APM receipt generation failed';
    throw new Error(msg);
  }

  let receiptNo = data.receipt_no || data.receipt || data.receiptNo || null;
  let pdfUrl = null;

  // Store PDF if provided as base64
  if (data.pdf) {
    const buff = Buffer.from(data.pdf, 'base64');
    const dir = process.env.RECEIPT_LOCAL_DIR || 'public/receipts';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!receiptNo) receiptNo = `ORD${order.order_id}-${Date.now()}`;
    const file = path.join(dir, `receipt_${receiptNo}.pdf`);
    fs.writeFileSync(file, buff);
    const publicBase = (process.env.RECEIPT_PUBLIC_BASE || '').replace(/\/$/, '');
    pdfUrl = `${publicBase}/receipts/receipt_${receiptNo}.pdf`;
  } else if (data.pdf_url) {
    pdfUrl = data.pdf_url;
  }

  if (!receiptNo && !pdfUrl) {
    throw new Error('APM responded without a receipt number or PDF');
  }
  return { receiptNo: receiptNo || null, pdfUrl: pdfUrl || null };
}
