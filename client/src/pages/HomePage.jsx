import {useEffect} from 'react'
import JoinRoom from '../components/JoinRoom'
import { socket } from '../socket';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage() {

   const navigate = useNavigate();  // used to navigate to the editor page after joining a room
   const [username, setUsername] = useState("");  // used to store the username of the user
   const [roomId, setRoomId] = useState(""); // used to store the roomId of the room that the user wants to join
   


   const handleJoinRoom = (e) => {    // handle the join room event, which is triggered when the user clicks the join button and see it is emiting a socket.io event to backend with the username and roomId, which will be handled by the backend to join the user to the room and then emit a ("room-joined") event to the frontend with the roomId, which will be handled in useEffect to navigate to the editor page with the roomId as a parameter in the URL
    e.preventDefault();
    if (!username.trim() || !roomId.trim()) {
      alert("Username and Room ID are required");
      return;
    }
    const roomData = { username, roomId };
    localStorage.setItem("roomData", JSON.stringify(roomData));   // store the room data in local storage so that it can be retrieved later for reconnecting to the room if the user refreshes the page or closes the browser
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit("join-room", roomData);
    console.log("Joined room:", roomData);
  };




  useEffect(() => {         // after handleJoinRoom is called, the backend will listen to socket.io event ("join-room") using (socket.on()) and then emit a ("room-joined") event to the frontend with the roomId, which will be handled here to navigate to the editor page with the roomId as a parameter in the URL
    const handleRoomJoined = ({ roomId }) => {
      console.log("Joined room:", { roomId });
      navigate(`/editor/${roomId}`); // navigate to the editor page with the roomId as a parameter in the URL using react-router-dom's useNavigate hook
    };

    socket.on("room-joined", handleRoomJoined);

    return () => {
      socket.off("room-joined", handleRoomJoined);    // cleanup the event listener when the component unmounts to prevent memory leaks and duplicate event handling (as without cleanup, we could leave old event listeners attached)
    };
  }, [navigate]);



  return (
    <div>
      <JoinRoom {...{ username, setUsername, roomId, setRoomId, handleJoinRoom }} />
    </div>
  )
}

export default HomePage
