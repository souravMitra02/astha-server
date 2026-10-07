const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PATCH", "DELETE"],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.userId = decoded.userId;

      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(socket.userId);

    console.log(`User connected: ${socket.userId}`);

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO is not initialized");
  }

  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};