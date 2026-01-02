// sockets/services/ticket.service.js
import { Op } from "sequelize";
import {
  TicketThread,
  TicketMessage,
  FirmClient,

  ClientAccount,

} from "../../models/index.js";

function toId(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function safeIso(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
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

function toSecureUrl(rawUrl) {
  if (!rawUrl) return "";
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
  if (rawUrl.startsWith("/secure/")) return rawUrl;
  return `/secure/file_stream?s3key=${encodeURIComponent(rawUrl)}`;
}

async function getFirmClientIds(firm_id) {
  const firmId = toId(firm_id);
  if (!firmId) return [];
  const rows = await FirmClient.findAll({
    where: { firm_id: firmId },
    attributes: ["client_id"],
  });
  return rows.map((row) => row.client_id);
}

export async function getFirmStaffActor(staff_id) {
  const staffId = toId(staff_id);
  if (!staffId) return null;
  return FirmStaff.findOne({
    where: { staff_id: staffId },
    include: [{ model: FirmRole, as: "role", attributes: ["name"] }],
  });
}

export async function getClientMembershipIds(client_account_id) {
  const accountId = toId(client_account_id);
  if (!accountId) return [];
  const rows = await FirmClient.findAll({
    where: {
      client_account_id: accountId,
      status: "active",
      portal_enabled: true,
    },
    attributes: ["client_id"],
  });
  return rows.map((row) => row.client_id);
}

export async function canAccessTicket({ user_type, user_id }, ticket) {
  if (!ticket) return false;
  if (user_type === "Admin") return true;
  if (user_type === "ClientAccount") {
    const membershipIds = await getClientMembershipIds(user_id);
    if (!membershipIds.length) return false;
    return membershipIds.includes(ticket.client_id) || membershipIds.includes(ticket.created_by_client_id);
  }

  if (user_type === "FirmStaff") {
    const staff = await getFirmStaffActor(user_id);
    if (!staff) return false;
    const isAdmin = staff.role?.name === "FirmAdmin";
    if (isAdmin) {
      if (Number(ticket.firm_id) === Number(staff.firm_id)) return true;
      if (ticket.client_id) {
        const firmClientIds = await getFirmClientIds(staff.firm_id);
        return firmClientIds.includes(ticket.client_id);
      }
      return false;
    }
    return Number(ticket.assigned_staff_id) === Number(staff.staff_id);
  }

  return false;
}

export async function listTicketsForActor({ user_type, user_id }) {
  const where = {};

  if (user_type === "Admin") {
    // Superadmin: see all tickets
  } else if (user_type === "ClientAccount") {
    const membershipIds = await getClientMembershipIds(user_id);
    if (!membershipIds.length) return [];
    where[Op.or] = [
      { client_id: { [Op.in]: membershipIds } },
      { created_by_client_id: { [Op.in]: membershipIds } },
    ];
  } else if (user_type === "FirmStaff") {
    const staff = await getFirmStaffActor(user_id);
    if (!staff) return [];
    if (staff.role?.name === "FirmAdmin") {
      const clientIds = await getFirmClientIds(staff.firm_id);
      if (clientIds.length) {
        where[Op.or] = [
          { firm_id: staff.firm_id },
          { client_id: { [Op.in]: clientIds } },
        ];
      } else {
        where.firm_id = staff.firm_id;
      }
    } else {
      where.assigned_staff_id = staff.staff_id;
    }
  } else {
    return [];
  }

  const rows = await TicketThread.findAll({
    where,
    include: [
      { model: LawFirm, as: "firm", attributes: ["firm_id", "firm_name"] },
      { model: Case, as: "case", attributes: ["case_id", "title", "case_number"] },
      {
        model: FirmClient,
        as: "client",
        attributes: ["client_id", "client_account_id"],
        include: [{
          model: ClientAccount,
          as: "account",
          attributes: ["first_name", "last_name", "business_name", "email"],
        }],
        required: false,
      },
      {
        model: FirmStaff,
        as: "assignee",
        attributes: ["staff_id", "first_name", "last_name"],
        required: false,
      },
    ],
    order: [["last_message_at", "DESC"], ["updatedAt", "DESC"], ["createdAt", "DESC"]],
  });

  return rows.map((row) => {
    const plain = row.get({ plain: true });
    const firm = plain.firm || {};
    const kase = plain.case || null;
    const clientAccount = plain.client?.account || null;
    const assigned = plain.assignee || null;
    const lastActivity = plain.last_message_at || plain.updatedAt || plain.createdAt;

    const clientName = clientAccount
      ? `${clientAccount.first_name || ""} ${clientAccount.last_name || ""}`.trim()
      : "";

    return {
      ticket_id: plain.ticket_id,
      ticket_number: formatTicketNumber(plain.ticket_number, plain.ticket_id),
      subject: plain.subject,
      status: plain.status,
      priority: plain.priority,
      firm_id: firm.firm_id || null,
      firm_name: firm.firm_name || "",
      case_id: kase?.case_id || null,
      case_label: kase ? `${kase.title || ""}${kase.case_number ? ` (${kase.case_number})` : ""}` : "",
      client_label: clientName || clientAccount?.email || "",
      assigned_staff: assigned
        ? {
            staff_id: assigned.staff_id,
            name: `${assigned.first_name || ""} ${assigned.last_name || ""}`.trim(),
          }
        : null,
      last_message_at: safeIso(lastActivity),
    };
  });
}

export async function getTicketHistory(ticket_id, { limit = 50 } = {}) {
  const ticketId = toId(ticket_id);
  if (!ticketId) return [];
  const rows = await TicketMessage.findAll({
    where: { ticket_id: ticketId, is_internal: false },
    include: [
      {
        model: FirmStaff,
        as: "sender_staff",
        attributes: ["staff_id", "first_name", "last_name"],
      },
      {
        model: FirmClient,
        as: "sender_client",
        attributes: ["client_id"],
        include: [{
          model: ClientAccount,
          as: "account",
          attributes: ["first_name", "last_name", "business_name", "email"],
        }],
      },
    ],
    order: [["createdAt", "ASC"]],
    limit: Math.max(1, Math.min(Number(limit) || 50, 200)),
  });

  return rows.map((row) => {
    const plain = row.get({ plain: true });
    const staff = plain.sender_staff || null;
    const client = plain.sender_client?.account || null;
    const meta = plain.meta || {};
    const senderId = staff
      ? staff.staff_id
      : plain.sender_client?.client_id || plain.sender_client_id || meta.sender_admin_id || null;
    const senderLabel = staff
      ? `${staff.first_name || ""} ${staff.last_name || ""}`.trim()
      : client
        ? `${client.first_name || ""} ${client.last_name || ""}`.trim()
        : meta.sender_label || "Support";

    return {
      message_id: plain.message_id,
      ticket_id: plain.ticket_id,
      body: plain.body || "",
      sender_type: plain.sender_type,
      sender_id: senderId,
      sender_label: senderLabel || "Support",
      created_at: safeIso(plain.created_at || plain.createdAt),
      attachments: Array.isArray(plain.attachments_json)
        ? plain.attachments_json.map((att) => ({
            ...att,
            url: toSecureUrl(att.s3_key || att.url || ""),
          }))
        : [],
    };
  });
}

export async function createTicketMessage({
  ticket_id,
  sender_type,
  sender_staff_id,
  sender_client_id,
  body,
  attachments,
  meta,
}) {
  const ticketId = toId(ticket_id);
  if (!ticketId) throw new Error("Invalid ticket");
  const message = await TicketMessage.create({
    ticket_id: ticketId,
    sender_type,
    sender_staff_id: sender_staff_id || null,
    sender_client_id: sender_client_id || null,
    body: body || "",
    attachments_json: Array.isArray(attachments) ? attachments : null,
    is_internal: false,
    meta: meta && typeof meta === "object" ? meta : null,
  });

  const updateData = {
    last_message_at: message.created_at || message.createdAt,
    last_message_id: message.message_id,
  };
  const updateOptions = { where: { ticket_id: ticketId }, validate: false };

  const ticket = await TicketThread.findByPk(ticketId, {
    attributes: ["ticket_id", "created_by_type", "created_by_client_id", "client_id", "meta"],
  });

  let patchClientId = null;
  if (ticket?.created_by_type === "Client" && !ticket.created_by_client_id) {
    patchClientId = sender_client_id || ticket.client_id || null;
    if (!patchClientId && ticket?.meta?.client_account_id) {
      const firmClient = await FirmClient.findOne({
        where: { client_account_id: ticket.meta.client_account_id },
        attributes: ["client_id"],
      });
      patchClientId = firmClient?.client_id || null;
    }
    if (patchClientId) {
      updateData.created_by_client_id = patchClientId;
    } else {
      console.error("ticket: missing created_by_client_id for", ticketId);
    }
  }

  if (!ticket?.client_id && patchClientId) {
    updateData.client_id = patchClientId;
  }

  await TicketThread.update(updateData, updateOptions);

  return message;
}
