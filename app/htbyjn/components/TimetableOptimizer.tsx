"use client";
import { useState } from "react";

export default function TimetableOptimizer() {
  const [result, setResult] = useState<string>("");
  function optimizeTimetable() {
    // Demo: Replace with real AI/GA/constraint logic
    setResult("Optimized timetable generated! No conflicts detected.");
  }
  return (
    <div className="p-8 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">AI-Powered Timetable Optimization</h2>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors duration-200 mb-4"
        onClick={optimizeTimetable}
        aria-label="Optimize Timetable"
      >
        Optimize Timetable
      </button>
      {result && <div className="p-4 bg-green-100 text-green-700 rounded shadow mt-2">{result}</div>}
      <p className="mt-4 text-gray-500">(Demo: Real optimization logic will consider faculty, rooms, subjects, and student groups.)</p>
    </div>
  );
}
