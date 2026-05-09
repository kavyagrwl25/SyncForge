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


---
---
---


# 🧠 Monaco Editor Integration Flow

## Question

Why are we adding Monaco Editor?

## Problem

Currently, SyncForge uses a simple textarea for writing code.

Textarea is useful for testing real-time sync, but it does not provide a real coding experience.

It lacks:

- syntax highlighting
- proper code formatting
- editor-like UI
- language support

---

## Solution

We will replace the temporary textarea with Monaco Editor.

Monaco Editor is the browser-based code editor used in VS Code.

---

## Updated Flow

```txt
User writes code in Monaco Editor
        ↓
Editor triggers onChange
        ↓
Frontend updates code state
        ↓
Frontend emits "code-change"
        ↓
Server broadcasts code to same room
        ↓
Other users receive "receive-code"
        ↓
Their Monaco Editor updates in real-time
```

---

## Why This Improves SyncForge

- Makes the project look like a real collaborative code editor
- Gives VS Code-like editing experience
- Improves project quality for resume/demo
- Keeps the existing Socket.IO real-time flow unchanged

---

## Important Point

Monaco Editor only replaces the UI editor part.

The real-time logic remains the same:

```txt
code-change → server → receive-code
```

---
---
---

