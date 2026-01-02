// sockets/rooms.js
export const roomUser   = (user_type, user_id) => `user:${String(user_type)}:${String(user_id)}`;
export const roomFirm   = (firmId)             => `firm:${firmId}`;
export const roomTicket = (ticketId)           => `ticket:${ticketId}`;

// convo room
export const roomChat   = (convoId)            => `chat:${convoId}`;
