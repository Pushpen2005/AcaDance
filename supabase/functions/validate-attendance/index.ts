import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AttendanceRequest {
  qr_data: string
  student_id: string
  location?: {
    latitude: number
    longitude: number
  }
  device_info?: string
}

interface AttendanceResponse {
  success: boolean
  status?: 'present' | 'late' | 'invalid'
  message?: string
  session_info?: {
    class_name: string
    subject: string
    timestamp: string
  }
  error?: string
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    })
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    const { qr_data, student_id, location, device_info }: AttendanceRequest = await req.json()

    if (!qr_data || !student_id) {
      throw new Error('Missing required fields: qr_data and student_id')
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse QR data to get session_id
    const [session_id, timestamp, uuid] = qr_data.split(':')
    if (!session_id || !timestamp || !uuid) {
      throw new Error('Invalid QR code format')
    }

    // Validate QR code and get session
    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('qr_code', qr_data)
      .gt('qr_expiry', new Date().toISOString())
      .eq('status', 'active')
      .single()

    if (sessionError || !session) {
      return new Response(JSON.stringify({
        success: false,
        status: 'invalid',
        error: 'Invalid or expired QR code'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Check if student is enrolled in this class
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', student_id)
      .eq('class_id', session.class_id)
      .single()

    if (!enrollment) {
      throw new Error('Student not enrolled in this class')
    }

    // Check if attendance already marked
    const { data: existingRecord } = await supabase
      .from('attendance_records')
      .select('id, status')
      .eq('session_id', session_id)
      .eq('student_id', student_id)
      .single()

    if (existingRecord) {
      return new Response(JSON.stringify({
        success: false,
        error: `Attendance already marked as ${existingRecord.status}`
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Validate location if required
    let location_verified = false
    if (session.location_required && location) {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        session.required_latitude,
        session.required_longitude
      )
      location_verified = distance <= session.location_radius

      if (!location_verified) {
        throw new Error(`You must be within ${session.location_radius}m of the class location to mark attendance`)
      }
    } else if (session.location_required && !location) {
      throw new Error('Location is required for this session')
    }

    // Determine attendance status based on time
    const now = new Date()
    const sessionStart = new Date(session.start_time)
    const lateThreshold = new Date(sessionStart.getTime() + 15 * 60000) // 15 minutes grace period
    
    let status: 'present' | 'late' = 'present'
    if (now > lateThreshold) {
      status = 'late'
    }

    // Record attendance
    const { data: attendanceRecord, error: recordError } = await supabase
      .from('attendance_records')
      .insert({
        session_id: session_id,
        student_id,
        status,
        location_verified,
        device_info: device_info || 'unknown',
        check_in_time: now.toISOString(),
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        created_at: now.toISOString()
      })
      .select()
      .single()

    if (recordError) {
      throw new Error(`Failed to record attendance: ${recordError.message}`)
    }

    // Update session statistics
    await updateSessionStats(supabase, session_id)

    // Log attendance activity
    await supabase
      .from('audit_logs')
      .insert({
        user_id: student_id,
        action: 'ATTENDANCE_MARKED',
        table_name: 'attendance_records',
        record_id: attendanceRecord.id,
        new_values: {
          session_id,
          status,
          location_verified
        },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      })

    // Send notification
    await supabase.functions.invoke('send-notification', {
      body: {
        user_id: student_id,
        type: 'attendance_confirmation',
        title: 'Attendance Marked Successfully',
        message: `Your attendance has been marked as ${status} for ${session.class_name}`,
        priority: 'medium',
        data: {
          session_id: session_id,
          status,
          timestamp: now.toISOString()
        }
      }
    })

    const response: AttendanceResponse = {
      success: true,
      status,
      message: `Attendance marked successfully as ${status}`,
      session_info: {
        class_name: session.class_name,
        subject: session.subject,
        timestamp: now.toISOString()
      }
    }

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error: any) {
    console.error('Attendance Validation Error:', error)
    
    const errorResponse: AttendanceResponse = {
      success: false,
      error: error.message || 'Internal server error'
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
})

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

// Helper function to update session statistics
async function updateSessionStats(supabase: any, session_id: string) {
  try {
    // Get counts for each status
    const { data: presentCount } = await supabase
      .from('attendance_records')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session_id)
      .eq('status', 'present')

    const { data: lateCount } = await supabase
      .from('attendance_records')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session_id)
      .eq('status', 'late')

    const { data: session } = await supabase
      .from('attendance_sessions')
      .select('total_students')
      .eq('id', session_id)
      .single()

    if (session) {
      const present = presentCount?.count || 0
      const late = lateCount?.count || 0
      const absent = session.total_students - present - late

      await supabase
        .from('attendance_sessions')
        .update({
          present_count: present,
          late_count: late,
          absent_count: Math.max(0, absent),
          attendance_percentage: session.total_students > 0 
            ? Math.round(((present + late) / session.total_students) * 100) 
            : 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', session_id)
    }
  } catch (error) {
    console.error('Failed to update session stats:', error)
  }
}
