import { useState } from 'react'
import { socket } from "./socket";
import { useEffect } from 'react';
import './App.css'

function App() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");

  const handleJoinRoom = (e) => {
    e.preventDefault();

    if (!username.trim() || !roomId.trim()) {
      alert("Username and Room ID are required");
      return;
    }

    const roomData = { username, roomId };      // Create an object to store the username and room ID in localStorage
    localStorage.setItem("roomData", JSON.stringify(roomData));     // Store the room data in localStorage as a JSON string for later retrieval

    socket.connect();
    socket.emit("join-room", { username, roomId });
    console.log("Joined room:", { username, roomId });
  };

  useEffect(() => {
    const savedRoomData = localStorage.getItem("roomData");
    if (savedRoomData) {
      const { username, roomId } = JSON.parse(savedRoomData);
      setUsername(username);
      setRoomId(roomId);
      if (!socket.connected) {
        socket.connect();
      }
      socket.emit("join-room", { username, roomId });
      console.log("Auto rejoined room:", { username, roomId });
    }
    const handleUserJoined = (data) => {
      console.log("User joined:", data);
    };
    socket.on("user-joined", handleUserJoined);

    return () => {
      socket.off("user-joined", handleUserJoined);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="w-full max-w-md bg-slate-900 p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-center">SyncForge</h1>
        <p className="text-slate-400 text-center mt-2">
          Real-time collaborative code editor
        </p>

        <form onSubmit={handleJoinRoom} className="mt-8 space-y-4">
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 outline-none focus:border-sky-400"
          />

          <input
            type="text"
            placeholder="Enter room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 outline-none focus:border-sky-400"
          />

          <button className="w-full py-3 rounded-lg bg-sky-400 text-slate-950 font-semibold hover:bg-sky-300">
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;