import { optimizedSupabase } from './performance';
import { AcademicCache } from './cache';

// Database optimization utilities
export class DatabaseOptimizer {
  private client = optimizedSupabase.getClient();

  // Create optimized indexes for common queries
  async createOptimizedIndexes(): Promise<void> {
    const indexes = [
      // User indexes
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
      'CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)',
      
      // Attendance indexes
      'CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, created_at)',
      'CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status)',
      'CREATE INDEX IF NOT EXISTS idx_attendance_composite ON attendance(user_id, session_id, created_at)',
      
      // Session indexes
      'CREATE INDEX IF NOT EXISTS idx_sessions_course ON sessions(course_id)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_faculty ON sessions(faculty_id)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(scheduled_date)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active)',
      
      // Course indexes
      'CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code)',
      'CREATE INDEX IF NOT EXISTS idx_courses_semester ON courses(semester)',
      'CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active)',
      
      // Notification indexes
      'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(created_at)',
      
      // Enrollment indexes
      'CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id)',
      'CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id)',
      'CREATE INDEX IF NOT EXISTS idx_enrollments_active ON enrollments(is_active)',
      
      // Audit log indexes
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name)',
    ];

    for (const indexQuery of indexes) {
      try {
        await this.client.rpc('execute_sql', { query: indexQuery });
        console.log('Index created:', indexQuery);
      } catch (error) {
        console.warn('Index creation warning:', error);
      }
    }
  }

  // Analyze and optimize table statistics
  async analyzeTablesStatistics(): Promise<void> {
    const tables = [
      'users', 'attendance', 'sessions', 'courses', 
      'notifications', 'enrollments', 'audit_logs'
    ];

    for (const table of tables) {
      try {
        await this.client.rpc('execute_sql', {
          query: `ANALYZE ${table}`
        });
        console.log('Analyzed table:', table);
      } catch (error) {
        console.warn('Table analysis warning:', error);
      }
    }
  }

  // Get database performance metrics
  async getPerformanceMetrics(): Promise<Record<string, any> | null> {
    try {
      const queries = [
        // Database size
        `SELECT 
          pg_size_pretty(pg_database_size(current_database())) as database_size,
          current_database() as database_name`,
        
        // Table sizes
        `SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
         FROM pg_tables 
         WHERE schemaname = 'public'
         ORDER BY size_bytes DESC`,
        
        // Index usage
        `SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan as index_scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
         FROM pg_stat_user_indexes
         ORDER BY idx_scan DESC`,
        
        // Active connections
        `SELECT 
          count(*) as active_connections,
          state
         FROM pg_stat_activity 
         WHERE state IS NOT NULL
         GROUP BY state`,
        
        // Slow queries (if available)
        `SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
         FROM pg_stat_statements 
         ORDER BY total_time DESC 
         LIMIT 10`
      ];

      const results: Record<string, any> = {};
      
      for (let i = 0; i < queries.length; i++) {
        try {
          const { data } = await this.client.rpc('execute_sql', {
            query: queries[i]
          });
          
          results[`metric_${i}`] = data;
        } catch (error) {
          console.warn(`Metrics query ${i} failed:`, error);
          results[`metric_${i}`] = null;
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return null;
    }
  }

  // Vacuum and reindex tables
  async vacuumAndReindex(): Promise<void> {
    const tables = [
      'users', 'attendance', 'sessions', 'courses', 
      'notifications', 'enrollments', 'audit_logs'
    ];

    for (const table of tables) {
      try {
        // Vacuum table
        await this.client.rpc('execute_sql', {
          query: `VACUUM ANALYZE ${table}`
        });
        
        // Reindex table
        await this.client.rpc('execute_sql', {
          query: `REINDEX TABLE ${table}`
        });
        
        console.log('Vacuumed and reindexed:', table);
      } catch (error) {
        console.warn('Vacuum/reindex warning:', error);
      }
    }
  }

  // Optimize attendance queries
  async optimizeAttendanceQueries(): Promise<void> {
    // Create materialized view for attendance statistics
    const createMaterializedView = `
      CREATE MATERIALIZED VIEW IF NOT EXISTS attendance_stats AS
      SELECT 
        u.id as user_id,
        u.email,
        c.id as course_id,
        c.name as course_name,
        COUNT(a.id) as total_sessions,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
        ROUND(
          COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END) * 100.0 / 
          NULLIF(COUNT(a.id), 0), 2
        ) as attendance_percentage,
        MAX(a.created_at) as last_attendance_date
      FROM users u
      LEFT JOIN enrollments e ON u.id = e.student_id
      LEFT JOIN courses c ON e.course_id = c.id
      LEFT JOIN sessions s ON c.id = s.course_id
      LEFT JOIN attendance a ON u.id = a.user_id AND s.id = a.session_id
      WHERE u.role = 'student' AND e.is_active = true
      GROUP BY u.id, u.email, c.id, c.name
      WITH DATA;
    `;

    try {
      await this.client.rpc('execute_sql', { query: createMaterializedView });
      
      // Create index on materialized view
      await this.client.rpc('execute_sql', {
        query: 'CREATE INDEX IF NOT EXISTS idx_attendance_stats_user ON attendance_stats(user_id)'
      });
      
      console.log('Created attendance statistics materialized view');
    } catch (error) {
      console.warn('Materialized view creation warning:', error);
    }
  }

  // Refresh materialized views
  async refreshMaterializedViews(): Promise<void> {
    const views = ['attendance_stats'];
    
    for (const view of views) {
      try {
        await this.client.rpc('execute_sql', {
          query: `REFRESH MATERIALIZED VIEW CONCURRENTLY ${view}`
        });
        console.log('Refreshed materialized view:', view);
      } catch (error) {
        console.warn('Materialized view refresh warning:', error);
      }
    }
  }

  // Clean up old data
  async cleanupOldData(daysToKeep: number = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const cleanupQueries = [
      // Clean old audit logs
      `DELETE FROM audit_logs WHERE created_at < '${cutoffDate.toISOString()}'`,
      
      // Clean old notifications that are read
      `DELETE FROM notifications 
       WHERE is_read = true AND created_at < '${cutoffDate.toISOString()}'`,
      
      // Clean expired sessions
      `UPDATE sessions SET is_active = false 
       WHERE scheduled_date < '${cutoffDate.toISOString()}' AND is_active = true`,
    ];

    for (const query of cleanupQueries) {
      try {
        const { count } = await this.client.rpc('execute_sql', { query });
        console.log(`Cleanup query executed, affected rows: ${count}`);
      } catch (error) {
        console.warn('Cleanup query warning:', error);
      }
    }
  }

  // Setup database triggers for cache invalidation
  async setupCacheInvalidationTriggers(): Promise<void> {
    const triggerFunction = `
      CREATE OR REPLACE FUNCTION invalidate_cache_trigger()
      RETURNS trigger AS $$
      BEGIN
        -- This would call a webhook to invalidate cache
        -- In a real implementation, you'd call your cache invalidation endpoint
        PERFORM pg_notify('cache_invalidation', 
          json_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'id', CASE 
              WHEN TG_OP = 'DELETE' THEN OLD.id 
              ELSE NEW.id 
            END
          )::text
        );
        
        RETURN CASE 
          WHEN TG_OP = 'DELETE' THEN OLD 
          ELSE NEW 
        END;
      END;
      $$ LANGUAGE plpgsql;
    `;

    const triggers = [
      'CREATE TRIGGER users_cache_invalidation AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION invalidate_cache_trigger()',
      'CREATE TRIGGER attendance_cache_invalidation AFTER INSERT OR UPDATE OR DELETE ON attendance FOR EACH ROW EXECUTE FUNCTION invalidate_cache_trigger()',
      'CREATE TRIGGER sessions_cache_invalidation AFTER INSERT OR UPDATE OR DELETE ON sessions FOR EACH ROW EXECUTE FUNCTION invalidate_cache_trigger()',
      'CREATE TRIGGER courses_cache_invalidation AFTER INSERT OR UPDATE OR DELETE ON courses FOR EACH ROW EXECUTE FUNCTION invalidate_cache_trigger()',
    ];

    try {
      // Create trigger function
      await this.client.rpc('execute_sql', { query: triggerFunction });
      
      // Create triggers
      for (const trigger of triggers) {
        try {
          await this.client.rpc('execute_sql', { query: trigger });
        } catch (error) {
          console.warn('Trigger creation warning:', error);
        }
      }
      
      console.log('Cache invalidation triggers setup complete');
    } catch (error) {
      console.warn('Trigger function creation warning:', error);
    }
  }

  // Listen to database changes for real-time cache invalidation
  async setupRealTimeCacheInvalidation(): Promise<void> {
    this.client
      .channel('cache_invalidation')
      .on('postgres_changes', 
        { event: '*', schema: 'public' }, 
        (payload: any) => {
          console.log('Database change detected:', payload);
          
          const { table, eventType, new: newRecord, old: oldRecord } = payload;
          
          // Invalidate relevant cache entries
          switch (table) {
            case 'users':
              const userId = (newRecord as any)?.id || (oldRecord as any)?.id;
              if (userId) {
                AcademicCache.user.invalidate(userId);
                AcademicCache.attendance.invalidate(userId);
              }
              break;
              
            case 'attendance':
              const attendanceUserId = (newRecord as any)?.user_id || (oldRecord as any)?.user_id;
              if (attendanceUserId) {
                AcademicCache.attendance.invalidate(attendanceUserId);
                AcademicCache.analytics.invalidate('attendance');
              }
              break;
              
            case 'sessions':
              const sessionId = (newRecord as any)?.id || (oldRecord as any)?.id;
              if (sessionId) {
                AcademicCache.session.invalidate(sessionId);
                AcademicCache.timetable.invalidate();
              }
              break;
              
            case 'courses':
              const courseId = (newRecord as any)?.id || (oldRecord as any)?.id;
              if (courseId) {
                AcademicCache.timetable.invalidate(courseId);
                AcademicCache.analytics.invalidate('courses');
              }
              break;
          }
        }
      )
      .subscribe();
  }

  // Run full optimization
  async runFullOptimization(): Promise<{ success: boolean; results: any }> {
    try {
      console.log('Starting full database optimization...');
      
      const results = {
        indexesCreated: false,
        statisticsAnalyzed: false,
        materializedViewsCreated: false,
        vacuumCompleted: false,
        triggersSetup: false,
        performanceMetrics: null as any,
      };

      // Create indexes
      await this.createOptimizedIndexes();
      results.indexesCreated = true;

      // Analyze statistics
      await this.analyzeTablesStatistics();
      results.statisticsAnalyzed = true;

      // Create materialized views
      await this.optimizeAttendanceQueries();
      results.materializedViewsCreated = true;

      // Vacuum and reindex
      await this.vacuumAndReindex();
      results.vacuumCompleted = true;

      // Setup triggers
      await this.setupCacheInvalidationTriggers();
      results.triggersSetup = true;

      // Get performance metrics
      results.performanceMetrics = await this.getPerformanceMetrics();

      // Setup real-time cache invalidation
      await this.setupRealTimeCacheInvalidation();

      console.log('Database optimization completed successfully');
      
      return { success: true, results };
    } catch (error) {
      console.error('Database optimization failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, results: { error: errorMessage } };
    }
  }
}

// Export singleton instance
export const dbOptimizer = new DatabaseOptimizer();

// Utility functions for common optimizations
export const DatabaseUtils = {
  // Get attendance with caching
  getAttendanceWithCache: async (userId: string, courseId?: string) => {
    const cacheKey = courseId ? `${userId}_${courseId}` : userId;
    
    let attendance = AcademicCache.attendance.get(cacheKey);
    
    if (!attendance) {
      let query = optimizedSupabase
        .getClient()
        .from('attendance_stats')
        .select('*')
        .eq('user_id', userId);
      
      if (courseId) {
        query = query.eq('course_id', courseId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      attendance = data;
      AcademicCache.attendance.set(cacheKey, attendance);
    }
    
    return attendance;
  },

  // Get user data with caching
  getUserWithCache: async (userId: string) => {
    let user = AcademicCache.user.get(userId);
    
    if (!user) {
      const { data, error } = await optimizedSupabase
        .getClient()
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      user = data;
      AcademicCache.user.set(userId, user);
    }
    
    return user;
  },

  // Batch update with transaction
  batchUpdateWithTransaction: async (updates: Array<{
    table: string;
    data: any;
    match: any;
  }>) => {
    const client = optimizedSupabase.getClient();
    
    // Use RPC for transaction
    const { data, error } = await client.rpc('batch_update', {
      updates: JSON.stringify(updates)
    });
    
    if (error) throw error;
    
    // Invalidate relevant cache entries
    for (const update of updates) {
      AcademicCache.invalidateAll(); // Or more specific invalidation
    }
    
    return data;
  },
};

export default dbOptimizer;
