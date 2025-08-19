"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabaseClient"

export default function TimetableManagement() {
  const [activeSection, setActiveSection] = useState("setup")
  const [subjects, setSubjects] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])

  // Constraints State
  const [constraints, setConstraints] = useState<any[]>([]);
  const addConstraint = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const constraint = {
      id: Date.now(),
      type: formData.get("constraintType"),
      value: formData.get("constraintValue"),
    };
    setConstraints([...constraints, constraint]);
    (e.target as HTMLFormElement).reset();
  };

  // Timetable Generation State
  const [generatedTimetable, setGeneratedTimetable] = useState<any[]>([]);
  const generateTimetable = () => {
    // Simple demo: assign each subject to a teacher and a slot
    const timetable = subjects.map((subject, idx) => ({
      subject: subject.name,
      teacher: teachers[idx % teachers.length]?.name || "Unassigned",
      slot: `Day ${1 + (idx % 5)}, 10:00-11:00`,
    }));
    setGeneratedTimetable(timetable);
    setActiveSection("view");
  };

  // Fetch data from Supabase on mount
  useEffect(() => {
    async function fetchData() {
      const { data: subjectsData } = await supabase.from("subjects").select("*");
      setSubjects(subjectsData || []);
      const { data: teachersData } = await supabase.from("teachers").select("*");
      setTeachers(teachersData || []);
      const { data: constraintsData } = await supabase.from("constraints").select("*");
      setConstraints(constraintsData || []);
      const { data: timetableData } = await supabase.from("timetables").select("*");
      setGeneratedTimetable(timetableData || []);
    }
    fetchData();
  }, []);

  // Add Subject (Supabase)
  const addSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const subject = {
      name: formData.get("subjectName"),
      code: formData.get("subjectCode"),
      credits: formData.get("subjectCredits"),
      duration: formData.get("subjectDuration"),
    };
    const { data, error } = await supabase.from("subjects").insert([subject]).select();
    if (!error && data && data.length > 0) setSubjects((prev) => [...prev, { ...subject, id: data[0].id }]);
    (e.target as HTMLFormElement).reset();
  };

  // Remove Subject (Supabase)
  const removeSubject = async (id: number) => {
    await supabase.from("subjects").delete().eq("id", id);
    setSubjects(subjects.filter((s) => s.id !== id));
  };

  // Add Teacher (Supabase)
  const addTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const teacher = {
      name: formData.get("teacherName"),
      specialization: formData.get("teacherSpecialization"),
      maxHours: formData.get("teacherMaxHours"),
    };
    const { data, error } = await supabase.from("teachers").insert([teacher]).select();
    if (!error && data && data.length > 0) setTeachers((prev) => [...prev, { ...teacher, id: data[0].id }]);
    (e.target as HTMLFormElement).reset();
  };

  // Remove Teacher (Supabase)
  const removeTeacher = async (id: number) => {
    await supabase.from("teachers").delete().eq("id", id);
    setTeachers(teachers.filter((t) => t.id !== id));
  };

  // Add Constraint (Supabase)
  const addConstraint = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const constraint = {
      type: formData.get("constraintType"),
      value: formData.get("constraintValue"),
    };
    const { data, error } = await supabase.from("constraints").insert([constraint]).select();
    if (!error && data && data.length > 0) setConstraints((prev) => [...prev, { ...constraint, id: data[0].id }]);
    (e.target as HTMLFormElement).reset();
  };

  // Remove Constraint (Supabase)
  const removeConstraint = async (id: number) => {
    await supabase.from("constraints").delete().eq("id", id);
    setConstraints(constraints.filter((c) => c.id !== id));
  };

  // Timetable Generation (Supabase)
  const generateTimetable = async () => {
    const timetable = subjects.map((subject, idx) => ({
      subject: subject.name,
      teacher: teachers[idx % teachers.length]?.name || "Unassigned",
      slot: `Day ${1 + (idx % 5)}, 10:00-11:00`,
    }));
    const { data, error } = await supabase.from("timetables").insert(timetable).select();
    if (!error && data) setGeneratedTimetable(data);
    setActiveSection("view");
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Timetable Management</h1>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={generateTimetable}>Generate Timetable</Button>
      </div>

      {/* Section Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeSection === section.id ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
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
                      <div className="text-sm text-gray-600">
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
                      <div className="text-sm text-gray-600">
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
                    <div className="text-sm text-gray-600">{c.value}</div>
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
            <p className="text-gray-600 mb-4">Generate and optimize timetables using advanced algorithms.</p>
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
              <p className="text-gray-600">No timetable generated yet.</p>
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
