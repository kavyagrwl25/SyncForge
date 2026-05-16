// this roomUsers is basically just a simple in-memory store object for users in room. In production, you would want to use a more robust solution like Redis or a database to handle this data, especially if you have multiple server instances. Currently, this implementation will only work if you have a single server instance running, as the data is stored in memory and will not be shared across multiple instances.

// We created this file just to implement active users in room feature. Shortly if i say, "Hey, how many users are in room with id 123?", this file will be responsible to answer that question by looking into the roomUsers object and returning the list of users in that room. Similarly, when a user joins or leaves a room, this file will update the roomUsers object accordingly.

const roomUsers = {};   //ubject to store users in room, where key is roomId and value is array of users in that room. Each user is an object with username and socketId properties.

export const getUsersInRoom = (roomId) => {   // to get list of users in a room
  return roomUsers[roomId] || [];
};

export const addUserToRoom = (roomId, username, socketId) => {    // to add a user to a room, basically to update the roomUsers object by adding this user to this room
  if (!roomUsers[roomId]) {
    roomUsers[roomId] = [];     // if room does not exist, first create that room array in the roomUsers object
  };

  const alreadyExists = roomUsers[roomId].some(   // Check if the user of same socketId already exists in the room to prevent duplicates
    (user) => user.socketId === socketId
  );

  const user = {
    username,
    socketId
  };

  if (!alreadyExists) {
    roomUsers[roomId].push(user);         // push user object to the room
  }
};

export const removeUserFromRoom = (roomId, socketId) => {    // to remove a user from a room, basically to update the roomUsers object by removing this user from this room
  if (roomUsers[roomId]) {
    roomUsers[roomId] = roomUsers[roomId].filter(
      (user) => user.socketId !== socketId
    );

    if (roomUsers[roomId].length === 0) {
      delete roomUsers[roomId];
    }
  }
};