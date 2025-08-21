import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, studentId, qrPayload, deviceFingerprint, ipAddress, userAgent } = body;

    // Validate required fields
    if (!sessionId || !studentId || !qrPayload) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate QR code
    const qrData = JSON.parse(qrPayload);
    
    // Check if QR code is expired
    if (Date.now() > qrData.expiry) {
      return NextResponse.json(
        { error: 'QR code has expired' },
        { status: 400 }
      );
    }

    // Validate QR code secret
    const expectedSecret = btoa(`${sessionId}-${qrData.timestamp}-${process.env.NEXT_PUBLIC_QR_SECRET}`);
    if (qrData.secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Invalid QR code' },
        { status: 400 }
      );
    }

    // Check if session exists and is active
    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('session_status', 'active')
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found or not active' },
        { status: 404 }
      );
    }

    // Check if attendance already marked
    const { data: existingRecord } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
      .single();

    if (existingRecord) {
      return NextResponse.json(
        { error: 'Attendance already marked for this session' },
        { status: 409 }
      );
    }

    // Check for suspicious activity (multiple scans from same device)
    const { data: recentScans } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('device_id', deviceFingerprint)
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Last 5 minutes

    const isSuspicious = recentScans && recentScans.length > 3;

    // Mark attendance
    const { data: attendanceRecord, error: attendanceError } = await supabase
      .from('attendance_records')
      .insert({
        session_id: sessionId,
        student_id: studentId,
        status: 'present',
        scan_method: 'qr_scan',
        device_id: deviceFingerprint,
        ip_address: ipAddress,
        user_agent: userAgent,
        is_suspicious: isSuspicious,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (attendanceError) {
      return NextResponse.json(
        { error: 'Failed to mark attendance' },
        { status: 500 }
      );
    }

    // Update session statistics
    const { data: attendanceCount } = await supabase
      .from('attendance_records')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('status', 'present');

    const totalPresent = (attendanceCount as any)?.count || 0;
    const attendancePercentage = session.total_enrolled > 0 
      ? Math.round((totalPresent / session.total_enrolled) * 100)
      : 0;

    await supabase
      .from('attendance_sessions')
      .update({
        total_present: totalPresent,
        attendance_percentage: attendancePercentage,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    // Log audit trail
    await supabase
      .from('audit_logs')
      .insert({
        user_id: studentId,
        action: 'mark_attendance',
        table_name: 'attendance_records',
        record_id: attendanceRecord.id,
        new_data: { sessionId, status: 'present' },
        ip_address: ipAddress,
        user_agent: userAgent,
        device_id: deviceFingerprint,
        timestamp: new Date().toISOString()
      });

    // Send notification if suspicious activity detected
    if (isSuspicious) {
      await supabase
        .from('alerts')
        .insert({
          user_id: session.faculty_id,
          type: 'suspicious_activity',
          title: 'Suspicious Attendance Activity',
          message: `Multiple rapid scans detected from device ${deviceFingerprint.substring(0, 8)}...`,
          priority: 'high',
          data: { sessionId, studentId, deviceFingerprint },
          created_at: new Date().toISOString()
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      attendanceRecord: {
        id: attendanceRecord.id,
        status: attendanceRecord.status,
        timestamp: attendanceRecord.timestamp,
        isSuspicious
      }
    });

  } catch (error) {
    console.error('Attendance marking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const studentId = searchParams.get('studentId');

  if (!sessionId || !studentId) {
    return NextResponse.json(
      { error: 'Missing sessionId or studentId' },
      { status: 400 }
    );
  }

  try {
    // Check attendance status
    const { data: record, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }

    return NextResponse.json({
      isMarked: !!record,
      record: record || null
    });

  } catch (error) {
    console.error('Attendance check error:', error);
    return NextResponse.json(
      { error: 'Failed to check attendance status' },
      { status: 500 }
    );
  }
}
