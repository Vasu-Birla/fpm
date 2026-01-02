// sockets/modules/ticket.module.js
import { TicketThread, FirmClient, ClientAccount, Admin } from "../../models/index.js";
import { roomTicket, roomUser, roomFirm } from "../rooms.js";
import {
  getFirmStaffActor,
  listTicketsForActor,
  getTicketHistory,
  createTicketMessage,
  canAccessTicket,
} from "../services/ticket.service.js";
import { notifyUsers } from "../../utils/notificationService.js";

function toId(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

async function getTicket(ticket_id) {
  const id = toId(ticket_id);
  if (!id) return null;
  return TicketThread.findByPk(id);
}

async function getClientAccountIdFromTicket(ticket) {
  if (!ticket?.client_id && !ticket?.created_by_client_id) return null;
  const clientId = ticket.client_id || ticket.created_by_client_id;
  const row = await FirmClient.findByPk(clientId, {
    attributes: ["client_account_id"],
  });
  return row?.client_account_id || null;
}

async function resolveSenderInfo(senderType, senderStaffId, senderClientId, ticket, senderAdminId) {
  if (senderType === "FirmStaff") {
    const staff = senderStaffId ? await getFirmStaffActor(senderStaffId) : null;
    const label = staff
      ? `${staff.first_name || ""} ${staff.last_name || ""}`.trim() || staff.email || "Support"
      : "Support";
    return { sender_id: senderStaffId || null, sender_label: label };
  }

  if (senderType === "System") {
    if (!senderAdminId) return { sender_id: null, sender_label: "Admin" };
    const admin = await Admin.findByPk(senderAdminId, {
      attributes: ["admin_id", "first_name", "last_name", "username", "email"],
    });
    const label = admin
      ? `${admin.first_name || ""} ${admin.last_name || ""}`.trim()
        || admin.username
        || admin.email
      : "Admin";
    return { sender_id: senderAdminId, sender_label: label || "Admin" };
  }

  const clientId = senderClientId || ticket?.client_id || ticket?.created_by_client_id || null;
  const metaLabel = ticket?.meta?.client_name;
  if (metaLabel) {
    return { sender_id: clientId, sender_label: metaLabel };
  }

  if (!clientId) return { sender_id: null, sender_label: "Client" };

  const firmClient = await FirmClient.findByPk(clientId, {
    attributes: ["client_id"],
    include: [{
      model: ClientAccount,
      as: "account",
      attributes: ["first_name", "last_name", "business_name", "email"],
    }],
  });
  const account = firmClient?.account || null;
  const label = account
    ? `${account.first_name || ""} ${account.last_name || ""}`.trim()
      || account.business_name
      || account.email
    : "Client";

  return { sender_id: clientId, sender_label: label || "Client" };
}

function getActorFromSocket(socket, ack) {
  const user_type = socket.data?.user_type || null;
  const user_id = toId(socket.data?.user_id);
  if (!user_type || !user_id) {
    ack?.({ ok: false, message: "not identified (call online)" });
    return null;
  }
  return { user_type, user_id };
}

export default function ticketModule(io, socket) {
  socket.on("ticket:list", async (_payload, ack) => {
    try {
      const actor = getActorFromSocket(socket, ack);
      if (!actor) return;
      if (actor.user_type === "FirmStaff") {
        const staff = await getFirmStaffActor(actor.user_id);
        if (staff?.firm_id && staff.role?.name === "FirmAdmin") {
          socket.join(roomFirm(staff.firm_id));
        }
      }
      const tickets = await listTicketsForActor(actor);
      return ack?.({ ok: true, tickets });
    } catch (e) {
      console.error("ticket:list error:", e);
      return ack?.({ ok: false, message: "list failed" });
    }
  });

  socket.on("ticket:join", async ({ ticket_id } = {}, ack) => {
    try {
      const actor = getActorFromSocket(socket, ack);
      if (!actor) return;
      const ticket = await getTicket(ticket_id);
      if (!ticket) return ack?.({ ok: false, message: "ticket not found" });

      const allowed = await canAccessTicket(actor, ticket);
      if (!allowed) return ack?.({ ok: false, message: "not allowed" });
      if (ticket.status === "closed") {
        return ack?.({ ok: false, message: "Ticket already closed" });
      }

      socket.join(roomTicket(ticket.ticket_id));
      return ack?.({ ok: true });
    } catch (e) {
      console.error("ticket:join error:", e);
      return ack?.({ ok: false, message: "join failed" });
    }
  });

  socket.on("ticket:history", async ({ ticket_id, limit } = {}, ack) => {
    try {
      const actor = getActorFromSocket(socket, ack);
      if (!actor) return;
      const ticket = await getTicket(ticket_id);
      if (!ticket) return ack?.({ ok: false, message: "ticket not found" });

      const allowed = await canAccessTicket(actor, ticket);
      if (!allowed) return ack?.({ ok: false, message: "not allowed" });
      if (ticket.status === "closed") {
        return ack?.({ ok: false, message: "Ticket already closed" });
      }

      const messages = await getTicketHistory(ticket.ticket_id, { limit });
      return ack?.({ ok: true, messages });
    } catch (e) {
      console.error("ticket:history error:", e);
      return ack?.({ ok: false, message: "history failed" });
    }
  });

  socket.on("ticket:typing", ({ ticket_id } = {}) => {
    try {
      const ticketId = toId(ticket_id);
      if (!ticketId) return;
      if (!socket.rooms.has(roomTicket(ticketId))) return;
      io.to(roomTicket(ticketId)).emit("ticket:typing", {
        ticket_id: ticketId,
        user_type: socket.data?.user_type,
        user_id: socket.data?.user_id,
      });
    } catch (e) {
      console.error("ticket:typing error:", e);
    }
  });

  socket.on("ticket:typing:stop", ({ ticket_id } = {}) => {
    try {
      const ticketId = toId(ticket_id);
      if (!ticketId) return;
      if (!socket.rooms.has(roomTicket(ticketId))) return;
      io.to(roomTicket(ticketId)).emit("ticket:typing:stop", {
        ticket_id: ticketId,
        user_type: socket.data?.user_type,
        user_id: socket.data?.user_id,
      });
    } catch (e) {
      console.error("ticket:typing:stop error:", e);
    }
  });

  socket.on("ticket:send", async ({ ticket_id, body, attachments } = {}, ack) => {
    try {
      const actor = getActorFromSocket(socket, ack);
      if (!actor) return;
      const text = typeof body === "string" ? body.trim() : "";
      const safeAttachments = Array.isArray(attachments) ? attachments : [];
      if (!text && !safeAttachments.length) {
        return ack?.({ ok: false, message: "message required" });
      }

      const ticket = await getTicket(ticket_id);
      if (!ticket) return ack?.({ ok: false, message: "ticket not found" });

      const allowed = await canAccessTicket(actor, ticket);
      if (!allowed) return ack?.({ ok: false, message: "not allowed" });
      if (ticket.status === "closed") {
        return ack?.({ ok: false, message: "Ticket already closed" });
      }

      let senderType = "Client";
      let senderStaffId = null;
      let senderClientId = null;
      let senderAdminId = null;

      if (actor.user_type === "FirmStaff") {
        senderType = "FirmStaff";
        senderStaffId = actor.user_id;
      } else if (actor.user_type === "Admin") {
        senderType = "System";
        senderAdminId = actor.user_id;
      } else {
        senderClientId = ticket.client_id || ticket.created_by_client_id || null;
      }

      let adminMeta = null;
      if (senderType === "System" && senderAdminId) {
        const admin = await Admin.findByPk(senderAdminId, {
          attributes: ["admin_id", "first_name", "last_name", "username", "email"],
        });
        const adminLabel = admin
          ? `${admin.first_name || ""} ${admin.last_name || ""}`.trim()
            || admin.username
            || admin.email
          : "Admin";
        adminMeta = {
          sender_admin_id: senderAdminId,
          sender_label: adminLabel || "Admin",
        };
      }

      const message = await createTicketMessage({
        ticket_id: ticket.ticket_id,
        sender_type: senderType,
        sender_staff_id: senderStaffId,
        sender_client_id: senderClientId,
        body: text,
        attachments: safeAttachments,
        meta: adminMeta,
      });

      const senderInfo = senderType === "System"
        ? {
            sender_id: senderAdminId,
            sender_label: adminMeta?.sender_label || "Admin",
          }
        : await resolveSenderInfo(
            senderType,
            senderStaffId,
            senderClientId,
            ticket
          );

      const payload = {
        message_id: message.message_id,
        ticket_id: ticket.ticket_id,
        body: message.body,
        sender_type: message.sender_type,
        sender_id: senderInfo.sender_id,
        sender_label: senderInfo.sender_label,
        created_at: message.created_at ? new Date(message.created_at).toISOString() : null,
        attachments: Array.isArray(safeAttachments)
          ? safeAttachments.map((att) => ({
              ...att,
              url: att.url || "",
            }))
          : [],
      };

      io.to(roomTicket(ticket.ticket_id)).emit("ticket:message", payload);

      if (ticket.firm_id) {
        io.to(roomFirm(ticket.firm_id)).emit("ticket:update", {
          ticket_id: ticket.ticket_id,
          last_message_at: payload.created_at,
        });
      }

      const clientAccountId = await getClientAccountIdFromTicket(ticket);
      if (clientAccountId) {
        io.to(roomUser("ClientAccount", clientAccountId)).emit("ticket:update", {
          ticket_id: ticket.ticket_id,
          last_message_at: payload.created_at,
        });
      }

      return ack?.({ ok: true, message: payload });
    } catch (e) {
      console.error("ticket:send error:", e);
      return ack?.({ ok: false, message: "send failed" });
    }
  });

  socket.on("ticket:assign", async ({ ticket_id, staff_id } = {}, ack) => {
    try {
      const actor = getActorFromSocket(socket, ack);
      if (!actor || actor.user_type !== "FirmStaff") {
        return ack?.({ ok: false, message: "not allowed" });
      }
      const staff = await getFirmStaffActor(actor.user_id);
      if (!staff || staff.role?.name !== "FirmAdmin") {
        return ack?.({ ok: false, message: "only FirmAdmin can assign" });
      }

      const ticket = await getTicket(ticket_id);
      if (!ticket) return ack?.({ ok: false, message: "ticket not found" });
      if (Number(ticket.firm_id) !== Number(staff.firm_id)) {
        return ack?.({ ok: false, message: "not allowed" });
      }

      const targetId = toId(staff_id);
      if (!targetId) return ack?.({ ok: false, message: "staff_id required" });

      const targetStaff = await getFirmStaffActor(targetId);
      if (!targetStaff || Number(targetStaff.firm_id) !== Number(staff.firm_id)) {
        return ack?.({ ok: false, message: "staff not found" });
      }

      await TicketThread.update(
        { assigned_staff_id: targetId },
        { where: { ticket_id: ticket.ticket_id }, validate: false }
      );

      try {
        await notifyUsers({
          recipients: [{ user_type: "FirmStaff", user_id: targetId }],
          title: "Ticket assigned",
          body: `Ticket ${ticket.ticket_number || ticket.ticket_id} assigned to you.`,
          type: "task_assigned",
          firm_id: staff.firm_id,
          entity_type: "ticket",
          entity_id: ticket.ticket_id,
          action_link: "/firmstaff/tickets/open",
          action_request_method: "POST",
        });
      } catch (e) {
        console.error("ticket:assign notify error:", e);
      }

      io.to(roomTicket(ticket.ticket_id)).emit("ticket:assigned", {
        ticket_id: ticket.ticket_id,
        staff_id: targetId,
      });

      if (ticket.firm_id) {
        io.to(roomFirm(ticket.firm_id)).emit("ticket:update", {
          ticket_id: ticket.ticket_id,
        });
      }

      io.to(roomUser("FirmStaff", targetId)).emit("ticket:update", {
        ticket_id: ticket.ticket_id,
      });

      return ack?.({ ok: true });
    } catch (e) {
      console.error("ticket:assign error:", e);
      return ack?.({ ok: false, message: "assign failed" });
    }
  });
}
