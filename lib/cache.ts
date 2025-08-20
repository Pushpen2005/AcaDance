// Advanced caching system for the academic system
import { optimizedSupabase } from './performance';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[]; // Cache tags for invalidation
  serialize?: boolean; // Whether to serialize complex objects
  compress?: boolean; // Whether to compress data
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  tags: string[];
  size: number;
  hits: number;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  oldestEntry: number;
  newestEntry: number;
}

class AdvancedCacheManager {
  private cache = new Map<string, CacheEntry>();
  private totalHits = 0;
  private totalMisses = 0;
  private maxSize = 100 * 1024 * 1024; // 100MB default
  private currentSize = 0;

  constructor(maxSize?: number) {
    if (maxSize) {
      this.maxSize = maxSize;
    }

    // Cleanup expired entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  // Set cache entry with advanced options
  set(key: string, data: any, options: CacheOptions = {}): void {
    const {
      ttl = 5 * 60 * 1000, // 5 minutes default
      tags = [],
      serialize = true,
      compress = false,
    } = options;

    // Serialize data if needed
    let processedData = data;
    if (serialize && typeof data === 'object') {
      processedData = JSON.stringify(data);
    }

    // Compress data if needed (basic implementation)
    if (compress && typeof processedData === 'string') {
      // In production, use a proper compression library
      processedData = this.simpleCompress(processedData);
    }

    const entry: CacheEntry = {
      data: processedData,
      timestamp: Date.now(),
      ttl,
      tags: [...tags],
      size: this.calculateSize(processedData),
      hits: 0,
    };

    // Check if we need to make space
    this.ensureSpace(entry.size);

    // Remove old entry if exists
    this.remove(key);

    // Add new entry
    this.cache.set(key, entry);
    this.currentSize += entry.size;
  }

  // Get cache entry
  get(key: string): any {
    const entry = this.cache.get(key);

    if (!entry) {
      this.totalMisses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.remove(key);
      this.totalMisses++;
      return null;
    }

    // Update hit count
    entry.hits++;
    this.totalHits++;

    // Deserialize if needed
    let data = entry.data;
    if (typeof data === 'string' && data.startsWith('{')) {
      try {
        data = JSON.parse(data);
      } catch (e) {
        // Not JSON, return as is
      }
    }

    return data;
  }

  // Check if key exists and is valid
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.remove(key);
      return false;
    }

    return true;
  }

  // Remove cache entry
  remove(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (entry) {
      this.currentSize -= entry.size;
      this.cache.delete(key);
      return true;
    }
    
    return false;
  }

  // Invalidate by tags
  invalidateByTags(tags: string[]): number {
    let removed = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.remove(key);
        removed++;
      }
    }
    
    return removed;
  }

  // Get cache statistics
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(e => e.timestamp);
    
    return {
      totalEntries: this.cache.size,
      totalSize: this.currentSize,
      hitRate: this.totalHits / (this.totalHits + this.totalMisses) || 0,
      totalHits: this.totalHits,
      totalMisses: this.totalMisses,
      oldestEntry: timestamps.length ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length ? Math.max(...timestamps) : 0,
    };
  }

  // Cleanup expired entries
  cleanup(): number {
    let removed = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.remove(key);
        removed++;
      }
    }
    
    return removed;
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
    this.totalHits = 0;
    this.totalMisses = 0;
  }

  // Ensure we have space for new entry
  private ensureSpace(neededSize: number): void {
    if (this.currentSize + neededSize <= this.maxSize) {
      return;
    }

    // Remove least recently used entries
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    for (const [key] of entries) {
      this.remove(key);
      
      if (this.currentSize + neededSize <= this.maxSize) {
        break;
      }
    }
  }

  // Calculate size of data
  private calculateSize(data: any): number {
    if (typeof data === 'string') {
      return data.length * 2; // Rough estimate for UTF-16
    }
    
    if (typeof data === 'object') {
      return JSON.stringify(data).length * 2;
    }
    
    return 8; // Default for primitives
  }

  // Simple compression (in production, use proper compression)
  private simpleCompress(str: string): string {
    // This is a placeholder - use proper compression in production
    return str;
  }
}

// Global cache instance
export const cacheManager = new AdvancedCacheManager();

// Cache decorators and utilities
export const withCache = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: CacheOptions & {
    keyGenerator?: (...args: Parameters<T>) => string;
  } = {}
): T => {
  const {
    keyGenerator = (...args) => JSON.stringify(args),
    ...cacheOptions
  } = options;

  return (async (...args: Parameters<T>) => {
    const key = `fn_${fn.name}_${keyGenerator(...args)}`;
    
    // Try to get from cache
    const cached = cacheManager.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn(...args);
    cacheManager.set(key, result, cacheOptions);
    
    return result;
  }) as T;
};

// Common cache patterns for academic system
export const AcademicCache = {
  // Cache user data
  user: {
    get: (userId: string) => cacheManager.get(`user_${userId}`),
    set: (userId: string, data: any) => 
      cacheManager.set(`user_${userId}`, data, {
        ttl: 10 * 60 * 1000, // 10 minutes
        tags: ['users', `user_${userId}`],
      }),
    invalidate: (userId: string) => 
      cacheManager.invalidateByTags([`user_${userId}`]),
  },

  // Cache attendance data
  attendance: {
    get: (userId: string, date?: string) => {
      const key = date ? `attendance_${userId}_${date}` : `attendance_${userId}`;
      return cacheManager.get(key);
    },
    set: (userId: string, data: any, date?: string) => {
      const key = date ? `attendance_${userId}_${date}` : `attendance_${userId}`;
      cacheManager.set(key, data, {
        ttl: 2 * 60 * 1000, // 2 minutes for fresh data
        tags: ['attendance', `user_${userId}`],
      });
    },
    invalidate: (userId?: string) => {
      const tags = userId ? [`user_${userId}`, 'attendance'] : ['attendance'];
      cacheManager.invalidateByTags(tags);
    },
  },

  // Cache timetable data
  timetable: {
    get: (courseId: string) => cacheManager.get(`timetable_${courseId}`),
    set: (courseId: string, data: any) =>
      cacheManager.set(`timetable_${courseId}`, data, {
        ttl: 15 * 60 * 1000, // 15 minutes
        tags: ['timetables', `course_${courseId}`],
      }),
    invalidate: (courseId?: string) => {
      const tags = courseId ? [`course_${courseId}`] : ['timetables'];
      cacheManager.invalidateByTags(tags);
    },
  },

  // Cache session data
  session: {
    get: (sessionId: string) => cacheManager.get(`session_${sessionId}`),
    set: (sessionId: string, data: any) =>
      cacheManager.set(`session_${sessionId}`, data, {
        ttl: 5 * 60 * 1000, // 5 minutes
        tags: ['sessions', `session_${sessionId}`],
      }),
    invalidate: (sessionId?: string) => {
      const tags = sessionId ? [`session_${sessionId}`] : ['sessions'];
      cacheManager.invalidateByTags(tags);
    },
  },

  // Cache analytics data
  analytics: {
    get: (type: string, period?: string) => {
      const key = period ? `analytics_${type}_${period}` : `analytics_${type}`;
      return cacheManager.get(key);
    },
    set: (type: string, data: any, period?: string) => {
      const key = period ? `analytics_${type}_${period}` : `analytics_${type}`;
      cacheManager.set(key, data, {
        ttl: 30 * 60 * 1000, // 30 minutes for analytics
        tags: ['analytics', type],
      });
    },
    invalidate: (type?: string) => {
      const tags = type ? [type, 'analytics'] : ['analytics'];
      cacheManager.invalidateByTags(tags);
    },
  },

  // Global invalidation
  invalidateAll: () => cacheManager.clear(),
  
  // Get cache statistics
  getStats: () => cacheManager.getStats(),
};

// Cache middleware for Next.js API routes
export const cacheMiddleware = (options: CacheOptions = {}) => {
  return (handler: Function) => {
    return async (req: any, res: any) => {
      const { method, url } = req;
      
      // Only cache GET requests
      if (method !== 'GET') {
        return handler(req, res);
      }

      const key = `api_${url}`;
      const cached = cacheManager.get(key);
      
      if (cached !== null) {
        return res.status(200).json(cached);
      }

      // Execute handler and cache result
      const result = await handler(req, res);
      
      // If the response is JSON, cache it
      if (res.statusCode === 200) {
        cacheManager.set(key, result, options);
      }

      return result;
    };
  };
};

export default cacheManager;
