import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case "POST":
      return handleCreateSession(req, res);
    case "PUT":
      return handleMarkAttendance(req, res);
    case "GET":
      return handleGetSessions(req, res);
    default:
      res.setHeader("Allow", ["POST", "PUT", "GET"]);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

// Create new attendance session (Faculty/Admin)
async function handleCreateSession(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      class_id,
      faculty_id,
      location_lat,
      location_lng,
      geofence_radius = 50,
      expiry_minutes = 5
    } = req.body;

    const session_id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiry_time = new Date(Date.now() + expiry_minutes * 60 * 1000);

    const sessionData = {
      class_id,
      faculty_id,
      session_id,
      qr_code: Buffer.from(session_id).toString('base64'),
      expiry_time: expiry_time.toISOString(),
      location_lat,
      location_lng,
      geofence_radius,
      is_active: true
    };

    const { data, error } = await supabase
      .from('attendance_sessions')
      .insert([sessionData])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      session: data,
      message: "Attendance session created successfully"
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Mark attendance (Student)
async function handleMarkAttendance(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      session_id,
      student_id,
      device_fingerprint,
      gps_lat,
      gps_lng,
      scanned_qr_data
    } = req.body;

    // Verify QR code
    const decoded_session_id = Buffer.from(scanned_qr_data, 'base64').toString();
    if (decoded_session_id !== session_id) {
      return res.status(400).json({
        success: false,
        error: "Invalid QR code"
      });
    }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('session_id', session_id)
      .eq('is_active', true)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        error: "Session not found or expired"
      });
    }

    // Check if session is still valid
    if (new Date() > new Date(session.expiry_time)) {
      return res.status(400).json({
        success: false,
        error: "QR code has expired"
      });
    }

    // Check geofence if location is set
    if (session.location_lat && session.location_lng && gps_lat && gps_lng) {
      const distance = calculateDistance(
        gps_lat, gps_lng,
        session.location_lat, session.location_lng
      );
      
      if (distance > session.geofence_radius) {
        return res.status(400).json({
          success: false,
          error: "You must be in the classroom to mark attendance"
        });
      }
    }

    // Check for duplicate attendance
    const { data: existingRecord } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('session_id', session.id)
      .eq('student_id', student_id)
      .single();

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        error: "Attendance already marked for this session"
      });
    }

    // Mark attendance
    const attendanceData = {
      session_id: session.id,
      student_id,
      status: 'present',
      device_fingerprint,
      gps_lat,
      gps_lng,
      ip_address: req.socket.remoteAddress || req.headers['x-forwarded-for'] || req.headers['x-real-ip']
    };

    const { data: attendanceRecord, error: attendanceError } = await supabase
      .from('attendance_records')
      .insert([attendanceData])
      .select()
      .single();

    if (attendanceError) throw attendanceError;

    // Log the action
    await supabase
      .from('audit_logs')
      .insert([{
        user_id: student_id,
        action: 'attendance_scan',
        details: { 
          session_id: session.id, 
          class_id: session.class_id,
          location: { lat: gps_lat, lng: gps_lng }
        },
        ip_address: req.socket.remoteAddress,
        user_agent: req.headers['user-agent']
      }]);

    return res.status(200).json({
      success: true,
      attendance: attendanceRecord,
      message: "Attendance marked successfully"
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Get active sessions (Faculty/Admin)
async function handleGetSessions(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { faculty_id, include_records } = req.query;

    let query = supabase
      .from('attendance_sessions')
      .select('*')
      .eq('is_active', true);

    if (faculty_id) {
      query = query.eq('faculty_id', faculty_id);
    }

    const { data: sessions, error } = await query;

    if (error) throw error;

    // Include attendance records if requested
    if (include_records === 'true' && sessions) {
      for (const session of sessions) {
        const { data: records } = await supabase
          .from('attendance_records')
          .select(`
            *,
            profiles:student_id (full_name, department)
          `)
          .eq('session_id', session.id);
        
        session.attendance_records = records || [];
      }
    }

    return res.status(200).json({
      success: true,
      sessions,
      count: sessions?.length || 0
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // Distance in meters
}
