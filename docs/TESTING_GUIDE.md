# Comprehensive Testing Guide

## Overview

This guide covers all aspects of testing for the Academic Management System, including unit tests, integration tests, end-to-end tests, performance tests, and security tests.

## Testing Strategy

### 1. Test Pyramid

```
    /\
   /  \
  / E2E \     ← Few, High-level, Slow
 /______\
/        \
| Integration |  ← Some, Mid-level, Medium
|____________|
|            |
|    Unit    |   ← Many, Low-level, Fast
|____________|
```

### 2. Test Coverage Goals

- **Unit Tests:** 80%+ coverage
- **Integration Tests:** 70%+ coverage for critical paths
- **E2E Tests:** 90%+ coverage for user journeys
- **API Tests:** 100% coverage for all endpoints

## Unit Testing

### 1. Component Testing Setup

#### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'pages/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/*.stories.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}
```

#### Component Test Examples
```typescript
// tests/components/StudentDashboard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudentDashboard } from '@/components/StudentDashboard'
import { createMockUser } from '../utils/test-helpers'

describe('StudentDashboard', () => {
  const mockStudent = createMockUser('student')

  beforeEach(() => {
    render(<StudentDashboard user={mockStudent} />)
  })

  it('displays student information correctly', () => {
    expect(screen.getByText(mockStudent.full_name)).toBeInTheDocument()
    expect(screen.getByText('Student Dashboard')).toBeInTheDocument()
  })

  it('shows attendance statistics', async () => {
    await waitFor(() => {
      expect(screen.getByTestId('attendance-percentage')).toBeInTheDocument()
    })

    const attendanceCard = screen.getByTestId('attendance-card')
    expect(attendanceCard).toHaveTextContent('85.5%')
  })

  it('handles QR scanner opening', async () => {
    const user = userEvent.setup()
    const scanButton = screen.getByRole('button', { name: /scan qr/i })
    
    await user.click(scanButton)
    
    expect(screen.getByTestId('qr-scanner-modal')).toBeInTheDocument()
  })

  it('displays recent attendance records', async () => {
    await waitFor(() => {
      expect(screen.getByTestId('recent-attendance')).toBeInTheDocument()
    })

    const attendanceItems = screen.getAllByTestId('attendance-item')
    expect(attendanceItems).toHaveLength(5)
  })
})
```

### 2. Hook Testing

```typescript
// tests/hooks/useAttendance.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useAttendance } from '@/hooks/useAttendance'
import { createWrapper } from '../utils/test-wrapper'

describe('useAttendance', () => {
  it('fetches attendance data correctly', async () => {
    const { result } = renderHook(() => useAttendance('student-123'), {
      wrapper: createWrapper(),
    })

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.attendance).toHaveLength(10)
    expect(result.current.percentage).toBe(85.5)
  })

  it('handles error states properly', async () => {
    // Mock API error
    jest.spyOn(console, 'error').mockImplementation(() => {})
    
    const { result } = renderHook(() => useAttendance('invalid-id'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })

    expect(result.current.attendance).toBeNull()
  })
})
```

### 3. Utility Function Testing

```typescript
// tests/lib/attendance-utils.test.ts
import {
  calculateAttendancePercentage,
  getAttendanceStatus,
  formatAttendanceData
} from '@/lib/attendance-utils'

describe('attendance-utils', () => {
  describe('calculateAttendancePercentage', () => {
    it('calculates percentage correctly', () => {
      expect(calculateAttendancePercentage(18, 20)).toBe(90)
      expect(calculateAttendancePercentage(0, 0)).toBe(0)
      expect(calculateAttendancePercentage(5, 10)).toBe(50)
    })

    it('handles edge cases', () => {
      expect(calculateAttendancePercentage(0, 0)).toBe(0)
      expect(calculateAttendancePercentage(10, 0)).toBe(0)
    })
  })

  describe('getAttendanceStatus', () => {
    it('returns correct status based on percentage', () => {
      expect(getAttendanceStatus(95)).toBe('excellent')
      expect(getAttendanceStatus(85)).toBe('good')
      expect(getAttendanceStatus(70)).toBe('warning')
      expect(getAttendanceStatus(45)).toBe('critical')
    })
  })
})
```

## Integration Testing

### 1. API Integration Tests

```typescript
// tests/integration/attendance-api.test.ts
import { createTestClient } from '@supabase/supabase-js'
import { testDb } from '../utils/test-database'

describe('Attendance API Integration', () => {
  let supabase: any
  let testUser: any
  let testSession: any

  beforeAll(async () => {
    supabase = createTestClient()
    testUser = await testDb.createUser({
      email: 'test@student.com',
      role: 'student'
    })
    testSession = await testDb.createSession({
      faculty_id: 'faculty-123',
      class_id: 'CS101'
    })
  })

  afterAll(async () => {
    await testDb.cleanup()
  })

  describe('QR Generation', () => {
    it('generates QR code for valid session', async () => {
      const { data, error } = await supabase.functions.invoke('generate-qr', {
        body: {
          session_id: testSession.id,
          faculty_id: testSession.faculty_id,
          class_id: testSession.class_id
        },
        headers: {
          Authorization: `Bearer ${testUser.jwt}`
        }
      })

      expect(error).toBeNull()
      expect(data.success).toBe(true)
      expect(data.data.qr_code).toMatch(/^data:image\/png;base64,/)
    })

    it('rejects unauthorized requests', async () => {
      const { error } = await supabase.functions.invoke('generate-qr', {
        body: { session_id: testSession.id }
        // No authorization header
      })

      expect(error).toBeTruthy()
      expect(error.message).toContain('Unauthorized')
    })
  })

  describe('Attendance Validation', () => {
    it('validates attendance successfully', async () => {
      // First generate a QR code
      const qrResponse = await supabase.functions.invoke('generate-qr', {
        body: { session_id: testSession.id },
        headers: { Authorization: `Bearer ${testUser.jwt}` }
      })

      // Then validate attendance
      const { data, error } = await supabase.functions.invoke('validate-attendance', {
        body: {
          qr_data: qrResponse.data.qr_code,
          student_id: testUser.id
        },
        headers: { Authorization: `Bearer ${testUser.jwt}` }
      })

      expect(error).toBeNull()
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('present')
    })

    it('prevents duplicate attendance marking', async () => {
      // Mark attendance first time
      await supabase.functions.invoke('validate-attendance', {
        body: {
          qr_data: 'test-qr',
          student_id: testUser.id
        },
        headers: { Authorization: `Bearer ${testUser.jwt}` }
      })

      // Try to mark again
      const { error } = await supabase.functions.invoke('validate-attendance', {
        body: {
          qr_data: 'test-qr',
          student_id: testUser.id
        },
        headers: { Authorization: `Bearer ${testUser.jwt}` }
      })

      expect(error).toBeTruthy()
      expect(error.message).toContain('already marked')
    })
  })
})
```

### 2. Database Integration Tests

```typescript
// tests/integration/database.test.ts
import { supabase } from '@/lib/supabase'
import { testDb } from '../utils/test-database'

describe('Database Integration', () => {
  describe('Row Level Security', () => {
    it('prevents students from accessing other student data', async () => {
      const student1 = await testDb.createUser({ role: 'student' })
      const student2 = await testDb.createUser({ role: 'student' })

      // Student1 tries to access Student2's data
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', student2.id)
        .single()

      expect(data).toBeNull()
      expect(error).toBeTruthy()
    })

    it('allows faculty to access their class data', async () => {
      const faculty = await testDb.createUser({ role: 'faculty' })
      const session = await testDb.createSession({ faculty_id: faculty.id })

      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('faculty_id', faculty.id)

      expect(error).toBeNull()
      expect(data).toContainEqual(expect.objectContaining({
        id: session.id
      }))
    })

    it('allows admins to access all data', async () => {
      const admin = await testDb.createUser({ role: 'admin' })

      const { data, error } = await supabase
        .from('profiles')
        .select('*')

      expect(error).toBeNull()
      expect(data.length).toBeGreaterThan(0)
    })
  })

  describe('Triggers and Functions', () => {
    it('auto-creates profile on user signup', async () => {
      const newUser = await supabase.auth.signUp({
        email: 'newuser@test.com',
        password: 'password123',
        options: {
          data: { full_name: 'New User' }
        }
      })

      // Check if profile was created
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', newUser.data.user?.id)
        .single()

      expect(profile).toBeTruthy()
      expect(profile.full_name).toBe('New User')
      expect(profile.role).toBe('student')
    })

    it('updates attendance analytics on record insert', async () => {
      const student = await testDb.createUser({ role: 'student' })
      const session = await testDb.createSession()

      // Insert attendance record
      await supabase
        .from('attendance_records')
        .insert({
          student_id: student.id,
          session_id: session.id,
          status: 'present'
        })

      // Check if analytics were updated
      const { data: analytics } = await supabase
        .from('attendance_analytics')
        .select('*')
        .eq('student_id', student.id)
        .single()

      expect(analytics.attended_classes).toBe(1)
      expect(analytics.total_classes).toBe(1)
    })
  })
})
```

## End-to-End Testing

### 1. Playwright E2E Tests

```typescript
// tests/e2e/student-flow.spec.ts
import { test, expect } from '@playwright/test'
import { testDb } from '../utils/test-database'

test.describe('Student User Flow', () => {
  let testUser: any

  test.beforeEach(async ({ page }) => {
    testUser = await testDb.createUser({
      email: 'student@test.com',
      role: 'student'
    })

    // Login
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', testUser.email)
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('complete attendance marking flow', async ({ page }) => {
    // Navigate to attendance scanner
    await page.click('[data-testid="scan-attendance-button"]')
    await expect(page.locator('[data-testid="qr-scanner"]')).toBeVisible()

    // Mock QR code scan
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('qr-scanned', {
        detail: { qrData: 'mock-qr-data' }
      }))
    })

    // Verify attendance was marked
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Attendance marked successfully')

    // Check updated attendance percentage
    await page.goto('/dashboard')
    const percentage = await page.locator('[data-testid="attendance-percentage"]').textContent()
    expect(percentage).toMatch(/\d+\.\d+%/)
  })

  test('view attendance history', async ({ page }) => {
    // Navigate to attendance history
    await page.click('[data-testid="view-attendance-history"]')
    await expect(page).toHaveURL('/attendance/history')

    // Check history is displayed
    await expect(page.locator('[data-testid="attendance-history-table"]')).toBeVisible()
    
    // Filter by date range
    await page.fill('[data-testid="date-from"]', '2024-01-01')
    await page.fill('[data-testid="date-to"]', '2024-01-31')
    await page.click('[data-testid="filter-button"]')

    // Verify filtered results
    const rows = page.locator('[data-testid="attendance-row"]')
    await expect(rows).toHaveCount.greaterThan(0)
  })

  test('export attendance report', async ({ page }) => {
    await page.goto('/attendance/history')

    // Setup download listener
    const downloadPromise = page.waitForEvent('download')

    // Click export button
    await page.click('[data-testid="export-button"]')

    // Wait for download
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('attendance_report')
    expect(download.suggestedFilename()).toContain('.csv')
  })
})
```

### 2. Faculty E2E Tests

```typescript
// tests/e2e/faculty-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Faculty User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as faculty
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'faculty@test.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')
  })

  test('create attendance session and generate QR', async ({ page }) => {
    // Navigate to session creation
    await page.click('[data-testid="create-session-button"]')

    // Fill session details
    await page.selectOption('[data-testid="class-select"]', 'CS101')
    await page.fill('[data-testid="session-date"]', '2024-01-15')
    await page.fill('[data-testid="start-time"]', '10:00')
    await page.fill('[data-testid="end-time"]', '11:00')

    // Enable geofencing
    await page.check('[data-testid="geofencing-enabled"]')
    await page.fill('[data-testid="geofence-radius"]', '100')

    // Create session
    await page.click('[data-testid="create-session-submit"]')

    // Verify session created
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()

    // Generate QR code
    await page.click('[data-testid="generate-qr-button"]')
    await expect(page.locator('[data-testid="qr-code-display"]')).toBeVisible()

    // Verify QR code properties
    const qrImage = page.locator('[data-testid="qr-code-image"]')
    await expect(qrImage).toHaveAttribute('src', /data:image\/png;base64,/)
  })

  test('monitor live attendance', async ({ page }) => {
    // Navigate to live session
    await page.goto('/faculty/sessions/live')

    // Check live attendance updates
    await expect(page.locator('[data-testid="live-attendance-count"]')).toBeVisible()

    // Simulate student scanning QR (via WebSocket)
    await page.evaluate(() => {
      // Mock WebSocket message
      window.dispatchEvent(new CustomEvent('attendance-update', {
        detail: { 
          student_id: 'student-123',
          status: 'present',
          timestamp: new Date().toISOString()
        }
      }))
    })

    // Verify attendance count updated
    const attendanceCount = await page.locator('[data-testid="present-count"]').textContent()
    expect(parseInt(attendanceCount || '0')).toBeGreaterThan(0)
  })

  test('generate attendance report', async ({ page }) => {
    await page.goto('/faculty/reports')

    // Select report parameters
    await page.selectOption('[data-testid="class-select"]', 'CS101')
    await page.fill('[data-testid="date-from"]', '2024-01-01')
    await page.fill('[data-testid="date-to"]', '2024-01-31')

    // Generate report
    await page.click('[data-testid="generate-report-button"]')

    // Wait for report generation
    await expect(page.locator('[data-testid="report-table"]')).toBeVisible()

    // Verify report data
    const reportRows = page.locator('[data-testid="report-row"]')
    await expect(reportRows).toHaveCount.greaterThan(0)

    // Export report
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="export-report-button"]')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('attendance_report')
  })
})
```

## API Testing

### 1. Postman Collection

```json
{
  "info": {
    "name": "Academic System API Tests",
    "description": "Comprehensive API test suite"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{jwt_token}}",
        "type": "string"
      }
    ]
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"{{test_email}}\",\n  \"password\": \"{{test_password}}\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{base_url}}/auth/v1/token?grant_type=password",
              "host": ["{{base_url}}"],
              "path": ["auth", "v1", "token"],
              "query": [
                {
                  "key": "grant_type",
                  "value": "password"
                }
              ]
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Login successful', function () {",
                  "    pm.response.to.have.status(200);",
                  "    const response = pm.response.json();",
                  "    pm.expect(response.access_token).to.be.a('string');",
                  "    pm.globals.set('jwt_token', response.access_token);",
                  "});"
                ]
              }
            }
          ]
        }
      ]
    },
    {
      "name": "QR Generation",
      "item": [
        {
          "name": "Generate QR Code",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"session_id\": \"{{test_session_id}}\",\n  \"faculty_id\": \"{{test_faculty_id}}\",\n  \"class_id\": \"CS101\",\n  \"expiry_minutes\": 30\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{base_url}}/functions/v1/generate-qr",
              "host": ["{{base_url}}"],
              "path": ["functions", "v1", "generate-qr"]
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('QR generation successful', function () {",
                  "    pm.response.to.have.status(200);",
                  "    const response = pm.response.json();",
                  "    pm.expect(response.success).to.be.true;",
                  "    pm.expect(response.data.qr_code).to.match(/^data:image\\/png;base64,/);",
                  "    pm.globals.set('qr_code', response.data.qr_code);",
                  "});"
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

### 2. Newman API Tests

```bash
# Run API tests
npm run test:api

# Generate test report
newman run tests/api/academic-system.postman_collection.json \
  --environment tests/api/test-environment.json \
  --reporters html,cli \
  --reporter-html-export tests/reports/api-test-report.html
```

## Performance Testing

### 1. Load Testing with Artillery

```yaml
# artillery-config.yml
config:
  target: 'https://your-api.com'
  phases:
    - duration: 30
      arrivalRate: 5
      name: "Warm up"
    - duration: 60
      arrivalRate: 10
      name: "Ramp up load"
    - duration: 120
      arrivalRate: 20
      name: "Sustained load"
  variables:
    studentIds: 
      - "student1"
      - "student2"
      - "student3"

scenarios:
  - name: "Student Login and Dashboard"
    weight: 40
    flow:
      - post:
          url: "/auth/v1/token?grant_type=password"
          json:
            email: "student@test.com"
            password: "password123"
          capture:
            - json: "$.access_token"
              as: "token"
      - get:
          url: "/api/dashboard"
          headers:
            Authorization: "Bearer {{ token }}"

  - name: "QR Code Generation"
    weight: 30
    flow:
      - post:
          url: "/functions/v1/generate-qr"
          headers:
            Authorization: "Bearer {{ jwt_token }}"
          json:
            session_id: "session-{{ $randomUUID() }}"
            faculty_id: "faculty-123"

  - name: "Attendance Validation"
    weight: 30
    flow:
      - post:
          url: "/functions/v1/validate-attendance"
          headers:
            Authorization: "Bearer {{ jwt_token }}"
          json:
            qr_data: "test-qr-data"
            student_id: "{{ studentIds[$randomNumber(0,2)] }}"
```

### 2. Database Performance Tests

```sql
-- Database load test
DO $$
DECLARE
    i INTEGER;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
BEGIN
    start_time := clock_timestamp();
    
    -- Insert test data
    FOR i IN 1..10000 LOOP
        INSERT INTO attendance_records (student_id, session_id, status, marked_at)
        VALUES (
            'student-' || (i % 100),
            'session-' || (i % 50),
            CASE WHEN i % 10 = 0 THEN 'absent' ELSE 'present' END,
            NOW() - (i || ' minutes')::INTERVAL
        );
    END LOOP;
    
    end_time := clock_timestamp();
    
    RAISE NOTICE 'Inserted 10,000 records in %', (end_time - start_time);
    
    -- Test query performance
    start_time := clock_timestamp();
    
    PERFORM COUNT(*) FROM attendance_records
    WHERE student_id = 'student-1'
    AND marked_at >= CURRENT_DATE - INTERVAL '30 days';
    
    end_time := clock_timestamp();
    
    RAISE NOTICE 'Query completed in %', (end_time - start_time);
END $$;
```

## Security Testing

### 1. Authentication Tests

```typescript
// tests/security/auth.test.ts
import { supabase } from '@/lib/supabase'

describe('Authentication Security', () => {
  it('prevents access without valid token', async () => {
    const { error } = await supabase
      .from('profiles')
      .select('*')
    
    expect(error).toBeTruthy()
    expect(error.message).toContain('JWT')
  })

  it('prevents SQL injection in auth endpoints', async () => {
    const maliciousInput = "'; DROP TABLE profiles; --"
    
    const { error } = await supabase.auth.signInWithPassword({
      email: maliciousInput,
      password: 'password'
    })
    
    expect(error).toBeTruthy()
    
    // Verify table still exists
    const { data, error: selectError } = await supabase
      .from('profiles')
      .select('count')
    
    expect(selectError).toBeFalsy()
  })

  it('rate limits login attempts', async () => {
    const attempts = []
    
    // Attempt multiple logins
    for (let i = 0; i < 10; i++) {
      attempts.push(
        supabase.auth.signInWithPassword({
          email: 'invalid@test.com',
          password: 'wrong-password'
        })
      )
    }
    
    const results = await Promise.allSettled(attempts)
    const lastResult = results[results.length - 1]
    
    // Should be rate limited
    expect(lastResult.status).toBe('rejected')
  })
})
```

### 2. Authorization Tests

```typescript
// tests/security/authorization.test.ts
describe('Authorization Security', () => {
  it('prevents students from accessing admin functions', async () => {
    const studentToken = await getStudentToken()
    
    const response = await fetch('/functions/v1/admin-function', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'delete_user' })
    })
    
    expect(response.status).toBe(403)
  })

  it('prevents cross-user data access', async () => {
    const student1Token = await getStudentToken('student1@test.com')
    const student2Id = 'student2-id'
    
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('student_id', student2Id)
    
    expect(data).toHaveLength(0)
    expect(error).toBeTruthy()
  })
})
```

## Test Automation

### 1. GitHub Actions CI/CD

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install
      - run: npm run build
      - run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### 2. Test Data Management

```typescript
// tests/utils/test-database.ts
import { createClient } from '@supabase/supabase-js'

class TestDatabase {
  private supabase = createClient(
    process.env.SUPABASE_TEST_URL!,
    process.env.SUPABASE_TEST_KEY!
  )
  
  private createdUsers: string[] = []
  private createdSessions: string[] = []

  async createUser(userData: Partial<User>) {
    const { data, error } = await this.supabase.auth.admin.createUser({
      email: userData.email || `test-${Date.now()}@test.com`,
      password: 'password123',
      user_metadata: {
        full_name: userData.full_name || 'Test User',
        role: userData.role || 'student'
      }
    })

    if (error) throw error
    
    this.createdUsers.push(data.user.id)
    return data.user
  }

  async createSession(sessionData: Partial<AttendanceSession>) {
    const { data, error } = await this.supabase
      .from('attendance_sessions')
      .insert({
        faculty_id: sessionData.faculty_id || 'faculty-123',
        class_id: sessionData.class_id || 'TEST101',
        date: sessionData.date || new Date().toISOString().split('T')[0],
        start_time: sessionData.start_time || '10:00',
        end_time: sessionData.end_time || '11:00'
      })
      .select()
      .single()

    if (error) throw error
    
    this.createdSessions.push(data.id)
    return data
  }

  async cleanup() {
    // Clean up created test data
    for (const userId of this.createdUsers) {
      await this.supabase.auth.admin.deleteUser(userId)
    }
    
    if (this.createdSessions.length > 0) {
      await this.supabase
        .from('attendance_sessions')
        .delete()
        .in('id', this.createdSessions)
    }
    
    this.createdUsers = []
    this.createdSessions = []
  }
}

export const testDb = new TestDatabase()
```

## Test Reporting

### 1. Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Open coverage report
open coverage/lcov-report/index.html
```

### 2. Test Results Dashboard

```typescript
// scripts/generate-test-report.ts
import fs from 'fs'
import path from 'path'

interface TestResults {
  unit: { passed: number; failed: number; coverage: number }
  integration: { passed: number; failed: number }
  e2e: { passed: number; failed: number }
  performance: { avgResponseTime: number; errorRate: number }
}

export function generateTestReport(results: TestResults) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Report - Academic System</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { display: inline-block; margin: 10px; padding: 15px; border-radius: 5px; }
        .pass { background-color: #d4edda; }
        .fail { background-color: #f8d7da; }
        .warn { background-color: #fff3cd; }
      </style>
    </head>
    <body>
      <h1>Test Report</h1>
      <div class="metric ${results.unit.failed === 0 ? 'pass' : 'fail'}">
        <h3>Unit Tests</h3>
        <p>Passed: ${results.unit.passed}</p>
        <p>Failed: ${results.unit.failed}</p>
        <p>Coverage: ${results.unit.coverage}%</p>
      </div>
      
      <div class="metric ${results.integration.failed === 0 ? 'pass' : 'fail'}">
        <h3>Integration Tests</h3>
        <p>Passed: ${results.integration.passed}</p>
        <p>Failed: ${results.integration.failed}</p>
      </div>
      
      <div class="metric ${results.e2e.failed === 0 ? 'pass' : 'fail'}">
        <h3>E2E Tests</h3>
        <p>Passed: ${results.e2e.passed}</p>
        <p>Failed: ${results.e2e.failed}</p>
      </div>
      
      <div class="metric ${results.performance.errorRate < 1 ? 'pass' : 'warn'}">
        <h3>Performance</h3>
        <p>Avg Response Time: ${results.performance.avgResponseTime}ms</p>
        <p>Error Rate: ${results.performance.errorRate}%</p>
      </div>
    </body>
    </html>
  `
  
  fs.writeFileSync(path.join(process.cwd(), 'test-report.html'), html)
}
```

This comprehensive testing guide covers all aspects of testing for the Academic Management System, ensuring high code quality, reliability, and performance.
