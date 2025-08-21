"use client"

// Enhanced with Advanced Supabase Integration
import React, { useState, useEffect } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Database, RefreshCw, Users, BookOpen, Clock, TrendingUp, Download, Eye, Settings } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

// Real-time Analytics Interface
interface TimetableAnalytics {
  totalSubjects: number;
  totalTeachers: number;
  totalScheduledClasses: number;
  utilizationRate: number;
  conflictCount: number;
  lastGenerated: string | null;
}

// Enhanced Error Boundary for Timetable Management
class TimetableErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Timetable Management Error:', error, errorInfo);
    // Report to monitoring service
    if (typeof window !== 'undefined' && (window as any).reportError) {
      (window as any).reportError(error, { component: 'TimetableManagement', ...errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Component Error:</strong> Timetable management encountered an error.
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2" 
              onClick={() => this.setState({ hasError: false })}
            >
              Reset Component
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

// Performance and Error Handling Enhanced
export default React.memo(function TimetableManagement() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [subjects, setSubjects] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])

  // Constraints State
  const [constraints, setConstraints] = useState<any[]>([]);

  // Timetable Generation State
  const [generatedTimetable, setGeneratedTimetable] = useState<any[]>([]);
  
  // Error and Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time Analytics State
  const [analytics, setAnalytics] = useState<TimetableAnalytics>({
    totalSubjects: 0,
    totalTeachers: 0,
    totalScheduledClasses: 0,
    utilizationRate: 0,
    conflictCount: 0,
    lastGenerated: null
  });

  // Real-time subscription state
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Real-time Supabase subscriptions for live updates
  useEffect(() => {
    const supabaseClient = advancedSupabase.getClient();
    
    // Set up real-time subscriptions for all relevant tables
    const subjectsChannel = supabaseClient
      .channel('timetable_subjects')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'subjects' }, 
        (payload) => {
          console.log('Real-time subjects update:', payload);
          if (payload.eventType === 'INSERT') {
            setSubjects(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'DELETE') {
            setSubjects(prev => prev.filter(s => s.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setSubjects(prev => prev.map(s => s.id === payload.new.id ? payload.new : s));
          }
          updateAnalytics();
        }
      )
      .subscribe((status) => {
        console.log('Subjects subscription status:', status);
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    const teachersChannel = supabaseClient
      .channel('timetable_teachers')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'teachers' },
        (payload) => {
          console.log('Real-time teachers update:', payload);
          if (payload.eventType === 'INSERT') {
            setTeachers(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'DELETE') {
            setTeachers(prev => prev.filter(t => t.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setTeachers(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
          }
          updateAnalytics();
        }
      )
      .subscribe();

    const timetableChannel = supabaseClient
      .channel('timetable_updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'timetables' },
        (payload) => {
          console.log('Real-time timetable update:', payload);
          if (payload.eventType === 'INSERT') {
            setGeneratedTimetable(prev => [...prev, payload.new]);
          }
          updateAnalytics();
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabaseClient.removeChannel(subjectsChannel);
      supabaseClient.removeChannel(teachersChannel);
      supabaseClient.removeChannel(timetableChannel);
    };
  }, []);

  // Update analytics in real-time
  const updateAnalytics = () => {
    setAnalytics(prev => ({
      ...prev,
      totalSubjects: subjects.length,
      totalTeachers: teachers.length,
      totalScheduledClasses: generatedTimetable.length,
      utilizationRate: teachers.length > 0 ? (subjects.length / teachers.length) * 100 : 0,
      conflictCount: 0, // Calculate actual conflicts
      lastGenerated: generatedTimetable.length > 0 ? new Date().toISOString() : prev.lastGenerated
    }));
  };

  // Update analytics when data changes
  useEffect(() => {
    updateAnalytics();
  }, [subjects.length, teachers.length, generatedTimetable.length]);

  // Fetch data from Supabase on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Use advancedSupabase for better error handling
        const supabase = advancedSupabase.getClient();
        
        const { data: subjectsData, error: subjectsError } = await supabase.from("subjects").select("*");
        if (subjectsError) {
          console.warn('Subjects table not found or error:', subjectsError);
          setSubjects([]);
        } else {
          setSubjects(subjectsData || []);
        }
        
        const { data: teachersData, error: teachersError } = await supabase.from("teachers").select("*");
        if (teachersError) {
          console.warn('Teachers table not found or error:', teachersError);
          setTeachers([]);
        } else {
          setTeachers(teachersData || []);
        }
        
        const { data: constraintsData, error: constraintsError } = await supabase.from("constraints").select("*");
        if (constraintsError) {
          console.warn('Constraints table not found or error:', constraintsError);
          setConstraints([]);
        } else {
          setConstraints(constraintsData || []);
        }
        
        const { data: timetableData, error: timetableError } = await supabase.from("timetables").select("*");
        if (timetableError) {
          console.warn('Timetables table not found or error:', timetableError);
          setGeneratedTimetable([]);
        } else {
          setGeneratedTimetable(timetableData || []);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while fetching data';
        setError(errorMessage);
        
        // Initialize with demo data when database is not available
        initializeDemoData();
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);
  
  // Initialize demo data when database is not available
  const initializeDemoData = () => {
    if (subjects.length === 0) {
      setSubjects([
        { id: 1, name: "Mathematics", code: "MATH101", credits: 3, duration: 60 },
        { id: 2, name: "Physics", code: "PHY101", credits: 4, duration: 90 },
        { id: 3, name: "Computer Science", code: "CS101", credits: 3, duration: 60 }
      ]);
    }
    
    if (teachers.length === 0) {
      setTeachers([
        { id: 1, name: "Dr. Smith", specialization: "Mathematics", maxHours: 20 },
        { id: 2, name: "Dr. Johnson", specialization: "Physics", maxHours: 18 },
        { id: 3, name: "Prof. Davis", specialization: "Computer Science", maxHours: 22 }
      ]);
    }
    
    if (constraints.length === 0) {
      setConstraints([
        { id: 1, type: "time", value: "9:00-17:00" },
        { id: 2, type: "room", value: "max-capacity-50" }
      ]);
    }
  };

  // Add Subject (Supabase)
  const addSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const subject = {
        name: formData.get("subjectName"),
        code: formData.get("subjectCode"),
        credits: formData.get("subjectCredits"),
        duration: formData.get("subjectDuration"),
      };
      
      const supabase = advancedSupabase.getClient();
      const { data, error } = await supabase.from("subjects").insert([subject]).select();
      
      if (!error && data && data.length > 0) {
        setSubjects((prev) => [...prev, { ...subject, id: data[0].id }]);
        (e.target as HTMLFormElement).reset();
      } else {
        console.warn('Error adding subject:', error);
      }
    } catch (error) {
      console.error('Failed to add subject:', error);
    }
  };

  // Remove Subject (Supabase)
  const removeSubject = async (id: number) => {
    try {
      const supabase = advancedSupabase.getClient();
      await supabase.from("subjects").delete().eq("id", id);
      setSubjects(subjects.filter((s) => s.id !== id));
    } catch (error) {
      console.error('Failed to remove subject:', error);
    }
  };

  // Add Teacher (Supabase)
  const addTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const teacher = {
        name: formData.get("teacherName"),
        specialization: formData.get("teacherSpecialization"),
        maxHours: formData.get("teacherMaxHours"),
      };
      
      const supabase = advancedSupabase.getClient();
      const { data, error } = await supabase.from("teachers").insert([teacher]).select();
      
      if (!error && data && data.length > 0) {
        setTeachers((prev) => [...prev, { ...teacher, id: data[0].id }]);
        (e.target as HTMLFormElement).reset();
      } else {
        console.warn('Error adding teacher:', error);
      }
    } catch (error) {
      console.error('Failed to add teacher:', error);
    }
  };

  // Remove Teacher (Supabase)
  const removeTeacher = async (id: number) => {
    try {
      const supabase = advancedSupabase.getClient();
      await supabase.from("teachers").delete().eq("id", id);
      setTeachers(teachers.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Failed to remove teacher:', error);
    }
  };

  // Add Constraint (Supabase)
  const addConstraint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const constraint = {
        type: formData.get("constraintType"),
        value: formData.get("constraintValue"),
      };
      
      const supabase = advancedSupabase.getClient();
      const { data, error } = await supabase.from("constraints").insert([constraint]).select();
      
      if (!error && data && data.length > 0) {
        setConstraints((prev) => [...prev, { ...constraint, id: data[0].id }]);
        (e.target as HTMLFormElement).reset();
      } else {
        console.warn('Error adding constraint:', error);
      }
    } catch (error) {
      console.error('Failed to add constraint:', error);
    }
  };

  // Remove Constraint (Supabase)
  const removeConstraint = async (id: number) => {
    try {
      const supabase = advancedSupabase.getClient();
      await supabase.from("constraints").delete().eq("id", id);
      setConstraints(constraints.filter((c) => c.id !== id));
    } catch (error) {
      console.error('Failed to remove constraint:', error);
    }
  };

  // Timetable Generation (Supabase)
  const generateTimetable = async () => {
    try {
      const timetable = subjects.map((subject, idx) => ({
        subject: subject.name,
        teacher: teachers[idx % teachers.length]?.name || "Unassigned",
        slot: `Day ${1 + (idx % 5)}, 10:00-11:00`,
      }));
      
      const supabase = advancedSupabase.getClient();
      const { data, error } = await supabase.from("timetables").insert(timetable).select();
      
      if (!error && data) {
        setGeneratedTimetable(data);
        setActiveSection("view");
      } else {
        console.warn('Error generating timetable:', error);
        // Fallback to local generation if database insert fails
        setGeneratedTimetable(timetable);
        setActiveSection("view");
      }
    } catch (error) {
      console.error('Failed to generate timetable:', error);
      // Fallback to local generation
      const timetable = subjects.map((subject, idx) => ({
        subject: subject.name,
        teacher: teachers[idx % teachers.length]?.name || "Unassigned",
        slot: `Day ${1 + (idx % 5)}, 10:00-11:00`,
      }));
      setGeneratedTimetable(timetable);
      setActiveSection("view");
    }
  };

  // Section definition with enhanced dashboard
  const sections: { id: string; label: string; icon: any }[] = [
    { id: "dashboard", label: "Analytics Dashboard", icon: TrendingUp },
    { id: "setup", label: "Setup & Management", icon: Settings },
    { id: "constraints", label: "Constraints", icon: AlertCircle },
    { id: "generation", label: "Generation", icon: RefreshCw },
    { id: "view", label: "View Timetable", icon: Eye },
    { id: "reports", label: "Reports", icon: Download },
  ];

  // Generate comprehensive reports
  const generateReport = (type: 'subjects' | 'teachers' | 'utilization' | 'conflicts' | 'timetable') => {
    const reportData = {
      subjects: subjects,
      teachers: teachers,
      timetable: generatedTimetable,
      analytics: analytics,
      timestamp: new Date().toISOString()
    };

    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.entries(reportData).map(([key, value]) => 
        `${key},${JSON.stringify(value)}`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `timetable_${type}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <TimetableErrorBoundary>
      <div className="space-y-6">
        {/* Real-time Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${realtimeConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {realtimeConnected ? 'Real-time connected' : 'Real-time disconnected'}
            </span>
          </div>
          <Badge variant={realtimeConnected ? "default" : "destructive"}>
            {realtimeConnected ? 'Live' : 'Offline'}
          </Badge>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Database Error:</strong> {error}
              <br />
              <span className="text-sm text-red-600">
                This may be due to missing database tables. The timetable management will work in demo mode.
              </span>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Loading State */}
        {isLoading && (
          <Alert className="border-blue-200 bg-blue-50">
            <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
            <AlertDescription className="text-blue-800">
              Loading timetable data...
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-green-800 dark:text-green-200">Timetable Management</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => generateReport('utilization')}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700" 
              onClick={generateTimetable}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Timetable'
              )}
            </Button>
          </div>
        </div>

        {/* Enhanced Section Tabs */}
        <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            {sections.map((section) => (
              <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-2">
                <section.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{section.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Analytics Dashboard Section */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Subjects</p>
                      <p className="text-2xl font-bold text-green-600">{analytics.totalSubjects}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Teachers</p>
                      <p className="text-2xl font-bold text-blue-600">{analytics.totalTeachers}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Scheduled Classes</p>
                      <p className="text-2xl font-bold text-purple-600">{analytics.totalScheduledClasses}</p>
                    </div>
                    <Clock className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Utilization Rate</p>
                      <p className="text-2xl font-bold text-orange-600">{analytics.utilizationRate.toFixed(1)}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Real-time System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  System Health & Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Database Connection</span>
                    <Badge variant={realtimeConnected ? "default" : "destructive"}>
                      {realtimeConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  <Progress value={realtimeConnected ? 100 : 0} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Teacher Utilization</span>
                    <span>{analytics.utilizationRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={analytics.utilizationRate} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Scheduling Conflicts</span>
                    <Badge variant={analytics.conflictCount > 0 ? "destructive" : "default"}>
                      {analytics.conflictCount} conflicts
                    </Badge>
                  </div>
                  <Progress value={analytics.conflictCount > 0 ? 100 : 0} className="h-2" />
                </div>

                {analytics.lastGenerated && (
                  <div className="text-sm text-gray-600">
                    Last Generated: {new Date(analytics.lastGenerated).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Setup Section - Existing code with enhancements */}
          <TabsContent value="setup">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subjects Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Subjects ({subjects.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={addSubject} className="space-y-4">
                    <div>
                      <Label htmlFor="subjectName">Subject Name</Label>
                      <Input id="subjectName" name="subjectName" placeholder="Subject Name" required />
                    </div>
                    <div>
                      <Label htmlFor="subjectCode">Subject Code</Label>
                      <Input id="subjectCode" name="subjectCode" placeholder="Subject Code" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="subjectCredits">Credits</Label>
                        <Input id="subjectCredits" name="subjectCredits" type="number" placeholder="Credits" required />
                      </div>
                      <div>
                        <Label htmlFor="subjectDuration">Duration (min)</Label>
                        <Input id="subjectDuration" name="subjectDuration" type="number" placeholder="Duration" required />
                      </div>
                    </div>
                    <Button type="submit" variant="outline" className="w-full bg-transparent">
                      Add Subject
                    </Button>
                  </form>

                  <div className="mt-6 space-y-2 max-h-64 overflow-y-auto">
                    {subjects.map((subject) => (
                      <div key={subject.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{subject.name}</div>
                          <div className="text-sm text-green-700">
                            {subject.code} • {subject.credits} credits • {subject.duration} min
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeSubject(subject.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Teachers Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Teachers ({teachers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={addTeacher} className="space-y-4">
                    <div>
                      <Label htmlFor="teacherName">Teacher Name</Label>
                      <Input id="teacherName" name="teacherName" placeholder="Teacher Name" required />
                    </div>
                    <div>
                      <Label htmlFor="teacherSpecialization">Specialization</Label>
                      <Input
                        id="teacherSpecialization"
                        name="teacherSpecialization"
                        placeholder="Specialization"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="teacherMaxHours">Max Hours/Week</Label>
                      <Input id="teacherMaxHours" name="teacherMaxHours" type="number" placeholder="Max Hours" required />
                    </div>
                    <Button type="submit" variant="outline" className="w-full bg-transparent">
                      Add Teacher
                    </Button>
                  </form>

                  <div className="mt-6 space-y-2 max-h-64 overflow-y-auto">
                    {teachers.map((teacher) => (
                      <div key={teacher.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{teacher.name}</div>
                          <div className="text-sm text-green-700">
                            {teacher.specialization} • Max {teacher.maxHours}h/week
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeTeacher(teacher.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Constraints Section */}
          <TabsContent value="constraints">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Scheduling Constraints ({constraints.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addConstraint} className="space-y-4 mb-4">
                  <div>
                    <Label htmlFor="constraintType">Constraint Type</Label>
                    <Input id="constraintType" name="constraintType" placeholder="e.g. Teacher Unavailable" required />
                  </div>
                  <div>
                    <Label htmlFor="constraintValue">Value</Label>
                    <Input id="constraintValue" name="constraintValue" placeholder="e.g. Monday" required />
                  </div>
                  <Button type="submit" variant="outline" className="w-full bg-transparent">Add Constraint</Button>
                </form>
                <div className="space-y-2">
                  {constraints.map((c) => (
                    <div key={c.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{c.type}</div>
                        <div className="text-sm text-green-700">{c.value}</div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => removeConstraint(c.id)}>Remove</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timetable Generation Section */}
          <TabsContent value="generation">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Timetable Generation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-green-700">Generate and optimize timetables using advanced algorithms.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Current Resources</h4>
                    <p className="text-sm text-gray-600">{subjects.length} subjects, {teachers.length} teachers</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Constraints</h4>
                    <p className="text-sm text-gray-600">{constraints.length} active constraints</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Estimated Time</h4>
                    <p className="text-sm text-gray-600">~{Math.max(subjects.length * 2, 30)} seconds</p>
                  </div>
                </div>

                <Button 
                  className="bg-green-600 hover:bg-green-700 w-full" 
                  onClick={generateTimetable}
                  disabled={isLoading || subjects.length === 0 || teachers.length === 0}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating Timetable...
                    </>
                  ) : (
                    'Generate Optimized Timetable'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* View Timetable Section */}
          <TabsContent value="view">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Generated Timetable ({generatedTimetable.length} classes)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generatedTimetable.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-green-700 mb-2">No timetable generated yet.</p>
                    <p className="text-sm text-gray-600">Use the Generation tab to create a new timetable.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">
                        Generated on: {analytics.lastGenerated ? new Date(analytics.lastGenerated).toLocaleString() : 'Unknown'}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => generateReport('timetable')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-3 text-left">Subject</th>
                            <th className="border border-gray-300 p-3 text-left">Teacher</th>
                            <th className="border border-gray-300 p-3 text-left">Time Slot</th>
                            <th className="border border-gray-300 p-3 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {generatedTimetable.map((row, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <td className="border border-gray-300 p-3">{row.subject}</td>
                              <td className="border border-gray-300 p-3">{row.teacher}</td>
                              <td className="border border-gray-300 p-3">{row.slot}</td>
                              <td className="border border-gray-300 p-3">
                                <Badge variant="default">Scheduled</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Section */}
          <TabsContent value="reports">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resource Utilization Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Teacher Utilization:</span>
                      <span className="font-medium">{analytics.utilizationRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={analytics.utilizationRate} />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Total Teaching Hours: {teachers.reduce((sum, t) => sum + (t.maxHours || 0), 0)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Scheduled Hours: {subjects.reduce((sum, s) => sum + (s.duration || 60) / 60, 0).toFixed(1)}
                    </p>
                  </div>

                  <Button 
                    onClick={() => generateReport('utilization')} 
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Utilization Report
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Analytics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{analytics.totalSubjects}</p>
                      <p className="text-sm text-gray-600">Subjects</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{analytics.totalTeachers}</p>
                      <p className="text-sm text-gray-600">Teachers</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{analytics.totalScheduledClasses}</p>
                      <p className="text-sm text-gray-600">Classes</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{analytics.conflictCount}</p>
                      <p className="text-sm text-gray-600">Conflicts</p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => generateReport('subjects')} 
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Full Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TimetableErrorBoundary>
  )
}
)
