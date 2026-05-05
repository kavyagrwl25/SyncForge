import express from "express";
import http from "http";
import cors from "cors";
import { initSocket } from "./socket.js";

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

const server = http.createServer(app);

initSocket(server);

app.get("/", (req, res) => {
  res.send("SyncForge server is running");
});

server.listen(4000, () => {
  console.log("Server running on port 4000");
});