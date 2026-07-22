import {useEffect} from 'react'
import JoinRoom from '../components/JoinRoom'
import { socket } from '../socket';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage() {

   const navigate = useNavigate();
   const [username, setUsername] = useState("");
   const [roomId, setRoomId] = useState("");
   
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


  useEffect(() => {
    const handleRoomJoined = ({ roomId }) => {
      console.log("Joiend room:", { roomId });
      navigate(`/editor/${roomId}`);
    };

    socket.on("room-joined", handleRoomJoined);

    return () => {
      socket.off("room-joined", handleRoomJoined);
    };
  }, [navigate]);

  return (
    <div>
      <JoinRoom {...{ username, setUsername, roomId, setRoomId, handleJoinRoom }} />
    </div>
  )
}

export default HomePage
