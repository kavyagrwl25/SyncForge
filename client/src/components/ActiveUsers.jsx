function ActiveUsers({ users }) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Active Users</h2>
        <span className="rounded-full bg-slate-950 border border-slate-700 px-2.5 py-1 text-xs text-slate-400">
          {users.length}
        </span>
      </div>

      {users.length === 0 ? (
        <p className="text-sm text-slate-400">No users in room</p>
      ) : (
        <ul className="space-y-2">
          {users.map((user, index) => (
            <li
              key={index}
              className="flex items-center justify-between bg-slate-950 border border-slate-700 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="truncate text-sm text-slate-100">{user.username}</span>
              </div>
              <span className="text-xs text-slate-400">online</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ActiveUsers;
