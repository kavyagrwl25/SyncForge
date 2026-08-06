# 🚀 SyncForge

SyncForge is a **real-time collaborative code editor** that enables multiple developers to write, edit, and collaborate on code simultaneously inside isolated collaborative workspaces (rooms).

Built using **React.js, Node.js, Express.js, Monaco Editor, and Socket.IO**, SyncForge is designed around an **event-driven architecture** to provide low-latency synchronization, efficient state management, and scalable real-time communication.

The project is currently optimized for real-time collaboration while being architected for future horizontal scaling using **Redis**, **PostgreSQL**, and containerized deployment.

---

# ✨ Features

## 👥 Real-Time Collaboration

- Multi-user collaborative code editing
- Room-based collaboration
- Low-latency code synchronization using WebSockets
- Real-time programming language synchronization
- Live active users tracking
- Automatic room rejoin after browser refresh
- Connection status monitoring & automatic reconnection

---

## 🧠 Editor Experience

- Monaco Editor (VS Code Editor)
- Multi-language syntax highlighting
- Live remote cursor synchronization
- Cursor rendering using Monaco `deltaDecorations`
- Responsive editor layout
- Real-time collaborative editing

---

## 📡 Event-Driven Communication

- Bidirectional communication using Socket.IO
- Room-based event broadcasting
- Automatic socket lifecycle management
- Proper listener cleanup to prevent memory leaks
- State synchronization across connected clients

---

# 🏗️ System Architecture

```text
                React Client
                     │
             Socket.IO Client
                     │
────────────────────────────────────
            Socket.IO Server
────────────────────────────────────
        │                      │
 Room Manager          Event Dispatcher
        │                      │
 Active Room State     Event Broadcasting
        │
 In-Memory Room Store
        │
   (Future → Redis)
```

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
- Event-Driven Architecture
- Socket.IO Rooms
- Event Broadcasting

## Future Infrastructure

- Redis
- PostgreSQL
- Docker
- Nginx

---

# ⚙️ How SyncForge Works

## 1. Room-Based Collaboration

Each collaborative session is identified by a unique `roomId`.

When a user joins:

```text
Client
   │
join-room
   │
Server
   │
Socket joins room
   │
Broadcast room state
```

Socket.IO Rooms ensure that synchronization events remain isolated to users inside the same collaborative session.

---

## 2. Real-Time Code Synchronization

Whenever a user edits code:

```text
Editor Change
      │
      ▼
code-change
      │
      ▼
Socket.IO Server
      │
      ▼
Broadcast to Room
      │
      ▼
receive-code
      │
      ▼
Remote Editors Update
```

The current implementation synchronizes the latest editor content across all connected users.

Future versions will support **incremental synchronization** by transmitting only document changes rather than the complete editor content.

---

## 3. Live Cursor Synchronization

Every cursor movement generates a lightweight synchronization event.

```text
Cursor Movement
       │
cursor-position-change
       │
Server Broadcast
       │
Remote Clients
       │
deltaDecorations()
```

Monaco Editor decorations are used to render remote users' cursors in real time.

---

## 4. Active User Management

The backend maintains an in-memory mapping between rooms and connected users.

```text
roomId
   │
 ├── socketA
 ├── socketB
 └── socketC
```

Whenever users join, leave, or disconnect, the server updates the room state and broadcasts the latest participant list.

---

## 5. Session Persistence

Collaborative session information is stored in `localStorage`.

```text
username
roomId
language
code
```

After a browser refresh, users automatically reconnect and restore their previous collaborative session.

---

# ⚡ Performance Optimizations

Current optimizations include:

- Efficient state management using React Hooks
- Persistent editor references using `useRef`
- Proper Socket.IO listener cleanup
- Room-scoped event broadcasting
- Monaco `deltaDecorations` for efficient cursor updates
- Automatic reconnection handling
- Optimized React rendering by avoiding unnecessary re-renders

---

# 🚀 Planned Optimizations (Currently Working on it)

## Debounced Code Synchronization

Instead of emitting a socket event on every keystroke:

```text
Typing
↓↓↓↓↓↓↓↓↓↓↓↓

Current
Emit every key

Future
Debounce
Emit after user pauses typing
```

Benefits:

- Reduced network traffic
- Fewer unnecessary socket events
- Improved scalability

---

## Throttled Cursor Synchronization

Cursor movement generates a high frequency of events.

Future implementation:

```text
Current
120 cursor events/sec

↓

Future
20 cursor events/sec
```

Benefits:

- Lower bandwidth consumption
- Reduced server workload
- Smooth cursor visualization

---

## Incremental Synchronization

Instead of synchronizing the complete document:

```text
Current
Entire editor content

↓

Future
Only changed text range
```

Potential future synchronization strategies:

- Operational Transformation (OT)
- Conflict-Free Replicated Data Types (CRDT)

---

# 🔴 Redis Integration

To support horizontal scaling, Redis will be introduced as a distributed in-memory data store.

## Redis will manage

- Active collaborative rooms
- Connected users
- Socket mappings
- Temporary collaborative session state
- Shared application cache

Instead of:

```text
roomId
   │
Server Memory
```

Room state becomes:

```text
roomId
   │
Redis
```

allowing every backend instance to access the same shared room information.

---

## Socket.IO Redis Adapter

When multiple backend servers are deployed:

```text
          Client
             │
      ┌──────┴──────┐
      │             │
   Server A      Server B
      │             │
      └──────┬──────┘
             │
      Redis Pub/Sub
```

Redis Pub/Sub enables Socket.IO events emitted on one server to automatically propagate to sockets connected to every other server.

This allows SyncForge to scale horizontally without breaking real-time synchronization.

---

# 🗄️ PostgreSQL Integration

PostgreSQL will provide persistent storage for:

- Collaborative rooms
- Code snapshots
- User accounts
- Collaboration history
- Project metadata
- Audit logs

Redis will serve as the high-speed cache while PostgreSQL becomes the permanent source of truth.

---

# 📈 Scalability Roadmap

- Redis Pub/Sub
- Socket.IO Redis Adapter
- PostgreSQL persistence
- Docker containerization
- Nginx reverse proxy
- Horizontal backend scaling
- Stateless server architecture
- Rate limiting
- Event acknowledgements
- Monitoring & logging
- Cloud deployment

---

# 🧠 Engineering Concepts Demonstrated

- Event-driven architecture
- WebSocket communication
- Bidirectional client-server synchronization
- Room-based event isolation
- Real-time collaborative systems
- React lifecycle management
- Socket lifecycle management
- Event registration & cleanup
- Efficient rendering using `useRef`
- Client-side session persistence
- Low-latency communication
- Scalable backend architecture
- State synchronization
- Connection recovery

---

# 📚 Key Learnings

- Building production-style collaborative applications
- Designing scalable event-driven systems
- Real-time synchronization with Socket.IO
- React state & effect management
- WebSocket lifecycle management
- Efficient frontend rendering
- Debouncing & throttling real-time events
- Distributed architecture with Redis
- Persistent storage strategies
- Preparing applications for horizontal scalability

---

# 🤝 Contributing

Contributions, suggestions, and feedback are always welcome.

Feel free to fork the repository, open issues, or submit pull requests.

---

# 📬 Contact

If you'd like to collaborate, discuss ideas, or provide feedback, feel free to connect!
