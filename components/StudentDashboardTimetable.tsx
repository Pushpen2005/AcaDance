// Enhanced with Advanced Supabase Integration
import React, { useState, useEffect } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";
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

// Performance and Error Handling Enhanced
export default React.memo(function StudentDashboardTimetable() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);

  useEffect(() => {
    async function fetchTimetable() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch student's profile to get batch and semester
        const { data: profile } = await supabase
          .from('profiles')
          .select('department, semester')
          .eq('id', user.id)
          .single();

        if (profile) {
          const { data } = await supabase
            .from('timetable')
            .select('*')
            .eq('batch', profile.department)
            .eq('semester', profile.semester);
          setEntries(data || []);
        }
      }
    }
    fetchTimetable();
  }, []);

  return <TimetableView entries={entries} />;
}
)
