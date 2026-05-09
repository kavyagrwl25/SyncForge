import { useState, useEffect } from "react";
import { socket } from "./socket";
import JoinRoom from "./components/JoinRoom";
import CodeEditor from "./components/CodeEditor";
import "./App.css";

function App() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [code, setCode] = useState("");

  const handleJoinRoom = (e) => {
    e.preventDefault();

    if (!username.trim() || !roomId.trim()) {
      alert("Username and Room ID are required");
      return;
    }

    const roomData = { username, roomId };

    localStorage.setItem("roomData", JSON.stringify(roomData));

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join-room", roomData);

    console.log("Joined room:", roomData);
  };

  const handleLeaveRoom = () => {
    if (socket.connected) {
      socket.emit("leave-room");
      socket.disconnect();
    }

    localStorage.removeItem("roomData");

    setUsername("");
    setRoomId("");
    setCode("");

    console.log("Left room");
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);

    if (roomId) {
      socket.emit("code-change", {
        roomId,
        code: newCode,
      });
    }
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
    }

    const handleUserJoined = (data) => {
      console.log("User joined:", data);
    };

    const handleUserLeft = (data) => {
      console.log("User left:", data);
    };

    const handleReceiveCode = (newCode) => {
      setCode(newCode);
    };

    socket.on("receive-code", handleReceiveCode);
    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("receive-code", handleReceiveCode);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <JoinRoom
          username={username}
          setUsername={setUsername}
          roomId={roomId}
          setRoomId={setRoomId}
          handleJoinRoom={handleJoinRoom}
          handleLeaveRoom={handleLeaveRoom}
        />

        <CodeEditor code={code} handleCodeChange={handleCodeChange} />
      </div>
    </div>
  );
}

export default App;