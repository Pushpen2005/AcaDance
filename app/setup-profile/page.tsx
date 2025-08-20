"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Camera, Upload, User, Settings, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAdvanced3D, useScrollAnimation } from '@/hooks/use-enhanced-animations';

const steps = [
  { id: 1, name: 'Personal Info', icon: User },
  { id: 2, name: 'Role & Department', icon: Settings },
  { id: 3, name: 'Complete Setup', icon: CheckCircle },
];

const departments = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Mechanical',
  'Civil',
  'Chemical',
  'Mathematics',
  'Physics',
  'Chemistry',
  'English',
  'Administration'
];

export default function SetupProfilePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Animation refs
  const cardRef = useAdvanced3D({ tiltIntensity: 8 });
  const titleRef = useScrollAnimation('fadeInUp');

  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    avatarFile: null as File | null,
    avatarUrl: '',
    role: 'student',
    department: '',
    studentId: '',
    employeeId: '',
    specialization: '',
    semester: '',
    course: '',
    theme: 'light',
    notifications: true,
    attendanceAlerts: true
  });

  const progress = (currentStep / steps.length) * 100;

  // Handle avatar upload
  const handleAvatarUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));
      return publicUrl;
    } catch (err: any) {
      throw new Error('Avatar upload failed');
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Upload avatar if selected
      let avatarUrl = formData.avatarUrl;
      if (formData.avatarFile) {
        avatarUrl = await handleAvatarUpload(formData.avatarFile);
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Authentication required');

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: formData.fullName,
          role: formData.role,
          department: formData.department,
          phone: formData.phone,
          avatar_url: avatarUrl,
        });

      if (profileError) throw profileError;

      // Create role-specific records
      if (formData.role === 'student') {
        await supabase.from('student_features').upsert({
          user_id: user.id,
          timetable_enabled: true,
          attendance_alerts: formData.attendanceAlerts,
          exam_notifications: formData.notifications
        });

        await supabase.from('attendance').upsert({
          user_id: user.id,
          total_classes: 0,
          present_classes: 0,
          absent_classes: 0
        });
      } else if (formData.role === 'faculty') {
        await supabase.from('faculty_features').upsert({
          user_id: user.id,
          class_schedule_enabled: true,
          can_mark_attendance: true,
          can_edit_attendance: true,
          report_access: true
        });
      } else if (formData.role === 'admin') {
        await supabase.from('admin_features').upsert({
          user_id: user.id,
          can_manage_timetable: true,
          can_manage_users: true,
          can_send_notifications: true,
          view_all_reports: true
        });
      }

      // Redirect to appropriate dashboard
      const dashboardPath = `/${formData.role}-dashboard`;
      router.push(dashboardPath);
      
    } catch (err: any) {
      setError(err.message || 'Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div ref={titleRef as React.RefObject<HTMLDivElement>} className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Set up your account to get started with the academic system
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300
                    ${isActive ? 'bg-blue-600 text-white scale-110' : 
                      isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
                  `}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                      Step {step.id}
                    </p>
                    <p className={`text-xs ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                      {step.name}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* Main Card */}
        <Card ref={cardRef as React.RefObject<HTMLDivElement>} className="glass-card animated-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(steps[currentStep - 1].icon, { className: "w-6 h-6" })}
              {steps[currentStep - 1].name}
            </CardTitle>
            <CardDescription>
              Step {currentStep} of {steps.length}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fadeInUp">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => updateFormData('fullName', e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="avatar">Profile Picture</Label>
                  <div className="mt-2 flex items-center gap-4">
                    {formData.avatarUrl && (
                      <img
                        src={formData.avatarUrl}
                        alt="Avatar preview"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    )}
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={(e) => updateFormData('avatarFile', e.target.files?.[0] || null)}
                      className="file-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Role & Department */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fadeInUp">
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => updateFormData('role', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Select value={formData.department} onValueChange={(value) => updateFormData('department', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.role === 'student' && (
                  <>
                    <div>
                      <Label htmlFor="studentId">Student ID</Label>
                      <Input
                        id="studentId"
                        value={formData.studentId}
                        onChange={(e) => updateFormData('studentId', e.target.value)}
                        placeholder="Your student ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="semester">Semester</Label>
                      <Select value={formData.semester} onValueChange={(value) => updateFormData('semester', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6,7,8].map((sem) => (
                            <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {formData.role === 'faculty' && (
                  <>
                    <div>
                      <Label htmlFor="employeeId">Employee ID</Label>
                      <Input
                        id="employeeId"
                        value={formData.employeeId}
                        onChange={(e) => updateFormData('employeeId', e.target.value)}
                        placeholder="Your employee ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="specialization">Specialization</Label>
                      <Input
                        id="specialization"
                        value={formData.specialization}
                        onChange={(e) => updateFormData('specialization', e.target.value)}
                        placeholder="Your area of specialization"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Preferences */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-fadeInUp">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Notification Preferences</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifications">Email Notifications</Label>
                    <input
                      id="notifications"
                      type="checkbox"
                      checked={formData.notifications}
                      onChange={(e) => updateFormData('notifications', e.target.checked)}
                      className="toggle"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="attendanceAlerts">Attendance Alerts</Label>
                    <input
                      id="attendanceAlerts"
                      type="checkbox"
                      checked={formData.attendanceAlerts}
                      onChange={(e) => updateFormData('attendanceAlerts', e.target.checked)}
                      className="toggle"
                    />
                  </div>

                  <div>
                    <Label htmlFor="theme">Preferred Theme</Label>
                    <Select value={formData.theme} onValueChange={(value) => updateFormData('theme', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-2">Setup Summary</h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <p><strong>Name:</strong> {formData.fullName}</p>
                    <p><strong>Role:</strong> {formData.role}</p>
                    <p><strong>Department:</strong> {formData.department}</p>
                    {formData.phone && <p><strong>Phone:</strong> {formData.phone}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>

              {currentStep < steps.length ? (
                <Button
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && !formData.fullName) ||
                    (currentStep === 2 && (!formData.role || !formData.department))
                  }
                  className="flex items-center gap-2 magnetic-button"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 liquid-button"
                >
                  {loading ? 'Setting up...' : 'Complete Setup'}
                  <CheckCircle className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
