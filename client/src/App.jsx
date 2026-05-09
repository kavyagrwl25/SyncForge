import { useState, useEffect } from "react";
import { socket } from "./socket";
import JoinRoom from "./components/JoinRoom";
import CodeEditor from "./components/CodeEditor";
import ActiveUsers from "./components/ActiveUsers";
import "./App.css";

function App() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [users, setUsers] = useState([]);

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
    setUsers([]);
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

    const handleRoomUsers = (usersList) => {
      setUsers(usersList);
    };

    socket.on("receive-code", handleReceiveCode);   // whenever recieve-code is emitted, run handleReceiveCode function
    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("room-users", handleRoomUsers);

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("receive-code", handleReceiveCode);
      socket.off("room-users", handleRoomUsers);
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

        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
          <ActiveUsers users={users} />
          <CodeEditor
            code={code}
            language={language}
            setLanguage={setLanguage}
            handleCodeChange={handleCodeChange}
          />
        </div>
      </div>
    </div>
  );
}

export default App;