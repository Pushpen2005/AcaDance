import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { GraduationCap, Users, Calendar, BarChart3 } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <GraduationCap className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Academic System
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Complete QR Attendance & Management Platform with Real-time Monitoring, 
            Role-based Dashboards, and Advanced Analytics
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <Users className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Student Portal</h3>
            <p className="text-gray-600 mb-4">
              Scan QR codes for attendance, view timetables, and track your academic progress
            </p>
            <Link href="/student-dashboard">
              <Button className="w-full">Access Student Dashboard</Button>
            </Link>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <Calendar className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Faculty Portal</h3>
            <p className="text-gray-600 mb-4">
              Manage classes, generate QR codes, and monitor student attendance in real-time
            </p>
            <Link href="/faculty-dashboard">
              <Button className="w-full">Access Faculty Dashboard</Button>
            </Link>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <BarChart3 className="h-12 w-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Admin Portal</h3>
            <p className="text-gray-600 mb-4">
              System administration, user management, and comprehensive analytics
            </p>
            <Link href="/admin-dashboard">
              <Button className="w-full">Access Admin Dashboard</Button>
            </Link>
          </div>
        </div>

        <div className="text-center">
          <div className="bg-white p-8 rounded-xl shadow-lg inline-block">
            <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="min-w-[140px]">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline" className="min-w-[140px]">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center text-gray-500">
          <p>© 2025 Academic System. Built with Next.js, Supabase, and modern web technologies.</p>
        </div>
      </div>
    </div>
  )
}
