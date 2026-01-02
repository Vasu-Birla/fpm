// sockets/auth.js
import { roomUser } from './rooms.js';

export function bindOnlineEvent(io, socket, { onOnline } = {}) {
  socket.on('online', async (payload = {}, ack) => {
    try {
      const user_id = Number(payload.user_id);
      const user_type = payload.user_type ? String(payload.user_type) : null;

      if (!user_id || !user_type) {
        return ack?.({ ok: false, message: 'user_id/user_type required' });
      }

      socket.data.user_id = user_id;
      socket.data.user_type = user_type;
      socket.data.user_key = `${user_type}:${user_id}`;

      socket.join(roomUser(user_type, user_id));

      if (typeof onOnline === 'function') {
        await onOnline({ io, socket, user_id, user_type });
      }

      return ack?.({ ok: true });
    } catch (e) {
      console.error('online error:', e);
      return ack?.({ ok: false, message: 'online failed' });
    }
  });
}
