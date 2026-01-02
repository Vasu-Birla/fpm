import sequelize from "../config/sequelize.js";
import crypto from "node:crypto";
import { Op, col, Sequelize } from "sequelize";
import { flashSet, flashPop } from "../utils/flash.js";
import { kilError } from "../utils/kilError.js";

import {  notifyAdmins } from "../utils/notificationService.js";

import {
  TicketThread,
  TicketMessage,
  FirmClient,
  ClientAccount
} from "../models/index.js";

const STATUS_LABELS = {
  open: "Open",
  pending: "Pending",
  on_hold: "On hold",
  resolved: "Resolved",
  closed: "Closed"
};

const PRIORITY_LABELS = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent"
};

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function formatTicketNumber(ticketNumber, id) {
  const raw = String(ticketNumber || "").trim();
  if (raw) {
    const digits = raw.replace(/\D/g, "");
    if (digits) {
      const normalized = digits.length >= 10 ? digits.slice(-10) : digits.padStart(10, "0");
      return `TKT-${normalized}`;
    }
    return `TKT-${raw}`;
  }
  const safe = Number(id || 0);
  if (!safe) return "TKT-0000000000";
  return `TKT-${String(safe).padStart(10, "0")}`;
}

async function generateTicketNumber(transaction) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidate = String(crypto.randomInt(0, 1e10)).padStart(10, "0");
    const exists = await TicketThread.findOne({
      where: { ticket_number: candidate },
      attributes: ["ticket_id"],
      transaction
    });
    if (!exists) return candidate;
  }
  return String(Date.now()).slice(-10);
}

async function loadClientMemberships(clientAccountId) {
  if (!clientAccountId) return [];
  return FirmClient.findAll({
    where: {
      client_account_id: clientAccountId,
      status: "active",
      portal_enabled: true
    },
    include: [{
      model: LawFirm,
      as: "firm",
      attributes: ["firm_id", "firm_name", "firm_logo"]
    }],
    order: [["createdAt", "DESC"]]
  });
}

async function loadAccessibleCases(membershipIds) {
  if (!membershipIds.length) return [];

  const participantRows = await CaseParticipant.findAll({
    where: {
      participant_type: "Client",
      client_id: { [Op.in]: membershipIds }
    },
    attributes: ["case_id"]
  });

  const participantCaseIds = participantRows.map(row => row.case_id);
  const accessClauses = [{ primary_client_id: { [Op.in]: membershipIds } }];
  if (participantCaseIds.length) {
    accessClauses.push({ case_id: { [Op.in]: participantCaseIds } });
  }

  const rows = await Case.findAll({
    where: { [Op.or]: accessClauses },
    include: [{
      model: LawFirm,
      attributes: ["firm_id", "firm_name", "firm_logo"]
    }],
    order: [["opened_at", "DESC"], ["createdAt", "DESC"]]
  });

  return rows.map(row => {
    const plain = row.get({ plain: true });
    const firm = plain.LawFirm || {};
    return {
      case_id: plain.case_id,
      title: plain.title,
      case_number: plain.case_number,
      firm_id: firm.firm_id || plain.firm_id,
      firm_name: firm.firm_name || ""
    };
  });
}

async function findAccessibleCase(caseId, membershipIds, transaction) {
  if (!caseId || !membershipIds.length) return null;

  const participantRows = await CaseParticipant.findAll({
    where: {
      participant_type: "Client",
      client_id: { [Op.in]: membershipIds },
      case_id: caseId
    },
    attributes: ["case_id"],
    transaction
  });

  const accessClauses = [{ primary_client_id: { [Op.in]: membershipIds } }];
  if (participantRows.length) {
    accessClauses.push({ case_id: caseId });
  }

  return Case.findOne({
    where: {
      case_id: caseId,
      [Op.or]: accessClauses
    },
    attributes: ["case_id", "firm_id", "title", "case_number"],
    transaction
  });
}

function resolveMembershipByFirm(memberships, firmId) {
  return memberships.find(m => Number(m.firm_id) === Number(firmId)) || null;
}

async function findOpenClientTicket(clientAccountId, ticketId) {
  const tid = toNumber(ticketId);
  if (!clientAccountId || !tid) return null;
  const memberships = await loadClientMemberships(clientAccountId);
  const membershipIds = memberships.map(m => m.client_id);
  if (!membershipIds.length) return null;
  return TicketThread.findOne({
    where: {
      ticket_id: tid,
      status: { [Op.ne]: "closed" },
      [Op.or]: [
        { client_id: { [Op.in]: membershipIds } },
        { created_by_client_id: { [Op.in]: membershipIds } }
      ]
    },
    attributes: ["ticket_id", "status"]
  });
}

function safeIso(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

function mapTicketRow(row) {
  const plain = row.get({ plain: true });
  const firm = plain.firm || {};
  const kase = plain.case || null;
  const meta = plain.meta || {};
  const lastActivity = plain.last_message_at || plain.updatedAt || plain.createdAt;
  const firmLabel = meta.firm_relation === "none"
    ? "Not related to a firm"
    : (firm.firm_name || "Assigned firm");
  const caseLabel = kase
    ? `${kase.title}${kase.case_number ? ` (${kase.case_number})` : ""}`
    : "Not related to a case";

  return {
    ticket_id: plain.ticket_id,
    ticket_number: formatTicketNumber(plain.ticket_number, plain.ticket_id),
    subject: plain.subject,
    status: plain.status,
    status_label: STATUS_LABELS[plain.status] || plain.status,
    priority: plain.priority,
    priority_label: PRIORITY_LABELS[plain.priority] || plain.priority,
    ticket_number_raw: plain.ticket_number || null,
    firm_label: firmLabel,
    firm_id: firm.firm_id || null,
    firm_name: firm.firm_name || "",
    firm_logo: firm.firm_logo || "",
    case_id: kase?.case_id || null,
    case_label: caseLabel,
    case_title: kase?.title || "",
    case_number: kase?.case_number || "",
    last_activity_iso: safeIso(lastActivity),
    route_admin: meta.route === "admin" || meta.firm_relation === "none"
  };
}

async function fetchTicketRows(membershipIds, filters = {}) {
  if (!membershipIds.length) return [];

  const {
    status = "",
    priority = "",
    firm_id = "",
    case_id = "",
    q = ""
  } = filters || {};

  const where = {
    [Op.or]: [
      { client_id: { [Op.in]: membershipIds } },
      { created_by_client_id: { [Op.in]: membershipIds } }
    ]
  };

  const firmIdNum = toNumber(firm_id);
  if (firmIdNum) where.firm_id = firmIdNum;

  const caseIdNum = toNumber(case_id);
  if (caseIdNum) where.case_id = caseIdNum;

  if (status) where.status = status;
  if (priority) where.priority = priority;

  const qTrim = String(q || "").trim();
  if (qTrim) {
    const like = `%${qTrim}%`;
    const qDigits = qTrim.replace(/\D/g, "");
    const searchOr = [
      { subject: { [Op.like]: like } },
      { ticket_number: { [Op.like]: like } },
      Sequelize.where(col("firm.firm_name"), { [Op.like]: like }),
      Sequelize.where(col("case.title"), { [Op.like]: like }),
      Sequelize.where(col("case.case_number"), { [Op.like]: like })
    ];
    if (qDigits) {
      searchOr.push({ ticket_number: { [Op.like]: `%${qDigits}%` } });
    }
    where[Op.and] = [{ [Op.or]: searchOr }];
  }

  return TicketThread.findAll({
    where,
    include: [
      {
        model: LawFirm,
        as: "firm",
        attributes: ["firm_id", "firm_name", "firm_logo"],
        required: false
      },
      {
        model: Case,
        as: "case",
        attributes: ["case_id", "title", "case_number", "firm_id"],
        required: false
      }
    ],
    order: [["last_message_at", "DESC"], ["updatedAt", "DESC"], ["createdAt", "DESC"]]
  });
}

export const support = async (req, res) => {
  const output = flashPop(req, res, "elaw_msg");
  try {
    const clientAccount = req.client || null;
    const clientAccountId = clientAccount?.client_account_id || null;
    if (!clientAccountId) {
      return res.redirect("/login");
    }

    const memberships = await loadClientMemberships(clientAccountId);
    const membershipIds = memberships.map(m => m.client_id);
    const firms = memberships.map(m => ({
      firm_id: m.firm_id,
      firm_name: m.firm?.firm_name || "",
      firm_logo: m.firm?.firm_logo || ""
    }));

    const cases = await loadAccessibleCases(membershipIds);

    const ticketsCount = membershipIds.length
      ? await TicketThread.count({
        where: {
          [Op.or]: [
            { client_id: { [Op.in]: membershipIds } },
            { created_by_client_id: { [Op.in]: membershipIds } }
          ]
        }
      })
      : 0;

    const csrfToken = typeof req.csrfToken === "function" ? req.csrfToken() : "";

    if (res.locals && Object.prototype.hasOwnProperty.call(res.locals, "include")) {
      delete res.locals.include;
    }
    if (req.app?.locals && Object.prototype.hasOwnProperty.call(req.app.locals, "include")) {
      delete req.app.locals.include;
    }

    return res.render("client/support", {
      output,
      clientAccount,
      cases,
      firms,
      ticketsCount,
      activeFirmId: req.active_firm_id || null,
      csrfToken
    });
  } catch (error) {
    console.error("support page error:", error);
    return res.render("errors/error500", { output: `Internal Server: ${kilError(error)}` });
  }
};

export const tickets_json = async (req, res) => {
  try {
    const clientAccountId = req.client?.client_account_id || null;
    if (!clientAccountId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const memberships = await loadClientMemberships(clientAccountId);
    const membershipIds = memberships.map(m => m.client_id);
    if (!membershipIds.length) {
      return res.json({ success: true, rows: [] });
    }

    const ticketRows = await fetchTicketRows(membershipIds, req.body || {});
    const payload = ticketRows.map(row => mapTicketRow(row));

    return res.json({ success: true, rows: payload });
  } catch (error) {
    console.error("tickets_json error:", error);
    return res.status(500).json({ success: false, message: kilError(error) });
  }
};

export const support_view = async (req, res) => {
  const output = flashPop(req, res, "elaw_msg");
  try {
    const clientAccount = req.client || null;
    const clientAccountId = clientAccount?.client_account_id || null;
    if (!clientAccountId) {
      return res.redirect("/login");
    }

    const me = {
      user_type: "ClientAccount",
      user_id: Number(clientAccountId),
      name: clientAccount?.full_name || clientAccount?.first_name || clientAccount?.email || "Client"
    };

    let activeTicketId = toNumber(req.cookies?.elaw_ticketId);
    if (activeTicketId) {
      const openTicket = await findOpenClientTicket(clientAccountId, activeTicketId);
      if (!openTicket) {
        res.clearCookie("elaw_ticketId", { path: "/" });
        activeTicketId = null;
      }
    }

    const ticketContext = {
      me,
      uploadUrl: "/support/upload",
      activeTicketId
    };

    return res.render("client/support_view", {
      output,
      clientAccount,
      ticketContext
    });
  } catch (error) {
    console.error("support_view error:", error);
    return res.render("errors/error500", { output: `Internal Server: ${kilError(error)}` });
  }
};

export const create_ticket = async (req, res) => {
  const client = req.client || null;
  const clientAccountId = client?.client_account_id || null;
  if (!clientAccountId) {
    return res.redirect("/login");
  }

  const subject = String(req.body?.subject || "").trim();
  const message = String(req.body?.message || "").trim();
  const caseId = toNumber(req.body?.case_id);
  const firmIdInput = toNumber(req.body?.firm_id);

  if (!subject || !message) {
    flashSet(res, "elaw_msg", "Please provide a subject and message.");
    return res.redirect("/support");
  }

  const t = await sequelize.transaction();
  try {
    const memberships = await loadClientMemberships(clientAccountId);
    if (!memberships.length) {
      await t.rollback();
      flashSet(res, "elaw_msg", "No active firm membership found for your account.");
      return res.redirect("/support");
    }
    const membershipIds = memberships.map(m => m.client_id);

    let resolvedCase = null;
    let resolvedFirmId = null;
    let resolvedMembership = null;
    const clientName = `${client?.first_name || ""} ${client?.last_name || ""}`.trim()
      || client?.business_name
      || client?.email
      || "Client";

    const meta = {
      case_relation: "none",
      firm_relation: "none",
      route: "admin",
      client_account_id: clientAccountId,
      client_name: clientName,
      client_email: client?.email || ""
    };

    if (caseId) {
      resolvedCase = await findAccessibleCase(caseId, membershipIds, t);
      if (!resolvedCase) {
        await t.rollback();
        flashSet(res, "elaw_msg", "Selected case was not found.");
        return res.redirect("/support");
      }

      resolvedFirmId = resolvedCase.firm_id;
      resolvedMembership = resolveMembershipByFirm(memberships, resolvedFirmId);
      if (!resolvedMembership) {
        await t.rollback();
        flashSet(res, "elaw_msg", "You do not have access to that case.");
        return res.redirect("/support");
      }
      meta.case_relation = "case";
      meta.firm_relation = "case";
      meta.route = "firm";
    } else if (firmIdInput) {
      resolvedMembership = resolveMembershipByFirm(memberships, firmIdInput);
      if (!resolvedMembership) {
        await t.rollback();
        flashSet(res, "elaw_msg", "Selected firm was not found.");
        return res.redirect("/support");
      }
      resolvedFirmId = firmIdInput;
      meta.firm_relation = "firm";
      meta.route = "firm";
    } else {
      resolvedMembership = req.firm_client || memberships[0] || null;
      if (!resolvedMembership) {
        await t.rollback();
        flashSet(res, "elaw_msg", "No active firm membership found for your account.");
        return res.redirect("/support");
      }
      resolvedFirmId = resolvedMembership?.firm_id || null;
      if (resolvedFirmId) {
        meta.firm_relation = "firm";
        meta.route = "firm";
      } else {
        meta.firm_relation = "none";
        meta.route = "admin";
      }
    }

    const ticketNumber = await generateTicketNumber(t);

    const thread = await TicketThread.create({
      ticket_number: ticketNumber,
      firm_id: resolvedFirmId,
      case_id: resolvedCase?.case_id || null,
      client_id: resolvedMembership?.client_id || null,
      subject,
      status: "open",
      priority: "normal",
      channel: "portal",
      created_by_type: "Client",
      created_by_client_id: resolvedMembership?.client_id || null,
      meta
    }, { transaction: t });

    const msg = await TicketMessage.create({
      ticket_id: thread.ticket_id,
      sender_type: "Client",
      sender_client_id: resolvedMembership?.client_id || null,
      body: message,
      is_internal: false
    }, { transaction: t });

    await thread.update({
      last_message_at: msg.created_at || msg.createdAt,
      last_message_id: msg.message_id
    }, { transaction: t });


    


    await notifyFirm({
      firm_id: resolvedFirmId,
      category: "ticket",
      type: "ticket_created",
      level: "info",
      title: `New ticket ${thread.ticket_number}`,
      body: subject || "New support request",
      entity_type: "ticket",
      entity_id: thread.ticket_id,
      action_link: "/firmstaff/tickets",
      action_request_method: "GET",
      emailNotify: false,
      data: {
        ticket_id: thread.ticket_id,
        ticket_number: thread.ticket_number,
        client_id: resolvedMembership?.client_id || null,
      },
    });

    await notifyAdmins({
      category: "ticket",
      type: "ticket_created",
      title: `New ticket ${thread.ticket_number}`,
      body: subject || "New support request",
      entity_type: "ticket",
      entity_id: thread.ticket_id,
      action_link: "/superadmin/tickets",
      emailNotify: false,
    });

    await t.commit();
    flashSet(res, "elaw_msg", "Your ticket has been created. We will respond soon.");
    res.cookie("elaw_ticketId", thread.ticket_id, { path: "/" });
    return res.redirect("/support/view");
  } catch (error) {
    try { if (!t.finished) await t.rollback(); } catch {}
    console.error("create_ticket error:", error);
    flashSet(res, "elaw_msg", `Could not create ticket: ${kilError(error)}`);
    return res.redirect("/support");
  }
};

export const reply_ticket = async (req, res) => {
  const client = req.client || null;
  const clientAccountId = client?.client_account_id || null;
  if (!clientAccountId) {
    return res.redirect("/login");
  }

  const ticketId = toNumber(req.body?.ticket_id) || toNumber(req.cookies?.elaw_ticketId);
  const message = String(req.body?.message || "").trim();
  if (!ticketId || !message) {
    flashSet(res, "elaw_msg", "Please enter a message before sending.");
    return res.redirect("/support");
  }

  const t = await sequelize.transaction();
  try {
    const memberships = await loadClientMemberships(clientAccountId);
    const membershipIds = memberships.map(m => m.client_id);
    const ticket = await TicketThread.findOne({
      where: {
        ticket_id: ticketId,
        status: { [Op.ne]: "closed" },
        [Op.or]: [
          { client_id: { [Op.in]: membershipIds } },
          { created_by_client_id: { [Op.in]: membershipIds } }
        ]
      },
      transaction: t
    });

    if (!ticket) {
      await t.rollback();
      flashSet(res, "elaw_msg", "Ticket not found or already closed.");
      return res.redirect("/support");
    }

    const membership = resolveMembershipByFirm(memberships, ticket.firm_id)
      || req.firm_client
      || memberships[0]
      || null;

    if (!membership) {
      await t.rollback();
      flashSet(res, "elaw_msg", "No active firm membership found for your account.");
      return res.redirect("/support");
    }

    const msg = await TicketMessage.create({
      ticket_id: ticket.ticket_id,
      sender_type: "Client",
      sender_client_id: membership?.client_id || null,
      body: message,
      is_internal: false
    }, { transaction: t });

    await ticket.update({
      last_message_at: msg.created_at || msg.createdAt,
      last_message_id: msg.message_id,
      status: ticket.status === "resolved" ? "open" : ticket.status
    }, { transaction: t });

    await t.commit();
    res.cookie("elaw_ticketId", ticket.ticket_id, { path: "/" });
    return res.redirect("/support/view");
  } catch (error) {
    try { if (!t.finished) await t.rollback(); } catch {}
    console.error("reply_ticket error:", error);
    flashSet(res, "elaw_msg", `Could not send reply: ${kilError(error)}`);
    return res.redirect("/support");
  }
};

export const ticket_upload = async (req, res) => {
  try {
    const clientAccountId = req.client?.client_account_id || null;
    if (!clientAccountId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const attachments = files.map((file) => {
      const mime = file.mimetype || "";
      let fileType = "file";
      if (mime.startsWith("image/")) fileType = "image";
      else if (mime.startsWith("audio/")) fileType = "audio";
      else if (mime.startsWith("video/")) fileType = "video";

      const s3Key = file.s3Key || "";
      return {
        file_type: fileType,
        file_name: file.originalname || "file",
        mime_type: mime || null,
        file_size: file.size || null,
        s3_key: s3Key,
        url: s3Key ? `/secure/file_stream?s3key=${encodeURIComponent(s3Key)}` : "",
      };
    });

    return res.json({ success: true, message: "ok", attachments });
  } catch (error) {
    console.error("ticket_upload error:", error);
    return res.status(500).json({ success: false, message: "Upload failed" });
  }
};
