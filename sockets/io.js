// sockets/io.js
let IO = null;

export function setIo(io) {
  IO = io;
}

export function getIo() {
  if (!IO) throw new Error('Socket.io not initialized. Call initSockets(server) first.');
  return IO;
}
