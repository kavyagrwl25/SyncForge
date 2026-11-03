import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";
import * as Y from "../../client/node_modules/yjs/dist/yjs.mjs";
import { createRoomSync } from "../../client/src/collaboration/roomSync.js";
import { initSocket } from "../socket/socketHandler.js";
import { getRoomDoc } from "../socket/roomManager/roomYDoc.js";
import { getUsersInRoom } from "../socket/roomManager/roomUsers.js";
import { getRoomNotifications } from "../socket/roomManager/roomNotifications.js";

// Reuse the installed client dependency instead of adding a server dependency.
const { io: createClient } = createRequire(
  new URL("../../client/package.json", import.meta.url),
)("socket.io-client");
async function waitFor(predicate, message, timeout = 3000) {
  const deadline = Date.now() + timeout;
  while (!predicate()) {
    assert.ok(Date.now() < deadline, message);
    await delay(10);
  }
}

function acknowledged(socket, event, payload) {
  return new Promise((resolve, reject) => {
    socket.timeout(3000).emit(event, payload, (error, response) => {
      if (error) reject(error);
      else resolve(response);
    });
  });
}

test("Yjs synchronization over actual Socket.IO connections", { concurrency: true, timeout: 60000 }, async (t) => {
  const httpServer = createServer();
  const io = initSocket(httpServer);
  await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${httpServer.address().port}`;
  let closed = false;
  t.after(async () => {
    if (!closed) await new Promise((resolve) => io.close(resolve));
  });

  async function participant(context, roomId, username, options = {}) {
    const doc = options.doc || new Y.Doc();
    const socket = createClient(url, {
      autoConnect: false,
      forceNew: true,
      reconnection: options.reconnection ?? false,
      reconnectionDelay: 100,
      reconnectionDelayMax: 100,
      randomizationFactor: 0,
      transports: ["websocket"],
    });
    const client = {
      doc, socket, roomId, username,
      syncCount: 0, sentUpdates: 0,
      paused: false, pending: [], users: [], notifications: [],
      cursors: [], language: null, error: null,
    };

    const emit = socket.emit.bind(socket);
    // Gate only outbound updates to create independent concurrent edits. The
    // actual production synchronization module still handles all protocol work.
    socket.emit = (event, ...args) => {
      if (event === "yjs-update") {
        if (client.paused) {
          client.pending.push(args);
          return socket;
        }
        client.sentUpdates++;
      }
      return emit(event, ...args);
    };
    socket.on("room-users", (users) => { client.users = users; });
    socket.on("room-notifications", (items) => { client.notifications = items; });
    socket.on("room-notification", (item) => { client.notifications.unshift(item); });
    socket.on("receive-language", (language) => { client.language = language; });
    socket.on("cursor-position-changed", (cursor) => { client.cursors.push(cursor); });
    const stop = createRoomSync({
      socket, ydoc: doc, roomId, username,
      onError: (error) => { client.error = error; },
    });
    let disposed = false;
    client.dispose = () => {
      if (disposed) return;
      disposed = true;
      stop();
      socket.disconnect();
      socket.removeAllListeners();
      doc.destroy();
    };
    socket.on("yjs-init", () => {
      options.onInit?.();
      client.syncCount++;
    });
    client.flush = async () => {
      const pending = client.pending.splice(0);
      client.paused = false;
      for (const [payload, acknowledge] of pending) {
        const response = await acknowledged(socket, "yjs-update", payload);
        acknowledge?.(response);
        assert.equal(response.ok, true, response.error);
      }
    };
    client.disconnect = async () => {
      const socketId = socket.id;
      socket.io.engine.close();
      await waitFor(() => !socket.connected && !getUsersInRoom(roomId).some((user) => user.socketId === socketId), "client disconnect removes membership");
    };
    client.reconnect = async () => {
      const count = client.syncCount;
      socket.connect();
      await waitFor(() => client.syncCount > count || client.error, "client reconnect completes differential sync");
      if (client.error) throw client.error;
    };
    context.after(client.dispose);
    await waitFor(() => client.syncCount > 0 || client.error, "initial synchronization completes");
    if (client.error) throw client.error;
    return client;
  }

  async function converged(roomId, ...clients) {
    await waitFor(() => {
      for (const client of clients) if (client.error) throw client.error;
      const serverDoc = getRoomDoc(roomId);
      return clients.every(({ doc }) => doc.getText("code").toString() === serverDoc.getText("code").toString()
        && Buffer.from(Y.encodeStateVector(doc)).equals(Buffer.from(Y.encodeStateVector(serverDoc))));
    }, `all documents converge in ${roomId}`);
  }

  const conflicts = [
    {
      name: "different lines", seed: "alpha\nbeta\n",
      alice: (text) => text.insert(0, "A: "),
      bob: (text) => text.insert(6, "B: "),
      check: (value) => assert.equal(value, "A: alpha\nB: beta\n"),
    },
    {
      name: "the same insertion position", seed: "hello",
      alice: (text) => text.insert(2, "A"),
      bob: (text) => text.insert(2, "B"),
      check: (value) => assert.match(value, /^he(?:AB|BA)llo$/),
    },
    {
      name: "the same line", seed: "const total = 0;",
      alice: (text) => { text.delete(14, 1); text.insert(14, "1"); },
      bob: (text) => text.insert(6, "new_"),
      check: (value) => assert.equal(value, "const new_total = 1;"),
    },
    {
      name: "deletion concurrent with insertion", seed: "abcdef",
      alice: (text) => text.delete(1, 3),
      bob: (text) => text.insert(2, "X"),
      check: (value) => assert.equal(value, "aXef"),
    },
  ];

  for (const [index, conflict] of conflicts.entries()) {
    await t.test(`concurrent edits: ${conflict.name}`, async (context) => {
      const room = `concurrent-${index}`;
      const alice = await participant(context, room, "Alice");
      const bob = await participant(context, room, "Bob");
      alice.doc.getText("code").insert(0, conflict.seed);
      await converged(room, alice, bob);
      alice.paused = bob.paused = true;
      // Both edits are generated from the same baseline before either is sent.
      alice.doc.transact(() => conflict.alice(alice.doc.getText("code")));
      bob.doc.transact(() => conflict.bob(bob.doc.getText("code")));
      const sent = alice.sentUpdates + bob.sentUpdates;
      await Promise.all([bob.flush(), alice.flush()]);
      await converged(room, alice, bob);
      conflict.check(alice.doc.getText("code").toString());
      await delay(30);
      assert.equal(alice.sentUpdates + bob.sentUpdates, sent + 2, "received updates do not echo back");
    });
  }

  await t.test("joining an active room while another participant edits", async (context) => {
    const room = "active-join";
    const alice = await participant(context, room, "Alice");
    alice.doc.getText("code").insert(0, "shared code\n");
    await converged(room, alice);
    const bob = await participant(context, room, "Bob", {
      onInit: () => alice.doc.getText("code").insert(0, "during join\n"),
    });
    bob.doc.getText("code").insert(bob.doc.getText("code").length, "Bob's edit");
    await converged(room, alice, bob);
    assert.equal(bob.doc.getText("code").toString(), "during join\nshared code\nBob's edit");
  });

  await t.test("disconnected local edits reconcile with missed server edits", async (context) => {
    const room = "offline-recovery";
    const alice = await participant(context, room, "Alice");
    const bob = await participant(context, room, "Bob");
    alice.doc.getText("code").insert(0, "base\n");
    await converged(room, alice, bob);
    await alice.disconnect();
    await waitFor(() => getUsersInRoom(room).length === 1, "offline socket leaves presence");
    const sent = alice.sentUpdates;
    alice.doc.getText("code").insert(0, "offline\n");
    bob.doc.getText("code").insert(0, "online\n");
    await converged(room, bob);
    assert.equal(alice.sentUpdates, sent, "offline updates stay in Y.Doc, not Socket.IO's queue");
    await alice.reconnect();
    await converged(room, alice, bob);
    const value = alice.doc.getText("code").toString();
    assert.ok(value.includes("offline\n"));
    assert.ok(value.includes("online\n"));
    assert.ok(value.includes("base\n"));
    assert.equal(getUsersInRoom(room).length, 2);
  });

  await t.test("a fresh Y.Doc restores shared state through the refresh protocol", async (context) => {
    const room = "refresh";
    const alice = await participant(context, room, "Alice");
    const bob = await participant(context, room, "Bob");
    alice.doc.getText("code").insert(0, "retained on the server");
    await converged(room, alice, bob);
    await alice.disconnect();
    alice.dispose();
    assert.equal(alice.doc.isDestroyed, true);
    assert.equal(alice.socket.listeners("yjs-init").length, 0);
    const refreshed = await participant(context, room, "Alice");
    await converged(room, refreshed, bob);
    assert.notEqual(refreshed.doc, alice.doc);
    assert.equal(refreshed.doc.getText("code").toString(), "retained on the server");
  });

  await t.test("Socket.IO automatically reconnects and reconciles edits after transport loss", async (context) => {
    const room = "automatic-reconnect";
    const alice = await participant(context, room, "Alice", { reconnection: true });
    const bob = await participant(context, room, "Bob");
    alice.doc.getText("code").insert(0, "baseline\n");
    await converged(room, alice, bob);
    const syncCount = alice.syncCount;
    const oldSocketId = alice.socket.id;
    alice.socket.io.engine.close();
    await waitFor(() => !alice.socket.connected, "transport interruption disconnects the client");
    alice.doc.getText("code").insert(0, "offline edit\n");
    bob.doc.getText("code").insert(0, "peer edit\n");
    // No socket.connect() call: the real Socket.IO manager reconnects itself.
    await waitFor(() => alice.syncCount > syncCount || alice.error, "automatic manager reconnect completes synchronization");
    if (alice.error) throw alice.error;
    await converged(room, alice, bob);
    assert.notEqual(alice.socket.id, oldSocketId);
    assert.ok(alice.doc.getText("code").toString().includes("offline edit\n"));
    assert.ok(alice.doc.getText("code").toString().includes("peer edit\n"));
    assert.equal(getUsersInRoom(room).length, 2);
  });

  await t.test("independent rooms reject unjoined and cross-room writes", async (context) => {
    const alice = await participant(context, "isolation-a", "Alice");
    const bob = await participant(context, "isolation-b", "Bob");
    alice.doc.getText("code").insert(0, "only A");
    bob.doc.getText("code").insert(0, "only B");
    await converged("isolation-a", alice);
    await converged("isolation-b", bob);
    const attack = new Y.Doc();
    attack.getText("code").insert(0, "unauthorized");
    context.after(() => attack.destroy());
    const payload = { roomId: "isolation-b", update: Y.encodeStateAsUpdate(attack) };
    assert.equal((await acknowledged(alice.socket, "yjs-update", payload)).ok, false);
    const outsider = createClient(url, { forceNew: true, reconnection: false, transports: ["websocket"] });
    context.after(() => outsider.disconnect());
    await waitFor(() => outsider.connected, "outsider connects without joining");
    assert.equal((await acknowledged(outsider, "yjs-update", payload)).ok, false);
    assert.equal(bob.doc.getText("code").toString(), "only B");
    assert.equal(getRoomDoc("isolation-b").getText("code").toString(), "only B");
    assert.equal(alice.doc.getText("code").toString(), "only A");
  });

  await t.test("ArrayBuffer updates work and malformed updates do not crash the server", async (context) => {
    const room = "binary";
    const alice = await participant(context, room, "Alice");
    const bob = await participant(context, room, "Bob");
    alice.paused = true;
    alice.doc.getText("code").insert(0, "binary payload");
    const update = Y.mergeUpdates(alice.pending.splice(0).map(([payload]) => payload.update));
    const arrayBuffer = update.buffer.slice(update.byteOffset, update.byteOffset + update.byteLength);
    alice.paused = false;
    assert.equal((await acknowledged(alice.socket, "yjs-update", { roomId: room, update: arrayBuffer })).ok, true);
    await converged(room, alice, bob);
    for (const malformed of ["plain text", new Uint8Array([255, 255])]) {
      assert.equal((await acknowledged(alice.socket, "yjs-update", { roomId: room, update: malformed })).ok, false);
    }
    const maliciousDoc = new Y.Doc();
    maliciousDoc.getText("code").insert(0, "must not partially apply");
    const truncated = Y.encodeStateAsUpdate(maliciousDoc).slice(0, -1);
    context.after(() => maliciousDoc.destroy());
    assert.equal((await acknowledged(alice.socket, "yjs-update", { roomId: room, update: truncated })).ok, false);
    assert.equal(getRoomDoc(room).getText("code").toString(), "binary payload");
    assert.equal(bob.doc.getText("code").toString(), "binary payload");
    bob.doc.getText("code").insert(0, "still working: ");
    await converged(room, alice, bob);
    assert.equal(alice.doc.getText("code").toString(), "still working: binary payload");
  });

  await t.test("logical room IDs cannot address Socket.IO private socket rooms", async (context) => {
    const outsider = createClient(url, { forceNew: true, reconnection: false, transports: ["websocket"] });
    context.after(() => outsider.disconnect());
    await waitFor(() => outsider.connected, "unjoined outsider connects");
    const leakedEvents = [];
    outsider.onAny((event) => leakedEvents.push(event));
    const alice = await participant(context, outsider.id, "Alice");
    const bob = await participant(context, outsider.id, "Bob");
    alice.doc.getText("code").insert(0, "private room contents");
    await converged(outsider.id, alice, bob);
    await delay(30);
    assert.deepEqual(leakedEvents, [], "room metadata and text must not leak to the socket whose ID matches the logical room");
  });

  await t.test("language, cursor, presence, notifications and manual leave are preserved", async (context) => {
    const room = "existing-features";
    const alice = await participant(context, room, "Alice");
    const bob = await participant(context, room, "Bob");
    await waitFor(() => alice.users.length === 2 && bob.users.length === 2, "two active users are visible");
    assert.ok(alice.notifications.some((item) => item.message === "Bob joined the room"));
    alice.socket.emit("language-change", { roomId: room, language: "python" });
    await waitFor(() => bob.language === "python", "language reaches peers");
    alice.socket.emit("cursor-position-change", { roomId: room, username: "Alice", lineNumber: 1, column: 3 });
    await waitFor(() => bob.cursors.length > 0, "cursor reaches peers");
    assert.equal(bob.cursors.at(-1).username, "Alice");
    assert.equal(bob.cursors.at(-1).column, 3);
    alice.socket.emit("leave-room");
    await waitFor(() => !alice.socket.connected && bob.users.length === 1, "manual leave disconnects and updates presence");
    assert.ok(bob.notifications.some((item) => item.message === "Alice left the room"));
    bob.doc.getText("code").insert(0, "remaining participant can edit");
    await converged(room, bob);
  });

  await t.test("repeated joins and reconnects keep one participant and one set of listeners", async (context) => {
    const room = "repeated-joins";
    const alice = await participant(context, room, "Alice");
    const bob = await participant(context, room, "Bob");
    const names = ["connect", "disconnect", "yjs-init", "yjs-update", "room-users"];
    const counts = names.map((name) => alice.socket.listeners(name).length);
    const notifications = getRoomNotifications(room).length;
    for (let index = 0; index < 3; index++) {
      const count = alice.syncCount;
      assert.equal((await acknowledged(alice.socket, "join-room", { roomId: room, username: "Alice", stateVector: Y.encodeStateVector(alice.doc) })).ok, true);
      await waitFor(() => alice.syncCount > count, "duplicate join resynchronizes");
      assert.equal(getUsersInRoom(room).length, 2);
    }
    assert.equal(getRoomNotifications(room).length, notifications, "duplicate joins do not add join notifications");
    for (let index = 0; index < 3; index++) {
      await alice.disconnect();
      await alice.reconnect();
    }
    await converged(room, alice, bob);
    assert.deepEqual(names.map((name) => alice.socket.listeners(name).length), counts);
    assert.equal(getUsersInRoom(room).length, 2);
    await delay(3200);
    assert.ok(!getRoomNotifications(room).some((item) => item.message === "Alice disconnected"), "rejoin cancels disconnect-grace notifications");
  });

  // These independent room tests overlap their real five-second cleanup windows.
  await Promise.all([
    t.test("expired room destroys its Y.Doc and a retained offline client restores it", async (context) => {
      const room = "expired";
      const alice = await participant(context, room, "Alice");
      alice.doc.getText("code").insert(0, "before expiry\n");
      await converged(room, alice);
      const expiredDoc = getRoomDoc(room);
      let destroyCount = 0;
      expiredDoc.on("destroy", () => { destroyCount++; });
      await alice.disconnect();
      alice.doc.getText("code").insert(0, "offline after expiry\n");
      await waitFor(() => expiredDoc.isDestroyed, "last participant's abandoned room expires", 6500);
      assert.equal(destroyCount, 1);
      assert.equal(getUsersInRoom(room).length, 0);
      await alice.reconnect();
      await converged(room, alice);
      assert.notEqual(getRoomDoc(room), expiredDoc);
      assert.equal(alice.doc.getText("code").toString(), "offline after expiry\nbefore expiry\n");
    }),
    t.test("rejoining before expiry cancels cleanup of the active document", async (context) => {
      const room = "canceled-expiry";
      const alice = await participant(context, room, "Alice");
      alice.doc.getText("code").insert(0, "active document");
      await converged(room, alice);
      const original = getRoomDoc(room);
      await alice.disconnect();
      await delay(100);
      await alice.reconnect();
      await delay(5200);
      assert.equal(getRoomDoc(room), original);
      assert.equal(original.isDestroyed, false);
      assert.equal(getUsersInRoom(room).length, 1);
      await converged(room, alice);
    }),
  ]);

  await t.test("server shutdown disposes room documents", async (context) => {
    const alice = await participant(context, "shutdown", "Alice");
    const serverDoc = getRoomDoc(alice.roomId);
    await new Promise((resolve) => io.close(resolve));
    closed = true;
    assert.equal(serverDoc.isDestroyed, true);
  });
});
