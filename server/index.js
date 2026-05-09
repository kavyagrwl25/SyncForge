import express from "express";
import http from "http";
import cors from "cors";
import { initSocket } from "./socket.js";

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