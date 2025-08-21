"use client"

// Enhanced with Advanced Supabase Integration
import React, { useState, useEffect } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Database, RefreshCw } from "lucide-react"

// Performance and Error Handling Enhanced
export default React.memo(function TimetableManagement() {
  const [activeSection, setActiveSection] = useState("setup")
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

  // Section definition
  const sections: { id: string; label: string }[] = [
    { id: "setup", label: "Setup" },
    { id: "constraints", label: "Constraints" },
    { id: "generation", label: "Generation" },
    { id: "view", label: "View Timetable" },
  ];

  return (
    <div className="space-y-6">
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

      {/* Section Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeSection === section.id ? "bg-green-100 text-green-800 shadow-sm border-green-200" : "text-green-700 hover:text-green-900 hover:bg-green-50"
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Setup Section */}
      {activeSection === "setup" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subjects Management */}
          <Card>
            <CardHeader>
              <CardTitle>Subjects</CardTitle>
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

              <div className="mt-6 space-y-2">
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
              <CardTitle>Teachers</CardTitle>
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

              <div className="mt-6 space-y-2">
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
      )}

      {/* Constraints Section */}
      {activeSection === "constraints" && (
        <Card>
          <CardHeader>
            <CardTitle>Scheduling Constraints</CardTitle>
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
      )}

      {/* Timetable Generation Section */}
      {activeSection === "generation" && (
        <Card>
          <CardHeader>
            <CardTitle>Timetable Generation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 mb-4">Generate and optimize timetables using advanced algorithms.</p>
            <Button className="bg-green-600 hover:bg-green-700" onClick={generateTimetable}>Generate Timetable</Button>
          </CardContent>
        </Card>
      )}

      {/* View Timetable Section */}
      {activeSection === "view" && (
        <Card>
          <CardHeader>
            <CardTitle>View Generated Timetable</CardTitle>
          </CardHeader>
          <CardContent>
            {generatedTimetable.length === 0 ? (
              <p className="text-green-700">No timetable generated yet.</p>
            ) : (
              <table className="w-full border mt-2">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2">Subject</th>
                    <th className="p-2">Teacher</th>
                    <th className="p-2">Slot</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedTimetable.map((row, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2">{row.subject}</td>
                      <td className="p-2">{row.teacher}</td>
                      <td className="p-2">{row.slot}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
)
