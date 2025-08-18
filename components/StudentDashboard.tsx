import React from 'react';

const StudentDashboard = () => {
  return (
    <div>
      <h1>🎓 Student Dashboard</h1>
      <ul>
        <li>Personal Timetable: Daily/weekly view, calendar sync.</li>
        <li>Attendance Check-in: QR/location/NFC, confirmation.</li>
        <li>Attendance History: Per subject stats, shortage alerts.</li>
        <li>Notifications: Alerts, exam schedules, announcements.</li>
        <li>Requests: Leave, attendance concerns.</li>
      </ul>
      <h2>Restrictions</h2>
      <ul>
        <li>Cannot modify timetable.</li>
        <li>Cannot mark attendance after session closes.</li>
        <li>Cannot access other students’ data.</li>
      </ul>
    </div>
  );
};

export default StudentDashboard;
