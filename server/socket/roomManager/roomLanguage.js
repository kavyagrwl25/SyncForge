const roomLanguage = {};

export const getRoomLanguage = (roomId) => {
  return roomLanguage[roomId] || "javascript";   // default language is javascript if not set
};

export const setRoomLanguage = (roomId, language) => {
  roomLanguage[roomId] = language;
};

export const deleteRoomLanguage = (roomId) => {
  delete roomLanguage[roomId];
};