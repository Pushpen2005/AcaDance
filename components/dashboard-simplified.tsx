"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, Calendar, AlertTriangle, Clock, BookOpen, GraduationCap, Target } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

// Simple skeleton component
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// Profile interface
interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'faculty' | 'admin';
  department?: string;
  phone?: string;
  created_at?: string;
}

function ClientDateTime() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  if (!currentTime) return <Skeleton className="h-4 w-32" />

  return (
    <div className="text-xs sm:text-sm">
      <div className="font-medium">{currentTime.toLocaleDateString()}</div>
      <div className="text-green-600">{currentTime.toLocaleTimeString()}</div>
    </div>
  )
}

export default function SimplifiedDashboard() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  const metrics = [
    {
      label: "Total Classes Scheduled",
      value: "24",
      icon: Calendar,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      label: "Overall Attendance Rate",
      value: "87%",
      icon: TrendingUp,
      color: "from-green-600 to-green-700",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
    },
    {
      label: "Active Teachers",
      value: "12",
      icon: GraduationCap,
      color: "from-green-400 to-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      label: "Student Groups",
      value: "8",
      icon: Users,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
  ]

  const getSidebarItems = (role: string) => {
    switch (role) {
      case 'admin':
        return ['Dashboard', 'User Management', 'System Settings', 'Analytics', 'Reports', 'QR Attendance']
      case 'faculty':
        return ['Dashboard', 'My Classes', 'Attendance', 'QR Sessions', 'Reports', 'Timetable']
      case 'student':
        return ['Dashboard', 'My Attendance', 'QR Scanner', 'Timetable', 'Notifications']
      default:
        return ['Dashboard', 'Profile', 'Settings']
    }
  }

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        setLoadingProfile(true)
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (error) {
            console.error('Error fetching profile:', error)
            // Create default profile if none exists
            const defaultProfile: Partial<Profile> = {
              id: user.id,
              email: user.email || '',
              name: user.email?.split('@')[0] || 'User',
              role: 'student'
            }
            setProfile(defaultProfile as Profile)
          } else {
            setProfile(profileData)
          }
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoadingProfile(false)
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
          <div className="w-full xl:w-auto">
            <h1 className="text-2xl sm:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
              {profile?.role ? `${profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} Dashboard` : 'Dashboard'}
            </h1>
            <p className="text-green-700 mt-2 text-sm sm:text-base">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right bg-white/80 backdrop-blur p-4 rounded-xl shadow-lg">
              <ClientDateTime />
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full xl:w-64 bg-white/80 backdrop-blur rounded-xl shadow-lg p-4 order-2 xl:order-1">
            <h2 className="font-semibold text-lg mb-4 text-green-800">Menu</h2>
            {loadingProfile ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <ul className="space-y-2">
                {getSidebarItems(profile?.role || 'student').map(item => (
                  <li key={item} className="py-2 px-3 rounded-lg hover:bg-green-100 cursor-pointer transition-colors text-sm">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-6 order-1 xl:order-2">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {metrics.map((metric, index) => (
                <Card key={index} className="bg-white/80 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs lg:text-sm font-medium text-gray-600 mb-1">{metric.label}</p>
                        <p className="text-xl lg:text-2xl font-bold text-gray-900">{metric.value}</p>
                      </div>
                      <div className={`p-2 lg:p-3 rounded-full ${metric.bgColor}`}>
                        <metric.icon className={`h-4 w-4 lg:h-6 lg:w-6 ${metric.textColor}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Role-specific Content */}
            {profile?.role === 'admin' && (
              <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Target className="h-5 w-5" />
                    Admin Controls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h3 className="font-semibold text-green-800 mb-2">User Management</h3>
                      <p className="text-sm text-green-600">Manage students, faculty, and roles</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-blue-800 mb-2">System Analytics</h3>
                      <p className="text-sm text-blue-600">View system usage and performance</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h3 className="font-semibold text-purple-800 mb-2">QR Attendance</h3>
                      <p className="text-sm text-purple-600">Monitor attendance sessions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {profile?.role === 'faculty' && (
              <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <BookOpen className="h-5 w-5" />
                    Faculty Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h3 className="font-semibold text-green-800 mb-2">Create QR Session</h3>
                      <p className="text-sm text-green-600">Start new attendance session</p>
                      <button className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                        Create Session
                      </button>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-blue-800 mb-2">Class Reports</h3>
                      <p className="text-sm text-blue-600">View attendance reports</p>
                      <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                        View Reports
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {profile?.role === 'student' && (
              <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Users className="h-5 w-5" />
                    Student Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h3 className="font-semibold text-green-800 mb-2">QR Scanner</h3>
                      <p className="text-sm text-green-600">Scan QR codes to mark attendance</p>
                      <button className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                        Open Scanner
                      </button>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-blue-800 mb-2">My Attendance</h3>
                      <p className="text-sm text-blue-600">View your attendance records</p>
                      <div className="mt-2 text-lg font-bold text-blue-800">87%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Attendance session created</p>
                      <p className="text-xs text-gray-500">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New student registered</p>
                      <p className="text-xs text-gray-500">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Timetable updated</p>
                      <p className="text-xs text-gray-500">3 hours ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  )
}
