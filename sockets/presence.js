// sockets/presence.js
const onlineUsers = new Map();

function makeUserKey(user_type, user_id) {
  return `${String(user_type)}:${String(user_id)}`;
}

export function markOnline(user_type, user_id, socket_id) {
  const key = makeUserKey(user_type, user_id);
  let sockets = onlineUsers.get(key);
  if (!sockets) {
    sockets = new Set();
    onlineUsers.set(key, sockets);
  }
  sockets.add(String(socket_id));
  console.log(key," is Online Now ")
  return sockets.size === 1;
}

export function markOffline(user_type, user_id, socket_id) {
  const key = makeUserKey(user_type, user_id);
  const sockets = onlineUsers.get(key);
  if (!sockets) return false;
  sockets.delete(String(socket_id));
  if (sockets.size === 0) {
    onlineUsers.delete(key);
    return true;
  }
  return false;
}

export function isOnline(user_type, user_id) {
  const key = makeUserKey(user_type, user_id);
  return onlineUsers.has(key);
}

export function getOnlineCount(user_type, user_id) {
  const key = makeUserKey(user_type, user_id);
  return onlineUsers.get(key)?.size || 0;
}

export { makeUserKey };
