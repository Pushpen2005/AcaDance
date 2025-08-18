"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AttendanceTracking() {
  const [activeSection, setActiveSection] = useState("mark")
  const [showQRCode, setShowQRCode] = useState(false)
  const [showManualAttendance, setShowManualAttendance] = useState(false)

  const sections = [
    { id: "mark", label: "Mark Attendance" },
    { id: "methods", label: "Tracking Methods" },
    { id: "analytics", label: "Analytics" },
    { id: "students", label: "Student Management" },
  ]

  const students = [
    { id: 1, name: "John Doe", rollNo: "CS001", present: false },
    { id: 2, name: "Jane Smith", rollNo: "CS002", present: false },
    { id: 3, name: "Mike Wilson", rollNo: "CS003", present: false },
    { id: 4, name: "Sarah Johnson", rollNo: "CS004", present: false },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Attendance Tracking</h1>
        <div>
          <Label htmlFor="attendanceDate">Date</Label>
          <Input
            id="attendanceDate"
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-auto"
          />
        </div>
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

      {/* Mark Attendance Section */}
      {activeSection === "mark" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="classSelect">Select Class</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="math101">Mathematics 101</SelectItem>
                  <SelectItem value="physics201">Physics 201</SelectItem>
                  <SelectItem value="cs301">Computer Science 301</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="groupSelect">Select Group</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="groupA">Group A</SelectItem>
                  <SelectItem value="groupB">Group B</SelectItem>
                  <SelectItem value="groupC">Group C</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={() => setShowQRCode(!showQRCode)} className="bg-blue-600 hover:bg-blue-700">
              Generate QR Code
            </Button>
            <Button onClick={() => setShowManualAttendance(!showManualAttendance)} variant="outline">
              Manual Attendance
            </Button>
            <Button variant="outline">Bulk Upload</Button>
          </div>

          {showQRCode && (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-48 h-48 bg-gray-200 mx-auto mb-4 flex items-center justify-center rounded-lg">
                  <div className="text-gray-500 font-mono text-sm">QR CODE</div>
                </div>
                <p className="text-gray-600 mb-2">Students scan this code to mark attendance</p>
                <div className="text-lg font-semibold text-blue-600">
                  <span>0</span> students scanned
                </div>
              </CardContent>
            </Card>
          )}

          {showManualAttendance && (
            <Card>
              <CardHeader>
                <CardTitle>Manual Attendance</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Mark All Present
                  </Button>
                  <Button size="sm" variant="outline">
                    Use Previous Pattern
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-gray-600">{student.rollNo}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50 bg-transparent"
                        >
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
                        >
                          Absent
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700">Save Attendance</Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Other sections */}
      {activeSection === "methods" && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Tracking Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-green-600">QR Code Scanning</h4>
                <div className="text-sm text-green-600 mb-2">Active</div>
                <p className="text-sm text-gray-600">Fast and contactless attendance marking</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold">Manual Entry</h4>
                <div className="text-sm text-gray-600 mb-2">Available</div>
                <p className="text-sm text-gray-600">Traditional roll call method</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold">Bulk Upload</h4>
                <div className="text-sm text-gray-600 mb-2">Available</div>
                <p className="text-sm text-gray-600">Upload attendance from spreadsheet</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeSection === "analytics" && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">View detailed attendance analytics and trends.</p>
          </CardContent>
        </Card>
      )}

      {activeSection === "students" && (
        <Card>
          <CardHeader>
            <CardTitle>Student Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Manage student information and attendance records.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
