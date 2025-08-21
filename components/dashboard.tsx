"use client"

// Enhanced with Advanced Supabase Integration
import React, { useState, useEffect, useRef } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, Calendar, AlertTriangle, Clock, BookOpen, GraduationCap, Target } from "lucide-react"
import Skeleton from "@/app/htbyjn/components/skeleton"
import { supabase } from "@/lib/supabaseClient"
import { useHighlight } from "@/hooks/use-highlight"
import TimetableManagement from "./timetable-management"
import EnhancedInteractiveDashboard from "./EnhancedInteractiveDashboard"

function ClientDateTime() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  if (!mounted || !currentTime) return null

  return (
    <>
      <div className="flex items-center space-x-2 text-sm text-green-600">
        <Clock className="w-4 h-4" />
        <span>{currentTime.toLocaleDateString()}</span>
      </div>
      <div className="text-xl font-bold text-green-600 animate-pulse">{currentTime.toLocaleTimeString()}</div>
    </>
  )
}

// Performance and Error Handling Enhanced
export default React.memo(function Dashboard() {
  const { identify, trackAcademic, reportError } = useHighlight()

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

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [sidebarItems, setSidebarItems] = useState<string[]>([])
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [showTour, setShowTour] = useState(false)
  const [recentActivity, setRecentActivity] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const tourShownRef = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    async function fetchProfile() {
      setLoadingProfile(true)
      const user = await supabase.auth.getUser()
      if (user.data.user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.data.user.id)
          .single()
        setProfile(data)
        // Set sidebar items based on role
        if (data?.role === 'admin') {
          setSidebarItems([
            'Manage Timetables',
            'View Attendance Reports',
            'Manage Faculty & Students',
            'Send Notifications',
          ])
        } else if (data?.role === 'faculty') {
          setSidebarItems([
            'View Assigned Classes',
            'Start/Stop Attendance Session',
            'Approve Attendance',
            'View Student Reports',
          ])
        } else {
          setSidebarItems([
            'View Timetable',
            'Mark Attendance',
            'Track Attendance %',
            'Get Alerts',
          ])
        }

        // Track user identification with Highlight.io
        if (data?.id) {
          identify(data.id, {
            email: data.email,
            full_name: data.full_name,
            role: data.role,
            department: data.department
          })
        }
      }
      setLoadingProfile(false)
    }
    fetchProfile().catch(error => {
      reportError(error, { component: 'Dashboard', action: 'fetchProfile' })
    })
  }, [identify, reportError])

  useEffect(() => {
    // Track dashboard view when profile is loaded
    if (profile?.id && profile?.role) {
      trackAcademic.dashboardViewed(profile.id, profile.role, 'main-dashboard')
    }
    
    // Show welcome tour only on first login (simple localStorage check)
    if (!tourShownRef.current && profile?.id && !localStorage.getItem("welcomeTourShown")) {
      setShowTour(true)
      localStorage.setItem("welcomeTourShown", "true")
      tourShownRef.current = true
    }
    // Fetch recent activity (mock/demo)
    if (profile?.id) {
      setRecentActivity({
        lastLogin: new Date().toLocaleString(),
        classesToday: [
          { name: "Mathematics", time: "9:00 AM" },
          { name: "Physics Lab", time: "11:00 AM" },
        ],
      })
      // Fetch notifications (mock/demo)
      setNotifications([
        { type: "exam", message: "Exam schedule updated.", role: "student" },
        { type: "timetable", message: "Timetable changed for Group A.", role: "faculty" },
        { type: "alert", message: "Attendance below 75% for some students.", role: "admin" },
      ])
    }
  }, [profile, trackAcademic])

  // If user has a profile, show the new role-based dashboard
  if (profile) {
    return <EnhancedInteractiveDashboard />
  }

  // Fallback to existing dashboard for backward compatibility
  return (
    <div className="space-y-8">
      {/* Welcome Tour Modal */}
      {showTour && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Welcome to your Dashboard!</h2>
            <ul className="mb-4 list-disc pl-6 text-gray-700 dark:text-gray-200">
              <li>Explore your role-based features in the sidebar.</li>
              <li>Check recent activity and notifications.</li>
              <li>Customize your theme and preferences.</li>
            </ul>
            <button className="btn btn-primary w-full" onClick={() => setShowTour(false)}>Got it!</button>
          </div>
        </div>
      )}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center animate-fade-in-up">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent animate-gradient-x">
            {profile?.role ? `${profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} Dashboard` : 'Dashboard'}
          </h1>
          <p className="text-green-700 mt-2">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}! Here's what's happening today.</p>
        </div>
        <div className="text-right glass-effect p-4 rounded-xl hover-lift">
          <ClientDateTime />
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="w-full lg:w-64 bg-green-50/80 dark:bg-green-900/20 rounded-xl shadow p-4 mb-6 lg:mb-0 border border-green-200 dark:border-green-800">
          <h2 className="font-semibold text-lg mb-4">Menu</h2>
          {loadingProfile ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <ul className="space-y-2">
              {sidebarItems.map(item => (
                <li key={item} className="py-2 px-3 rounded hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer transition-colors">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </aside>
        <main className="flex-1 space-y-8">
          {/* Recent Activity Widget */}
          {recentActivity && (
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Clock className="w-5 h-5 text-green-600" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-2 text-sm text-green-700">Last Login: {recentActivity.lastLogin}</div>
                <div className="mb-2 text-sm text-green-700">Classes Today:</div>
                <ul className="list-disc pl-6">
                  {recentActivity.classesToday.map((cls: any, idx: number) => (
                    <li key={idx}>{cls.name} - {cls.time}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {/* Notifications Center */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Notifications Center</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-6">
                {notifications.filter(n => n.role === profile?.role).map((n, idx) => (
                  <li key={idx} className="mb-2 text-sm text-gray-700 dark:text-gray-200">{n.message}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          {/* Role-based dashboard widgets */}
          {profile?.role === 'admin' && (
            <div>
              {/* Timetable Management Section */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span>Timetable Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Features: Setup, Constraints, Generation, View Timetable */}
                  <TimetableManagement />
                </CardContent>
              </Card>
              {/* Existing Admin widgets: Timetable CRUD, Attendance Reports, etc. */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-40 w-full" />
                    ))
                  : metrics.map((metric, index) => {
                      const Icon = metric.icon
                      return (
                        <Card
                          key={index}
                          className="relative overflow-hidden hover-lift perspective-card group cursor-pointer transition-all duration-300 hover:shadow-xl border-0 bg-green-50/80 backdrop-blur-sm"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div
                            className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                          />
                          <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between mb-4">
                              <div
                                className={`p-3 rounded-xl ${metric.bgColor} group-hover:scale-110 transition-transform duration-300`}
                              >
                                <Icon className={`w-6 h-6 ${metric.textColor}`} />
                              </div>
                              <Target className="w-4 h-4 text-gray-300 group-hover:text-green-500 transition-colors" />
                            </div>
                            <div
                              className={`text-3xl font-bold ${metric.textColor} group-hover:scale-105 transition-transform duration-300`}
                            >
                              {metric.value}
                            </div>
                            <div className="text-sm text-green-700 mt-2 group-hover:text-gray-700 transition-colors">
                              {metric.label}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                <Card className="hover-lift border-0 bg-green-50/80 backdrop-blur-sm shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-xl">
                      <BookOpen className="w-5 h-5 text-green-600" />
                      <span>Today's Schedule</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] group">
                        <div>
                          <div className="font-semibold text-green-800 group-hover:text-green-700">Mathematics - Group A</div>
                          <div className="text-sm text-green-600 flex items-center space-x-1 mt-1">
                            <span>Room 101</span>
                            <span>•</span>
                            <span>Prof. Smith</span>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-green-600 bg-green-200 px-3 py-1 rounded-full">9:00 AM</div>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] group">
                        <div>
                          <div className="font-semibold text-green-900 group-hover:text-green-700">Physics Lab - Group B</div>
                          <div className="text-sm text-green-600 flex items-center space-x-1 mt-1">
                            <span>Lab 201</span>
                            <span>•</span>
                            <span>Dr. Johnson</span>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-green-600 bg-green-200 px-3 py-1 rounded-full">11:00 AM</div>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] group">
                        <div>
                          <div className="font-semibold text-purple-900 group-hover:text-purple-700">
                            Computer Science - Group C
                          </div>
                          <div className="text-sm text-purple-600 flex items-center space-x-1 mt-1">
                            <span>Room 301</span>
                            <span>•</span>
                            <span>Prof. Davis</span>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-purple-600 bg-purple-200 px-3 py-1 rounded-full">2:00 PM</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-lift border-0 bg-green-50/80 backdrop-blur-sm shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-xl">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <span>Attendance Alerts</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] group">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-4 animate-pulse"></div>
                        <div className="flex-1">
                          <div className="font-semibold text-red-800 group-hover:text-red-700">Low Attendance Alert</div>
                          <div className="text-sm text-red-600 mt-1">John Doe - 65% attendance</div>
                        </div>
                        <div className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full font-medium">Critical</div>
                      </div>
                      <div className="flex items-center p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] group">
                        <div
                          className="w-3 h-3 bg-yellow-500 rounded-full mr-4 animate-pulse"
                          style={{ animationDelay: "0.5s" }}
                        ></div>
                        <div className="flex-1">
                          <div className="font-semibold text-yellow-800 group-hover:text-yellow-700">Attendance Warning</div>
                          <div className="text-sm text-yellow-600 mt-1">Jane Smith - 72% attendance</div>
                        </div>
                        <div className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full font-medium">Warning</div>
                      </div>
                      <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] group">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-4 animate-glow"></div>
                        <div className="flex-1">
                          <div className="font-semibold text-green-800 group-hover:text-green-700">Perfect Attendance</div>
                          <div className="text-sm text-green-600 mt-1">Mike Wilson - 100% attendance</div>
                        </div>
                        <div className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-medium">Excellent</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          {profile?.role === 'faculty' && (
            <div>
              {/* Faculty widgets: Assigned Classes, Attendance Session, etc. */}
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up"
                style={{ animationDelay: "0.2s" }}
              >
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-40 w-full" />
                    ))
                  : metrics.map((metric, index) => {
                      const Icon = metric.icon
                      return (
                        <Card
                          key={index}
                          className="relative overflow-hidden hover-lift perspective-card group cursor-pointer transition-all duration-300 hover:shadow-xl border-0 bg-green-50/80 backdrop-blur-sm"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div
                            className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                          />
                          <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between mb-4">
                              <div
                                className={`p-3 rounded-xl ${metric.bgColor} group-hover:scale-110 transition-transform duration-300`}
                              >
                                <Icon className={`w-6 h-6 ${metric.textColor}`} />
                              </div>
                              <Target className="w-4 h-4 text-gray-300 group-hover:text-green-500 transition-colors" />
                            </div>
                            <div
                              className={`text-3xl font-bold ${metric.textColor} group-hover:scale-105 transition-transform duration-300`}
                            >
                              {metric.value}
                            </div>
                            <div className="text-sm text-green-700 mt-2 group-hover:text-gray-700 transition-colors">
                              {metric.label}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                <Card className="hover-lift border-0 bg-green-50/80 backdrop-blur-sm shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-xl">
                      <BookOpen className="w-5 h-5 text-green-600" />
                      <span>Today's Schedule</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] group">
                        <div>
                          <div className="font-semibold text-green-800 group-hover:text-green-700">Mathematics - Group A</div>
                          <div className="text-sm text-green-600 flex items-center space-x-1 mt-1">
                            <span>Room 101</span>
                            <span>•</span>
                            <span>Prof. Smith</span>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-green-600 bg-green-200 px-3 py-1 rounded-full">9:00 AM</div>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] group">
                        <div>
                          <div className="font-semibold text-green-900 group-hover:text-green-700">Physics Lab - Group B</div>
                          <div className="text-sm text-green-600 flex items-center space-x-1 mt-1">
                            <span>Lab 201</span>
                            <span>•</span>
                            <span>Dr. Johnson</span>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-green-600 bg-green-200 px-3 py-1 rounded-full">11:00 AM</div>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] group">
                        <div>
                          <div className="font-semibold text-purple-900 group-hover:text-purple-700">
                            Computer Science - Group C
                          </div>
                          <div className="text-sm text-purple-600 flex items-center space-x-1 mt-1">
                            <span>Room 301</span>
                            <span>•</span>
                            <span>Prof. Davis</span>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-purple-600 bg-purple-200 px-3 py-1 rounded-full">2:00 PM</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-lift border-0 bg-green-50/80 backdrop-blur-sm shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-xl">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <span>Attendance Alerts</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] group">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-4 animate-pulse"></div>
                        <div className="flex-1">
                          <div className="font-semibold text-red-800 group-hover:text-red-700">Low Attendance Alert</div>
                          <div className="text-sm text-red-600 mt-1">John Doe - 65% attendance</div>
                        </div>
                        <div className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full font-medium">Critical</div>
                      </div>
                      <div className="flex items-center p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] group">
                        <div
                          className="w-3 h-3 bg-yellow-500 rounded-full mr-4 animate-pulse"
                          style={{ animationDelay: "0.5s" }}
                        ></div>
                        <div className="flex-1">
                          <div className="font-semibold text-yellow-800 group-hover:text-yellow-700">Attendance Warning</div>
                          <div className="text-sm text-yellow-600 mt-1">Jane Smith - 72% attendance</div>
                        </div>
                        <div className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full font-medium">Warning</div>
                      </div>
                      <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] group">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-4 animate-glow"></div>
                        <div className="flex-1">
                          <div className="font-semibold text-green-800 group-hover:text-green-700">Perfect Attendance</div>
                          <div className="text-sm text-green-600 mt-1">Mike Wilson - 100% attendance</div>
                        </div>
                        <div className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-medium">Excellent</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          {profile?.role === 'student' && (
            <div>
              {/* Student widgets: Timetable, Attendance %, Alerts, etc. */}
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up"
                style={{ animationDelay: "0.2s" }}
              >
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-40 w-full" />
                    ))
                  : metrics.map((metric, index) => {
                      const Icon = metric.icon
                      return (
                        <Card
                          key={index}
                          className="relative overflow-hidden hover-lift perspective-card group cursor-pointer transition-all duration-300 hover:shadow-xl border-0 bg-green-50/80 backdrop-blur-sm"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div
                            className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                          />
                          <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between mb-4">
                              <div
                                className={`p-3 rounded-xl ${metric.bgColor} group-hover:scale-110 transition-transform duration-300`}
                              >
                                <Icon className={`w-6 h-6 ${metric.textColor}`} />
                              </div>
                              <Target className="w-4 h-4 text-gray-300 group-hover:text-green-500 transition-colors" />
                            </div>
                            <div
                              className={`text-3xl font-bold ${metric.textColor} group-hover:scale-105 transition-transform duration-300`}
                            >
                              {metric.value}
                            </div>
                            <div className="text-sm text-green-700 mt-2 group-hover:text-gray-700 transition-colors">
                              {metric.label}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                <Card className="hover-lift border-0 bg-green-50/80 backdrop-blur-sm shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-xl">
                      <BookOpen className="w-5 h-5 text-green-600" />
                      <span>Today's Timetable</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] group">
                        <div>
                          <div className="font-semibold text-green-800 group-hover:text-green-700">Mathematics - Group A</div>
                          <div className="text-sm text-green-600 flex items-center space-x-1 mt-1">
                            <span>Room 101</span>
                            <span>•</span>
                            <span>Prof. Smith</span>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-green-600 bg-green-200 px-3 py-1 rounded-full">9:00 AM</div>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] group">
                        <div>
                          <div className="font-semibold text-green-900 group-hover:text-green-700">Physics Lab - Group B</div>
                          <div className="text-sm text-green-600 flex items-center space-x-1 mt-1">
                            <span>Lab 201</span>
                            <span>•</span>
                            <span>Dr. Johnson</span>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-green-600 bg-green-200 px-3 py-1 rounded-full">11:00 AM</div>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] group">
                        <div>
                          <div className="font-semibold text-purple-900 group-hover:text-purple-700">
                            Computer Science - Group C
                          </div>
                          <div className="text-sm text-purple-600 flex items-center space-x-1 mt-1">
                            <span>Room 301</span>
                            <span>•</span>
                            <span>Prof. Davis</span>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-purple-600 bg-purple-200 px-3 py-1 rounded-full">2:00 PM</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-lift border-0 bg-green-50/80 backdrop-blur-sm shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-xl">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <span>Attendance Alerts</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] group">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-4 animate-pulse"></div>
                        <div className="flex-1">
                          <div className="font-semibold text-red-800 group-hover:text-red-700">Low Attendance Alert</div>
                          <div className="text-sm text-red-600 mt-1">John Doe - 65% attendance</div>
                        </div>
                        <div className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full font-medium">Critical</div>
                      </div>
                      <div className="flex items-center p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] group">
                        <div
                          className="w-3 h-3 bg-yellow-500 rounded-full mr-4 animate-pulse"
                          style={{ animationDelay: "0.5s" }}
                        ></div>
                        <div className="flex-1">
                          <div className="font-semibold text-yellow-800 group-hover:text-yellow-700">Attendance Warning</div>
                          <div className="text-sm text-yellow-600 mt-1">Jane Smith - 72% attendance</div>
                        </div>
                        <div className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full font-medium">Warning</div>
                      </div>
                      <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] group">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-4 animate-glow"></div>
                        <div className="flex-1">
                          <div className="font-semibold text-green-800 group-hover:text-green-700">Perfect Attendance</div>
                          <div className="text-sm text-green-600 mt-1">Mike Wilson - 100% attendance</div>
                        </div>
                        <div className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-medium">Excellent</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
)
