
import sequelize from "../config/sequelize.js";
import * as url from 'url';
import * as path from 'path';


import fs from 'node:fs';
import fsp from 'node:fs/promises';
import readline from 'node:readline';

import * as crypto from 'node:crypto';

import os from 'os';
import moment from 'moment-timezone';
import ejs from "ejs";

import { Op, col ,Sequelize, fn ,literal ,Transaction  } from 'sequelize';
import jwt from 'jsonwebtoken';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

//=========== Common Import ================

import puppeteer from 'puppeteer';
import { kilError  } from '../utils/kilError.js';

//------ import utils-----------


import {cookieOptions, sendTokenAdminBrowser ,sendTokenFirmStaffBrowser } from "../utils/jwtToken.js";
import { violatesHistory, updatePasswordWithHistory, getModelsByType } from '../utils/passwordPolicy.js';
import { extractEmailsFromBuffer } from '../utils/excelcsvimporter.js'
import { flashSet ,flashPop } from '../utils/flash.js';
import { kilerrors ,fullErrorString } from '../utils/kilerrors.js';
import { Audit } from '../utils/auditLogger.js';

import { createOtp, verifyOtp ,verifyOtp_strict } from '../utils/otpService.js';


import {  
  send_login_otp_email,
  send_registration_link_email,
  send_password_change_email,
  reset_pass_otp_email ,
  send_esign_signer_email,
  send_esign_cc_email
} from "../utils/emailhelper.js";

//------ end import utils-----------



import { hashPassword, comparePassword , decrypt64 ,slugify, isAjax ,parsePracticeAreaIds} from "../helper/helper.js";


import { rsaDecryptBase64 } from '../utils/rsa.js';


import { ClientAccount, FirmClient, Admin ,FAQ, TandC,PandP, 
  Slider, AdminSettings, OTP, Role,
  AssignedClient , Token ,Notification , AuditLog 
 ,AdminPasswordHistory ,Calendar, ServiceLocation ,

LawFirm, 
 PracticeArea,
PracticeAreaAlias,
LawFirmPracticeArea,
FirmStaffPracticeArea,
CasePracticeArea,
FirmStaff,
OtpCode,ActiveSessionFirmStaff,

 FirmRole, FirmRolePermission , LoginAttemptFirmStaff ,

 Plan,FirmSubscription,PaymentMethod,SubOrder ,
 Case ,CaseParticipant, Document, ResearchLog , CourtFiling, Evidence, ESignEnvelope
 , ESignRecipient ,  CaseClaim, CaseCPRDeadline,              
  FirmLimitationConfig       } from "../models/index.js";







import { addClientService ,updateClientService } from '../helper/commonService.js';

//import moment from 'moment'; // for relative time display like '5 minutes ago'




import { RecaptchaEnterpriseServiceClient } from "@google-cloud/recaptcha-enterprise";

const projectID = "flash-rock-455113-u5"; // Replace with your actual Google Cloud Project ID
const recaptchaClient = new RecaptchaEnterpriseServiceClient();


import { PutObjectCommand } from '@aws-sdk/client-s3'; // already done in your S3 file
import { s3 } from '../middleware/s3bucketuploader_V3.js';

import { pipeline } from 'stream';
import { promisify } from 'util';

import xlsx from 'xlsx';

import { addLawFirmService } from '../helper/lawFirmService.js';


import { deleteS3Object } from '../utils/s3helpers.js'; // adjust path




import {
  buildFirmLimitationView,
  buildCaseClaimsView,
  findClaimMeta,
  computeDeadlineForClaim,
} from '../utils/limitations.js';

import {
  buildCaseCPRDeadlines,
  computeCPRStatus,
  computeDueDate,
  listBaseDateKeys,
} from '../utils/cpr_timelines.js';

import { getCPRTimelinesCatalogue } from '../scripts/cpr_jm_timelines.js';


//======================== Global Funcitons =======================//




function getServerIp() {
  const ifaces = os.networkInterfaces();
  for (const iface of Object.values(ifaces)) {
    for (const details of iface) {
      if (details.family === 'IPv4' && !details.internal) {
        return details.address; // returns the first non-internal IPv4
      }
    }
  }
  return '127.0.0.1'; // fallback
}


function generateRandomId() {
  const randomPart = Math.floor(100000 + Math.random() * 900000); // 6-digit random
  const timestampPart = Date.now().toString().slice(-4); // last 4 digits of timestamp
  return parseInt(`${randomPart}${timestampPart}`);
}


function mask_value(str, maskChar = '*') {
  if (str == null) return '';
  str = String(str);
  const len = str.length;
  if (len === 0) return '';
  if (len === 1) return maskChar;
  if (len === 2) return str[0] + maskChar;
  if (len <= 4) return str[0] + maskChar.repeat(len - 2) + str[len - 1];
  // For emails, keep domain visible
  if (str.includes('@')) {
    const at = str.indexOf('@');
    if (at <= 2) return maskChar.repeat(at) + str.substring(at);
    return str[0] + maskChar.repeat(at - 2) + str[at - 1] + str.substring(at);
  }
  // For other strings: 2 start, 2 end
  return str.slice(0, 2) + maskChar.repeat(len - 4) + str.slice(-2);
}





export function deriveActor(req) {
  const staff = req.firmstaff || {};
  const role = staff.role || null;

  let actorType = 'staff'; // default

  if (role) {
    const rn = (role.name || '').toLowerCase();
    actorType =
      role.is_system && rn === 'firmadmin'
        ? 'firmadmin'
        : 'staff';
  }

  return {
    actorType,
    actorId: staff.staff_id ?? null,
    actorEmail: staff.email || null,
    actorFirmId: staff.firm_id ?? null,
    actorRoleId: role?.firm_role_id ?? null,
    actorRoleName: role?.name ?? null,
  };
}





//======================== Global Functions =======================//



//===================== START ========================================================



export const manage_case = async (req, res) => {
  const output = flashPop(req, res, 'elaw_msg');
  const actor  = deriveActor(req);

  try {
    const firm_id = req.firmstaff?.firm_id || null;
    if (!firm_id) {
      return res.render('errors/error403', { output: 'Firm context missing.' });
    }

    const firm = actor.firm || null;

    const cookieCaseId = Number(req.cookies?.elaw_caseId || 0) || 0;
    const queryCaseId  = Number(req.query?.case_id || 0) || 0;
    const case_id      = cookieCaseId || queryCaseId;

    if (!case_id) {
      req.flash('elaw_msg', {
        type: 'warning',
        message: 'No case selected. Please choose a case from the list.',
      });
      return res.redirect('/firmstaff/case_list');
    }

    // 1) Load case with primary client + participants (FirmStaff only for now)
    const kaseRow = await Case.findOne({
      where: { case_id, firm_id },
      include: [
        {
          model: FirmClient,
          as: 'primary_client',
          attributes: ['client_id', 'firm_id'],
          include: [{
            model: ClientAccount,
            as: 'account',
            attributes: [
              'type',
              'business_name',
              'first_name',
              'last_name',
              'country_code',
              'contact',
              'email',
            ],
          }],
        },
        {
          model: PracticeArea,
          as: 'practiceAreas',
          through: { attributes: ['is_primary'] }, // CasePracticeArea
        },
        {
          model: sequelize.models.CaseParticipant,
          as: 'participants',
          include: [
            {
              model: sequelize.models.FirmStaff,
              as: 'staff',
              attributes: ['staff_id','first_name','last_name','email','country_code','contact'],
            },
          ],
        },
      ],
    });

    if (!kaseRow) {
      req.flash('elaw_msg', {
        type: 'warning',
        message: 'Case not found or not in your firm.',
      });
      return res.redirect('/firmstaff/case_list');
    }

    const kase = kaseRow.get({ plain: true });
    if (kase.primary_client?.account) {
      kase.primary_client = {
        client_id: kase.primary_client.client_id,
        firm_id: kase.primary_client.firm_id,
        ...kase.primary_client.account,
      };
    }

    // Load general documents for this case
const generalDocsRows = await Document.findAll({
  where: { case_id, kind: 'general' },
  order: [['created_at', 'ASC']],
});
const generalDocs = generalDocsRows.map(d => d.get({ plain: true }));

    // 2) Practice areas (case type dropdown) – for now load all active
    const practiceAreas = await PracticeArea.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']],
    });
    const practiceAreasPlain = practiceAreas.map(pa => pa.get({ plain: true }));



        // ---- Limitation catalogue view for this case ----
    // For now we assume Jamaica (JM). Later we can map from firm or case jurisdiction.
    const primaryPAId =
      kase.practiceAreas && kase.practiceAreas.length
        ? kase.practiceAreas[0].practice_area_id
        : null;

    let limitationView = null;
    try {
      limitationView = await buildFirmLimitationView({
        firm_id,
        jurisdiction: 'JM',          // 🔹 for now – your catalogue is JM-only
        practice_area_id: primaryPAId,
        includeDisabled: false,      // show only enabled ones
      });
    } catch (e) {
      console.error('buildFirmLimitationView error', e);
      limitationView = null;
    }


        let caseClaimsView = [];
    try {
      caseClaimsView = await buildCaseClaimsView({
        firm_id,
        case_id,
        jurisdiction: 'JM',
      });
    } catch (e) {
      console.error('buildCaseClaimsView error', e);
    }




    // 3) All staff in this firm (for assignment dropdowns)
    const firmStaffRows = await FirmStaff.findAll({
      where: { firm_id, status: 'Active' },
      order: [['first_name','ASC'], ['last_name','ASC']],
    });
    const firmStaff = firmStaffRows.map(s => s.get({ plain: true }));


    // 4) Build role → [staff_id, staff_id, ...] for multi-select
const participantByRole = {};
(kase.participants || []).forEach(p => {
  if (p.participant_type === 'FirmStaff' && p.role_in_case) {
    // support both naming styles if your model has `staff_id` or `firm_staff_id`
    const sid = p.staff_id ?? p.firm_staff_id;
    if (!sid) return;

    if (!participantByRole[p.role_in_case]) {
      participantByRole[p.role_in_case] = [];
    }
    participantByRole[p.role_in_case].push(sid);
  }
});



//5.   Load research logs (with their research docs)
    const researchRows = await ResearchLog.findAll({
      where: { case_id },
      include: [
        {
          model: Document,
          as: 'documents',
          required: false,
          where: { kind: 'research' },
        },
        {
          model: FirmStaff,
          as: 'created_by_staff',
          required: false,
          attributes: ['staff_id', 'first_name', 'last_name', 'email'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
    const researchLogs = researchRows.map(r => r.get({ plain: true }));




    //6. Court filings (tracker)
    const filingRows = await CourtFiling.findAll({
      where: { case_id, firm_id },
      include: [
        {
          model: FirmStaff,
          as: 'created_by_staff',
          required: false,
          attributes: ['staff_id', 'first_name', 'last_name', 'email'],
        },
      ],
      order: [
        ['filing_date', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });
    const courtFilings = filingRows.map(f => f.get({ plain: true }));

    //7. Evidence (with documents)
    const evidenceRows = await Evidence.findAll({
      where: { case_id, firm_id },
      include: [
        {
          model: Document,
          as: 'documents',
          required: false,
          where: { kind: 'evidence' },
        },
        {
          model: FirmStaff,
          as: 'created_by_staff',
          required: false,
          attributes: ['staff_id', 'first_name', 'last_name', 'email'],
        },
      ],
      order: [['date_collected', 'DESC'], ['created_at', 'DESC']],
    });
    const evidences = evidenceRows.map(e => e.get({ plain: true }));

    //8. Case options for dropdown (firm scope)
    const firmCaseRows = await Case.findAll({
      where: { firm_id },
      attributes: ['case_id', 'case_number', 'title', 'opened_at'],
      order: [['opened_at', 'DESC']],
    });
    const firmCaseOptions = firmCaseRows.map(c => c.get({ plain: true }));

    //9. Drafting documents for this case (kinds except research)
    const draftingAllowedKinds = ['general', 'research', 'evidence', 'contract', 'pleading', 'order', 'other'];
    const draftingRows = await Document.findAll({
      where: { case_id, kind: draftingAllowedKinds },
      include: [
        {
          model: FirmStaff,
          attributes: ['staff_id', 'first_name', 'last_name', 'email'],
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
    });
    const draftingDocs = draftingRows.map(d => d.get({ plain: true }));

    //10. E-Sign envelopes (for documents in this case)
    const envelopeRows = await ESignEnvelope.findAll({
      include: [
        {
          model: Document,
          required: true,
          where: { case_id },
        },
        {
          model: FirmStaff,
          as: 'sender',
          attributes: ['staff_id', 'first_name', 'last_name', 'email'],
          required: false,
        },
        {
          model: ESignRecipient,
          as: 'recipients',
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    const esignEnvelopes = envelopeRows.map(e => e.get({ plain: true }));

    //11. Build E-sign recipient options (case team + primary client)
    const caseParticipants = kase.participants || [];
    const esignFirmRecipients = caseParticipants
      .filter(p => p.staff)
      .map(p => ({
        staff_id: p.staff.staff_id,
        name: `${p.staff.first_name || ''} ${p.staff.last_name || ''}`.trim(),
        email: p.staff.email,
      }))
      .filter(r => r.email);

    const esignClientRecipient = kase.primary_client
      ? {
          client_id: kase.primary_client.client_id,
          name: kase.primary_client.business_name || `${kase.primary_client.first_name || ''} ${kase.primary_client.last_name || ''}`.trim(),
          email: kase.primary_client.email,
        }
      : null;


    // console.log('kase',kase)

      console.log('researchLogs',researchLogs)

    
    return res.render('firmstaff/manage_case', {
      output,
      firm,
      caseData: kase,
      practiceAreas: practiceAreasPlain,
      firmStaff,
      participantByRole,
      generalDocs, 
      researchLogs,
      courtFilings,
      draftingDocs,
      firmCaseOptions,
      evidences,
      esignEnvelopes,
      esignFirmRecipients,
      esignClientRecipient,
      limitationView,
      caseClaimsView,
      caseClaims: caseClaimsView


      // csrfToken: req.csrfToken(),
    });

  } catch (error) {
    console.error('manage_case error', error);
    return res.render('errors/error500', {
      output: `Internal Server: ${kilError(error)}`,
    });
  }
};


//========== START TAB 1 CASE ====================



const arrifyIds = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .map(v => Number(v))
      .filter(v => Number.isFinite(v) && v > 0);
  }
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? [n] : [];
};

export const update_case_basic = async (req, res) => {
  console.log('update_case_basic body =>', req.body);

  const actor = deriveActor(req);
  console.log('actor', actor);
  const actorStaffId = req.firmstaff?.staff_id || actor.actorId || null;
  let tx;

  try {
    const firm_id = req.firmstaff?.firm_id || null;
    const caseId  = Number(
      req.params.case_id ||
      req.params.caseId   ||
      req.body.case_id    ||
      0
    ) || 0;

    if (!firm_id || !caseId) {
      console.log('update_case_basic invalid context', { firm_id, caseId });
      return res.status(400).json({
        success: false,
        message: 'Invalid firm or case.',
      });
    }

    const {
      case_type_practice_area_id,
      jurisdiction,
      priority,
      assigned_lawyer_ids,
      assigned_paralegal_ids,
      assigned_finance_ids,
      assigned_intake_ids,
      case_description,
      document_title,  // string or array
      case_claims_json,
    } = req.body || {};

    const filesBag = req.files || {};
    const docFiles = Array.isArray(filesBag.documents)
      ? filesBag.documents
      : filesBag.documents
        ? [filesBag.documents]
        : [];

    // Parse incoming limitation claims (from Tab 1 form, Add More rows)
    let incomingClaims = [];
    if (case_claims_json) {
      try {
        const parsed = JSON.parse(case_claims_json);
        if (Array.isArray(parsed)) {
          incomingClaims = parsed
            .map(item => ({
              claim_key: (item?.claim_key || '').trim(),
              trigger_date: item?.trigger_date || '',
              notes: (item?.notes || '').trim() || null,
              is_primary: item?.is_primary === true ||
                          item?.is_primary === 'true' ||
                          item?.is_primary === 'on',
            }))
            .filter(item => item.claim_key && item.trigger_date);
        }
      } catch (err) {
        console.warn('Invalid case_claims_json payload, ignoring', err);
      }
    }

    tx = await sequelize.transaction();

    // 1) Load and lock case
    const c = await Case.findOne({
      where: { case_id: caseId, firm_id },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!c) {
      await tx.rollback();
      return res.status(404).json({
        success: false,
        message: 'Case not found.',
      });
    }

    // 2) Update basic fields
    const descTrimmed = (case_description ?? '').trim();

    await c.update(
      {
        jurisdiction: jurisdiction || null,
        priority:     priority || 'Normal',
        description:  descTrimmed || null,
      },
      { transaction: tx }
    );

    // 3) Practice Area
    let practiceAreaName = null;
    const paId = Number(case_type_practice_area_id || 0) || null;
    if (paId) {
      await CasePracticeArea.destroy({
        where: { case_id: caseId },
        force: true,
        transaction: tx,
      });

      await CasePracticeArea.create(
        {
          case_id:          caseId,
          practice_area_id: paId,
          is_primary:       true,
        },
        { transaction: tx }
      );

      const pa = await PracticeArea.findByPk(paId, { transaction: tx });
      practiceAreaName = pa?.name || null;
    }

    // 4) Role-wise staff
    const desiredByRole = {
      LeadLawyer: arrifyIds(assigned_lawyer_ids),
      Paralegal:  arrifyIds(assigned_paralegal_ids),
      Finance:    arrifyIds(assigned_finance_ids),
      Intake:     arrifyIds(assigned_intake_ids),
    };

    console.log('desiredByRole =>', desiredByRole);

    const roleKeys = Object.keys(desiredByRole);

    const existing = await CaseParticipant.findAll({
      where: {
        case_id:         caseId,
        participant_type:'FirmStaff',
        role_in_case:    roleKeys,
      },
      transaction: tx,
    });

    const existingByRole = {};
    for (const p of existing) {
      const r   = p.role_in_case;
      const sid = p.staff_id ?? p.firm_staff_id;
      if (!sid) continue;
      if (!existingByRole[r]) existingByRole[r] = new Map();
      existingByRole[r].set(sid, p);
    }

    // add missing
    for (const role of roleKeys) {
      const desiredIds = desiredByRole[role];
      const roleMap    = existingByRole[role] || new Map();

      for (const sid of desiredIds) {
        if (!roleMap.has(sid)) {
          await CaseParticipant.create(
            {
              case_id:         caseId,
              participant_type:'FirmStaff',
              firm_staff_id:   sid,
              role_in_case:    role,
            },
            { transaction: tx }
          );
        }
      }
    }

    // remove extras
    for (const p of existing) {
      const role = p.role_in_case;
      const sid  = p.staff_id ?? p.firm_staff_id;
      if (!sid) continue;

      const desiredIds = desiredByRole[role] || [];
      if (!desiredIds.includes(sid)) {
        await p.destroy({ transaction: tx });
      }
    }

    // 5) Save GENERAL documents
    if (docFiles && docFiles.length > 0) {
      const titlesRaw = document_title || [];
      const titlesArr = Array.isArray(titlesRaw) ? titlesRaw : [titlesRaw];

      const uploaderId = actorStaffId;

      for (let i = 0; i < docFiles.length; i++) {
        const f = docFiles[i];

        const title =
          (titlesArr[i] || f.originalname || 'General Document')
            .toString()
            .trim() || 'General Document';

        const checksum = f.buffer
          ? crypto.createHash('sha256').update(f.buffer).digest('hex')
          : null;

        await Document.create(
          {
            case_id:         caseId,
            title,
            kind:            'general',   // 👈 BASIC TAB = general
            s3_key:          f.s3Key,
            mime_type:       f.mimetype,
            size_bytes:      f.size,
            uploaded_by:     uploaderId,
            checksum_sha256: checksum,
          },
          { transaction: tx }
        );
      }
    }

    // 6) Create case-level limitation claims (optional, inline on save)
    if (incomingClaims.length > 0) {
      // Always prefer the JM catalogue (client-provided), only fall back to the case jurisdiction if JM is missing the key
      const defaultJurisdiction   = 'JM';
      const caseJurisdiction      = c.jurisdiction || null;
      const practiceAreaIdForClaims = paId || null;

      const hasPrimaryIncoming = incomingClaims.some(ic => ic.is_primary);
      if (hasPrimaryIncoming) {
        await CaseClaim.update(
          { is_primary: false },
          {
            where: { firm_id, case_id: caseId },
            transaction: tx,
          }
        );
      }

      let primaryAssigned = false;
      for (const claimPayload of incomingClaims) {
        let claimJurisdiction = defaultJurisdiction;
        let claimMeta = findClaimMeta(defaultJurisdiction, claimPayload.claim_key);

        // If not found in the JM catalogue, try the case's own jurisdiction as a fallback
        if (!claimMeta && caseJurisdiction && caseJurisdiction !== defaultJurisdiction) {
          claimMeta = findClaimMeta(caseJurisdiction, claimPayload.claim_key);
          if (claimMeta) claimJurisdiction = caseJurisdiction;
        }

        if (!claimMeta) {
          await tx.rollback();
          return res.status(400).json({
            success: false,
            message: `Unknown limitation claim type: ${claimPayload.claim_key}`,
          });
        }

        const { deadline, status } = computeDeadlineForClaim({
          trigger_date: claimPayload.trigger_date,
          claimMeta,
        });

        const makePrimary = claimPayload.is_primary && !primaryAssigned;
        if (makePrimary) primaryAssigned = true;

        await CaseClaim.create(
          {
            firm_id,
            case_id: caseId,
            jurisdiction: claimJurisdiction,
            claim_key: claimPayload.claim_key,
            practice_area_id: practiceAreaIdForClaims,
            is_primary: makePrimary,
            trigger_date: claimPayload.trigger_date,
            limitation_deadline: deadline,
            status,
            notes: claimPayload.notes,
            created_by_staff_id: actorStaffId,
          },
          { transaction: tx }
        );
      }
    }

    // 6) Sync AssignedClient (optional, as before)
    if (c.primary_client_id) {
      const primaryClientId = c.primary_client_id;

      const allSelectedStaffIds = [
        ...desiredByRole.LeadLawyer,
        ...desiredByRole.Paralegal,
        ...desiredByRole.Finance,
        ...desiredByRole.Intake,
      ];
      const uniqueStaffIds = [...new Set(allSelectedStaffIds)];

      if (uniqueStaffIds.length > 0) {
        const existingAssignments = await AssignedClient.findAll({
          where: {
            client_id: primaryClientId,
            staff_id:  uniqueStaffIds,
          },
          transaction: tx,
        });

        const existingStaffSet = new Set(
          existingAssignments.map(a => a.staff_id)
        );

        for (const sid of uniqueStaffIds) {
          if (!existingStaffSet.has(sid)) {
            await AssignedClient.create(
              {
                client_id:            primaryClientId,
                staff_id:             sid,
                assigned_at:          new Date(),
                assigned_by_staff_id: actor.actorId || null,
                note: `Auto-linked from case #${c.case_number || c.case_id}`,
              },
              { transaction: tx }
            );
          }
        }
      }
    }

    await tx.commit();

    // 7) Fetch fresh general docs to update table
    const docs = await Document.findAll({
      where: { case_id: caseId, kind: 'general' },
      order: [['created_at', 'ASC']],
    });

    // 8) Fetch updated case limitation claims (only if we added any; cheap enough)
    let claims = null;
    if (incomingClaims.length > 0) {
      claims = await buildCaseClaimsView({
        firm_id,
        case_id: caseId,
        jurisdiction: null, // fetch claims across all jurisdictions so snapshot stays in sync
      });
    }

    return res.json({
      success: true,
      message: 'Case updated successfully.',
      snapshot: {
        jurisdiction: c.jurisdiction,
        priority:     c.priority,
        description:  c.description,
        practice_area_name: practiceAreaName, // may be null if not changed
      },
      documents: docs,
      claims,
    });
  } catch (err) {
    console.error('update_case_basic error', err);
    if (tx) {
      try { await tx.rollback(); } catch (rbErr) {
        console.error('update_case_basic rollback error', rbErr);
      }
    }
    return res.status(500).json({
      success: false,
      message: kilError(err),
    });
  }
};





export const delete_case_document = async (req, res) => {
  const actor     = deriveActor(req);
  const actorType = actor.actorType || 'FirmStaff';
  const actorId   = actor.actorId   || req.firmstaff?.staff_id || null;

  let tx;

  try {
    const firm_id = req.firmstaff?.firm_id || null;
    const caseId  = Number(req.params.case_id     || 0) || 0;
    const docId   = Number(req.params.document_id || 0) || 0;

    if (!firm_id || !caseId || !docId) {
      await Audit.denied?.({
        actorType,
        actorId,
        action: 'CASE_DOCUMENT_DELETE_DENIED',
        description: `Invalid firm/case/doc in request. firm_id=${firm_id}, caseId=${caseId}, docId=${docId}`
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid firm, case or document.',
      });
    }

    tx = await sequelize.transaction();

    // 1) Ensure case belongs to firm
    const c = await Case.findOne({
      where: { case_id: caseId, firm_id },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!c) {
      await tx.rollback();
      await Audit.denied?.({
        actorType,
        actorId,
        action: 'CASE_DOCUMENT_DELETE_DENIED',
        description: `Case #${caseId} not found in firm #${firm_id}`
      });

      return res.status(404).json({
        success: false,
        message: 'Case not found.',
      });
    }

    // 2) Load document (only kind = general)
    const doc = await Document.findOne({
      where: {
        document_id: docId,
        case_id:     caseId,
        kind:        'general',
      },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
      paranoid: true,
    });

    if (!doc) {
      await tx.rollback();
      await Audit.denied?.({
        actorType,
        actorId,
        action: 'CASE_DOCUMENT_DELETE_DENIED',
        description: `Document #${docId} not found in case #${caseId}`
      });

      return res.status(404).json({
        success: false,
        message: 'Document not found for this case.',
      });
    }

    const docPlain = doc.get({ plain: true });
    const s3Key    = docPlain.s3_key;

    // 3) Try to delete from S3 FIRST. If this fails -> rollback & DO NOT delete DB row
    if (s3Key) {
      try {
        await deleteS3Object({ key: s3Key });
      } catch (s3err) {
        console.error('S3 delete failed, rolling back document delete', s3err);

        if (!tx.finished) {
          await tx.rollback();
        }

        const rawMsg = String(s3err?.message || s3err);
        const isAccessDenied =
          s3err?.Code === 'AccessDenied' || /AccessDenied/i.test(rawMsg);

        const userMsg = isAccessDenied
          ? 'Storage permission error while deleting the file (S3 AccessDenied). Please contact your system administrator.'
          : 'Could not delete document file from storage. Please contact your administrator.';

        await Audit.failed?.({
          actorType,
          actorId,
          action: 'CASE_DOCUMENT_DELETE_STORAGE_ERROR',
          description: `Failed to delete S3 object for document #${docId} in case #${caseId}: ${rawMsg}`,
        });

        return res.status(500).json({
          success: false,
          message: userMsg,
        });
      }
    }

    // 4) HARD delete the document row (ONLY executed if S3 delete succeeded / no key)
    await doc.destroy({
      transaction: tx,
      force: true,
    });

    await tx.commit();

    // 5) Audit success
    await Audit.success?.({
      actorType,
      actorId,
      action: 'CASE_DOCUMENT_DELETED',
      description: `Document #${docPlain.document_id} (“${docPlain.title || 'Untitled'}”) deleted from case #${caseId} in firm #${firm_id}. S3 key: ${s3Key || 'none'}`,
    });

    // 6) Return remaining docs (non-deleted only)
    const docs = await Document.findAll({
      where: { case_id: caseId, kind: 'general' },
      order: [['created_at', 'ASC']],
      paranoid: true,
    });

    return res.json({
      success: true,
      message: 'Document permanently deleted from case & storage.',
      documents: docs,
    });
  } catch (err) {
    console.error('delete_case_document error', err);

    try {
      if (tx && !tx.finished) await tx.rollback();
    } catch (rbErr) {
      console.error('delete_case_document rollback error', rbErr);
    }

    await Audit.failed?.({
      actorType,
      actorId,
      action: 'CASE_DOCUMENT_DELETE_ERROR',
      description: String(err?.message || err),
    });

    return res.status(500).json({
      success: false,
      message: kilError(err),
    });
  }
};







function addYearsToDate(dateStr, years) {
  if (!dateStr || !years) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  d.setFullYear(d.getFullYear() + years);
  // to YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}




//========== CASE-LEVEL LIMITATION CLAIMS ====================


export const delete_case_claim = async (req, res) => {
  const actor = deriveActor(req);
  let tx;

  try {
    const firm_id      = req.firmstaff?.firm_id || null;
    const caseId       = Number(req.params.case_id || 0) || 0;
    const caseClaimId  = Number(req.params.case_claim_id || 0) || 0;

    if (!firm_id || !caseId || !caseClaimId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid firm, case or claim.',
      });
    }

    tx = await sequelize.transaction();

    // ensure claim belongs to firm+case
    const cc = await CaseClaim.findOne({
      where: { case_claim_id: caseClaimId, case_id: caseId, firm_id },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!cc) {
      await tx.rollback();
      return res.status(404).json({
        success: false,
        message: 'Case claim not found.',
      });
    }

    const jurisdiction = cc.jurisdiction || 'JM';

    await cc.destroy({ transaction: tx, force: true });

    await tx.commit();

    const caseClaimsView = await buildCaseClaimsView({
      firm_id,
      case_id: caseId,
      jurisdiction,
    });

    return res.json({
      success: true,
      message: 'Case claim deleted.',
      claims: caseClaimsView,
    });
  } catch (err) {
    console.error('delete_case_claim error', err);
    if (tx) {
      try { await tx.rollback(); } catch (rbErr) {
        console.error('delete_case_claim rollback error', rbErr);
      }
    }
    return res.status(500).json({
      success: false,
      message: kilError(err),
    });
  }
};





//========== END TAB1 CASE ===================



//=================== START TAB 2  Research Log ===========================




export const create_research_log = async (req, res) => {
  const actor = deriveActor(req);

  console.log('fxxxxxx -->>> ',req.body)
  let tx;

  try {
    const firm_id = req.firmstaff?.firm_id || null;
    const caseId  = Number(
      req.params.case_id ||
      req.body.case_id   ||
      0
    ) || 0;

    if (!firm_id || !caseId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid firm or case.',
      });
    }

    const {
      research_title,
      case_citation,
      statute_reference,
      summary,
      // optional: we keep doc titles
      document_title,
    } = req.body || {};

    if (!research_title || !research_title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Research title is required.',
      });
    }

    // Files bag
    const filesBag = req.files || {};
    const docFiles = Array.isArray(filesBag.documents)
      ? filesBag.documents
      : filesBag.documents
        ? [filesBag.documents]
        : [];

    tx = await sequelize.transaction();

    // 1) Lock + validate case
    const c = await Case.findOne({
      where: { case_id: caseId, firm_id },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!c) {
      await tx.rollback();
      return res.status(404).json({
        success: false,
        message: 'Case not found.',
      });
    }

    // 2) Create ResearchLog row
const rl = await ResearchLog.create(
  {
    case_id: caseId,
    research_title: research_title.trim(),   // ✅ correct field name
    case_citation: (case_citation || '').trim() || null,
    statute_reference: (statute_reference || '').trim() || null,
    summary: (summary || '').trim() || null,
    created_by_staff_id: actor.actorId || req.firmstaff?.staff_id || null,
  },
  { transaction: tx }
);


    // 3) Attach research documents (kind = 'research')
    if (docFiles.length > 0) {
      const titlesRaw = document_title || [];
      const titlesArr = Array.isArray(titlesRaw) ? titlesRaw : [titlesRaw];

      const uploaderId = req.firmstaff?.staff_id || actor.actorId || null;

      for (let i = 0; i < docFiles.length; i++) {
        const f = docFiles[i];

        const title =
          (titlesArr[i] || f.originalname || 'Research Document')
            .toString()
            .trim() || 'Research Document';

        const checksum = f.buffer
          ? crypto.createHash('sha256').update(f.buffer).digest('hex')
          : null;

        await Document.create(
          {
            case_id:         caseId,
            research_id:     rl.research_id,
            title,
            kind:            'research',
            s3_key:          f.s3Key,
            mime_type:       f.mimetype,
            size_bytes:      f.size,
            uploaded_by:     uploaderId,
            checksum_sha256: checksum,
          },
          { transaction: tx }
        );
      }
    }

    await tx.commit();

    // 4) Reload all research logs for this case (to refresh table)
    const researchRows = await ResearchLog.findAll({
      where: { case_id: caseId },
      include: [
        {
          model: Document,
          as: 'documents',
          required: false,
          where: { kind: 'research' },
        },
        {
          model: FirmStaff,
          as: 'created_by_staff',
          required: false,
          attributes: ['staff_id', 'first_name', 'last_name', 'email'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    const researchLogs = researchRows.map(r => r.get({ plain: true }));

    return res.json({
      success: true,
      message: 'Research log saved successfully.',
      researchLogs,
    });
  } catch (err) {
    console.error('create_research_log error', err);
    if (tx) {
      try { await tx.rollback(); } catch (rbErr) {
        console.error('create_research_log rollback error', rbErr);
      }
    }
    return res.status(500).json({
      success: false,
      message: kilError(err),
    });
  }
};



export const delete_research_log = async (req, res) => {
  const actor = deriveActor(req);
  const actorId = actor.actorId || req.firmstaff?.staff_id || null;
  let tx;

  try {
    const firm_id    = req.firmstaff?.firm_id || null;
    const caseId     = Number(req.params.case_id || 0) || 0;
    const researchId = Number(req.params.research_id || 0) || 0;

    if (!firm_id || !caseId || !researchId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid firm/case/research id.',
      });
    }

    tx = await sequelize.transaction();

    // 1) Ensure case belongs to firm
    const c = await Case.findOne({
      where: { case_id: caseId, firm_id },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!c) {
      await tx.rollback();
      return res.status(404).json({
        success: false,
        message: 'Case not found.',
      });
    }

    // 2) Load research log + its research documents
    const rl = await ResearchLog.findOne({
      where: { research_id: researchId, case_id: caseId },
      include: [
        {
          model: Document,
          as: 'documents',
          required: false,
          where: { kind: 'research' },
          paranoid: true,
        },
      ],
      transaction: tx,
      lock: tx.LOCK.UPDATE,
      paranoid: true,
    });

    if (!rl) {
      await tx.rollback();
      return res.status(404).json({
        success: false,
        message: 'Research log not found.',
      });
    }

    const docs = rl.documents || [];

    // 3) Delete S3 files first (if any), like general docs
    for (const d of docs) {
      const s3Key = d.s3_key;
      if (!s3Key) continue;

      try {
        await deleteS3Object({ key: s3Key });
      } catch (s3err) {
        console.error('S3 delete failed for research doc', s3err);
        await tx.rollback();

        const rawMsg = String(s3err?.message || s3err);
        const isAccessDenied =
          s3err?.Code === 'AccessDenied' || /AccessDenied/i.test(rawMsg);

        const userMsg = isAccessDenied
          ? 'Storage permission error while deleting research document (S3 AccessDenied).'
          : 'Could not delete research document file from storage.';

        return res.status(500).json({
          success: false,
          message: userMsg,
        });
      }
    }

    // 4) Delete document rows (force) and research log
    await Document.destroy({
      where: { research_id: researchId, case_id: caseId, kind: 'research' },
      transaction: tx,
      force: true,
    });

    await rl.destroy({
      transaction: tx,
      force: true,
    });

    await tx.commit();

    // 5) Reload remaining research logs for this case
    const researchRows = await ResearchLog.findAll({
      where: { case_id: caseId },
      include: [
        {
          model: Document,
          as: 'documents',
          required: false,
          where: { kind: 'research' },
        },
        {
          model: FirmStaff,
          as: 'created_by_staff',
          required: false,
          attributes: ['staff_id', 'first_name', 'last_name', 'email'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    const researchLogs = researchRows.map(r => r.get({ plain: true }));

    return res.json({
      success: true,
      message: 'Research log and related documents deleted.',
      researchLogs,
    });
  } catch (err) {
    console.error('delete_research_log error', err);
    if (tx) {
      try { await tx.rollback(); } catch (rbErr) {
        console.error('delete_research_log rollback error', rbErr);
      }
    }
    return res.status(500).json({
      success: false,
      message: kilError(err),
    });
  }
};



//=================== END TAB 2 Research Log =======================



//=================== START TAB 3 CPR TIMELINES / DEADLINES =======================

function pickCprBaseDatesFromBody(body, baseKeys = []) {
  const out = {};
  if (!body) return out;

  if (body.base_dates_json && typeof body.base_dates_json === 'string') {
    try {
      const parsed = JSON.parse(body.base_dates_json);
      if (parsed && typeof parsed === 'object') {
        for (const [k, v] of Object.entries(parsed)) out[k] = v;
      }
    } catch (e) {}
  }

  if (body.base_dates && typeof body.base_dates === 'object') {
    for (const [k, v] of Object.entries(body.base_dates)) out[k] = v;
  }

  for (const k of baseKeys) {
    if (body[k]) out[k] = body[k];
  }

  for (const k of Object.keys(out)) {
    const v = out[k];
    if (v == null || v === '') {
      delete out[k];
      continue;
    }
    if (typeof v !== 'string') out[k] = String(v);
  }

  return out;
}

export const list_cpr_deadlines = async (req, res) => {
  try {
    const firm_id = req.firmstaff?.firm_id || null;
    const caseId = Number(req.params.case_id || 0) || 0;
    if (!firm_id || !caseId) {
      return res.status(400).json({ success: false, message: 'Invalid firm or case.' });
    }

    const kase = await Case.findOne({ where: { case_id: caseId, firm_id } });
    if (!kase) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    const rows = await CaseCPRDeadline.findAll({
      where: { firm_id, case_id: caseId },
      order: [['due_date', 'ASC'], ['case_cpr_deadline_id', 'ASC']],
    });

    const deadlines = rows.map(r => {
      const plain = r.get({ plain: true });
      return {
        ...plain,
        status: computeCPRStatus({
          due_date: plain.due_date,
          completed_at: plain.completed_at,
        }),
      };
    });

    const catalogue = getCPRTimelinesCatalogue('JM');
    const baseDateKeys = listBaseDateKeys(catalogue);

    return res.json({ success: true, deadlines, baseDateKeys });
  } catch (err) {
    console.error('list_cpr_deadlines error', err);
    return res.status(500).json({ success: false, message: kilError(err) });
  }
};

export const generate_cpr_deadlines = async (req, res) => {
  const actor = deriveActor(req);
  let tx;

  try {
    const firm_id = req.firmstaff?.firm_id || null;
    const caseId = Number(req.params.case_id || req.body.case_id || 0) || 0;
    if (!firm_id || !caseId) {
      return res.status(400).json({ success: false, message: 'Invalid firm or case.' });
    }

    const kase = await Case.findOne({ where: { case_id: caseId, firm_id } });
    if (!kase) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    const catalogue = getCPRTimelinesCatalogue('JM');
    const baseKeys = listBaseDateKeys(catalogue);
    const baseDates = pickCprBaseDatesFromBody(req.body || {}, baseKeys);
    const force = String(req.body?.force || '').toLowerCase() === 'true';

    const computed = buildCaseCPRDeadlines({
      baseDates,
      jurisdiction: 'JM',
    });

    const existingRows = await CaseCPRDeadline.findAll({
      where: { firm_id, case_id: caseId },
    });
    const existingByKey = new Map(existingRows.map(r => [r.event_key, r]));

    const creatorId = actor.actorId || req.firmstaff?.staff_id || null;

    tx = await sequelize.transaction();

    for (const d of computed) {
      const existing = existingByKey.get(d.event_key);
      if (!force && existing && existing.is_manual) continue;

      const completedAt = existing?.completed_at || null;
      const dueDate = d.due_date || null;

      const status = computeCPRStatus({
        due_date: dueDate,
        completed_at: completedAt,
      });

      await CaseCPRDeadline.upsert(
        {
          firm_id,
          case_id: caseId,
          jurisdiction: d.jurisdiction || 'JM',
          event_key: d.event_key,
          event_label: d.event_label,
          rule_reference: d.rule_reference,
          base_date_key: d.base_date_key,
          base_date: d.base_date,
          direction: d.direction,
          offset_value: d.offset_value,
          offset_unit: d.offset_unit,
          due_date: dueDate,
          is_computed: d.is_computed,
          is_manual: false,
          status,
          completed_at: completedAt,
          notes: existing?.notes || null,
          created_by_staff_id: existing?.created_by_staff_id || creatorId,
        },
        { transaction: tx }
      );
    }

    await tx.commit();

    const rows = await CaseCPRDeadline.findAll({
      where: { firm_id, case_id: caseId },
      order: [['due_date', 'ASC'], ['case_cpr_deadline_id', 'ASC']],
    });
    const deadlines = rows.map(r => r.get({ plain: true }));

    return res.json({ success: true, message: 'CPR deadlines generated.', deadlines, baseDateKeys: baseKeys });
  } catch (err) {
    console.error('generate_cpr_deadlines error', err);
    if (tx) {
      try { await tx.rollback(); } catch (rbErr) {}
    }
    return res.status(500).json({ success: false, message: kilError(err) });
  }
};

export const create_cpr_deadline_manual = async (req, res) => {
  const actor = deriveActor(req);
  let tx;

  try {
    const firm_id = req.firmstaff?.firm_id || null;
    const caseId = Number(req.params.case_id || req.body.case_id || 0) || 0;
    if (!firm_id || !caseId) {
      return res.status(400).json({ success: false, message: 'Invalid firm or case.' });
    }

    const { title, due_date, rule_reference, notes } = req.body || {};
    if (!title || !due_date) {
      return res.status(400).json({ success: false, message: 'Title and due date are required.' });
    }

    const kase = await Case.findOne({ where: { case_id: caseId, firm_id } });
    if (!kase) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    const creatorId = actor.actorId || req.firmstaff?.staff_id || null;
    const event_key = `manual_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

    tx = await sequelize.transaction();

    const status = computeCPRStatus({ due_date, completed_at: null });

    await CaseCPRDeadline.create(
      {
        firm_id,
        case_id: caseId,
        jurisdiction: 'JM',
        event_key,
        event_label: String(title).trim(),
        rule_reference: rule_reference || null,
        base_date_key: null,
        base_date: null,
        direction: 'after',
        offset_value: null,
        offset_unit: null,
        due_date,
        is_computed: false,
        is_manual: true,
        status,
        completed_at: null,
        notes: notes || null,
        created_by_staff_id: creatorId,
      },
      { transaction: tx }
    );

    await tx.commit();

    const rows = await CaseCPRDeadline.findAll({
      where: { firm_id, case_id: caseId },
      order: [['due_date', 'ASC'], ['case_cpr_deadline_id', 'ASC']],
    });
    const deadlines = rows.map(r => r.get({ plain: true }));

    return res.json({ success: true, message: 'Deadline added.', deadlines });
  } catch (err) {
    console.error('create_cpr_deadline_manual error', err);
    if (tx) {
      try { await tx.rollback(); } catch (rbErr) {}
    }
    return res.status(500).json({ success: false, message: kilError(err) });
  }
};

export const update_cpr_deadline = async (req, res) => {
  const actor = deriveActor(req);

  try {
    const firm_id = req.firmstaff?.firm_id || null;
    const caseId = Number(req.params.case_id || 0) || 0;
    const deadlineId = Number(req.params.deadline_id || 0) || 0;
    if (!firm_id || !caseId || !deadlineId) {
      return res.status(400).json({ success: false, message: 'Invalid request.' });
    }

    const row = await CaseCPRDeadline.findOne({
      where: { case_cpr_deadline_id: deadlineId, firm_id, case_id: caseId },
    });
    if (!row) {
      return res.status(404).json({ success: false, message: 'Deadline not found.' });
    }

    const { due_date, base_date, notes, completed, reset_manual } = req.body || {};

    if (typeof notes === 'string') row.notes = notes;
    if (typeof base_date === 'string') row.base_date = base_date || null;

    if (typeof due_date === 'string') {
      row.due_date = due_date || null;
      row.is_manual = true;
    }

    if (String(reset_manual || '').toLowerCase() === 'true') {
      row.is_manual = false;
      if (row.is_computed && row.base_date && row.offset_value != null && row.offset_unit && row.direction) {
        row.due_date = computeDueDate({
          base_date: row.base_date,
          offset_value: row.offset_value,
          offset_unit: row.offset_unit,
          direction: row.direction,
        });
      }
    }

    if (typeof completed !== 'undefined') {
      const isDone = completed === true || completed === 'true' || completed === 'on';
      row.completed_at = isDone ? new Date() : null;
    }

    row.status = computeCPRStatus({
      due_date: row.due_date,
      completed_at: row.completed_at,
    });

    row.created_by_staff_id = row.created_by_staff_id || actor.actorId || req.firmstaff?.staff_id || null;

    await row.save();

    return res.json({ success: true, message: 'Deadline updated.', deadline: row.get({ plain: true }) });
  } catch (err) {
    console.error('update_cpr_deadline error', err);
    return res.status(500).json({ success: false, message: kilError(err) });
  }
};

export const delete_cpr_deadline = async (req, res) => {
  try {
    const firm_id = req.firmstaff?.firm_id || null;
    const caseId = Number(req.params.case_id || 0) || 0;
    const deadlineId = Number(req.params.deadline_id || 0) || 0;
    if (!firm_id || !caseId || !deadlineId) {
      return res.status(400).json({ success: false, message: 'Invalid request.' });
    }

    const row = await CaseCPRDeadline.findOne({
      where: { case_cpr_deadline_id: deadlineId, firm_id, case_id: caseId },
    });
    if (!row) {
      return res.status(404).json({ success: false, message: 'Deadline not found.' });
    }

    if (!row.is_manual && row.is_computed) {
      return res.status(400).json({ success: false, message: 'Computed deadlines cannot be deleted.' });
    }

    await row.destroy();

    const rows = await CaseCPRDeadline.findAll({
      where: { firm_id, case_id: caseId },
      order: [['due_date', 'ASC'], ['case_cpr_deadline_id', 'ASC']],
    });
    const deadlines = rows.map(r => r.get({ plain: true }));

    return res.json({ success: true, message: 'Deadline deleted.', deadlines });
  } catch (err) {
    console.error('delete_cpr_deadline error', err);
    return res.status(500).json({ success: false, message: kilError(err) });
  }
};

//=================== END TAB 3 CPR TIMELINES / DEADLINES =======================

//=================== START TAB 3 Court Filing Tracker =======================

export const create_court_filing = async (req, res) => {
  const actor = deriveActor(req);
  let tx;

  try {
    const firm_id = req.firmstaff?.firm_id || null;
    const caseId  = Number(req.params.case_id || req.body.case_id || 0) || 0;

    if (!firm_id || !caseId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid firm or case.',
      });
    }

    const {
      court_type,
      filing_type,
      filing_date,
      reference_no,
      statuss,
      notes,
    } = req.body || {};

    const allowedStatus = ['Filed', 'Pending', 'Returned'];
    const cleanStatus   = allowedStatus.includes(statuss) ? statuss : null;

    if (!court_type || !filing_type || !filing_date || !cleanStatus) {
      return res.status(400).json({
        success: false,
        message: 'Court type, filing type, filing date, and status are required.',
      });
    }

    const receipt = req.file;
    if (receipt && !receipt.s3Key) {
      return res.status(400).json({
        success: false,
        message: 'Receipt upload failed. Please try again.',
      });
    }

    tx = await sequelize.transaction();

    const kase = await Case.findOne({
      where: { case_id: caseId, firm_id },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!kase) {
      await tx.rollback();
      return res.status(404).json({
        success: false,
        message: 'Case not found.',
      });
    }

    const creatorId = actor.actorId || req.firmstaff?.staff_id || null;
    const receiptData = receipt
      ? {
          receipt_s3_key: receipt.s3Key,
          receipt_mime_type: receipt.mimetype,
          receipt_size_bytes: receipt.size,
          receipt_uploaded_by: creatorId,
        }
      : {};

    await CourtFiling.create(
      {
        firm_id,
        case_id: caseId,
        court_type: String(court_type).trim(),
        filing_type: String(filing_type).trim(),
        filing_date,
        reference_no: (reference_no || '').trim() || null,
        status: cleanStatus,
        notes: (notes || '').trim() || null,
        created_by_staff_id: creatorId,
        ...receiptData,
      },
      { transaction: tx }
    );

    await tx.commit();

    const filingRows = await CourtFiling.findAll({
      where: { case_id: caseId, firm_id },
      include: [
        {
          model: FirmStaff,
          as: 'created_by_staff',
          attributes: ['staff_id', 'first_name', 'last_name', 'email'],
          required: false,
        },
      ],
      order: [
        ['filing_date', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });

    const filings = filingRows.map(f => f.get({ plain: true }));

    return res.json({
      success: true,
      message: 'Court filing saved successfully.',
      filings,
    });
  } catch (err) {
    console.error('create_court_filing error', err);
    if (tx) {
      try { await tx.rollback(); } catch (rbErr) {
        console.error('create_court_filing rollback error', rbErr);
      }
    }
    return res.status(500).json({
      success: false,
      message: kilError(err),
    });
  }
};


export const delete_court_filing = async (req, res) => {
  const actor = deriveActor(req);
  let tx;

  try {
    const firm_id  = req.firmstaff?.firm_id || null;
    const caseId   = Number(req.params.case_id || 0) || 0;
    const filingId = Number(req.params.filing_id || 0) || 0;

    if (!firm_id || !caseId || !filingId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid firm/case/filing id.',
      });
    }

    tx = await sequelize.transaction();

    const kase = await Case.findOne({
      where: { case_id: caseId, firm_id },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!kase) {
      await tx.rollback();
      return res.status(404).json({
        success: false,
        message: 'Case not found.',
      });
    }

    const filing = await CourtFiling.findOne({
      where: { filing_id: filingId, case_id: caseId, firm_id },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
      paranoid: true,
    });

    if (!filing) {
      await tx.rollback();
      return res.status(404).json({
        success: false,
        message: 'Filing not found.',
      });
    }

    const filingPlain = filing.get({ plain: true });
    const receiptKey  = filingPlain.receipt_s3_key;

    if (receiptKey) {
      try {
        await deleteS3Object({ key: receiptKey });
      } catch (s3err) {
        console.error('S3 delete failed for filing receipt', s3err);
        await tx.rollback();

        const rawMsg = String(s3err?.message || s3err);
        const isAccessDenied =
          s3err?.Code === 'AccessDenied' || /AccessDenied/i.test(rawMsg);

        const userMsg = isAccessDenied
          ? 'Storage permission error while deleting the receipt (S3 AccessDenied).'
          : 'Could not delete receipt from storage.';

        return res.status(500).json({
          success: false,
          message: userMsg,
        });
      }
    }

    await filing.destroy({ transaction: tx, force: true });

    await tx.commit();

    const filingRows = await CourtFiling.findAll({
      where: { case_id: caseId, firm_id },
      include: [
        {
          model: FirmStaff,
          as: 'created_by_staff',
          attributes: ['staff_id', 'first_name', 'last_name', 'email'],
          required: false,
        },
      ],
      order: [
        ['filing_date', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });

    const filings = filingRows.map(f => f.get({ plain: true }));

    return res.json({
      success: true,
      message: 'Court filing deleted.',
      filings,
    });
  } catch (err) {
    console.error('delete_court_filing error', err);
    if (tx) {
      try { await tx.rollback(); } catch (rbErr) {
        console.error('delete_court_filing rollback error', rbErr);
      }
    }
    return res.status(500).json({
      success: false,
      message: kilError(err),
    });
  }
};

//=================== END TAB 3 Court Filing Tracker =======================


//=================== START TAB 4 Evidence =======================

export const create_evidence = async (req, res) => {
  const actor = deriveActor(req);
  let tx;

  try {
    const firm_id = req.firmstaff?.firm_id || null;
    const caseId  = Number(req.params.case_id || req.body.case_id || 0) || 0;

    if (!firm_id || !caseId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid firm or case.',
      });
    }

    const {
      exhibit_no,
      date_collected,
      description,
      source,
      stored_location,
      linked_case,
    } = req.body || {};

    const allowedSources = ['Client', 'Witness', 'Police', 'Other'];
    const cleanSource    = allowedSources.includes(source) ? source : 'Other';

    if (!exhibit_no || !date_collected || !cleanSource) {
      return res.status(400).json({
        success: false,
        message: 'Exhibit number, date collected, and source are required.',
      });
    }

    const chainFile = req.file;
    if (chainFile && !chainFile.s3Key) {
      return res.status(400).json({
        success: false,
        message: 'File upload failed. Please try again.',
      });
    }

    tx = await sequelize.transaction();

    const kase = await Case.findOne({
      where: { case_id: caseId, firm_id },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!kase) {
      await tx.rollback();
      return res.status(404).json({
        success: false,
        message: 'Case not found.',
      });
    }

    const creatorId = actor.actorId || req.firmstaff?.staff_id || null;

    const ev = await Evidence.create(
      {
        firm_id,
        case_id: caseId,
        exhibit_no: String(exhibit_no).trim(),
        description: (description || '').trim() || null,
        source: cleanSource,
        date_collected,
        stored_location: (stored_location || '').trim() || null,
        linked_case_ref: (linked_case || '').trim() || null,
        created_by_staff_id: creatorId,
      },
      { transaction: tx }
    );

    if (chainFile) {
      const checksum = chainFile.buffer
        ? crypto.createHash('sha256').update(chainFile.buffer).digest('hex')
        : null;

      await Document.create(
        {
          case_id: caseId,
          evidence_id: ev.evidence_id,
          title: chainFile.originalname || 'Evidence File',
          kind: 'evidence',
          s3_key: chainFile.s3Key,
          mime_type: chainFile.mimetype,
          size_bytes: chainFile.size,
          uploaded_by: creatorId,
          checksum_sha256: checksum,
        },
        { transaction: tx }
      );
    }

    await tx.commit();

    const evidenceRows = await Evidence.findAll({
      where: { case_id: caseId, firm_id },
      include: [
        {
          model: Document,
          as: 'documents',
          required: false,
          where: { kind: 'evidence' },
        },
        {
          model: FirmStaff,
          as: 'created_by_staff',
          required: false,
          attributes: ['staff_id', 'first_name', 'last_name', 'email'],
        },
      ],
      order: [['date_collected', 'DESC'], ['created_at', 'DESC']],
    });
    const evidences = evidenceRows.map(e => e.get({ plain: true }));

    return res.json({
      success: true,
      message: 'Evidence saved successfully.',
      evidences,
    });
  } catch (err) {
    console.error('create_evidence error', err);
    if (tx) {
      try { await tx.rollback(); } catch (rbErr) {
        console.error('create_evidence rollback error', rbErr);
      }
    }
    return res.status(500).json({
      success: false,
      message: kilError(err),
    });
  }
};


export const delete_evidence = async (req, res) => {
  const actor = deriveActor(req);
  let tx;

  try {
    const firm_id    = req.firmstaff?.firm_id || null;
    const caseId     = Number(req.params.case_id || 0) || 0;
    const evidenceId = Number(req.params.evidence_id || 0) || 0;

    if (!firm_id || !caseId || !evidenceId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid firm/case/evidence id.',
      });
    }

    tx = await sequelize.transaction();

    const kase = await Case.findOne({
      where: { case_id: caseId, firm_id },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!kase) {
      await tx.rollback();
      return res.status(404).json({
        success: false,
        message: 'Case not found.',
      });
    }

    const ev = await Evidence.findOne({
      where: { evidence_id: evidenceId, case_id: caseId, firm_id },
      include: [
        {
          model: Document,
          as: 'documents',
          required: false,
          where: { kind: 'evidence' },
          paranoid: true,
        },
      ],
      transaction: tx,
      lock: tx.LOCK.UPDATE,
      paranoid: true,
    });

    if (!ev) {
      await tx.rollback();
      return res.status(404).json({
        success: false,
        message: 'Evidence not found.',
      });
    }

    const docs = ev.documents || [];
    for (const d of docs) {
      const key = d.s3_key;
      if (!key) continue;
      try {
        await deleteS3Object({ key });
      } catch (s3err) {
        console.error('S3 delete failed for evidence doc', s3err);
        await tx.rollback();

        const rawMsg = String(s3err?.message || s3err);
        const isAccessDenied =
          s3err?.Code === 'AccessDenied' || /AccessDenied/i.test(rawMsg);

        const userMsg = isAccessDenied
          ? 'Storage permission error while deleting evidence file (S3 AccessDenied).'
          : 'Could not delete evidence file from storage.';

        return res.status(500).json({
          success: false,
          message: userMsg,
        });
      }
    }

    await Document.destroy({
      where: { evidence_id: evidenceId, case_id: caseId, kind: 'evidence' },
      transaction: tx,
      force: true,
    });

    await ev.destroy({ transaction: tx, force: true });

    await tx.commit();

    const evidenceRows = await Evidence.findAll({
      where: { case_id: caseId, firm_id },
      include: [
        {
          model: Document,
          as: 'documents',
          required: false,
          where: { kind: 'evidence' },
        },
        {
          model: FirmStaff,
          as: 'created_by_staff',
          required: false,
          attributes: ['staff_id', 'first_name', 'last_name', 'email'],
        },
      ],
      order: [['date_collected', 'DESC'], ['created_at', 'DESC']],
    });
    const evidences = evidenceRows.map(e => e.get({ plain: true }));

    return res.json({
      success: true,
      message: 'Evidence deleted.',
      evidences,
    });
  } catch (err) {
    console.error('delete_evidence error', err);
    if (tx) {
      try { await tx.rollback(); } catch (rbErr) {
        console.error('delete_evidence rollback error', rbErr);
      }
    }
    return res.status(500).json({
      success: false,
      message: kilError(err),
    });
  }
};

//=================== END TAB 4 Evidence =======================


//=================== START TAB 5 Document Drafting =======================

const draftingAllowedKinds = ['general', 'research', 'evidence', 'contract', 'pleading', 'order', 'other'];

export const create_drafting_document = async (req, res) => {
  const actor = deriveActor(req);
  let tx;

  try {
    const firm_id = req.firmstaff?.firm_id || null;
    const caseId  = Number(req.params.case_id || req.body.case_id || 0) || 0;

    if (!firm_id || !caseId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid firm or case.',
      });
    }

    const { document_title, doc_kind } = req.body || {};
    const kind = draftingAllowedKinds.includes(doc_kind) ? doc_kind : null;
    if (!kind) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document kind.',
      });
    }

    const filesBag = req.files || {};
    const docFiles = Array.isArray(filesBag.documents)
      ? filesBag.documents
      : filesBag.documents
        ? [filesBag.documents]
        : [];

    if (!docFiles.length) {
      return res.status(400).json({
        success: false,
        message: 'Please attach at least one document.',
      });
    }

    tx = await sequelize.transaction();

    const kase = await Case.findOne({
      where: { case_id: caseId, firm_id },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!kase) {
      await tx.rollback();
      return res.status(404).json({
        success: false,
        message: 'Case not found.',
      });
    }

    const titlesArr = Array.isArray(document_title) ? document_title : (document_title ? [document_title] : []);
    const uploaderId = req.firmstaff?.staff_id || actor.actorId || null;

    for (let i = 0; i < docFiles.length; i++) {
      const f = docFiles[i];
      if (!f.s3Key) {
        await tx.rollback();
        return res.status(400).json({
          success: false,
          message: 'File upload failed. Please try again.',
        });
      }

      const title =
        (titlesArr[i] || f.originalname || 'Document')
          .toString()
          .trim() || 'Document';

      const checksum = f.buffer
        ? crypto.createHash('sha256').update(f.buffer).digest('hex')
        : null;

      await Document.create(
        {
          case_id: caseId,
          title,
          kind,
          s3_key: f.s3Key,
          mime_type: f.mimetype,
          size_bytes: f.size,
          uploaded_by: uploaderId,
          checksum_sha256: checksum,
        },
        { transaction: tx }
      );
    }

    await tx.commit();

    const draftingRows = await Document.findAll({
      where: { case_id: caseId, kind: draftingAllowedKinds },
      include: [
        {
          model: FirmStaff,
          attributes: ['staff_id', 'first_name', 'last_name', 'email'],
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
    });
    const draftingDocs = draftingRows.map(d => d.get({ plain: true }));

    return res.json({
      success: true,
      message: 'Document uploaded successfully.',
      draftingDocs,
    });
  } catch (err) {
    console.error('create_drafting_document error', err);
    if (tx) {
      try { await tx.rollback(); } catch (rbErr) {
        console.error('create_drafting_document rollback error', rbErr);
      }
    }
    return res.status(500).json({
      success: false,
      message: kilError(err),
    });
  }
};

export const delete_drafting_document = async (req, res) => {
  const actor = deriveActor(req);
  let tx;

  try {
    const firm_id = req.firmstaff?.firm_id || null;
    const caseId  = Number(req.params.case_id || 0) || 0;
    const docId   = Number(req.params.document_id || 0) || 0;

    if (!firm_id || !caseId || !docId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid firm/case/document id.',
      });
    }

    tx = await sequelize.transaction();

    const kase = await Case.findOne({
      where: { case_id: caseId, firm_id },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!kase) {
      await tx.rollback();
      return res.status(404).json({
        success: false,
        message: 'Case not found.',
      });
    }

    const doc = await Document.findOne({
      where: {
        document_id: docId,
        case_id: caseId,
        kind: draftingAllowedKinds,
      },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
      paranoid: true,
    });

    if (!doc) {
      await tx.rollback();
      return res.status(404).json({
        success: false,
        message: 'Document not found.',
      });
    }

    const s3Key = doc.s3_key;
    if (s3Key) {
      try {
        await deleteS3Object({ key: s3Key });
      } catch (s3err) {
        console.error('S3 delete failed for drafting doc', s3err);
        await tx.rollback();

        const rawMsg = String(s3err?.message || s3err);
        const isAccessDenied =
          s3err?.Code === 'AccessDenied' || /AccessDenied/i.test(rawMsg);

        const userMsg = isAccessDenied
          ? 'Storage permission error while deleting the file (S3 AccessDenied).'
          : 'Could not delete document file from storage.';

        return res.status(500).json({
          success: false,
          message: userMsg,
        });
      }
    }

    await doc.destroy({ transaction: tx, force: true });

    await tx.commit();

    const draftingRows = await Document.findAll({
      where: { case_id: caseId, kind: draftingAllowedKinds },
      include: [
        {
          model: FirmStaff,
          attributes: ['staff_id', 'first_name', 'last_name', 'email'],
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
    });
    const draftingDocs = draftingRows.map(d => d.get({ plain: true }));

    return res.json({
      success: true,
      message: 'Document deleted.',
      draftingDocs,
    });
  } catch (err) {
    console.error('delete_drafting_document error', err);
    if (tx) {
      try { await tx.rollback(); } catch (rbErr) {
        console.error('delete_drafting_document rollback error', rbErr);
      }
    }
    return res.status(500).json({
      success: false,
      message: kilError(err),
    });
  }
};

//=================== END TAB 5 Document Drafting =======================


//=================== START TAB 6 E-Signature =======================

const esignProviders = ['docusign', 'hellosign'];

function genToken() {
  return crypto.randomBytes(16).toString('hex');
}

export const create_esign_envelope = async (req, res) => {
  const actor = deriveActor(req);
  try {
    const firm_id = req.firmstaff?.firm_id || null;
    const caseId  = Number(req.params.case_id || req.body.case_id || 0) || 0;
    const envelopeId = Number(req.params.envelope_id || req.body.envelope_id || 0) || 0;

    if (!firm_id || !caseId) {
      return res.status(400).json({ success: false, message: 'Invalid firm or case.' });
    }

    let {
      provider,
      document_id,
      recipients,
      message,
      send_now,
    } = req.body || {};

    provider = (provider || '').toLowerCase();
    if (!esignProviders.includes(provider)) {
      return res.status(400).json({ success: false, message: 'Invalid provider.' });
    }

    const docId = Number(document_id || 0) || 0;
    if (!docId) {
      return res.status(400).json({ success: false, message: 'Document is required.' });
    }

    // recipients may arrive as JSON string
    if (typeof recipients === 'string') {
      try { recipients = JSON.parse(recipients); } catch (e) { recipients = null; }
    }

    const recList = Array.isArray(recipients) ? recipients : [];
    const validRecipients = recList
      .map(r => ({
        type: r.type || r.recipient_type,
        id_email: r.id_email || r.email || '',
        name: r.name || '',
        role: r.role || 'signer',
      }))
      .filter(r => r.id_email);

    const hasSigner = validRecipients.some(r => (r.role || '').toLowerCase() === 'signer');
    if (!validRecipients.length || !hasSigner) {
      return res.status(400).json({ success: false, message: 'At least one signer is required.' });
    }

    const doc = await Document.findOne({
      where: { document_id: docId, case_id: caseId },
      include: [{ model: Case, where: { firm_id }, required: true }],
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found for this case.' });
    }

    // Resolve recipients for firm users / client
    const kase = await Case.findOne({
      where: { case_id: caseId, firm_id },
      include: [
        {
          model: CaseParticipant,
          as: 'participants',
          include: [{ model: FirmStaff, as: 'staff', attributes: ['staff_id','first_name','last_name','email'] }],
        },
        {
          model: FirmClient,
          as: 'primary_client',
          attributes: ['client_id'],
          include: [{
            model: ClientAccount,
            as: 'account',
            attributes: ['email', 'business_name', 'first_name', 'last_name'],
          }],
        },
      ],
    });

    const staffMap = new Map();
    (kase?.participants || []).forEach(p => {
      if (p.staff) {
        staffMap.set(p.staff.staff_id, {
          email: p.staff.email,
          name: `${p.staff.first_name || ''} ${p.staff.last_name || ''}`.trim(),
        });
      }
    });

    const clientInfo = kase?.primary_client?.account
      ? {
          client_id: kase.primary_client.client_id,
          email: kase.primary_client.account.email,
          name: kase.primary_client.account.business_name || `${kase.primary_client.account.first_name || ''} ${kase.primary_client.account.last_name || ''}`.trim(),
        }
      : null;

    const resolvedRecipients = validRecipients.map(r => {
      if ((r.type || '').toLowerCase() === 'firmuser' && r.id_email) {
        const staff = staffMap.get(Number(r.id_email) || 0);
        if (staff?.email) {
          return { type: 'CaseTeam', email: staff.email, name: staff.name, role: r.role || 'signer', reference_id: Number(r.id_email) || null };
        }
        return null;
      }
      if ((r.type || '').toLowerCase() === 'client' && clientInfo) {
        return { type: 'Client', email: clientInfo.email, name: clientInfo.name, role: r.role || 'signer', reference_id: clientInfo.client_id || null };
      }
      if ((r.type || '').toLowerCase() === 'external') {
        return { type: 'External', email: r.id_email, name: r.name || r.id_email, role: r.role || 'signer', reference_id: null };
      }
      return null;
    }).filter(Boolean);

    if (!resolvedRecipients.length) {
      return res.status(400).json({ success: false, message: 'Could not resolve any recipients.' });
    }

    const senderId = actor.actorId || req.firmstaff?.staff_id || null;
    const status = send_now ? 'sent' : 'draft';

    let envelope;
    if (envelopeId) {
      envelope = await ESignEnvelope.findOne({ where: { envelope_id: envelopeId } });
      if (!envelope) {
        return res.status(404).json({ success: false, message: 'Envelope not found.' });
      }
      await ESignRecipient.destroy({ where: { envelope_id: envelope.envelope_id } });
      await envelope.update({
        provider,
        document_id: docId,
        sender_staff_id: senderId,
        subject: `Signature request for "${doc.title}"`,
        message: message || null,
        status,
        sent_at: send_now ? new Date() : null,
      });
    } else {
      envelope = await ESignEnvelope.create({
        provider,
        document_id: docId,
        sender_staff_id: senderId,
        subject: `Signature request for "${doc.title}"`,
        message: message || null,
        status,
        sent_at: send_now ? new Date() : null,
      });
    }

    const signerLinks = [];

    for (const r of resolvedRecipients) {
      const token = genToken();
      const rec = await ESignRecipient.create({
        envelope_id: envelope.envelope_id,
        type: r.type,
        reference_id: r.reference_id || null,
        email: r.email,
        name: r.name,
        role: r.role || 'signer',
        status: send_now ? 'sent' : 'pending',
        signer_token: token,
      });
      signerLinks.push({ ...rec.get({ plain: true }), token });
    }

    // If sending now, fire emails (signers get link, CC just notified)
    if (send_now && resolvedRecipients.length) {
      const docLink = doc.s3_key ? `${req.protocol}://${req.get('host')}/secure/file_stream?s3key=${encodeURIComponent(doc.s3_key)}` : '';
      const subject = `Signature request for "${doc.title}"`;
      for (const r of signerLinks) {
        const isSigner = (r.role || '').toLowerCase() === 'signer';
        const link = `${req.protocol}://${req.get('host')}/firmstaff/esign/${r.signer_token}`;
        try {
          if (isSigner) {
            await send_esign_signer_email({
              to: r.email,
              subject,
              data: {
                recipientName: r.name || 'Signer',
                documentTitle: doc.title,
                signLink: link,
                viewLink: docLink,
                message: message || 'Please review and sign this document.',
              },
            });
          } else {
            await send_esign_cc_email({
              to: r.email,
              subject: `CC: ${subject}`,
              data: {
                recipientName: r.name || 'Recipient',
                documentTitle: doc.title,
                viewLink: docLink,
                message: message || 'You are copied on this signature request.',
              },
            });
          }
        } catch (mailErr) {
          console.error('esign email error', mailErr);
        }
      }
    }

    const envelopeRows = await ESignEnvelope.findAll({
      include: [
        { model: Document, required: true, where: { case_id: caseId } },
        { model: FirmStaff, as: 'sender', attributes: ['staff_id', 'first_name', 'last_name', 'email'], required: false },
        { model: ESignRecipient, as: 'recipients', required: false },
      ],
      order: [['createdAt', 'DESC']],
    });
    const esignEnvelopes = envelopeRows.map(e => e.get({ plain: true }));

    return res.json({
      success: true,
      message: send_now ? 'Envelope created and marked as sent.' : 'Envelope created (draft).',
      esignEnvelopes,
    });
  } catch (err) {
    console.error('create_esign_envelope error', err);
    return res.status(500).json({ success: false, message: kilError(err) });
  }
};

export const delete_esign_envelope = async (req, res) => {
  try {
    const firm_id = req.firmstaff?.firm_id || null;
    const caseId  = Number(req.params.case_id || 0) || 0;
    const envelopeId = Number(req.params.envelope_id || 0) || 0;

    if (!firm_id || !caseId || !envelopeId) {
      return res.status(400).json({ success: false, message: 'Invalid firm/case/envelope id.' });
    }

    const env = await ESignEnvelope.findOne({
      where: { envelope_id: envelopeId },
      include: [
        { model: Document, required: true, where: { case_id: caseId } },
      ],
    });

    if (!env) {
      return res.status(404).json({ success: false, message: 'Envelope not found for this case.' });
    }

    await env.destroy({ force: true });

    const envelopeRows = await ESignEnvelope.findAll({
      include: [
        { model: Document, required: true, where: { case_id: caseId } },
        { model: FirmStaff, as: 'sender', attributes: ['staff_id', 'first_name', 'last_name', 'email'], required: false },
      ],
      order: [['createdAt', 'DESC']],
    });
    const esignEnvelopes = envelopeRows.map(e => e.get({ plain: true }));

    return res.json({
      success: true,
      message: 'Envelope deleted.',
      esignEnvelopes,
    });
  } catch (err) {
    console.error('delete_esign_envelope error', err);
    return res.status(500).json({ success: false, message: kilError(err) });
  }
};

//=================== END TAB 6 E-Signature =======================

//=================== Public Signing =======================

export const render_sign_page = async (req, res) => {
  try {
    const token = req.params.token || '';
    const recipient = await ESignRecipient.findOne({
      where: { signer_token: token },
      include: [
        {
          model: ESignEnvelope,
          as: 'envelope',
          include: [{ model: Document, required: true }],
        },
      ],
    });

    if (!recipient || !recipient.envelope || !recipient.envelope.Document) {
      return res.status(404).send('Invalid or expired link.');
    }

    return res.render('esign_sign', {
      recipient: recipient.get({ plain: true }),
      documentTitle: recipient.envelope.Document.title,
      documentLink: recipient.envelope.Document.s3_key
        ? `/secure/file_stream?s3key=${encodeURIComponent(recipient.envelope.Document.s3_key)}`
        : null,
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : null,
      alreadySigned: recipient.status === 'signed',
      signatureData: recipient.signature_data || '',
      signedAt: recipient.signed_at || null,
    });
  } catch (err) {
    console.error('render_sign_page error', err);
    return res.status(500).send('Server error.');
  }
};

export const submit_signature = async (req, res) => {
  try {
    const token = req.params.token || '';
    const { signature_data } = req.body || {};
    if (!signature_data) {
      return res.status(400).json({ success: false, message: 'Signature is required.' });
    }

    const recipient = await ESignRecipient.findOne({
      where: { signer_token: token },
      include: [
        {
          model: ESignEnvelope,
          as: 'envelope',
          include: [{ model: Document, required: true }],
        },
      ],
    });

    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Invalid or expired link.' });
    }

    if (recipient.status === 'signed') {
      return res.status(400).json({ success: false, message: 'This document has already been signed. Changes are not allowed for security reasons.' });
    }

    recipient.signature_data = signature_data;
    recipient.signed_at = new Date();
    recipient.signed_ip = req.ip;
    recipient.status = 'signed';
    await recipient.save();

    // Mark envelope completed if all signers signed
    const pendingSigner = await ESignRecipient.findOne({
      where: {
        envelope_id: recipient.envelope_id,
        role: 'signer',
        status: { [Op.not]: 'signed' },
      },
    });
    if (!pendingSigner) {
      await ESignEnvelope.update(
        { status: 'completed', completed_at: new Date() },
        { where: { envelope_id: recipient.envelope_id } }
      );
    }

    return res.json({ success: true, message: 'Signature captured.' });
  } catch (err) {
    console.error('submit_signature error', err);
    return res.status(500).json({ success: false, message: kilError(err) });
  }
};
