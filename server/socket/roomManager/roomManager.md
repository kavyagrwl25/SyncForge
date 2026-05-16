# 🧠 Room Manager

## What is Room Manager?

`roomManager` is responsible for managing all temporary room session data in backend memory.

It stores and controls the live state of every active room in SyncForge.

---

# Why do we need it?

In a real-time collaborative app:

- Multiple users join rooms
- Code changes continuously
- Language changes in real time
- Users disconnect/reconnect

Backend needs a central place to store and manage this temporary room data.

That is the job of `roomManager`.

---

# What does it store?

## 1. Room Users

Tracks active users inside each room.

Example:

```js
{
  room1: [
    { username: "A", socketId: "123" },
    { username: "B", socketId: "456" }
  ]
}
```

Used for:

- Active users list
- Join/leave updates
- User synchronization

---

## 2. Room Code

Stores latest code of each room.

Example:

```js
{
  room1: "console.log('Hello')"
}
```

Used for:

- Real-time code synchronization
- Giving latest code to newly joined users

---

## 3. Room Language

Stores currently selected programming language.

Example:

```js
{
  room1: "javascript"
}
```

Used for:

- Real-time language synchronization

---

# Important Concept

This data is stored only in backend memory.

So:

```txt
Backend restart = all room data lost
```

This is called:

```txt
In-memory session storage
```

---

# Why separate Room Manager files?

Instead of keeping everything directly inside socket handlers:

```txt
socket.js becomes messy and hard to manage
```

We separate logic into dedicated room manager files.

Benefits:

- Cleaner code
- Better scalability
- Easier debugging
- Reusable room logic
- Easier future migration to Redis/database

---

# Current Architecture

```txt
Socket Events
     ↓
Room Manager
     ↓
In-Memory Room State
```

---

# Future Scaling

Later this same architecture can use:

- Redis → shared temporary room storage
- MongoDB → permanent project saving

without changing frontend logic.

---

# Mental Model

```txt
Room Manager = Brain of all active room sessions
```