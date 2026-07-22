import React, { useState } from "react";

const Header = ({ roomId, connectionStatus, handleLeaveRoom }) => {
  const [buttonText, setButtonText] = useState("Copy Room ID");

  const handleCopyRoomId = async () => {
    try {
      if (!roomId) {
        setButtonText("No Room ID");

        setTimeout(() => {
          setButtonText("Copy Room ID");
        }, 2000);

        return;
      }

      await navigator.clipboard.writeText(roomId);

      setButtonText("Room ID Copied!");

      setTimeout(() => {
        setButtonText("Copy Room ID");
      }, 2000);

    } catch (error) {
      console.error("Failed to copy room ID:", error);

      setButtonText("Failed to Copy");

      setTimeout(() => {
        setButtonText("Copy Room ID");
      }, 2000);
    }
  };

  return (
    <header className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

      <div>
        <h1 className="text-2xl font-bold text-white">
          SyncForge
        </h1>

        <p className="text-slate-300 text-sm mt-1">
          Room ID: {roomId || "Not Joined"}
        </p>

        <p
          className={`text-sm mt-1 font-medium ${
            connectionStatus === "Connected"
              ? "text-green-400"
              : connectionStatus === "Reconnecting..."
              ? "text-yellow-400"
              : "text-red-400"
          }`}
        >
          Status: {connectionStatus}
        </p>
        <button
          onClick={handleLeaveRoom}
          className="mt-4 w-full bg-red-600 hover:bg-red-700 rounded-lg px-4 py-2 font-medium text-white transition-colors"
        >
          Leave Room
      </button>
      </div>

      <button
        onClick={handleCopyRoomId}
        className="bg-red-700 hover:bg-red-800 transition-colors duration-200 text-white font-semibold py-2 px-4 rounded-lg"
      >
        {buttonText}
      </button>

    </header>
  );
};

export default Header;