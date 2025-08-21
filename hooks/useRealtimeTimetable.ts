import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Timetable } from '@/lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeTimetableProps {
  facultyId?: string;
  studentId?: string;
  courseId?: string;
  enabled?: boolean;
}

interface TimetableUpdate {
  type: 'created' | 'updated' | 'deleted';
  data: Timetable;
  timestamp: Date;
}

export function useRealtimeTimetable({
  facultyId,
  studentId,
  courseId,
  enabled = true
}: UseRealtimeTimetableProps = {}) {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [lastUpdate, setLastUpdate] = useState<TimetableUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    console.log('🔄 Setting up real-time timetable subscription');
    
    const channelName = `timetable-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'timetables'
        },
        (payload) => {
          console.log('📌 Timetable change:', payload);
          
          const timetableData = (payload.new || payload.old) as Timetable;
          
          // Apply filters
          if (facultyId && timetableData?.faculty_id !== facultyId) return;
          if (courseId && timetableData?.course_id !== courseId) return;
          
          // Handle different events
          if (payload.eventType === 'INSERT') {
            const newTimetable = payload.new as Timetable;
            setTimetables(prev => {
              if (prev.some(t => t.id === newTimetable.id)) return prev;
              return [...prev, newTimetable];
            });
            setLastUpdate({
              type: 'created',
              data: newTimetable,
              timestamp: new Date()
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedTimetable = payload.new as Timetable;
            setTimetables(prev => 
              prev.map(t => t.id === updatedTimetable.id ? updatedTimetable : t)
            );
            setLastUpdate({
              type: 'updated',
              data: updatedTimetable,
              timestamp: new Date()
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedTimetable = payload.old as Timetable;
            setTimetables(prev => 
              prev.filter(t => t.id !== deletedTimetable.id)
            );
            setLastUpdate({
              type: 'deleted',
              data: deletedTimetable,
              timestamp: new Date()
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Timetable realtime status:', status);
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'CHANNEL_ERROR') {
          setError('Failed to connect to timetable real-time updates');
        } else {
          setError(null);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('🔄 Cleaning up timetable real-time subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [facultyId, studentId, courseId, enabled]);

  // Helper functions
  const addTimetable = (timetable: Timetable) => {
    setTimetables(prev => {
      if (prev.some(t => t.id === timetable.id)) return prev;
      return [...prev, timetable];
    });
  };

  const updateTimetable = (timetable: Timetable) => {
    setTimetables(prev => 
      prev.map(t => t.id === timetable.id ? timetable : t)
    );
  };

  const removeTimetable = (timetableId: string) => {
    setTimetables(prev => prev.filter(t => t.id !== timetableId));
  };

  const getTimetablesByDay = (dayOfWeek: number) => {
    return timetables.filter(t => t.day_of_week === dayOfWeek);
  };

  const getTimetablesByFaculty = (facultyId: string) => {
    return timetables.filter(t => t.faculty_id === facultyId);
  };

  const getTimetablesByCourse = (courseId: string) => {
    return timetables.filter(t => t.course_id === courseId);
  };

  return {
    // State
    timetables,
    lastUpdate,
    isConnected,
    error,
    
    // Actions
    addTimetable,
    updateTimetable,
    removeTimetable,
    
    // Helpers
    getTimetablesByDay,
    getTimetablesByFaculty,
    getTimetablesByCourse,
    
    // Setter for manual updates
    setTimetables
  };
}
