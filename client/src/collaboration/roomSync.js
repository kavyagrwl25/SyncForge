import * as Y from "yjs";

const REMOTE_ORIGIN = "socket-remote";

// Socket.IO can deliver binary data as either a typed array or an ArrayBuffer.
const toUint8Array = (value) => {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  throw new TypeError("Expected a binary Yjs update");
};

// Keep networking separate from React so the real protocol can be integration-tested.
export function createRoomSync({
  socket,
  ydoc,
  roomId,
  username,
  onStatus = () => {},
  onError = () => {},
}) {
  let active = true;
  let initialized = false;

  const reportError = (error) => {
    if (!active) return;
    onStatus("Sync error");
    onError(error);
  };

  const sendUpdate = (update) => {
    socket.emit("yjs-update", { roomId, update }, (result) => {
      if (result?.ok === false) reportError(new Error(result.error));
    });
  };

  const handleLocalUpdate = (update, origin) => {
    // Offline edits stay in this Y.Doc. The next handshake sends the missing data.
    if (origin !== REMOTE_ORIGIN && initialized && socket.connected) {
      sendUpdate(update);
    }
  };

  const handleInit = (payload) => {
    if (!active || payload?.roomId !== roomId) return;
    try {
      const serverVector = toUint8Array(payload.stateVector);
      Y.applyUpdate(ydoc, toUint8Array(payload.update), REMOTE_ORIGIN);
      // Complete the other direction too: the server may have missed our offline edits.
      initialized = true;
      sendUpdate(Y.encodeStateAsUpdate(ydoc, serverVector));
      onStatus("Connected");
    } catch (error) {
      initialized = false;
      reportError(error);
    }
  };

  const handleRemoteUpdate = (payload) => {
    if (!active || payload?.roomId !== roomId) return;
    try {
      Y.applyUpdate(ydoc, toUint8Array(payload.update), REMOTE_ORIGIN);
    } catch (error) {
      reportError(error);
    }
  };

  const joinRoom = () => {
    initialized = false;
    onStatus("Reconnecting...");
    socket.emit("join-room", {
      roomId,
      username,
      stateVector: Y.encodeStateVector(ydoc),
    }, (result) => {
      if (result?.ok === false) reportError(new Error(result.error));
    });
  };

  const handleDisconnect = () => {
    initialized = false;
    onStatus("Disconnected");
  };
  const handleConnectError = () => onStatus("Disconnected");
  const handleReconnectAttempt = () => onStatus("Reconnecting...");

  ydoc.on("update", handleLocalUpdate);
  socket.on("yjs-init", handleInit);
  socket.on("yjs-update", handleRemoteUpdate);
  socket.on("connect", joinRoom);
  socket.on("disconnect", handleDisconnect);
  socket.on("connect_error", handleConnectError);
  socket.io.on("reconnect_attempt", handleReconnectAttempt);

  // Register every listener before joining, including on an already connected socket.
  if (socket.connected) joinRoom();
  else socket.connect();

  return () => {
    active = false;
    initialized = false;
    ydoc.off("update", handleLocalUpdate);
    socket.off("yjs-init", handleInit);
    socket.off("yjs-update", handleRemoteUpdate);
    socket.off("connect", joinRoom);
    socket.off("disconnect", handleDisconnect);
    socket.off("connect_error", handleConnectError);
    socket.io.off("reconnect_attempt", handleReconnectAttempt);
  };
}
