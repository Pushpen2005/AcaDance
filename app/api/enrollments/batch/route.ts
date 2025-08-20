import { NextRequest, NextResponse } from 'next/server';
import { academicIntegration } from '@/lib/integration';
import { createApiResponse, handleApiError } from '@/lib/performance';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { course_id, student_ids, enrolled_by } = body;

    if (!course_id || !student_ids || !Array.isArray(student_ids) || !enrolled_by) {
      return NextResponse.json(
        createApiResponse(false, undefined, 'Missing required fields: course_id, student_ids (array), enrolled_by'),
        { status: 400 }
      );
    }

    const result = await academicIntegration.batchEnrollStudents(
      course_id,
      student_ids,
      enrolled_by
    );

    return NextResponse.json(
      createApiResponse(true, result, undefined, 'Batch enrollment completed'),
      { status: 200 }
    );

  } catch (error) {
    console.error('Batch enrollment error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
}
