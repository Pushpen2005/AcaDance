import { optimizedSupabase } from './performance';
import { cacheManager } from './cache';
import { dbOptimizer } from './database-optimizer';
import { NotificationUtils } from './notifications';

// Integration service to connect all backend systems
export class AcademicSystemIntegration {
  private client = optimizedSupabase.getClient();

  // Initialize all systems
  async initialize(): Promise<{ success: boolean; results: any }> {
    try {
      console.log('Initializing Academic System...');
      
      const results = {
        databaseOptimized: false,
        cacheInitialized: false,
        rpcFunctionsDeployed: false,
        triggersSetup: false,
        error: null as any,
      };

      // 1. Optimize database
      const dbResult = await dbOptimizer.runFullOptimization();
      results.databaseOptimized = dbResult.success;

      // 2. Initialize cache
      cacheManager.clear(); // Start with clean cache
      results.cacheInitialized = true;

      // 3. Deploy RPC functions
      await this.deployRPCFunctions();
      results.rpcFunctionsDeployed = true;

      // 4. Setup database triggers
      await this.setupIntegrationTriggers();
      results.triggersSetup = true;

      console.log('Academic System initialized successfully');
      return { success: true, results };

    } catch (error) {
      console.error('Failed to initialize Academic System:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, results: { error: errorMessage } };
    }
  }

  // Deploy custom RPC functions for complex operations
  async deployRPCFunctions(): Promise<void> {
    const functions = [
      // Attendance calculation function
      `
      CREATE OR REPLACE FUNCTION calculate_attendance_percentage(
        p_user_id UUID,
        p_course_id UUID DEFAULT NULL,
        p_start_date DATE DEFAULT NULL,
        p_end_date DATE DEFAULT NULL
      )
      RETURNS TABLE(
        course_id UUID,
        course_name TEXT,
        total_sessions BIGINT,
        present_count BIGINT,
        late_count BIGINT,
        absent_count BIGINT,
        attendance_percentage NUMERIC
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          c.id as course_id,
          c.name as course_name,
          COUNT(s.id) as total_sessions,
          COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
          COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
          COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
          ROUND(
            COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END) * 100.0 / 
            NULLIF(COUNT(s.id), 0), 2
          ) as attendance_percentage
        FROM courses c
        LEFT JOIN sessions s ON c.id = s.course_id
        LEFT JOIN attendance a ON s.id = a.session_id AND a.user_id = p_user_id
        LEFT JOIN enrollments e ON c.id = e.course_id AND e.student_id = p_user_id
        WHERE e.is_active = true
          AND (p_course_id IS NULL OR c.id = p_course_id)
          AND (p_start_date IS NULL OR s.scheduled_date >= p_start_date)
          AND (p_end_date IS NULL OR s.scheduled_date <= p_end_date)
        GROUP BY c.id, c.name
        ORDER BY c.name;
      END;
      $$ LANGUAGE plpgsql;
      `,

      // Session management function
      `
      CREATE OR REPLACE FUNCTION create_session_with_qr(
        p_course_id UUID,
        p_faculty_id UUID,
        p_scheduled_date TIMESTAMP,
        p_duration_minutes INTEGER DEFAULT 60,
        p_location TEXT DEFAULT NULL,
        p_qr_expires_minutes INTEGER DEFAULT 30
      )
      RETURNS TABLE(
        session_id UUID,
        qr_code TEXT,
        qr_expires_at TIMESTAMP
      ) AS $$
      DECLARE
        v_session_id UUID;
        v_qr_code TEXT;
        v_qr_expires_at TIMESTAMP;
      BEGIN
        -- Create session
        INSERT INTO sessions (course_id, faculty_id, scheduled_date, duration_minutes, location, is_active)
        VALUES (p_course_id, p_faculty_id, p_scheduled_date, p_duration_minutes, p_location, true)
        RETURNING id INTO v_session_id;

        -- Generate QR code
        v_qr_code := 'QR_' || v_session_id || '_' || EXTRACT(EPOCH FROM NOW());
        v_qr_expires_at := NOW() + (p_qr_expires_minutes || ' minutes')::INTERVAL;

        -- Update session with QR code
        UPDATE sessions 
        SET qr_code = v_qr_code, qr_expires_at = v_qr_expires_at
        WHERE id = v_session_id;

        -- Log action
        INSERT INTO audit_logs (user_id, action, table_name, record_id, details)
        VALUES (p_faculty_id, 'CREATE_SESSION', 'sessions', v_session_id, 
                json_build_object('qr_code', v_qr_code, 'expires_at', v_qr_expires_at));

        RETURN QUERY SELECT v_session_id, v_qr_code, v_qr_expires_at;
      END;
      $$ LANGUAGE plpgsql;
      `,

      // Batch enrollment function
      `
      CREATE OR REPLACE FUNCTION batch_enroll_students(
        p_course_id UUID,
        p_student_ids UUID[],
        p_enrolled_by UUID
      )
      RETURNS TABLE(
        student_id UUID,
        success BOOLEAN,
        message TEXT
      ) AS $$
      DECLARE
        v_student_id UUID;
        v_count INTEGER := 0;
      BEGIN
        FOREACH v_student_id IN ARRAY p_student_ids
        LOOP
          BEGIN
            -- Check if already enrolled
            IF EXISTS (SELECT 1 FROM enrollments WHERE student_id = v_student_id AND course_id = p_course_id AND is_active = true) THEN
              RETURN QUERY SELECT v_student_id, false, 'Already enrolled';
            ELSE
              -- Enroll student
              INSERT INTO enrollments (student_id, course_id, enrolled_by, is_active)
              VALUES (v_student_id, p_course_id, p_enrolled_by, true);
              
              v_count := v_count + 1;
              RETURN QUERY SELECT v_student_id, true, 'Enrolled successfully';
            END IF;
          EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT v_student_id, false, SQLERRM;
          END;
        END LOOP;

        -- Log batch enrollment
        INSERT INTO audit_logs (user_id, action, table_name, details)
        VALUES (p_enrolled_by, 'BATCH_ENROLL', 'enrollments', 
                json_build_object('course_id', p_course_id, 'students_enrolled', v_count));
      END;
      $$ LANGUAGE plpgsql;
      `,

      // Analytics aggregation function
      `
      CREATE OR REPLACE FUNCTION get_system_analytics(
        p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
        p_end_date DATE DEFAULT CURRENT_DATE
      )
      RETURNS JSON AS $$
      DECLARE
        v_result JSON;
      BEGIN
        SELECT json_build_object(
          'period', json_build_object(
            'start_date', p_start_date,
            'end_date', p_end_date
          ),
          'users', json_build_object(
            'total', (SELECT COUNT(*) FROM users WHERE created_at BETWEEN p_start_date AND p_end_date + INTERVAL '1 day'),
            'students', (SELECT COUNT(*) FROM users WHERE role = 'student' AND created_at BETWEEN p_start_date AND p_end_date + INTERVAL '1 day'),
            'faculty', (SELECT COUNT(*) FROM users WHERE role = 'faculty' AND created_at BETWEEN p_start_date AND p_end_date + INTERVAL '1 day'),
            'active', (SELECT COUNT(*) FROM users WHERE is_active = true)
          ),
          'attendance', json_build_object(
            'total_records', (SELECT COUNT(*) FROM attendance WHERE created_at BETWEEN p_start_date AND p_end_date + INTERVAL '1 day'),
            'present', (SELECT COUNT(*) FROM attendance WHERE status = 'present' AND created_at BETWEEN p_start_date AND p_end_date + INTERVAL '1 day'),
            'late', (SELECT COUNT(*) FROM attendance WHERE status = 'late' AND created_at BETWEEN p_start_date AND p_end_date + INTERVAL '1 day'),
            'absent', (SELECT COUNT(*) FROM attendance WHERE status = 'absent' AND created_at BETWEEN p_start_date AND p_end_date + INTERVAL '1 day'),
            'average_percentage', (
              SELECT ROUND(AVG(
                CASE 
                  WHEN total_sessions > 0 THEN (present_sessions * 100.0 / total_sessions)
                  ELSE 0 
                END
              ), 2)
              FROM (
                SELECT 
                  COUNT(*) as total_sessions,
                  COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END) as present_sessions
                FROM users u
                LEFT JOIN attendance a ON u.id = a.user_id 
                  AND a.created_at BETWEEN p_start_date AND p_end_date + INTERVAL '1 day'
                WHERE u.role = 'student'
                GROUP BY u.id
              ) sub
            )
          ),
          'sessions', json_build_object(
            'total', (SELECT COUNT(*) FROM sessions WHERE scheduled_date BETWEEN p_start_date AND p_end_date + INTERVAL '1 day'),
            'completed', (SELECT COUNT(*) FROM sessions WHERE scheduled_date BETWEEN p_start_date AND p_end_date + INTERVAL '1 day' AND scheduled_date < NOW()),
            'upcoming', (SELECT COUNT(*) FROM sessions WHERE scheduled_date > NOW()),
            'active', (SELECT COUNT(*) FROM sessions WHERE is_active = true)
          ),
          'courses', json_build_object(
            'total', (SELECT COUNT(*) FROM courses),
            'active', (SELECT COUNT(*) FROM courses WHERE is_active = true),
            'enrollments', (SELECT COUNT(*) FROM enrollments WHERE is_active = true)
          )
        ) INTO v_result;

        RETURN v_result;
      END;
      $$ LANGUAGE plpgsql;
      `,
    ];

    for (const func of functions) {
      try {
        await this.client.rpc('execute_sql', { query: func });
        console.log('RPC function deployed successfully');
      } catch (error) {
        console.warn('RPC function deployment warning:', error);
      }
    }
  }

  // Setup integration triggers for real-time updates
  async setupIntegrationTriggers(): Promise<void> {
    const triggers = [
      // Attendance trigger for automatic notifications
      `
      CREATE OR REPLACE FUNCTION attendance_notification_trigger()
      RETURNS trigger AS $$
      DECLARE
        v_user users%ROWTYPE;
        v_session sessions%ROWTYPE;
        v_course courses%ROWTYPE;
      BEGIN
        -- Get related data
        SELECT * INTO v_user FROM users WHERE id = NEW.user_id;
        SELECT * INTO v_session FROM sessions WHERE id = NEW.session_id;
        SELECT * INTO v_course FROM courses WHERE id = v_session.course_id;

        -- Send notification for late attendance
        IF NEW.status = 'late' THEN
          INSERT INTO notifications (user_id, type, title, message, priority, data)
          VALUES (
            NEW.user_id,
            'attendance',
            'Late Attendance Recorded',
            'You were marked late for ' || v_course.name || ' class.',
            'normal',
            json_build_object('session_id', NEW.session_id, 'status', 'late')
          );
        END IF;

        -- Check for low attendance and send warning
        PERFORM check_and_send_attendance_warning(NEW.user_id, v_session.course_id);

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS attendance_notification ON attendance;
      CREATE TRIGGER attendance_notification
        AFTER INSERT OR UPDATE ON attendance
        FOR EACH ROW EXECUTE FUNCTION attendance_notification_trigger();
      `,

      // Low attendance warning function
      `
      CREATE OR REPLACE FUNCTION check_and_send_attendance_warning(
        p_user_id UUID,
        p_course_id UUID
      )
      RETURNS VOID AS $$
      DECLARE
        v_attendance_percentage NUMERIC;
        v_course_name TEXT;
      BEGIN
        -- Calculate current attendance percentage
        SELECT attendance_percentage, course_name
        INTO v_attendance_percentage, v_course_name
        FROM calculate_attendance_percentage(p_user_id, p_course_id)
        WHERE course_id = p_course_id;

        -- Send warning if attendance is below 75%
        IF v_attendance_percentage < 75 THEN
          INSERT INTO notifications (user_id, type, title, message, priority, data)
          VALUES (
            p_user_id,
            'attendance',
            'Low Attendance Warning',
            'Your attendance in ' || v_course_name || ' is ' || v_attendance_percentage || '%. Please attend classes regularly.',
            'high',
            json_build_object('course_id', p_course_id, 'attendance_percentage', v_attendance_percentage)
          );
        END IF;
      END;
      $$ LANGUAGE plpgsql;
      `,
    ];

    for (const trigger of triggers) {
      try {
        await this.client.rpc('execute_sql', { query: trigger });
        console.log('Integration trigger setup successfully');
      } catch (error) {
        console.warn('Integration trigger setup warning:', error);
      }
    }
  }

  // QR Code Generation and Session Management
  async createSessionWithQR(sessionData: {
    course_id: string;
    faculty_id: string;
    scheduled_date: string;
    duration_minutes?: number;
    location?: string;
    qr_expires_minutes?: number;
  }): Promise<any> {
    try {
      const { data, error } = await this.client.rpc('create_session_with_qr', {
        p_course_id: sessionData.course_id,
        p_faculty_id: sessionData.faculty_id,
        p_scheduled_date: sessionData.scheduled_date,
        p_duration_minutes: sessionData.duration_minutes || 60,
        p_location: sessionData.location,
        p_qr_expires_minutes: sessionData.qr_expires_minutes || 30,
      });

      if (error) throw error;

      // Invalidate relevant caches
      cacheManager.invalidateByTags(['sessions', `course_${sessionData.course_id}`]);

      return data[0];
    } catch (error) {
      console.error('Failed to create session with QR:', error);
      throw error;
    }
  }

  // Validate QR Code and Mark Attendance
  async validateQRAndMarkAttendance(qrData: {
    qr_code: string;
    user_id: string;
    location?: { latitude: number; longitude: number };
  }): Promise<any> {
    try {
      // Get session from QR code
      const { data: session, error: sessionError } = await this.client
        .from('sessions')
        .select('*, courses(*)')
        .eq('qr_code', qrData.qr_code)
        .eq('is_active', true)
        .single();

      if (sessionError || !session) {
        throw new Error('Invalid or expired QR code');
      }

      // Check if QR code is expired
      if (new Date() > new Date(session.qr_expires_at)) {
        throw new Error('QR code has expired');
      }

      // Check if student is enrolled
      const { data: enrollment, error: enrollmentError } = await this.client
        .from('enrollments')
        .select('*')
        .eq('student_id', qrData.user_id)
        .eq('course_id', session.course_id)
        .eq('is_active', true)
        .single();

      if (enrollmentError || !enrollment) {
        throw new Error('You are not enrolled in this course');
      }

      // Check if already marked attendance
      const { data: existingAttendance } = await this.client
        .from('attendance')
        .select('*')
        .eq('user_id', qrData.user_id)
        .eq('session_id', session.id)
        .single();

      if (existingAttendance) {
        throw new Error('Attendance already marked for this session');
      }

      // Determine attendance status based on time
      const now = new Date();
      const sessionStart = new Date(session.scheduled_date);
      const lateThreshold = 15; // 15 minutes late threshold
      
      let status = 'present';
      if (now > new Date(sessionStart.getTime() + lateThreshold * 60000)) {
        status = 'late';
      }

      // Mark attendance
      const { data: attendance, error: attendanceError } = await this.client
        .from('attendance')
        .insert([{
          user_id: qrData.user_id,
          session_id: session.id,
          status,
          marked_at: now.toISOString(),
          location: qrData.location,
        }])
        .select()
        .single();

      if (attendanceError) throw attendanceError;

      // Invalidate relevant caches
      cacheManager.invalidateByTags(['attendance', `user_${qrData.user_id}`]);

      return {
        success: true,
        attendance,
        session,
        status,
      };

    } catch (error) {
      console.error('Failed to validate QR and mark attendance:', error);
      throw error;
    }
  }

  // Get comprehensive attendance analytics
  async getAttendanceAnalytics(params: {
    user_id?: string;
    course_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any> {
    try {
      const cacheKey = `analytics_${JSON.stringify(params)}`;
      
      // Try cache first
      const cached = cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await this.client.rpc('calculate_attendance_percentage', {
        p_user_id: params.user_id,
        p_course_id: params.course_id,
        p_start_date: params.start_date,
        p_end_date: params.end_date,
      });

      if (error) throw error;

      // Cache the results
      cacheManager.set(cacheKey, data, {
        ttl: 10 * 60 * 1000, // 10 minutes
        tags: ['analytics', 'attendance'],
      });

      return data;

    } catch (error) {
      console.error('Failed to get attendance analytics:', error);
      throw error;
    }
  }

  // Get system-wide analytics
  async getSystemAnalytics(startDate?: string, endDate?: string): Promise<any> {
    try {
      const cacheKey = `system_analytics_${startDate}_${endDate}`;
      
      // Try cache first
      const cached = cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await this.client.rpc('get_system_analytics', {
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) throw error;

      // Cache the results
      cacheManager.set(cacheKey, data, {
        ttl: 30 * 60 * 1000, // 30 minutes
        tags: ['analytics', 'system'],
      });

      return data;

    } catch (error) {
      console.error('Failed to get system analytics:', error);
      throw error;
    }
  }

  // Batch operations with transaction support
  async batchEnrollStudents(courseId: string, studentIds: string[], enrolledBy: string): Promise<any> {
    try {
      const { data, error } = await this.client.rpc('batch_enroll_students', {
        p_course_id: courseId,
        p_student_ids: studentIds,
        p_enrolled_by: enrolledBy,
      });

      if (error) throw error;

      // Invalidate relevant caches
      cacheManager.invalidateByTags(['enrollments', `course_${courseId}`]);

      // Send notifications to enrolled students
      const successfulEnrollments = data.filter((result: any) => result.success);
      for (const enrollment of successfulEnrollments) {
        await NotificationUtils.sendSystemAnnouncement(
          [enrollment.student_id],
          'Course Enrollment',
          'You have been enrolled in a new course.'
        );
      }

      return data;

    } catch (error) {
      console.error('Failed to batch enroll students:', error);
      throw error;
    }
  }

  // Health check for all systems
  async healthCheck(): Promise<any> {
    const health = {
      database: false,
      cache: false,
      realtime: false,
      functions: false,
      timestamp: new Date().toISOString(),
      errors: [] as string[],
    };

    try {
      // Test database connection
      const { error: dbError } = await this.client
        .from('users')
        .select('count')
        .limit(1);
      
      health.database = !dbError;
      if (dbError) health.errors.push(`Database: ${dbError.message}`);

    } catch (error) {
      health.database = false;
      health.errors.push(`Database: ${error}`);
    }

    try {
      // Test cache
      cacheManager.set('health_check', 'ok');
      const cacheTest = cacheManager.get('health_check');
      health.cache = cacheTest === 'ok';
      if (!health.cache) health.errors.push('Cache: Failed to read/write');

    } catch (error) {
      health.cache = false;
      health.errors.push(`Cache: ${error}`);
    }

    try {
      // Test RPC functions
      const { error: funcError } = await this.client.rpc('get_system_analytics');
      health.functions = !funcError;
      if (funcError) health.errors.push(`Functions: ${funcError.message}`);

    } catch (error) {
      health.functions = false;
      health.errors.push(`Functions: ${error}`);
    }

    return health;
  }
}

// Export singleton instance
export const academicIntegration = new AcademicSystemIntegration();

export default academicIntegration;
