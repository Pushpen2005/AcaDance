"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { BarChart3, Calendar, Users, FileText, Settings, GraduationCap, BookOpen } from "lucide-react"
import Dashboard from "@/components/dashboard"
import TimetableManagement from "@/components/timetable-management"
import AttendanceTracking from "@/components/attendance-tracking"
import Reports from "@/components/reports"
import SettingsComponent from "@/components/settings"
import AdminDashboard from "../components/AdminDashboard";
import FacultyDashboard from "../components/FacultyDashboard";
import StudentDashboard from "../components/StudentDashboard";
import { getSupabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function AcademicSystem() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
    }))
    setParticles(newParticles)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        })
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useEffect(() => {
    async function fetchUserRole() {
      const {
        data: { user },
      } = await getSupabase().auth.getUser()
      if (!user) {
        setUserRole(null)
        return
      }
      const { data } = await getSupabase()
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .maybeSingle()
      if (!data || !data.role) {
        router.replace("/setup-profile")
        return
      }
      setUserRole(data.role)
    }
    fetchUserRole()
  }, [router])

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3, component: Dashboard },
    { id: "timetable", label: "Timetable", icon: Calendar, component: TimetableManagement },
    { id: "attendance", label: "Attendance", icon: Users, component: AttendanceTracking },
    { id: "reports", label: "Reports", icon: FileText, component: Reports },
    { id: "settings", label: "Settings", icon: Settings, component: SettingsComponent },
  ]

  let DashboardComponent = Dashboard
  if (userRole === "admin") DashboardComponent = AdminDashboard
  else if (userRole === "faculty") DashboardComponent = FacultyDashboard
  else if (userRole === "student") DashboardComponent = StudentDashboard

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component || DashboardComponent

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-white via-white to-blue-900 relative overflow-hidden flex flex-col"
    >
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-blue-900 rounded-full opacity-20 animate-float-particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              transform: `translate(${mousePosition.x * 5}px, ${mousePosition.y * 5}px)`,
            }}
          />
        ))}
      </div>

      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-900/10 to-blue-700/10 rounded-full blur-3xl animate-pulse-slow" />
      <div
        className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-700/10 to-blue-900/10 rounded-full blur-3xl animate-pulse-slow"
        style={{ animationDelay: "2s" }}
      />

      <nav className="relative z-10 glass-effect border-b border-white/20 backdrop-blur-lg bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center h-auto sm:h-20">
            <div className="flex items-center space-x-2 sm:space-x-4 animate-fade-in-up mb-4 sm:mb-0">
              <div className="relative group">
                <div
                  className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center animate-float shadow-lg transition-all duration-300 group-hover:scale-110"
                  style={{
                    transform: `translate(${mousePosition.x * 2}px, ${mousePosition.y * 2}px)`,
                  }}
                >
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-bounce">
                  <BookOpen className="w-2 h-2 text-white m-1" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">
                  HH310 Academic System
                </h2>
                <p className="text-sm text-blue-100">Modern Education Management</p>
              </div>
            </div>
            <div className="flex flex-wrap space-x-0 sm:space-x-2 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <Button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    className={`relative px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl group
                      ${activeTab === tab.id
                        ? "bg-blue-900 text-white shadow-lg shadow-blue-900/25 animate-press"
                        : "text-blue-900 hover:text-white hover:bg-blue-900 animate-hover"}
                    `}
                    style={{
                      boxShadow: activeTab === tab.id ? "0 4px 24px 0 rgba(30,64,175,0.15)" : undefined,
                      transform: activeTab === tab.id ? "scale(1.05)" : undefined,
                    }}
                    onMouseDown={e => e.currentTarget.classList.add('animate-press')}
                    onMouseUp={e => e.currentTarget.classList.remove('animate-press')}
                    onMouseLeave={e => e.currentTarget.classList.remove('animate-press')}
                  >
                    <Icon className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full animate-bounce" />
                    )}
                  </Button>
                )
              })}
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  className={`relative px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg group text-blue-900 hover:text-white hover:bg-blue-900`}
                  onClick={() => window.location.href = "/login"}
                >
                  <BarChart3 className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                  Login / Sign Up
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="relative z-10 w-full max-w-7xl mx-auto py-4 px-2 sm:py-8 sm:px-4 lg:px-8 bg-white rounded-xl shadow-xl">
        <div className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          {activeTab === "dashboard" ? <DashboardComponent /> : <ActiveComponent />}
        </div>
      </main>
      <style jsx>{`
        @media (max-width: 640px) {
          .max-w-7xl {
            max-width: 100vw;
            padding: 0;
          }
          .rounded-xl {
            border-radius: 0.5rem;
          }
          .px-2 {
            padding-left: 0.5rem;
            padding-right: 0.5rem;
          }
          .py-4 {
            padding-top: 1rem;
            padding-bottom: 1rem;
          }
        }
      `}</style>
    </div>
  )
}
