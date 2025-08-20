import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"
import { 
  Calendar, 
  Clock, 
  Users, 
  BookOpen, 
  MapPin, 
  Settings, 
  Eye, 
  Edit, 
  UserCheck,
  Shield,
  Lock,
  Unlock,
  Bell,
  Share2,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Zap
} from 'lucide-react'

interface UserProfile {
  id: string
  full_name: string
  role: 'student' | 'faculty' | 'admin'
  department: string
}

interface TimetablePermissions {
  canView: boolean
  canEdit: boolean
  canCreate: boolean
  canDelete: boolean
  canExport: boolean
  canShare: boolean
  canManageConstraints: boolean
  canRunOptimization: boolean
  canViewAnalytics: boolean
  canManageUsers: boolean
  canAccessAllDepartments: boolean
  canEditFacultySchedule: boolean
  canRequestSwaps: boolean
  canApproveSwaps: boolean
}

export default function RoleBasedTimetableAccess() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [permissions, setPermissions] = useState<TimetablePermissions | null>(null)
  const [userRole, setUserRole] = useState<'student' | 'faculty' | 'admin'>('student')
  const [availableFeatures, setAvailableFeatures] = useState<string[]>([])
  
  const { toast } = useToast()

  useEffect(() => {
    getCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      calculatePermissions(currentUser.role)
      getAvailableFeatures(currentUser.role)
    }
  }, [currentUser])

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setCurrentUser(profile)
          setUserRole(profile.role)
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const calculatePermissions = (role: 'student' | 'faculty' | 'admin') => {
    let perms: TimetablePermissions = {
      canView: false,
      canEdit: false,
      canCreate: false,
      canDelete: false,
      canExport: false,
      canShare: false,
      canManageConstraints: false,
      canRunOptimization: false,
      canViewAnalytics: false,
      canManageUsers: false,
      canAccessAllDepartments: false,
      canEditFacultySchedule: false,
      canRequestSwaps: false,
      canApproveSwaps: false
    }

    switch (role) {
      case 'student':
        perms = {
          ...perms,
          canView: true,
          canExport: true,
          canRequestSwaps: false, // Students typically can't request swaps directly
          canViewAnalytics: false, // Limited analytics for students
          canAccessAllDepartments: false
        }
        break

      case 'faculty':
        perms = {
          ...perms,
          canView: true,
          canEdit: true, // Can edit their own schedule
          canExport: true,
          canShare: true,
          canRequestSwaps: true,
          canViewAnalytics: true, // Faculty can view their utilization
          canEditFacultySchedule: true,
          canAccessAllDepartments: false // Only their department
        }
        break

      case 'admin':
        perms = {
          canView: true,
          canEdit: true,
          canCreate: true,
          canDelete: true,
          canExport: true,
          canShare: true,
          canManageConstraints: true,
          canRunOptimization: true,
          canViewAnalytics: true,
          canManageUsers: true,
          canAccessAllDepartments: true,
          canEditFacultySchedule: true,
          canRequestSwaps: true,
          canApproveSwaps: true
        }
        break
    }

    setPermissions(perms)
  }

  const getAvailableFeatures = (role: 'student' | 'faculty' | 'admin') => {
    const features: string[] = []

    switch (role) {
      case 'student':
        features.push(
          'View Class Schedule',
          'View Batch Timetable',
          'Export Personal Schedule',
          'Attendance Integration',
          'Class Notifications',
          'Free Slot Analysis'
        )
        break

      case 'faculty':
        features.push(
          'View Personal Schedule',
          'View Class Lists',
          'Request Schedule Changes',
          'Mark Attendance via Timetable',
          'View Teaching Load',
          'Export Class Reports',
          'Set Availability Preferences',
          'View Room Assignments'
        )
        break

      case 'admin':
        features.push(
          'Full Timetable Management',
          'Smart Scheduling Algorithms',
          'Conflict Resolution',
          'Faculty Workload Management',
          'Room Utilization Analysis',
          'Department-wise Reports',
          'Bulk Schedule Operations',
          'System Configuration',
          'User Role Management',
          'Advanced Analytics',
          'Automated Notifications',
          'Integration Management'
        )
        break
    }

    setAvailableFeatures(features)
  }

  const hasPermission = (permission: keyof TimetablePermissions): boolean => {
    return permissions?.[permission] ?? false
  }

  const renderStudentView = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-green-600" />
            <span>My Timetable</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h3 className="font-semibold">Current Semester Schedule</h3>
                <p className="text-sm text-green-700">View your class timings and locations</p>
              </div>
              <Button>
                <Eye className="w-4 h-4 mr-2" />
                View Schedule
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <h3 className="font-semibold">Attendance Overview</h3>
                <p className="text-sm text-green-700">Track your attendance by subject</p>
              </div>
              <Button variant="outline">
                <UserCheck className="w-4 h-4 mr-2" />
                View Attendance
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div>
                <h3 className="font-semibold">Export Schedule</h3>
                <p className="text-sm text-green-700">Download your timetable in various formats</p>
              </div>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Features */}
      <Card>
        <CardHeader>
          <CardTitle>Available Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableFeatures.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderFacultyView = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-green-600" />
            <span>Faculty Dashboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <h3 className="font-semibold">My Teaching Schedule</h3>
                <p className="text-sm text-green-700">View and manage your classes</p>
              </div>
              <Button>
                <Calendar className="w-4 h-4 mr-2" />
                View Classes
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h3 className="font-semibold">Workload Analysis</h3>
                <p className="text-sm text-green-700">Check your teaching hours</p>
              </div>
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div>
                <h3 className="font-semibold">Schedule Requests</h3>
                <p className="text-sm text-green-700">Request schedule changes</p>
              </div>
              <Button variant="outline" disabled={!hasPermission('canRequestSwaps')}>
                <Edit className="w-4 h-4 mr-2" />
                Request Change
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div>
                <h3 className="font-semibold">Availability Settings</h3>
                <p className="text-sm text-green-700">Set your availability preferences</p>
              </div>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Faculty Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Your Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {permissions && Object.entries(permissions).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').replace('can', '')}</span>
                <div className="flex items-center">
                  {value ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderAdminView = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-red-600" />
            <span>Admin Control Panel</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <h3 className="font-semibold">Timetable Management</h3>
                <p className="text-sm text-green-700">Full CRUD operations</p>
              </div>
              <Button>
                <Edit className="w-4 h-4 mr-2" />
                Manage
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h3 className="font-semibold">Smart Optimization</h3>
                <p className="text-sm text-green-700">AI-powered scheduling</p>
              </div>
              <Button variant="outline" disabled={!hasPermission('canRunOptimization')}>
                <Zap className="w-4 h-4 mr-2" />
                Optimize
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <h3 className="font-semibold">Analytics Dashboard</h3>
                <p className="text-sm text-green-700">Comprehensive reports</p>
              </div>
              <Button variant="outline" disabled={!hasPermission('canViewAnalytics')}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div>
                <h3 className="font-semibold">User Management</h3>
                <p className="text-sm text-green-700">Manage roles and permissions</p>
              </div>
              <Button variant="outline" disabled={!hasPermission('canManageUsers')}>
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div>
                <h3 className="font-semibold">System Settings</h3>
                <p className="text-sm text-green-700">Configure constraints</p>
              </div>
              <Button variant="outline" disabled={!hasPermission('canManageConstraints')}>
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
              <div>
                <h3 className="font-semibold">Bulk Operations</h3>
                <p className="text-sm text-green-700">Import/Export schedules</p>
              </div>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Bulk Actions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Features */}
      <Card>
        <CardHeader>
          <CardTitle>Administrative Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableFeatures.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded border">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permission Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Full Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Permission</th>
                  <th className="text-center p-2">Student</th>
                  <th className="text-center p-2">Faculty</th>
                  <th className="text-center p-2">Admin</th>
                </tr>
              </thead>
              <tbody>
                {permissions && Object.keys(permissions).map(permission => {
                  const studentPerms = { canView: true, canExport: true } as any
                  const facultyPerms = { 
                    canView: true, canEdit: true, canExport: true, canShare: true, 
                    canRequestSwaps: true, canViewAnalytics: true, canEditFacultySchedule: true 
                  } as any
                  const adminPerms = permissions

                  return (
                    <tr key={permission} className="border-b hover:bg-gray-50">
                      <td className="p-2 capitalize">
                        {permission.replace(/([A-Z])/g, ' $1').replace('can', '')}
                      </td>
                      <td className="p-2 text-center">
                        {studentPerms[permission] ? (
                          <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-400 mx-auto" />
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {facultyPerms[permission] ? (
                          <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-400 mx-auto" />
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {(adminPerms as any)[permission] ? (
                          <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-400 mx-auto" />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  if (!currentUser) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">Please log in to access timetable features</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Timetable Access Control
          </h1>
          <p className="text-green-700 mt-1">Role-based permissions and features</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="px-3 py-1">
            <Users className="w-4 h-4 mr-2" />
            {currentUser.role.toUpperCase()}
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            {currentUser.department}
          </Badge>
        </div>
      </div>

      {/* User Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{currentUser.full_name}</h2>
              <p className="text-green-700">{currentUser.role} • {currentUser.department}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">
                {currentUser.role === 'admin' ? 'Full Access' : 
                 currentUser.role === 'faculty' ? 'Limited Access' : 'View Only'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role-based Content */}
      <Tabs value={userRole} onValueChange={(value: any) => setUserRole(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="student">Student View</TabsTrigger>
          <TabsTrigger value="faculty">Faculty View</TabsTrigger>
          <TabsTrigger value="admin">Admin View</TabsTrigger>
        </TabsList>

        <TabsContent value="student">
          {renderStudentView()}
        </TabsContent>

        <TabsContent value="faculty">
          {renderFacultyView()}
        </TabsContent>

        <TabsContent value="admin">
          {renderAdminView()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
