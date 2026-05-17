const Notifications = ({ notifications }) => {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-4">
      <h2 className="text-lg font-semibold">Activity</h2>

      {notifications.length === 0 ? (
        <p className="text-sm text-slate-400">No activity yet</p>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {notifications.map((item) => (
            <div
              key={item.id}
              className="bg-slate-800 rounded-lg px-3 py-3 space-y-1"
            >
              <p className="text-sm leading-5 text-slate-100">{item.message}</p>
              <p className="text-xs text-slate-400">{item.time}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
