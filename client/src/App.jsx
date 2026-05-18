import { useState, useEffect } from "react";
import { socket } from "./socket";
import JoinRoom from "./components/JoinRoom";
import CodeEditor from "./components/CodeEditor";
import ActiveUsers from "./components/ActiveUsers";
import Notifications from "./components/Notifications";
import Header from "./components/Header"; 
import throttle from "lodash/throttle";

function App() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");

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
    }

    localStorage.removeItem("roomData");
    localStorage.removeItem(`syncforge-code-${roomId}`);
    localStorage.removeItem(`syncforge-language-${roomId}`);
    setUsers([]);
    setUsername("");
    setRoomId("");
    setCode("");
    setNotifications([]);

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
    if (roomId) {
      socket.emit("language-change", {
        roomId,       // emit a language-change event to the backend with the new language and roomId, so that the backend can broadcast the new language to all users in the room
        language: newLanguage
      });
    }
  };

  useEffect(() => {                                 // My action â†’ handler function &&&& Other user's action â†’ useEffect listener
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

    const handleReceiveLanguage = (newLanguage) => {
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

    const handleRoomNotifications = (notificationsList) => {
      setNotifications(notificationsList);
    };

    const handleRoomNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 30));
    };

    socket.on("receive-code", handleReceiveCode);   // whenever receive-code is emitted, run handleReceiveCode function
    socket.on("room-notifications", handleRoomNotifications);
    socket.on("room-notification", handleRoomNotification);
    socket.on("room-users", handleRoomUsers);
    socket.on("receive-language", handleReceiveLanguage);
    socket.on("connect", () => {
      setConnectionStatus("Connected");
    });
    socket.on("disconnect", () => {
      setConnectionStatus("Disconnected");
    });
    socket.io.on("reconnect_attempt", () => {
      setConnectionStatus("Reconnecting...");
    });

    return () => {
      // to prevent memory leaks, we need to clean up the event listeners
      // when the component unmounts or when dependencies change

      socket.off("room-notifications", handleRoomNotifications);
      socket.off("room-notification", handleRoomNotification);
      socket.off("receive-code", handleReceiveCode);
      socket.off("room-users", handleRoomUsers);
      socket.off("receive-language", handleReceiveLanguage);
      socket.off("connect");
      socket.off("disconnect");
      socket.io.off("reconnect_attempt");
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <JoinRoom
          username={username}
          setUsername={setUsername}
          roomId={roomId}
          setRoomId={setRoomId}
          handleJoinRoom={handleJoinRoom}
          handleLeaveRoom={handleLeaveRoom}
        />
        <Header roomId={roomId} connectionStatus={connectionStatus} />

        <div className="grid grid-cols-1 gap-6 items-start lg:grid-cols-[250px_1fr_280px]">
          <ActiveUsers users={users} />
          <CodeEditor
            code={code}
            language={language}
            setLanguage={setLanguage}
            handleCodeChange={handleCodeChange}
            handleLanguageChange={handleLanguageChange}
          />
          <Notifications notifications={notifications} />
        </div>
      </div>
    </div>
  );
}

export default App;
