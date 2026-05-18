const { Server } = require("socket.io");

let io = null;

function initSocket(httpServer, allowedOrigins) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV !== "production" ? true : allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.emit("socket:ready", {
      ok: true,
      timestamp: new Date().toISOString(),
    });
  });

  return io;
}

function emitEvent(event, payload) {
  if (!io) return;
  io.emit(event, payload);
}

module.exports = {
  initSocket,
  emitEvent,
};
