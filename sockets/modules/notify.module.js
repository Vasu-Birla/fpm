// sockets/modules/notify.module.js
import {
  listNotificationsForActor,
  countUnreadForActor,
  markReadForActor,
  markAllReadForActor,
} from "../../utils/notificationService.js";

function getActorFromSocket(socket, ack) {
  const user_type = socket.data?.user_type || null;
  const user_id = Number(socket.data?.user_id || 0) || null;
  if (!user_type || !user_id) {
    ack?.({ ok: false, message: "not identified (call online)" });
    return null;
  }
  return { user_type, user_id };
}

export default function notifyModule(_io, socket) {
  socket.on("notify:count", async (_payload, ack) => {
    try {
      const actor = getActorFromSocket(socket, ack);
      if (!actor) return;
      const count = await countUnreadForActor(actor);
      return ack?.({ ok: true, count });
    } catch (e) {
      console.error("notify:count error:", e);
      return ack?.({ ok: false, message: "count failed" });
    }
  });

  socket.on("notify:list", async (payload = {}, ack) => {
    try {
      const actor = getActorFromSocket(socket, ack);
      if (!actor) return;
      const rows = await listNotificationsForActor(actor, {
        status: payload.status,
        type: payload.type,
        category: payload.category,
        search: payload.search,
        limit: payload.limit,
        offset: payload.offset,
      });
      return ack?.({ ok: true, rows });
    } catch (e) {
      console.error("notify:list error:", e);
      return ack?.({ ok: false, message: "list failed" });
    }
  });

  socket.on("notify:read", async (payload = {}, ack) => {
    try {
      const actor = getActorFromSocket(socket, ack);
      if (!actor) return;
      const ids = Array.isArray(payload.ids) ? payload.ids : [payload.id];
      const updated = await markReadForActor(actor, ids);
      return ack?.({ ok: true, updated });
    } catch (e) {
      console.error("notify:read error:", e);
      return ack?.({ ok: false, message: "read failed" });
    }
  });

  socket.on("notify:readAll", async (_payload, ack) => {
    try {
      const actor = getActorFromSocket(socket, ack);
      if (!actor) return;
      const updated = await markAllReadForActor(actor);
      return ack?.({ ok: true, updated });
    } catch (e) {
      console.error("notify:readAll error:", e);
      return ack?.({ ok: false, message: "read all failed" });
    }
  });
}
