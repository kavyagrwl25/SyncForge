import { Server } from "socket.io";

let io;

export const initSocket = (server) => {// server is http server created in index.js and passed here to initialize the socket.io server to that server
  io = new Server(server, {                          // io is the Socket.IO server instance and is initialized with the HTTP server created in index.js
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {                 // io here is the Socket.IO server instance, and socket is the individual client connection
    console.log("User connected:", socket.id);

    socket.on("join-room", ({ username, roomId }) => {
      socket.join(roomId);

      console.log(`${username} joined room ${roomId}`);

      socket.to(roomId).emit("user-joined", {
        username,
        message: `${username} joined the room`,
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};