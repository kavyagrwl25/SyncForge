import express from "express";      // express here is a request manager for my http server which will handle incoming requests from client and send responses back to client
import http from "http";          // this is actually the http server which will listen for incoming requests from client which will be handled by express request manager and send responses back to client
import cors from "cors";          // cors is a middleware that allows cross-origin requests from the client to the server, which is necessary for our application since the client and server are running on different ports
import { initSocket } from "./socket/socketHandler.js";     // this is a function that initializes the socket connection to the server and handles all the socket events that are emitted from the client and server

const app = express();    // request manager for my http server

app.use(cors({                              // allow requests from this origin and allow credentials to be sent with requests (like cookies or authorization headers)
  origin: "http://localhost:5173",
  credentials: true,
}));

const server = http.createServer(app);      // this is my http server which will recieve requests from client

initSocket(server);     // i am initializing socket connection to server to handle requests that need real time communication between client and server

app.get("/", (req, res) => {
  res.send("SyncForge server is running");
});

server.listen(4000, () => {
  console.log("Server running on port 4000");     // this is the port on which my server will listen for incoming requests
});