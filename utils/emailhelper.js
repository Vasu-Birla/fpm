import * as url from 'url';
import * as path from 'path';
import dotenv from 'dotenv';
import ejs from 'ejs';
import nodemailer from 'nodemailer';
import sequelize from "../config/sequelize.js";
import { Notification } from '../models/index.js';

import {getBrandEmailContext} from '../helper/helper.js'
import { getBrand } from '../helper/helper.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
console.log('enviourment is ==> ',envFile)
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

/* ========== Mail Transporter ========== */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
};

/* ========== Generic Email Sender ========== */
const sendEmail = async (mailOptions) => {
  // console.log(' user: process.env.SMTP_USER, --> ', process.env.SMTP_USER)
  // console.log(' pass: process.env.SMTP_PASSWORD, --> ', process.env.SMTP_PASSWORD)
  const transporter = createTransporter();
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${mailOptions.to}`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${mailOptions.to}:`, error.message);
    throw new Error('Failed to send email');
  }
};

/* ========== Email with Template ========== */

const sendTemplateEmail = async ({
  templateName,
  subject,
  to,
  data = {},
  fromAlias = 'Elaw eServices',
  attachments = [],            //  allow callers to add their own attachments (PDF receipts etc.)
  
}) => {
  try {
 
        // 1) Brand (email-safe): CID when possible, else data-URL/absolute URL
    const { org, logoSrc, attachments: brandAt } = getBrandEmailContext();

  // 2) Render template with logo variables
    const templatePath = path.join(__dirname, '../views/emails', `${templateName}.ejs`);

    // Shared variables for all templates (prevents EJS ReferenceError on optional vars)
    const supportEmail =
      process.env.SUPPORT_EMAIL ||
      process.env.SUPPORT_MAIL ||
      process.env.SMTP_USER ||
      'support@example.com';

    const html = await ejs.renderFile(templatePath, { ...data, logoSrc, org, supportEmail });
  
   
  // 3) Merge attachments: brand logo first, then caller’s (e.g., PDF)
    const finalAttachments = [...brandAt];
    if (Array.isArray(attachments) && attachments.length) finalAttachments.push(...attachments);


       const displayFrom = fromAlias || org?.name || 'Elaw eServices';

   const mailOptions = {
      from: `"${displayFrom}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      replyTo: process.env.SMTP_USER,
      html,
      attachments: finalAttachments,
    };

    return await sendEmail(mailOptions);
  } catch (err) {
    console.log('Error in Sending ===>>> ', err);
    throw err; 
  }
};


/* ========== Specialized Functions ========== */


/* ========== Common Template-based Emails ========== */
const send_otp_email = async (username, userEmail, otp) => {
  return await sendTemplateEmail({
    templateName: 'otp_email',
    subject: 'OTP for Verification (E-Law Service)',
    to: process.env.SMTP_USER,
    data: { username, email: userEmail, otp },
    fromAlias: 'E-Law Service OTP'
  });
};

const send_login_otp_email = async (username, userEmail, otp, baseUrl) => {
  console.log('skjfksdjfksdjfkdsjfkjdsf')
  return await sendTemplateEmail({
    templateName: 'login_otp_email',
    subject: 'OTP for Verification (E-Law Service)',
    to: userEmail,
    data: { username, email: userEmail, otp ,requestId:'6556' },
    fromAlias: 'E-Law Service OTP'
  });
};


// For All kind of OTPs
export const send_otp = async (username, userEmail, otp, baseUrl, purpose = 'reset_password', type = 'Admin') => {

  const MAP = {
    // ✅ Customer OTP Login (no password) / normal OTP sign-in
    login: {
      templateName: 'otp_email',
      subject: 'Your login OTP (eLaw eServices)',
      title: 'OTP Login Verification',
      line1: 'Use this One-Time Password (OTP) to sign in to your account.'
    },

       // ✅ New registration / signup verification
    register: {
      templateName: 'otp_email',
      subject: 'Verify your registration OTP (eLaw eServices)',
      title: 'Registration Verification',
      line1: 'Use this One-Time Password (OTP) to verify your registration and activate your account.'
    },


    // ✅ Password login + 2-step verification (after password)
    login_2fa: {
      templateName: 'otp_email',
      subject: 'Your 2-step verification code (eLaw eServices)',
      title: 'Two-Step Verification',
      line1: 'Use this One-Time Password (OTP) to complete your sign-in.'
    },

    // ✅ Forgot/reset password
    reset_password: {
      templateName: 'otp_email',
      subject: 'Password reset OTP (eLaw eServices)',
      title: 'Password Reset Verification',
      line1: 'Use this One-Time Password (OTP) to reset your password.'
    },

    // ✅ Optional: confirm password change while logged in
    change_password: {
      templateName: 'otp_email',
      subject: 'Confirm password change OTP (eLaw eServices)',
      title: 'Confirm Password Change',
      line1: 'Use this One-Time Password (OTP) to confirm your password change.'
    }
  };





  const cfg = MAP[purpose] || {
    templateName: 'otp_email',
    subject: 'Your verification code (eLaw eServices)',
    title: 'Verification Code',
    line1: 'Use this One-Time Password (OTP) to continue.'
  };

  return await sendTemplateEmail({
    templateName: cfg.templateName,
    subject: cfg.subject,
    to: userEmail,
    data: {
      username,
      email: userEmail,
      otp,
      purpose,
      type,
      title: cfg.title,
      line1: cfg.line1
    },
    fromAlias: 'eLaw eServices OTP'
  });
};


const send_registration_link_email = async (username, userEmail, registrationLink, clientName) => {
  return await sendTemplateEmail({
    templateName: 'registration_link_email',
    subject: 'Complete Your Registration - E-Law Service',
    to: userEmail,
    data: { username, email: userEmail, registrationLink, clientName },
    fromAlias: 'E-Law Service Registration'
  });
};

const send_password_change_email = async (username, userEmail, time) => {
  return await sendTemplateEmail({
    templateName: 'change_password_info',
    subject: 'Password Has Been Changed - E-Law Service',
    to: userEmail,
    data: { username, time },
    fromAlias: 'E-Law Service'
  });
};

const reset_pass_otp_email = async (username, userEmail, otp, baseUrl) => {
  return await sendTemplateEmail({
    templateName: 'reset_pass_otp_email',
    subject: 'OTP for Reset Password (E-Law Service)',
    to: userEmail,
    data: { username, email: userEmail, otp },
    fromAlias: 'E-Law Service OTP'
  });
};

/* ========== Notifications ========== */
export const sendCandidateNotification = async ({
  client_id = null,
  candidate_fullname,
  created_by = 'Candidate',
  email = null,
  action = 'Candidate Registered',
  method = 'GET',
  redirect_link = '/superadmin/reports',
}) => {
  try {
    const content = `${created_by} registered a new candidate${candidate_fullname ? `: ${candidate_fullname}` : ''}${email ? ` (${email})` : ''}.`;

    await Notification.create({
      client_id,
      type: 'New Registration',
      content,
      action_on_notification: redirect_link,
      request_link_email: null,
      request_method: method,
    });
  } catch (err) {
    console.error('Notification failed:', err.message);
  }
};





// utils/emailhelper.js (add this near your other exports)
export const send_broadcast_email = async ({ to, recipientName='Client', title, message, link='', logoUrl }) => {
  return await sendTemplateEmail({
    templateName: 'broadcast_email',               // views/emails/broadcast_email.ejs
    subject: `[Elaw E-Service] ${title}`.slice(0, 120),
    to,
    data: { recipientName, title, message, link, logoUrl, company: 'Elaw E-Service' },
    fromAlias: 'Elaw E-Service'
  });
};

export const send_esign_signer_email = async ({ to, subject, data }) => {
  return await sendTemplateEmail({
    templateName: 'esign_signer',
    subject,
    to,
    data,
    fromAlias: 'ELAW Signatures'
  });
};

export const send_esign_cc_email = async ({ to, subject, data }) => {
  return await sendTemplateEmail({
    templateName: 'esign_cc',
    subject,
    to,
    data,
    fromAlias: 'ELAW Signatures'
  });
};

export const send_invoice_email = async ({ to, subject = 'Invoice', data = {}, attachments = [] }) => {
  return await sendTemplateEmail({
    templateName: 'invoice_email',
    subject,
    to,
    data,
    fromAlias: 'ELAW Billing',
    attachments,
  });
};

export const send_intake_ticket_email = async ({ to, subject = 'New intake ticket submitted', data = {} }) => {
  return await sendTemplateEmail({
    templateName: 'intake_ticket_admin',
    subject,
    to,
    data,
    fromAlias: 'ELaw Intake'
  });
};




//----------- Project Level Emails  ------------------------



// Small helper so "JMD" shows as "J$"
const currencyLabel = (code) => (String(code || 'JMD').toUpperCase() === 'JMD' ? 'J$' : String(code || '').toUpperCase());

// ── Subscription: payment success ──────────────────────────────────────────────
export const send_sub_payment_success_email = async (
  to,
  { username, orderId, total, currency = 'JMD', baseUrl = '', org = {}, receipt = {}, pdfBuffer }
) => {
  const attachments = [];
  if (pdfBuffer) {
    const safeNo = String(receipt?.receiptNo || orderId || 'receipt').replace(/[^\w.-]+/g, '_');
    attachments.push({
      filename: `Subscription_Receipt_${safeNo}.pdf`,
      content: pdfBuffer
    });
  }

  // Derive a direct PDF link if you stored one (e.g., "receipts/sub_17_xxx.pdf")
  const pdfLink = receipt?.pdfKey ? `${baseUrl.replace(/\/+$/,'')}/${String(receipt.pdfKey).replace(/^\/+/, '')}` : null;

  return await sendTemplateEmail({
    templateName: 'payment_success',                // views/emails/payment_success.ejs
    subject: `Subscription Payment Successful - Order #${orderId}`,
    to,
    fromAlias: 'ELaw Subscriptions',
    attachments,
    data: {
      username: username || 'Subscriber',
      orderId,
      total,
      currencyLabel: currencyLabel(currency),
      baseUrl,
      org: {
        name: org?.name || 'ELaw',
        logoUrl: org?.logoUrl || '/assets/img/logo.png'
      },
      receipt: {
        receiptNo:   receipt?.receiptNo   || orderId,
        firmName:    receipt?.firmName    || '',
        planName:    receipt?.planName    || '',
        billingPeriod: receipt?.billingPeriod || '',
        paymentRef:  receipt?.paymentRef  || '',
        transactionId: receipt?.transactionId || '',
        paidAt:      receipt?.paidAt      || '',
        amountFmt:   receipt?.amountFmt   || (total != null ? `${currencyLabel(currency)} ${Number(total || 0).toFixed(2)}` : ''),
        pdfLink
      }
    }
  });
};

// ── Subscription: payment failed ───────────────────────────────────────────────
export const send_sub_payment_failed_email = async (
  to,
  { username, orderId, total, reason, portalUrl = '' }
) => {
  return await sendTemplateEmail({
    templateName: 'payment_failed',                 // views/emails/payment_failed.ejs
    subject: `Subscription Payment Failed - Order #${orderId}`,
    to,
    fromAlias: 'ELaw Subscriptions',
    data: {
      username: username || 'Subscriber',
      orderId,
      totalFmt: (total != null ? Number(total).toFixed(2) : ''),
      reason: reason || 'Your payment could not be completed.',
      portalUrl
    }
  });
};




/* ========== Exports ========== */
export {

  send_otp_email,
  send_login_otp_email,
  send_registration_link_email,
  send_password_change_email,
  reset_pass_otp_email
};
