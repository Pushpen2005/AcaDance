"use client";
import QRScanner from "./QRScanner";
import AttendanceProgress from "./AttendanceProgress";
import AIChatbot from "./AIChatbot";
import ThemeAccessibility from "./ThemeAccessibility";

export default function FacultyDashboard() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Faculty Dashboard</h2>
      <ul className="space-y-2">
        <li>Mark attendance (QR/manual)</li>
        <li>View & edit attendance records for your courses</li>
        <li>Access course-specific timetables</li>
      </ul>
      <QRScanner />
      <AttendanceProgress />
      <AIChatbot />
      <ThemeAccessibility />
    </div>
  );
}
