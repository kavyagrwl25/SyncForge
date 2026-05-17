const Notifications = ({ notifications }) => {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Activity</h2>
        <p className="text-sm text-slate-400">Room updates and member activity</p>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-6 text-center">
          <p className="text-sm text-slate-400">No activity yet</p>
        </div>
      ) : (
        <div className="max-h-[500px] space-y-3 overflow-y-auto pr-1">
          {notifications.map((item) => (
            <div
              key={item.id}
              className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-3"
            >
              <p className="text-sm leading-5 text-slate-100">{item.message}</p>
              <p className="mt-1 text-xs text-slate-400">{item.time}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
