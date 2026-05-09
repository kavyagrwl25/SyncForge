function ActiveUsers({ users }) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-3">Active Users</h2>

      {users.length === 0 ? (
        <p className="text-slate-400 text-sm">No users in room</p>
      ) : (
        <ul className="space-y-2">
          {users.map((user, index) => (
            <li
              key={index}
              className="bg-slate-800 px-3 py-2 rounded-lg text-sm"
            >
              🟢 {user.username}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ActiveUsers;