import { Server } from "socket.io";

let io;
const userMap = new Map();

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
      userMap.set(socket.id, { username, roomId }); // Store the username and room ID in a map using the socket ID as the key for easy retrieval later
      console.log(`${username} joined room ${roomId}`);

      socket.to(roomId).emit("user-joined", {
        username,
        message: `${username} joined the room`,
      });
    });

    socket.on("leave-room", () => {
        const user = userMap.get(socket.id);
        if (!user) return;
        const { username, roomId } = user;
        socket.leave(roomId);
        userMap.delete(socket.id);
        socket.to(roomId).emit("user-left", {
            username,
            message: `${username} left the room`,
        });
    });

    socket.on("disconnect", () => {
        const user = userMap.get(socket.id);

        if (!user) {
            console.log("User disconnected:", socket.id);
            return;
        }

        const { username, roomId } = user;

        socket.to(roomId).emit("user-left", {
            username,
            message: `${username} disconnected`,
        });

        userMap.delete(socket.id);

        console.log(`${username} disconnected from room ${roomId}`);
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