"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function TimetableManagement() {
  const [activeSection, setActiveSection] = useState("setup")
  const [subjects, setSubjects] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])

  const sections = [
    { id: "setup", label: "Setup" },
    { id: "constraints", label: "Constraints" },
    { id: "generation", label: "Generation" },
    { id: "view", label: "View Timetable" },
  ]

  const addSubject = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const subject = {
      id: Date.now(),
      name: formData.get("subjectName"),
      code: formData.get("subjectCode"),
      credits: formData.get("subjectCredits"),
      duration: formData.get("subjectDuration"),
    }
    setSubjects([...subjects, subject])
    ;(e.target as HTMLFormElement).reset()
  }

  const addTeacher = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const teacher = {
      id: Date.now(),
      name: formData.get("teacherName"),
      specialization: formData.get("teacherSpecialization"),
      maxHours: formData.get("teacherMaxHours"),
    }
    setTeachers([...teachers, teacher])
    ;(e.target as HTMLFormElement).reset()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Timetable Management</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">Generate Timetable</Button>
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
                      onClick={() => setSubjects(subjects.filter((s) => s.id !== subject.id))}
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
                      onClick={() => setTeachers(teachers.filter((t) => t.id !== teacher.id))}
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

      {/* Other sections would be implemented similarly */}
      {activeSection === "constraints" && (
        <Card>
          <CardHeader>
            <CardTitle>Scheduling Constraints</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Configure scheduling constraints and preferences here.</p>
          </CardContent>
        </Card>
      )}

      {activeSection === "generation" && (
        <Card>
          <CardHeader>
            <CardTitle>Timetable Generation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Generate and optimize timetables using advanced algorithms.</p>
          </CardContent>
        </Card>
      )}

      {activeSection === "view" && (
        <Card>
          <CardHeader>
            <CardTitle>View Generated Timetable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">View and export the generated timetable.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
