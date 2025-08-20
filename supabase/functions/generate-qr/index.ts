import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { QRCodeGenerator } from 'https://deno.land/x/qrcode_generator@v1.8.0/mod.ts'

interface QRRequest {
  session_id: string
  faculty_id: string
  expiry_minutes?: number
  location_required?: boolean
  required_latitude?: number
  required_longitude?: number
  location_radius?: number
}

interface QRResponse {
  success: boolean
  qr_code?: string
  qr_data?: string
  expiry_time?: string
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
    // Verify request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Parse request body
    const { 
      session_id, 
      faculty_id, 
      expiry_minutes = 30,
      location_required = false,
      required_latitude,
      required_longitude,
      location_radius = 50
    }: QRRequest = await req.json()

    if (!session_id || !faculty_id) {
      throw new Error('Missing required fields: session_id and faculty_id')
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify faculty owns the session
    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('faculty_id', faculty_id)
      .single()

    if (sessionError || !session) {
      throw new Error('Session not found or access denied')
    }

    // Generate unique QR code data
    const timestamp = Date.now()
    const randomString = crypto.randomUUID()
    const qrData = `${session_id}:${timestamp}:${randomString}`
    
    // Calculate expiry time
    const expiryTime = new Date(Date.now() + expiry_minutes * 60 * 1000)

    // Generate QR code image data URL
    const qrCode = new QRCodeGenerator()
    const qrCodeDataURL = await qrCode.createDataURL(qrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    })

    // Update session with QR code data
    const { error: updateError } = await supabase
      .from('attendance_sessions')
      .update({
        qr_code: qrData,
        qr_code_image: qrCodeDataURL,
        qr_expiry: expiryTime.toISOString(),
        location_required,
        required_latitude: location_required ? required_latitude : null,
        required_longitude: location_required ? required_longitude : null,
        location_radius: location_required ? location_radius : null,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', session_id)

    if (updateError) {
      throw new Error(`Failed to update session: ${updateError.message}`)
    }

    // Log QR generation activity
    await supabase
      .from('audit_logs')
      .insert({
        user_id: faculty_id,
        action: 'QR_CODE_GENERATED',
        table_name: 'attendance_sessions',
        record_id: session_id,
        new_values: {
          qr_expiry: expiryTime.toISOString(),
          location_required,
          location_radius
        },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      })

    const response: QRResponse = {
      success: true,
      qr_code: qrCodeDataURL,
      qr_data: qrData,
      expiry_time: expiryTime.toISOString()
    }

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('QR Generation Error:', error)
    
    const errorResponse: QRResponse = {
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
