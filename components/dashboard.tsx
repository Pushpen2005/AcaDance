"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, Calendar, AlertTriangle, Clock, BookOpen, GraduationCap, Target } from "lucide-react"
import Skeleton from "@/app/htbyjn/components/skeleton"

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
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Clock className="w-4 h-4" />
        <span>{currentTime.toLocaleDateString()}</span>
      </div>
      <div className="text-xl font-bold text-green-600 animate-pulse">{currentTime.toLocaleTimeString()}</div>
    </>
  )
}

export default function Dashboard() {
  const metrics = [
    {
      label: "Total Classes Scheduled",
      value: "24",
      icon: Calendar,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      label: "Overall Attendance Rate",
      value: "87%",
      icon: TrendingUp,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      label: "Active Teachers",
      value: "12",
      icon: GraduationCap,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      label: "Student Groups",
      value: "8",
      icon: Users,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
  ]

  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center animate-fade-in-up">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent animate-gradient-x">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="text-right glass-effect p-4 rounded-xl hover-lift">
          <ClientDateTime />
        </div>
      </div>

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
                  className="relative overflow-hidden hover-lift perspective-card group cursor-pointer transition-all duration-300 hover:shadow-xl border-0 bg-white/80 backdrop-blur-sm"
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
                    <div className="text-sm text-gray-600 mt-2 group-hover:text-gray-700 transition-colors">
                      {metric.label}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
        <Card className="hover-lift border-0 bg-white/80 backdrop-blur-sm shadow-lg">
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
                  <div className="font-semibold text-blue-900 group-hover:text-blue-700">Mathematics - Group A</div>
                  <div className="text-sm text-blue-600 flex items-center space-x-1 mt-1">
                    <span>Room 101</span>
                    <span>•</span>
                    <span>Prof. Smith</span>
                  </div>
                </div>
                <div className="text-sm font-bold text-blue-600 bg-blue-200 px-3 py-1 rounded-full">9:00 AM</div>
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

        <Card className="hover-lift border-0 bg-white/80 backdrop-blur-sm shadow-lg">
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
  )
}
