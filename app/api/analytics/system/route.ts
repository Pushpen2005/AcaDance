import { NextRequest, NextResponse } from 'next/server';
import { academicIntegration } from '@/lib/integration';
import { createApiResponse, handleApiError } from '@/lib/performance';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    const result = await academicIntegration.getSystemAnalytics(
      start_date || undefined,
      end_date || undefined
    );

    return NextResponse.json(
      createApiResponse(true, result, undefined, 'System analytics retrieved'),
      { status: 200 }
    );

  } catch (error) {
    console.error('Get system analytics error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
}
