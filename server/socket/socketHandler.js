import { Server } from "socket.io";
import { getUsersInRoom, addUserToRoom, removeUserFromRoom } from "./roomManager.js";

let io;
const userMap = new Map();

export const initSocket = (server) => {
  io = new Server(server, {                          // io is the Socket.IO server instance and is initialized with the HTTP server created in index.js
    cors: {
      origin: "http://localhost:5173",            // allow requests from this origin and allow credentials to be sent with requests (like cookies or authorization headers)
      credentials: true,
    },
  });

io.on("connection", (socket) => {                 // io here is the Socket.IO server instance, and socket is the individual client connection
    console.log("User connected:", socket.id);

    socket.on("join-room", ({ username, roomId }) => {
      socket.join(roomId);
      userMap.set(socket.id, { username, roomId }); // Store the username and room ID in a map using the socket ID as the key for easy retrieval later
      addUserToRoom(roomId, username, socket.id);
      io.to(roomId).emit("room-users", getUsersInRoom(roomId));
      console.log(`${username} joined room ${roomId}`);

      socket.to(roomId).emit("user-joined", {
        username,
        message: `${username} joined the room`,
      });
    });

    socket.on("code-change", ({ roomId, code }) => {
      socket.to(roomId).emit("receive-code", code);
    });

    socket.on("leave-room", () => {
        const user = userMap.get(socket.id);      // Retrieve the user information from the map using the socket ID
        if (!user) return;
        const { username, roomId } = user;      // Retrieve the username and room ID from the map using the socket ID
        removeUserFromRoom(roomId, socket.id);
        io.to(roomId).emit("room-users", getUsersInRoom(roomId));
        socket.to(roomId).emit("user-left", {
          username,
          message: `${username} left the room`,
        });
        socket.leave(roomId);
        userMap.delete(socket.id);
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
        removeUserFromRoom(roomId, socket.id);
        io.to(roomId).emit("room-users", getUsersInRoom(roomId));
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