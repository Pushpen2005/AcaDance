import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminDashboard from '@/components/AdminDashboard'

// Mock the child components
jest.mock('@/components/AdvancedTimetableGeneration', () => {
  return function MockAdvancedTimetableGeneration() {
    return <div data-testid="advanced-timetable">Advanced Timetable Generation</div>
  }
})

jest.mock('@/components/AdminAuditLogs', () => {
  return function MockAdminAuditLogs() {
    return <div data-testid="audit-logs">Admin Audit Logs</div>
  }
})

jest.mock('@/components/AdminSystemAnalytics', () => {
  return function MockAdminSystemAnalytics() {
    return <div data-testid="system-analytics">Admin System Analytics</div>
  }
})

jest.mock('@/components/AdminGlobalSettings', () => {
  return function MockAdminGlobalSettings() {
    return <div data-testid="global-settings">Admin Global Settings</div>
  }
})

describe('AdminDashboard', () => {
  beforeEach(() => {
    render(<AdminDashboard />)
  })

  it('renders the main dashboard by default', () => {
    expect(screen.getByText('🧑‍💼 Admin Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Manage users, timetables, analytics, and system settings')).toBeInTheDocument()
  })

  it('displays key statistics cards', () => {
    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('Active Faculty')).toBeInTheDocument()
    expect(screen.getByText('Scheduled Classes')).toBeInTheDocument()
    expect(screen.getByText('Room Utilization')).toBeInTheDocument()
  })

  it('shows system management section with admin tools', () => {
    expect(screen.getByText('System Management')).toBeInTheDocument()
    expect(screen.getByText('Access Control')).toBeInTheDocument()
    expect(screen.getByText('System Analytics')).toBeInTheDocument()
    expect(screen.getByText('Audit Logs')).toBeInTheDocument()
    expect(screen.getByText('Global Settings')).toBeInTheDocument()
  })

  it('navigates to audit logs section when clicked', async () => {
    const user = userEvent.setup()
    
    const auditLogsButton = screen.getByRole('button', { name: /audit logs/i })
    await user.click(auditLogsButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('audit-logs')).toBeInTheDocument()
    })
  })

  it('navigates to system analytics section when clicked', async () => {
    const user = userEvent.setup()
    
    const analyticsButton = screen.getByRole('button', { name: /system analytics/i })
    await user.click(analyticsButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('system-analytics')).toBeInTheDocument()
    })
  })

  it('navigates to global settings section when clicked', async () => {
    const user = userEvent.setup()
    
    const settingsButton = screen.getByRole('button', { name: /global settings/i })
    await user.click(settingsButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('global-settings')).toBeInTheDocument()
    })
  })

  it('can return to overview from subsection', async () => {
    const user = userEvent.setup()
    
    // Navigate to a subsection
    const auditLogsButton = screen.getByRole('button', { name: /audit logs/i })
    await user.click(auditLogsButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('audit-logs')).toBeInTheDocument()
    })
    
    // Return to overview
    const backButton = screen.getByRole('button', { name: /back to dashboard/i })
    await user.click(backButton)
    
    await waitFor(() => {
      expect(screen.getByText('🧑‍💼 Admin Dashboard')).toBeInTheDocument()
    })
  })

  it('displays recent alerts section', () => {
    expect(screen.getByText('Recent Alerts & Notifications')).toBeInTheDocument()
    expect(screen.getByText(/room conflict detected/i)).toBeInTheDocument()
    expect(screen.getByText(/timetable export completed/i)).toBeInTheDocument()
  })

  it('shows admin privileges and restrictions', () => {
    expect(screen.getByText('Admin Privileges & Restrictions')).toBeInTheDocument()
    
    // Check for privilege tabs
    const privilegesTab = screen.getByRole('tab', { name: /privileges/i })
    const restrictionsTab = screen.getByRole('tab', { name: /restrictions/i })
    
    expect(privilegesTab).toBeInTheDocument()
    expect(restrictionsTab).toBeInTheDocument()
  })

  it('switches between privileges and restrictions tabs', async () => {
    const user = userEvent.setup()
    
    // Default should show privileges
    expect(screen.getByText('Full timetable generation and management')).toBeInTheDocument()
    
    // Switch to restrictions
    const restrictionsTab = screen.getByRole('tab', { name: /restrictions/i })
    await user.click(restrictionsTab)
    
    await waitFor(() => {
      expect(screen.getByText('Cannot mark attendance for students')).toBeInTheDocument()
    })
  })
})
