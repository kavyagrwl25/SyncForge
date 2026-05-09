function JoinRoom({
  username,
  setUsername,
  roomId,
  setRoomId,
  handleJoinRoom,
  handleLeaveRoom,
}) {
  return (
    <div className="w-full max-w-md bg-slate-900 p-8 rounded-2xl shadow-xl">
      <h1 className="text-3xl font-bold text-center">SyncForge</h1>

      <p className="text-slate-400 text-center mt-2">
        Real-time collaborative code editor
      </p>

      <form onSubmit={handleJoinRoom} className="mt-8 space-y-4">
        <input
          type="text"
          placeholder="Enter your name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 outline-none focus:border-sky-400"
        />

        <input
          type="text"
          placeholder="Enter room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 outline-none focus:border-sky-400"
        />

        <button className="w-full py-3 rounded-lg bg-sky-400 text-slate-950 font-semibold hover:bg-sky-300">
          Join Room
        </button>
      </form>

      <button
        onClick={handleLeaveRoom}
        className="w-full mt-4 py-3 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-400"
      >
        Leave Room
      </button>
    </div>
  );
}

export default JoinRoom;