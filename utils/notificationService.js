import { Op } from "sequelize";
import {
  Notification,
 
  FirmClient,
  ClientAccount,
  Admin,
} from "../models/index.js";
import { getIo } from "../sockets/io.js";
import { roomUser } from "../sockets/rooms.js";
import { send_broadcast_email } from "../utils/emailhelper.js";

/**
 * Notification Service (usage overview)
 *
 * 1) Single user:
 * await notifyUsers({
 *   recipients: [{ user_type: "ClientAccount", user_id: 123 }],
 *   title: "Ticket updated",
 *   body: "We replied to your ticket.",
 *   type: "ticket_reply",
 *   category: "ticket",
 *   entity_type: "ticket",
 *   entity_id: 55,
 *   action_link: "/support/view",
 *   emailNotify: true
 * });
 *
 * 2) Entire firm (all active staff):
 * await notifyFirm({
 *   firm_id: 10,
 *   title: "New ticket",
 *   body: "A client opened a support request.",
 *   type: "ticket_created",
 *   category: "ticket",
 *   action_link: "/firmstaff/tickets/open",
 *   action_request_method: "POST",
 *   emailNotify: false
 * });
 *
 * 3) All admins:
 * await notifyAdmins({
 *   title: "System alert",
 *   body: "A new firm joined.",
 *   type: "system",
 *   level: "info",
 *   emailNotify: true
 * });
 */

function toId(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function normalizeUserType(value) {
  const type = String(value || "").trim();
  if (!type) return null;
  if (type === "ClientAccount" || type === "Client") return "Client";
  if (type === "Admin" || type === "SuperAdmin") return "Admin";
  return null;
}

function buildRecipientFields(user_type, user_id) {
  const id = toId(user_id);
  const type = normalizeUserType(user_type);
  if (!type || !id) return null;
  if (type === "Admin") return { recipient_type: "Admin", admin_id: id };
 
  if (type === "Client") return { recipient_type: "Client", client_account_id: id };
  return null;
}

function mapNotificationRow(row) {
  const plain = row.get ? row.get({ plain: true }) : row;
  return {
    notification_id: plain.notification_id,
    recipient_type: plain.recipient_type,
    admin_id: plain.admin_id || null,
    firm_staff_id: plain.firm_staff_id || null,
    client_account_id: plain.client_account_id || null,
    firm_id: plain.firm_id || null,
    entity_type: plain.entity_type || null,
    entity_id: plain.entity_id || null,
    title: plain.title,
    body: plain.body || plain.content || "",
    type: plain.type,
    category: plain.category || null,
    level: plain.level || "info",
    data: plain.data || null,
    action_link: plain.action_link || null,
    action_request_method: plain.action_request_method || "GET",
    is_read: !!plain.is_read,
    read_at: plain.read_at || null,
    created_at: plain.createdAt || plain.created_at || null,
  };
}

async function emitNotification(user_type, user_id, notification) {
  try {
    const io = getIo();
    if (!io) return;
    io.to(roomUser(user_type, user_id)).emit("notify:new", notification);
  } catch (e) {
    console.error("notify emit error:", e);
  }
}

async function resolveRecipientEmail(user_type, user_id) {
  const type = normalizeUserType(user_type);
  const id = toId(user_id);
  if (!type || !id) return null;

  if (type === "Admin") {
    const row = await Admin.findByPk(id, {
      attributes: ["admin_id", "first_name", "last_name", "username", "email"],
    });
    if (!row?.email) return null;
    const name = `${row.first_name || ""} ${row.last_name || ""}`.trim()
      || row.username
      || row.email;
    return { email: row.email, name };
  }

  if (type === "Client") {
    const row = await ClientAccount.findByPk(id, {
      attributes: ["client_account_id", "first_name", "last_name", "business_name", "email"],
    });
    if (!row?.email) return null;
    const name = `${row.first_name || ""} ${row.last_name || ""}`.trim()
      || row.business_name
      || row.email;
    return { email: row.email, name };
  }

  return null;
}

async function sendNotificationEmail({
  user_type,
  user_id,
  title,
  message,
  link,
  logoUrl,
}) {
  const contact = await resolveRecipientEmail(user_type, user_id);
  if (!contact?.email) return;

  try {
    await send_broadcast_email({
      to: contact.email,
      recipientName: contact.name || "User",
      title: title || "Notification",
      message: message || "You have a new notification.",
      link: link || "",
      logoUrl,
    });
  } catch (e) {
    console.error("notify email error:", e);
  }
}

export async function notifyUsers({
  recipients = [],
  title,
  body,
  type = "system",
  category = null,
  level = "info",
  data = null,
  action_link = null,
  action_request_method = "GET",
  firm_id = null,
  entity_type = null,
  entity_id = null,
  group_key = null,
  expires_at = null,
  sendSocket = true,
  emailNotify = false,
  emailTitle = null,
  emailMessage = null,
  emailLink = null,
  emailLogoUrl = null,
} = {}) {
  const safeTitle = String(title || "").trim();
  if (!safeTitle) throw new Error("Notification title required");

  const seen = new Set();
  const targets = [];
  recipients.forEach((rec) => {
    const fields = buildRecipientFields(rec.user_type, rec.user_id);
    if (!fields) return;
    const key = `${rec.user_type}:${rec.user_id}`;
    if (seen.has(key)) return;
    seen.add(key);
    targets.push({ fields, user_type: normalizeUserType(rec.user_type), user_id: toId(rec.user_id) });
  });

  const created = [];
  for (const target of targets) {
    const row = await Notification.create({
      ...target.fields,
      title: safeTitle,
      body: body || null,
      content: body || null,
      type,
      category,
      level,
      data,
      firm_id: firm_id || null,
      entity_type,
      entity_id: entity_id || null,
      group_key,
      delivered_at: new Date(),
      action_link,
      action_request_method,
    });
    const mapped = mapNotificationRow(row);
    created.push(mapped);
    if (sendSocket) {
      await emitNotification(target.user_type, target.user_id, mapped);
    }
    if (emailNotify) {
      const message = String(
        (emailMessage || body || "You have a new notification.")
      ).trim();
      await sendNotificationEmail({
        user_type: target.user_type,
        user_id: target.user_id,
        title: String(emailTitle || safeTitle).trim(),
        message,
        link: emailLink || action_link || "",
        logoUrl: emailLogoUrl || null,
      });
    }
  }

  return created;
}

export async function notifyAdmins(payload = {}) {
  const rows = await Admin.findAll({ attributes: ["admin_id"] });
  const recipients = rows.map((r) => ({ user_type: "Admin", user_id: r.admin_id }));
  return notifyUsers({ ...payload, recipients });
}

export async function notifyClients(client_account_ids = [], payload = {}) {
  const ids = (client_account_ids || []).map(toId).filter(Boolean);
  const recipients = ids.map((id) => ({ user_type: "ClientAccount", user_id: id }));
  return notifyUsers({ ...payload, recipients });
}

function buildWhereForActor(actor, { status, type, category, search, includeArchived } = {}) {
  if (!actor || !actor.user_type || !actor.user_id) return null;
  const typeNorm = normalizeUserType(actor.user_type);
  const id = toId(actor.user_id);
  if (!typeNorm || !id) return null;

  const where = {};
  if (typeNorm === "Admin") where.admin_id = id;
  if (typeNorm === "Client") where.client_account_id = id;

  if (!includeArchived) where.archived_at = null;

  if (status === "read") where.is_read = true;
  if (status === "unread") where.is_read = false;
  if (type) where.type = type;
  if (category) where.category = category;

  const q = String(search || "").trim();
  if (q) {
    const like = `%${q}%`;
    where[Op.or] = [
      { title: { [Op.like]: like } },
      { body: { [Op.like]: like } },
      { content: { [Op.like]: like } },
    ];
  }

  return where;
}

export async function listNotificationsForActor(actor, opts = {}) {
  const where = buildWhereForActor(actor, opts);
  if (!where) return [];
  const limit = Math.max(1, Math.min(Number(opts.limit) || 25, 200));
  const offset = Math.max(0, Number(opts.offset) || 0);

  const rows = await Notification.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });
  return rows.map(mapNotificationRow);
}

export async function countNotificationsForActor(actor, opts = {}) {
  const where = buildWhereForActor(actor, opts);
  if (!where) return 0;
  return Notification.count({ where });
}

export async function countUnreadForActor(actor) {
  return countNotificationsForActor(actor, { status: "unread" });
}

export async function markReadForActor(actor, ids = []) {
  const where = buildWhereForActor(actor, {});
  if (!where) return 0;
  const list = Array.isArray(ids) ? ids.map(toId).filter(Boolean) : [];
  if (!list.length) return 0;

  const [updated] = await Notification.update(
    { is_read: true, read_at: new Date() },
    { where: { ...where, notification_id: { [Op.in]: list } } }
  );
  return updated;
}

export async function markAllReadForActor(actor) {
  const where = buildWhereForActor(actor, {});
  if (!where) return 0;
  const [updated] = await Notification.update(
    { is_read: true, read_at: new Date() },
    { where: { ...where, is_read: false } }
  );
  return updated;
}



export async function resolveClientAccountName(client_account_id) {
  const accountId = toId(client_account_id);
  if (!accountId) return "";
  const account = await ClientAccount.findByPk(accountId, {
    attributes: ["first_name", "last_name", "business_name", "email"],
  });
  if (!account) return "";
  return `${account.first_name || ""} ${account.last_name || ""}`.trim()
    || account.business_name
    || account.email
    || "";
}

export async function resolveFirmClientAccountIds(firm_id, client_ids = []) {
  const firmId = toId(firm_id);
  if (!firmId) return [];
  const ids = (client_ids || []).map(toId).filter(Boolean);
  if (!ids.length) return [];

  const rows = await FirmClient.findAll({
    where: { firm_id: firmId, client_id: { [Op.in]: ids } },
    attributes: ["client_account_id"],
  });
  return rows.map((r) => r.client_account_id).filter(Boolean);
}
