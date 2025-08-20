"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useHighlight } from "@/hooks/use-highlight"
import { 
  Activity, 
  Bug, 
  Eye, 
  BarChart3, 
  Shield, 
  Zap,
  Users,
  Calendar,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Info
} from "lucide-react"

export default function HighlightDemo() {
  const { identify, track, trackAcademic, trackPerformance, reportError } = useHighlight()
  const [demoUserId, setDemoUserId] = useState('')
  const [eventName, setEventName] = useState('')
  const [testError, setTestError] = useState('')

  const handleIdentifyUser = () => {
    if (demoUserId) {
      identify(demoUserId, {
        email: `${demoUserId}@academic-system.edu`,
        full_name: `Demo User ${demoUserId}`,
        role: 'student',
        department: 'Computer Science'
      })
    }
  }

  const handleTrackEvent = () => {
    if (eventName) {
      track(eventName, {
        demoMode: true,
        timestamp: new Date().toISOString()
      })
    }
  }

  const handleAcademicTracking = (action: string) => {
    const sessionId = `demo-session-${Date.now()}`
    const studentId = demoUserId || 'demo-student'
    
    switch (action) {
      case 'attendance':
        trackAcademic.attendanceMarked(sessionId, studentId, 'qr-code')
        break
      case 'login':
        trackAcademic.login(studentId, 'student')
        break
      case 'dashboard':
        trackAcademic.dashboardViewed(studentId, 'student', 'main')
        break
      case 'timetable':
        trackAcademic.timetableGenerated('demo-group', 'demo-teacher')
        break
      case 'qr-scan':
        trackAcademic.qrCodeScanned(sessionId, studentId)
        break
    }
  }

  const handleTestError = () => {
    try {
      if (testError) {
        throw new Error(testError)
      } else {
        throw new Error('Demo error for testing Highlight.io error tracking')
      }
    } catch (error) {
      reportError(error as Error, {
        component: 'HighlightDemo',
        userAction: 'test_error_button',
        demoMode: true
      })
    }
  }

  const handlePerformanceTest = () => {
    // Simulate performance tracking
    trackPerformance('page_load_time', 1250, '/highlight-demo')
    trackPerformance('bundle_size', 2048, '/highlight-demo')
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-green-600 flex items-center justify-center gap-2">
            <Activity className="w-8 h-8" />
            Highlight.io Integration Demo
          </h1>
          <p className="text-lg text-green-700">
            Error monitoring, session replay, and performance tracking for the Academic Management System
          </p>
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Real-time Monitoring Active
          </Badge>
        </div>

        {/* Features Overview */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Bug className="w-5 h-5" />
                Error Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-600 mb-4">
                Automatic error detection and reporting with stack traces and user context.
              </p>
              <ul className="space-y-2 text-sm text-green-700">
                <li>• JavaScript errors</li>
                <li>• Unhandled promises</li>
                <li>• Network failures</li>
                <li>• Custom error reporting</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Eye className="w-5 h-5" />
                Session Replay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-600 mb-4">
                Watch user interactions and reproduce issues with complete session recordings.
              </p>
              <ul className="space-y-2 text-sm text-green-700">
                <li>• DOM interactions</li>
                <li>• Mouse movements</li>
                <li>• Form inputs (privacy-safe)</li>
                <li>• Network requests</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <BarChart3 className="w-5 h-5" />
                Performance Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-600 mb-4">
                Track application performance and user experience metrics.
              </p>
              <ul className="space-y-2 text-sm text-green-700">
                <li>• Page load times</li>
                <li>• API response times</li>
                <li>• Core Web Vitals</li>
                <li>• Custom metrics</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Academic-Specific Features */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <BookOpen className="w-5 h-5" />
              Academic System Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-800 mb-3">Tracked Events</h4>
                <ul className="space-y-2 text-sm text-green-700">
                  <li>• User authentication (login/logout)</li>
                  <li>• Attendance marking and validation</li>
                  <li>• Timetable generation and access</li>
                  <li>• QR code scanning for attendance</li>
                  <li>• Report generation and downloads</li>
                  <li>• Dashboard and page views</li>
                  <li>• Settings changes</li>
                  <li>• Notification events</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-green-800 mb-3">User Context</h4>
                <ul className="space-y-2 text-sm text-green-700">
                  <li>• User role (student/faculty/admin)</li>
                  <li>• Department and institution</li>
                  <li>• Session and class information</li>
                  <li>• Academic performance data</li>
                  <li>• Device and browser info</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Demo */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Users className="w-5 h-5" />
                User Identification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Enter demo user ID"
                value={demoUserId}
                onChange={(e) => setDemoUserId(e.target.value)}
                className="input-modern"
              />
              <Button 
                onClick={handleIdentifyUser}
                className="btn-primary w-full"
                disabled={!demoUserId}
              >
                Identify User in Highlight.io
              </Button>
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  This will identify the user in Highlight.io for session tracking.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Activity className="w-5 h-5" />
                Custom Event Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Enter event name"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="input-modern"
              />
              <Button 
                onClick={handleTrackEvent}
                className="btn-primary w-full"
                disabled={!eventName}
              >
                Track Custom Event
              </Button>
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  Custom events help track specific user actions and workflows.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Academic Actions Demo */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Calendar className="w-5 h-5" />
              Academic Actions Demo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Button 
                onClick={() => handleAcademicTracking('login')}
                variant="outline"
                className="hover-green"
              >
                Track Login
              </Button>
              <Button 
                onClick={() => handleAcademicTracking('attendance')}
                variant="outline"
                className="hover-green"
              >
                Mark Attendance
              </Button>
              <Button 
                onClick={() => handleAcademicTracking('dashboard')}
                variant="outline"
                className="hover-green"
              >
                View Dashboard
              </Button>
              <Button 
                onClick={() => handleAcademicTracking('timetable')}
                variant="outline"
                className="hover-green"
              >
                Generate Timetable
              </Button>
              <Button 
                onClick={() => handleAcademicTracking('qr-scan')}
                variant="outline"
                className="hover-green"
              >
                Scan QR Code
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Testing */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Bug className="w-5 h-5" />
                Error Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Enter error message (optional)"
                value={testError}
                onChange={(e) => setTestError(e.target.value)}
                className="input-modern"
              />
              <Button 
                onClick={handleTestError}
                variant="destructive"
                className="w-full"
              >
                Trigger Test Error
              </Button>
              <Alert className="alert-warning">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  This will trigger a test error that will be captured by Highlight.io.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Zap className="w-5 h-5" />
                Performance Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handlePerformanceTest}
                className="btn-primary w-full"
              >
                Track Performance Metrics
              </Button>
              <Alert className="alert-info">
                <Info className="w-4 h-4" />
                <AlertDescription>
                  This will send sample performance metrics to Highlight.io.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Setup Instructions */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Shield className="w-5 h-5" />
              Setup Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="alert-success">
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  Highlight.io is already configured and active in this application!
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-green-800">Configuration Steps:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-green-700">
                  <li>Sign up at <a href="https://app.highlight.io" className="text-green-600 underline" target="_blank" rel="noopener noreferrer">app.highlight.io</a></li>
                  <li>Create a new project and get your Project ID</li>
                  <li>Add <code className="bg-green-100 px-1 py-0.5 rounded">NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID</code> to your environment variables</li>
                  <li>The integration is automatically initialized in the app layout</li>
                  <li>Use the <code className="bg-green-100 px-1 py-0.5 rounded">useHighlight</code> hook throughout your app for tracking</li>
                </ol>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Environment Variables:</h4>
                <pre className="text-xs text-green-700 bg-green-100 p-2 rounded overflow-x-auto">
{`NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_HIGHLIGHT_BACKEND_URL=https://pub.highlight.io`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-2 pt-8">
          <p className="text-green-700">
            Visit <a href="https://app.highlight.io" className="text-green-600 underline" target="_blank" rel="noopener noreferrer">Highlight.io Dashboard</a> to view real-time data
          </p>
          <p className="text-sm text-green-600">
            All events from this demo are being tracked and can be viewed in your Highlight.io project
          </p>
        </div>
      </div>
    </div>
  )
}
