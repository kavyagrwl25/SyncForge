import { Server } from "socket.io";
import { getUsersInRoom, addUserToRoom, removeUserFromRoom } from "./roomManager/roomUsers.js";
import { getRoomCode, setRoomCode, deleteRoomCode } from "./roomManager/roomCode.js";

let io;
const userMap = new Map();

export const initSocket = (server) => {
  io = new Server(server, {                          // io is the Socket.IO server instance and is initialized with the HTTP server created in index.js
    cors: {
      origin: "http://localhost:5173",            // allow requests from this origin and allow credentials to be sent with requests (like cookies or authorization headers)
      credentials: true,
    },
  });

io.on("connection", (socket) => {     // io here is the Socket.IO server instance, and socket is the individual client connection
    console.log("User connected:", socket.id);

    socket.on("join-room", ({ username, roomId })=>{//destructured username and roomId from roomData that frontend sent
      socket.join(roomId);
      userMap.set(socket.id, { username, roomId }); // Store the username and room ID in a map using the socket ID as the key for easy retrieval later
      addUserToRoom(roomId, username, socket.id);         // in-memory store update to add this user to this room
      io.to(roomId).emit("room-users", getUsersInRoom(roomId));   // Emit the updated list of users in the room to all clients in that room
      console.log(`${username} joined room ${roomId}`);
      socket.emit("receive-code", getRoomCode(roomId) || ""); // Send the current code in the room to the newly joined user, if there is any code already present for that room in the roomCode object, otherwise send an empty string
      socket.to(roomId).emit("user-joined", {
        username,
        message: `${username} joined the room`,
      });
    });

    socket.on("code-change", ({ roomId, code }) => {
        setRoomCode(roomId, code);
        socket.to(roomId).emit("receive-code", code);
    });
    socket.on("language-change", ({roomId, language}) => {
        socket.to(roomId).emit("language-changed", language);
    })

    socket.on("leave-room", () => {
        const user = userMap.get(socket.id);      // Retrieve the user information from the map using the socket ID
        if (!user) return;
        const { username, roomId } = user;      // Retrieve the username and room ID from the map using the socket ID
        removeUserFromRoom(roomId, socket.id);
        if (getUsersInRoom(roomId).length === 0) {
          deleteRoomCode(roomId);
        }
        socket.to(roomId).emit("user-left", {
          username,
          message: `${username} left the room`,
        });
        socket.leave(roomId);
        userMap.delete(socket.id);
        io.to(roomId).emit("room-users", getUsersInRoom(roomId));
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
        if (getUsersInRoom(roomId).length === 0) {
          deleteRoomCode(roomId);
        }
        io.to(roomId).emit("room-users", getUsersInRoom(roomId));
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