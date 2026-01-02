// sockets/services/chat.service.js
import { Op } from "sequelize";
import {
  sequelize,
  Conversation,
  ConversationParticipant,
  Message,
  MessageAttachment,
  ChatBlock,
  
  ClientAccount,
  Admin,
} from "../../models/index.js";
import { roomChat } from "../rooms.js";
import { isOnline, makeUserKey } from "../presence.js";

const DEFAULT_HISTORY_LIMIT = 30;
const MAX_HISTORY_LIMIT = 60;

function toId(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

export function normalizeUser(user) {
  const user_type = user?.user_type ? String(user.user_type) : null;
  const user_id = toId(user?.user_id);
  if (!user_type || !user_id) return null;
  return { user_type, user_id };
}

export function makeDirectKey(userA, userB) {
  const aKey = makeUserKey(userA.user_type, userA.user_id);
  const bKey = makeUserKey(userB.user_type, userB.user_id);
  return [aKey, bKey].sort().join("__");
}

function formatName(parts, fallback) {
  const name = parts.filter(Boolean).join(" ").trim();
  return name || fallback || "User";
}

export async function resolveUserProfiles(users) {
  const byType = new Map();
  const profileMap = new Map();

  for (const user of users || []) {
    const user_type = user?.user_type ? String(user.user_type) : null;
    const user_id = toId(user?.user_id);
    if (!user_type || !user_id) continue;
    if (!byType.has(user_type)) byType.set(user_type, new Set());
    byType.get(user_type).add(user_id);
  }

  for (const [type, idsSet] of byType.entries()) {
    const ids = Array.from(idsSet);
    if (type === "ClientAccount") {
      const rows = await ClientAccount.findAll({
        where: { client_account_id: ids },
        attributes: ["client_account_id", "first_name", "last_name", "business_name", "email", "profile_pic"],
      });
      for (const row of rows) {
        const name = formatName(
          [row.first_name, row.last_name],
          row.business_name || row.email
        );
        profileMap.set(makeUserKey(type, row.client_account_id), {
          user_type: type,
          user_id: row.client_account_id,
          name,
          avatar: row.profile_pic || null,
        });
      }
    } else if (type === "FirmStaff") {
      const rows = await FirmStaff.findAll({
        where: { staff_id: ids },
        attributes: ["staff_id", "first_name", "last_name", "email", "avatar"],
      });
      for (const row of rows) {
        const name = formatName([row.first_name, row.last_name], row.email);
        profileMap.set(makeUserKey(type, row.staff_id), {
          user_type: type,
          user_id: row.staff_id,
          name,
          avatar: row.avatar || null,
        });
      }
    } else if (type === "Admin") {
      const rows = await Admin.findAll({
        where: { admin_id: ids },
        attributes: ["admin_id", "first_name", "last_name", "username", "email", "image"],
      });
      for (const row of rows) {
        const name = formatName(
          [row.first_name, row.last_name],
          row.username || row.email
        );
        profileMap.set(makeUserKey(type, row.admin_id), {
          user_type: type,
          user_id: row.admin_id,
          name,
          avatar: row.image || null,
        });
      }
    } else {
      for (const id of ids) {
        profileMap.set(makeUserKey(type, id), {
          user_type: type,
          user_id: id,
          name: `${type} ${id}`,
          avatar: null,
        });
      }
    }
  }

  for (const user of users || []) {
    const user_type = user?.user_type ? String(user.user_type) : null;
    const user_id = toId(user?.user_id);
    if (!user_type || !user_id) continue;
    const key = makeUserKey(user_type, user_id);
    if (!profileMap.has(key)) {
      profileMap.set(key, {
        user_type,
        user_id,
        name: `${user_type} ${user_id}`,
        avatar: null,
      });
    }
  }

  return profileMap;
}

export async function getConversationParticipants(convo_id) {
  const convoId = toId(convo_id);
  if (!convoId) return [];
  return ConversationParticipant.findAll({
    where: { convo_id: convoId, left_at: null },
    attributes: ["convo_id", "user_type", "user_id"],
  });
}

export async function getConversationMember(convo_id, user) {
  const convoId = toId(convo_id);
  if (!convoId) return null;
  return ConversationParticipant.findOne({
    where: {
      convo_id: convoId,
      user_type: user.user_type,
      user_id: user.user_id,
      left_at: null,
    },
  });
}

export async function isConversationMember(convo_id, user) {
  const member = await getConversationMember(convo_id, user);
  return !!member;
}

async function countUnreadMessages(convo_id, last_read_message_id, user) {
  const convoId = toId(convo_id);
  if (!convoId) return 0;
  const lastReadId = toId(last_read_message_id) || 0;
  return Message.count({
    where: {
      convo_id: convoId,
      message_id: { [Op.gt]: lastReadId },
      [Op.not]: { sender_type: user.user_type, sender_id: user.user_id },
    },
  });
}

function formatMessagePayload(message) {
  if (!message) return null;
  const toSecureUrl = (rawUrl) => {
    if (!rawUrl) return "";
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
    if (rawUrl.startsWith("/secure/")) return rawUrl;
    return `/secure/file_stream?s3key=${encodeURIComponent(rawUrl)}`;
  };
  return {
    message_id: message.message_id,
    convo_id: message.convo_id,
    sender_type: message.sender_type,
    sender_id: message.sender_id,
    message_type: message.message_type,
    body: message.body || "",
    reply_to_message_id: message.reply_to_message_id || null,
    created_at: message.created_at ? new Date(message.created_at).toISOString() : null,
    attachments: (message.attachments || []).map((att) => ({
      id: att.id,
      file_type: att.file_type,
      file_name: att.file_name,
      mime_type: att.mime_type,
      file_size: att.file_size,
      s3_key: att.url,
      url: toSecureUrl(att.url),
    })),
  };
}

export async function listConversations(user) {
  const memberships = await ConversationParticipant.findAll({
    where: { user_type: user.user_type, user_id: user.user_id, left_at: null },
    attributes: ["convo_id", "last_read_message_id", "pinned", "muted_until"],
    include: [
      {
        model: Conversation,
        as: "conversation",
        attributes: ["convo_id", "conversation_type", "title", "avatar", "last_message_at"],
        include: [
          {
            model: Message,
            as: "last_message",
            attributes: ["message_id", "body", "message_type", "sender_type", "sender_id", "created_at"],
          },
        ],
      },
    ],
    order: [[{ model: Conversation, as: "conversation" }, "last_message_at", "DESC"]],
  });

  if (!memberships.length) return [];

  const convoIds = memberships.map((m) => m.convo_id);
  const participants = await ConversationParticipant.findAll({
    where: { convo_id: { [Op.in]: convoIds }, left_at: null },
    attributes: ["convo_id", "user_type", "user_id"],
  });

  const participantsByConvo = new Map();
  for (const participant of participants) {
    if (!participantsByConvo.has(participant.convo_id)) {
      participantsByConvo.set(participant.convo_id, []);
    }
    participantsByConvo.get(participant.convo_id).push(participant);
  }

  const otherUsers = [];
  for (const membership of memberships) {
    const list = participantsByConvo.get(membership.convo_id) || [];
    const other = list.find(
      (p) => !(p.user_type === user.user_type && Number(p.user_id) === user.user_id)
    );
    if (other) otherUsers.push(other);
  }

  const profiles = await resolveUserProfiles(otherUsers);

  const conversationList = await Promise.all(
    memberships.map(async (membership) => {
      const convo = membership.conversation;
      const list = participantsByConvo.get(membership.convo_id) || [];
      const other = list.find(
        (p) => !(p.user_type === user.user_type && Number(p.user_id) === user.user_id)
      );
      const otherProfile = other
        ? profiles.get(makeUserKey(other.user_type, other.user_id))
        : null;
      const lastMessage = formatMessagePayload(convo?.last_message);
      const lastMessageAt = convo?.last_message_at
        ? new Date(convo.last_message_at).toISOString()
        : lastMessage?.created_at || null;
      const unreadCount = await countUnreadMessages(
        membership.convo_id,
        membership.last_read_message_id,
        user
      );

      return {
        convo_id: membership.convo_id,
        conversation_type: convo?.conversation_type || "direct",
        title: convo?.title || otherProfile?.name || "Conversation",
        avatar: convo?.avatar || otherProfile?.avatar || null,
        other: otherProfile
          ? {
              ...otherProfile,
              is_online: isOnline(otherProfile.user_type, otherProfile.user_id),
            }
          : null,
        last_message: lastMessage,
        last_message_at: lastMessageAt,
        unread_count: unreadCount,
        pinned: !!membership.pinned,
        muted_until: membership.muted_until
          ? new Date(membership.muted_until).toISOString()
          : null,
      };
    })
  );

  return conversationList;
}

export async function getConversationHistory(user, convo_id, { before_id, limit } = {}) {
  const convoId = toId(convo_id);
  if (!convoId) return { messages: [], has_more: false, next_before_id: null };

  const queryLimit = Math.max(
    1,
    Math.min(Number(limit) || DEFAULT_HISTORY_LIMIT, MAX_HISTORY_LIMIT)
  );

  const where = { convo_id: convoId };
  const beforeId = toId(before_id);
  if (beforeId) {
    where.message_id = { [Op.lt]: beforeId };
  }

  const rows = await Message.findAll({
    where,
    limit: queryLimit,
    order: [["message_id", "DESC"]],
    include: [
      {
        model: MessageAttachment,
        as: "attachments",
        attributes: ["id", "file_type", "file_name", "mime_type", "file_size", "url"],
      },
    ],
  });

  const messages = rows.map(formatMessagePayload).reverse();
  const hasMore = rows.length === queryLimit;
  const nextBeforeId = messages.length ? messages[0].message_id : null;

  return { messages, has_more: hasMore, next_before_id: nextBeforeId };
}

async function ensureParticipant(convo_id, user, transaction) {
  const [participant, created] = await ConversationParticipant.findOrCreate({
    where: { convo_id, user_type: user.user_type, user_id: user.user_id },
    defaults: { joined_at: new Date(), left_at: null },
    transaction,
  });
  if (!created && participant.left_at) {
    await participant.update({ left_at: null, joined_at: new Date() }, { transaction });
  }
  return participant;
}

export async function createOrGetDirectConversation(user, other) {
  const direct_key = makeDirectKey(user, other);
  return sequelize.transaction(async (transaction) => {
    let convo = await Conversation.findOne({
      where: { direct_key },
      transaction,
    });

    if (!convo) {
      try {
        convo = await Conversation.create(
          {
            conversation_type: "direct",
            direct_key,
            created_by_type: user.user_type,
            created_by_id: user.user_id,
          },
          { transaction }
        );
      } catch (err) {
        console.error("createOrGetDirectConversation create error:", err);
        convo = await Conversation.findOne({ where: { direct_key }, transaction });
      }
    }

    if (!convo) throw new Error("Failed to create conversation");

    await ensureParticipant(convo.convo_id, user, transaction);
    await ensureParticipant(convo.convo_id, other, transaction);

    return convo;
  });
}

export async function isChatBlocked(user, other) {
  const block = await ChatBlock.findOne({
    where: {
      [Op.or]: [
        {
          blocker_type: user.user_type,
          blocker_id: user.user_id,
          blocked_type: other.user_type,
          blocked_id: other.user_id,
        },
        {
          blocker_type: other.user_type,
          blocker_id: other.user_id,
          blocked_type: user.user_type,
          blocked_id: user.user_id,
        },
      ],
    },
    attributes: ["reason"],
  });
  if (!block) return { blocked: false, reason: null };
  return { blocked: true, reason: block.reason || "Blocked" };
}

export async function createMessage({
  convo_id,
  sender,
  message_type,
  body,
  meta,
  reply_to_message_id,
  attachments,
}) {
  const convoId = toId(convo_id);
  if (!convoId) throw new Error("Invalid conversation");
  const now = new Date();

  return sequelize.transaction(async (transaction) => {
    const message = await Message.create(
      {
        convo_id: convoId,
        sender_type: sender.user_type,
        sender_id: sender.user_id,
        message_type: message_type || "text",
        body: body || null,
        reply_to_message_id: reply_to_message_id || null,
        meta: meta || null,
      },
      { transaction }
    );

    const createdAttachments = [];
    if (Array.isArray(attachments) && attachments.length) {
      for (const att of attachments) {
        const s3Key = att?.s3_key || att?.url || "";
        if (!s3Key) continue;
        const fileType = att?.file_type || "file";
        const record = await MessageAttachment.create(
          {
            message_id: message.message_id,
            file_type: fileType,
            file_name: att?.file_name || null,
            mime_type: att?.mime_type || null,
            file_size: att?.file_size || null,
            url: s3Key,
          },
          { transaction }
        );
        createdAttachments.push(record);
      }
    }

    await Conversation.update(
      { last_message_id: message.message_id, last_message_at: now },
      { where: { convo_id: convoId }, transaction }
    );

    await ConversationParticipant.update(
      {
        last_delivered_message_id: message.message_id,
        delivered_at: now,
        last_read_message_id: message.message_id,
        read_at: now,
      },
      {
        where: {
          convo_id: convoId,
          user_type: sender.user_type,
          user_id: sender.user_id,
        },
        transaction,
      }
    );

    message.attachments = createdAttachments;
    return message;
  });
}

export function buildMessagePayload(message) {
  return formatMessagePayload(message);
}

export async function emitPresenceToConversations(io, user, is_online) {
  const rows = await ConversationParticipant.findAll({
    where: { user_type: user.user_type, user_id: user.user_id, left_at: null },
    attributes: ["convo_id"],
  });

  if (!rows.length) return;

  const payload = {
    user_type: user.user_type,
    user_id: user.user_id,
    is_online: !!is_online,
    at: new Date().toISOString(),
  };

  for (const row of rows) {
    io.to(roomChat(row.convo_id)).emit("chat:presence", payload);
  }
}
