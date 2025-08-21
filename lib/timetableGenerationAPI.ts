// Timetable Generation API Service
// Integrates with external timetable generation service using the provided API key

import { supabase } from './supabaseClient';

// Types for timetable generation
export interface TimetableGenerationRequest {
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

export interface TimetableGenerationResponse {
  success: boolean;
  timetable: any[];
  conflicts: string[];
  optimizationScore: number;
  generationTime: number;
  metadata: {
    algorithm_used: string;
    iterations: number;
    satisfaction_rate: number;
  };
}

class TimetableGenerationService {
  private apiKey: string;
  private apiEndpoint: string;

  constructor() {
    this.apiKey = process.env.TIMETABLE_GENERATION_API_KEY || '';
    this.apiEndpoint = process.env.NEXT_PUBLIC_TIMETABLE_API_ENDPOINT || 'https://api.timetablemaker.com/v1';
    
    if (!this.apiKey) {
      console.warn('Timetable Generation API key not found. Using fallback local generation.');
    }
  }

  /**
   * Generate timetable using external API service
   */
  async generateTimetable(request: TimetableGenerationRequest): Promise<TimetableGenerationResponse> {
    try {
      // If API key is not available, use local generation
      if (!this.apiKey) {
        return await this.fallbackLocalGeneration(request);
      }

      const response = await fetch(`${this.apiEndpoint}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify({
          ...request,
          client_id: 'academic-system',
          version: '1.0'
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Store generation metadata in Supabase
      await this.saveGenerationMetadata(result);
      
      return result;
    } catch (error) {
      console.error('External API generation failed:', error);
      // Fallback to local generation
      return await this.fallbackLocalGeneration(request);
    }
  }

  /**
   * Optimize existing timetable using API service
   */
  async optimizeTimetable(timetableId: string, optimizationGoals: string[]): Promise<TimetableGenerationResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('API key required for optimization');
      }

      // Fetch current timetable
      const { data: currentTimetable } = await supabase
        .from('timetable_entries')
        .select('*')
        .eq('timetable_id', timetableId);

      const response = await fetch(`${this.apiEndpoint}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify({
          current_timetable: currentTimetable,
          optimization_goals: optimizationGoals,
          client_id: 'academic-system'
        })
      });

      if (!response.ok) {
        throw new Error(`Optimization failed: ${response.status}`);
      }

      const result = await response.json();
      await this.saveGenerationMetadata(result);
      
      return result;
    } catch (error) {
      console.error('Timetable optimization failed:', error);
      throw error;
    }
  }

  /**
   * Validate timetable conflicts using API service
   */
  async validateTimetable(timetableData: any[]): Promise<{
    isValid: boolean;
    conflicts: string[];
    suggestions: string[];
  }> {
    try {
      if (!this.apiKey) {
        return await this.localValidation(timetableData);
      }

      const response = await fetch(`${this.apiEndpoint}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify({
          timetable: timetableData,
          client_id: 'academic-system'
        })
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Timetable validation failed:', error);
      return await this.localValidation(timetableData);
    }
  }

  /**
   * Get generation statistics from API
   */
  async getGenerationStats(): Promise<{
    total_generations: number;
    success_rate: number;
    average_optimization_score: number;
    popular_algorithms: string[];
  }> {
    try {
      if (!this.apiKey) {
        return await this.getLocalStats();
      }

      const response = await fetch(`${this.apiEndpoint}/stats`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Stats request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch generation stats:', error);
      return await this.getLocalStats();
    }
  }

  /**
   * Fallback local generation when API is not available
   */
  private async fallbackLocalGeneration(request: TimetableGenerationRequest): Promise<TimetableGenerationResponse> {
    console.log('Using local timetable generation fallback...');
    
    const startTime = Date.now();
    const generatedTimetable: any[] = [];
    const conflicts: string[] = [];

    // Simple local algorithm
    for (const subject of request.subjects) {
      for (let session = 0; session < subject.sessions_per_week; session++) {
        const availableSlot = this.findAvailableSlot(
          subject,
          request.faculty,
          request.rooms,
          request.timeSlots,
          generatedTimetable
        );

        if (availableSlot) {
          generatedTimetable.push({
            subject_id: subject.id,
            faculty_id: availableSlot.faculty_id,
            room_id: availableSlot.room_id,
            time_slot_id: availableSlot.time_slot_id,
            batch: `${subject.department}_SEM${subject.semester}`,
            semester: subject.semester,
            department: subject.department,
            week_type: 'both',
            session_type: subject.type
          });
        } else {
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

  /**
   * Find available time slot for a subject
   */
  private findAvailableSlot(
    subject: any,
    faculty: any[],
    rooms: any[],
    timeSlots: any[],
    existingTimetable: any[]
  ): any | null {
    const suitableFaculty = faculty.filter(f => 
      f.department === subject.department ||
      f.specialization?.includes(subject.name)
    );

    const suitableRooms = rooms.filter(r => 
      r.type === subject.type || 
      (subject.type === 'lecture' && r.type === 'classroom') ||
      (subject.type === 'lab' && r.type === 'lab')
    );

    for (const slot of timeSlots) {
      for (const facultyMember of suitableFaculty) {
        for (const room of suitableRooms) {
          // Check if slot is available
          const conflict = existingTimetable.find(entry =>
            entry.time_slot_id === slot.id &&
            (entry.faculty_id === facultyMember.id || entry.room_id === room.id)
          );

          if (!conflict) {
            return {
              faculty_id: facultyMember.id,
              room_id: room.id,
              time_slot_id: slot.id
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Local validation fallback
   */
  private async localValidation(timetableData: any[]): Promise<{
    isValid: boolean;
    conflicts: string[];
    suggestions: string[];
  }> {
    const conflicts: string[] = [];
    const suggestions: string[] = [];

    // Check for time conflicts
    const timeMap = new Map();
    
    for (const entry of timetableData) {
      const key = `${entry.time_slot_id}_${entry.faculty_id}`;
      if (timeMap.has(key)) {
        conflicts.push(`Faculty conflict at ${entry.time_slot_id}`);
      } else {
        timeMap.set(key, entry);
      }

      const roomKey = `${entry.time_slot_id}_${entry.room_id}`;
      if (timeMap.has(roomKey)) {
        conflicts.push(`Room conflict at ${entry.time_slot_id}`);
      } else {
        timeMap.set(roomKey, entry);
      }
    }

    if (conflicts.length > 0) {
      suggestions.push('Consider rescheduling conflicting sessions');
      suggestions.push('Use room allocation optimization');
    }

    return {
      isValid: conflicts.length === 0,
      conflicts,
      suggestions
    };
  }

  /**
   * Save generation metadata to Supabase
   */
  private async saveGenerationMetadata(result: TimetableGenerationResponse): Promise<void> {
    try {
      await supabase.from('timetable_generation_logs').insert({
        generation_time: result.generationTime,
        optimization_score: result.optimizationScore,
        algorithm_used: result.metadata.algorithm_used,
        conflicts_count: result.conflicts.length,
        success: result.success,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to save generation metadata:', error);
    }
  }

  /**
   * Get local stats fallback
   */
  private async getLocalStats(): Promise<{
    total_generations: number;
    success_rate: number;
    average_optimization_score: number;
    popular_algorithms: string[];
  }> {
    try {
      const { data: logs } = await supabase
        .from('timetable_generation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      const totalGenerations = logs?.length || 0;
      const successfulGenerations = logs?.filter(log => log.success).length || 0;
      const averageScore = logs?.reduce((sum, log) => sum + (log.optimization_score || 0), 0) / totalGenerations || 0;

      return {
        total_generations: totalGenerations,
        success_rate: totalGenerations > 0 ? successfulGenerations / totalGenerations : 0,
        average_optimization_score: averageScore,
        popular_algorithms: ['local_fallback', 'genetic', 'ai_optimized']
      };
    } catch (error) {
      console.error('Failed to get local stats:', error);
      return {
        total_generations: 0,
        success_rate: 0,
        average_optimization_score: 0,
        popular_algorithms: []
      };
    }
  }
}

// Export singleton instance
export const timetableGenerationService = new TimetableGenerationService();

// Export utility functions
export const generateTimetableWithAPI = async (
  subjects: any[],
  faculty: any[],
  rooms: any[],
  constraints: any[],
  timeSlots: any[],
  preferences?: any
): Promise<TimetableGenerationResponse> => {
  return await timetableGenerationService.generateTimetable({
    subjects,
    faculty,
    rooms,
    constraints,
    timeSlots,
    preferences
  });
};

export const optimizeTimetableWithAPI = async (
  timetableId: string,
  goals: string[]
): Promise<TimetableGenerationResponse> => {
  return await timetableGenerationService.optimizeTimetable(timetableId, goals);
};

export const validateTimetableWithAPI = async (timetableData: any[]) => {
  return await timetableGenerationService.validateTimetable(timetableData);
};
