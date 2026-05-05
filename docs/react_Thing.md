# ⚛️ React Basics (for SyncForge)

## 1. useState

* Used to store and update data in a component

```js
const [username, setUsername] = useState("");
```

* Changing state → re-renders component

---

## 2. Event Handlers

* Functions triggered by user actions (click, submit)

```js
const handleJoinRoom = (e) => {
  e.preventDefault();           // Prevents page refresh on form submit
};
```

* Used for:

  * Joining room
  * Sending data to server

---

## 3. useEffect

* Used for **side effects (runs automatically)**

```js
useEffect(() => {
  // logic
}, []);
```

* `[]` → runs only once (on mount)

---

## 4. Why useEffect with Socket.io?

Used for:

* Setting up listeners (`socket.on`)
* Cleaning up listeners (`socket.off`)
* Restoring data after refresh

---

## 5. Cleanup in useEffect

```js
return () => {
  socket.off("event", handler);
};
```

* Prevents duplicate listeners

---

## 6. Page Refresh Behavior

* React state is lost on refresh
* Socket connection is also lost
* User leaves room automatically

---

## 7. Fix: Persist Data

```js
localStorage.setItem("roomData", JSON.stringify({ username, roomId }));
```

* `localStorage` survives refresh

---

## 8. Auto Rejoin Logic

```js
useEffect(() => {
  const data = JSON.parse(localStorage.getItem("roomData"));

  if (data) {
    socket.connect();
    socket.emit("join-room", data);
  }
}, []);
```

---

## 9. Key Difference

| Task             | Where         |
| ---------------- | ------------- |
| User action      | Event handler |
| Listen to events | useEffect     |
| Setup / cleanup  | useEffect     |
| Restore data     | useEffect     |

---

## 🔥 One-line Summary

> Event handlers handle user actions, while useEffect handles lifecycle, side effects, and socket listeners.
