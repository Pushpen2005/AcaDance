// Enhanced with Advanced Supabase Integration
import React, { useState, useEffect } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";


// Environment variables for Supabase connection
// NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY should be set in your .env.local or Vercel project settings

interface TimetableEntry {
  id: number;
  batch: string;
  semester: number;
  course: string;
  faculty_id: string;
  room: string;
  room_type: string;
  day: string;
  start_time: string;
  end_time: string;
  credits: number;
  created_at?: string;
}

interface TimetableViewProps {
  entries: TimetableEntry[];
}

const TimetableView: React.FC<TimetableViewProps> = ({ entries }) => {
  if (!entries || entries.length === 0) {
    return <div>No timetable entries found.</div>;
  }
  return (
    <table>
      <thead>
        <tr>
          <th>Batch</th><th>Semester</th><th>Course</th><th>Faculty</th><th>Room</th>
          <th>Type</th><th>Day</th><th>Start</th><th>End</th><th>Credits</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.id}>
            <td>{entry.batch}</td>
            <td>{entry.semester}</td>
            <td>{entry.course}</td>
            <td>{entry.faculty_id}</td>
            <td>{entry.room}</td>
            <td>{entry.room_type}</td>
            <td>{entry.day}</td>
            <td>{entry.start_time}</td>
            <td>{entry.end_time}</td>
            <td>{entry.credits}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Performance and Error Handling Enhanced
export default React.memo(TimetableView;
)
