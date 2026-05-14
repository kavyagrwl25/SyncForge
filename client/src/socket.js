import { io } from "socket.io-client";

export const socket = io("http://localhost:4000", {
  autoConnect: false,
});


// This file is responsible for creating and exporting the Socket.IO client instance that will be used throughout the React application to communicate with the server. By centralizing the socket connection in this file, we can easily manage and reuse the same socket instance across different components without having to create multiple connections. The socket is configured to connect to the server at "http://localhost:4000" and is set to not automatically connect, allowing us to control when the connection is established (for example, after a user joins a room).