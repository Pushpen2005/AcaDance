"use client";
import TimetableOptimizer from "./TimetableOptimizer";
import PredictiveAnalytics from "./PredictiveAnalytics";
import AuditLogs from "./AuditLogs";
import OfflineAttendance from "./OfflineAttendance";
import AIChatbot from "./AIChatbot";
import ThemeAccessibility from "./ThemeAccessibility";

export default function AdminDashboard() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4 text-purple-700">Admin Dashboard</h2>
      <ul className="space-y-2">
        <li>Full access to timetable management</li>
        <li>Generate defaulter reports, analytics</li>
        <li>Manage faculty & student groups</li>
      </ul>
      <TimetableOptimizer />
      <PredictiveAnalytics />
      <AuditLogs />
      <OfflineAttendance />
      <AIChatbot />
      <ThemeAccessibility />
    </div>
  );
}
