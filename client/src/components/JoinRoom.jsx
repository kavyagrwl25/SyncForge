function JoinRoom({
  username,
  setUsername,
  roomId,
  setRoomId,
  handleJoinRoom,
  
}) {
  return (
    <div className="mx-auto w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">SyncForge</h1>
        <p className="text-sm text-slate-400">Real-time collaborative code editor</p>
      </div>

      <form onSubmit={handleJoinRoom} className="mt-6 space-y-4">
        <input
          type="text"
          placeholder="Enter your name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none"
        />

        <input
          type="text"
          placeholder="Enter room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none"
        />

        <button className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 font-medium text-white transition-colors">
          Join Room
        </button>
      </form>

      {/* <button
        onClick={handleLeaveRoom}
        className="mt-4 w-full bg-red-600 hover:bg-red-700 rounded-lg px-4 py-2 font-medium text-white transition-colors"
      >
        Leave Room
      </button> */}
    
    </div>
  );
}

export default JoinRoom;
