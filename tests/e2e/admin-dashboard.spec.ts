import { test, expect } from '@playwright/test'

test.describe('Admin Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin dashboard (assuming authentication is handled)
    await page.goto('/admin')
    
    // Mock admin authentication
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 'admin-123',
        email: 'admin@university.edu',
        role: 'admin',
        full_name: 'System Administrator'
      }))
    })
    
    await page.reload()
  })

  test('should display admin dashboard with key metrics', async ({ page }) => {
    // Check main title
    await expect(page.locator('h1')).toContainText('Admin Dashboard')
    
    // Check statistics cards
    await expect(page.locator('[data-testid="stats-card"]').first()).toBeVisible()
    await expect(page.getByText('Total Users')).toBeVisible()
    await expect(page.getByText('Active Faculty')).toBeVisible()
    await expect(page.getByText('Scheduled Classes')).toBeVisible()
    await expect(page.getByText('Room Utilization')).toBeVisible()
  })

  test('should navigate to audit logs section', async ({ page }) => {
    // Click on Audit Logs button
    await page.getByRole('button', { name: /audit logs/i }).click()
    
    // Verify navigation
    await expect(page.getByText('Audit Logs')).toBeVisible()
    await expect(page.getByText('Monitor system activities and security events')).toBeVisible()
    
    // Check for audit log filters
    await expect(page.getByPlaceholder('Search users, actions, IPs...')).toBeVisible()
    await expect(page.getByText('Risk Level')).toBeVisible()
    
    // Test back navigation
    await page.getByRole('button', { name: /back to dashboard/i }).click()
    await expect(page.locator('h1')).toContainText('Admin Dashboard')
  })

  test('should navigate to system analytics section', async ({ page }) => {
    // Click on System Analytics button
    await page.getByRole('button', { name: /system analytics/i }).click()
    
    // Verify navigation
    await expect(page.getByText('System Analytics')).toBeVisible()
    await expect(page.getByText('Monitor system performance, usage metrics, and health status')).toBeVisible()
    
    // Check for analytics tabs
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Performance' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Usage Stats' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'System Health' })).toBeVisible()
  })

  test('should navigate to global settings section', async ({ page }) => {
    // Click on Global Settings button
    await page.getByRole('button', { name: /global settings/i }).click()
    
    // Verify navigation
    await expect(page.getByText('Global Settings')).toBeVisible()
    await expect(page.getByText('Configure system-wide settings and preferences')).toBeVisible()
    
    // Check for settings tabs
    await expect(page.getByRole('tab', { name: 'General' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Security' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Attendance' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Notifications' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Integrations' })).toBeVisible()
  })

  test('should filter audit logs by search term', async ({ page }) => {
    // Navigate to audit logs
    await page.getByRole('button', { name: /audit logs/i }).click()
    
    // Wait for audit logs to load
    await page.waitForSelector('[data-testid="audit-log-entry"]', { timeout: 5000 })
    
    // Get initial count of log entries
    const initialCount = await page.locator('[data-testid="audit-log-entry"]').count()
    
    // Search for specific user
    await page.getByPlaceholder('Search users, actions, IPs...').fill('John Smith')
    
    // Wait for filter to apply
    await page.waitForTimeout(1000)
    
    // Verify filtered results
    const filteredCount = await page.locator('[data-testid="audit-log-entry"]').count()
    expect(filteredCount).toBeLessThanOrEqual(initialCount)
  })

  test('should switch between analytics tabs', async ({ page }) => {
    // Navigate to system analytics
    await page.getByRole('button', { name: /system analytics/i }).click()
    
    // Start on Overview tab (default)
    await expect(page.getByText('Total Users')).toBeVisible()
    
    // Switch to Performance tab
    await page.getByRole('tab', { name: 'Performance' }).click()
    await expect(page.getByText('Response Time Trends')).toBeVisible()
    
    // Switch to Usage Stats tab
    await page.getByRole('tab', { name: 'Usage Stats' }).click()
    await expect(page.getByText('Student Logins')).toBeVisible()
    
    // Switch to System Health tab
    await page.getByRole('tab', { name: 'System Health' }).click()
    await expect(page.getByText('CPU Usage')).toBeVisible()
  })

  test('should update global settings', async ({ page }) => {
    // Navigate to global settings
    await page.getByRole('button', { name: /global settings/i }).click()
    
    // Update system name
    const systemNameInput = page.getByLabel('System Name')
    await systemNameInput.clear()
    await systemNameInput.fill('Updated Academic System')
    
    // Toggle maintenance mode
    await page.getByLabel('Maintenance Mode').click()
    
    // Check for unsaved changes warning
    await expect(page.getByText('You have unsaved changes')).toBeVisible()
    
    // Save changes
    await page.getByRole('button', { name: /save changes/i }).click()
    
    // Wait for save completion
    await page.waitForSelector('[data-testid="save-success"]', { timeout: 5000 })
  })

  test('should export audit logs', async ({ page }) => {
    // Navigate to audit logs
    await page.getByRole('button', { name: /audit logs/i }).click()
    
    // Wait for logs to load
    await page.waitForSelector('[data-testid="audit-log-entry"]')
    
    // Setup download listener
    const downloadPromise = page.waitForEvent('download')
    
    // Click export button
    await page.getByRole('button', { name: /export/i }).click()
    
    // Wait for download
    const download = await downloadPromise
    
    // Verify download
    expect(download.suggestedFilename()).toContain('audit_logs_')
    expect(download.suggestedFilename()).toContain('.csv')
  })

  test('should display system health status correctly', async ({ page }) => {
    // Navigate to system analytics
    await page.getByRole('button', { name: /system analytics/i }).click()
    
    // Switch to System Health tab
    await page.getByRole('tab', { name: 'System Health' }).click()
    
    // Check health metrics
    await expect(page.getByText('CPU Usage')).toBeVisible()
    await expect(page.getByText('Memory Usage')).toBeVisible()
    await expect(page.getByText('Disk Usage')).toBeVisible()
    await expect(page.getByText('Network Latency')).toBeVisible()
    
    // Check service status
    await expect(page.getByText('Database Health')).toBeVisible()
    await expect(page.getByText('Service Status')).toBeVisible()
    
    // Verify status badges are present
    await expect(page.locator('[data-testid="status-badge"]').first()).toBeVisible()
  })

  test('should handle responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check if dashboard adapts to mobile
    await expect(page.locator('h1')).toContainText('Admin Dashboard')
    
    // Check if cards stack properly
    const statsCards = page.locator('[data-testid="stats-card"]')
    await expect(statsCards.first()).toBeVisible()
    
    // Test navigation on mobile
    await page.getByRole('button', { name: /audit logs/i }).click()
    await expect(page.getByText('Audit Logs')).toBeVisible()
  })
})
