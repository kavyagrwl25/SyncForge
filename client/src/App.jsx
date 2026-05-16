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
    localStorage.setItem("roomData", JSON.stringify(roomData));   // store the room data in local storage so that it can be retrieved later
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
    localStorage.removeItem(`syncforge-code-${roomId}`);
    localStorage.removeItem(`syncforge-language-${roomId}`);
    setUsers([]);
    setUsername("");
    setRoomId("");
    setCode("");

    console.log("Left room");
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    localStorage.setItem(`syncforge-code-${roomId}`, newCode);// store the current code in local storage so that it can be retrieved later and that too based on roomId, because different rooms have different code
    if (roomId) {
      socket.emit("code-change", {
        roomId,
        code: newCode,
      });
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem(`syncforge-language-${roomId}`, newLanguage); // store the selected language in local storage so that it can be retrieved later that too based on roomId, because different rooms can have different languages
    if(roomId) {
      socket.emit("language-change", {
        roomId,       // emit a language-change event to the backend with the new language and roomId, so that the backend can broadcast the new language to all users in the room
        language: newLanguage
      });
    }
  }

  useEffect(() => {                                 // My action → handler function &&&& Other user's action → useEffect listener

    const savedRoomData = localStorage.getItem("roomData");

    if (savedRoomData) {
      const { username, roomId } = JSON.parse(savedRoomData);
      setUsername(username);
      setRoomId(roomId);
      // restore room specific language and code from local storage after refresh
      const savedLanguage = localStorage.getItem(`syncforge-language-${roomId}`);
      const savedCode = localStorage.getItem(`syncforge-code-${roomId}`);
      if (savedCode) {
        setCode(savedCode);
      }
      if (savedLanguage) {
        setLanguage(savedLanguage);
      }
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

      // update the latest received code in local storage
      // so that refresh restores latest collaborative code

      const currentRoomData = JSON.parse(localStorage.getItem("roomData"));

      if (currentRoomData?.roomId) {
        localStorage.setItem(
          `syncforge-code-${currentRoomData.roomId}`,
          newCode
        );
      }
    };

    const handleRoomUsers = (usersList) => {  
      // usersList is coming from backend whenever there is a change
      // in active users in room, this function will update the users
      // state with that usersList

      setUsers(usersList);
    };

    const handleLanguageChanged = (newLanguage) => {
      setLanguage(newLanguage);

      // update latest received language in local storage

      const currentRoomData = JSON.parse(localStorage.getItem("roomData"));

      if (currentRoomData?.roomId) {
        localStorage.setItem(
          `syncforge-language-${currentRoomData.roomId}`,
          newLanguage
        );
      }
    };

    socket.on("receive-code", handleReceiveCode);   // whenever receive-code is emitted, run handleReceiveCode function
    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("room-users", handleRoomUsers);
    socket.on("language-changed", handleLanguageChanged);

    return () => {
      // to prevent memory leaks, we need to clean up the event listeners
      // when the component unmounts or when dependencies change

      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("receive-code", handleReceiveCode);
      socket.off("room-users", handleRoomUsers);
      socket.off("language-changed", handleLanguageChanged);
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
            handleLanguageChange={handleLanguageChange}
          />
        </div>
      </div>
    </div>
  );
}

export default App;