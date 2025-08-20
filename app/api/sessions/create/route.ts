import { NextRequest, NextResponse } from 'next/server';
import { academicIntegration } from '@/lib/integration';
import { createApiResponse, handleApiError } from '@/lib/performance';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { course_id, faculty_id, scheduled_date, duration_minutes, location, qr_expires_minutes } = body;

    if (!course_id || !faculty_id || !scheduled_date) {
      return NextResponse.json(
        createApiResponse(false, undefined, 'Missing required fields: course_id, faculty_id, scheduled_date'),
        { status: 400 }
      );
    }

    const result = await academicIntegration.createSessionWithQR({
      course_id,
      faculty_id,
      scheduled_date,
      duration_minutes,
      location,
      qr_expires_minutes,
    });

    return NextResponse.json(
      createApiResponse(true, result, undefined, 'Session created with QR code'),
      { status: 201 }
    );

  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
}
