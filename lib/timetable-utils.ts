// Complete timetable management with realtime updates
import { supabase } from './supabaseClient';
import { useEffect, useState } from 'react';

export interface TimetableEntry {
  id: string;
  course_name: string;
  course_id: string;
  faculty_id: string;
  faculty_name?: string;
  day: string;
  time_slot: string;
  room: string;
  created_at: string;
  updated_at: string;
}

// Create a new timetable entry
export async function createTimetableEntry(data: {
  course_name: string;
  course_id: string;
  faculty_id: string;
  day: string;
  time_slot: string;
  room: string;
}) {
  try {
    const { data: entry, error } = await supabase
      .from('timetables')
      .insert(data)
      .select(`
        *,
        faculty:profiles!timetables_faculty_id_fkey(name)
      `)
      .single();

    if (error) throw error;

    return { success: true, data: entry };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create timetable entry'
    };
  }
}

// Get timetable for a specific user (faculty or student)
export async function getTimetable(userId?: string) {
  try {
    let query = supabase
      .from('timetables')
      .select(`
        *,
        faculty:profiles!timetables_faculty_id_fkey(name)
      `)
      .order('day')
      .order('time_slot');

    // If userId provided and user is faculty, filter by their classes
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile?.role === 'faculty') {
        query = query.eq('faculty_id', userId);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch timetable'
    };
  }
}

// Update timetable entry
export async function updateTimetableEntry(id: string, updates: Partial<TimetableEntry>) {
  try {
    const { data, error } = await supabase
      .from('timetables')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        faculty:profiles!timetables_faculty_id_fkey(name)
      `)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update timetable entry'
    };
  }
}

// Delete timetable entry
export async function deleteTimetableEntry(id: string) {
  try {
    const { error } = await supabase
      .from('timetables')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete timetable entry'
    };
  }
}

// React hook for realtime timetable updates
export function useTimetableRealtime(userId?: string) {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTimetable = async () => {
    setLoading(true);
    const result = await getTimetable(userId);
    
    if (result.success) {
      setTimetable(result.data || []);
      setError(null);
    } else {
      setError(result.error || 'Unknown error');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTimetable();

    // Set up realtime subscription
    const channel = supabase
      .channel('timetables-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timetables'
        },
        (payload) => {
          console.log('Timetable change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            setTimetable(prev => [...prev, payload.new as TimetableEntry]);
          } else if (payload.eventType === 'UPDATE') {
            setTimetable(prev => 
              prev.map(item => 
                item.id === payload.new.id ? payload.new as TimetableEntry : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setTimetable(prev => 
              prev.filter(item => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return {
    timetable,
    loading,
    error,
    refetch: loadTimetable
  };
}

// Get timetable by day
export function getTimetableByDay(timetable: TimetableEntry[]) {
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const groupedByDay = timetable.reduce((acc, entry) => {
    if (!acc[entry.day]) {
      acc[entry.day] = [];
    }
    acc[entry.day].push(entry);
    return acc;
  }, {} as Record<string, TimetableEntry[]>);

  // Sort entries within each day by time
  Object.keys(groupedByDay).forEach(day => {
    groupedByDay[day].sort((a, b) => {
      const timeA = a.time_slot.split('-')[0];
      const timeB = b.time_slot.split('-')[0];
      return timeA.localeCompare(timeB);
    });
  });

  // Return in day order
  return dayOrder.reduce((acc, day) => {
    if (groupedByDay[day]) {
      acc[day] = groupedByDay[day];
    }
    return acc;
  }, {} as Record<string, TimetableEntry[]>);
}

// Check for scheduling conflicts
export function checkTimeConflicts(
  newEntry: { day: string; time_slot: string; room?: string },
  existingTimetable: TimetableEntry[]
) {
  const conflicts = existingTimetable.filter(entry => {
    // Same day
    if (entry.day !== newEntry.day) return false;

    // Same time slot
    if (entry.time_slot === newEntry.time_slot) {
      return true; // Time conflict
    }

    // Same room (if provided)
    if (newEntry.room && entry.room === newEntry.room) {
      // Check if time slots overlap
      const [newStart, newEnd] = newEntry.time_slot.split('-');
      const [existingStart, existingEnd] = entry.time_slot.split('-');
      
      // Simple time overlap check (assumes HH:MM format)
      if (timeOverlaps(newStart, newEnd, existingStart, existingEnd)) {
        return true; // Room conflict
      }
    }

    return false;
  });

  return {
    hasConflicts: conflicts.length > 0,
    conflicts
  };
}

// Helper function to check if two time ranges overlap
function timeOverlaps(start1: string, end1: string, start2: string, end2: string): boolean {
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const start1Min = toMinutes(start1);
  const end1Min = toMinutes(end1);
  const start2Min = toMinutes(start2);
  const end2Min = toMinutes(end2);

  return start1Min < end2Min && end1Min > start2Min;
}

// Bulk timetable operations
export async function bulkCreateTimetable(entries: Array<Omit<TimetableEntry, 'id' | 'created_at' | 'updated_at'>>) {
  try {
    const { data, error } = await supabase
      .from('timetables')
      .insert(entries)
      .select(`
        *,
        faculty:profiles!timetables_faculty_id_fkey(name)
      `);

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create timetable entries'
    };
  }
}

// Export timetable data
export function exportTimetableToCSV(timetable: TimetableEntry[]): string {
  const headers = ['Course Name', 'Course ID', 'Faculty', 'Day', 'Time', 'Room'];
  const rows = timetable.map(entry => [
    entry.course_name,
    entry.course_id,
    entry.faculty_name || 'Unknown',
    entry.day,
    entry.time_slot,
    entry.room
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
}
