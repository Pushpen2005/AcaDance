"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/supabaseClient"
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from "@/hooks/use-toast"
import { 
  Calendar, 
  Clock, 
  Users, 
  BookOpen, 
  MapPin, 
  Settings, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  Plus, 
  Save, 
  Shuffle, 
  RefreshCw, 
  Eye, 
  FileText, 
  Share2,
  Bell,
  AlertTriangle,
  CheckCircle,
  Zap,
  Target,
  BarChart3,
  Filter,
  Search,
  Copy,
  Move,
  RotateCcw,
  Calendar as CalendarIcon,
  User,
  Building,
  GraduationCap
} from 'lucide-react'

interface Subject {
  id: string
  name: string
  code: string
  credits: number
  duration: number
  type: 'lecture' | 'lab' | 'tutorial' | 'seminar'
  sessions_per_week: number
  department: string
  semester: number
  prerequisites?: string[]
}

interface Faculty {
  id: string
  name: string
  email: string
  department: string
  specialization: string[]
  available_days: string[]
  available_hours: { start: string; end: string }
  max_hours_per_day: number
  max_hours_per_week: number
  preferred_time_slots?: string[]
  unavailable_slots?: string[]
}

interface Room {
  id: string
  name: string
  type: 'classroom' | 'lab' | 'auditorium' | 'seminar_hall'
  capacity: number
  building: string
  floor: number
  equipment: string[]
  available_days: string[]
  available_hours: { start: string; end: string }
}

interface TimeSlot {
  id: string
  day: string
  start_time: string
  end_time: string
  slot_name: string
}

interface TimetableEntry {
  id?: string
  subject_id: string
  faculty_id: string
  room_id: string
  time_slot_id: string
  batch: string
  semester: number
  department: string
  week_type: 'odd' | 'even' | 'both'
  session_type: 'lecture' | 'lab' | 'tutorial'
  created_at?: string
  conflicts?: string[]
}

interface Constraint {
  id: string
  type: 'faculty_unavailable' | 'room_unavailable' | 'subject_timing' | 'batch_restriction' | 'custom'
  entity_id: string
  restriction: any
  priority: 'high' | 'medium' | 'low'
  description: string
}

export default function AdvancedTimetableGeneration() {
  const [activeTab, setActiveTab] = useState('overview')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [constraints, setConstraints] = useState<Constraint[]>([])
  const [timetable, setTimetable] = useState<TimetableEntry[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [selectedWeek, setSelectedWeek] = useState('both')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedSemester, setSelectedSemester] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [draggedItem, setDraggedItem] = useState<TimetableEntry | null>(null)
  
  // Form states
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [showAddFaculty, setShowAddFaculty] = useState(false)
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [showConstraintForm, setShowConstraintForm] = useState(false)
  
  const { toast } = useToast()

  // Default time slots
  const defaultTimeSlots: TimeSlot[] = [
    { id: '1', day: 'Monday', start_time: '08:00', end_time: '09:00', slot_name: 'Period 1' },
    { id: '2', day: 'Monday', start_time: '09:00', end_time: '10:00', slot_name: 'Period 2' },
    { id: '3', day: 'Monday', start_time: '10:15', end_time: '11:15', slot_name: 'Period 3' },
    { id: '4', day: 'Monday', start_time: '11:15', end_time: '12:15', slot_name: 'Period 4' },
    { id: '5', day: 'Monday', start_time: '13:15', end_time: '14:15', slot_name: 'Period 5' },
    { id: '6', day: 'Monday', start_time: '14:15', end_time: '15:15', slot_name: 'Period 6' },
    { id: '7', day: 'Monday', start_time: '15:30', end_time: '16:30', slot_name: 'Period 7' },
    // Add for all days
  ]

  // Fetch all data
  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      const [subjectsRes, facultyRes, roomsRes, constraintsRes, timetableRes] = await Promise.all([
        supabase.from('subjects').select('*'),
        supabase.from('faculty').select('*'),
        supabase.from('rooms').select('*'),
        supabase.from('constraints').select('*'),
        supabase.from('timetable_entries').select('*')
      ])

      setSubjects(subjectsRes.data || [])
      setFaculty(facultyRes.data || [])
      setRooms(roomsRes.data || [])
      setConstraints(constraintsRes.data || [])
      setTimetable(timetableRes.data || [])
      
      // Initialize time slots if not exists
      if (!timeSlots.length) {
        setTimeSlots(generateTimeSlots())
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  // Generate complete time slots for all days
  const generateTimeSlots = (): TimeSlot[] => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const periods = [
      { start: '08:00', end: '09:00', name: 'Period 1' },
      { start: '09:00', end: '10:00', name: 'Period 2' },
      { start: '10:15', end: '11:15', name: 'Period 3' },
      { start: '11:15', end: '12:15', name: 'Period 4' },
      { start: '13:15', end: '14:15', name: 'Period 5' },
      { start: '14:15', end: '15:15', name: 'Period 6' },
      { start: '15:30', end: '16:30', name: 'Period 7' },
      { start: '16:30', end: '17:30', name: 'Period 8' }
    ]

    const slots: TimeSlot[] = []
    days.forEach(day => {
      periods.forEach((period, index) => {
        slots.push({
          id: `${day.toLowerCase()}_${index + 1}`,
          day,
          start_time: period.start,
          end_time: period.end,
          slot_name: period.name
        })
      })
    })

    return slots
  }

  // Advanced AI-based timetable generation
  const generateSmartTimetable = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      // Clear existing timetable
      await supabase.from('timetable_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      
      const generatedEntries: TimetableEntry[] = []
      const conflicts: string[] = []
      
      // Progress tracking
      let progressStep = 0
      const totalSteps = subjects.length * 4

      for (const subject of subjects) {
        setGenerationProgress((progressStep / totalSteps) * 100)
        
        // Find available faculty for this subject
        const availableFaculty = faculty.filter(f => 
          f.department === subject.department ||
          f.specialization.includes(subject.name)
        )

        if (availableFaculty.length === 0) {
          conflicts.push(`No faculty available for ${subject.name}`)
          continue
        }

        // Find suitable rooms
        const suitableRooms = rooms.filter(r => 
          r.type === subject.type || 
          (subject.type === 'lecture' && r.type === 'classroom') ||
          (subject.type === 'lab' && r.type === 'lab')
        )

        if (suitableRooms.length === 0) {
          conflicts.push(`No suitable room for ${subject.name}`)
          continue
        }

        // Generate sessions based on sessions_per_week
        for (let session = 0; session < subject.sessions_per_week; session++) {
          const optimalSlot = findOptimalTimeSlot(
            subject,
            availableFaculty,
            suitableRooms,
            generatedEntries,
            constraints
          )

          if (optimalSlot) {
            generatedEntries.push({
              subject_id: subject.id,
              faculty_id: optimalSlot.faculty.id,
              room_id: optimalSlot.room.id,
              time_slot_id: optimalSlot.timeSlot.id,
              batch: `${subject.department}_SEM${subject.semester}`,
              semester: subject.semester,
              department: subject.department,
              week_type: 'both',
              session_type: subject.type === 'seminar' ? 'lecture' : subject.type
            })
          } else {
            conflicts.push(`Could not schedule ${subject.name} session ${session + 1}`)
          }
          
          progressStep++
        }
      }

      // Insert generated timetable
      if (generatedEntries.length > 0) {
        const { error } = await supabase
          .from('timetable_entries')
          .insert(generatedEntries)

        if (!error) {
          setTimetable(generatedEntries)
          toast({
            title: "Timetable Generated Successfully!",
            description: `Generated ${generatedEntries.length} classes with ${conflicts.length} conflicts`,
          })
        }
      }

      if (conflicts.length > 0) {
        toast({
          title: "Generation Completed with Conflicts",
          description: `${conflicts.length} conflicts detected. Check the conflicts tab.`,
          variant: "destructive"
        })
      }

      setGenerationProgress(100)
      
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
      setTimeout(() => setGenerationProgress(0), 2000)
    }
  }

  // Find optimal time slot using AI/optimization logic
  const findOptimalTimeSlot = (
    subject: Subject,
    availableFaculty: Faculty[],
    suitableRooms: Room[],
    existingEntries: TimetableEntry[],
    constraints: Constraint[]
  ) => {
    const scores: Array<{
      faculty: Faculty,
      room: Room,
      timeSlot: TimeSlot,
      score: number
    }> = []

    // Evaluate all combinations
    for (const facultyMember of availableFaculty) {
      for (const room of suitableRooms) {
        for (const timeSlot of timeSlots) {
          const score = calculateSlotScore(
            subject,
            facultyMember,
            room,
            timeSlot,
            existingEntries,
            constraints
          )
          
          if (score > 0) {
            scores.push({ faculty: facultyMember, room, timeSlot, score })
          }
        }
      }
    }

    // Return the highest scoring combination
    return scores.sort((a, b) => b.score - a.score)[0] || null
  }

  // Calculate score for a time slot combination
  const calculateSlotScore = (
    subject: Subject,
    faculty: Faculty,
    room: Room,
    timeSlot: TimeSlot,
    existingEntries: TimetableEntry[],
    constraints: Constraint[]
  ): number => {
    let score = 100 // Base score

    // Check for conflicts
    const hasConflict = existingEntries.some(entry => 
      (entry.faculty_id === faculty.id && entry.time_slot_id === timeSlot.id) ||
      (entry.room_id === room.id && entry.time_slot_id === timeSlot.id) ||
      (entry.batch === `${subject.department}_SEM${subject.semester}` && entry.time_slot_id === timeSlot.id)
    )

    if (hasConflict) return 0 // Invalid slot

    // Faculty availability check
    if (!faculty.available_days.includes(timeSlot.day)) {
      return 0
    }

    // Room availability check
    if (!room.available_days.includes(timeSlot.day)) {
      return 0
    }

    // Time preference scoring
    const slotHour = parseInt(timeSlot.start_time.split(':')[0])
    
    // Prefer morning slots for lectures, afternoon for labs
    if (subject.type === 'lecture' && slotHour >= 8 && slotHour <= 12) {
      score += 20
    } else if (subject.type === 'lab' && slotHour >= 13 && slotHour <= 17) {
      score += 20
    }

    // Faculty workload balancing
    const facultyDayLoad = existingEntries.filter(entry => 
      entry.faculty_id === faculty.id && 
      timeSlots.find(ts => ts.id === entry.time_slot_id)?.day === timeSlot.day
    ).length

    if (facultyDayLoad < faculty.max_hours_per_day) {
      score += 10
    } else {
      score -= 30
    }

    // Room capacity matching
    const estimatedStudents = 30 // Could be dynamic based on batch size
    if (room.capacity >= estimatedStudents && room.capacity < estimatedStudents * 1.5) {
      score += 15 // Good fit
    } else if (room.capacity < estimatedStudents) {
      score -= 50 // Too small
    } else {
      score -= 5 // Too large (wasteful)
    }

    // Check custom constraints
    constraints.forEach(constraint => {
      if (constraint.type === 'faculty_unavailable' && constraint.entity_id === faculty.id) {
        if (constraint.restriction.time_slot_id === timeSlot.id) {
          score -= constraint.priority === 'high' ? 100 : constraint.priority === 'medium' ? 50 : 20
        }
      }
    })

    return Math.max(0, score)
  }

  // Drag and drop handlers
  const handleDragStart = (entry: TimetableEntry) => {
    setDraggedItem(entry)
  }

  const handleDrop = async (targetSlotId: string) => {
    if (!draggedItem) return

    try {
      // Update the timetable entry
      const { error } = await supabase
        .from('timetable_entries')
        .update({ time_slot_id: targetSlotId })
        .eq('id', draggedItem.id)

      if (!error) {
        setTimetable(prev => 
          prev.map(entry => 
            entry.id === draggedItem.id 
              ? { ...entry, time_slot_id: targetSlotId }
              : entry
          )
        )
        
        toast({
          title: "Class Moved Successfully",
          description: "Timetable updated"
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setDraggedItem(null)
    }
  }

  // Export timetable to different formats
  const exportTimetable = async (format: 'pdf' | 'excel' | 'ical') => {
    try {
      const response = await fetch('/api/timetable/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          timetable,
          subjects,
          faculty,
          rooms,
          timeSlots,
          filters: {
            department: selectedDepartment,
            semester: selectedSemester,
            week: selectedWeek
          }
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `timetable.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: "Export Successful",
          description: `Timetable exported as ${format.toUpperCase()}`
        })
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export timetable",
        variant: "destructive"
      })
    }
  }

  // Share timetable with notifications
  const shareTimetable = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Timetable Available',
          message: 'Updated timetable has been generated and is now available for viewing.',
          type: 'announcement',
          priority: 'high',
          recipient_type: 'all'
        })
      })

      toast({
        title: "Timetable Shared",
        description: "Notifications sent to all users"
      })
    } catch (error) {
      toast({
        title: "Share Failed",
        description: "Unable to send notifications",
        variant: "destructive"
      })
    }
  }

  // Get timetable statistics
  const getTimetableStats = () => {
    const stats = {
      totalClasses: timetable.length,
      departments: new Set(timetable.map(t => t.department)).size,
      facultyUtilization: faculty.map(f => ({
        name: f.name,
        classes: timetable.filter(t => t.faculty_id === f.id).length,
        utilization: (timetable.filter(t => t.faculty_id === f.id).length / f.max_hours_per_week) * 100
      })),
      roomUtilization: rooms.map(r => ({
        name: r.name,
        classes: timetable.filter(t => t.room_id === r.id).length,
        utilization: (timetable.filter(t => t.room_id === r.id).length / (timeSlots.length * 0.7)) * 100
      })),
      conflicts: 0 // Calculate based on overlaps
    }

    return stats
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Advanced Timetable Generation
          </h1>
          <p className="text-green-700 mt-1">AI-powered smart scheduling with conflict resolution</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button onClick={generateSmartTimetable} disabled={isGenerating} className="bg-green-600 hover:bg-green-700">
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Smart Generate
              </>
            )}
          </Button>
          
          <Button onClick={shareTimetable} variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          
          <Select value="pdf" onValueChange={(value) => exportTimetable(value as any)}>
            <SelectTrigger className="w-[120px]">
              <Download className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="ical">iCal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <RefreshCw className="w-5 h-5 text-green-600 animate-spin" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>Generating Smart Timetable...</span>
                  <span>{Math.round(generationProgress)}%</span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="subjects" className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>Subjects</span>
          </TabsTrigger>
          <TabsTrigger value="faculty" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Faculty</span>
          </TabsTrigger>
          <TabsTrigger value="rooms" className="flex items-center space-x-2">
            <Building className="w-4 h-4" />
            <span>Rooms</span>
          </TabsTrigger>
          <TabsTrigger value="constraints" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Constraints</span>
          </TabsTrigger>
          <TabsTrigger value="timetable" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Timetable</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Total Subjects</p>
                    <p className="text-3xl font-bold text-blue-800">{subjects.length}</p>
                  </div>
                  <BookOpen className="w-12 h-12 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Faculty Members</p>
                    <p className="text-3xl font-bold text-green-800">{faculty.length}</p>
                  </div>
                  <GraduationCap className="w-12 h-12 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">Rooms Available</p>
                    <p className="text-3xl font-bold text-purple-800">{rooms.length}</p>
                  </div>
                  <Building className="w-12 h-12 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium">Classes Scheduled</p>
                    <p className="text-3xl font-bold text-orange-800">{timetable.length}</p>
                  </div>
                  <Calendar className="w-12 h-12 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={() => setShowAddSubject(true)} variant="outline" className="h-20">
                  <div className="text-center">
                    <Plus className="w-6 h-6 mx-auto mb-2" />
                    <span>Add Subject</span>
                  </div>
                </Button>
                
                <Button onClick={() => setShowAddFaculty(true)} variant="outline" className="h-20">
                  <div className="text-center">
                    <Plus className="w-6 h-6 mx-auto mb-2" />
                    <span>Add Faculty</span>
                  </div>
                </Button>
                
                <Button onClick={() => setShowAddRoom(true)} variant="outline" className="h-20">
                  <div className="text-center">
                    <Plus className="w-6 h-6 mx-auto mb-2" />
                    <span>Add Room</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timetable Visualization Tab */}
        <TabsContent value="timetable" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 lg:max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search timetable..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-full lg:w-[160px]">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="computer-science">Computer Science</SelectItem>
                    <SelectItem value="mathematics">Mathematics</SelectItem>
                    <SelectItem value="physics">Physics</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger className="w-full lg:w-[120px]">
                    <SelectValue placeholder="Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    <SelectItem value="1">Semester 1</SelectItem>
                    <SelectItem value="2">Semester 2</SelectItem>
                    <SelectItem value="3">Semester 3</SelectItem>
                    <SelectItem value="4">Semester 4</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger className="w-full lg:w-[120px]">
                    <SelectValue placeholder="Week Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both Weeks</SelectItem>
                    <SelectItem value="odd">Odd Week</SelectItem>
                    <SelectItem value="even">Even Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Timetable Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <span>Interactive Timetable (Drag & Drop)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    <Eye className="w-3 h-3 mr-1" />
                    {timetable.length} Classes
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Timetable Header */}
                  <div className="grid grid-cols-9 gap-1 mb-2">
                    <div className="p-3 bg-gray-100 font-semibold text-center rounded">Time</div>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Sunday'].slice(0, 8).map(day => (
                      <div key={day} className="p-3 bg-gray-100 font-semibold text-center rounded">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Timetable Body */}
                  {timeSlots.filter(slot => slot.day === 'Monday').map(slot => (
                    <div key={slot.id} className="grid grid-cols-9 gap-1 mb-1">
                      <div className="p-2 bg-gray-50 text-sm text-center rounded flex flex-col justify-center">
                        <div className="font-medium">{slot.slot_name}</div>
                        <div className="text-xs text-gray-500">{slot.start_time} - {slot.end_time}</div>
                      </div>
                      
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Sunday'].slice(0, 8).map(day => {
                        const daySlot = timeSlots.find(ts => ts.day === day && ts.start_time === slot.start_time)
                        const classEntry = timetable.find(entry => entry.time_slot_id === daySlot?.id)
                        
                        return (
                          <div
                            key={`${day}_${slot.id}`}
                            className="p-2 border border-gray-200 rounded min-h-[80px] relative"
                            onDrop={(e) => {
                              e.preventDefault()
                              if (daySlot) handleDrop(daySlot.id)
                            }}
                            onDragOver={(e) => e.preventDefault()}
                          >
                            {classEntry && (
                              <motion.div
                                draggable
                                onDragStart={() => handleDragStart(classEntry)}
                                className="bg-blue-100 border border-blue-300 rounded p-2 cursor-move hover:bg-green-200 transition-colors h-full"
                                whileHover={{ scale: 1.02 }}
                                whileDrag={{ scale: 1.05, zIndex: 1000 }}
                              >
                                <div className="text-xs font-semibold text-blue-800 truncate">
                                  {subjects.find(s => s.id === classEntry.subject_id)?.name}
                                </div>
                                <div className="text-xs text-green-600 truncate">
                                  {faculty.find(f => f.id === classEntry.faculty_id)?.name}
                                </div>
                                <div className="text-xs text-blue-500 truncate">
                                  {rooms.find(r => r.id === classEntry.room_id)?.name}
                                </div>
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {classEntry.session_type}
                                </Badge>
                              </motion.div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics will be implemented here */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <span>Timetable Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Faculty Utilization */}
                <div>
                  <h3 className="font-semibold mb-3">Faculty Utilization</h3>
                  <div className="space-y-2">
                    {getTimetableStats().facultyUtilization.slice(0, 5).map((faculty, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{faculty.name}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${Math.min(faculty.utilization, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs">{faculty.classes} classes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Room Utilization */}
                <div>
                  <h3 className="font-semibold mb-3">Room Utilization</h3>
                  <div className="space-y-2">
                    {getTimetableStats().roomUtilization.slice(0, 5).map((room, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{room.name}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${Math.min(room.utilization, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs">{room.classes} classes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Additional tabs for Subjects, Faculty, Rooms, Constraints would go here */}
        {/* For brevity, I'll include placeholders that can be expanded */}
        
        <TabsContent value="subjects">
          <Card>
            <CardHeader>
              <CardTitle>Subject Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Subject management interface will be implemented here with full CRUD operations.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faculty">
          <Card>
            <CardHeader>
              <CardTitle>Faculty Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Faculty management interface with availability settings and constraints.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms">
          <Card>
            <CardHeader>
              <CardTitle>Room Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Room management with capacity, equipment, and availability settings.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="constraints">
          <Card>
            <CardHeader>
              <CardTitle>Scheduling Constraints</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Constraint management for complex scheduling rules and preferences.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
