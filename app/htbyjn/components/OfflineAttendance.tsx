"use client";
import { useState } from "react";

export default function OfflineAttendance() {
  const [offline, setOffline] = useState(false);
  const [synced, setSynced] = useState(false);
  function markOffline() {
    setOffline(true);
    setSynced(false);
  }
  function syncData() {
    setOffline(false);
    setSynced(true);
  }
  return (
    <div className="p-8 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-green-700">Offline-first Attendance</h2>
      <div className="mb-4">
        <button
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition-colors duration-200"
          onClick={markOffline}
          aria-label="Mark Attendance Offline"
        >
          Mark Attendance Offline
        </button>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors duration-200 ml-2"
          onClick={syncData}
          aria-label="Sync Data"
        >
          Sync Data
        </button>
      </div>
      {offline && <div className="p-4 bg-yellow-100 text-yellow-700 rounded shadow mt-2">Attendance marked offline. Waiting to sync...</div>}
      {synced && <div className="p-4 bg-green-100 text-green-700 rounded shadow mt-2">Attendance synced with Supabase!</div>}
      <p className="mt-4 text-gray-500">(Demo: Real implementation will use local storage and sync with backend.)</p>
    </div>
  );
}
