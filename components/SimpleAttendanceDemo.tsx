'use client';

import React, { useState, useEffect } from 'react';
import { advancedSupabase } from "@/lib/advancedSupabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, CheckCircle, XCircle, UserPlus, RefreshCw, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  created_at: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent';
  created_at: string;
  students?: Student;
}

const SimpleAttendanceDemo: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [showStudentView, setShowStudentView] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // New student form
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentDepartment, setNewStudentDepartment] = useState('');

  // Real-time subscription
  useEffect(() => {
    const unsubscribe = advancedSupabase.onTableChange('attendance', () => {
      fetchAttendanceForDate(selectedDate);
      toast.success('Attendance updated in real-time!');
    });

    return unsubscribe;
  }, [selectedDate]);

  // Fetch students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await advancedSupabase.getClient()
        .from('students')
        .select('*')
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance for specific date
  const fetchAttendanceForDate = async (date: string) => {
    try {
      setLoading(true);
      const { data, error } = await advancedSupabase.getClient()
        .from('attendance')
        .select(`
          *,
          students (
            id,
            name,
            email,
            department
          )
        `)
        .eq('date', date)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttendanceRecords(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  // Mark student as present - EXACT IMPLEMENTATION FROM REQUIREMENTS
  const markPresent = async (studentId: string) => {
    try {
      const { data, error } = await advancedSupabase.getClient()
        .from("attendance")
        .insert([{ 
          student_id: studentId, 
          status: "present", 
          date: selectedDate 
        }])
        .select(`
          *,
          students (
            id,
            name,
            email,
            department
          )
        `)
        .single();

      if (error) {
        console.error("Error marking attendance:", error);
        toast.error("Error marking attendance: " + error.message);
      } else {
        console.log("Attendance updated:", data);
        toast.success("Student marked present!");
        
        // Update local state
        setAttendanceRecords(prev => [data, ...prev]);
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error("Failed to mark attendance");
    }
  };

  // Add student - EXACT IMPLEMENTATION FROM REQUIREMENTS
  const addStudent = async (name: string, email: string, department: string) => {
    try {
      const { data, error } = await advancedSupabase.getClient()
        .from("students")
        .insert([{ name, email, department, role: "student" }])
        .select()
        .single();

      if (error) {
        console.error("Error adding student:", error);
        toast.error("Error adding student: " + error.message);
      } else {
        console.log("Student added:", data);
        toast.success("Student added successfully!");
        
        // Update local state and clear form
        setStudents(prev => [...prev, data]);
        setNewStudentName('');
        setNewStudentEmail('');
        setNewStudentDepartment('');
      }
    } catch (error) {
      console.error("Error adding student:", error);
      toast.error("Failed to add student");
    }
  };

  // Handle form submission
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudentName && newStudentEmail && newStudentDepartment) {
      addStudent(newStudentName, newStudentEmail, newStudentDepartment);
    } else {
      toast.error("Please fill in all fields");
    }
  };

  // Get student's attendance records (for student view)
  const getStudentAttendance = (studentId: string) => {
    return attendanceRecords.filter(record => record.student_id === studentId);
  };

  // Check if student already marked for the date
  const isStudentMarked = (studentId: string, date: string) => {
    return attendanceRecords.some(record => 
      record.student_id === studentId && record.date === date
    );
  };

  // Initialize data
  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchAttendanceForDate(selectedDate);
  }, [selectedDate]);

  // Student dashboard view - shows only their attendance
  const StudentView = ({ studentId }: { studentId: string }) => {
    const student = students.find(s => s.id === studentId);
    const studentAttendance = getStudentAttendance(studentId);
    const totalRecords = studentAttendance.length;
    const presentCount = studentAttendance.filter(r => r.status === 'present').length;
    const attendancePercentage = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>👤 Student Dashboard - {student?.name}</CardTitle>
            <CardDescription>
              ✅ Students can only view their own attendance records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{attendancePercentage}%</p>
                <p className="text-sm text-muted-foreground">Attendance</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{presentCount}</p>
                <p className="text-sm text-muted-foreground">Days Present</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{totalRecords - presentCount}</p>
                <p className="text-sm text-muted-foreground">Days Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📋 My Attendance History</CardTitle>
          </CardHeader>
          <CardContent>
            {studentAttendance.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No attendance records found</p>
            ) : (
              <div className="space-y-2">
                {studentAttendance.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">
                        Marked at: {new Date(record.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={record.status === 'present' ? 'default' : 'destructive'}>
                      {record.status === 'present' ? 'Present' : 'Absent'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Alert>
          <AlertDescription>
            <strong>🔒 Student Restrictions:</strong> 
            <br />• Can only view own attendance records
            <br />• Cannot mark themselves present
            <br />• Cannot see other students' data
            <br />• Real-time updates when faculty marks attendance
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  if (showStudentView && selectedStudentId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => setShowStudentView(false)}
          >
            ← Back to Faculty View
          </Button>
          <Badge variant="secondary">
            <Eye className="w-4 h-4 mr-1" />
            Student View Mode
          </Badge>
        </div>
        <StudentView studentId={selectedStudentId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📚 Simple Attendance System Demo</h1>
          <p className="text-muted-foreground">
            Exact implementation as described in requirements
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => {
              fetchStudents();
              fetchAttendanceForDate(selectedDate);
            }}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="faculty" className="space-y-4">
        <TabsList>
          <TabsTrigger value="faculty">👨‍🏫 Faculty View</TabsTrigger>
          <TabsTrigger value="add-student">➕ Add Student</TabsTrigger>
          <TabsTrigger value="database">🗄️ Database Tables</TabsTrigger>
        </TabsList>

        <TabsContent value="faculty" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                👨‍🏫 Faculty Marks Present
                <div className="flex items-center space-x-2">
                  <Label htmlFor="date-select">Date:</Label>
                  <Input
                    id="date-select"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
              </CardTitle>
              <CardDescription>
                Click "Present" to mark students present for {new Date(selectedDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {students.map((student) => {
                  const isMarked = isStudentMarked(student.id, selectedDate);
                  const attendanceRecord = attendanceRecords.find(r => 
                    r.student_id === student.id && r.date === selectedDate
                  );
                  
                  return (
                    <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="font-medium">{student.name}</span>
                          <p className="text-sm text-muted-foreground">
                            {student.email} • {student.department}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {isMarked ? (
                          <div className="flex items-center space-x-2">
                            <Badge variant={attendanceRecord?.status === 'present' ? 'default' : 'destructive'}>
                              {attendanceRecord?.status === 'present' ? 'Present' : 'Absent'}
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedStudentId(student.id);
                                setShowStudentView(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View as Student
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            onClick={() => markPresent(student.id)} 
                            className="bg-green-500 hover:bg-green-600 text-white"
                            size="sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Present
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {students.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No students found. Add some students to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Alert>
            <AlertDescription>
              <strong>✅ Faculty/Admin Capabilities:</strong>
              <br />• Can view all students
              <br />• Can mark any student present/absent
              <br />• Each click inserts a new record → attendance for that day is saved
              <br />• Real-time updates to student dashboards
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="add-student" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>➕ Add Student from Frontend</CardTitle>
              <CardDescription>
                This will instantly save new students into Supabase DB
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Enter student's full name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                    placeholder="Enter student's email"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    value={newStudentDepartment}
                    onChange={(e) => setNewStudentDepartment(e.target.value)}
                    placeholder="Enter department (e.g., Computer Science)"
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>👥 Students Table</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-2 font-medium border-b pb-2">
                    <span>Column</span>
                    <span>Type</span>
                    <span>Notes</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span>id</span>
                    <span>uuid (PK)</span>
                    <span>Auto-generated</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span>name</span>
                    <span>text</span>
                    <span>Student full name</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span>email</span>
                    <span>text</span>
                    <span>Unique email</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span>department</span>
                    <span>text</span>
                    <span>Department info</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span>role</span>
                    <span>text</span>
                    <span>Always "student"</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span>created_at</span>
                    <span>timestamp</span>
                    <span>Auto timestamp</span>
                  </div>
                </div>
                <div className="mt-4 p-2 bg-green-50 rounded text-sm">
                  <strong>Current count:</strong> {students.length} students
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📋 Attendance Table</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-2 font-medium border-b pb-2">
                    <span>Column</span>
                    <span>Type</span>
                    <span>Notes</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span>id</span>
                    <span>uuid (PK)</span>
                    <span>Unique record</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span>student_id</span>
                    <span>uuid (FK)</span>
                    <span>Links to students.id</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span>date</span>
                    <span>date</span>
                    <span>Which day's attendance</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span>status</span>
                    <span>text</span>
                    <span>"present" / "absent"</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span>created_at</span>
                    <span>timestamp</span>
                    <span>Auto timestamp</span>
                  </div>
                </div>
                <div className="mt-4 p-2 bg-blue-50 rounded text-sm">
                  <strong>Records for {new Date(selectedDate).toLocaleDateString()}:</strong> {attendanceRecords.length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <AlertDescription>
              <strong>🔒 RLS Policies in Effect:</strong>
              <br />• Students can only view their own attendance records
              <br />• Faculty/Admin can view and modify all records
              <br />• Real-time subscriptions notify of changes instantly
              <br />• Data is automatically synced across all connected clients
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default React.memo(SimpleAttendanceDemo);
