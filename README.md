# 🚀 SyncForge

SyncForge is a real-time collaborative code editor that enables multiple users to write, edit, and collaborate on code simultaneously inside shared rooms.

Built with React, Node.js, Express, Monaco Editor, and Socket.IO, the project focuses on real-time synchronization, room-based collaboration, and scalable event-driven architecture.

---

# ✨ Features

- 👥 Room-based collaborative coding
- ⚡ Real-time code synchronization
- 🧠 Monaco Editor integration (VS Code-like editor)
- 🌐 Multi-language editor support
- 📡 Real-time communication using Socket.IO
- 🔄 Automatic room rejoin after refresh
- 🟢 Live active users sidebar
- 🧩 Event-driven architecture using WebSockets
- 🧹 Proper socket cleanup on leave/disconnect

---

# 🛠️ Tech Stack

## Frontend
- React.js
- Tailwind CSS
- Monaco Editor
- Socket.IO Client

## Backend
- Node.js
- Express.js
- Socket.IO

## Real-Time Communication
- WebSockets
- Socket.IO rooms & event broadcasting

---

# 🧠 How SyncForge Works

## 1. Room-Based Collaboration

Users join a shared room using a unique `roomId`.

```txt
User → join-room → Socket.IO Server
```

The server connects the user socket to the corresponding room.

---

## 2. Real-Time Code Synchronization

Whenever a user writes code:

```txt
Editor Change
      ↓
Frontend emits "code-change"
      ↓
Server broadcasts to same room
      ↓
Other users receive "receive-code"
      ↓
Editor updates instantly
```

---

## 3. Active User Tracking

The backend maintains room members in server memory using unique `socketId`s.

```txt
roomId → active users[]
```

Whenever users join, leave, or disconnect:

```txt
Backend updates room state
        ↓
Emits "room-users"
        ↓
Frontend sidebar updates automatically
```

---

## 4. Session Persistence

Room information is stored in `localStorage`:

```txt
username
roomId
```

This allows automatic room rejoin after page refresh.

---

# 📁 Project Structure

```txt
client/
│
├── components/
│   ├── JoinRoom.jsx
│   ├── CodeEditor.jsx
│   └── ActiveUsers.jsx
│
├── socket.js
└── App.jsx


server/
│
├── socket/
│   ├── socketHandler.js
│   └── roomManager.js
│
└── index.js
```

---

# ⚙️ Core Socket Events

| Event | Purpose |
|---|---|
| `join-room` | Join collaborative room |
| `code-change` | Send updated code |
| `receive-code` | Receive synchronized code |
| `room-users` | Sync active users list |
| `user-joined` | Notify room when user joins |
| `user-left` | Notify room when user leaves |

---

# 🚧 Current Status

✅ Real-time collaborative editing implemented  
✅ Active users synchronization implemented  
✅ Monaco Editor integrated  
✅ Room-based architecture completed  

Currently improving:
- realtime optimization
- editor experience
- scalability architecture

---

# 🚀 Future Improvements

## Realtime Optimization
- ⏱️ Debounced socket synchronization
- 🖱️ Live cursor synchronization
- ⚡ Reduced redundant socket emissions

## Persistence & Scalability
- 🗄️ PostgreSQL integration for persistent room/code storage
- 🔴 Redis for scalable room and session management
- 🐳 Docker-based deployment setup

## Collaboration Features
- 💬 In-room chat system
- 📝 Collaborative session history
- 📂 Save/load collaborative rooms

## Advanced Features
- 🔐 Authentication & access control
- 🤖 AI-assisted collaborative coding
- ☁️ Cloud deployment & horizontal scaling

---

# 📚 Key Learnings

- Real-time architecture using Socket.IO
- WebSocket lifecycle management in React
- Room-based event broadcasting
- State synchronization across multiple clients
- Active user management using socket IDs
- Event-driven backend design
- React state & effect management
- Building collaborative systems

---

# 🤝 Contributing

Contributions, suggestions, and feedback are always welcome.

Feel free to fork the project and improve it.

---

# 📬 Contact

If you'd like to collaborate, discuss ideas, or provide feedback, feel free to connect.