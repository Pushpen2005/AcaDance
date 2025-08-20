import { H } from '@highlight-run/next/client'

export const HIGHLIGHT_PROJECT_ID = process.env.NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID || 'demo'

// Initialize Highlight.io
export const initHighlight = () => {
  H.init(HIGHLIGHT_PROJECT_ID, {
    environment: process.env.NODE_ENV,
    enableCanvasRecording: false,
    enablePerformanceRecording: true,
    serviceName: 'academic-system',
    tracingOrigins: true,
    networkRecording: {
      enabled: true,
      recordHeadersAndBody: true,
      urlBlocklist: [
        // Block sensitive URLs from being recorded
        'https://api.stripe.com',
        'https://api.paypal.com'
      ]
    },
    backendUrl: process.env.NEXT_PUBLIC_HIGHLIGHT_BACKEND_URL,
    debug: process.env.NODE_ENV === 'development'
  })
}

// Error identification and user tracking
export const identifyUser = (userId: string, userDetails: any) => {
  H.identify(userId, {
    id: userId,
    email: userDetails.email,
    name: userDetails.full_name,
    role: userDetails.role,
    department: userDetails.department,
    // Add academic-specific metadata
    institution: 'Academic System',
    userType: userDetails.role || 'student',
    lastLogin: new Date().toISOString()
  })
}

// Track custom events for academic actions
export const trackAcademicEvent = (eventName: string, properties: any = {}) => {
  H.track(eventName, {
    ...properties,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    service: 'academic-system'
  })
}

// Academic-specific event tracking
export const trackEvents = {
  // Authentication events
  login: (userId: string, role: string) => 
    trackAcademicEvent('User Login', { userId, role }),
  
  logout: (userId: string) => 
    trackAcademicEvent('User Logout', { userId }),
  
  // Academic events
  attendanceMarked: (sessionId: string, studentId: string, method: string) =>
    trackAcademicEvent('Attendance Marked', { sessionId, studentId, method }),
  
  timetableGenerated: (groupId: string, teacherId: string) =>
    trackAcademicEvent('Timetable Generated', { groupId, teacherId }),
  
  sessionCreated: (sessionId: string, subjectId: string, teacherId: string) =>
    trackAcademicEvent('Session Created', { sessionId, subjectId, teacherId }),
  
  qrCodeScanned: (sessionId: string, studentId: string) =>
    trackAcademicEvent('QR Code Scanned', { sessionId, studentId }),
  
  reportGenerated: (reportType: string, userId: string, filters: any) =>
    trackAcademicEvent('Report Generated', { reportType, userId, filters }),
  
  // System events
  systemError: (error: string, component: string, userId?: string) =>
    trackAcademicEvent('System Error', { error, component, userId }),
  
  performanceIssue: (metric: string, value: number, page: string) =>
    trackAcademicEvent('Performance Issue', { metric, value, page }),
  
  // User interaction events
  dashboardViewed: (userId: string, role: string, section: string) =>
    trackAcademicEvent('Dashboard Viewed', { userId, role, section }),
  
  settingsChanged: (userId: string, setting: string, value: any) =>
    trackAcademicEvent('Settings Changed', { userId, setting, value }),
  
  notificationSent: (type: string, recipientId: string, content: string) =>
    trackAcademicEvent('Notification Sent', { type, recipientId, content })
}

// Error handling and reporting
export const reportError = (error: Error, context: any = {}) => {
  H.consumeError(error, {
    ...context,
    timestamp: new Date().toISOString(),
    service: 'academic-system',
    environment: process.env.NODE_ENV
  })
}

// Performance monitoring
export const startTrace = (name: string) => {
  // Return a simple trace object for compatibility
  return {
    name,
    startTime: Date.now(),
    setAttributes: (attrs: any) => {},
    end: () => {}
  }
}

export const endTrace = (span: any, attributes: any = {}) => {
  if (span) {
    span.setAttributes(attributes)
    span.end()
  }
}

// Session management
export const startSession = () => {
  H.start()
}

export const stopSession = () => {
  H.stop()
}

export default H
