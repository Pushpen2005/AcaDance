// Enhanced with Advanced Supabase Integration
import React, { useState, useEffect } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Share2, Bell, Mail, MessageSquare, Download, Printer, 
  Calendar, Users, Clock, FileText, Settings, Send
} from "lucide-react";

const TimetableSharingAndNotifications = () => {
  const [shareSettings, setShareSettings] = useState({
    shareType: 'public',
    expiryDays: '30',
    allowDownload: true,
    allowPrint: true,
    watermark: true
  });

  const [notificationSettings, setNotificationSettings] = useState({
    timetableChanges: true,
    attendanceAlerts: true,
    classReminders: true,
    examSchedules: true,
    holidayUpdates: true
  });

  const shareLinks = [
    { id: 1, type: 'Department Share', url: 'https://academicsystem.com/share/dept-cs-2024', views: 245, created: '2024-01-15' },
    { id: 2, type: 'Student Batch', url: 'https://academicsystem.com/share/batch-cs-2024', views: 89, created: '2024-01-20' },
    { id: 3, type: 'Faculty Only', url: 'https://academicsystem.com/share/faculty-private', views: 15, created: '2024-01-22' },
  ];

  const notificationTemplates = [
    { id: 1, name: 'Timetable Change Alert', type: 'timetable', usage: 45 },
    { id: 2, name: 'Class Reminder', type: 'reminder', usage: 120 },
    { id: 3, name: 'Exam Schedule Update', type: 'exam', usage: 30 },
    { id: 4, name: 'Holiday Announcement', type: 'holiday', usage: 15 },
  ];

  const pendingNotifications = [
    { id: 1, title: 'Timetable Updated for Week 5', recipients: 245, status: 'pending', type: 'timetable' },
    { id: 2, title: 'Room Change: CS101 moved to A-205', recipients: 45, status: 'sending', type: 'urgent' },
    { id: 3, title: 'Holiday on Friday - Classes Cancelled', recipients: 300, status: 'sent', type: 'holiday' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timetable Sharing & Notifications</h1>
          <p className="text-muted-foreground mt-2">
            Share timetables and manage notification systems
          </p>
        </div>
      </div>

      <Tabs defaultValue="sharing" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sharing">Sharing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Sharing Tab */}
        <TabsContent value="sharing" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Create Share Link */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Create Share Link
                </CardTitle>
                <CardDescription>
                  Generate shareable links for timetables
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Share Type</Label>
                  <Select value={shareSettings.shareType} onValueChange={(value) => setShareSettings({...shareSettings, shareType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public Access</SelectItem>
                      <SelectItem value="protected">Password Protected</SelectItem>
                      <SelectItem value="private">Private (Invited Users Only)</SelectItem>
                      <SelectItem value="temporary">Temporary (24 hours)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Expiry (Days)</Label>
                  <Input 
                    type="number" 
                    value={shareSettings.expiryDays}
                    onChange={(e) => setShareSettings({...shareSettings, expiryDays: e.target.value})}
                    placeholder="30"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Allow Download</Label>
                    <Switch 
                      checked={shareSettings.allowDownload}
                      onCheckedChange={(checked) => setShareSettings({...shareSettings, allowDownload: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Allow Printing</Label>
                    <Switch 
                      checked={shareSettings.allowPrint}
                      onCheckedChange={(checked) => setShareSettings({...shareSettings, allowPrint: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Add Watermark</Label>
                    <Switch 
                      checked={shareSettings.watermark}
                      onCheckedChange={(checked) => setShareSettings({...shareSettings, watermark: checked})}
                    />
                  </div>
                </div>

                <Button className="w-full">
                  <Share2 className="w-4 h-4 mr-2" />
                  Generate Share Link
                </Button>
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Export & Print Options
                </CardTitle>
                <CardDescription>
                  Export timetables in various formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Export as PDF
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Export as Excel
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Export as iCal
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Printer className="w-4 h-4 mr-2" />
                  Print-Friendly View
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share via Email
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Share on WhatsApp
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Active Share Links */}
          <Card>
            <CardHeader>
              <CardTitle>Active Share Links</CardTitle>
              <CardDescription>
                Manage existing timetable share links
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {shareLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium">{link.type}</p>
                      <p className="text-sm text-muted-foreground">{link.url}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {link.views} views • Created {link.created}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">Copy</Button>
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm" variant="destructive">Revoke</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Send Notification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Send Notification
                </CardTitle>
                <CardDescription>
                  Create and send notifications about timetable changes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Notification Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="timetable">Timetable Change</SelectItem>
                      <SelectItem value="urgent">Urgent Update</SelectItem>
                      <SelectItem value="reminder">Class Reminder</SelectItem>
                      <SelectItem value="holiday">Holiday/Event</SelectItem>
                      <SelectItem value="exam">Exam Schedule</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Recipients</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="students">Students Only</SelectItem>
                      <SelectItem value="faculty">Faculty Only</SelectItem>
                      <SelectItem value="department">Specific Department</SelectItem>
                      <SelectItem value="batch">Specific Batch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input placeholder="Notification subject" />
                </div>

                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea placeholder="Notification message..." rows={4} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Send Email</Label>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Send Push Notification</Label>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Send SMS</Label>
                    <Switch />
                  </div>
                </div>

                <Button className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Send Notification
                </Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure automatic notification triggers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Timetable Changes</Label>
                      <p className="text-sm text-muted-foreground">Notify when timetable is updated</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.timetableChanges}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, timetableChanges: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Attendance Alerts</Label>
                      <p className="text-sm text-muted-foreground">Send low attendance warnings</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.attendanceAlerts}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, attendanceAlerts: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Class Reminders</Label>
                      <p className="text-sm text-muted-foreground">Remind users of upcoming classes</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.classReminders}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, classReminders: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Exam Schedules</Label>
                      <p className="text-sm text-muted-foreground">Notify about exam schedule updates</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.examSchedules}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, examSchedules: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Holiday Updates</Label>
                      <p className="text-sm text-muted-foreground">Announce holidays and events</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.holidayUpdates}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, holidayUpdates: checked})}
                    />
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Notification Queue */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Queue</CardTitle>
              <CardDescription>
                View pending and sent notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingNotifications.map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{notification.title}</p>
                        <Badge variant={notification.type === 'urgent' ? 'destructive' : 'secondary'}>
                          {notification.type}
                        </Badge>
                        <Badge variant={
                          notification.status === 'sent' ? 'default' :
                          notification.status === 'sending' ? 'secondary' : 'outline'
                        }>
                          {notification.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.recipients} recipients
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {notification.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline">Edit</Button>
                          <Button size="sm">Send Now</Button>
                        </>
                      )}
                      {notification.status === 'sent' && (
                        <Button size="sm" variant="outline">View Details</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Templates</CardTitle>
              <CardDescription>
                Manage reusable notification templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notificationTemplates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium">{template.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Type: {template.type} • Used {template.usage} times
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">Use</Button>
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm" variant="destructive">Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4">
                Create New Template
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-muted-foreground">+15% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Notifications Sent</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3,456</div>
                <p className="text-xs text-muted-foreground">+23% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89.2%</div>
                <p className="text-xs text-muted-foreground">+2.1% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Downloads</CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">892</div>
                <p className="text-xs text-muted-foreground">+8% from last month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sharing & Notification Analytics</CardTitle>
              <CardDescription>
                Detailed analytics on timetable sharing and notification performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border">
                  <h3 className="font-medium mb-2">Most Popular Share Types</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Department Shares</span>
                      <span>45%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Student Batch Shares</span>
                      <span>30%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Faculty Private</span>
                      <span>25%</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border">
                  <h3 className="font-medium mb-2">Notification Performance</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Class Reminders</span>
                      <span className="text-green-600">95% open rate</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Timetable Changes</span>
                      <span className="text-green-600">88% open rate</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Holiday Updates</span>
                      <span className="text-yellow-600">76% open rate</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimetableSharingAndNotifications;
