"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { BarChart3, Calendar, Users, FileText, Settings, GraduationCap, BookOpen } from "lucide-react"
import Dashboard from "@/components/dashboard"
import TimetableManagement from "@/components/timetable-management"
import AttendanceTracking from "@/components/attendance-tracking"
import Reports from "@/components/reports"
import SettingsComponent from "@/components/settings"
import EnhancedAdminDashboard from "../components/EnhancedAdminDashboard";
import EnhancedFacultyDashboard from "../components/EnhancedFacultyDashboard";
import EnhancedStudentDashboard from "../components/EnhancedStudentDashboard";
import { supabase } from "@/lib/supabaseClient"
import { useIsMobile } from "@/components/ui/use-mobile"
import { MobileNavigation, MobileHeader } from "@/components/MobileNavigation"
import { SupabaseStatusIndicator, RealtimeIndicator } from "@/components/ui/supabase-status"

export default function AcademicSystem() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

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
      } = await supabase.auth.getUser()
      if (!user) {
        setUserRole(null)
        return
      }
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()
      if (data && data.role) setUserRole(data.role)
      else setUserRole(null)
    }
    fetchUserRole()
  }, [])

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3, component: Dashboard },
    { id: "timetable", label: "Timetable", icon: Calendar, component: TimetableManagement },
    { id: "attendance", label: "Attendance", icon: Users, component: AttendanceTracking },
    { id: "reports", label: "Reports", icon: FileText, component: Reports },
    { id: "settings", label: "Settings", icon: Settings, component: SettingsComponent },
  ]

  // Get the correct dashboard component based on user role
  const getDashboardComponent = () => {
    if (userRole === "admin") return EnhancedAdminDashboard
    if (userRole === "faculty") return EnhancedFacultyDashboard
    if (userRole === "student") return EnhancedStudentDashboard
    return Dashboard
  }

  const ActiveComponent = activeTab === "dashboard" 
    ? getDashboardComponent()
    : tabs.find((tab) => tab.id === activeTab)?.component || Dashboard

  return (
    <div
      ref={containerRef}
      className="dashboard-3d-container scene-3d min-h-screen relative overflow-hidden flex flex-col"
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

      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-green-800/10 to-green-600/10 rounded-full blur-3xl animate-pulse-slow" />
      <div
        className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-green-600/10 to-green-800/10 rounded-full blur-3xl animate-pulse-slow"
        style={{ animationDelay: "2s" }}
      />

      <nav className="nav-3d relative z-10 glass-effect border-b border-white/20 backdrop-blur-lg bg-green-800 text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-center h-auto lg:h-20 py-4 lg:py-0">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3 sm:space-x-4 animate-fade-in-up mb-4 lg:mb-0 w-full lg:w-auto justify-center lg:justify-start">
              <div className="relative group">
                <div
                  className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center animate-float shadow-lg transition-all duration-300 group-hover:scale-110"
                  style={{
                    transform: `translate(${mousePosition.x * 2}px, ${mousePosition.y * 2}px)`,
                  }}
                >
                  <GraduationCap className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 sm:w-4 h-3 sm:h-4 bg-green-400 rounded-full animate-bounce">
                  <BookOpen className="w-1.5 sm:w-2 h-1.5 sm:h-2 text-white m-0.5 sm:m-1" />
                </div>
              </div>
              <div className="text-center lg:text-left">
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-100 to-white bg-clip-text text-transparent">
                  HH310 Academic System
                </h2>
                <div className="flex items-center justify-center lg:justify-start gap-3 mt-1">
                  <p className="text-xs sm:text-sm text-green-100 hidden sm:block">Modern Education Management</p>
                  <SupabaseStatusIndicator className="relative" />
                  <RealtimeIndicator />
                </div>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <div className="w-full lg:w-auto">
              {/* Mobile Menu Button - Hidden on desktop */}
              <div className="lg:hidden mb-4">
                <Button
                  variant="ghost"
                  className="w-full justify-center text-white border border-green-600 hover:bg-green-600"
                  onClick={() => {
                    const menu = document.getElementById('mobile-menu');
                    menu?.classList.toggle('hidden');
                  }}
                >
                  Menu
                </Button>
              </div>
              
              {/* Desktop Navigation */}
              <div className="nav-tabs-3d hidden lg:flex space-x-2 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`nav-tab-3d relative px-3 xl:px-4 py-2 text-sm font-medium rounded-xl group
                        ${activeTab === tab.id ? "active" : ""}
                      `}
                    >
                      <Icon className="w-4 h-4 mr-1 xl:mr-2 group-hover:animate-pulse" />
                      <span className="hidden xl:inline">{tab.label}</span>
                      <span className="xl:hidden">{tab.label.slice(0, 3)}</span>
                      {activeTab === tab.id && (
                        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full animate-bounce" />
                      )}
                    </button>
                  )
                })}
                <button
                  type="button"
                  className="action-button-3d relative px-3 xl:px-4 py-2 text-sm font-medium rounded-xl group"
                  onClick={() => window.location.href = "/login"}
                >
                  <BarChart3 className="w-4 h-4 mr-1 xl:mr-2 group-hover:animate-pulse" />
                  <span className="hidden xl:inline">Login / Sign Up</span>
                  <span className="xl:hidden">Login</span>
                </button>
              </div>
              
              {/* Mobile Navigation Menu */}
              <div id="mobile-menu" className="lg:hidden hidden">
                <div className="grid grid-cols-2 gap-2 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <Button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          document.getElementById('mobile-menu')?.classList.add('hidden');
                        }}
                        variant={activeTab === tab.id ? "default" : "ghost"}
                        className={`relative px-3 py-2 text-sm font-medium rounded-xl transition-all duration-300 group flex flex-col items-center space-y-1
                          ${activeTab === tab.id
                            ? "bg-green-600 text-white shadow-lg"
                            : "text-green-100 hover:text-white hover:bg-green-600"}
                        `}
                      >
                        <Icon className="w-5 h-5 group-hover:animate-pulse" />
                        <span className="text-xs">{tab.label}</span>
                      </Button>
                    )
                  })}
                  <Button
                    type="button"
                    variant="ghost"
                    className="relative px-3 py-2 text-sm font-medium rounded-xl transition-all duration-300 group text-green-100 hover:text-white hover:bg-green-600 flex flex-col items-center space-y-1 col-span-2"
                    onClick={() => window.location.href = "/login"}
                  >
                    <BarChart3 className="w-5 h-5 group-hover:animate-pulse" />
                    <span className="text-xs">Login / Sign Up</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className={`relative z-10 w-full max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8 ${isMobile ? 'pb-20' : ''}`}>
        <div className="dashboard-card-3d glass-3d-interactive bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <ActiveComponent />
          </div>
        </div>
      </main>
      
      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={tabs}
          className="fixed bottom-0 left-0 right-0 z-50"
        />
      )}
    </div>
  )
}
