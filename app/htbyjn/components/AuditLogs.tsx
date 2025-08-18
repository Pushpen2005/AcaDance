"use client";
import { useState } from "react";

export default function AuditLogs() {
  const [logs, setLogs] = useState([
    { action: "Attendance marked", user: "Faculty: Priya", time: "2025-08-19 09:10" },
    { action: "Timetable changed", user: "Admin: Alex", time: "2025-08-18 16:30" },
    { action: "Student added", user: "Admin: John", time: "2025-08-17 11:00" },
  ]);
  return (
    <div className="p-8 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-700">Audit Logs & Security</h2>
      <ul className="space-y-2">
        {logs.map((log, idx) => (
          <li key={idx} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 text-sm">
            <span className="font-semibold">{log.action}</span> by <span className="text-blue-700">{log.user}</span> <span className="text-gray-500">({log.time})</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-gray-500">(Demo: Real logs will be stored securely and fetched from backend.)</p>
    </div>
  );
}
