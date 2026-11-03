import * as Y from "yjs";
import {
  getRoomDoc,
  deleteRoomDoc,
  destroyRoomDocs,
} from "./roomManager/roomYDoc.js";
import { Server } from "socket.io";
import {
  getUsersInRoom,
  addUserToRoom,
  removeUserFromRoom,
} from "./roomManager/roomUsers.js";
import {
  getRoomLanguage,
  setRoomLanguage,
  deleteRoomLanguage,
} from "./roomManager/roomLanguage.js";
import {
  createRoomNotification,
  getRoomNotifications,
  addRoomNotification,
  deleteRoomNotifications,
} from "./roomManager/roomNotifications.js";

let io;
const userMap = new Map();
const disconnectTimers = new Map();
const roomCleanupTimers = new Map();

// Socket.IO can deliver binary data as a Buffer, typed array, or ArrayBuffer.
const toUint8Array = (data) => {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  throw new TypeError("Expected a binary Yjs update");
};

const reply = (acknowledge, result) => {
  if (typeof acknowledge === "function") acknowledge(result);
};

// Socket.IO also uses each socket ID as a private room name.
const getSocketRoom = (roomId) => `room:${roomId}`;

const isRoomMember = (socket, roomId) => {
  return userMap.get(socket.id)?.roomId === roomId && socket.rooms.has(getSocketRoom(roomId));
};

const scheduleRoomCleanup = (roomId) => {
  if (roomCleanupTimers.has(roomId)) {
    clearTimeout(roomCleanupTimers.get(roomId));
  }

  const timer = setTimeout(() => {
    // A rejoin or a newer timer may have replaced this cleanup request.
    if (roomCleanupTimers.get(roomId) !== timer) return;

    if (getUsersInRoom(roomId).length === 0) {
      deleteRoomDoc(roomId);
      deleteRoomLanguage(roomId);
      deleteRoomNotifications(roomId);
    }

    roomCleanupTimers.delete(roomId);
  }, 5000);

  roomCleanupTimers.set(roomId, timer);
};

export const initSocket = (server) => {
  io = new Server(server, {
    // io is the Socket.IO server instance (socket.io server manager just like app for http req) and is initialized with the HTTP server created in index.js
    cors: {
      origin: "http://localhost:5173", // allow requests from this origin and allow credentials to be sent with requests (like cookies or authorization headers)    localhost:5173 is the default port for Vite dev server, which is used to serve the React frontend during development. This means that the Socket.IO server will accept connections from the frontend running on this origin.
      credentials: true,
    },
  });

  server.once("close", () => {
    const roomIds = new Set(roomCleanupTimers.keys());
    for (const [socketId, user] of userMap) {
      roomIds.add(user.roomId);
      removeUserFromRoom(user.roomId, socketId);
    }
    for (const timer of roomCleanupTimers.values()) clearTimeout(timer);
    for (const timer of disconnectTimers.values()) clearTimeout(timer);
    roomCleanupTimers.clear();
    disconnectTimers.clear();
    userMap.clear();
    for (const roomId of roomIds) {
      deleteRoomLanguage(roomId);
      deleteRoomNotifications(roomId);
    }
    destroyRoomDocs();
  });

  io.on("connection", (socket) => {
    socket.on("join-room", (payload, acknowledge) => {
      const { username, roomId, stateVector } = payload ?? {};
      if (
        typeof username !== "string" || !username.trim() || username.length > 256 ||
        typeof roomId !== "string" || !roomId.trim() || roomId.length > 256 ||
        Object.hasOwn(Object.prototype, roomId)
      ) {
        reply(acknowledge, { ok: false, error: "A valid username and room ID are required" });
        return;
      }

      const currentUser = userMap.get(socket.id);
      if (currentUser && (currentUser.roomId !== roomId || currentUser.username !== username)) {
        reply(acknowledge, { ok: false, error: "Leave the current room before joining another" });
        return;
      }

      let clientStateVector;
      try {
        if (stateVector !== undefined) {
          clientStateVector = toUint8Array(stateVector);
          Y.decodeStateVector(clientStateVector);
        }
      } catch {
        reply(acknowledge, { ok: false, error: "Invalid Yjs state vector" });
        return;
      }

      const reconnectKey = JSON.stringify([roomId, username]);
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

      socket.join(getSocketRoom(roomId));
      userMap.set(socket.id, { username, roomId });
      addUserToRoom(roomId, username, socket.id);
      io.to(getSocketRoom(roomId)).emit("room-users", getUsersInRoom(roomId)); // Emit the updated list of users in the room to all clients in that room
      socket.emit("room-notifications", getRoomNotifications(roomId));
      if (!alreadyInRoom && !isReconnect) {
        const notification = createRoomNotification(
          `${username} joined the room`,
          "join",
        );
        addRoomNotification(roomId, notification);
        socket.to(getSocketRoom(roomId)).emit("room-notification", notification);
      }
      if (!currentUser) {
        socket.to(getSocketRoom(roomId)).emit("user-joined", {
          username,
          message: `${username} joined the room`,
        });
      }

      const ydoc = getRoomDoc(roomId);
      // The client applies this diff, then sends its missing edits back using
      // this server state vector. Neither side replaces its existing Y.Doc.
      socket.emit("yjs-init", {
        roomId,
        update: Y.encodeStateAsUpdate(ydoc, clientStateVector),
        stateVector: Y.encodeStateVector(ydoc),
      });

      socket.emit("receive-language", getRoomLanguage(roomId) || "javascript");
      socket.emit("room-joined", {
        roomId,
        username,
      });
      reply(acknowledge, { ok: true });
    });

    socket.on("yjs-update", (payload, acknowledge) => {
      const { roomId, update } = payload ?? {};
      if (!isRoomMember(socket, roomId)) {
        reply(acknowledge, { ok: false, error: "You must join this room before sending updates" });
        return;
      }

      try {
        const binaryUpdate = toUint8Array(update);
        // Parsing first prevents malformed updates from partly changing the
        // live document before applyUpdate throws.
        Y.decodeUpdate(binaryUpdate);
        Y.applyUpdate(getRoomDoc(roomId), binaryUpdate, socket.id);
        socket.to(getSocketRoom(roomId)).emit("yjs-update", { roomId, update: binaryUpdate });
        reply(acknowledge, { ok: true });
      } catch {
        reply(acknowledge, { ok: false, error: "Invalid Yjs update" });
      }
    });
    socket.on("language-change", (payload) => {
      const { roomId, language } = payload ?? {};
      if (!isRoomMember(socket, roomId) || !["javascript", "python", "cpp", "java"].includes(language)) return;
      setRoomLanguage(roomId, language);
      socket.to(getSocketRoom(roomId)).emit("receive-language", language);
    });
    socket.on(
      "cursor-position-change",
      (data) => {
        const { roomId, lineNumber, column } = data ?? {};
        if (
          !isRoomMember(socket, roomId) ||
          !Number.isInteger(lineNumber) || lineNumber < 1 ||
          !Number.isInteger(column) || column < 1
        ) return;

        const payload = {
          socketId: socket.id,
          username: userMap.get(socket.id).username,
          lineNumber,
          column,
        };

        socket.to(getSocketRoom(roomId)).emit("cursor-position-changed", {
          ...payload,
        });
      },
    );

    socket.on("leave-room", () => {
      const user = userMap.get(socket.id); // Retrieve the user information from the map using the socket ID
      if (!user) return;
      const { username, roomId } = user; // Retrieve the username and room ID from the map using the socket ID
      const notification = createRoomNotification(
        `${username} left the room`,
        "leave",
      );
      addRoomNotification(roomId, notification);
      socket.to(getSocketRoom(roomId)).emit("room-notification", notification);
      removeUserFromRoom(roomId, socket.id);
      if (getUsersInRoom(roomId).length === 0) {
        scheduleRoomCleanup(roomId);
      }
      socket.to(getSocketRoom(roomId)).emit("user-left", {
        username,
        message: `${username} left the room`,
      });
      socket.leave(getSocketRoom(roomId));
      userMap.delete(socket.id);
      io.to(getSocketRoom(roomId)).emit("room-users", getUsersInRoom(roomId));
      socket.disconnect(); // Disconnect the socket after leaving the room
    });

    socket.on("disconnect", () => {
      const user = userMap.get(socket.id);

      if (!user) {
        console.log("User disconnected:", socket.id);
        return;
      }

      const { username, roomId } = user;
      const reconnectKey = JSON.stringify([roomId, username]);

      socket.to(getSocketRoom(roomId)).emit("user-left", {
        username,
        message: `${username} disconnected`,
      });

      userMap.delete(socket.id);
      removeUserFromRoom(roomId, socket.id);
      if (getUsersInRoom(roomId).length === 0) {
        scheduleRoomCleanup(roomId);
      }
      io.to(getSocketRoom(roomId)).emit("room-users", getUsersInRoom(roomId));
      // Repeated disconnects for the same identity replace their grace timer.
      clearTimeout(disconnectTimers.get(reconnectKey));
      const disconnectTimer = setTimeout(() => {
        if (disconnectTimers.get(reconnectKey) !== disconnectTimer) return;
        disconnectTimers.delete(reconnectKey);

        const usersInRoom = getUsersInRoom(roomId);
        const hasRejoined = usersInRoom.some(
          (user) => user.username === username,
        );

        if (hasRejoined || usersInRoom.length === 0) {
          return;
        }

        const notification = createRoomNotification(
          `${username} disconnected`,
          "disconnect",
        );
        addRoomNotification(roomId, notification);
        io.to(getSocketRoom(roomId)).emit("room-notification", notification);
      }, 3000);

      disconnectTimers.set(reconnectKey, disconnectTimer);
    });
  });

  return io;
};

export const getIO = () => {
  // This function is used to get the Socket.IO server instance (io) that we initialized in initSocket. We will use this function in other parts of our server code (like in index.js) to emit events to clients from outside the socket connection handlers.
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
