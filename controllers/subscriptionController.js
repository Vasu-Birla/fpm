// controllers/subscriptionController.js
import { Op ,where, fn, col, literal } from 'sequelize';
import sequelize from '../config/sequelize.js';


import { parseLast4, parseExpiry, inferBrandFromMasked, iso2, safeTrim } from '../utils/amberpay.js';

import {Plan,FirmSubscription,PaymentMethod,SubOrder, LawFirm, FirmStaff } from '../models/index.js';

import { Audit } from '../utils/auditLogger.js';
import { isAjax } from '../helper/helper.js';
import { kilError } from '../utils/kilError.js';

import {
  genTxnId,
  generateSignature,
  buildStandardCheckoutParams,
  buildTokenizedCheckoutParams,
  renderAutoPostHtml,
} from '../utils/amberpay.js';


import { getBaseUrl } from '../utils/url.js';

import { renderAndUploadSubReceiptPdf, buildSubReceiptView } from '../utils/subscription_receipt.service.js';
import { send_sub_payment_success_email, send_sub_payment_failed_email } from '../utils/emailhelper.js';

// ---- helpers ---------------------------------------------------------

// currency exponent map (default 2)
const EXP = { JPY:0, KRW:0, VND:0, KWD:3, BHD:3, JOD:3, OMR:3, TND:3 };
const toMajor = (cur, minor) => {
  const exp = EXP[(cur || '').toUpperCase()] ?? 2;
  return Number(minor || 0) / Math.pow(10, exp);
};
const addMonths = (d, m) => { const x = new Date(d); x.setMonth(x.getMonth()+m); return x; };
const addYears  = (d, y) => { const x = new Date(d); x.setFullYear(x.getFullYear()+y); return x; };

function computeNextRenewal(period) {
  const now = new Date();
  if (period === 'monthly') return addMonths(now, 1);
  if (period === 'yearly')  return addYears(now, 1);
  return null; // one_time (no renewal)
}

function wantsHtml(req){
  const a = String(req.headers['accept']||'');
  const ua = String(req.headers['user-agent']||'');
  return a.includes('text/html') || /Mozilla|Chrome|Safari|Firefox/i.test(ua);
}

// ---- PAGE ------------------------------------------------------------
export const showPlansPage = async (req, res) => {
  try {
    return res.render('firmstaff/subscription_plans', { title: 'Choose a Plan', csrfToken: req.csrfToken?.() });
  } catch (e) {
    return res.status(500).send('Error loading plans');
  }
};

// ---- API: list plans -------------------------------------------------
export const listPlans = async (req, res) => {
  try {
    const plans = await Plan.findAll({
      where: { solution_key: 'core', is_active: 1 },
      order: [['price_minor', 'ASC'], ['name', 'ASC']],
      raw: true,
    });

    const out = plans.map(p => {
      const cur = p.price_currency || (process.env.CURRENCY || 'JMD');
      const priceMajor = toMajor(cur, p.price_minor);
      return {
        plan_id: p.plan_id,
        plan_key: p.plan_key,
        name: p.name,
        description: p.description || '',
        badge: p.badge || null,
        popular: !!p.is_popular,
        currency: cur,
        price_major: priceMajor,              // <— single price in major
        billing_period: p.billing_period,     // 'monthly' | 'yearly' | 'one_time'
        is_free: Number(p.price_minor || 0) === 0,
        features: p.features_json || {},
        trial_days: p.trial_days || 0,
      };
    });

    return res.json({ success: true, plans: out });
  } catch (e) {
    console.log('listPlans error', e);
    return res.status(500).json({ success: false, message: 'Failed to load plans' });
  }
};

// ---- API: free plan select ------------------------------------------
export const selectFree = async (req, res) => {
  const staff = req.firmstaff;
  const firm_id = staff?.firm_id;
  const { plan_id } = req.body || {};
  if (!firm_id || !plan_id) return res.status(400).json({ success:false, message:'Missing firm/plan' });

  let t;
  try {
    const plan = await Plan.findOne({ where: { plan_id, solution_key: 'core', is_active: true }, raw: true });
    if (!plan) return res.status(404).json({ success:false, message:'Plan not found' });

    // free iff price_minor == 0
    if (Number(plan.price_minor || 0) > 0) {
      return res.status(400).json({ success:false, message:'Selected plan is not free' });
    }

    t = await sequelize.transaction();

    const renews_at = computeNextRenewal(plan.billing_period);
    // upsert single active subscription per firm/solution
    const [sub, created] = await FirmSubscription.findOrCreate({
      where: { firm_id, solution_key: 'core' },
      defaults: {
        firm_id,
        solution_key: 'core',
        plan_id: plan.plan_id,
        status: 'active',
        starts_at: new Date(),
        renews_at,
        addons_json: [],
        overrides_json: {},
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!created) {
      await sub.update({ plan_id: plan.plan_id, status:'active', starts_at: new Date(), renews_at }, { transaction: t });
    }

    await t.commit();

    await Audit.success({
      actorType:'FirmStaff', actorId:staff.staff_id, url:req.originalUrl,
      action:'SUBS_SELECT_FREE', description:`firm=${firm_id}, plan=${plan.plan_key}`
    });

    return res.json({ success:true, message:'Free plan activated', plan_key: plan.plan_key });
  } catch (e) {
    try { if (t && !t.finished) await t.rollback(); } catch {}
    await Audit.failed({ actorType:'FirmStaff', actorId:staff?.staff_id || null, url:req.originalUrl, action:'SUBS_SELECT_FREE_ERR', description:kilError(e) });
    return res.status(500).json({ success:false, message:`Internal Server: ${kilError(e)}` });
  }
};

// ---- API: checkout (create SubOrder) --------------------------------
export const checkoutPaid_old = async (req, res) => {
  const staff = req.firmstaff;
  const firm_id = staff?.firm_id;
  const { plan_id } = req.body || {};
  if (!firm_id || !plan_id) return res.status(400).json({ success:false, message:'Missing firm/plan' });

  let t;
  try {
    const plan = await Plan.findOne({
      where: { plan_id, solution_key:'core', is_active:true },
      raw: true
    });

    if (!plan) return res.status(404).json({ success:false, message:'Plan not found' });

    // derive major amount from price_minor & currency
    const currency = plan.price_currency || (process.env.AMBERPAY_CURRENCY || 'JMD');
    const amountMajor = toMajor(currency, plan.price_minor);

    if (!(amountMajor > 0)) {
      return res.status(400).json({ success:false, message:'Selected plan is free; use free select API' });
    }

    // this plan’s billing_period decides the cycle; there’s no “choose monthly/yearly”
    const cycle = plan.billing_period; // 'monthly' | 'yearly' | 'one_time'
    const txnId = genTxnId();

    t = await sequelize.transaction();

    const order = await SubOrder.create({
      firm_id,
      plan_id: plan.plan_id,
      status: 'Pending',
      payment_status: 'unpaid',
      currency: currency.toUpperCase(),
      subtotal: amountMajor,
      tax: 0,
      total: amountMajor,
      items_count: 1,
      payment_provider: 'amber',
      transaction_id: txnId,
      meta: {
        cycle, plan_key: plan.plan_key, plan_name: plan.name,
        amber: { txnId, tokenized:false, pm_id:null }
      }
    }, { transaction: t });

    await t.commit();

    await Audit.success({
      actorType:'FirmStaff', actorId:staff.staff_id, url:req.originalUrl,
      action:'SUBS_CHECKOUT_CREATED', description:`order=${order.order_id}, total=${amountMajor}`
    });

    return res.json({ success:true, order_id: order.order_id, total: amountMajor });

  } catch (e) {
    try { if (t && !t.finished) await t.rollback(); } catch {}
    await Audit.failed({ actorType:'FirmStaff', actorId:staff?.staff_id||null, url:req.originalUrl, action:'SUBS_CHECKOUT_ERR', description:kilError(e) });
    return res.status(500).json({ success:false, message:`Internal Server: ${kilError(e)}` });
  }
};



// ---- API: checkout (create SubOrder) --------------------------------
export const checkoutPaid = async (req, res) => {
  const staff = req.firmstaff;
  const firm_id = staff?.firm_id;
  const { plan_id } = req.body || {};
  if (!firm_id || !plan_id) return res.status(400).json({ success:false, message:'Missing firm/plan' });

  let t;
  try {
    const plan = await Plan.findOne({
      where: { plan_id, solution_key:'core', is_active:true },
      raw: true
    });
    if (!plan) return res.status(404).json({ success:false, message:'Plan not found' });

    // 🔹 pull firm & its FirmAdmin email (fallback to current staff email)
    const firm = await LawFirm.scope('withFirmAdmin').findByPk(firm_id);
    const firmName  = firm?.firm_name || null;
    const adminUser = Array.isArray(firm?.staff) ? firm.staff[0] : null;   // from scope limit:1
    const firmEmail = adminUser?.email || staff?.email || null;

    const currency = plan.price_currency || (process.env.AMBERPAY_CURRENCY || 'JMD');
    const amountMajor = toMajor(currency, plan.price_minor);
    if (!(amountMajor > 0)) {
      return res.status(400).json({ success:false, message:'Selected plan is free; use free select API' });
    }

    const cycle = plan.billing_period;
    const txnId = genTxnId();

    t = await sequelize.transaction();

    const order = await SubOrder.create({
      firm_id,
      plan_id: plan.plan_id,
      status: 'Pending',
      payment_status: 'unpaid',
      currency: currency.toUpperCase(),
      subtotal: amountMajor,
      tax: 0,
      total: amountMajor,
      items_count: 1,
      payment_provider: 'amber',
      transaction_id: txnId,
      meta: {
        cycle,
        plan_key: plan.plan_key,
        plan_name: plan.name,
        // 🔹 add these two so receipts/emails work without extra queries:
        firm_name: firmName,              // <<<<<<<<<<
        firm_email: firmEmail,            // <<<<<<<<<<
        amber: { txnId, tokenized:false, pm_id:null }
      }
    }, { transaction: t });

    await t.commit();

    await Audit.success({
      actorType:'FirmStaff', actorId:staff.staff_id, url:req.originalUrl,
      action:'SUBS_CHECKOUT_CREATED', description:`order=${order.order_id}, total=${amountMajor}`
    });

    return res.json({ success:true, order_id: order.order_id, total: amountMajor });
  } catch (e) {
    try { if (t && !t.finished) await t.rollback(); } catch {}
    await Audit.failed({ actorType:'FirmStaff', actorId:staff?.staff_id||null, url:req.originalUrl, action:'SUBS_CHECKOUT_ERR', description:kilError(e) });
    return res.status(500).json({ success:false, message:`Internal Server: ${kilError(e)}` });
  }
};

// ---- API: payment/start (standard/tokenized) -------------------------
export const paymentStart_old = async (req, res) => {
  const staff = req.firmstaff;
  const firm_id = staff?.firm_id;
  const { order_id, use_tokenized, pm_id } = req.body || {};

  try {
    const order = await SubOrder.findOne({ where:{ order_id, firm_id } });
    if (!order) return res.status(404).json({ success:false, message:'Order not found' });
    if (!(order.status === 'Pending' && (order.payment_status === 'unpaid' || order.payment_status == null))) {
      return res.status(400).json({ success:false, message:'Order is not payable' });
    }

    const wantsTokenized = String(use_tokenized ?? '').toUpperCase()==='Y' || !!pm_id;
    let token = ''; let pm = null;
    if (wantsTokenized) {
      pm = await PaymentMethod.findOne({ where:{ pm_id, customer_id: null, firm_id, provider:'amber' } });
      if (!pm || !pm.token) return res.status(400).json({ success:false, message:'Saved card not found' });
      token = String(pm.token).trim();
    }

    const amount = Number(order.total);                 // already in major units
    const currency = (order.currency || process.env.AMBERPAY_CURRENCY || 'JMD').toUpperCase();

    // ensure txnId present
    let txnId = order.transaction_id || order.meta?.amber?.txnId || genTxnId();
    if (txnId !== order.transaction_id) {
      const meta = { ...(order.meta||{}), amber: { ...(order.meta?.amber||{}), txnId, tokenized: !!wantsTokenized, pm_id: pm_id || null } };
      await order.update({ transaction_id: txnId, meta });
      await order.reload();
    }

    const signature = await generateSignature({
      transactionId: txnId,
      amount,
      currency,
      ...(wantsTokenized ? { signType: 'Card', cardToken: token } : {})
    });

    const params = wantsTokenized
      ? buildTokenizedCheckoutParams({
          req, transactionId: txnId, amount, cardToken: token,
          customerInvoice: 'N', autoRedirect: 'Y', customer: null, pm,
          customMessage: `Order #${order.order_id} - ${order.meta?.plan_name || 'Subscription'}`
        })
      : buildStandardCheckoutParams({
          req, transactionId: txnId, amount,
          customerInvoice: 'Y', autoRedirect: 'Y', tokenize: 'Y',
          customer: null,
          customMessage: `Order #${order.order_id} - ${order.meta?.plan_name || 'Subscription'}`
        });

    params.fields.Amount       = amount.toFixed(2);
    params.fields.CurrencyCode = currency;
    params.fields.Signature    = signature;
    if (wantsTokenized) params.fields.CardToken = token;

    const html = renderAutoPostHtml({ action: params.url, fields: params.fields });

    await Audit.success({
      actorType:'FirmStaff', actorId:staff.staff_id, url:req.originalUrl,
      action: wantsTokenized ? 'SUBS_PAYMENT_START_TOKENIZED' : 'SUBS_PAYMENT_START_STANDARD',
      description:`order=${order.order_id}, txn=${txnId}`
    });

    res.setHeader('Content-Type','text/html; charset=utf-8');
    return res.status(200).send(html);

  } catch (e) {
    console.log('subs paymentStart error', e);
    await Audit.failed({ actorType:'FirmStaff', actorId:staff?.staff_id||null, url:req.originalUrl, action:'SUBS_PAYMENT_START_ERR', description:kilError(e, { full:true, verbose:true }) });
    return res.status(500).json({ success:false, message:`Internal Server: ${kilError(e)}` });
  }
};


// ---- API: payment/start (standard/tokenized) -------------------------
export const paymentStart = async (req, res) => {
  const staff   = req.firmstaff;
  const firm_id = staff?.firm_id;
  const { order_id, use_tokenized, pm_id } = req.body || {};

  try {
    // 1) Validate order belongs to this firm and is payable
    const order = await SubOrder.findOne({ where: { order_id, firm_id } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const isPayable =
      order.status === 'Pending' &&
      (order.payment_status === 'unpaid' || order.payment_status == null);
    if (!isPayable) {
      return res.status(400).json({ success: false, message: 'Order is not payable' });
    }

    // 2) Optional: bring Firm + FirmAdmin for "BillTo" (nicer Amber invoice + email fallbacks)
    const firm = await LawFirm.scope('withFirmAdmin').findByPk(firm_id);
    const adminUser = Array.isArray(firm?.staff) ? firm.staff[0] : null;

    // Shape compatible with amberpay.js buildBillingFromCustomer()
    const pseudoCustomer = {
      first_name: (adminUser?.first_name || firm?.firm_name || '').toString(),
      last_name:  (adminUser?.last_name || '').toString(),
      email:      adminUser?.email || null,
      full_contact: adminUser?.contact || null,
      customer_address: firm?.address || null,
      postal_code: null
    };

    // 3) Tokenized vs Standard
    const wantsTokenized =
      String(use_tokenized ?? '').toUpperCase() === 'Y' || !!pm_id;

    let token = '';
    let pm    = null;
    if (wantsTokenized) {
      pm = await PaymentMethod.findOne({
        where: { pm_id, customer_id: null, firm_id, provider: 'amber' }
      });
      if (!pm || !pm.token) {
        return res.status(400).json({ success: false, message: 'Saved card not found' });
      }
      token = String(pm.token).trim();
    }

    // 4) Amount & currency
    const amount   = Number(order.total); // already major units
    const currency = (order.currency || process.env.AMBERPAY_CURRENCY || 'JMD').toUpperCase();

    // 5) Ensure TransactionId and keep meta.amber in sync
    let txnId = order.transaction_id || order.meta?.amber?.txnId || genTxnId();
    if (txnId !== order.transaction_id ||
        (order.meta?.amber?.tokenized !== !!wantsTokenized) ||
        (order.meta?.amber?.pm_id !== (pm_id || null))) {
      const meta = mergeOrderMeta(order.meta, {
        amber: {
          ...(order.meta?.amber || {}),
          txnId,
          tokenized: !!wantsTokenized,
          pm_id: pm_id || null
        }
      });
      await order.update({ transaction_id: txnId, meta });
      await order.reload();
    }

    // 6) Signature exactly per tenant rules
    const signature = await generateSignature({
      transactionId: txnId,
      amount,
      currency,
      ...(wantsTokenized ? { signType: 'Card', cardToken: token } : {})
    });

    // 7) Build POST payload (includes CallbackUrl + optional ReturnUrl internally)
    const params = wantsTokenized
      ? buildTokenizedCheckoutParams({
          req,
          transactionId: txnId,
          amount,
          cardToken: token,
          customerInvoice: 'N',
          autoRedirect: 'Y',
          customer: pseudoCustomer,        // <-- fill BillTo from firm/admin
          pm,
          customMessage: `Order #${order.order_id} - ${order.meta?.plan_name || 'Subscription'}`
        })
      : buildStandardCheckoutParams({
          req,
          transactionId: txnId,
          amount,
          customerInvoice: 'Y',
          autoRedirect: 'Y',
          tokenize: 'Y',
          customer: pseudoCustomer,        // <-- fill BillTo from firm/admin
          customMessage: `Order #${order.order_id} - ${order.meta?.plan_name || 'Subscription'}`
        });

    // 8) Finalize signed fields (parity with signer)
    params.fields.Amount       = amount.toFixed(2);
    params.fields.CurrencyCode = currency;
    params.fields.Signature    = signature;
    if (wantsTokenized) params.fields.CardToken = token;

    // 9) Render auto-post page
    const html = renderAutoPostHtml({ action: params.url, fields: params.fields });

    // 10) Audit
    await Audit.success({
      actorType: 'FirmStaff',
      actorId:   staff.staff_id,
      url:       req.originalUrl,
      action:    wantsTokenized ? 'SUBS_PAYMENT_START_TOKENIZED' : 'SUBS_PAYMENT_START_STANDARD',
      description: `order=${order.order_id}, txn=${txnId}`
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);

  } catch (e) {
    console.log('subs paymentStart error', e);
    await Audit.failed({
      actorType: 'FirmStaff',
      actorId:   req.firmstaff?.staff_id || null,
      url:       req.originalUrl,
      action:    'SUBS_PAYMENT_START_ERR',
      description: kilError(e, { full: true, verbose: true })
    });
    return res.status(500).json({ success: false, message: `Internal Server: ${kilError(e)}` });
  }
};


// ---------- Amber CALLBACK for subscriptions for This Elaw project  ----------
export const amberCallbackForSubscriptions_working_fine_json_only = async (req, res) => {


  // helper (use your shared one if already defined in this file)
  const addMonths = (d, m) => { const x = new Date(d); x.setMonth(x.getMonth()+m); return x; };
  const addYears  = (d, y) => { const x = new Date(d); x.setFullYear(x.getFullYear()+y); return x; };
  const computeNextRenewal = (period) => {
    const now = new Date();
    if (period === 'monthly') return addMonths(now, 1);
    if (period === 'yearly')  return addYears(now, 1);
    return null; // one_time
  };

  const steps = [];
  const add = (label, status, detail='') => { steps.push({label,status,detail:String(detail||'')}); };

  try {
    // Amber can post x-www-form-urlencoded or JSON; we enabled both on the route.
    const b = req.body || {};


    console.log('===================== Amber Payment Callback ELAW Body ===============')

    console.log(b)

      console.log('===================== Amber Payment Callback ELAW Body ===============')

    // normalize common fields
    const txnId    = b.TransactionId || b.transactionId || b.txnId || '';
    const payRef   = b.PaymentRef || b.payref || b.OrderId || b.orderId || '';
    const auth     = b.AuthCode || b.authcode || b.AuthorizationCode || '';
    const rawAmt   = b.AmountCharged ?? b.Amount ?? b.amount ?? 0; // MAJOR units
    const amount   = Number(rawAmt || 0);
    const currency = String(b.CurrencyCode || b.currency || 'JMD').toUpperCase();
    const rawStat  = String(b.PaymentStatus || b.status || '').toLowerCase();

    // Try to match order by txnId first, else by "Order #123" inside CustomMessage
    let order = null;
    if (txnId) {
      order = await SubOrder.findOne({ where: { transaction_id: txnId } });
    }
    if (!order && /Order\s*#(\d+)/i.test(b.CustomMessage || '')) {
      const id = Number((b.CustomMessage || '').match(/Order\s*#(\d+)/i)[1]);
      if (Number.isFinite(id)) {
        order = await SubOrder.findOne({ where: { order_id: id } });
      }
    }
    if (!order) {
      add('Match payment to order', 'error', `No SubOrder for txnId=${txnId || '-'}; CustomMessage=${b.CustomMessage || ''}`);
      return res.status(200).json({ ok:true, steps });
    }
    add('Match payment to order', 'success', `Order #${order.order_id}`);

    // If already marked paid, return idempotently
    if (order.payment_status === 'paid') {
      add('Idempotent check', 'success', 'Order already paid');
      return res.status(200).json({ ok:true, order_id: order.order_id, steps });
    }

    // Persist inbound details into meta for audit
    const newMeta = {
      ...(order.meta || {}),
      amber_inbound: {
        at: new Date().toISOString(),
        currency,
        amount,
        status: rawStat,
        payload: b
      }
    };

    // map status
    const isSuccess = rawStat === 'success';
    const isFail    = rawStat === 'failed' || rawStat === 'failure' || rawStat === 'canceled' || rawStat === 'cancelled';

    if (isSuccess) {
      // mark order paid
      await order.update({
        status: 'Pending',                  // business choice: keep 'Pending' until post-activation; or set 'Completed'
        payment_status: 'paid',
        transaction_id: txnId || order.transaction_id,
        payment_ref: payRef || order.payment_ref || null,
        auth_code: auth || order.auth_code || null,
        paid_at: new Date(),
        meta: newMeta
      });

      // Fetch plan to compute renewals
      const plan = await Plan.findByPk(order.plan_id, { raw: true });
      const period = plan?.billing_period || 'monthly';
      const renews_at = computeNextRenewal(period);

      // upsert/activate subscription
      await FirmSubscription.upsert({
        firm_id: order.firm_id,
        solution_key: 'core',
        plan_id: order.plan_id,
        status: 'active',
        starts_at: new Date(),
        renews_at,
        addons_json: [],
        overrides_json: {}
      }, {
        fields: ['firm_id','solution_key','plan_id','status','starts_at','renews_at','addons_json','overrides_json']
      });

      add('Activate subscription', 'success', `Plan ${plan?.plan_key || order.plan_id} (${period})`);
      await Audit.success({
        actorType:'System', actorId:null, url:req.originalUrl,
        action:'SUBS_PAYMENT_SUCCESS',
        description:`order=${order.order_id}, txn=${txnId}, amount=${amount} ${currency}`
      });

      return res.status(200).json({ ok:true, order_id: order.order_id, steps });
    }

    if (isFail) {
      await order.update({
        status:'Cancelled',
        payment_status:'failed',
        transaction_id: txnId || order.transaction_id,
        payment_ref: payRef || order.payment_ref || null,
        auth_code: auth || order.auth_code || null,
        meta: newMeta
      });
      add('Mark failed', 'success', `Gateway status=${rawStat}`);
      await Audit.denied({
        actorType:'System', actorId:null, url:req.originalUrl,
        action:'SUBS_PAYMENT_FAILED',
        description:`order=${order.order_id}, txn=${txnId}, status=${rawStat}`
      });
      return res.status(200).json({ ok:true, order_id: order.order_id, steps });
    }

    // Unknown/pending
    await order.update({ meta: newMeta });
    add('Payment status', 'warning', `Gateway=${rawStat || 'unknown'}`);
    await Audit.warn({
      actorType:'System', actorId:null, url:req.originalUrl,
      action:'SUBS_PAYMENT_PENDING',
      description:`order=${order.order_id}, txn=${txnId}, status=${rawStat}`
    });
    return res.status(200).json({ ok:true, order_id: order.order_id, steps });

  } catch (e) {
    steps.push({ label:'Unexpected error', status:'error', detail: e?.message || String(e) });
    await Audit.failed({
      actorType:'System', actorId:null, url:req.originalUrl,
      action:'SUBS_PAYMENT_CALLBACK_ERR', description: (e && e.stack) ? e.stack : String(e)
    });
    // Return 200 so gateway doesn't spam retries; your logs capture the error.
    return res.status(200).json({ ok:false, steps });
  }
};


// controllers/subscriptionController.js (place above amberCallbackForSubscriptions)
async function resolveFirmContactFromOrder(order, req) {
  const meta = parseJsonSafe(order?.meta, {});
  let email = meta?.firm_email || order?.email || req?.firmstaff?.email || req?.user?.email || null;
  let contact = meta?.firm_contact || req?.firmstaff?.full_name || req?.firmstaff?.name || req?.user?.name || null;
  let firmName = meta?.firm_name || order?.firm_name || null;

  try {
    if ((!email || !firmName) && order?.firm_id) {
      const [firm, admin] = await Promise.all([
        LawFirm.findByPk(order.firm_id, {
          attributes: ['firm_name']
        }),
        FirmStaff.findOne({
          where: { firm_id: order.firm_id, status: 'Active', role: 'FirmAdmin' },
          attributes: ['email','full_name','first_name','last_name'],
          order: [['staff_id','ASC']]
        })
      ]);

      firmName = firmName || firm?.firm_name || null;
      if (!email) {
        email = admin?.email || null;
      }
      if (!contact) {
        contact = admin?.full_name || [admin?.first_name, admin?.last_name].filter(Boolean).join(' ') || firmName || 'Subscriber';
      }
    }
  } catch (e) {
    console.log('[SUBS][resolveFirmContactFromOrder] lookup error:', String(e));
  }

  return { email, contact: contact || 'Subscriber', firmName: firmName || null };
}




export const amberCallbackForSubscriptions = async (req, res) => {
  const steps = [];
  const add = (label, status, detail='') => { steps.push({label, status, detail:String(detail||'')}); };

  try {
    const b = req.body || {};


    console.log('====================== Amber Pay Callback Body  =====================')

console.log(b)
console.log('====================== END Amber Pay Callback Body  =====================')

    // normalize core fields
    const txnId    = b.TransactionId || b.transactionId || b.txnId || '';
    const payRef   = b.PaymentRef || b.payref || b.OrderId || b.orderId || '';
    const auth     = b.AuthCode || b.authcode || b.AuthorizationCode || '';
    const rawAmt   = b.AmountCharged ?? b.Amount ?? b.amount ?? 0;
    const amount   = Number(rawAmt || 0);
    const currency = String(b.CurrencyCode || b.currency || 'JMD').toUpperCase();
    const rawStat  = String(b.PaymentStatus || b.status || '').toLowerCase();
    const customMsg= b.CustomMessage || '';

    // find SubOrder (txnId first, fallback to "Order #123" inside CustomMessage)
    let order = null;
    if (txnId) {
      order = await SubOrder.findOne({ where: { transaction_id: txnId } });
    }
    if (!order && /Order\s*#(\d+)/i.test(customMsg)) {
      const id = Number(customMsg.match(/Order\s*#(\d+)/i)[1]);
      if (Number.isFinite(id)) order = await SubOrder.findOne({ where: { order_id: id } });
    }

    if (!order) {
      add('Match payment to order','error',`No SubOrder for txnId=${txnId || '-'}; CustomMessage=${customMsg || ''}`);
      return wantsHtml(req)
        ? res.status(200).render('partials/handle_payment_msgs', {
            title:'Payment Received',
            subtitle:'We could not match this payment to a subscription order.',
            orderInfo:{ orderId:'-', transactionId:txnId, amount, currency, method:'Card', payRef:payRef, authCode:auth },
            steps, redirectTo:'/'
          })
        : res.status(200).json({ ok:true, steps });
    }
    add('Match payment to order', 'success', `Order #${order.order_id}`);

      const firm = await LawFirm.scope('withFirmAdmin').findByPk(order.firm_id);
     const adminUser = Array.isArray(firm?.staff) ? firm.staff[0] : null;

    // idempotency
    if (order.payment_status === 'paid' && order.receipt_pdf_url) {
      add('Idempotent check','success','Order already finalized');
      // render view with current receipt view model
      const plan = await Plan.findByPk(order.plan_id, { raw:true });
      const view = await buildSubReceiptView({
        order,
        plan,
        paymentRef: order.payment_ref,
        authCode: order.auth_code,
        currency: order.currency || currency
      });

      return wantsHtml(req)
        ? res.status(200).render('receipts/sub_confirmation', { ...view })
        : res.status(200).json({ ok:true, order_id: order.order_id, steps });
    }

    // audit snapshot
    const newMeta = {
      ...(order.meta || {}),
      amber_inbound: {
        at: new Date().toISOString(),
        currency, amount, status: rawStat, payload: b
      }
    };

    const isSuccess = rawStat === 'success';
    const isFail    = ['failed','failure','canceled','cancelled'].includes(rawStat);

    // === SUCCESS ===
    if (isSuccess) {
      // persist success on order
      await order.update({
        status: 'Pending',
        payment_status: 'paid',
        transaction_id: txnId || order.transaction_id,
        payment_ref: payRef || order.payment_ref || null,
        auth_code: auth || order.auth_code || null,
        paid_at: new Date(),
        currency,
        total: Number.isFinite(amount) ? amount : (order.total || 0),
        meta: newMeta
      });


        // 👇 NEW: save tokenized card to staff’s vault (owner = staff_id)
  await maybeSaveCardTokenForSubs({
    order,
    body: b,
    staff_id_hint: adminUser?.staff_id  || null,  // if available
    add
  });


      // plan + subscription activation
      const plan = await Plan.findByPk(order.plan_id, { raw: true });
      const period = plan?.billing_period || 'monthly';
      const renews_at = computeNextRenewal(period);

      await FirmSubscription.upsert({
        firm_id: order.firm_id,
        solution_key: 'core',
        plan_id: order.plan_id,
        status: 'active',
        starts_at: new Date(),
        renews_at,
        addons_json: [],
        overrides_json: {}
      }, {
        fields: ['firm_id','solution_key','plan_id','status','starts_at','renews_at','addons_json','overrides_json']
      });
      add('Activate subscription','success',`Plan ${plan?.plan_key || order.plan_id} (${period})`);

      // generate receipt PDF → upload → save key
      let upload;
      try {
        const r = await renderAndUploadSubReceiptPdf({ order: { ...order.get() }, plan });
        upload = r;
        await order.update({ receipt_pdf_url: r.key });
        add('Upload receipt PDF','success', r.key);
      } catch (e) {
        add('Upload receipt PDF','warning', e?.message || e);
      }


//----- start sending succes email ----
const baseUrl = getBaseUrl(req);
const meta = (order && typeof order.meta === 'object') ? order.meta : {};

let firmEmail = order?.meta?.firm_email || order?.email || null;
if (!firmEmail && order?.firm_id) {
  try {
    const { LawFirm, FirmStaff } = await import('../models/index.js');  
    firmEmail = adminUser?.email || req.firmstaff?.email || null;
  } catch {}
}

if (firmEmail) {
    const baseUrl = getBaseUrl(req);
  console.log('Starting sending subscription email to -->> ',firmEmail)
  const view = await buildSubReceiptView({ order: order.get(), plan, paymentRef: payRef, authCode: auth, currency });
  //  console.log('buildSubReceiptView-->>view ',view)
  await send_sub_payment_success_email(firmEmail, {
    username: order?.meta?.firm_contact || view?.receipt?.firmName || 'Subscriber',
    orderId: order.order_id,
    total: order.total,
    currency: order.currency || currency,
    baseUrl: baseUrl,
    org: view.org,
    receipt: view.receipt,
    pdfBuffer: upload?.buffer
  });
  add('Send confirmation email','success','Subscriber notified');
} else {
  add('Send confirmation email','warning','No subscriber email found');
}

//----- end sending succes email ----






      await Audit.success({
        actorType:'System', actorId:null, url:req.originalUrl,
        action:'SUBS_PAYMENT_SUCCESS',
        description:`order=${order.order_id}, txn=${txnId}, amount=${amount} ${currency}`
      });

      // HTML vs JSON
      const view = await buildSubReceiptView({
        order: order.get(), plan, paymentRef: payRef, authCode: auth, currency
      });
      return wantsHtml(req)
        ? res.status(200).render('receipts/sub_confirmation', { ...view })
        : res.status(200).json({ ok:true, order_id: order.order_id, steps });
    }

    // === FAILED / CANCELLED ===
    if (isFail) {
      await order.update({
        status:'Cancelled',
        payment_status:'failed',
        transaction_id: txnId || order.transaction_id,
        payment_ref: payRef || order.payment_ref || null,
        auth_code: auth || order.auth_code || null,
        meta: newMeta
      });
      add('Mark failed','success',`Gateway status=${rawStat}`);

  
//---- payment fail email --------------------------------------
try {
  const baseUrl = getBaseUrl(req);
  const firmEmail = order?.meta?.firm_email || order?.email;
  if (firmEmail) {
    // pick message field defensively (b is your gateway response obj)
    const reason =
      b?.Message || b?.ResponseMsg || b?.ReponseMsg || b?.error || 'Payment was declined or canceled.';

    const brand = getBrand();
    await send_sub_payment_failed_email(firmEmail, {
      username: order?.meta?.firm_contact || 'Subscriber',
      orderId: order.order_id,
      total: order.total || amount,
      reason,
      portalUrl: baseUrl,
      org: brand,                                  // 👈 ensure brandbar works
      logoSrc: brand.embedLogo || brand.logoUrl    // 👈 optional but nice
    });
    add('Send failure email','success','Subscriber notified');
  } else {
    add('Send failure email','warning','No subscriber email on order');
  }
} catch (e) {
  add('Send failure email','warning', e?.message || e);
}







      await Audit.denied({
        actorType:'System', actorId:null, url:req.originalUrl,
        action:'SUBS_PAYMENT_FAILED',
        description:`order=${order.order_id}, txn=${txnId}, status=${rawStat}`
      });

      // Simple HTML “steps” page for failure
      return wantsHtml(req)
        ? res.status(200).render('partials/handle_payment_msgs', {
            title:'Payment Failed',
            subtitle:'We could not complete your subscription payment.',
            orderInfo:{ orderId:order.order_id, transactionId:txnId, amount, currency, method:'Card', payRef:payRef, authCode:auth },
            steps, redirectTo:'/'
          })
        : res.status(200).json({ ok:true, order_id: order.order_id, steps });
    }

    // === PENDING / UNKNOWN ===
    await order.update({ meta: newMeta });
    add('Payment status','warning',`Gateway: ${rawStat || 'unknown'}`);

    return wantsHtml(req)
      ? res.status(200).render('partials/handle_payment_msgs', {
          title:'Payment Update Received',
          subtitle:'We will email you once the payment is finalized.',
          orderInfo:{ orderId:order.order_id, transactionId:txnId, amount, currency, method:'Card', payRef:payRef, authCode:auth },
          steps, redirectTo:'/'
        })
      : res.status(200).json({ ok:true, order_id: order.order_id, steps });

  } catch (e) {
    steps.push({ label:'Unexpected error', status:'error', detail:e?.message || String(e) });
    await Audit.failed({
      actorType:'System', actorId:null, url:req.originalUrl,
      action:'SUBS_PAYMENT_CALLBACK_ERR',
      description: (e && e.stack) ? e.stack : String(e)
    });

    return wantsHtml(req)
      ? res.status(200).render('partials/handle_payment_msgs', {
          title:'Payment Update',
          subtitle:'An error occurred while finalizing your payment.',
          orderInfo:{ orderId:'-', transactionId:'-', amount:0, currency:'', method:'', payRef:'', authCode:'' },
          steps, redirectTo:'/'
        })
      : res.status(200).json({ ok:false, steps });
  }
};


// --- helper: save tokenized card for Subscriptions (owner = staff_id) ---
async function maybeSaveCardTokenForSubs({ order, body: b, staff_id_hint = null, add }) {

console.log('staff_id_hint--> ',staff_id_hint)

  try {
    const tok = safeTrim(b.CardToken || '');
    const pan = safeTrim((b.PaddedCardNo || '').toUpperCase()); // XXXX••••1111
    const exp = safeTrim(b.CardExpiry || '');                    // "MMYY" per Amber
    if (!tok) { add('Save card on file','warning','No token provided by gateway'); return false; }

    // 0) Decide owner (staff_id)
    let staff_id = staff_id_hint || order?.meta?.pm_staff_id || order?.staff_id || null;
    if (!staff_id) {
      // Best effort: pick any active FirmStaff of this firm (ideally Firm Admin)
      const adminish = await FirmStaff.findOne({
        where: { firm_id: order.firm_id },
        order: [
          // if you have an admin flag/role, sort by it DESC first; otherwise staff_id newest first
          ['is_firm_admin', 'DESC'], // if column exists; ignore silently if not
          ['staff_id', 'DESC']
        ]
      }).catch(() => null);
      staff_id = adminish?.staff_id || null;
    }
    if (!staff_id) { add('Save card on file','warning','No staff owner to attach card'); return false; }

    // 1) Parse card meta
    const { exp_month, exp_year } = parseExpiry(exp);
    const brand = inferBrandFromMasked(pan);
    const last4 = parseLast4(pan);

    // 2) Billing snapshot from gateway (only non-empty values will be stored)
    const billingSnapshot = {
      billing_name:    safeTrim(b.CardHolderName || null),
      bill_to_address: safeTrim(b.BillToAddress  || null),
      bill_to_city:    safeTrim(b.BillToCity     || null),
      bill_to_state:   safeTrim(b.BillToState    || null),
      bill_to_zip:     safeTrim(b.BillToZipCode  || b.BillToZipPostCode || null),
      bill_to_country: iso2(b.BillToCountry || null),
      bill_to_phone:   safeTrim(b.BillToTelephone|| null),
      bill_to_email:   safeTrim(b.BillToEmail    || null),
    };

    // 3) Strong match by token
    let pm = await PaymentMethod.findOne({
      where: { staff_id, provider:'amber', token: tok }
    });

    // 4) Soft-match by fingerprint if token rotates
    if (!pm && last4 && exp_month && exp_year) {
      pm = await PaymentMethod.findOne({
        where: { staff_id, provider:'amber', brand, last4, exp_month, exp_year },
        order: [['createdAt','DESC']]
      });
      if (pm && !pm.token) await pm.update({ token: tok });
    }

    // 5) Create/update
    if (!pm) {
      pm = await PaymentMethod.create({
        staff_id,
        provider: 'amber',
        token: tok,
        brand, last4, exp_month, exp_year,
        is_default: false,
        ...Object.fromEntries(Object.entries(billingSnapshot).filter(([,v]) => v))
      });
    } else {
      const updates = {};
      if (pm.token !== tok)           updates.token = tok;
      if (!pm.brand && brand)         updates.brand = brand;
      if (!pm.last4 && last4)         updates.last4 = last4;
      if (!pm.exp_month && exp_month) updates.exp_month = exp_month;
      if (!pm.exp_year && exp_year)   updates.exp_year = exp_year;

      for (const [k,v] of Object.entries(billingSnapshot)) {
        if (!pm[k] && v) updates[k] = v; // fill blanks only
      }
      if (Object.keys(updates).length) await pm.update(updates);
    }

    // 6) First card becomes default
    const count = await PaymentMethod.count({ where: { staff_id, provider:'amber' }});
    if (count === 1 && !pm.is_default) await pm.update({ is_default:true });

    add('Save card on file','success',
      `${brand || 'Card'} •••• ${last4 || '—'}${exp_month ? ` exp ${String(exp_month).padStart(2,'0')}/${String(exp_year).toString().slice(-2)}` : ''}`);

    // 7) Optionally store quick reference on order.meta
    try {
      await order.update({
        meta: {
          ...(order.meta || {}),
          last_saved_pm_id: pm.pm_id,
          card_brand: brand || (order.meta?.card_brand ?? null),
          card_last4: last4 || (order.meta?.card_last4 ?? null),
        }
      });
    } catch {}

    return true;

  } catch (e) {
    console.log('maybeSaveCardTokenForSubs error:', e);
    add('Save card on file','warning', e?.message || 'Could not save');
    return false;
  }
}