import { Server } from "socket.io";
import { getUsersInRoom, addUserToRoom, removeUserFromRoom } from "./roomManager/roomUsers.js";
import { getRoomCode, setRoomCode, deleteRoomCode } from "./roomManager/roomCode.js";
import { getRoomLanguage, setRoomLanguage, deleteRoomLanguage } from "./roomManager/roomLanguage.js";
import { createRoomNotification, getRoomNotifications, addRoomNotification, deleteRoomNotifications } from "./roomManager/roomNotifications.js";

let io;
const userMap = new Map();
const disconnectTimers = new Map();
const roomCleanupTimers = new Map();

const scheduleRoomCleanup = (roomId) => {
  if (roomCleanupTimers.has(roomId)) {
    clearTimeout(roomCleanupTimers.get(roomId));
  }

  const timer = setTimeout(() => {
    if (getUsersInRoom(roomId).length === 0) {
      deleteRoomCode(roomId);
      deleteRoomLanguage(roomId);
      deleteRoomNotifications(roomId);
    }

    roomCleanupTimers.delete(roomId);
  }, 5000);

  roomCleanupTimers.set(roomId, timer);
};

export const initSocket = (server) => {
  io = new Server(server, {       // io is the Socket.IO server instance (socket.io server manager just like app for http req) and is initialized with the HTTP server created in index.js
    cors: {
      origin: "http://localhost:5173",            // allow requests from this origin and allow credentials to be sent with requests (like cookies or authorization headers)
      credentials: true,
    },
  });

io.on("connection", (socket) => {     // io here is the Socket.IO server instance, and socket is the individual client connection
    console.log("User connected:", socket.id);

    socket.on("join-room", ({ username, roomId })=>{//destructured username and roomId from roomData that frontend sent
      const reconnectKey = `${roomId}:${username}`;   // Create a unique key for the user based on their username and room ID to track reconnections. This key will be used to check if the user is reconnecting after a disconnect, allowing us to restore their session without treating it as a new join.
      const isReconnect = disconnectTimers.has(reconnectKey);
      const alreadyInRoom = getUsersInRoom(roomId).some(
        (user) => user.username === username
      );

      if (roomCleanupTimers.has(roomId)) {
        clearTimeout(roomCleanupTimers.get(roomId));
        roomCleanupTimers.delete(roomId);
      }

      if (isReconnect) {
        clearTimeout(disconnectTimers.get(reconnectKey));
        disconnectTimers.delete(reconnectKey);
      }

      socket.join(roomId);
      userMap.set(socket.id, { username, roomId }); // Store the username and room ID in a map using the socket ID as the key for easy retrieval later
      addUserToRoom(roomId, username, socket.id);         // in-memory store update to add this user to this room
      io.to(roomId).emit("room-users", getUsersInRoom(roomId));   // Emit the updated list of users in the room to all clients in that room
      socket.emit("room-notifications", getRoomNotifications(roomId));
      if (!alreadyInRoom && !isReconnect) {
        const notification = createRoomNotification(
          `${username} joined the room`,
          "join"
        );
        addRoomNotification(roomId, notification);
        socket.to(roomId).emit("room-notification", notification);
      }
      socket.to(roomId).emit("user-joined", {
        username,
        message: `${username} joined the room`,
      });
      socket.emit("receive-code", getRoomCode(roomId) || ""); // this is for the user who just joined, we want to send them the latest code in the room so that their editor can be in sync with everyone else's. If there's no code in the room yet, we send an empty string.
      socket.emit("receive-language", getRoomLanguage(roomId) || "javascript"); 
      socket.emit("room-joined", {
        roomId,
        username,
      });
    });

    

    socket.on("code-change", ({ roomId, code }) => {    // this is for when a user makes change in editor, other roommates gets the new code
        setRoomCode(roomId, code);
        socket.to(roomId).emit("receive-code", code);
    });
    socket.on("language-change", ({roomId, language}) => {
        setRoomLanguage(roomId, language);
        socket.to(roomId).emit("receive-language", language);
    })
    socket.on("cursor-position-change", ({ roomId, username, lineNumber, column }) => {
        if (!roomId || !username || !lineNumber || !column) return;

        console.log("[cursor][backend] received cursor-position-change", {
          socketId: socket.id,
          roomId,
          username,
          lineNumber,
          column,
        });

        const payload = {
          socketId: socket.id,
          username,
          lineNumber,
          column,
        };

        console.log("[cursor][backend] broadcasting cursor-position-changed", {
          roomId,
          payload,
        });

        socket.to(roomId).emit("cursor-position-changed", {
          ...payload,
        });
    });

    socket.on("leave-room", () => {
        const user = userMap.get(socket.id);      // Retrieve the user information from the map using the socket ID
        if (!user) return;
        const { username, roomId } = user;      // Retrieve the username and room ID from the map using the socket ID
        const notification = createRoomNotification(
          `${username} left the room`,
          "leave"
        );
        addRoomNotification(roomId, notification);
        socket.to(roomId).emit("room-notification", notification);
        removeUserFromRoom(roomId, socket.id);
        if (getUsersInRoom(roomId).length === 0) {
          scheduleRoomCleanup(roomId);
        }
        socket.to(roomId).emit("user-left", {
          username,
          message: `${username} left the room`,
        });
        socket.leave(roomId);
        userMap.delete(socket.id);
        io.to(roomId).emit("room-users", getUsersInRoom(roomId));
        socket.disconnect(); // Disconnect the socket after leaving the room
        console.log(`${username} left room ${roomId}`);
    });

    socket.on("disconnect", () => {
        const user = userMap.get(socket.id);
        
        if (!user) {
            console.log("User disconnected:", socket.id);
            return;
        }

        const { username, roomId } = user;
        const reconnectKey = `${roomId}:${username}`;

        socket.to(roomId).emit("user-left", {
            username,
            message: `${username} disconnected`,
        });

        userMap.delete(socket.id);
        removeUserFromRoom(roomId, socket.id);
        if (getUsersInRoom(roomId).length === 0) {
          scheduleRoomCleanup(roomId);
        }
        io.to(roomId).emit("room-users", getUsersInRoom(roomId));
        const disconnectTimer = setTimeout(() => {
          disconnectTimers.delete(reconnectKey);

          const usersInRoom = getUsersInRoom(roomId);
          const hasRejoined = usersInRoom.some((user) => user.username === username);

          if (hasRejoined || usersInRoom.length === 0) {
            return;
          }

          const notification = createRoomNotification(
            `${username} disconnected`,
            "disconnect"
          );
          addRoomNotification(roomId, notification);
          io.to(roomId).emit("room-notification", notification);
        }, 3000);

        disconnectTimers.set(reconnectKey, disconnectTimer);
        console.log(`${username} disconnected from room ${roomId}`);
    });
  });

  return io;
};



export const getIO = () => {  // This function is used to get the Socket.IO server instance (io) that we initialized in initSocket. We will use this function in other parts of our server code (like in index.js) to emit events to clients from outside the socket connection handlers.
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
