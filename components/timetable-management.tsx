"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSupabase } from "@/lib/supabaseClient"

type Subject = { id?: number; name: any; code: any; credits: any; duration: any }
type Teacher = { id?: number; name: any; specialization: any; maxHours: any }
type Constraint = { id?: number; type: any; value: any }
type TimetableRow = { id?: number; subject: string; teacher: string; slot: string }

export default function TimetableManagement() {
  const [activeSection, setActiveSection] = useState("setup")
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [constraints, setConstraints] = useState<Constraint[]>([])
  const [generatedTimetable, setGeneratedTimetable] = useState<TimetableRow[]>([])

  useEffect(() => {
    async function fetchData() {
      const { data: subjectsData } = await getSupabase().from("subjects").select("*")
      setSubjects(subjectsData || [])
      const { data: teachersData } = await getSupabase().from("teachers").select("*")
      setTeachers(teachersData || [])
      const { data: constraintsData } = await getSupabase().from("constraints").select("*")
      setConstraints(constraintsData || [])
      const { data: timetableData } = await getSupabase().from("timetables").select("*")
      setGeneratedTimetable((timetableData as TimetableRow[]) || [])
    }
    fetchData()
  }, [])

  const addSubject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const subject: Subject = {
      name: formData.get("subjectName"),
      code: formData.get("subjectCode"),
      credits: formData.get("subjectCredits"),
      duration: formData.get("subjectDuration"),
    }
    const { data, error } = await getSupabase().from("subjects").insert([subject]).select()
    if (!error && data && data.length > 0) setSubjects((prev) => [...prev, { ...subject, id: data[0].id }])
    e.currentTarget.reset()
  }

  const removeSubject = async (id?: number) => {
    if (id == null) return
    await getSupabase().from("subjects").delete().eq("id", id)
    setSubjects((prev) => prev.filter((s) => s.id !== id))
  }

  const addTeacher = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const teacher: Teacher = {
      name: formData.get("teacherName"),
      specialization: formData.get("teacherSpecialization"),
      maxHours: formData.get("teacherMaxHours"),
    }
    const { data, error } = await getSupabase().from("teachers").insert([teacher]).select()
    if (!error && data && data.length > 0) setTeachers((prev) => [...prev, { ...teacher, id: data[0].id }])
    e.currentTarget.reset()
  }

  const removeTeacher = async (id?: number) => {
    if (id == null) return
    await getSupabase().from("teachers").delete().eq("id", id)
    setTeachers((prev) => prev.filter((t) => t.id !== id))
  }

  const addConstraint = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const constraint: Constraint = {
      type: formData.get("constraintType"),
      value: formData.get("constraintValue"),
    }
    const { data, error } = await getSupabase().from("constraints").insert([constraint]).select()
    if (!error && data && data.length > 0) setConstraints((prev) => [...prev, { ...constraint, id: data[0].id }])
    e.currentTarget.reset()
  }

  const removeConstraint = async (id?: number) => {
    if (id == null) return
    await getSupabase().from("constraints").delete().eq("id", id)
    setConstraints((prev) => prev.filter((c) => c.id !== id))
  }

  const generateTimetable = async () => {
    const timetable: TimetableRow[] = subjects.map((subject, idx) => ({
      subject: String(subject.name),
      teacher: String(teachers[idx % Math.max(teachers.length, 1)]?.name || "Unassigned"),
      slot: `Day ${1 + (idx % 5)}, 10:00-11:00`,
    }))
    const { data } = await getSupabase().from("timetables").insert(timetable).select()
    setGeneratedTimetable((data as TimetableRow[]) || timetable)
    setActiveSection("view")
  }

  const sections: { id: string; label: string }[] = [
    { id: "setup", label: "Setup" },
    { id: "constraints", label: "Constraints" },
    { id: "generation", label: "Generation" },
    { id: "view", label: "View Timetable" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Timetable Management</h1>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={generateTimetable}>
          Generate Timetable
        </Button>
      </div>

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

      {activeSection === "setup" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-2" onSubmit={addSubject}>
                <div>
                  <Label htmlFor="subjectName">Name</Label>
                  <Input id="subjectName" name="subjectName" required />
                </div>
                <div>
                  <Label htmlFor="subjectCode">Code</Label>
                  <Input id="subjectCode" name="subjectCode" required />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="subjectCredits">Credits</Label>
                    <Input id="subjectCredits" name="subjectCredits" required />
                  </div>
                  <div>
                    <Label htmlFor="subjectDuration">Duration</Label>
                    <Input id="subjectDuration" name="subjectDuration" required />
                  </div>
                </div>
                <Button type="submit">Add Subject</Button>
              </form>
              <ul className="mt-4 space-y-2">
                {subjects.map((s) => (
                  <li key={s.id ?? `${s.name}-${s.code}`} className="flex justify-between items-center">
                    <span>
                      {String(s.name)} ({String(s.code)})
                    </span>
                    <Button variant="outline" onClick={() => removeSubject(s.id)}>
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-2" onSubmit={addTeacher}>
                <div>
                  <Label htmlFor="teacherName">Name</Label>
                  <Input id="teacherName" name="teacherName" required />
                </div>
                <div>
                  <Label htmlFor="teacherSpecialization">Specialization</Label>
                  <Input id="teacherSpecialization" name="teacherSpecialization" required />
                </div>
                <div>
                  <Label htmlFor="teacherMaxHours">Max Hours</Label>
                  <Input id="teacherMaxHours" name="teacherMaxHours" required />
                </div>
                <Button type="submit">Add Teacher</Button>
              </form>
              <ul className="mt-4 space-y-2">
                {teachers.map((t) => (
                  <li key={t.id ?? `${t.name}-${t.specialization}`} className="flex justify-between items-center">
                    <span>{String(t.name)}</span>
                    <Button variant="outline" onClick={() => removeTeacher(t.id)}>
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {activeSection === "constraints" && (
        <Card>
          <CardHeader>
            <CardTitle>Constraints</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-2" onSubmit={addConstraint}>
              <div>
                <Label htmlFor="constraintType">Type</Label>
                <Input id="constraintType" name="constraintType" required />
              </div>
              <div>
                <Label htmlFor="constraintValue">Value</Label>
                <Input id="constraintValue" name="constraintValue" required />
              </div>
              <Button type="submit">Add Constraint</Button>
            </form>
            <ul className="mt-4 space-y-2">
              {constraints.map((c) => (
                <li key={c.id ?? `${c.type}-${c.value}`} className="flex justify-between items-center">
                  <span>
                    {String(c.type)}: {String(c.value)}
                  </span>
                  <Button variant="outline" onClick={() => removeConstraint(c.id)}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {activeSection === "generation" && (
        <Card>
          <CardHeader>
            <CardTitle>Generate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">Generate a simple timetable based on current subjects and teachers.</p>
            <Button onClick={generateTimetable}>Generate Timetable</Button>
          </CardContent>
        </Card>
      )}

      {activeSection === "view" && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Timetable</CardTitle>
          </CardHeader>
          <CardContent>
            {generatedTimetable.length === 0 ? (
              <p className="text-sm text-gray-500">No timetable generated yet.</p>
            ) : (
              <ul className="space-y-2">
                {generatedTimetable.map((row, idx) => (
                  <li key={row.id ?? idx} className="flex items-center justify-between border rounded p-2">
                    <span className="font-medium">{row.subject}</span>
                    <span className="text-gray-600">{row.teacher}</span>
                    <span className="text-gray-500">{row.slot}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

