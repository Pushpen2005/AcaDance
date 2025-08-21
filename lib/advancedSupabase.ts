import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Advanced Supabase Integration Library
 * Provides real-time data, caching, optimizations, and advanced features
 */

// Enhanced Supabase client with advanced features
export class AdvancedSupabaseClient {
  private client: SupabaseClient
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>
  private subscriptions: Map<string, RealtimeChannel>
  private listeners: Map<string, Set<(data: any) => void>>

  constructor() {
    this.client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
        db: {
          schema: 'public',
        },
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
        global: {
          headers: {
            'x-application-name': 'academic-system',
          },
        },
      }
    )
    this.cache = new Map()
    this.subscriptions = new Map()
    this.listeners = new Map()
  }

  // Get the underlying Supabase client
  getClient(): SupabaseClient {
    return this.client
  }

  // Advanced query with caching
  async query(
    table: string,
    options: {
      select?: string
      filter?: any
      cache?: boolean
      cacheTTL?: number
      realtime?: boolean
    } = {}
  ) {
    const cacheKey = `${table}_${JSON.stringify(options)}`
    
    // Check cache first
    if (options.cache !== false && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      if (Date.now() - cached.timestamp < cached.ttl) {
        return { data: cached.data, error: null, fromCache: true }
      }
    }

    // Build query
    let query = this.client.from(table).select(options.select || '*')
    
    if (options.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'operator' in value && 'value' in value) {
          query = query.filter(key, (value as any).operator, (value as any).value)
        } else {
          query = query.eq(key, value)
        }
      })
    }

    const { data, error } = await query

    // Cache result
    if (!error && options.cache !== false) {
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: options.cacheTTL || 300000, // 5 minutes default
      })
    }

    // Setup real-time subscription
    if (options.realtime && !error) {
      this.subscribeToTable(table, cacheKey)
    }

    return { data, error, fromCache: false }
  }

  // Real-time subscription management
  subscribeToTable(table: string, cacheKey?: string) {
    if (this.subscriptions.has(table)) return

    const channel = this.client
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        (payload) => {
          // Invalidate cache
          if (cacheKey) {
            this.cache.delete(cacheKey)
          }

          // Notify listeners
          const listeners = this.listeners.get(table)
          if (listeners) {
            listeners.forEach((callback) => callback(payload))
          }
        }
      )
      .subscribe()

    this.subscriptions.set(table, channel)
  }

  // Add listener for real-time updates
  onTableChange(table: string, callback: (data: any) => void) {
    if (!this.listeners.has(table)) {
      this.listeners.set(table, new Set())
    }
    this.listeners.get(table)!.add(callback)

    // Ensure subscription exists
    this.subscribeToTable(table)

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(table)
      if (listeners) {
        listeners.delete(callback)
        if (listeners.size === 0) {
          this.listeners.delete(table)
          const subscription = this.subscriptions.get(table)
          if (subscription) {
            subscription.unsubscribe()
            this.subscriptions.delete(table)
          }
        }
      }
    }
  }

  // Advanced user management
  async getUserProfile(userId?: string) {
    const { data: { user } } = await this.client.auth.getUser()
    const targetUserId = userId || user?.id

    if (!targetUserId) return { data: null, error: new Error('No user found') }

    return this.query('users', {
      filter: { id: targetUserId },
      cache: true,
      cacheTTL: 60000, // 1 minute cache for user profiles
    })
  }

  // Advanced attendance functions
  async getAttendanceData(options: {
    studentId?: string
    courseId?: string
    dateRange?: { start: string; end: string }
    realtime?: boolean
  } = {}) {
    const filters: any = {}
    
    if (options.studentId) filters.student_id = options.studentId
    if (options.courseId) {
      // Join with sessions to filter by course
      return this.client
        .from('attendance_records')
        .select(`
          *,
          attendance_sessions!inner(
            *,
            timetables!inner(
              *,
              courses!inner(*)
            )
          )
        `)
        .eq('attendance_sessions.timetables.courses.id', options.courseId)
    }

    return this.query('attendance_records', {
      select: `
        *,
        attendance_sessions(
          *,
          timetables(
            *,
            courses(*)
          )
        )
      `,
      filter: filters,
      cache: true,
      realtime: options.realtime,
    })
  }

  // Advanced timetable functions
  async getTimetableData(options: {
    facultyId?: string
    studentId?: string
    courseId?: string
    dayOfWeek?: number
    realtime?: boolean
  } = {}) {
    const filters: any = {}
    
    if (options.facultyId) filters.faculty_id = options.facultyId
    if (options.courseId) filters.course_id = options.courseId
    if (options.dayOfWeek) filters.day_of_week = options.dayOfWeek

    let selectQuery = `
      *,
      courses(*),
      users!timetables_faculty_id_fkey(name, email)
    `

    // If student ID provided, only show enrolled courses
    if (options.studentId) {
      return this.client
        .from('timetables')
        .select(`
          *,
          courses!inner(
            *,
            enrollments!inner(student_id)
          ),
          users!timetables_faculty_id_fkey(name, email)
        `)
        .eq('courses.enrollments.student_id', options.studentId)
    }

    return this.query('timetables', {
      select: selectQuery,
      filter: filters,
      cache: true,
      realtime: options.realtime,
    })
  }

  // Advanced analytics
  async getAnalytics(type: 'attendance' | 'courses' | 'users' | 'system') {
    switch (type) {
      case 'attendance':
        return this.client.rpc('get_attendance_analytics')
      case 'courses':
        return this.query('courses', {
          select: `
            *,
            enrollments(count),
            timetables(count)
          `,
          cache: true,
        })
      case 'users':
        return this.query('users', {
          select: 'role',
          cache: true,
        })
      case 'system':
        return this.client.rpc('get_system_metrics')
    }
  }

  // Advanced notifications
  async createNotification(notification: {
    userId: string
    type: string
    title: string
    message: string
    data?: any
    priority?: 'low' | 'medium' | 'high' | 'critical'
  }) {
    return this.client.from('alerts').insert({
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      priority: notification.priority || 'medium',
    })
  }

  // Batch operations
  async batchInsert(table: string, records: any[]) {
    const batchSize = 1000 // Supabase limit
    const results = []

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      const { data, error } = await this.client.from(table).insert(batch)
      results.push({ data, error, batch: Math.floor(i / batchSize) + 1 })
    }

    return results
  }

  // Advanced search
  async search(table: string, searchTerm: string, searchFields: string[]) {
    let query = this.client.from(table).select('*')
    
    // Build OR conditions for text search
    const conditions = searchFields.map(field => `${field}.ilike.%${searchTerm}%`)
    if (conditions.length > 0) {
      query = query.or(conditions.join(','))
    }

    return query
  }

  // Cache management
  clearCache(pattern?: string) {
    if (!pattern) {
      this.cache.clear()
      return
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      subscriptions: Array.from(this.subscriptions.keys()),
      listeners: Object.fromEntries(
        Array.from(this.listeners.entries()).map(([key, set]) => [key, set.size])
      ),
    }
  }

  // Cleanup
  cleanup() {
    this.cache.clear()
    this.subscriptions.forEach((subscription) => subscription.unsubscribe())
    this.subscriptions.clear()
    this.listeners.clear()
  }
}

// Create singleton instance
export const advancedSupabase = new AdvancedSupabaseClient()

// Hooks for React components
export const useSupabaseQuery = (
  table: string,
  options: any = {},
  dependencies: any[] = []
) => {
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<any>(null)

  React.useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      setLoading(true)
      try {
        const result = await advancedSupabase.query(table, options)
        if (mounted) {
          setData(result.data)
          setError(result.error)
        }
      } catch (err) {
        if (mounted) {
          setError(err)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    // Setup real-time listener if requested
    let unsubscribe: (() => void) | undefined
    if (options.realtime) {
      unsubscribe = advancedSupabase.onTableChange(table, () => {
        fetchData()
      })
    }

    return () => {
      mounted = false
      if (unsubscribe) unsubscribe()
    }
  }, dependencies)

  return { data, loading, error }
}

// Export React for the hook
import React from 'react'

// Utility functions for common operations
export const supabaseUtils = {
  // Format user display name
  formatUserName: (user: any) => {
    return user?.name || user?.email || 'Unknown User'
  },

  // Get user role badge
  getUserRoleBadge: (role: string) => {
    const badges = {
      student: { label: 'Student', color: 'blue' },
      faculty: { label: 'Faculty', color: 'green' },
      admin: { label: 'Admin', color: 'red' },
    }
    return badges[role as keyof typeof badges] || { label: role, color: 'gray' }
  },

  // Calculate attendance percentage
  calculateAttendancePercentage: (records: any[]) => {
    if (!records.length) return 0
    const present = records.filter(r => r.status === 'present' || r.status === 'late').length
    return Math.round((present / records.length) * 100)
  },

  // Format date for display
  formatDate: (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  },

  // Format time for display
  formatTime: (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  },
}
