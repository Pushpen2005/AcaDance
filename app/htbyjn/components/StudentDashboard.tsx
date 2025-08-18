"use client";
import AttendanceProgress from "./AttendanceProgress";
import AIChatbot from "./AIChatbot";
import Gamification from "./Gamification";
import ThemeAccessibility from "./ThemeAccessibility";

export default function StudentDashboard() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4 text-green-700">Student Dashboard</h2>
      <ul className="space-y-2">
        <li>View your personal timetable</li>
        <li>View your attendance records</li>
        <li>Receive notifications (low attendance, alerts)</li>
      </ul>
      <AttendanceProgress />
      <Gamification />
      <AIChatbot />
      <ThemeAccessibility />
    </div>
  );
}
