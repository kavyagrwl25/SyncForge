# 🚀 SyncForge

A real-time collaborative code editor that enables multiple users to write and edit code together simultaneously in shared rooms.

---

## ✨ Features

- 👥 Join shared coding rooms
- ⚡ Real-time code synchronization across users
- 🤝 Multi-user collaboration with instant updates
- 🔄 Automatic rejoin on refresh (session persistence)
- 📡 Event-driven communication using Socket.IO

---

## 🛠️ Tech Stack

**Frontend**
- React (Hooks, useEffect, state management)

**Backend**
- Node.js
- Express.js

**Real-time Communication**
- Socket.IO (WebSockets + fallback polling)

---

## 🧠 How It Works

- Users join a room using a unique `roomId`
- Socket.IO establishes a persistent connection with the server
- Code changes are emitted as events and broadcasted to all users in the same room
- React listens to socket events and updates the UI in real time
- LocalStorage is used to persist session data and enable auto-rejoin after refresh

---

## 📁 Project Structure

client/     → React frontend  
server/     → Express + Socket.IO backend  
docs/       → Concepts and technical notes  

---

## 🚧 Current Status

MVP in progress — core real-time collaboration features are being implemented.

---

## 🎯 Future Improvements

- 👀 Show active users in a room
- 💬 In-app chat system
- 📝 Code editor integration (Monaco / CodeMirror)
- 🔐 Authentication & access control
- ☁️ Deployment & scaling

---

## 📌 Key Learnings

- Real-time communication using Socket.IO
- Managing WebSocket lifecycle in React (useEffect)
- Handling state persistence across refresh
- Event-driven system design

---

## 🤝 Contributing

This project is currently under active development. Contributions and suggestions are welcome!

---

## 📬 Contact

Feel free to connect for collaboration or feedback.