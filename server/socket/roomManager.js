const roomUsers = {};

export const getUsersInRoom = (roomId) => {
  return roomUsers[roomId] || [];
};

export const addUserToRoom = (roomId, username, socketId) => {
  if (!roomUsers[roomId]) {
    roomUsers[roomId] = [];
  }

  const alreadyExists = roomUsers[roomId].some(
    (user) => user.socketId === socketId
  );

  if (!alreadyExists) {
    roomUsers[roomId].push({
      username,
      socketId,
    });
  }
};

export const removeUserFromRoom = (roomId, socketId) => {
  if (roomUsers[roomId]) {
    roomUsers[roomId] = roomUsers[roomId].filter(
      (user) => user.socketId !== socketId
    );

    if (roomUsers[roomId].length === 0) {
      delete roomUsers[roomId];
    }
  }
};