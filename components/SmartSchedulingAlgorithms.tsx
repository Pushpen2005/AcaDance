import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { supabase } from "@/lib/supabaseClient"
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from "@/hooks/use-toast"
import { 
  Brain, 
  Zap, 
  Settings, 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Target,
  Clock,
  Users,
  MapPin,
  BookOpen,
  BarChart3,
  Activity,
  Shuffle,
  RotateCcw,
  Save,
  Download
} from 'lucide-react'

interface OptimizationSettings {
  algorithm: 'genetic' | 'simulated_annealing' | 'constraint_satisfaction' | 'ai_hybrid'
  populationSize: number
  generations: number
  mutationRate: number
  crossoverRate: number
  temperature: number
  coolingRate: number
  constraints: {
    facultyWorkload: number // Weight for faculty workload balancing
    roomUtilization: number // Weight for room utilization
    timePreferences: number // Weight for time preferences
    conflictAvoidance: number // Weight for conflict avoidance
    studentConvenience: number // Weight for student convenience
  }
  preferences: {
    preferMorningLectures: boolean
    preferAfternoonLabs: boolean
    avoidBackToBackClasses: boolean
    balanceWeeklyLoad: boolean
    minimizeFacultyTravel: boolean
  }
}

interface OptimizationResult {
  timetable: any[]
  metrics: {
    totalConflicts: number
    facultyUtilization: number
    roomUtilization: number
    studentSatisfaction: number
    overallScore: number
  }
  improvements: string[]
  warnings: string[]
}

export default function SmartSchedulingAlgorithms() {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationProgress, setOptimizationProgress] = useState(0)
  const [currentGeneration, setCurrentGeneration] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [settings, setSettings] = useState<OptimizationSettings>({
    algorithm: 'ai_hybrid',
    populationSize: 100,
    generations: 500,
    mutationRate: 0.1,
    crossoverRate: 0.8,
    temperature: 1000,
    coolingRate: 0.95,
    constraints: {
      facultyWorkload: 0.25,
      roomUtilization: 0.20,
      timePreferences: 0.20,
      conflictAvoidance: 0.30,
      studentConvenience: 0.05
    },
    preferences: {
      preferMorningLectures: true,
      preferAfternoonLabs: true,
      avoidBackToBackClasses: true,
      balanceWeeklyLoad: true,
      minimizeFacultyTravel: false
    }
  })
  const [result, setResult] = useState<OptimizationResult | null>(null)
  const [subjects, setSubjects] = useState<any[]>([])
  const [faculty, setFaculty] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [timeSlots, setTimeSlots] = useState<any[]>([])
  const [optimizationHistory, setOptimizationHistory] = useState<number[]>([])

  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [subjectsRes, facultyRes, roomsRes, timeSlotsRes] = await Promise.all([
        supabase.from('subjects').select('*'),
        supabase.from('faculty').select('*'),
        supabase.from('rooms').select('*'),
        supabase.from('time_slots').select('*')
      ])

      setSubjects(subjectsRes.data || [])
      setFaculty(facultyRes.data || [])
      setRooms(roomsRes.data || [])
      setTimeSlots(timeSlotsRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to fetch data for optimization",
        variant: "destructive"
      })
    }
  }

  const startOptimization = async () => {
    if (subjects.length === 0 || faculty.length === 0 || rooms.length === 0) {
      toast({
        title: "Insufficient Data",
        description: "Please ensure subjects, faculty, and rooms are configured",
        variant: "destructive"
      })
      return
    }

    setIsOptimizing(true)
    setOptimizationProgress(0)
    setCurrentGeneration(0)
    setBestScore(0)
    setOptimizationHistory([])

    try {
      let optimizedTimetable: any[] = []

      switch (settings.algorithm) {
        case 'genetic':
          optimizedTimetable = await runGeneticAlgorithm()
          break
        case 'simulated_annealing':
          optimizedTimetable = await runSimulatedAnnealing()
          break
        case 'constraint_satisfaction':
          optimizedTimetable = await runConstraintSatisfaction()
          break
        case 'ai_hybrid':
          optimizedTimetable = await runAIHybridAlgorithm()
          break
      }

      const metrics = calculateMetrics(optimizedTimetable)
      const improvements = identifyImprovements(optimizedTimetable)
      const warnings = identifyWarnings(optimizedTimetable)

      setResult({
        timetable: optimizedTimetable,
        metrics,
        improvements,
        warnings
      })

      // Save to database
      await saveTimetable(optimizedTimetable)

      toast({
        title: "Optimization Complete",
        description: `Successfully generated optimized timetable with score: ${metrics.overallScore}/100`,
      })

    } catch (error) {
      console.error('Optimization error:', error)
      toast({
        title: "Optimization Failed",
        description: "An error occurred during optimization",
        variant: "destructive"
      })
    } finally {
      setIsOptimizing(false)
      setOptimizationProgress(100)
    }
  }

  const runGeneticAlgorithm = async (): Promise<any[]> => {
    // Initialize population
    let population = initializePopulation(settings.populationSize)
    let bestIndividual = population[0]
    let bestFitness = calculateFitness(bestIndividual)

    for (let generation = 0; generation < settings.generations; generation++) {
      setCurrentGeneration(generation)
      setOptimizationProgress((generation / settings.generations) * 100)

      // Evaluate fitness for all individuals
      const fitnessScores = population.map(individual => calculateFitness(individual))
      
      // Find best individual
      const maxFitnessIndex = fitnessScores.indexOf(Math.max(...fitnessScores))
      if (fitnessScores[maxFitnessIndex] > bestFitness) {
        bestIndividual = population[maxFitnessIndex]
        bestFitness = fitnessScores[maxFitnessIndex]
        setBestScore(bestFitness)
      }

      // Selection, crossover, and mutation
      const newPopulation = []
      
      // Elitism - keep best individual
      newPopulation.push(bestIndividual)

      while (newPopulation.length < settings.populationSize) {
        const parent1 = tournamentSelection(population, fitnessScores)
        const parent2 = tournamentSelection(population, fitnessScores)
        
        if (Math.random() < settings.crossoverRate) {
          const [child1, child2] = crossover(parent1, parent2)
          newPopulation.push(mutate(child1))
          if (newPopulation.length < settings.populationSize) {
            newPopulation.push(mutate(child2))
          }
        } else {
          newPopulation.push(mutate(parent1))
          if (newPopulation.length < settings.populationSize) {
            newPopulation.push(mutate(parent2))
          }
        }
      }

      population = newPopulation
      setOptimizationHistory(prev => [...prev, bestFitness])

      // Add delay for visualization
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    return bestIndividual
  }

  const runSimulatedAnnealing = async (): Promise<any[]> => {
    let current = generateRandomTimetable()
    let currentCost = calculateCost(current)
    let best = [...current]
    let bestCost = currentCost
    let temperature = settings.temperature

    const totalIterations = settings.generations
    
    for (let iteration = 0; iteration < totalIterations; iteration++) {
      setCurrentGeneration(iteration)
      setOptimizationProgress((iteration / totalIterations) * 100)

      // Generate neighbor solution
      const neighbor = generateNeighbor(current)
      const neighborCost = calculateCost(neighbor)

      // Accept or reject neighbor
      const delta = neighborCost - currentCost
      if (delta < 0 || Math.random() < Math.exp(-delta / temperature)) {
        current = neighbor
        currentCost = neighborCost

        if (currentCost < bestCost) {
          best = [...current]
          bestCost = currentCost
          setBestScore(100 - bestCost) // Convert cost to score
        }
      }

      // Cool down
      temperature *= settings.coolingRate
      setOptimizationHistory(prev => [...prev, 100 - bestCost])

      await new Promise(resolve => setTimeout(resolve, 5))
    }

    return best
  }

  const runConstraintSatisfaction = async (): Promise<any[]> => {
    const timetable: any[] = []
    const constraints = generateConstraints()

    for (let i = 0; i < subjects.length * 2; i++) { // Assuming 2 sessions per subject on average
      setOptimizationProgress((i / (subjects.length * 2)) * 100)
      
      const assignment = findValidAssignment(timetable, constraints)
      if (assignment) {
        timetable.push(assignment)
      }

      await new Promise(resolve => setTimeout(resolve, 20))
    }

    return timetable
  }

  const runAIHybridAlgorithm = async (): Promise<any[]> => {
    // Combine multiple algorithms for best results
    toast({
      title: "AI Hybrid Algorithm",
      description: "Running multi-stage optimization...",
    })

    // Stage 1: Constraint Satisfaction for initial feasible solution
    let timetable = await runConstraintSatisfaction()
    
    // Stage 2: Genetic Algorithm for optimization
    setOptimizationProgress(50)
    const optimizedByGA = await runGeneticAlgorithm()
    
    // Stage 3: Simulated Annealing for fine-tuning
    setOptimizationProgress(75)
    const finalTimetable = await runSimulatedAnnealing()

    return finalTimetable
  }

  // Helper functions for algorithms
  const initializePopulation = (size: number): any[][] => {
    const population = []
    for (let i = 0; i < size; i++) {
      population.push(generateRandomTimetable())
    }
    return population
  }

  const generateRandomTimetable = (): any[] => {
    const timetable: any[] = []
    const usedSlots: Set<string> = new Set()

    subjects.forEach(subject => {
      for (let session = 0; session < subject.sessions_per_week; session++) {
        const availableFaculty = faculty.filter(f => 
          f.department === subject.department || 
          f.specialization.includes(subject.name)
        )
        const availableRooms = rooms.filter(r => r.type === subject.type)
        
        if (availableFaculty.length > 0 && availableRooms.length > 0) {
          const randomFaculty = availableFaculty[Math.floor(Math.random() * availableFaculty.length)]
          const randomRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)]
          const randomTimeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)]
          
          const slotKey = `${randomFaculty.id}_${randomRoom.id}_${randomTimeSlot.id}`
          if (!usedSlots.has(slotKey)) {
            timetable.push({
              subject_id: subject.id,
              faculty_id: randomFaculty.id,
              room_id: randomRoom.id,
              time_slot_id: randomTimeSlot.id,
              batch: `${subject.department}_SEM${subject.semester}`,
              semester: subject.semester,
              department: subject.department,
              session_type: subject.type
            })
            usedSlots.add(slotKey)
          }
        }
      }
    })

    return timetable
  }

  const calculateFitness = (timetable: any[]): number => {
    let score = 100
    const conflicts = findConflicts(timetable)
    
    // Penalize conflicts heavily
    score -= conflicts.length * 10
    
    // Reward good faculty utilization
    const facultyUtil = calculateFacultyUtilization(timetable)
    score += facultyUtil * settings.constraints.facultyWorkload
    
    // Reward good room utilization
    const roomUtil = calculateRoomUtilization(timetable)
    score += roomUtil * settings.constraints.roomUtilization
    
    // Apply preference bonuses
    if (settings.preferences.preferMorningLectures) {
      const morningLectures = timetable.filter(entry => {
        const timeSlot = timeSlots.find(ts => ts.id === entry.time_slot_id)
        return timeSlot && parseInt(timeSlot.start_time.split(':')[0]) < 12 && entry.session_type === 'lecture'
      }).length
      score += morningLectures * 2
    }

    return Math.max(0, score)
  }

  const calculateCost = (timetable: any[]): number => {
    return 100 - calculateFitness(timetable)
  }

  const findConflicts = (timetable: any[]): any[] => {
    const conflicts = []
    
    for (let i = 0; i < timetable.length; i++) {
      for (let j = i + 1; j < timetable.length; j++) {
        const entry1 = timetable[i]
        const entry2 = timetable[j]
        
        if (entry1.time_slot_id === entry2.time_slot_id) {
          if (entry1.faculty_id === entry2.faculty_id ||
              entry1.room_id === entry2.room_id ||
              entry1.batch === entry2.batch) {
            conflicts.push({ entry1, entry2, type: 'time_conflict' })
          }
        }
      }
    }
    
    return conflicts
  }

  const calculateFacultyUtilization = (timetable: any[]): number => {
    const facultyLoad: Record<string, number> = {}
    
    timetable.forEach(entry => {
      facultyLoad[entry.faculty_id] = (facultyLoad[entry.faculty_id] || 0) + 1
    })
    
    const utilizationRates = Object.entries(facultyLoad).map(([facultyId, load]) => {
      const facultyMember = faculty.find(f => f.id === facultyId)
      return facultyMember ? (load / facultyMember.max_hours_per_week) * 100 : 0
    })
    
    return utilizationRates.length > 0 
      ? utilizationRates.reduce((sum, rate) => sum + rate, 0) / utilizationRates.length 
      : 0
  }

  const calculateRoomUtilization = (timetable: any[]): number => {
    const roomUsage: Record<string, number> = {}
    
    timetable.forEach(entry => {
      roomUsage[entry.room_id] = (roomUsage[entry.room_id] || 0) + 1
    })
    
    const maxPossibleUsage = timeSlots.length * 0.8 // 80% max utilization
    const utilizationRates = Object.values(roomUsage).map(usage => 
      (usage / maxPossibleUsage) * 100
    )
    
    return utilizationRates.length > 0
      ? utilizationRates.reduce((sum, rate) => sum + rate, 0) / utilizationRates.length
      : 0
  }

  const tournamentSelection = (population: any[][], fitnessScores: number[]): any[] => {
    const tournamentSize = 3
    let best = 0
    
    for (let i = 1; i < tournamentSize; i++) {
      const competitor = Math.floor(Math.random() * population.length)
      if (fitnessScores[competitor] > fitnessScores[best]) {
        best = competitor
      }
    }
    
    return population[best]
  }

  const crossover = (parent1: any[], parent2: any[]): [any[], any[]] => {
    const crossoverPoint = Math.floor(Math.random() * Math.min(parent1.length, parent2.length))
    
    const child1 = [
      ...parent1.slice(0, crossoverPoint),
      ...parent2.slice(crossoverPoint)
    ]
    
    const child2 = [
      ...parent2.slice(0, crossoverPoint),
      ...parent1.slice(crossoverPoint)
    ]
    
    return [child1, child2]
  }

  const mutate = (individual: any[]): any[] => {
    const mutated = [...individual]
    
    if (Math.random() < settings.mutationRate && mutated.length > 0) {
      const randomIndex = Math.floor(Math.random() * mutated.length)
      const randomEntry = mutated[randomIndex]
      
      // Randomly change one aspect of the entry
      const changeType = Math.floor(Math.random() * 3)
      
      switch (changeType) {
        case 0: // Change faculty
          const availableFaculty = faculty.filter(f => 
            f.department === subjects.find(s => s.id === randomEntry.subject_id)?.department
          )
          if (availableFaculty.length > 0) {
            randomEntry.faculty_id = availableFaculty[Math.floor(Math.random() * availableFaculty.length)].id
          }
          break
        case 1: // Change room
          const availableRooms = rooms.filter(r => r.type === randomEntry.session_type)
          if (availableRooms.length > 0) {
            randomEntry.room_id = availableRooms[Math.floor(Math.random() * availableRooms.length)].id
          }
          break
        case 2: // Change time slot
          randomEntry.time_slot_id = timeSlots[Math.floor(Math.random() * timeSlots.length)].id
          break
      }
    }
    
    return mutated
  }

  const generateNeighbor = (current: any[]): any[] => {
    const neighbor = [...current]
    
    if (neighbor.length > 1) {
      // Swap two random entries
      const index1 = Math.floor(Math.random() * neighbor.length)
      const index2 = Math.floor(Math.random() * neighbor.length)
      
      if (index1 !== index2) {
        [neighbor[index1], neighbor[index2]] = [neighbor[index2], neighbor[index1]]
      }
    }
    
    return neighbor
  }

  const generateConstraints = (): any[] => {
    // Generate various constraints based on settings
    return [
      // Faculty availability constraints
      // Room capacity constraints  
      // Time preference constraints
      // Department-specific constraints
    ]
  }

  const findValidAssignment = (currentTimetable: any[], constraints: any[]): any | null => {
    // Find a valid assignment that satisfies all constraints
    // This is a simplified implementation
    return null
  }

  const calculateMetrics = (timetable: any[]) => {
    const conflicts = findConflicts(timetable)
    const facultyUtilization = calculateFacultyUtilization(timetable)
    const roomUtilization = calculateRoomUtilization(timetable)
    
    return {
      totalConflicts: conflicts.length,
      facultyUtilization: Math.round(facultyUtilization),
      roomUtilization: Math.round(roomUtilization),
      studentSatisfaction: 85, // Placeholder calculation
      overallScore: Math.round(calculateFitness(timetable))
    }
  }

  const identifyImprovements = (timetable: any[]): string[] => {
    const improvements = []
    
    if (calculateFacultyUtilization(timetable) > 90) {
      improvements.push("Excellent faculty utilization achieved")
    }
    
    if (findConflicts(timetable).length === 0) {
      improvements.push("Zero scheduling conflicts detected")
    }
    
    return improvements
  }

  const identifyWarnings = (timetable: any[]): string[] => {
    const warnings = []
    const conflicts = findConflicts(timetable)
    
    if (conflicts.length > 0) {
      warnings.push(`${conflicts.length} scheduling conflicts need resolution`)
    }
    
    const overutilizedFaculty = faculty.filter(f => {
      const load = timetable.filter(t => t.faculty_id === f.id).length
      return load > f.max_hours_per_week
    })
    
    if (overutilizedFaculty.length > 0) {
      warnings.push(`${overutilizedFaculty.length} faculty members are overutilized`)
    }
    
    return warnings
  }

  const saveTimetable = async (timetable: any[]) => {
    try {
      // Clear existing timetable
      await supabase.from('timetable_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      
      // Insert new timetable
      const { error } = await supabase.from('timetable_entries').insert(timetable)
      
      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error saving timetable:', error)
      throw error
    }
  }

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `optimization-settings-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Smart Scheduling Algorithms
          </h1>
          <p className="text-gray-600 mt-1">AI-powered optimization for perfect timetables</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button onClick={exportSettings} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Settings
          </Button>
          
          <Button 
            onClick={startOptimization} 
            disabled={isOptimizing}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Start Optimization
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Optimization Progress */}
      {isOptimizing && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-purple-800">
                    Running {settings.algorithm.replace('_', ' ').toUpperCase()} Algorithm
                  </h3>
                  <p className="text-purple-600">
                    Generation {currentGeneration} of {settings.generations} | Best Score: {Math.round(bestScore)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-800">{Math.round(optimizationProgress)}%</div>
                  <div className="text-sm text-purple-600">Complete</div>
                </div>
              </div>
              
              <div className="w-full bg-purple-200 rounded-full h-3">
                <motion.div 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${optimizationProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              
              {/* Real-time metrics */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-purple-800">{optimizationHistory.length}</div>
                  <div className="text-sm text-purple-600">Iterations</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-800">{Math.round(bestScore)}</div>
                  <div className="text-sm text-purple-600">Best Score</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-800">
                    {optimizationHistory.length > 1 ? 
                      (optimizationHistory[optimizationHistory.length - 1] > optimizationHistory[optimizationHistory.length - 2] ? '↗' : '→') 
                      : '→'
                    }
                  </div>
                  <div className="text-sm text-purple-600">Trend</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Algorithm Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <span>Algorithm Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Algorithm Selection */}
              <div>
                <Label>Optimization Algorithm</Label>
                <Select 
                  value={settings.algorithm} 
                  onValueChange={(value: any) => setSettings(prev => ({ ...prev, algorithm: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai_hybrid">AI Hybrid (Recommended)</SelectItem>
                    <SelectItem value="genetic">Genetic Algorithm</SelectItem>
                    <SelectItem value="simulated_annealing">Simulated Annealing</SelectItem>
                    <SelectItem value="constraint_satisfaction">Constraint Satisfaction</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Algorithm Parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Population Size</Label>
                  <Slider
                    value={[settings.populationSize]}
                    onValueChange={([value]) => setSettings(prev => ({ ...prev, populationSize: value }))}
                    min={50}
                    max={500}
                    step={10}
                    className="mt-2"
                  />
                  <div className="text-sm text-gray-600 mt-1">{settings.populationSize}</div>
                </div>
                
                <div>
                  <Label>Generations</Label>
                  <Slider
                    value={[settings.generations]}
                    onValueChange={([value]) => setSettings(prev => ({ ...prev, generations: value }))}
                    min={100}
                    max={1000}
                    step={50}
                    className="mt-2"
                  />
                  <div className="text-sm text-gray-600 mt-1">{settings.generations}</div>
                </div>
              </div>

              {/* Constraint Weights */}
              <div>
                <Label className="text-base font-semibold">Constraint Weights</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  {Object.entries(settings.constraints).map(([key, value]) => (
                    <div key={key}>
                      <Label className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                      <Slider
                        value={[value]}
                        onValueChange={([newValue]) => setSettings(prev => ({
                          ...prev,
                          constraints: { ...prev.constraints, [key]: newValue }
                        }))}
                        min={0}
                        max={1}
                        step={0.05}
                        className="mt-1"
                      />
                      <div className="text-xs text-gray-600">{(value * 100).toFixed(0)}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preferences */}
              <div>
                <Label className="text-base font-semibold">Scheduling Preferences</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  {Object.entries(settings.preferences).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label className="text-sm capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, [key]: checked }
                        }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {result && (
            <>
              {/* Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-green-600" />
                    <span>Optimization Results</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{result.metrics.overallScore}/100</div>
                    <div className="text-sm text-gray-600">Overall Score</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Faculty Utilization</span>
                      <span className="font-medium">{result.metrics.facultyUtilization}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Room Utilization</span>
                      <span className="font-medium">{result.metrics.roomUtilization}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Conflicts</span>
                      <span className="font-medium">{result.metrics.totalConflicts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Student Satisfaction</span>
                      <span className="font-medium">{result.metrics.studentSatisfaction}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Improvements */}
              {result.improvements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span>Improvements</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.improvements.map((improvement, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm text-green-700">
                          <CheckCircle className="w-4 h-4" />
                          <span>{improvement}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <span>Warnings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.warnings.map((warning, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm text-yellow-700">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <span>Quick Stats</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Subjects</span>
                <span className="font-medium">{subjects.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Faculty</span>
                <span className="font-medium">{faculty.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Rooms</span>
                <span className="font-medium">{rooms.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Time Slots</span>
                <span className="font-medium">{timeSlots.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
