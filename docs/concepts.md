# 📘 Concepts Learned (Socket.io + Express)

### 1. Socket.io Setup

* Install `socket.io` (server) and `socket.io-client` (client)
* Create an HTTP server and attach Socket.io to it
* Listen for `connection` events on the server

---

### 2. Emitting & Listening Events

* `socket.emit()` → send events
* `socket.on()` → receive events
* Works on both client and server

---

### 3. Rooms in Socket.io

* `socket.join(room)` → join a room
* `socket.leave(room)` → leave a room
* `socket.to(room).emit()` → broadcast to room (except sender)

---

### 4. Handling Disconnections

* Listen for `disconnect` event
* Remove user / clean resources
* Notify other users if needed

---

### 5. Express + Socket.io Integration

* Create Express app
* Create HTTP server using Express
* Attach Socket.io to same server
* Single server handles:

  * HTTP APIs (Express)
  * Real-time events (Socket.io)

---

### 6. Key Insight

* Express is a **request handler**, not a server
* HTTP server is the **actual server** that listens for requests
* Socket.io extends the same server for real-time communication

----------------------------------

