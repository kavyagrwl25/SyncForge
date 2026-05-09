# 🔄 Real-Time Code Synchronization Flow

## 1. User Joins a Room

Frontend emits:

```txt
join-room
```

with:

```js
{
  username,
  roomId
}
```

Server:

- connects user socket
- joins socket to specific room using:

```js
socket.join(roomId)
```

---

## 2. User Types Code

User writes code inside textarea/editor.

Frontend updates local state:

```js
setCode(newCode)
```

and emits:

```txt
code-change
```

with:

```js
{
  roomId,
  code
}
```

---

## 3. Server Receives Updated Code

Backend listens for:

```txt
code-change
```

Server broadcasts updated code to all users in same room except sender:

```js
socket.to(roomId).emit("receive-code", code)
```

---

## 4. Other Users Receive Code

Frontend listens for:

```txt
receive-code
```

When event is received:

```js
setCode(newCode)
```

updates editor content instantly.

---

## 5. Final Real-Time Flow

```txt
User Types Code
        ↓
Frontend emits "code-change"
        ↓
Server receives updated code
        ↓
Server broadcasts to room
        ↓
Other clients receive "receive-code"
        ↓
Editor updates in real-time
```