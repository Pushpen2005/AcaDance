import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OptimizationRequest {
  operation: 'analyze' | 'optimize' | 'vacuum' | 'reindex';
  tables?: string[];
  force?: boolean;
}

interface PerformanceMetrics {
  table_name: string;
  total_size: string;
  index_size: string;
  row_count: number;
  last_vacuum: string | null;
  last_analyze: string | null;
  seq_scan: number;
  seq_tup_read: number;
  idx_scan: number;
  idx_tup_fetch: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify admin access
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { operation, tables, force }: OptimizationRequest = await req.json()

    let result: any = {}

    switch (operation) {
      case 'analyze':
        result = await analyzeDatabase(supabaseClient, tables)
        break
      case 'optimize':
        result = await optimizeDatabase(supabaseClient, tables, force)
        break
      case 'vacuum':
        result = await vacuumDatabase(supabaseClient, tables)
        break
      case 'reindex':
        result = await reindexDatabase(supabaseClient, tables)
        break
      default:
        throw new Error('Invalid operation')
    }

    // Log the optimization operation
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: `database_${operation}`,
        details: {
          operation,
          tables: tables || 'all',
          force,
          result_summary: result.summary
        },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      })

    return new Response(
      JSON.stringify({
        success: true,
        operation,
        data: result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Database optimization error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Database optimization failed',
        details: (error as Error).message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function analyzeDatabase(supabaseClient: any, tables?: string[]) {
  // Get table statistics
  const tableStatsQuery = `
    SELECT 
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
      pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
      n_tup_ins as inserts,
      n_tup_upd as updates,
      n_tup_del as deletes,
      n_live_tup as live_rows,
      n_dead_tup as dead_rows,
      last_vacuum,
      last_autovacuum,
      last_analyze,
      last_autoanalyze,
      seq_scan,
      seq_tup_read,
      idx_scan,
      idx_tup_fetch
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public'
    ${tables ? `AND tablename = ANY($1)` : ''}
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  `

  const { data: tableStats } = await supabaseClient.rpc('execute_sql', {
    query: tableStatsQuery,
    params: tables ? [tables] : []
  })

  // Get slow queries (if available)
  const slowQueriesQuery = `
    SELECT 
      query,
      calls,
      total_time,
      mean_time,
      rows
    FROM pg_stat_statements 
    WHERE query NOT LIKE '%pg_stat_statements%'
    ORDER BY mean_time DESC 
    LIMIT 10
  `

  const { data: slowQueries } = await supabaseClient.rpc('execute_sql', {
    query: slowQueriesQuery
  })

  // Get index usage statistics
  const indexStatsQuery = `
    SELECT 
      schemaname,
      tablename,
      indexname,
      idx_scan,
      idx_tup_read,
      idx_tup_fetch,
      pg_size_pretty(pg_relation_size(indexname)) as index_size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ${tables ? `AND tablename = ANY($1)` : ''}
    ORDER BY idx_scan DESC
  `

  const { data: indexStats } = await supabaseClient.rpc('execute_sql', {
    query: indexStatsQuery,
    params: tables ? [tables] : []
  })

  // Calculate recommendations
  const recommendations = generateRecommendations(tableStats, indexStats)

  return {
    table_statistics: tableStats,
    slow_queries: slowQueries,
    index_statistics: indexStats,
    recommendations,
    summary: {
      tables_analyzed: tableStats?.length || 0,
      slow_queries_found: slowQueries?.length || 0,
      indexes_analyzed: indexStats?.length || 0,
      recommendations_count: recommendations.length
    }
  }
}

async function optimizeDatabase(supabaseClient: any, tables?: string[], force?: boolean) {
  const optimizations = []
  
  // Get tables that need optimization
  const analysisResult = await analyzeDatabase(supabaseClient, tables)
  
  for (const recommendation of analysisResult.recommendations) {
    if (recommendation.type === 'vacuum' || (force && recommendation.type === 'reindex')) {
      try {
        await supabaseClient.rpc('execute_sql', {
          query: recommendation.sql
        })
        optimizations.push({
          table: recommendation.table,
          operation: recommendation.type,
          status: 'success'
        })
      } catch (error) {
        optimizations.push({
          table: recommendation.table,
          operation: recommendation.type,
          status: 'failed',
          error: (error as Error).message
        })
      }
    }
  }

  return {
    optimizations,
    summary: {
      total_operations: optimizations.length,
      successful: optimizations.filter(op => op.status === 'success').length,
      failed: optimizations.filter(op => op.status === 'failed').length
    }
  }
}

async function vacuumDatabase(supabaseClient: any, tables?: string[]) {
  const results = []
  
  if (tables) {
    for (const table of tables) {
      try {
        await supabaseClient.rpc('execute_sql', {
          query: `VACUUM ANALYZE ${table}`
        })
        results.push({ table, status: 'success' })
      } catch (error) {
        results.push({ 
          table, 
          status: 'failed', 
          error: (error as Error).message 
        })
      }
    }
  } else {
    try {
      await supabaseClient.rpc('execute_sql', {
        query: 'VACUUM ANALYZE'
      })
      results.push({ table: 'all', status: 'success' })
    } catch (error) {
      results.push({ 
        table: 'all', 
        status: 'failed', 
        error: (error as Error).message 
      })
    }
  }

  return {
    vacuum_results: results,
    summary: {
      tables_processed: results.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length
    }
  }
}

async function reindexDatabase(supabaseClient: any, tables?: string[]) {
  const results = []
  
  if (tables) {
    for (const table of tables) {
      try {
        await supabaseClient.rpc('execute_sql', {
          query: `REINDEX TABLE ${table}`
        })
        results.push({ table, status: 'success' })
      } catch (error) {
        results.push({ 
          table, 
          status: 'failed', 
          error: (error as Error).message 
        })
      }
    }
  } else {
    // Get all user tables
    const { data: tables } = await supabaseClient.rpc('execute_sql', {
      query: `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
    })
    
    for (const tableRow of tables || []) {
      try {
        await supabaseClient.rpc('execute_sql', {
          query: `REINDEX TABLE ${tableRow.tablename}`
        })
        results.push({ table: tableRow.tablename, status: 'success' })
      } catch (error) {
        results.push({ 
          table: tableRow.tablename, 
          status: 'failed', 
          error: (error as Error).message 
        })
      }
    }
  }

  return {
    reindex_results: results,
    summary: {
      tables_processed: results.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length
    }
  }
}

function generateRecommendations(tableStats: any[], indexStats: any[]) {
  const recommendations = []

  // Check for tables that need vacuum
  for (const table of tableStats || []) {
    if (table.dead_rows > table.live_rows * 0.1) {
      recommendations.push({
        type: 'vacuum',
        table: table.tablename,
        reason: `High dead row ratio: ${table.dead_rows} dead vs ${table.live_rows} live`,
        sql: `VACUUM ANALYZE ${table.tablename}`,
        priority: table.dead_rows > table.live_rows * 0.2 ? 'high' : 'medium'
      })
    }
  }

  // Check for unused indexes
  for (const index of indexStats || []) {
    if (index.idx_scan === 0 && !index.indexname.includes('pkey')) {
      recommendations.push({
        type: 'drop_index',
        table: index.tablename,
        index: index.indexname,
        reason: 'Index never used',
        sql: `DROP INDEX IF EXISTS ${index.indexname}`,
        priority: 'low'
      })
    }
  }

  // Check for tables with high sequential scan ratio
  for (const table of tableStats || []) {
    const totalScans = (table.seq_scan || 0) + (table.idx_scan || 0)
    if (totalScans > 100 && table.seq_scan / totalScans > 0.8) {
      recommendations.push({
        type: 'add_index',
        table: table.tablename,
        reason: `High sequential scan ratio: ${table.seq_scan} seq vs ${table.idx_scan} index`,
        sql: `-- Analyze query patterns for ${table.tablename} to determine optimal indexes`,
        priority: 'medium'
      })
    }
  }

  return recommendations
}
