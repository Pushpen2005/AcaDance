"use client"

import React, { useEffect, useCallback } from 'react'
import { identifyUser, trackEvents, reportError, trackAcademicEvent } from '@/lib/highlight'

export function useHighlight() {
  // User identification
  const identify = useCallback((userId: string, userDetails: any) => {
    try {
      identifyUser(userId, userDetails)
    } catch (error) {
      console.warn('Failed to identify user in Highlight.io:', error)
    }
  }, [])

  // Error reporting
  const reportErrorToHighlight = useCallback((error: Error, context?: any) => {
    try {
      reportError(error, context)
    } catch (err) {
      console.warn('Failed to report error to Highlight.io:', err)
    }
  }, [])

  // Custom event tracking
  const track = useCallback((eventName: string, properties?: any) => {
    try {
      trackAcademicEvent(eventName, properties)
    } catch (error) {
      console.warn('Failed to track event in Highlight.io:', error)
    }
  }, [])

  // Academic-specific tracking methods
  const trackAcademic = {
    login: useCallback((userId: string, role: string) => {
      try {
        trackEvents.login(userId, role)
      } catch (error) {
        console.warn('Failed to track login:', error)
      }
    }, []),
    
    logout: useCallback((userId: string) => {
      try {
        trackEvents.logout(userId)
      } catch (error) {
        console.warn('Failed to track logout:', error)
      }
    }, []),
    
    attendanceMarked: useCallback((sessionId: string, studentId: string, method: string) => {
      try {
        trackEvents.attendanceMarked(sessionId, studentId, method)
      } catch (error) {
        console.warn('Failed to track attendance:', error)
      }
    }, []),
    
    timetableGenerated: useCallback((groupId: string, teacherId: string) => {
      try {
        trackEvents.timetableGenerated(groupId, teacherId)
      } catch (error) {
        console.warn('Failed to track timetable generation:', error)
      }
    }, []),
    
    sessionCreated: useCallback((sessionId: string, subjectId: string, teacherId: string) => {
      try {
        trackEvents.sessionCreated(sessionId, subjectId, teacherId)
      } catch (error) {
        console.warn('Failed to track session creation:', error)
      }
    }, []),
    
    qrCodeScanned: useCallback((sessionId: string, studentId: string) => {
      try {
        trackEvents.qrCodeScanned(sessionId, studentId)
      } catch (error) {
        console.warn('Failed to track QR scan:', error)
      }
    }, []),
    
    reportGenerated: useCallback((reportType: string, userId: string, filters: any) => {
      try {
        trackEvents.reportGenerated(reportType, userId, filters)
      } catch (error) {
        console.warn('Failed to track report generation:', error)
      }
    }, []),
    
    dashboardViewed: useCallback((userId: string, role: string, section: string) => {
      try {
        trackEvents.dashboardViewed(userId, role, section)
      } catch (error) {
        console.warn('Failed to track dashboard view:', error)
      }
    }, []),
    
    settingsChanged: useCallback((userId: string, setting: string, value: any) => {
      try {
        trackEvents.settingsChanged(userId, setting, value)
      } catch (error) {
        console.warn('Failed to track settings change:', error)
      }
    }, [])
  }

  // Performance tracking
  const trackPerformance = useCallback((metric: string, value: number, page: string) => {
    try {
      trackEvents.performanceIssue(metric, value, page)
    } catch (error) {
      console.warn('Failed to track performance:', error)
    }
  }, [])

  return {
    identify,
    track,
    trackAcademic,
    trackPerformance,
    reportError: reportErrorToHighlight
  }
}

// Higher-order component for automatic error boundary integration
export function withHighlightErrorBoundary<T extends Record<string, any>>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  const HighlightErrorBoundaryWrapper: React.ComponentType<T> = (props: T) => {
    const { reportError } = useHighlight()
    
    useEffect(() => {
      const handleError = (event: ErrorEvent) => {
        reportError(new Error(event.message), {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          component: Component.name
        })
      }
      
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        reportError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
          component: Component.name,
          type: 'promise_rejection'
        })
      }
      
      window.addEventListener('error', handleError)
      window.addEventListener('unhandledrejection', handleUnhandledRejection)
      
      return () => {
        window.removeEventListener('error', handleError)
        window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      }
    }, [reportError])
    
    return React.createElement(Component, props)
  }
  
  return HighlightErrorBoundaryWrapper
}

export default useHighlight
