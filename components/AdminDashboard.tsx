import React from 'react';

const AdminDashboard = () => {
  return (
    <div>
      <h1>🧑‍💼 Admin Dashboard</h1>
      <ul>
        <li>User Management: Add, update, deactivate accounts, assign roles.</li>
        <li>Timetable Generator: Collect constraints, run optimization, manual edit.</li>
        <li>Attendance Monitoring: Real-time overview, override/validate logs.</li>
        <li>Analytics & Reports: Attendance stats, export, conflict tracking.</li>
        <li>Notifications: Announcements, automated alerts.</li>
      </ul>
      <h2>Restrictions</h2>
      <ul>
        <li>Cannot mark attendance.</li>
        <li>Cannot access student private notes/submissions.</li>
        <li>Cannot impersonate users without logging.</li>
      </ul>
    </div>
  );
};

export default AdminDashboard;
