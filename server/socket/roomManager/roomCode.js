const roomCode = {};

export const setRoomCode = (roomId, code) => {
  roomCode[roomId] = code;
};

export const getRoomCode = (roomId) => {
  return roomCode[roomId] || "";
};

export const deleteRoomCode = (roomId) => {
  delete roomCode[roomId];
};