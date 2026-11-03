import Header from "../components/Header";
import ActiveUsers from "../components/ActiveUsers";
import CodeEditor from "../components/CodeEditor";
import Notifications from "../components/Notifications";
import { useState, useEffect, useRef } from "react";
import { socket } from "../socket";
import { useNavigate, useParams } from "react-router-dom";
import * as Y from "yjs";
import { createRoomSync } from "../collaboration/roomSync";

function RoomEditor({ roomId }) {
  // One document for this room session, retained through rerenders and reconnects.
  const [ydoc] = useState(() => new Y.Doc());
  const ytext = ydoc.getText("code");
  const documentMountedRef = useRef(false);

  const navigate = useNavigate();
  const [username] = useState(() => {
    try {
      const savedRoom = JSON.parse(localStorage.getItem("roomData"));
      return savedRoom?.roomId === roomId && typeof savedRoom.username === "string"
        ? savedRoom.username
        : "";
    } catch {
      return "";
    }
  });
  const [language, setLanguage] = useState(
    () => localStorage.getItem(`syncforge-language-${roomId}`) || "javascript"
  );
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState(
    socket.connected ? "Connected" : "Disconnected"
  );
  const [remoteCursors, setRemoteCursors] = useState({});   

  useEffect(() => {
    documentMountedRef.current = true;
    return () => {
      documentMountedRef.current = false;
      // Strict Mode immediately sets the same session up again. On a real unmount,
      // wait until MonacoBinding has cleaned up before destroying the document.
      queueMicrotask(() => {
        if (!documentMountedRef.current) ydoc.destroy();
      });
    };
  }, [ydoc]);

  const handleLeaveRoom = () => {
    if (socket.connected) {
      socket.emit("leave-room");
    }
    localStorage.removeItem("roomData");
    localStorage.removeItem(`syncforge-language-${roomId}`);
    socket.disconnect();
    navigate("/");
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

  useEffect(() => {
    if (!username.trim()) {
      navigate("/");
      return;
    }

    const handleCursorPositionChanged = (cursorData) => {
      setRemoteCursors((prev) => ({
        ...prev,
        [cursorData.socketId]: cursorData,
      }));
    };

    const handleRoomUsers = (usersList) => {
      // usersList is coming from backend whenever there is a change
      // in active users in room, this function will update the users
      // state with that usersList
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

      localStorage.setItem(`syncforge-language-${roomId}`, newLanguage);
    };

    const handleRoomNotifications = (notificationsList) => {
      setNotifications(notificationsList);
    };

    const handleRoomNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 30));
    };

    

    socket.on("room-notifications", handleRoomNotifications);
    socket.on("room-notification", handleRoomNotification);
    socket.on("room-users", handleRoomUsers);
    socket.on("receive-language", handleReceiveLanguage);
    socket.on("cursor-position-changed", handleCursorPositionChanged);
    const stopSync = createRoomSync({
      socket,
      ydoc,
      roomId,
      username,
      onStatus: setConnectionStatus,
      onError: (error) => console.error("Yjs synchronization failed:", error),
    });

    return () => {
      // to prevent memory leaks, we need to clean up the event listeners
      // when the component unmounts or when dependencies change
      stopSync();
      socket.off("room-notifications", handleRoomNotifications);
      socket.off("room-notification", handleRoomNotification);
      socket.off("room-users", handleRoomUsers);
      socket.off("receive-language", handleReceiveLanguage);
      socket.off("cursor-position-changed", handleCursorPositionChanged);
      // Navigation away also removes this participant. Offline text remains in
      // ydoc during a temporary network disconnect while this page stays mounted.
      socket.disconnect();
    };
  }, [roomId, username, ydoc, navigate]);


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
          ytext={ytext}
          roomId={roomId}
          connectionStatus={connectionStatus}
          users={users}
          language={language}
          username={username}
          remoteCursors={remoteCursors}
          notifications={notifications}
          handleLanguageChange={handleLanguageChange}
        />

        <Notifications notifications={notifications} />
      </div>
    </>
  );
}

function EditorPage() {
  const { roomId } = useParams();
  // React Router can reuse a page when its params change; rooms must not share a doc.
  return <RoomEditor key={roomId} roomId={roomId} />;
}

export default EditorPage;
