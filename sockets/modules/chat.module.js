// sockets/modules/chat.module.js
import { ConversationParticipant } from "../../models/index.js";
import { roomChat, roomUser } from "../rooms.js";
import {
  normalizeUser,
  listConversations,
  getConversationHistory,
  createOrGetDirectConversation,
  isChatBlocked,
  createMessage,
  getConversationParticipants,
  getConversationMember,
  buildMessagePayload,
} from "../services/chat.service.js";

function toId(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function getSocketUser(socket, ack) {
  const user = normalizeUser({
    user_type: socket.data?.user_type,
    user_id: socket.data?.user_id,
  });
  if (!user) {
    ack?.({ ok: false, message: "not identified (call online)" });
    return null;
  }
  return user;
}

export default function chatModule(io, socket) {
  socket.on("chat:list", async (_payload, ack) => {
    try {
      const user = getSocketUser(socket, ack);
      if (!user) return;
      const conversations = await listConversations(user);
      return ack?.({ ok: true, conversations });
    } catch (e) {
      console.error("chat:list error:", e);
      return ack?.({ ok: false, message: "list failed" });
    }
  });

  socket.on("chat:direct", async ({ other_user_id, other_user_type } = {}, ack) => {
    try {
      const user = getSocketUser(socket, ack);
      if (!user) return;
      const other = normalizeUser({ user_type: other_user_type, user_id: other_user_id });
      if (!other) return ack?.({ ok: false, message: "other_user_id/other_user_type required" });

      const block = await isChatBlocked(user, other);
      if (block.blocked) {
        return ack?.({ ok: false, message: block.reason || "blocked" });
      }

      const convo = await createOrGetDirectConversation(user, other);
      return ack?.({ ok: true, convo_id: convo.convo_id });
    } catch (e) {
      console.error("chat:direct error:", e);
      return ack?.({ ok: false, message: "direct conversation failed" });
    }
  });

  socket.on("chat:join", async ({ convo_id } = {}, ack) => {
    try {
      const user = getSocketUser(socket, ack);
      if (!user) return;
      const convoId = toId(convo_id);
      if (!convoId) return ack?.({ ok: false, message: "convo_id missing" });

      const member = await getConversationMember(convoId, user);
      if (!member) return ack?.({ ok: false, message: "not a participant" });

      socket.join(roomChat(convoId));
      return ack?.({ ok: true });
    } catch (e) {
      console.error("chat:join error:", e);
      return ack?.({ ok: false, message: "join failed" });
    }
  });

  socket.on("chat:history", async ({ convo_id, before_id, limit } = {}, ack) => {
    try {
      const user = getSocketUser(socket, ack);
      if (!user) return;
      const convoId = toId(convo_id);
      if (!convoId) return ack?.({ ok: false, message: "convo_id missing" });

      const member = await getConversationMember(convoId, user);
      if (!member) return ack?.({ ok: false, message: "not a participant" });

      const history = await getConversationHistory(user, convoId, { before_id, limit });
      return ack?.({ ok: true, ...history });
    } catch (e) {
      console.error("chat:history error:", e);
      return ack?.({ ok: false, message: "history failed" });
    }
  });

  socket.on("chat:typing", ({ convo_id } = {}) => {
    try {
      const convoId = toId(convo_id);
      if (!convoId) return;
      if (!socket.rooms.has(roomChat(convoId))) return;

      io.to(roomChat(convoId)).emit("chat:typing", {
        convo_id: convoId,
        user_type: socket.data?.user_type,
        user_id: socket.data?.user_id,
      });
    } catch (e) {
      console.error("chat:typing error:", e);
    }
  });

  socket.on("chat:typing:stop", ({ convo_id } = {}) => {
    try {
      const convoId = toId(convo_id);
      if (!convoId) return;
      if (!socket.rooms.has(roomChat(convoId))) return;

      io.to(roomChat(convoId)).emit("chat:typing:stop", {
        convo_id: convoId,
        user_type: socket.data?.user_type,
        user_id: socket.data?.user_id,
      });
    } catch (e) {
      console.error("chat:typing:stop error:", e);
    }
  });

  socket.on("chat:send", async ({ convo_id, body, message_type, meta, reply_to_message_id, attachments } = {}, ack) => {
    try {
      const user = getSocketUser(socket, ack);
      if (!user) return;
      const convoId = toId(convo_id);
      if (!convoId) return ack?.({ ok: false, message: "convo_id missing" });

      const text = typeof body === "string" ? body.trim() : "";
      const safeAttachments = Array.isArray(attachments) ? attachments : [];
      const hasAttachments = safeAttachments.length > 0;
      if (!text && !hasAttachments) {
        return ack?.({ ok: false, message: "message required" });
      }

      const member = await getConversationMember(convoId, user);
      if (!member) return ack?.({ ok: false, message: "not a participant" });

      const participants = await getConversationParticipants(convoId);
      const other = participants.find(
        (p) => !(p.user_type === user.user_type && Number(p.user_id) === user.user_id)
      );

      if (other) {
        const block = await isChatBlocked(user, other);
        if (block.blocked) {
          return ack?.({ ok: false, message: block.reason || "blocked" });
        }
      }

      const resolvedType = message_type
        || (hasAttachments
          ? (() => {
              const types = safeAttachments.map((a) => a?.file_type).filter(Boolean);
              const unique = Array.from(new Set(types));
              return unique.length === 1 ? unique[0] : "file";
            })()
          : "text");

      const message = await createMessage({
        convo_id: convoId,
        sender: user,
        message_type: resolvedType,
        body: text,
        meta,
        reply_to_message_id,
        attachments: safeAttachments,
      });

      const payload = buildMessagePayload(message);
      io.to(roomChat(convoId)).emit("chat:message", payload);

      for (const participant of participants) {
        io.to(roomUser(participant.user_type, participant.user_id)).emit("chat:message:new", payload);
      }

      return ack?.({ ok: true, message: payload });
    } catch (e) {
      console.error("chat:send error:", e);
      return ack?.({ ok: false, message: "send failed" });
    }
  });

  socket.on("chat:delivered", async ({ convo_id, message_id } = {}, ack) => {
    try {
      const user = getSocketUser(socket, ack);
      if (!user) return;
      const convoId = toId(convo_id);
      const messageId = toId(message_id);
      if (!convoId || !messageId) return ack?.({ ok: false, message: "invalid payload" });

      await ConversationParticipant.update(
        { last_delivered_message_id: messageId, delivered_at: new Date() },
        {
          where: {
            convo_id: convoId,
            user_type: user.user_type,
            user_id: user.user_id,
            left_at: null,
          },
        }
      );

      io.to(roomChat(convoId)).emit("chat:receipt", {
        convo_id: convoId,
        kind: "delivered",
        user_type: user.user_type,
        user_id: user.user_id,
        message_id: messageId,
        at: new Date().toISOString(),
      });

      return ack?.({ ok: true });
    } catch (e) {
      console.error("chat:delivered error:", e);
      return ack?.({ ok: false, message: "delivered failed" });
    }
  });

  socket.on("chat:read", async ({ convo_id, message_id } = {}, ack) => {
    try {
      const user = getSocketUser(socket, ack);
      if (!user) return;
      const convoId = toId(convo_id);
      const messageId = toId(message_id);
      if (!convoId || !messageId) return ack?.({ ok: false, message: "invalid payload" });

      await ConversationParticipant.update(
        { last_read_message_id: messageId, read_at: new Date() },
        {
          where: {
            convo_id: convoId,
            user_type: user.user_type,
            user_id: user.user_id,
            left_at: null,
          },
        }
      );

      io.to(roomChat(convoId)).emit("chat:receipt", {
        convo_id: convoId,
        kind: "read",
        user_type: user.user_type,
        user_id: user.user_id,
        message_id: messageId,
        at: new Date().toISOString(),
      });

      return ack?.({ ok: true });
    } catch (e) {
      console.error("chat:read error:", e);
      return ack?.({ ok: false, message: "read failed" });
    }
  });
}
