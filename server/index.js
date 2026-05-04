import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", ({ username, roomId }) => {
    socket.join(roomId);

    console.log(`${username} joined room ${roomId}`);

    socket.to(roomId).emit("user-joined", {
      username,
      message: `${username} joined the room`,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("SyncForge server is running");
});

server.listen(4000, () => {
  console.log("Server running on port 4000");
});