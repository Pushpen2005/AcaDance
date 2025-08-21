import { useEffect, useState } from 'react';
import TimetableView from './TimetableView';
import { createClient } from '@supabase/supabase-js';

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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardTimetable() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);

  useEffect(() => {
    async function fetchTimetable() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // For faculty: filter by faculty_id
        const { data } = await supabase
          .from('timetable')
          .select('*')
          .eq('faculty_id', user.id);
        setEntries(data || []);
      }
    }
    fetchTimetable();
  }, []);

  return <TimetableView entries={entries} />;
}
