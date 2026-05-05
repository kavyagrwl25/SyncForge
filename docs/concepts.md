# Concepts Learned

## Socket.IO Basics
- socket.emit → send event
- socket.on → receive event
- socket.join → add socket to room
- socket.to(room).emit → broadcast except sender

## Rooms
- Automatically created
- Stored in server memory 
- Used for grouping users

## Server Memory
- (Server memory is temporary RAM storage used by the backend during runtime—for example, in TeamForge req.user exists only during a request in memory, while actual user data is stored permanently in MongoDB.)
- Temporary storage (RAM)
- Lost on server restart

## useEffect
- Runs after component render
- Used for side effects like sockets