"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, Calendar, AlertTriangle, Clock, BookOpen, GraduationCap, Target, Activity, Award, CheckCircle } from "lucide-react"
import { useIsMobile } from "@/components/ui/use-mobile"
import { MobileCard, MobileCardHeader, MobileGrid } from "@/components/ui/mobile-card"
import { ResponsiveGrid, ResponsiveStack, ResponsiveContainer } from "@/components/ui/responsive"

function ResponsiveDashboard() {
  const [loading, setLoading] = useState(true)
  const [showTour, setShowTour] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const metrics = [
    {
      label: "Total Students",
      value: "1,247",
      icon: Users,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
      change: "+12%"
    },
    {
      label: "Active Courses",
      value: "24",
      icon: BookOpen,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-100", 
      textColor: "text-green-700",
      change: "+3%"
    },
    {
      label: "Attendance Rate",
      value: "87%",
      icon: CheckCircle,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-100",
      textColor: "text-purple-700",
      change: "+5%"
    },
    {
      label: "Avg Grade",
      value: "8.2",
      icon: Award,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-100",
      textColor: "text-orange-700",
      change: "+0.3"
    }
  ]

  const upcomingClasses = [
    { name: "Mathematics", time: "09:00 AM", room: "Room 101", status: "upcoming" },
    { name: "Physics", time: "11:00 AM", room: "Lab 201", status: "upcoming" },
    { name: "Chemistry", time: "02:00 PM", room: "Lab 105", status: "current" },
  ]

  const notifications = [
    { message: "Assignment deadline approaching for Mathematics", priority: "high", time: "2 hours ago" },
    { message: "New course material uploaded for Physics", priority: "medium", time: "4 hours ago" },
    { message: "Attendance marked for today's classes", priority: "low", time: "6 hours ago" },
  ]

  const quickActions = [
    { label: "Mark Attendance", icon: CheckCircle, color: "bg-green-500", action: () => {} },
    { label: "View Timetable", icon: Calendar, color: "bg-blue-500", action: () => {} },
    { label: "Generate Report", icon: TrendingUp, color: "bg-purple-500", action: () => {} },
    { label: "System Settings", icon: Activity, color: "bg-orange-500", action: () => {} },
  ]

  if (loading) {
    return (
      <ResponsiveContainer>
        <div className="space-y-4 lg:space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 4 }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </ResponsiveGrid>
          </div>
        </div>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer>
      <div className="space-y-4 lg:space-y-8">
        {/* Welcome Header */}
        <ResponsiveStack 
          direction={{ mobile: "col", tablet: "row" }}
          className="items-start lg:items-center justify-between"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-green-700 mt-1 text-sm sm:text-base">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <Badge variant="outline" className="text-xs sm:text-sm">
              <Clock className="w-3 h-3 mr-1" />
              {new Date().toLocaleDateString()}
            </Badge>
            <div className="text-lg sm:text-xl font-bold text-green-600">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </ResponsiveStack>

        {/* Metrics Grid */}
        <ResponsiveGrid 
          cols={{ mobile: 1, tablet: 2, desktop: 4 }}
          gap={{ mobile: 3, tablet: 4, desktop: 6 }}
        >
          {metrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <MobileCard
                key={index}
                className="group cursor-pointer"
                hover={true}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 sm:p-3 rounded-xl ${metric.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${metric.textColor}`} />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {metric.change}
                  </Badge>
                </div>
                <div className={`text-xl sm:text-2xl lg:text-3xl font-bold ${metric.textColor} group-hover:scale-105 transition-transform duration-300`}>
                  {metric.value}
                </div>
                <div className="text-xs sm:text-sm text-green-700 mt-1">
                  {metric.label}
                </div>
              </MobileCard>
            )
          })}
        </ResponsiveGrid>

        {/* Quick Actions - Mobile Optimized */}
        {isMobile && (
          <MobileCard>
            <MobileCardHeader 
              title="Quick Actions"
              icon={<Target className="w-5 h-5 text-green-600" />}
            />
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <button
                    key={index}
                    onClick={action.action}
                    className="flex flex-col items-center p-3 rounded-lg border border-border hover:bg-muted transition-colors active:scale-95"
                  >
                    <div className={`p-2 rounded-lg ${action.color} text-white mb-2`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-center">{action.label}</span>
                  </button>
                )
              })}
            </div>
          </MobileCard>
        )}

        {/* Main Content Grid */}
        <ResponsiveGrid cols={{ mobile: 1, desktop: 2 }}>
          {/* Today's Schedule */}
          <MobileCard>
            <MobileCardHeader 
              title="Today's Schedule"
              icon={<Calendar className="w-5 h-5 text-green-600" />}
              subtitle={`${upcomingClasses.length} classes scheduled`}
            />
            <div className="space-y-3">
              {upcomingClasses.map((cls, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-md ${
                    cls.status === 'current' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex-1">
                    <div className={`font-semibold text-sm sm:text-base ${
                      cls.status === 'current' ? 'text-green-800' : 'text-gray-800'
                    }`}>
                      {cls.name}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 flex items-center space-x-2 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{cls.time}</span>
                      <span>•</span>
                      <span>{cls.room}</span>
                    </div>
                  </div>
                  {cls.status === 'current' && (
                    <Badge variant="default" className="bg-green-600 text-xs">
                      Now
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </MobileCard>

          {/* Notifications */}
          <MobileCard>
            <MobileCardHeader 
              title="Notifications"
              icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
              subtitle={`${notifications.length} new notifications`}
            />
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    notification.priority === 'high' ? 'bg-red-500' :
                    notification.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 mb-1">{notification.message}</p>
                    <p className="text-xs text-gray-500">{notification.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </MobileCard>
        </ResponsiveGrid>

        {/* Desktop Quick Actions */}
        {!isMobile && (
          <MobileCard>
            <MobileCardHeader 
              title="Quick Actions"
              icon={<Target className="w-5 h-5 text-green-600" />}
            />
            <ResponsiveGrid cols={{ tablet: 2, desktop: 4 }}>
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <button
                    key={index}
                    onClick={action.action}
                    className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-muted transition-all hover:scale-105"
                  >
                    <div className={`p-3 rounded-lg ${action.color} text-white`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium">{action.label}</span>
                  </button>
                )
              })}
            </ResponsiveGrid>
          </MobileCard>
        )}
      </div>
    </ResponsiveContainer>
  )
}

export default ResponsiveDashboard
