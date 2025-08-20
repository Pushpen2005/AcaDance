import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/supabaseClient"
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from "@/hooks/use-toast"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  BookOpen,
  Filter,
  Search,
  Palette,
  Eye,
  EyeOff,
  RotateCcw,
  Settings,
  Download,
  Share2,
  Maximize,
  Minimize
} from 'lucide-react'

interface TimetableEntry {
  id: string
  subject_id: string
  faculty_id: string
  room_id: string
  time_slot_id: string
  batch: string
  semester: number
  department: string
  session_type: 'lecture' | 'lab' | 'tutorial'
  subject?: {
    name: string
    code: string
    type: string
  }
  faculty?: {
    name: string
    department: string
  }
  room?: {
    name: string
    type: string
    capacity: number
  }
  time_slot?: {
    day: string
    start_time: string
    end_time: string
    slot_name: string
  }
}

interface ColorScheme {
  lecture: string
  lab: string
  tutorial: string
  seminar: string
}

const colorSchemes: Record<string, ColorScheme> = {
  default: {
    lecture: 'bg-blue-100 border-blue-300 text-blue-800',
    lab: 'bg-green-100 border-green-300 text-green-800',
    tutorial: 'bg-purple-100 border-purple-300 text-purple-800',
    seminar: 'bg-orange-100 border-orange-300 text-orange-800'
  },
  vibrant: {
    lecture: 'bg-gradient-to-r from-blue-400 to-blue-600 text-white',
    lab: 'bg-gradient-to-r from-green-400 to-green-600 text-white',
    tutorial: 'bg-gradient-to-r from-purple-400 to-purple-600 text-white',
    seminar: 'bg-gradient-to-r from-orange-400 to-orange-600 text-white'
  },
  pastel: {
    lecture: 'bg-blue-50 border-blue-200 text-green-700',
    lab: 'bg-green-50 border-green-200 text-green-700',
    tutorial: 'bg-purple-50 border-purple-200 text-purple-700',
    seminar: 'bg-orange-50 border-orange-200 text-orange-700'
  },
  dark: {
    lecture: 'bg-slate-800 border-slate-600 text-slate-100',
    lab: 'bg-emerald-800 border-emerald-600 text-emerald-100',
    tutorial: 'bg-violet-800 border-violet-600 text-violet-100',
    seminar: 'bg-amber-800 border-amber-600 text-amber-100'
  }
}

const departmentColors: Record<string, string> = {
  'Computer Science': 'bg-blue-500',
  'Mathematics': 'bg-purple-500',
  'Physics': 'bg-green-500',
  'Chemistry': 'bg-yellow-500',
  'Biology': 'bg-pink-500',
  'Engineering': 'bg-red-500'
}

export default function ColorCodedTimetableView() {
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>([])
  const [filteredData, setFilteredData] = useState<TimetableEntry[]>([])
  const [timeSlots, setTimeSlots] = useState<any[]>([])
  const [selectedWeek, setSelectedWeek] = useState('current')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedBatch, setSelectedBatch] = useState('all')
  const [selectedRoom, setSelectedRoom] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [colorScheme, setColorScheme] = useState('default')
  const [showRoomInfo, setShowRoomInfo] = useState(true)
  const [showFacultyInfo, setShowFacultyInfo] = useState(true)
  const [showTimeInfo, setShowTimeInfo] = useState(true)
  const [isCompactView, setIsCompactView] = useState(false)
  const [highlightConflicts, setHighlightConflicts] = useState(true)
  const [view, setView] = useState<'grid' | 'list' | 'calendar'>('grid')
  
  const { toast } = useToast()

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  useEffect(() => {
    fetchTimetableData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [timetableData, selectedDepartment, selectedBatch, selectedRoom, searchTerm])

  const fetchTimetableData = async () => {
    try {
      const { data: timetableEntries } = await supabase
        .from('timetable_entries')
        .select(`
          *,
          subjects:subject_id(name, code, type),
          faculty:faculty_id(name, department),
          rooms:room_id(name, type, capacity),
          time_slots:time_slot_id(day, start_time, end_time, slot_name)
        `)

      const { data: slots } = await supabase
        .from('time_slots')
        .select('*')
        .order('day, start_time')

      setTimetableData(timetableEntries || [])
      setTimeSlots(slots || [])
    } catch (error) {
      console.error('Error fetching timetable data:', error)
      toast({
        title: "Error",
        description: "Failed to fetch timetable data",
        variant: "destructive"
      })
    }
  }

  const applyFilters = () => {
    let filtered = [...timetableData]

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(entry => entry.department === selectedDepartment)
    }

    if (selectedBatch !== 'all') {
      filtered = filtered.filter(entry => entry.batch === selectedBatch)
    }

    if (selectedRoom !== 'all') {
      filtered = filtered.filter(entry => entry.room_id === selectedRoom)
    }

    if (searchTerm) {
      filtered = filtered.filter(entry => 
        entry.subject?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.faculty?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.room?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.batch.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredData(filtered)
  }

  const getClassColor = (entry: TimetableEntry): string => {
    const scheme = colorSchemes[colorScheme]
    const sessionType = entry.session_type as keyof ColorScheme
    return scheme[sessionType] || scheme.lecture
  }

  const getDepartmentColor = (department: string): string => {
    return departmentColors[department] || 'bg-gray-500'
  }

  const hasConflict = (entry: TimetableEntry): boolean => {
    if (!highlightConflicts) return false
    
    const conflicts = filteredData.filter(other => 
      other.id !== entry.id && 
      other.time_slot_id === entry.time_slot_id &&
      (other.faculty_id === entry.faculty_id || 
       other.room_id === entry.room_id ||
       other.batch === entry.batch)
    )
    
    return conflicts.length > 0
  }

  const getTimeSlotForDay = (day: string, startTime: string) => {
    return timeSlots.find(slot => slot.day === day && slot.start_time === startTime)
  }

  const getClassesForSlot = (day: string, startTime: string) => {
    const slot = getTimeSlotForDay(day, startTime)
    if (!slot) return []
    
    return filteredData.filter(entry => entry.time_slot_id === slot.id)
  }

  const exportTimetable = () => {
    // Create a simple text export
    let exportText = 'TIMETABLE EXPORT\n'
    exportText += '=================\n\n'
    
    days.forEach(day => {
      exportText += `${day.toUpperCase()}\n`
      exportText += '-'.repeat(day.length) + '\n'
      
      const daySlots = timeSlots.filter(slot => slot.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time))
      
      daySlots.forEach(slot => {
        const classes = getClassesForSlot(day, slot.start_time)
        if (classes.length > 0) {
          exportText += `${slot.start_time} - ${slot.end_time}:\n`
          classes.forEach(cls => {
            exportText += `  • ${cls.subject?.name} (${cls.faculty?.name}) - ${cls.room?.name}\n`
          })
        }
      })
      
      exportText += '\n'
    })
    
    const blob = new Blob([exportText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `timetable-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    toast({
      title: "Export Complete",
      description: "Timetable exported successfully"
    })
  }

  const renderGridView = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-green-600" />
            <span>Weekly Timetable Grid</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setIsCompactView(!isCompactView)} variant="outline" size="sm">
              {isCompactView ? <Maximize className="w-4 h-4" /> : <Minimize className="w-4 h-4" />}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Header */}
            <div className="grid grid-cols-8 gap-2 mb-4">
              <div className="p-3 bg-gray-100 font-semibold text-center rounded">Time</div>
              {days.map(day => (
                <div key={day} className="p-3 bg-gray-100 font-semibold text-center rounded">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Time Slots */}
            {timeSlots
              .filter(slot => slot.day === 'Monday') // Get unique time slots
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
              .map(timeSlot => (
                <div key={timeSlot.id} className="grid grid-cols-8 gap-2 mb-2">
                  <div className={`p-2 bg-gray-50 text-center rounded flex flex-col justify-center ${isCompactView ? 'text-xs' : 'text-sm'}`}>
                    <div className="font-medium">{timeSlot.slot_name}</div>
                    {showTimeInfo && (
                      <div className="text-xs text-gray-500">
                        {timeSlot.start_time} - {timeSlot.end_time}
                      </div>
                    )}
                  </div>
                  
                  {days.map(day => {
                    const classes = getClassesForSlot(day, timeSlot.start_time)
                    
                    return (
                      <div key={`${day}_${timeSlot.start_time}`} className="min-h-[80px] relative">
                        <AnimatePresence>
                          {classes.map((entry, index) => {
                            const conflict = hasConflict(entry)
                            return (
                              <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`
                                  ${getClassColor(entry)} 
                                  ${conflict ? 'ring-2 ring-red-500' : ''} 
                                  ${isCompactView ? 'p-1' : 'p-2'} 
                                  border-2 rounded cursor-pointer hover:shadow-lg transition-all duration-200
                                  ${index > 0 ? 'mt-1' : ''}
                                `}
                                style={{ 
                                  zIndex: conflict ? 10 : 1,
                                  transform: index > 0 ? `translateY(${index * 2}px)` : 'none'
                                }}
                                whileHover={{ scale: 1.02 }}
                              >
                                <div className={`${isCompactView ? 'text-xs' : 'text-sm'} font-semibold truncate`}>
                                  {entry.subject?.name}
                                </div>
                                
                                {!isCompactView && showFacultyInfo && (
                                  <div className="text-xs truncate opacity-90">
                                    {entry.faculty?.name}
                                  </div>
                                )}
                                
                                {!isCompactView && showRoomInfo && (
                                  <div className="text-xs truncate opacity-75">
                                    {entry.room?.name}
                                  </div>
                                )}
                                
                                <div className="flex items-center justify-between mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {entry.session_type}
                                  </Badge>
                                  
                                  {!isCompactView && (
                                    <div 
                                      className={`w-2 h-2 rounded-full ${getDepartmentColor(entry.department)}`}
                                      title={entry.department}
                                    />
                                  )}
                                </div>
                                
                                {conflict && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white">
                                    <span className="sr-only">Conflict detected</span>
                                  </div>
                                )}
                              </motion.div>
                            )
                          })}
                        </AnimatePresence>
                        
                        {classes.length === 0 && (
                          <div className="w-full h-full border-2 border-dashed border-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                            Free
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))
            }
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderListView = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-green-600" />
          <span>Timetable List View</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {days.map(day => {
            const dayClasses = filteredData.filter(entry => entry.time_slot?.day === day)
              .sort((a, b) => (a.time_slot?.start_time || '').localeCompare(b.time_slot?.start_time || ''))
            
            if (dayClasses.length === 0) return null
            
            return (
              <div key={day} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-800">
                  {day}
                </div>
                <div className="p-4 space-y-3">
                  {dayClasses.map(entry => {
                    const conflict = hasConflict(entry)
                    return (
                      <motion.div
                        key={entry.id}
                        className={`
                          ${getClassColor(entry)} 
                          ${conflict ? 'ring-2 ring-red-500' : ''} 
                          p-4 rounded-lg border-2
                        `}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-lg">{entry.subject?.name}</h3>
                              <Badge variant="outline">{entry.subject?.code}</Badge>
                              <Badge variant="secondary">{entry.session_type}</Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{entry.time_slot?.start_time} - {entry.time_slot?.end_time}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <User className="w-4 h-4" />
                                <span>{entry.faculty?.name}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{entry.room?.name}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <div className={`w-3 h-3 rounded-full ${getDepartmentColor(entry.department)}`} />
                                <span>{entry.batch}</span>
                              </div>
                            </div>
                          </div>
                          
                          {conflict && (
                            <div className="ml-4 text-red-600 font-semibold text-sm">
                              CONFLICT
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Color-Coded Timetable
          </h1>
          <p className="text-green-700 mt-1">Visual timetable with advanced color coding and filtering</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button onClick={exportTimetable} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          <Button variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Main Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search classes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger>
                  <SelectValue placeholder="Batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  <SelectItem value="CS_SEM3">CS Sem 3</SelectItem>
                  <SelectItem value="CS_SEM5">CS Sem 5</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={colorScheme} onValueChange={setColorScheme}>
                <SelectTrigger>
                  <SelectValue placeholder="Color Scheme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="vibrant">Vibrant</SelectItem>
                  <SelectItem value="pastel">Pastel</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={view} onValueChange={(value: any) => setView(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid View</SelectItem>
                  <SelectItem value="list">List View</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Options */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Switch checked={showRoomInfo} onCheckedChange={setShowRoomInfo} />
                <span className="text-sm">Show Room Info</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch checked={showFacultyInfo} onCheckedChange={setShowFacultyInfo} />
                <span className="text-sm">Show Faculty Info</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch checked={showTimeInfo} onCheckedChange={setShowTimeInfo} />
                <span className="text-sm">Show Time Info</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch checked={highlightConflicts} onCheckedChange={setHighlightConflicts} />
                <span className="text-sm">Highlight Conflicts</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium">Legend:</span>
            
            {Object.entries(colorSchemes[colorScheme]).map(([type, className]) => (
              <div key={type} className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded border-2 ${className}`} />
                <span className="text-sm capitalize">{type}</span>
              </div>
            ))}
            
            <div className="border-l border-gray-300 pl-4 ml-4 flex items-center space-x-4">
              <span className="text-sm font-medium">Departments:</span>
              
              {Object.entries(departmentColors).slice(0, 4).map(([dept, color]) => (
                <div key={dept} className="flex items-center space-x-1">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-xs">{dept}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timetable Content */}
      {view === 'grid' ? renderGridView() : renderListView()}
      
      {/* Summary Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{filteredData.length}</div>
              <div className="text-sm text-green-700">Total Classes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {new Set(filteredData.map(entry => entry.department)).size}
              </div>
              <div className="text-sm text-green-700">Departments</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {filteredData.filter(entry => hasConflict(entry)).length}
              </div>
              <div className="text-sm text-green-700">Conflicts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {new Set(filteredData.map(entry => entry.room_id)).size}
              </div>
              <div className="text-sm text-green-700">Rooms Used</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
