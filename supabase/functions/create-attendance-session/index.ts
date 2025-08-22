import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CreateSessionRequest {
  class_id: string
  duration_minutes?: number
  location_required?: boolean
  latitude?: number
  longitude?: number
  radius_meters?: number
}

interface CreateSessionResponse {
  success: boolean
  session?: {
    id: string
    class_id: string
    expires_at: string
    token: string
    qr_payload: string
  }
  error?: string
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
    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration')
    }

    // Create Supabase client with user's auth context
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    })

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body: CreateSessionRequest = await req.json()
    const { 
      class_id, 
      duration_minutes = 5, 
      location_required = false,
      latitude,
      longitude,
      radius_meters = 50
    } = body

    if (!class_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'class_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify faculty owns the class (RLS will also protect this)
    const { data: timetable, error: timetableError } = await supabase
      .from('timetables')
      .select('id, faculty_id, course_name, time_slot, room')
      .eq('id', class_id)
      .eq('faculty_id', user.id)
      .single()

    if (timetableError || !timetable) {
      return new Response(
        JSON.stringify({ success: false, error: 'Class not found or unauthorized' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Generate session data
    const expires_at = new Date(Date.now() + duration_minutes * 60_000).toISOString()
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Create attendance session
    const sessionData = {
      class_id,
      faculty_id: user.id,
      expires_at,
      token,
      location_required,
      required_latitude: location_required ? latitude : null,
      required_longitude: location_required ? longitude : null,
      location_radius: location_required ? radius_meters : null
    }

    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .insert(sessionData)
      .select('id, class_id, expires_at, token')
      .single()

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create session' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create QR payload - compact format for QR code
    const qrPayload = JSON.stringify({
      sid: session.id,
      t: session.token,
      exp: Math.floor(new Date(session.expires_at).getTime() / 1000)
    })

    const response: CreateSessionResponse = {
      success: true,
      session: {
        id: session.id,
        class_id: session.class_id,
        expires_at: session.expires_at,
        token: session.token,
        qr_payload: qrPayload
      }
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
