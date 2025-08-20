import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Types
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: number;
  requestId?: string;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface FilterParams {
  [key: string]: any;
}

// In-memory cache (in production, use Redis)
const cache = new Map<string, CacheEntry<any>>();

// Enhanced Supabase client with performance optimizations
export class OptimizedSupabaseClient {
  private client;
  private connectionPool: Map<string, any> = new Map();

  constructor() {
    this.client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        db: {
          schema: 'public',
        },
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      }
    );
  }

  // Get optimized client instance
  getClient() {
    return this.client;
  }

  // Cached query with automatic cache invalidation
  async cachedQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = 5 * 60 * 1000 // 5 minutes default
  ): Promise<T> {
    const cachedEntry = cache.get(key);
    
    if (cachedEntry && Date.now() - cachedEntry.timestamp < cachedEntry.ttl) {
      return cachedEntry.data;
    }

    const data = await queryFn();
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    return data;
  }

  // Bulk operations with batching
  async batchInsert(table: string, records: any[], batchSize: number = 100) {
    const results = [];
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { data, error } = await this.client
        .from(table)
        .insert(batch)
        .select();

      if (error) throw error;
      results.push(...(data || []));
    }

    return results;
  }

  // Optimized pagination with count estimation
  async paginatedQuery(
    table: string,
    {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc',
      ...filters
    }: PaginationParams & FilterParams
  ) {
    const offset = (page - 1) * limit;
    
    let query = this.client
      .from(table)
      .select('*', { count: 'estimated' })
      .range(offset, offset + limit - 1)
      .order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(key, value);
      }
    });

    const { data, error, count } = await query;
    
    if (error) throw error;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page * limit < (count || 0),
        hasPrev: page > 1,
      },
    };
  }

  // Clear cache
  clearCache(pattern?: string) {
    if (pattern) {
      const keys = Array.from(cache.keys()).filter(key => 
        key.includes(pattern)
      );
      keys.forEach(key => cache.delete(key));
    } else {
      cache.clear();
    }
  }
}

// Global instance
export const optimizedSupabase = new OptimizedSupabaseClient();

// API Response helpers
export const createApiResponse = <T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string
): ApiResponse<T> => ({
  success,
  data,
  error,
  message,
  timestamp: Date.now(),
  requestId: Math.random().toString(36).substring(7),
});

export const handleApiError = (error: any): ApiResponse => {
  console.error('API Error:', error);
  
  let message = 'An unexpected error occurred';
  
  if (error.message) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  return createApiResponse(false, undefined, message);
};

// Performance monitoring
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  static startTimer(label: string): () => number {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
      return duration;
    };
  }

  static recordMetric(label: string, value: number) {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    
    const values = this.metrics.get(label)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  static getMetrics(label: string) {
    const values = this.metrics.get(label) || [];
    
    if (values.length === 0) {
      return null;
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return {
      count: values.length,
      average: avg,
      min,
      max,
      latest: values[values.length - 1],
    };
  }

  static getAllMetrics() {
    const result: Record<string, any> = {};
    
    for (const [label] of this.metrics) {
      result[label] = this.getMetrics(label);
    }
    
    return result;
  }
}

// Database connection optimization
const withDatabaseOptimization = (handler: Function) => {
  return async (req: NextRequest) => {
    const stopTimer = PerformanceMonitor.startTimer('database_operation');
    
    try {
      const result = await handler(req);
      return result;
    } catch (error) {
      console.error('Database operation failed:', error);
      throw error;
    } finally {
      stopTimer();
    }
  };
};

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const rateLimit = (
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) => {
  return (req: NextRequest): boolean => {
    const ip = req.headers.get('x-forwarded-for') || 
              req.headers.get('x-real-ip') || 
              'unknown';
    
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const userLimit = rateLimitMap.get(ip);
    
    if (!userLimit || userLimit.resetTime < windowStart) {
      rateLimitMap.set(ip, { count: 1, resetTime: now });
      return true;
    }
    
    if (userLimit.count >= maxRequests) {
      return false;
    }
    
    userLimit.count++;
    return true;
  };
};

// Query optimization utilities
export const optimizeQuery = {
  // Add indexes for common queries
  createIndexes: async () => {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, created_at)',
      'CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_course ON sessions(course_id)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read)',
    ];

    for (const indexQuery of indexes) {
      try {
        await optimizedSupabase.getClient().rpc('execute_sql', {
          query: indexQuery
        });
      } catch (error) {
        console.warn('Index creation failed:', error);
      }
    }
  },

  // Analyze query performance
  explainQuery: async (table: string, query: any) => {
    try {
      const { data } = await optimizedSupabase.getClient()
        .rpc('explain_query', {
          table_name: table,
          query_params: query
        });
      
      return data;
    } catch (error) {
      console.warn('Query analysis failed:', error);
      return null;
    }
  },
};

// Export utilities
export {
  cache,
  PerformanceMonitor as monitor,
  withDatabaseOptimization,
  rateLimit,
};
