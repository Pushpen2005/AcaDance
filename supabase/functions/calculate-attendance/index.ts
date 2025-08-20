import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AttendanceCalculationRequest {
  student_id?: string;
  class_id?: string;
  semester?: string;
  force_recalculate?: boolean;
}

interface AttendanceStats {
  student_id: string;
  total_classes: number;
  attended_classes: number;
  percentage: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  last_updated: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user has appropriate permissions (admin or faculty)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'faculty'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { student_id, class_id, semester, force_recalculate }: AttendanceCalculationRequest = await req.json()

    // Build query based on filters
    let query = supabaseClient
      .from('attendance_records')
      .select(`
        student_id,
        status,
        attendance_sessions!inner(
          class_id,
          semester,
          date
        )
      `)

    if (student_id) {
      query = query.eq('student_id', student_id)
    }

    if (class_id) {
      query = query.eq('attendance_sessions.class_id', class_id)
    }

    if (semester) {
      query = query.eq('attendance_sessions.semester', semester)
    }

    const { data: attendanceData, error: attendanceError } = await query

    if (attendanceError) {
      throw attendanceError
    }

    // Group attendance data by student
    const studentAttendance = new Map<string, { attended: number; total: number }>()

    attendanceData?.forEach(record => {
      const studentId = record.student_id
      if (!studentAttendance.has(studentId)) {
        studentAttendance.set(studentId, { attended: 0, total: 0 })
      }
      
      const stats = studentAttendance.get(studentId)!
      stats.total += 1
      if (record.status === 'present') {
        stats.attended += 1
      }
    })

    // Calculate attendance statistics
    const attendanceStats: AttendanceStats[] = []

    for (const [studentId, stats] of studentAttendance.entries()) {
      const percentage = stats.total > 0 ? (stats.attended / stats.total) * 100 : 0
      
      let status: AttendanceStats['status'] = 'excellent'
      if (percentage < 50) status = 'critical'
      else if (percentage < 70) status = 'warning'
      else if (percentage < 85) status = 'good'

      attendanceStats.push({
        student_id: studentId,
        total_classes: stats.total,
        attended_classes: stats.attended,
        percentage: Math.round(percentage * 100) / 100,
        status,
        last_updated: new Date().toISOString()
      })
    }

    // Update attendance_analytics table
    for (const stat of attendanceStats) {
      const { error: updateError } = await supabaseClient
        .from('attendance_analytics')
        .upsert({
          student_id: stat.student_id,
          class_id: class_id || null,
          semester: semester || null,
          total_classes: stat.total_classes,
          attended_classes: stat.attended_classes,
          percentage: stat.percentage,
          status: stat.status,
          last_updated: stat.last_updated
        })

      if (updateError) {
        console.error('Error updating attendance analytics:', updateError)
      }
    }

    // Check for low attendance and trigger notifications
    const lowAttendanceStudents = attendanceStats.filter(stat => stat.percentage < 75)
    
    for (const student of lowAttendanceStudents) {
      // Create notification for low attendance
      await supabaseClient
        .from('notifications')
        .insert({
          recipient_id: student.student_id,
          title: 'Low Attendance Warning',
          message: `Your attendance is ${student.percentage.toFixed(1)}%. Please improve your attendance to meet minimum requirements.`,
          type: 'warning',
          data: {
            attendance_percentage: student.percentage,
            total_classes: student.total_classes,
            attended_classes: student.attended_classes
          }
        })

      // Send notification via the notification service
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`, {
        method: 'POST',
        headers: {
          'Authorization': req.headers.get('Authorization')!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient_id: student.student_id,
          type: 'low_attendance_alert',
          title: 'Low Attendance Warning',
          message: `Your attendance is ${student.percentage.toFixed(1)}%. Please improve your attendance.`,
          channels: ['email', 'in_app']
        })
      })
    }

    // Log the calculation in audit logs
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'attendance_calculation',
        details: {
          students_processed: attendanceStats.length,
          low_attendance_alerts: lowAttendanceStudents.length,
          filters: { student_id, class_id, semester },
          force_recalculate
        },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          attendance_stats: attendanceStats,
          summary: {
            total_students: attendanceStats.length,
            average_percentage: attendanceStats.reduce((sum, stat) => sum + stat.percentage, 0) / attendanceStats.length,
            low_attendance_count: lowAttendanceStudents.length,
            excellent_count: attendanceStats.filter(s => s.status === 'excellent').length,
            good_count: attendanceStats.filter(s => s.status === 'good').length,
            warning_count: attendanceStats.filter(s => s.status === 'warning').length,
            critical_count: attendanceStats.filter(s => s.status === 'critical').length
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in attendance calculation:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to calculate attendance',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
