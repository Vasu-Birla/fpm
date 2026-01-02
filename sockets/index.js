// sockets/index.js
import { Server as SocketIO } from 'socket.io';
import { setIo } from './io.js';

import { bindOnlineEvent } from './auth.js';
import chatModule from './modules/chat.module.js';
import ticketModule from './modules/ticket.module.js';
import notifyModule from './modules/notify.module.js';
import { markOnline, markOffline } from './presence.js';
import { emitPresenceToConversations } from './services/chat.service.js';

export function initSockets(server) {
  const io = new SocketIO(server, {
    cors: { origin: '*' },
  });

  setIo(io);

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Bind identity once (personal room join)
    bindOnlineEvent(io, socket, {
      onOnline: async ({ io, user_id, user_type }) => {
        try {
          const isFirst = markOnline(user_type, user_id, socket.id);
          if (isFirst) {
            await emitPresenceToConversations(io, { user_type, user_id }, true);
          }
        } catch (e) {
          console.error('online presence error:', e);
        }
      },
    });

    // Register modules
    chatModule(io, socket);
    ticketModule(io, socket);
    notifyModule(io, socket);

    socket.on('disconnect', async () => {
      try {
        const { user_type, user_id } = socket.data || {};
        if (user_type && user_id) {
          const wentOffline = markOffline(user_type, user_id, socket.id);
          if (wentOffline) {
            await emitPresenceToConversations(io, { user_type, user_id }, false);
          }
        }
      } catch (e) {
        console.error('socket disconnect error:', e);
      }
      console.log('Socket disconnected:', socket.id);
    });
  });

  return io;
}
