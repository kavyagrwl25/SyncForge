import * as Y from "yjs";

const roomDocs = new Map();         // Stores room IDs and their corresponding Yjs documents

export const getRoomDoc = (roomId) => {
  if (!roomDocs.has(roomId)) {
    const ydoc = new Y.Doc();               // Creates a new Yjs doc for a room if it doesn't exist already
    roomDocs.set(roomId, ydoc);
  }

  return roomDocs.get(roomId);
};

export const deleteRoomDoc = (roomId) => {
  const ydoc = roomDocs.get(roomId);
  if (!ydoc) return;

  ydoc.destroy();
  roomDocs.delete(roomId);
};

export const destroyRoomDocs = () => {
  for (const roomId of roomDocs.keys()) {
    deleteRoomDoc(roomId);
  }
};
