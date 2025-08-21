"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export default function Settings() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">Save Settings</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Institution Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Institution Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="institutionName">Institution Name</Label>
              <Input id="institutionName" defaultValue="HH310 Academic Institute" />
            </div>
            <div>
              <Label htmlFor="academicYear">Academic Year</Label>
              <Select defaultValue="2024-25">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-25">2024-25</SelectItem>
                  <SelectItem value="2025-26">2025-26</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="currentSemester">Semester</Label>
              <Select defaultValue="1">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>
                      Semester {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* System Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>System Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="defaultAlgorithm">Default Timetable Algorithm</Label>
              <Select defaultValue="genetic">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="genetic">Genetic Algorithm</SelectItem>
                  <SelectItem value="csp">Constraint Satisfaction Problem</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="attendanceThreshold">Attendance Threshold (%)</Label>
              <Input id="attendanceThreshold" type="number" defaultValue="75" min="1" max="100" />
            </div>
            <div>
              <Label htmlFor="autosaveInterval">Auto-save Interval (minutes)</Label>
              <Input id="autosaveInterval" type="number" defaultValue="5" min="1" max="60" />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="emailNotifications" defaultChecked />
              <Label htmlFor="emailNotifications">Email Notifications</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="attendanceAlerts" defaultChecked />
              <Label htmlFor="attendanceAlerts">Low Attendance Alerts</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="scheduleReminders" defaultChecked />
              <Label htmlFor="scheduleReminders">Schedule Reminders</Label>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Button variant="outline">Export Data</Button>
              <Button variant="outline">Import Data</Button>
              <Button variant="outline">Backup System</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
