import { useState } from 'react'
import { socket } from "./socket";
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

    socket.connect();
    socket.on("connect", () => {
      socket.emit("join-room", { username, roomId });
    });
    console.log("Joined room:", { username, roomId });
  };

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