import { supabase } from './supabaseClient'

/**
 * Supabase Connection Test Suite
 * This script tests all major Supabase integrations in your academic system
 */

interface TestResult {
  feature: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: any
}

class SupabaseConnectionTester {
  private results: TestResult[] = []

  private addResult(feature: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any) {
    this.results.push({ feature, status, message, details })
  }

  async testDatabaseConnection(): Promise<void> {
    try {
      const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true })
      
      if (error) {
        this.addResult('Database Connection', 'fail', `Connection failed: ${error.message}`)
      } else {
        this.addResult('Database Connection', 'pass', 'Successfully connected to Supabase database')
      }
    } catch (error) {
      this.addResult('Database Connection', 'fail', `Connection error: ${error}`)
    }
  }

  async testAuthentication(): Promise<void> {
    try {
      // Test auth session
      const { data: session, error } = await supabase.auth.getSession()
      
      if (error) {
        this.addResult('Authentication', 'warning', `Auth session error: ${error.message}`)
      } else {
        this.addResult('Authentication', 'pass', 'Auth system is accessible')
      }

      // Test auth methods availability
      const authMethods = ['signUp', 'signInWithPassword', 'signOut', 'getUser']
      const availableMethods = authMethods.filter(method => 
        typeof (supabase.auth as any)[method] === 'function'
      )
      
      this.addResult('Auth Methods', 'pass', `Available auth methods: ${availableMethods.join(', ')}`)
    } catch (error) {
      this.addResult('Authentication', 'fail', `Auth test failed: ${error}`)
    }
  }

  async testDatabaseTables(): Promise<void> {
    const tables = [
      'users',
      'courses', 
      'timetables',
      'enrollments',
      'attendance_sessions',
      'attendance_records',
      'alerts',
      'audit_logs',
      'attendance_statistics',
      'device_registrations'
    ]

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .limit(1)

        if (error) {
          this.addResult(`Table: ${table}`, 'fail', `Table access failed: ${error.message}`)
        } else {
          this.addResult(`Table: ${table}`, 'pass', 'Table accessible')
        }
      } catch (error) {
        this.addResult(`Table: ${table}`, 'fail', `Table test failed: ${error}`)
      }
    }
  }

  async testRealTimeSubscriptions(): Promise<void> {
    try {
      // Test realtime subscription
      const subscription = supabase
        .channel('test-channel')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'attendance_records'
        }, (payload: any) => {
          console.log('Realtime test:', payload)
        })
        .subscribe((status: any) => {
          if (status === 'SUBSCRIBED') {
            this.addResult('Realtime', 'pass', 'Realtime subscriptions working')
          } else {
            this.addResult('Realtime', 'warning', `Realtime status: ${status}`)
          }
        })

      // Clean up subscription after test
      setTimeout(() => {
        subscription.unsubscribe()
      }, 2000)

    } catch (error) {
      this.addResult('Realtime', 'fail', `Realtime test failed: ${error}`)
    }
  }

  async testRPCFunctions(): Promise<void> {
    const functions = [
      'calculate_attendance_percentage',
      'update_attendance_statistics'
    ]

    for (const func of functions) {
      try {
        // Test if RPC function exists (this might fail but helps identify available functions)
        const { data, error } = await supabase.rpc(func, {
          // Add minimal test parameters
          p_student_id: '550e8400-e29b-41d4-a716-446655440001',
          p_course_id: '660e8400-e29b-41d4-a716-446655440001'
        })

        if (error && error.message.includes('function') && error.message.includes('does not exist')) {
          this.addResult(`RPC: ${func}`, 'warning', 'Function not found in database')
        } else if (error) {
          this.addResult(`RPC: ${func}`, 'warning', `Function exists but parameters invalid: ${error.message}`)
        } else {
          this.addResult(`RPC: ${func}`, 'pass', 'Function accessible')
        }
      } catch (error) {
        this.addResult(`RPC: ${func}`, 'fail', `RPC test failed: ${error}`)
      }
    }
  }

  async testEdgeFunctions(): Promise<void> {
    const edgeFunctions = [
      'validate-attendance',
      'calculate-attendance',
      'generate-qr',
      'send-notification',
      'optimize-database'
    ]

    for (const func of edgeFunctions) {
      try {
        const { data, error } = await supabase.functions.invoke(func, {
          body: { test: true }
        })

        if (error) {
          this.addResult(`Edge Function: ${func}`, 'warning', `Function error: ${error.message}`)
        } else {
          this.addResult(`Edge Function: ${func}`, 'pass', 'Function accessible')
        }
      } catch (error) {
        this.addResult(`Edge Function: ${func}`, 'fail', `Edge function test failed: ${error}`)
      }
    }
  }

  async testRowLevelSecurity(): Promise<void> {
    try {
      // Test RLS by trying to access protected tables without auth
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .limit(1)

      if (error && error.message.includes('RLS')) {
        this.addResult('Row Level Security', 'pass', 'RLS is properly configured and blocking unauthorized access')
      } else if (error) {
        this.addResult('Row Level Security', 'warning', `RLS test inconclusive: ${error.message}`)
      } else {
        this.addResult('Row Level Security', 'warning', 'RLS may not be properly configured (got data without auth)')
      }
    } catch (error) {
      this.addResult('Row Level Security', 'fail', `RLS test failed: ${error}`)
    }
  }

  async testAttendanceWorkflow(): Promise<void> {
    try {
      // Test attendance-related operations
      const { data: sessions, error: sessionsError } = await supabase
        .from('attendance_sessions')
        .select('*')
        .limit(1)

      if (sessionsError) {
        this.addResult('Attendance Workflow', 'fail', `Sessions access failed: ${sessionsError.message}`)
        return
      }

      const { data: records, error: recordsError } = await supabase
        .from('attendance_records')
        .select('*')
        .limit(1)

      if (recordsError) {
        this.addResult('Attendance Workflow', 'warning', `Records access limited: ${recordsError.message}`)
      } else {
        this.addResult('Attendance Workflow', 'pass', 'Attendance tables accessible')
      }
    } catch (error) {
      this.addResult('Attendance Workflow', 'fail', `Attendance workflow test failed: ${error}`)
    }
  }

  async testTimetableSystem(): Promise<void> {
    try {
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .limit(1)

      const { data: timetables, error: timetablesError } = await supabase
        .from('timetables')
        .select('*')
        .limit(1)

      if (coursesError && timetablesError) {
        this.addResult('Timetable System', 'fail', 'Both courses and timetables tables inaccessible')
      } else if (coursesError || timetablesError) {
        this.addResult('Timetable System', 'warning', 'Some timetable tables have access restrictions')
      } else {
        this.addResult('Timetable System', 'pass', 'Timetable system accessible')
      }
    } catch (error) {
      this.addResult('Timetable System', 'fail', `Timetable test failed: ${error}`)
    }
  }

  async runAllTests(): Promise<TestResult[]> {
    console.log('🔍 Starting Supabase Connection Tests...')
    
    await this.testDatabaseConnection()
    await this.testAuthentication()
    await this.testDatabaseTables()
    await this.testRealTimeSubscriptions()
    await this.testRPCFunctions()
    await this.testEdgeFunctions()
    await this.testRowLevelSecurity()
    await this.testAttendanceWorkflow()
    await this.testTimetableSystem()

    return this.results
  }

  generateReport(): string {
    const passCount = this.results.filter(r => r.status === 'pass').length
    const failCount = this.results.filter(r => r.status === 'fail').length
    const warningCount = this.results.filter(r => r.status === 'warning').length

    let report = `
🔍 SUPABASE CONNECTION TEST REPORT
=====================================

📊 Summary:
✅ Passed: ${passCount}
⚠️  Warnings: ${warningCount}  
❌ Failed: ${failCount}
Total Tests: ${this.results.length}

📋 Detailed Results:
`

    this.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'
      report += `${icon} ${result.feature}: ${result.message}\n`
    })

    report += `
🎯 RECOMMENDATIONS:

${failCount > 0 ? `❗ Critical Issues (${failCount} failed):
- Check your .env.local file for correct Supabase credentials
- Verify your Supabase project is active and accessible
- Ensure database schema has been applied
` : ''}

${warningCount > 0 ? `⚠️  Warning Issues (${warningCount} warnings):
- Some features may have restricted access (normal with RLS)
- Edge functions may need deployment
- Test with authenticated user for full access
` : ''}

${passCount === this.results.length ? `🎉 All tests passed! Your Supabase integration is working correctly.` : ''}

🔧 Next Steps:
1. Fix any failed connections
2. Deploy missing edge functions if needed
3. Test with actual user authentication
4. Monitor Supabase dashboard for real usage
`

    return report
  }
}

// Export for use in Next.js pages or components
export { SupabaseConnectionTester }

// For direct testing (if running in Node.js environment)
if (typeof window === 'undefined') {
  const tester = new SupabaseConnectionTester()
  tester.runAllTests().then(() => {
    console.log(tester.generateReport())
  })
}
