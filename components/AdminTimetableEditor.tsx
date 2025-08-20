import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define the type for a timetable entry
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

interface FormState {
  batch: string;
  semester: string;
  course: string;
  faculty_id: string;
  room: string;
  room_type: string;
  day: string;
  start_time: string;
  end_time: string;
  credits: string;
}

export default function AdminTimetableEditor() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [form, setForm] = useState<FormState>({
    batch: '',
    semester: '',
    course: '',
    faculty_id: '',
    room: '',
    room_type: '',
    day: '',
    start_time: '',
    end_time: '',
    credits: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase.from('timetable').select('*');
        if (error) throw error;
        setEntries(data || []);
      } catch (error) {
        console.error('Error fetching timetable:', error);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // Convert semester and credits to numbers
      const newEntry = {
        ...form,
        semester: Number(form.semester),
        credits: Number(form.credits)
      };
      
      const { error: insertError } = await supabase.from('timetable').insert([newEntry]);
      if (insertError) throw insertError;
      
      const { data, error: fetchError } = await supabase.from('timetable').select('*');
      if (fetchError) throw fetchError;
      
      setEntries(data || []);
      setForm({
        batch: '', semester: '', course: '', faculty_id: '', room: '', room_type: '',
        day: '', start_time: '', end_time: '', credits: ''
      });
    } catch (error) {
      console.error('Error adding timetable entry:', error);
      alert('Error adding timetable entry. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase.from('timetable').delete().eq('id', id);
      if (error) throw error;
      setEntries(entries.filter((entry) => entry.id !== id));
    } catch (error) {
      console.error('Error deleting timetable entry:', error);
      alert('Error deleting timetable entry. Please try again.');
    }
  };

  return (
    <div>
      <h2>Admin Timetable Editor</h2>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input name="batch" value={form.batch} onChange={handleChange} placeholder="Batch" required />
        <input name="semester" value={form.semester} onChange={handleChange} placeholder="Semester" required />
        <input name="course" value={form.course} onChange={handleChange} placeholder="Course" required />
        <input name="faculty_id" value={form.faculty_id} onChange={handleChange} placeholder="Faculty UUID" required />
        <input name="room" value={form.room} onChange={handleChange} placeholder="Room" required />
        <input name="room_type" value={form.room_type} onChange={handleChange} placeholder="Room Type" required />
        <input name="day" value={form.day} onChange={handleChange} placeholder="Day" required />
        <input name="start_time" value={form.start_time} onChange={handleChange} placeholder="Start Time (HH:MM)" required />
        <input name="end_time" value={form.end_time} onChange={handleChange} placeholder="End Time (HH:MM)" required />
        <input name="credits" value={form.credits} onChange={handleChange} placeholder="Credits" required />
        <button type="submit">Add Entry</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Batch</th><th>Semester</th><th>Course</th><th>Faculty</th><th>Room</th>
            <th>Type</th><th>Day</th><th>Start</th><th>End</th><th>Credits</th><th>Delete</th>
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
              <td>
                <button onClick={() => handleDelete(entry.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
