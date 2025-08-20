import { NextRequest, NextResponse } from 'next/server';
import { academicIntegration } from '@/lib/integration';
import { createApiResponse, handleApiError } from '@/lib/performance';

export async function POST(request: NextRequest) {
  try {
    console.log('Initializing Academic System...');
    
    const result = await academicIntegration.initialize();
    
    if (result.success) {
      return NextResponse.json(
        createApiResponse(true, result.results, undefined, 'Academic System initialized successfully'),
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        createApiResponse(false, undefined, result.results.error, 'Failed to initialize Academic System'),
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('System initialization error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const health = await academicIntegration.healthCheck();
    
    const status = health.database && health.cache && health.functions ? 200 : 503;
    
    return NextResponse.json(
      createApiResponse(status === 200, health, undefined, 'Health check completed'),
      { status }
    );

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    );
  }
}
