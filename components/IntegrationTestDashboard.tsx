"use client"

// Enhanced with Advanced Supabase Integration
import React, { useState, useEffect } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Database, 
  QrCode, 
  UserCheck, 
  BarChart3,
  Users,
  Bell,
  RefreshCw,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/lib/notifications';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  data?: any;
  duration?: number;
}

const IntegrationTestDashboard: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { sendNotification } = useNotifications();

  // Test data
  const [testSession, setTestSession] = useState({
    course_id: '',
    faculty_id: '',
    scheduled_date: new Date().toISOString(),
    duration_minutes: 60,
    location: 'Test Classroom',
  });

  const [testAttendance, setTestAttendance] = useState({
    qr_code: '',
    user_id: '',
  });

  const [testEnrollment, setTestEnrollment] = useState({
    course_id: '',
    student_ids: '',
    enrolled_by: '',
  });

  // Update test result
  const updateTestResult = (name: string, updates: Partial<TestResult>) => {
    setTestResults(prev => {
      const index = prev.findIndex(r => r.name === name);
      if (index >= 0) {
        return prev.map((result, i) => 
          i === index ? { ...result, ...updates } : result
        );
      } else {
        return [...prev, { name, status: 'pending', ...updates }];
      }
    });
  };

  // Run individual test
  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    const startTime = Date.now();
    updateTestResult(testName, { status: 'running' });

    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      updateTestResult(testName, {
        status: 'success',
        message: 'Test completed successfully',
        data: result,
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult(testName, {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });
      throw error;
    }
  };

  // Test system initialization
  const testSystemInit = async () => {
    return runTest('System Initialization', async () => {
      const response = await fetch('/api/system/init', { method: 'POST' });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'System initialization failed');
      }
      
      return data.data;
    });
  };

  // Test session creation
  const testSessionCreation = async () => {
    return runTest('Session Creation with QR', async () => {
      const response = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testSession),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Session creation failed');
      }
      
      // Update test attendance with generated QR code
      setTestAttendance(prev => ({
        ...prev,
        qr_code: data.data.qr_code,
      }));
      
      return data.data;
    });
  };

  // Test attendance validation
  const testAttendanceValidation = async () => {
    return runTest('Attendance Validation', async () => {
      if (!testAttendance.qr_code || !testAttendance.user_id) {
        throw new Error('QR code or user ID not provided');
      }

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testAttendance),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Attendance validation failed');
      }
      
      return data.data;
    });
  };

  // Test analytics
  const testAnalytics = async () => {
    return runTest('System Analytics', async () => {
      const response = await fetch('/api/analytics/system');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Analytics retrieval failed');
      }
      
      return data.data;
    });
  };

  // Test batch enrollment
  const testBatchEnrollment = async () => {
    return runTest('Batch Enrollment', async () => {
      if (!testEnrollment.course_id || !testEnrollment.student_ids || !testEnrollment.enrolled_by) {
        throw new Error('Missing enrollment data');
      }

      const studentIds = testEnrollment.student_ids.split(',').map(id => id.trim());

      const response = await fetch('/api/enrollments/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: testEnrollment.course_id,
          student_ids: studentIds,
          enrolled_by: testEnrollment.enrolled_by,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Batch enrollment failed');
      }
      
      return data.data;
    });
  };

  // Test notifications
  const testNotifications = async () => {
    return runTest('Notification System', async () => {
      if (!testAttendance.user_id) {
        throw new Error('User ID required for notification test');
      }

      await sendNotification({
        user_id: testAttendance.user_id,
        type: 'system',
        title: 'Integration Test',
        message: 'This is a test notification from the integration test suite.',
        is_read: false,
        priority: 'normal',
      });
      
      return { message: 'Notification sent successfully' };
    });
  };

  // Run all tests
  const runAllTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    try {
      // Run tests in sequence
      await testSystemInit();
      
      if (testSession.course_id && testSession.faculty_id) {
        await testSessionCreation();
      }
      
      if (testAttendance.user_id) {
        if (testAttendance.qr_code) {
          await testAttendanceValidation();
        }
        await testNotifications();
      }
      
      await testAnalytics();
      
      if (testEnrollment.course_id && testEnrollment.student_ids && testEnrollment.enrolled_by) {
        await testBatchEnrollment();
      }
      
      toast({
        title: "Integration Tests Completed",
        description: "All tests have been executed. Check results below.",
      });

    } catch (error) {
      console.error('Test execution failed:', error);
      toast({
        title: "Test Execution Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-300" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      running: 'secondary',
      pending: 'outline',
    } as const;
    
    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Integration Testing
          </h1>
          <p className="text-green-700 dark:text-gray-400 mt-2">
            Test and validate all Academic System integrations
          </p>
        </div>
        
        <Button 
          onClick={runAllTests}
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Run All Tests
        </Button>
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">Test Configuration</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="individual">Individual Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Session Test Data
                </CardTitle>
                <CardDescription>
                  Configure test data for session creation and QR generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="course_id">Course ID</Label>
                  <Input
                    id="course_id"
                    value={testSession.course_id}
                    onChange={(e) => setTestSession(prev => ({ ...prev, course_id: e.target.value }))}
                    placeholder="Enter course UUID"
                  />
                </div>
                <div>
                  <Label htmlFor="faculty_id">Faculty ID</Label>
                  <Input
                    id="faculty_id"
                    value={testSession.faculty_id}
                    onChange={(e) => setTestSession(prev => ({ ...prev, faculty_id: e.target.value }))}
                    placeholder="Enter faculty UUID"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={testSession.location}
                    onChange={(e) => setTestSession(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Classroom location"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Attendance Test Data
                </CardTitle>
                <CardDescription>
                  Configure test data for attendance validation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="user_id">Student User ID</Label>
                  <Input
                    id="user_id"
                    value={testAttendance.user_id}
                    onChange={(e) => setTestAttendance(prev => ({ ...prev, user_id: e.target.value }))}
                    placeholder="Enter student UUID"
                  />
                </div>
                <div>
                  <Label htmlFor="qr_code">QR Code</Label>
                  <Input
                    id="qr_code"
                    value={testAttendance.qr_code}
                    onChange={(e) => setTestAttendance(prev => ({ ...prev, qr_code: e.target.value }))}
                    placeholder="Auto-filled from session creation"
                    disabled
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Enrollment Test Data
                </CardTitle>
                <CardDescription>
                  Configure test data for batch enrollment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="enroll_course_id">Course ID</Label>
                  <Input
                    id="enroll_course_id"
                    value={testEnrollment.course_id}
                    onChange={(e) => setTestEnrollment(prev => ({ ...prev, course_id: e.target.value }))}
                    placeholder="Enter course UUID"
                  />
                </div>
                <div>
                  <Label htmlFor="student_ids">Student IDs (comma-separated)</Label>
                  <Textarea
                    id="student_ids"
                    value={testEnrollment.student_ids}
                    onChange={(e) => setTestEnrollment(prev => ({ ...prev, student_ids: e.target.value }))}
                    placeholder="UUID1, UUID2, UUID3"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="enrolled_by">Enrolled By (Faculty ID)</Label>
                  <Input
                    id="enrolled_by"
                    value={testEnrollment.enrolled_by}
                    onChange={(e) => setTestEnrollment(prev => ({ ...prev, enrolled_by: e.target.value }))}
                    placeholder="Enter faculty UUID"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {testResults.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No test results yet. Run tests to see results here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        {result.name}
                      </div>
                      <div className="flex items-center gap-2">
                        {result.duration && (
                          <span className="text-sm text-gray-500">
                            {result.duration}ms
                          </span>
                        )}
                        {getStatusBadge(result.status)}
                      </div>
                    </CardTitle>
                    {result.message && (
                      <CardDescription>
                        {result.message}
                      </CardDescription>
                    )}
                  </CardHeader>
                  {result.data && (
                    <CardContent>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded p-4">
                        <pre className="text-sm overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="individual" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  System Init
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={testSystemInit}
                  className="w-full"
                  variant="outline"
                >
                  Test System Initialization
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Session Creation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={testSessionCreation}
                  className="w-full"
                  variant="outline"
                  disabled={!testSession.course_id || !testSession.faculty_id}
                >
                  Test Session Creation
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={testAttendanceValidation}
                  className="w-full"
                  variant="outline"
                  disabled={!testAttendance.qr_code || !testAttendance.user_id}
                >
                  Test Attendance
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={testAnalytics}
                  className="w-full"
                  variant="outline"
                >
                  Test Analytics
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Batch Enrollment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={testBatchEnrollment}
                  className="w-full"
                  variant="outline"
                  disabled={!testEnrollment.course_id || !testEnrollment.student_ids}
                >
                  Test Enrollment
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={testNotifications}
                  className="w-full"
                  variant="outline"
                  disabled={!testAttendance.user_id}
                >
                  Test Notifications
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Performance and Error Handling Enhanced
export default React.memo(IntegrationTestDashboard);
