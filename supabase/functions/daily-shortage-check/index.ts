import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AttendanceStats {
  student_id: string
  student_name: string
  course_id: string
  course_name: string
  total_sessions: number
  attended_sessions: number
  attendance_percentage: number
}

serve(async (req: Request): Promise<Response> => {
  try {
    // This function should only be called internally or by Supabase cron
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    // Use service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calculate attendance for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    // Get all attendance sessions in the last 30 days
    const { data: sessions, error: sessionsError } = await supabase
      .from('attendance_sessions')
      .select(`
        id,
        class_id,
        created_at,
        timetables (
          id,
          course_name,
          course_id
        )
      `)
      .gte('created_at', thirtyDaysAgo)

    if (sessionsError) {
      throw new Error(`Failed to fetch sessions: ${sessionsError.message}`)
    }

    // Get all students
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('role', 'student')

    if (studentsError) {
      throw new Error(`Failed to fetch students: ${studentsError.message}`)
    }

    // Group sessions by course
    const courseStats = new Map<string, {
      course_id: string
      course_name: string
      total_sessions: number
      session_ids: string[]
    }>()

    sessions?.forEach(session => {
      const courseKey = session.timetables?.course_id || session.class_id
      const courseName = session.timetables?.course_name || 'Unknown Course'
      
      if (!courseStats.has(courseKey)) {
        courseStats.set(courseKey, {
          course_id: courseKey,
          course_name: courseName,
          total_sessions: 0,
          session_ids: []
        })
      }
      
      const stats = courseStats.get(courseKey)!
      stats.total_sessions++
      stats.session_ids.push(session.id)
    })

    const notificationsToSend: Array<{
      user_id: string
      type: string
      title: string
      message: string
      data: any
    }> = []

    // Calculate attendance for each student for each course
    for (const student of students || []) {
      for (const [courseId, courseData] of courseStats) {
        if (courseData.total_sessions === 0) continue

        // Count student's attendance for this course
        const { data: attendanceRecords, error: attendanceError } = await supabase
          .from('attendance')
          .select('id, status')
          .eq('student_id', student.id)
          .in('session_id', courseData.session_ids)
          .eq('status', 'present')

        if (attendanceError) {
          console.error(`Error fetching attendance for student ${student.id}:`, attendanceError)
          continue
        }

        const attendedSessions = attendanceRecords?.length || 0
        const attendancePercentage = (attendedSessions / courseData.total_sessions) * 100

        // Check if attendance is below threshold (75%)
        if (attendancePercentage < 75) {
          // Check if we already sent a notification this week
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          
          const { data: recentNotifications } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', student.id)
            .eq('type', 'attendance_warning')
            .gte('created_at', oneWeekAgo)
            .like('message', `%${courseData.course_name}%`)

          // Only send if no recent notification for this course
          if (!recentNotifications || recentNotifications.length === 0) {
            notificationsToSend.push({
              user_id: student.id,
              type: 'attendance_warning',
              title: 'Low Attendance Warning',
              message: `Your attendance in ${courseData.course_name} is ${attendancePercentage.toFixed(1)}% (${attendedSessions}/${courseData.total_sessions} classes). This is below the required 75% threshold.`,
              data: {
                course_id: courseId,
                course_name: courseData.course_name,
                attendance_percentage: attendancePercentage,
                attended_sessions: attendedSessions,
                total_sessions: courseData.total_sessions,
                threshold: 75
              }
            })
          }
        }
      }
    }

    // Send all notifications in batch
    if (notificationsToSend.length > 0) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notificationsToSend)

      if (notificationError) {
        throw new Error(`Failed to send notifications: ${notificationError.message}`)
      }
    }

    // Also check for students with very low overall attendance (below 60%)
    for (const student of students || []) {
      // Get all attendance records for this student in the last 30 days
      const { data: allAttendance, error: allAttendanceError } = await supabase
        .from('attendance')
        .select(`
          id,
          status,
          session_id,
          attendance_sessions!inner (
            id,
            created_at
          )
        `)
        .eq('student_id', student.id)
        .gte('attendance_sessions.created_at', thirtyDaysAgo)

      if (allAttendanceError) {
        console.error(`Error fetching all attendance for student ${student.id}:`, allAttendanceError)
        continue
      }

      const totalPossibleSessions = sessions?.length || 0
      const attendedSessions = allAttendance?.filter(a => a.status === 'present').length || 0
      
      if (totalPossibleSessions > 0) {
        const overallPercentage = (attendedSessions / totalPossibleSessions) * 100
        
        if (overallPercentage < 60) {
          // Check for recent overall warning
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          
          const { data: recentOverallNotifications } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', student.id)
            .eq('type', 'critical_attendance')
            .gte('created_at', oneWeekAgo)

          if (!recentOverallNotifications || recentOverallNotifications.length === 0) {
            const { error: criticalNotificationError } = await supabase
              .from('notifications')
              .insert({
                user_id: student.id,
                type: 'critical_attendance',
                title: 'Critical Attendance Alert',
                message: `Your overall attendance is critically low at ${overallPercentage.toFixed(1)}% (${attendedSessions}/${totalPossibleSessions} classes). Please contact your academic advisor immediately.`,
                data: {
                  overall_attendance_percentage: overallPercentage,
                  attended_sessions: attendedSessions,
                  total_sessions: totalPossibleSessions,
                  critical_threshold: 60
                }
              })

            if (criticalNotificationError) {
              console.error('Failed to send critical notification:', criticalNotificationError)
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${students?.length || 0} students, sent ${notificationsToSend.length} notifications`,
        notifications_sent: notificationsToSend.length
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Daily shortage check error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
})
