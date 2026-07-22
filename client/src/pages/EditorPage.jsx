import Header from "../components/Header";
import ActiveUsers from "../components/ActiveUsers";
import CodeEditor from "../components/CodeEditor";
import Notifications from "../components/Notifications";
import { useState, useEffect } from "react";
import { socket } from "../socket";
import { useNavigate, useParams } from "react-router-dom";

function EditorPage() {

  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [remoteCursors, setRemoteCursors] = useState({});   
  const {roomId} = useParams();

  const handleLeaveRoom = () => {
    if (socket.connected) {
      socket.emit("leave-room");
      
    }

    localStorage.removeItem("roomData");
    localStorage.removeItem(`syncforge-code-${roomId}`);
    localStorage.removeItem(`syncforge-language-${roomId}`);
    setUsers([]);
    setUsername("");
    setCode("");
    setNotifications([]);
    setRemoteCursors({});
    socket.disconnect();
    console.log("Left room");
    navigate("/");
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

  const handleCursorPositionChanged = (cursorData) => {
    console.log("[cursor][frontend] received cursor-position-changed", cursorData);

    setRemoteCursors((prev) => ({
      ...prev,
      [cursorData.socketId]: cursorData,
    }));
  };

  useEffect(() => {
    console.log("[cursor][frontend] remoteCursors state updated", remoteCursors);
  }, [remoteCursors]);

  useEffect(() => {      // My actions trigger normal event handlers WHILE Other users' actions are handled by socket listeners inside useEffect
    const savedRoomData = localStorage.getItem("roomData");

    if (savedRoomData) {
      const { username } = JSON.parse(savedRoomData);
      setUsername(username);
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
      socket.emit("join-room", { username, roomId });     // rejoin the room after refresh
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

      console.log("[cursor][frontend] room-users update", usersList);
      setUsers(usersList);
      setRemoteCursors((prev) =>
        Object.fromEntries(
          Object.entries(prev).filter(([socketId]) =>
            usersList.some((user) => user.socketId === socketId)
          )
        )
      );
    };

    const handleReceiveLanguage = (newLanguage) => {    // 
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
    socket.on("cursor-position-changed", handleCursorPositionChanged);
    socket.on("connect", () => {
      setConnectionStatus("Connected");
    });
    socket.on("disconnect", () => {
      setConnectionStatus("Disconnected");
    });
    socket.io.on("reconnect_attempt", () => {
      console.log("[socket][frontend] reconnect_attempt");
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
      socket.off("cursor-position-changed", handleCursorPositionChanged);
      socket.off("connect");
      socket.off("disconnect");
      socket.io.off("reconnect_attempt");
    };
  }, [roomId]);


  return (
    <>
      <Header
        roomId={roomId}
        connectionStatus={connectionStatus}
        handleLeaveRoom={handleLeaveRoom}
      />

      <div className="grid grid-cols-1 gap-6 items-start lg:grid-cols-[250px_1fr_280px]">
        <ActiveUsers users={users} />

        <CodeEditor
          roomId={roomId}
          connectionStatus={connectionStatus}
          users={users}
          code={code}
          language={language}
          username={username}
          remoteCursors={remoteCursors}
          notifications={notifications}
          handleCodeChange={handleCodeChange}
          handleLanguageChange={handleLanguageChange}
        />

        <Notifications notifications={notifications} />
      </div>
    </>
  );
}

export default EditorPage;