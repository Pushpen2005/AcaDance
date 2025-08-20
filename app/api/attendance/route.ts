import { NextRequest, NextResponse } from 'next/server';
import { academicIntegration } from '@/lib/integration';
import { createApiResponse, handleApiError } from '@/lib/performance';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qr_code, user_id, location } = body;

    if (!qr_code || !user_id) {
      return NextResponse.json(
        createApiResponse(false, undefined, 'Missing required fields: qr_code, user_id'),
        { status: 400 }
      );
    }

    const result = await academicIntegration.validateQRAndMarkAttendance({
      qr_code,
      user_id,
      location,
    });

    return NextResponse.json(
      createApiResponse(true, result, undefined, 'Attendance marked successfully'),
      { status: 200 }
    );

  } catch (error) {
    console.error('Validate attendance error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const course_id = searchParams.get('course_id');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    const result = await academicIntegration.getAttendanceAnalytics({
      user_id: user_id || undefined,
      course_id: course_id || undefined,
      start_date: start_date || undefined,
      end_date: end_date || undefined,
    });

    return NextResponse.json(
      createApiResponse(true, result, undefined, 'Attendance analytics retrieved'),
      { status: 200 }
    );

  } catch (error) {
    console.error('Get attendance analytics error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
}
