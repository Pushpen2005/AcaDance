import { NextRequest, NextResponse } from 'next/server';
import { advancedSupabase } from '@/lib/advancedSupabase';

// Mark student attendance (Faculty/Admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, date = new Date().toISOString().split('T')[0], status = 'present' } = body;

    if (!student_id) {
      return NextResponse.json(
        { success: false, message: 'Missing required field: student_id' },
        { status: 400 }
      );
    }

    // Check if attendance already exists for this student and date
    const { data: existingAttendance } = await advancedSupabase.getClient()
      .from('attendance')
      .select('*')
      .eq('student_id', student_id)
      .eq('date', date)
      .single();

    if (existingAttendance) {
      // Update existing attendance
      const { data, error } = await advancedSupabase.getClient()
        .from('attendance')
        .update({ status })
        .eq('id', existingAttendance.id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data,
        message: 'Attendance updated successfully'
      });
    } else {
      // Create new attendance record
      const { data, error } = await advancedSupabase.getClient()
        .from('attendance')
        .insert([{ student_id, date, status }])
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data,
        message: 'Attendance marked successfully'
      });
    }

  } catch (error) {
    console.error('Mark attendance error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to mark attendance' 
      },
      { status: 500 }
    );
  }
}

// Get attendance records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const student_id = searchParams.get('student_id');
    const date = searchParams.get('date');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    let query = advancedSupabase.getClient()
      .from('attendance')
      .select(`
        *,
        students:student_id (
          id,
          name,
          email,
          department
        )
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (student_id) {
      query = query.eq('student_id', student_id);
    }

    if (date) {
      query = query.eq('date', date);
    }

    if (start_date && end_date) {
      query = query.gte('date', start_date).lte('date', end_date);
    } else if (start_date) {
      query = query.gte('date', start_date);
    } else if (end_date) {
      query = query.lte('date', end_date);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate statistics if student_id is provided
    let statistics = null;
    if (student_id && data) {
      const totalDays = data.length;
      const presentDays = data.filter(record => record.status === 'present').length;
      const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      statistics = {
        total_days: totalDays,
        present_days: presentDays,
        absent_days: totalDays - presentDays,
        attendance_percentage: attendancePercentage
      };
    }

    return NextResponse.json({
      success: true,
      data,
      statistics,
      message: 'Attendance records retrieved successfully'
    });

  } catch (error) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to get attendance records' 
      },
      { status: 500 }
    );
  }
}
