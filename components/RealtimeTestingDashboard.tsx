'use client';

import React, { useState, useEffect } from 'react';
import { advancedSupabase } from "../lib/advancedSupabase";
import { useRealtimeDebug, RealtimeDebugPanel } from "../hooks/useRealtimeDebug";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
}

interface AttendanceSession {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  qr_code: string;
  session_status: string;
  total_present: number;
}

const RealtimeTestingDashboard: React.FC = () => {
  // Enable realtime debug logging
  useRealtimeDebug();

  const [students, setStudents] = useState<Student[]>([]);
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null);
  const [presentCount, setPresentCount] = useState(0);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', department: '' });
  const [loading, setLoading] = useState(false);

  // Load students on component mount
  useEffect(() => {
    loadStudents();
  }, []);

  // Subscribe to live attendance count for current session
  useEffect(() => {
    if (!currentSession) return;

    console.log(`[RT] Setting up live count for session: ${currentSession.id}`);
    
    // Load initial count
    loadPresentCount(currentSession.id);

    // Live updates for attendance records
    const unsubscribe = advancedSupabase.onTableChange(
      'attendance_records',
      (payload) => {
        console.log('[RT] Attendance record change:', payload);
        if (payload.new?.session_id === currentSession.id) {
          setPresentCount(c => c + 1);
          toast.success(`New attendance marked! Total: ${presentCount + 1}`);
        }
      }
    );

    return unsubscribe;
  }, [currentSession, presentCount]);

  // Load students from database
  const loadStudents = async () => {
    try {
      const { data, error } = await advancedSupabase.getClient()
        .from('users')
        .select('*')
        .eq('role', 'student');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    }
  };

  // Load present count for a session
  const loadPresentCount = async (sessionId: string) => {
    try {
      const { count, error } = await advancedSupabase.getClient()
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);

      if (error) throw error;
      setPresentCount(count || 0);
    } catch (error) {
      console.error('Error loading present count:', error);
    }
  };

  // Add new student (exact implementation as specified)
  const addStudent = async (name: string, email: string, department: string) => {
    try {
      setLoading(true);
      const { data, error } = await advancedSupabase.getClient()
        .from("users")
        .insert([{ name, email, department, role: "student" }])
        .select();

      if (error) {
        console.error("Error adding student:", error);
        toast.error("Failed to add student");
      } else {
        console.log("Student added:", data);
        toast.success("Student added successfully!");
        setNewStudent({ name: '', email: '', department: '' });
        await loadStudents(); // Refresh the list
      }
    } catch (error) {
      console.error("Error adding student:", error);
      toast.error("Failed to add student");
    } finally {
      setLoading(false);
    }
  };

  // Mark student present (exact implementation as specified)
  const markPresent = async (studentId: string) => {
    if (!currentSession) {
      toast.error("No active session");
      return;
    }

    try {
      const { data, error } = await advancedSupabase.getClient()
        .from("attendance_records")
        .insert([{ 
          session_id: currentSession.id, 
          student_id: studentId, 
          status: "present",
          timestamp: new Date().toISOString()
        }]);

      if (error) {
        console.error("Error marking attendance:", error);
        toast.error("Failed to mark attendance");
      } else {
        console.log("Attendance updated:", data);
        toast.success("Attendance marked successfully!");
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error("Failed to mark attendance");
    }
  };

  // Create a new attendance session
  const createSession = async () => {
    try {
      setLoading(true);
      const sessionData = {
        session_date: new Date().toISOString().split('T')[0],
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        qr_code: `session_${Date.now()}`,
        session_status: 'active',
        total_present: 0
      };

      const { data, error } = await advancedSupabase.getClient()
        .from("attendance_sessions")
        .insert([sessionData])
        .select()
        .single();

      if (error) throw error;
      
      setCurrentSession(data);
      setPresentCount(0);
      toast.success("New session created!");
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  // End current session
  const endSession = async () => {
    if (!currentSession) return;

    try {
      const { error } = await advancedSupabase.getClient()
        .from("attendance_sessions")
        .update({ session_status: 'completed', end_time: new Date().toISOString() })
        .eq('id', currentSession.id);

      if (error) throw error;
      
      setCurrentSession(null);
      setPresentCount(0);
      toast.success("Session ended!");
    } catch (error) {
      console.error("Error ending session:", error);
      toast.error("Failed to end session");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🧪 Realtime Testing Dashboard</h1>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {currentSession ? `Session Active (${presentCount} present)` : 'No Active Session'}
        </Badge>
      </div>

      {/* Session Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!currentSession ? (
            <Button onClick={createSession} disabled={loading} className="w-full">
              🎯 Start New Attendance Session
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800">Active Session</h3>
                <p className="text-sm text-green-700">Session ID: {currentSession.id}</p>
                <p className="text-sm text-green-700">QR Code: {currentSession.qr_code}</p>
                <p className="text-lg font-bold text-green-800">Present: {presentCount} students</p>
              </div>
              <Button onClick={endSession} variant="destructive" className="w-full">
                🛑 End Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Student Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Student</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newStudent.name}
                onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Student Name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newStudent.email}
                onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                placeholder="student@example.com"
              />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={newStudent.department}
                onChange={(e) => setNewStudent(prev => ({ ...prev, department: e.target.value }))}
                placeholder="Computer Science"
              />
            </div>
          </div>
          <Button 
            onClick={() => addStudent(newStudent.name, newStudent.email, newStudent.department)}
            disabled={loading || !newStudent.name || !newStudent.email || !newStudent.department}
            className="w-full"
          >
            ➕ Add Student
          </Button>
        </CardContent>
      </Card>

      {/* Students List with Mark Present */}
      <Card>
        <CardHeader>
          <CardTitle>Students ({students.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No students found. Add some students above.</p>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-gray-500">{student.email} • {student.department}</div>
                  </div>
                  <Button 
                    onClick={() => markPresent(student.id)} 
                    className="bg-green-500 hover:bg-green-600 text-white"
                    disabled={!currentSession}
                  >
                    ✅ Present
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>1.</strong> Open browser console to see realtime logs</p>
          <p><strong>2.</strong> Start a new session to activate attendance marking</p>
          <p><strong>3.</strong> Add students and click "Present" to see live updates</p>
          <p><strong>4.</strong> Open this page in multiple tabs to see realtime sync</p>
          <p><strong>5.</strong> Watch the realtime debug panel below for live database events</p>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <strong>Expected Behavior:</strong> When you click "Present", all open tabs should show the attendance count update instantly, and console logs should show the database INSERT event.
          </div>
        </CardContent>
      </Card>

      {/* Debug Panel - Fixed Position */}
      <RealtimeDebugPanel />
    </div>
  );
};

export default RealtimeTestingDashboard;
