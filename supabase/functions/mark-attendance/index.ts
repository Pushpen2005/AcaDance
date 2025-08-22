import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface MarkAttendanceRequest {
  sid: string  // session id
  t: string    // token
  latitude?: number
  longitude?: number
}

interface MarkAttendanceResponse {
  success: boolean
  message?: string
  error?: string
  attendance_id?: string
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c // Distance in meters
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
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
    // Get Supabase credentials
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    // Parse request
    const body: MarkAttendanceRequest = await req.json()
    const { sid, t, latitude, longitude } = body

    if (!sid || !t) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session ID and token are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create client with student's auth context
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const studentClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Service client for session validation (doesn't expose token to client)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    // Get student info
    const { data: { user }, error: authError } = await studentClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate session using service client (to check token securely)
    const { data: session, error: sessionError } = await serviceClient
      .from('attendance_sessions')
      .select(`
        id, 
        class_id, 
        faculty_id,
        expires_at, 
        token,
        location_required,
        required_latitude,
        required_longitude,
        location_radius
      `)
      .eq('id', sid)
      .single()

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify token
    if (session.token !== t) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid session token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if session is still valid
    const now = new Date()
    const expiresAt = new Date(session.expires_at)
    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session has expired' }),
        { status: 410, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check location if required
    if (session.location_required) {
      if (!latitude || !longitude) {
        return new Response(
          JSON.stringify({ success: false, error: 'Location is required for this session' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      if (session.required_latitude && session.required_longitude) {
        const distance = calculateDistance(
          latitude, 
          longitude, 
          session.required_latitude, 
          session.required_longitude
        )
        
        const allowedRadius = session.location_radius || 50
        if (distance > allowedRadius) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `You must be within ${allowedRadius}m of the classroom to mark attendance` 
            }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // Check if student is enrolled in this class (optional - depends on your schema)
    const { data: timetable } = await studentClient
      .from('timetables')
      .select('id, course_name')
      .eq('id', session.class_id)
      .single()

    if (!timetable) {
      return new Response(
        JSON.stringify({ success: false, error: 'You are not enrolled in this class' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Insert attendance record (RLS ensures student_id matches auth.uid())
    const attendanceData = {
      student_id: user.id,
      class_id: session.class_id,
      session_id: session.id,
      status: 'present',
      timestamp: now.toISOString(),
      location_latitude: latitude || null,
      location_longitude: longitude || null
    }

    const { data: attendance, error: attendanceError } = await studentClient
      .from('attendance')
      .insert(attendanceData)
      .select('id')
      .single()

    if (attendanceError) {
      // Check for duplicate attendance (unique constraint violation)
      if (attendanceError.message.includes('attendance_student_session_unique') || 
          attendanceError.message.includes('uniq_attendance_one_per_session')) {
        return new Response(
          JSON.stringify({ success: false, error: 'Attendance already marked for this session' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        )
      }
      
      console.error('Attendance insertion error:', attendanceError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to mark attendance' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Success response
    const response: MarkAttendanceResponse = {
      success: true,
      message: 'Attendance marked successfully',
      attendance_id: attendance.id
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    )
  }
})
