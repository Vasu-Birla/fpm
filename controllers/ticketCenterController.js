import { Op } from "sequelize";
import { kilError } from "../utils/kilError.js";
import {
  TicketThread,
  FirmClient,
  ClientAccount,


} from "../models/index.js";
import { getIo } from "../sockets/io.js";
import { roomFirm, roomTicket, roomUser } from "../sockets/rooms.js";
import { notifyUsers } from "../utils/notificationService.js";
import { Audit } from "../utils/auditLogger.js";

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

function safeIso(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

const PRIORITY_SET = new Set(["low", "normal", "high", "urgent"]);

function normalizePriority(value) {
  const v = String(value || "").trim().toLowerCase();
  return PRIORITY_SET.has(v) ? v : null;
}

function ticketCookieOptions(req) {
  const proto = req.headers["x-forwarded-proto"];
  const secure = req.secure || proto === "https";
  return {
    httpOnly: true,
    sameSite: "Lax",
    secure,
    path: "/firmstaff",
  };
}

function adminTicketCookieOptions(req) {
  const proto = req.headers["x-forwarded-proto"];
  const secure = req.secure || proto === "https";
  return {
    httpOnly: true,
    sameSite: "Lax",
    secure,
    path: "/superadmin",
  };
}

async function loadStaffWithRole(staff) {
  if (!staff) return null;
  if (staff.role?.name) return staff;
  const row = await FirmStaff.findOne({
    where: { staff_id: staff.staff_id },
    include: [{ model: FirmRole, as: "role", attributes: ["name"] }],
  });
  return row || staff;
}

async function getClientAccountIdFromTicket(ticket) {
  if (!ticket?.client_id && !ticket?.created_by_client_id) return null;
  const clientId = ticket.client_id || ticket.created_by_client_id;
  const row = await FirmClient.findByPk(clientId, {
    attributes: ["client_account_id"],
  });
  return row?.client_account_id || null;
}

async function emitTicketUpdate(ticket, payload = {}) {
  try {
    const io = getIo();
    if (!io) return;
    const base = { ticket_id: ticket.ticket_id, ...payload };
    io.to(roomTicket(ticket.ticket_id)).emit("ticket:update", base);
    if (ticket.firm_id) io.to(roomFirm(ticket.firm_id)).emit("ticket:update", base);
    const clientAccountId = await getClientAccountIdFromTicket(ticket);
    if (clientAccountId) {
      io.to(roomUser("ClientAccount", clientAccountId)).emit("ticket:update", base);
    }
  } catch (e) {
    console.error("ticket:update emit error:", e);
  }
}

async function loadFirmStaffList(firm_id) {
  if (!firm_id) return [];
  const rows = await FirmStaff.findAll({
    where: { firm_id, status: "Active" },
    include: [{ model: FirmRole, as: "role", attributes: ["name"] }],
    order: [["first_name", "ASC"]],
  });
  return rows
    .filter((row) => row.role?.name !== "FirmAdmin")
    .map((row) => ({
      staff_id: row.staff_id,
      name: `${row.first_name || ""} ${row.last_name || ""}`.trim() || row.email || "Staff",
    }));
}

async function loadFirmClientIds(firm_id) {
  if (!firm_id) return [];
  const rows = await FirmClient.findAll({
    where: { firm_id },
    attributes: ["client_id"],
  });
  return rows.map((row) => row.client_id);
}

async function findAccessibleTicket(staff, ticketId) {
  const id = toNumber(ticketId);
  if (!id) return null;
  const ticket = await TicketThread.findByPk(id, {
    attributes: ["ticket_id", "firm_id", "client_id", "assigned_staff_id", "status", "ticket_number"],
  });
  if (!ticket || !staff) return null;

  const role = staff.role?.name;
  if (role === "FirmAdmin") {
    if (Number(ticket.firm_id) === Number(staff.firm_id)) return ticket;
    if (ticket.client_id) {
      const clientIds = await loadFirmClientIds(staff.firm_id);
      if (clientIds.includes(ticket.client_id)) return ticket;
    }
    return null;
  }

  return Number(ticket.assigned_staff_id) === Number(staff.staff_id) ? ticket : null;
}

export const firm_ticket_center = async (req, res) => {
  try {
    const staff = await loadStaffWithRole(req.firmstaff || null);
    if (!staff) return res.redirect("/firmstaff/login");
    return res.render("firmstaff/ticket_center", { staff });
  } catch (error) {
    console.error("firm_ticket_center error:", error);
    return res.render("errors/error500", { output: `Internal Server: ${kilError(error)}` });
  }
};

export const firm_ticket_view = async (req, res) => {
  try {
    const staff = await loadStaffWithRole(req.firmstaff || null);
    if (!staff) return res.redirect("/firmstaff/login");
    const ticketId = toNumber(req.query?.ticket_id);
    if (ticketId) {
      const ticket = await findAccessibleTicket(staff, ticketId);
      if (!ticket) {
        return res.redirect("/firmstaff/tickets");
      }
      if (ticket.status === "closed") {
        return res.redirect("/firmstaff/tickets");
      }
      res.cookie("elaw_ticketId_staff", String(ticket.ticket_id), ticketCookieOptions(req));
      return res.redirect("/firmstaff/tickets/view");
    }

    const ticketContext = {
      me: {
        user_type: "FirmStaff",
        user_id: Number(staff.staff_id),
        name: `${staff.first_name || ""} ${staff.last_name || ""}`.trim() || staff.email || "Staff",
      },
      uploadUrl: "/firmstaff/tickets/upload",
      activeTicketId: toNumber(req.cookies?.elaw_ticketId_staff),
    };

    return res.render("firmstaff/ticket_view", { staff, ticketContext });
  } catch (error) {
    console.error("firm_ticket_view error:", error);
    return res.render("errors/error500", { output: `Internal Server: ${kilError(error)}` });
  }
};

export const firm_tickets_json = async (req, res) => {
  try {
    const staff = await loadStaffWithRole(req.firmstaff || null);
    if (!staff) return res.status(401).json({ success: false, message: "Unauthorized" });

    let where = { assigned_staff_id: staff.staff_id };
    if (staff?.role?.name === "FirmAdmin") {
      const clientIds = await loadFirmClientIds(staff.firm_id);
      where = clientIds.length
        ? {
            [Op.or]: [
              { firm_id: staff.firm_id },
              { client_id: { [Op.in]: clientIds } },
            ],
          }
        : { firm_id: staff.firm_id };
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
        },
        { model: FirmStaff, as: "assignee", attributes: ["staff_id", "first_name", "last_name"] },
      ],
      order: [["last_message_at", "DESC"], ["updatedAt", "DESC"], ["createdAt", "DESC"]],
    });

    const payload = rows.map((row) => {
      const plain = row.get({ plain: true });
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
        assigned_staff_id: plain.assigned_staff_id || null,
        client_label: clientName || clientAccount?.email || "",
        assigned_label: assigned
          ? `${assigned.first_name || ""} ${assigned.last_name || ""}`.trim()
          : "Unassigned",
        last_activity_iso: safeIso(lastActivity),
      };
    });

    return res.json({ success: true, rows: payload });
  } catch (error) {
    console.error("firm_tickets_json error:", error);
    return res.status(500).json({ success: false, message: kilError(error) });
  }
};

export const firm_staff_list = async (req, res) => {
  try {
    const staff = await loadStaffWithRole(req.firmstaff || null);
    if (!staff) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (staff?.role?.name !== "FirmAdmin") {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }
    const list = await loadFirmStaffList(staff.firm_id);
    return res.json({ success: true, rows: list });
  } catch (error) {
    console.error("firm_staff_list error:", error);
    return res.status(500).json({ success: false, message: "Failed to load staff" });
  }
};

export const assign_ticket = async (req, res) => {
  try {
    const staff = await loadStaffWithRole(req.firmstaff || null);
    if (!staff) return res.status(401).json({ success: false, message: "Unauthorized" });

    const role = staff?.role?.name;
    if (role !== "FirmAdmin") {
      return res.status(403).json({ success: false, message: "Only FirmAdmin can assign tickets" });
    }

    const ticketId = toNumber(req.body?.ticket_id);
    const staffId = toNumber(req.body?.staff_id);
    if (!ticketId || !staffId) {
      return res.status(400).json({ success: false, message: "ticket_id and staff_id required" });
    }

    const ticket = await TicketThread.findByPk(ticketId);
    if (!ticket || Number(ticket.firm_id) !== Number(staff.firm_id)) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }
    if (ticket.status === "closed") {
      return res.status(409).json({ success: false, message: "Ticket already closed" });
    }

    const targetStaff = await FirmStaff.findOne({
      where: { staff_id: staffId, firm_id: staff.firm_id },
      attributes: ["staff_id"],
    });
    if (!targetStaff) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    await TicketThread.update(
      { assigned_staff_id: staffId },
      { where: { ticket_id: ticketId }, validate: false }
    );

    try {
      await notifyUsers({
        recipients: [{ user_type: "FirmStaff", user_id: staffId }],
        title: "Ticket assigned",
        body: `Ticket ${formatTicketNumber(ticket.ticket_number, ticket.ticket_id)} assigned to you.`,
        type: "task_assigned",
        firm_id: staff.firm_id,
        entity_type: "ticket",
        entity_id: ticket.ticket_id,
        action_link: "/firmstaff/tickets/open",
        action_request_method: "POST",
      });
    } catch (e) {
      console.error("assign_ticket notify error:", e);
    }

    try {
      const io = getIo();
      io.to(roomTicket(ticketId)).emit("ticket:assigned", { ticket_id: ticketId, staff_id: staffId });
      io.to(roomFirm(staff.firm_id)).emit("ticket:update", { ticket_id: ticketId });
      io.to(roomUser("FirmStaff", staffId)).emit("ticket:update", { ticket_id: ticketId });
    } catch (e) {
      console.error("assign_ticket socket error:", e);
    }

    return res.json({ success: true, message: "Assigned" });
  } catch (error) {
    console.error("assign_ticket error:", error);
    return res.status(500).json({ success: false, message: "Assign failed" });
  }
};

export const firm_close_ticket = async (req, res) => {
  try {
    const staff = await loadStaffWithRole(req.firmstaff || null);
    if (!staff) return res.status(401).json({ success: false, message: "Unauthorized" });

    const ticketId = toNumber(req.body?.ticket_id);
    if (!ticketId) {
      return res.status(400).json({ success: false, message: "ticket_id required" });
    }

    const ticket = await findAccessibleTicket(staff, ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    if (ticket.status !== "closed") {
      await TicketThread.update(
        { status: "closed", closed_at: new Date() },
        { where: { ticket_id: ticketId }, validate: false }
      );
    }

    await Audit.success?.({
      actorType: "FirmStaff",
      actorId: staff.staff_id,
      url: req.originalUrl,
      action: "TICKET_CLOSED",
      description: `Ticket #${formatTicketNumber(ticket.ticket_number, ticket.ticket_id)} closed by firm staff`,
    });

    await emitTicketUpdate(ticket, { status: "closed" });
    return res.json({ success: true, message: "Ticket closed" });
  } catch (error) {
    console.error("firm_close_ticket error:", error);
    await Audit.failed?.({
      actorType: "FirmStaff",
      actorId: req.firmstaff?.staff_id || null,
      url: req.originalUrl,
      action: "TICKET_CLOSED_ERROR",
      description: String(error?.message || error),
    });
    return res.status(500).json({ success: false, message: "Failed to close ticket" });
  }
};

export const firm_set_priority = async (req, res) => {
  try {
    const staff = await loadStaffWithRole(req.firmstaff || null);
    if (!staff) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (staff?.role?.name !== "FirmAdmin") {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const ticketId = toNumber(req.body?.ticket_id);
    const priority = normalizePriority(req.body?.priority);
    if (!ticketId || !priority) {
      return res.status(400).json({ success: false, message: "ticket_id and valid priority required" });
    }

    const ticket = await findAccessibleTicket(staff, ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    await TicketThread.update(
      { priority },
      { where: { ticket_id: ticketId }, validate: false }
    );

    await Audit.success?.({
      actorType: "FirmStaff",
      actorId: staff.staff_id,
      url: req.originalUrl,
      action: "TICKET_PRIORITY_UPDATED",
      description: `Ticket #${formatTicketNumber(ticket.ticket_number, ticket.ticket_id)} priority set to ${priority}`,
    });

    await emitTicketUpdate(ticket, { priority });
    return res.json({ success: true, message: "Priority updated" });
  } catch (error) {
    console.error("firm_set_priority error:", error);
    await Audit.failed?.({
      actorType: "FirmStaff",
      actorId: req.firmstaff?.staff_id || null,
      url: req.originalUrl,
      action: "TICKET_PRIORITY_ERROR",
      description: String(error?.message || error),
    });
    return res.status(500).json({ success: false, message: "Failed to update priority" });
  }
};

export const open_ticket = async (req, res) => {
  try {
    const staff = await loadStaffWithRole(req.firmstaff || null);
    if (!staff) return res.status(401).json({ success: false, message: "Unauthorized" });

    const ticketId = toNumber(req.body?.ticket_id);
    if (!ticketId) {
      return res.status(400).json({ success: false, message: "ticket_id required" });
    }

    const ticket = await findAccessibleTicket(staff, ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }
    if (ticket.status === "closed") {
      return res.status(409).json({ success: false, message: "Ticket already closed" });
    }

    res.cookie("elaw_ticketId_staff", String(ticket.ticket_id), ticketCookieOptions(req));
    return res.json({ success: true });
  } catch (error) {
    console.error("open_ticket error:", error);
    return res.status(500).json({ success: false, message: "Failed to open ticket" });
  }
};

export const ticket_upload = async (req, res) => {
  try {
    const staff = req.firmstaff || null;
    const admin = req.admin || null;
    if (!staff && !admin) {
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

export const admin_ticket_center = async (req, res) => {
  try {
    const admin = req.admin || null;
    if (!admin) return res.redirect("/superadmin/login");
    return res.render("superadmin/ticket_center", { admin });
  } catch (error) {
    console.error("admin_ticket_center error:", error);
    return res.render("errors/error500", { output: `Internal Server: ${kilError(error)}` });
  }
};

export const admin_ticket_view = async (req, res) => {
  try {
    const admin = req.admin || null;
    if (!admin) return res.redirect("/superadmin/login");

    const ticketId = toNumber(req.query?.ticket_id);
    if (ticketId) {
      const ticket = await TicketThread.findByPk(ticketId, { attributes: ["ticket_id", "status"] });
      if (!ticket) return res.redirect("/superadmin/tickets");
      if (ticket.status === "closed") return res.redirect("/superadmin/tickets");
      res.cookie("elaw_ticketId_admin", String(ticket.ticket_id), adminTicketCookieOptions(req));
      return res.redirect("/superadmin/tickets/view");
    }

    const name = `${admin.first_name || ""} ${admin.last_name || ""}`.trim()
      || admin.username
      || admin.email
      || "Admin";

    const ticketContext = {
      me: {
        user_type: "Admin",
        user_id: Number(admin.admin_id),
        name,
      },
      uploadUrl: "/superadmin/tickets/upload",
      activeTicketId: toNumber(req.cookies?.elaw_ticketId_admin),
    };

    return res.render("superadmin/ticket_view", { admin, ticketContext });
  } catch (error) {
    console.error("admin_ticket_view error:", error);
    return res.render("errors/error500", { output: `Internal Server: ${kilError(error)}` });
  }
};

export const admin_tickets_json = async (_req, res) => {
  try {
    const rows = await TicketThread.findAll({
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
        },
        { model: FirmStaff, as: "assignee", attributes: ["staff_id", "first_name", "last_name"] },
      ],
      order: [["last_message_at", "DESC"], ["updatedAt", "DESC"], ["createdAt", "DESC"]],
    });

    const payload = rows.map((row) => {
      const plain = row.get({ plain: true });
      const firm = plain.firm || {};
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
        firm_label: firm.firm_name || "",
        client_label: clientName || clientAccount?.email || "",
        assigned_label: assigned
          ? `${assigned.first_name || ""} ${assigned.last_name || ""}`.trim()
          : "Unassigned",
        last_activity_iso: safeIso(lastActivity),
      };
    });

    return res.json({ success: true, rows: payload });
  } catch (error) {
    console.error("admin_tickets_json error:", error);
    return res.status(500).json({ success: false, message: kilError(error) });
  }
};

export const admin_open_ticket = async (req, res) => {
  try {
    const admin = req.admin || null;
    if (!admin) return res.status(401).json({ success: false, message: "Unauthorized" });

    const ticketId = toNumber(req.body?.ticket_id);
    if (!ticketId) {
      return res.status(400).json({ success: false, message: "ticket_id required" });
    }

    const ticket = await TicketThread.findByPk(ticketId, { attributes: ["ticket_id", "status"] });
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }
    if (ticket.status === "closed") {
      return res.status(409).json({ success: false, message: "Ticket already closed" });
    }

    res.cookie("elaw_ticketId_admin", String(ticket.ticket_id), adminTicketCookieOptions(req));
    return res.json({ success: true });
  } catch (error) {
    console.error("admin_open_ticket error:", error);
    return res.status(500).json({ success: false, message: "Failed to open ticket" });
  }
};

export const admin_close_ticket = async (req, res) => {
  try {
    const admin = req.admin || null;
    if (!admin) return res.status(401).json({ success: false, message: "Unauthorized" });

    const ticketId = toNumber(req.body?.ticket_id);
    if (!ticketId) {
      return res.status(400).json({ success: false, message: "ticket_id required" });
    }

    const ticket = await TicketThread.findByPk(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    if (ticket.status !== "closed") {
      await TicketThread.update(
        { status: "closed", closed_at: new Date() },
        { where: { ticket_id: ticketId }, validate: false }
      );
    }

    await Audit.success?.({
      actorType: "admin",
      actorId: admin.admin_id,
      url: req.originalUrl,
      action: "TICKET_CLOSED",
      description: `Ticket #${formatTicketNumber(ticket.ticket_number, ticket.ticket_id)} closed by admin`,
    });

    await emitTicketUpdate(ticket, { status: "closed" });
    return res.json({ success: true, message: "Ticket closed" });
  } catch (error) {
    console.error("admin_close_ticket error:", error);
    await Audit.failed?.({
      actorType: "admin",
      actorId: req.admin?.admin_id || null,
      url: req.originalUrl,
      action: "TICKET_CLOSED_ERROR",
      description: String(error?.message || error),
    });
    return res.status(500).json({ success: false, message: "Failed to close ticket" });
  }
};

export const admin_set_priority = async (req, res) => {
  try {
    const admin = req.admin || null;
    if (!admin) return res.status(401).json({ success: false, message: "Unauthorized" });

    const ticketId = toNumber(req.body?.ticket_id);
    const priority = normalizePriority(req.body?.priority);
    if (!ticketId || !priority) {
      return res.status(400).json({ success: false, message: "ticket_id and valid priority required" });
    }

    const ticket = await TicketThread.findByPk(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    await TicketThread.update(
      { priority },
      { where: { ticket_id: ticketId }, validate: false }
    );

    await Audit.success?.({
      actorType: "admin",
      actorId: admin.admin_id,
      url: req.originalUrl,
      action: "TICKET_PRIORITY_UPDATED",
      description: `Ticket #${formatTicketNumber(ticket.ticket_number, ticket.ticket_id)} priority set to ${priority}`,
    });

    await emitTicketUpdate(ticket, { priority });
    return res.json({ success: true, message: "Priority updated" });
  } catch (error) {
    console.error("admin_set_priority error:", error);
    await Audit.failed?.({
      actorType: "admin",
      actorId: req.admin?.admin_id || null,
      url: req.originalUrl,
      action: "TICKET_PRIORITY_ERROR",
      description: String(error?.message || error),
    });
    return res.status(500).json({ success: false, message: "Failed to update priority" });
  }
};
