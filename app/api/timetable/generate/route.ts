// API Route for Timetable Generation with External API Integration
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TimetableGenerationRequest {
  subjects: any[];
  faculty: any[];
  rooms: any[];
  constraints: any[];
  timeSlots: any[];
  preferences?: {
    algorithm: 'genetic' | 'backtracking' | 'ai_optimized';
    maxIterations: number;
    prioritizeConstraints: boolean;
    balanceWorkload: boolean;
  };
}

async function generateWithExternalAPI(request: TimetableGenerationRequest) {
  const apiKey = process.env.TIMETABLE_GENERATION_API_KEY;
  const apiEndpoint = process.env.NEXT_PUBLIC_TIMETABLE_API_ENDPOINT || 'https://api.timetablemaker.com/v1';

  if (!apiKey) {
    throw new Error('Timetable API key not configured');
  }

  const response = await fetch(`${apiEndpoint}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-API-Key': apiKey
    },
    body: JSON.stringify({
      ...request,
      client_id: 'academic-system',
      version: '1.0'
    })
  });

  if (!response.ok) {
    throw new Error(`External API failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

async function fallbackLocalGeneration(request: TimetableGenerationRequest) {
  const { subjects, faculty, rooms, timeSlots } = request;
  const generatedTimetable: any[] = [];
  const conflicts: string[] = [];
  
  const startTime = Date.now();

  for (const subject of subjects) {
    for (let session = 0; session < subject.sessions_per_week; session++) {
      // Find suitable faculty
      const suitableFaculty = faculty.filter(f => 
        f.department === subject.department ||
        f.specialization?.includes(subject.name)
      );

      // Find suitable rooms
      const suitableRooms = rooms.filter(r => 
        r.type === subject.type || 
        (subject.type === 'lecture' && r.type === 'classroom') ||
        (subject.type === 'lab' && r.type === 'lab')
      );

      // Find available time slot
      let scheduled = false;
      for (const slot of timeSlots) {
        for (const facultyMember of suitableFaculty) {
          for (const room of suitableRooms) {
            // Check for conflicts
            const hasConflict = generatedTimetable.some(entry =>
              entry.time_slot_id === slot.id &&
              (entry.faculty_id === facultyMember.id || entry.room_id === room.id)
            );

            if (!hasConflict) {
              generatedTimetable.push({
                subject_id: subject.id,
                faculty_id: facultyMember.id,
                room_id: room.id,
                time_slot_id: slot.id,
                batch: `${subject.department}_SEM${subject.semester}`,
                semester: subject.semester,
                department: subject.department,
                week_type: 'both',
                session_type: subject.type === 'seminar' ? 'lecture' : subject.type
              });
              scheduled = true;
              break;
            }
          }
          if (scheduled) break;
        }
        if (scheduled) break;
      }

      if (!scheduled) {
        conflicts.push(`Could not schedule ${subject.name} session ${session + 1}`);
      }
    }
  }

  const generationTime = Date.now() - startTime;
  const optimizationScore = Math.max(0, 100 - (conflicts.length * 10));

  return {
    success: true,
    timetable: generatedTimetable,
    conflicts,
    optimizationScore,
    generationTime,
    metadata: {
      algorithm_used: 'local_fallback',
      iterations: 1,
      satisfaction_rate: optimizationScore / 100
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: TimetableGenerationRequest = await request.json();

    // Validate request
    if (!body.subjects || !body.faculty || !body.rooms || !body.timeSlots) {
      return NextResponse.json(
        { error: 'Missing required data: subjects, faculty, rooms, or timeSlots' },
        { status: 400 }
      );
    }

    let result;

    try {
      // Try external API first
      result = await generateWithExternalAPI(body);
      console.log('✅ External API generation successful');
    } catch (apiError) {
      console.warn('External API failed, using fallback:', apiError);
      // Fallback to local generation
      result = await fallbackLocalGeneration(body);
    }

    // Log generation attempt
    try {
      await supabase.from('timetable_generation_logs').insert({
        generation_time: result.generationTime,
        optimization_score: result.optimizationScore,
        algorithm_used: result.metadata.algorithm_used,
        conflicts_count: result.conflicts.length,
        success: result.success,
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.warn('Failed to log generation attempt:', logError);
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Timetable generation error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'stats') {
      // Get generation statistics
      const { data: logs } = await supabase
        .from('timetable_generation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      const totalGenerations = logs?.length || 0;
      const successfulGenerations = logs?.filter(log => log.success).length || 0;
      const averageScore = logs?.reduce((sum, log) => sum + (log.optimization_score || 0), 0) / totalGenerations || 0;

      const stats = {
        total_generations: totalGenerations,
        success_rate: totalGenerations > 0 ? successfulGenerations / totalGenerations : 0,
        average_optimization_score: averageScore,
        popular_algorithms: ['ai_optimized', 'genetic', 'local_fallback'],
        recent_generations: logs?.slice(0, 10) || []
      };

      return NextResponse.json(stats);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Stats retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve statistics' },
      { status: 500 }
    );
  }
}
