'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { advancedSupabase } from "@/lib/advancedSupabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Users, QrCode, CheckCircle, XCircle, Clock, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  email: string;
  student_id: string;
  department: string;
}

interface Course {
  id: string;
  course_code: string;
  course_name: string;
  department: string;
}

interface AttendanceSession {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  qr_code: string;
  qr_expiry: string;
  session_status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  total_enrolled: number;
  total_present: number;
  attendance_percentage: number;
  course: Course;
}

interface StudentAttendance {
  student: Student;
  attendance_record?: {
    id: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    timestamp: string;
  };
}

const FacultyAttendanceMarking: React.FC<{ facultyId: string }> = ({ facultyId }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentDepartment, setNewStudentDepartment] = useState('');

  // Filter students based on search term
  const filteredStudents = students.filter(({ student }) => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch courses taught by faculty
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await advancedSupabase.query(
        `
        SELECT DISTINCT courses.*
        FROM courses
        JOIN timetables ON courses.id = timetables.course_id
        WHERE timetables.faculty_id = $1 AND courses.is_active = true
        ORDER BY courses.course_name
        `,
        [facultyId]
      );
      
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  }, [facultyId]);

  // Fetch sessions for selected course
  const fetchSessions = useCallback(async (courseId: string) => {
    if (!courseId) return;
    
    try {
      setLoading(true);
      const { data } = await advancedSupabase.query(
        `
        SELECT 
          attendance_sessions.*,
          courses.course_code,
          courses.course_name,
          courses.department
        FROM attendance_sessions
        JOIN timetables ON attendance_sessions.timetable_id = timetables.id
        JOIN courses ON timetables.course_id = courses.id
        WHERE timetables.course_id = $1 
        AND timetables.faculty_id = $2
        AND attendance_sessions.session_date >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY attendance_sessions.session_date DESC, attendance_sessions.start_time DESC
        `,
        [courseId, facultyId]
      );

      const transformedSessions = data?.map((session: any) => ({
        ...session,
        course: {
          id: courseId,
          course_code: session.course_code,
          course_name: session.course_name,
          department: session.department
        }
      })) || [];

      setSessions(transformedSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  }, [facultyId]);

  // Fetch students for selected session
  const fetchStudents = useCallback(async (sessionId: string) => {
    if (!sessionId || !selectedCourse) return;
    
    try {
      setLoading(true);
      const { data } = await advancedSupabase.query(
        `
        SELECT 
          users.id,
          users.name,
          users.email,
          users.student_id,
          users.department,
          attendance_records.id as attendance_id,
          attendance_records.status,
          attendance_records.timestamp
        FROM enrollments
        JOIN users ON enrollments.student_id = users.id
        LEFT JOIN attendance_records ON users.id = attendance_records.student_id 
          AND attendance_records.session_id = $1
        WHERE enrollments.course_id = $2 
        AND enrollments.is_active = true
        AND users.role = 'student'
        ORDER BY users.name
        `,
        [sessionId, selectedCourse]
      );

      const transformedStudents = data?.map((row: any) => ({
        student: {
          id: row.id,
          name: row.name,
          email: row.email,
          student_id: row.student_id,
          department: row.department
        },
        attendance_record: row.attendance_id ? {
          id: row.attendance_id,
          status: row.status,
          timestamp: row.timestamp
        } : undefined
      })) || [];

      setStudents(transformedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, [selectedCourse]);

  // Mark student attendance
  const markAttendance = async (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    if (!selectedSession) return;

    try {
      setSaving(true);

      // Check if attendance already exists
      const existingRecord = students.find(s => s.student.id === studentId)?.attendance_record;

      if (existingRecord) {
        // Update existing record
        const { error } = await advancedSupabase.getClient()
          .from('attendance_records')
          .update({ 
            status,
            timestamp: new Date().toISOString(),
            marked_by: facultyId
          })
          .eq('id', existingRecord.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await advancedSupabase.getClient()
          .from('attendance_records')
          .insert([{
            session_id: selectedSession,
            student_id: studentId,
            status,
            scan_method: 'manual',
            marked_by: facultyId,
            timestamp: new Date().toISOString()
          }]);

        if (error) throw error;
      }

      toast.success(`Attendance marked as ${status}`);
      
      // Refresh students list
      await fetchStudents(selectedSession);
      
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    } finally {
      setSaving(false);
    }
  };

  // Add new student
  const addStudent = async () => {
    if (!newStudentName || !newStudentEmail || !selectedCourse) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setSaving(true);

      // Create student user
      const { data: newUser, error: userError } = await advancedSupabase.getClient()
        .from('users')
        .insert([{
          name: newStudentName,
          email: newStudentEmail,
          department: newStudentDepartment || 'Not Specified',
          role: 'student',
          student_id: `STU${Date.now()}` // Generate student ID
        }])
        .select()
        .single();

      if (userError) throw userError;

      // Enroll student in course
      const { error: enrollError } = await advancedSupabase.getClient()
        .from('enrollments')
        .insert([{
          student_id: newUser.id,
          course_id: selectedCourse,
          is_active: true
        }]);

      if (enrollError) throw enrollError;

      toast.success('Student added successfully');
      
      // Clear form and refresh
      setNewStudentName('');
      setNewStudentEmail('');
      setNewStudentDepartment('');
      
      if (selectedSession) {
        await fetchStudents(selectedSession);
      }
      
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Failed to add student');
    } finally {
      setSaving(false);
    }
  };

  // Mark all students as present/absent
  const markAll = async (status: 'present' | 'absent') => {
    if (!selectedSession) return;
    
    try {
      setSaving(true);
      
      const promises = students
        .filter(s => !s.attendance_record) // Only mark unmarked students
        .map(s => markAttendance(s.student.id, status));
      
      await Promise.all(promises);
      
      toast.success(`All students marked as ${status}`);
    } catch (error) {
      console.error('Error marking all:', error);
      toast.error('Failed to mark all students');
    } finally {
      setSaving(false);
    }
  };

  // Generate QR code for session
  const generateQRCode = async () => {
    if (!selectedSession) return;
    
    try {
      const response = await fetch('/api/sessions/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          session_id: selectedSession,
          faculty_id: facultyId 
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('QR code generated successfully');
        // Refresh session data to get new QR code
        if (selectedCourse) {
          await fetchSessions(selectedCourse);
        }
      } else {
        toast.error(result.message || 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  // Initialize data
  useEffect(() => {
    if (facultyId) {
      fetchCourses();
    }
  }, [facultyId, fetchCourses]);

  useEffect(() => {
    if (selectedCourse) {
      fetchSessions(selectedCourse);
      setSelectedSession('');
      setStudents([]);
    }
  }, [selectedCourse, fetchSessions]);

  useEffect(() => {
    if (selectedSession) {
      fetchStudents(selectedSession);
    }
  }, [selectedSession, fetchStudents]);

  const currentSession = sessions.find(s => s.id === selectedSession);
  const presentCount = students.filter(s => s.attendance_record?.status === 'present').length;
  const absentCount = students.filter(s => !s.attendance_record || s.attendance_record.status === 'absent').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Faculty Attendance Marking</h2>
          <p className="text-muted-foreground">Mark student attendance and manage class sessions</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => {
            if (selectedCourse) fetchSessions(selectedCourse);
            if (selectedSession) fetchStudents(selectedSession);
          }}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Course and Session Selection */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="course-select">Select Course</Label>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.course_code} - {course.course_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="session-select">Select Session</Label>
          <Select value={selectedSession} onValueChange={setSelectedSession} disabled={!selectedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a session" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  {new Date(session.session_date).toLocaleDateString()} - {session.start_time}
                  <Badge variant={session.session_status === 'active' ? 'default' : 'secondary'} className="ml-2">
                    {session.session_status}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Session Info and QR Code */}
      {currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Session Information</span>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{presentCount} Present</Badge>
                <Badge variant="outline">{absentCount} Absent</Badge>
                <Button onClick={generateQRCode} size="sm">
                  <QrCode className="w-4 h-4 mr-2" />
                  Generate QR
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p><strong>Course:</strong> {currentSession.course.course_name}</p>
                <p><strong>Date:</strong> {new Date(currentSession.session_date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {currentSession.start_time} - {currentSession.end_time}</p>
                <p><strong>Status:</strong> 
                  <Badge variant={currentSession.session_status === 'active' ? 'default' : 'secondary'} className="ml-2">
                    {currentSession.session_status}
                  </Badge>
                </p>
              </div>
              {currentSession.qr_code && (
                <div className="text-center">
                  <div className="w-32 h-32 bg-gray-200 mx-auto mb-2 flex items-center justify-center rounded-lg">
                    <QrCode className="w-16 h-16 text-gray-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">QR Code Active</p>
                  <p className="text-xs text-muted-foreground">
                    Expires: {new Date(currentSession.qr_expiry).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attendance">Mark Attendance</TabsTrigger>
          <TabsTrigger value="add-student">Add Student</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          {selectedSession && students.length > 0 ? (
            <>
              {/* Search and Bulk Actions */}
              <div className="flex items-center justify-between space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={() => markAll('present')} variant="outline" disabled={saving}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark All Present
                  </Button>
                  <Button onClick={() => markAll('absent')} variant="outline" disabled={saving}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Mark All Absent
                  </Button>
                </div>
              </div>

              {/* Student List */}
              <div className="space-y-2">
                {filteredStudents.map(({ student, attendance_record }) => (
                  <Card key={student.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{student.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {student.email} • {student.student_id}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {attendance_record ? (
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={
                                  attendance_record.status === 'present' ? 'default' :
                                  attendance_record.status === 'late' ? 'secondary' :
                                  'destructive'
                                }
                              >
                                {attendance_record.status}
                              </Badge>
                              <p className="text-xs text-muted-foreground">
                                {new Date(attendance_record.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          ) : (
                            <div className="flex space-x-1">
                              <Button 
                                size="sm" 
                                onClick={() => markAttendance(student.id, 'present')}
                                disabled={saving}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Present
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => markAttendance(student.id, 'late')}
                                disabled={saving}
                              >
                                <Clock className="w-4 h-4 mr-1" />
                                Late
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => markAttendance(student.id, 'absent')}
                                disabled={saving}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Absent
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : selectedSession ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No students enrolled</h3>
                <p className="text-muted-foreground">No students are enrolled in this course yet.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a session</h3>
                <p className="text-muted-foreground">Choose a course and session to mark attendance.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="add-student" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Student</CardTitle>
              <CardDescription>
                Add a new student to the selected course and system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="student-name">Full Name *</Label>
                  <Input
                    id="student-name"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Enter student's full name"
                  />
                </div>
                <div>
                  <Label htmlFor="student-email">Email *</Label>
                  <Input
                    id="student-email"
                    type="email"
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                    placeholder="Enter student's email"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="student-department">Department</Label>
                <Input
                  id="student-department"
                  value={newStudentDepartment}
                  onChange={(e) => setNewStudentDepartment(e.target.value)}
                  placeholder="Enter department (optional)"
                />
              </div>

              {!selectedCourse && (
                <Alert>
                  <AlertDescription>
                    Please select a course first before adding a student.
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={addStudent} 
                disabled={!selectedCourse || !newStudentName || !newStudentEmail || saving}
                className="w-full"
              >
                {saving ? 'Adding...' : 'Add Student'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default React.memo(FacultyAttendanceMarking);
