'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, Download, Filter, Grid, List } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface TimetableEntry {
  id: string;
  subject: string;
  faculty: string;
  room: string;
  day: string;
  start_time: string;
  end_time: string;
  class_type: 'lecture' | 'lab' | 'tutorial';
  semester: string;
  department: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

export default function StudentTimetablePage() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchTimetable();
    }
  }, [user]);

  const fetchUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchTimetable = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // First get user profile to get student details
      const { data: profile } = await supabase
        .from('profiles')
        .select('department, semester, student_id')
        .eq('id', user.id)
        .single();

      if (profile) {
        // Fetch timetable for student's department and semester
        const { data, error } = await supabase
          .from('timetables')
          .select('*')
          .eq('department', profile.department)
          .eq('semester', profile.semester)
          .order('day')
          .order('start_time');

        if (error) throw error;
        setTimetable(data || []);
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClassTypeColor = (type: string) => {
    switch (type) {
      case 'lecture': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'lab': return 'bg-green-100 text-green-800 border-green-200';
      case 'tutorial': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredTimetable = selectedDay === 'all' 
    ? timetable 
    : timetable.filter(entry => entry.day === selectedDay);

  const downloadTimetable = () => {
    const csvContent = [
      ['Day', 'Time', 'Subject', 'Faculty', 'Room', 'Type'].join(','),
      ...timetable.map(entry => [
        entry.day,
        `${entry.start_time} - ${entry.end_time}`,
        entry.subject,
        entry.faculty,
        entry.room,
        entry.class_type
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timetable.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-20 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 animate-slide-in-left">
            My Timetable
          </h1>
          <p className="text-gray-600 animate-slide-in-right">
            View your class schedule and stay organized
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6 animate-slide-in-up">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="all">All Days</option>
              {DAYS.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="transition-all duration-200"
            >
              <Grid className="h-4 w-4 mr-2" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="transition-all duration-200"
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
          </div>

          <Button
            onClick={downloadTimetable}
            className="ml-auto bg-blue-600 hover:bg-blue-700 transition-all duration-200"
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </div>

        {/* Timetable Content */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {DAYS.map((day, dayIndex) => (
              <div key={day} className={`animate-slide-in-up`} style={{ animationDelay: `${dayIndex * 100}ms` }}>
                <h3 className="font-semibold text-lg mb-3 text-center text-gray-800 sticky top-0 bg-white rounded-lg p-2 shadow-sm">
                  {day}
                </h3>
                <div className="space-y-2">
                  {filteredTimetable
                    .filter(entry => entry.day === day)
                    .map((entry, index) => (
                      <Card 
                        key={entry.id} 
                        className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer glass-effect"
                      >
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge className={getClassTypeColor(entry.class_type)}>
                                {entry.class_type}
                              </Badge>
                              <span className="text-xs text-gray-500 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {entry.start_time}
                              </span>
                            </div>
                            <h4 className="font-medium text-sm text-gray-900">
                              {entry.subject}
                            </h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div className="flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                {entry.faculty}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {entry.room}
                              </div>
                              <div className="text-xs font-medium text-blue-600">
                                {entry.start_time} - {entry.end_time}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {filteredTimetable.filter(entry => entry.day === day).length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No classes today</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {DAYS.map((day, dayIndex) => {
              const dayClasses = filteredTimetable.filter(entry => entry.day === day);
              if (selectedDay !== 'all' && selectedDay !== day) return null;
              
              return (
                <Card 
                  key={day} 
                  className={`animate-slide-in-up glass-effect`}
                  style={{ animationDelay: `${dayIndex * 100}ms` }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {day}
                      <Badge variant="outline" className="ml-auto">
                        {dayClasses.length} classes
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dayClasses.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dayClasses.map((entry, index) => (
                          <div 
                            key={entry.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:scale-105"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge className={getClassTypeColor(entry.class_type)}>
                                {entry.class_type}
                              </Badge>
                              <span className="text-sm font-medium text-blue-600">
                                {entry.start_time} - {entry.end_time}
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-2">
                              {entry.subject}
                            </h4>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2" />
                                {entry.faculty}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2" />
                                {entry.room}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No classes scheduled for {day}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {timetable.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">No Timetable Available</h3>
            <p className="text-gray-500">
              Your timetable will appear here once it's published by the administration.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
