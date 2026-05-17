const roomNotifications = {};

export const createRoomNotification = (message, type) => ({
  id: Date.now(),
  message,
  type,
  time: new Date().toLocaleTimeString(),
});

export const getRoomNotifications = (roomId) => {
  return roomNotifications[roomId] || [];
};

export const addRoomNotification = (roomId, notification) => {
  if (!roomNotifications[roomId]) {
    roomNotifications[roomId] = [];
  }

  roomNotifications[roomId] = [
    notification,
    ...roomNotifications[roomId],
  ].slice(0, 30);
};

export const deleteRoomNotifications = (roomId) => {
  delete roomNotifications[roomId];
};
